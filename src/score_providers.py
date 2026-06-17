"""
Score providers and export a compact table for the Risk Explorer web app.

Trains the PU-bagging ranker on the provider-grouped train split, scores the
held-out test providers, attaches plain-English peer-deviation reasons (built from
the *_z features), and writes the top-ranked slice plus all known-fraud providers
to data/processed/scored_providers.parquet for the Streamlit app to load.

Usage:
    python src/score_providers.py \
        --in data/processed/provider_year_panel_2019_2023_features.parquet
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from train_model import TARGET, feature_columns, grouped_split
from train_pu import run_bags, _impute

ROOT = Path(__file__).resolve().parents[1]
PROC_DIR = ROOT / "data" / "processed"

# Columns kept for display in the app.
DISPLAY = ["npi", "year", "provider_type", "state", "tot_services", "tot_beneficiaries",
           "tot_submitted_charge", "tot_medicare_payment", "pay_per_bene", "services_per_bene"]

# Friendly phrasing for the peer-deviation z-score features.
Z_PHRASE = {
    "tot_services_z": "total services",
    "tot_beneficiaries_z": "beneficiaries seen",
    "tot_submitted_charge_z": "submitted charges",
    "tot_medicare_allowed_z": "Medicare allowed amount",
    "tot_medicare_payment_z": "total Medicare payment",
    "tot_hcpcs_codes_z": "distinct procedure codes",
    "pay_per_service_z": "payment per service",
    "pay_per_bene_z": "payment per beneficiary",
    "services_per_bene_z": "services per beneficiary",
    "charge_to_payment_z": "charge-to-payment ratio",
    "bene_avg_risk_score_z": "patient risk score",
}


def reasons_for(row: pd.Series, zcols: list[str], topn: int = 3) -> str:
    vals = [(c, row[c]) for c in zcols if pd.notna(row[c])]
    vals.sort(key=lambda kv: kv[1], reverse=True)
    parts = []
    for c, z in vals[:topn]:
        if z <= 0.5:
            break
        parts.append(f"{Z_PHRASE.get(c, c)}: +{z:.1f} SD vs peers")
    return " | ".join(parts) if parts else "no strong peer deviation"


def main() -> int:
    ap = argparse.ArgumentParser(description="Score providers and export app table.")
    ap.add_argument("--in", dest="in_path", required=True)
    ap.add_argument("--top", type=int, default=25000, help="top-ranked rows to keep")
    ap.add_argument("--neg-ratio", type=int, default=10)
    ap.add_argument("--bags", type=int, default=15)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    df = pd.read_parquet(args.in_path)
    feats = feature_columns(df)
    zcols = [c for c in df.columns if c.endswith("_z")]
    train, test = grouped_split(df, 0.25, args.seed)

    pos = train[train[TARGET] == 1]
    unl = train[train[TARGET] == 0]
    med = train[feats].replace([np.inf, -np.inf], np.nan).median()
    Xte = _impute(test[feats], med)
    print(f"scoring {len(test):,} held-out providers with PU bagging ({args.bags} bags)...")
    test = test.copy()
    test["score"] = run_bags(pos, unl, feats, med, Xte, args.bags, args.neg_ratio, args.seed)
    test["pct_rank"] = test["score"].rank(pct=True)

    # keep the top-ranked slice plus all known fraud (so the demo always has positives)
    keep = pd.concat([test.nlargest(args.top, "score"),
                      test[test[TARGET] == 1]]).drop_duplicates(subset=["npi", "year"])
    keep = keep.sort_values("score", ascending=False).reset_index(drop=True)
    keep["rank"] = np.arange(1, len(keep) + 1)
    keep["reasons"] = keep.apply(lambda r: reasons_for(r, zcols), axis=1)
    keep = keep.rename(columns={TARGET: "known_fraud"})

    out_cols = ["rank", "score", "pct_rank", "known_fraud"] + DISPLAY + ["reasons"] + zcols
    out_cols = [c for c in out_cols if c in keep.columns]
    out = keep[out_cols]
    PROC_DIR.mkdir(parents=True, exist_ok=True)
    dest = PROC_DIR / "scored_providers.parquet"
    out.to_parquet(dest, index=False)
    print(f"wrote {len(out):,} rows ({int(out['known_fraud'].sum())} known fraud) -> {dest}")

    # Compact JSON slice for the web app (top of the queue + all visible fraud).
    web = out.head(2000).copy()
    for c in web.select_dtypes(include=[np.floating]).columns:
        web[c] = web[c].round(4)
    web_dir = ROOT / "web" / "public" / "data"
    web_dir.mkdir(parents=True, exist_ok=True)
    (web_dir / "providers.json").write_text(web.to_json(orient="records"))
    print(f"wrote {len(web):,} rows -> {web_dir / 'providers.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
