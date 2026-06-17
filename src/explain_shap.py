"""
Explainability: SHAP "why flagged" reasons (per PROJECT.md, this is non-negotiable).

Reference: Hancock & Khoshgoftaar (2023), Explainable machine learning models for
Medicare fraud detection, Journal of Big Data.

What it does:
  1. Trains an XGBoost ranker on the provider-grouped, undersampled train split.
  2. Uses SHAP TreeExplainer to attribute each prediction to its features.
  3. Reports GLOBAL feature importance (what drives fraud risk overall).
  4. Writes per-provider PLAIN-ENGLISH reasons for the top-ranked providers, the
     real model-based version of the peer-deviation reasons shown in the web app.

Usage:
    python src/explain_shap.py \
        --in data/processed/provider_year_panel_2019_2023_features.parquet
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import shap
import xgboost as xgb

from train_model import TARGET, feature_columns, grouped_split, undersample, MODEL_DIR


def pretty(name: str) -> str:
    base = name
    suffix = ""
    if name.endswith("_z"):
        base, suffix = name[:-2], " (vs peers, SD)"
    elif name.endswith("_pct"):
        base, suffix = name[:-4], " (peer percentile)"
    elif name.endswith("_pmr"):
        base, suffix = name[:-4], " (vs peer median)"
    words = {
        "tot": "total", "hcpcs": "procedure", "cds": "codes", "benes": "beneficiaries",
        "srvcs": "services", "sbmtd": "submitted", "chrg": "charge", "mdcr": "Medicare",
        "alowd": "allowed", "pymt": "payment", "stdzd": "standardized", "bene": "patient",
        "avg": "average", "pay": "payment", "per": "per", "tot_services": "total services",
    }
    label = " ".join(words.get(w, w) for w in base.split("_"))
    return (label + suffix).strip()


def main() -> int:
    ap = argparse.ArgumentParser(description="SHAP global + per-provider explanations.")
    ap.add_argument("--in", dest="in_path", required=True)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--neg-per-pos", type=int, default=20)
    ap.add_argument("--sample", type=int, default=30000, help="rows for SHAP global")
    args = ap.parse_args()
    sys.stdout.reconfigure(line_buffering=True)

    df = pd.read_parquet(args.in_path)
    feats = feature_columns(df)
    train, test = grouped_split(df, 0.25, args.seed)
    train_bal = undersample(train, args.neg_per_pos, args.seed)

    Xtr = train_bal[feats].replace([np.inf, -np.inf], np.nan)
    ytr = train_bal[TARGET]
    Xte = test[feats].replace([np.inf, -np.inf], np.nan)
    print(f"training XGBoost on {len(Xtr):,} balanced rows | {len(feats)} features")
    model = xgb.XGBClassifier(n_estimators=300, max_depth=5, learning_rate=0.08,
                              subsample=0.8, colsample_bytree=0.8, tree_method="hist",
                              eval_metric="aucpr", n_jobs=-1, random_state=args.seed)
    model.fit(Xtr, ytr)

    explainer = shap.TreeExplainer(model)

    # ---- global importance on a sample of the test set ----
    samp = Xte.sample(n=min(args.sample, len(Xte)), random_state=args.seed)
    sv = explainer.shap_values(samp)
    glob = pd.Series(np.abs(sv).mean(axis=0), index=feats).sort_values(ascending=False)
    print("\n=== GLOBAL feature importance (mean |SHAP|) ===")
    for f, v in glob.head(12).items():
        print(f"  {pretty(f):42s} {v:.4f}")

    # ---- per-provider reasons for the top-ranked providers ----
    proba = model.predict_proba(Xte)[:, 1]
    test = test.copy()
    test["score"] = proba
    top = test.nlargest(15, "score")
    sv_top = explainer.shap_values(top[feats])
    base_val = float(np.array(explainer.expected_value).ravel()[0])

    cards = []
    print("\n=== per-provider WHY FLAGGED (top-ranked) ===")
    for i, (_, row) in enumerate(top.iterrows()):
        contrib = pd.Series(sv_top[i], index=feats).sort_values(ascending=False)
        reasons = [f"{pretty(f)}: pushes risk up" for f in contrib.head(3).index if contrib[f] > 0]
        card = {
            "provider_type": row["provider_type"],
            "state": row["state"],
            "score": round(float(row["score"]), 4),
            "known_fraud": int(row[TARGET]),
            "reasons": reasons,
        }
        cards.append(card)
        if i < 5:
            print(f"  {row['provider_type']} ({row['state']}) score={row['score']:.3f}: "
                  + "; ".join(reasons))

    MODEL_DIR.mkdir(exist_ok=True)
    out = {"global_importance": {pretty(f): round(float(v), 5) for f, v in glob.head(15).items()},
           "base_value": base_val, "cards": cards}
    (MODEL_DIR / "shap_explanations.json").write_text(json.dumps(out, indent=2))
    print(f"\nsaved {MODEL_DIR / 'shap_explanations.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
