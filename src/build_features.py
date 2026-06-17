"""
Feature engineering: Layer 2 (peer-relative position).

PROJECT.md calls this "the layer that makes it work". For each provider we already
have absolute behavior (Layer 1, from prepare_data.py). Here we position each
provider against its PEERS - providers of the same specialty in the same year - so
that "bills a lot" becomes "bills 4 standard deviations above comparable providers".

For every base metric we add, within each (provider_type, year) peer group:
  * <metric>_z    : z-score      (x - peer_mean) / peer_std
  * <metric>_pct  : percentile rank in the peer group (0..1)
  * <metric>_pmr  : ratio to the peer median (x / peer_median)

These peer features do double duty: they sharpen the model AND pre-build the
human explanation for the Risk Explorer.

Usage:
    python src/build_features.py \
        --in data/processed/provider_year_panel_2019_2023_clean.parquet
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PROC_DIR = ROOT / "data" / "processed"

# Peer group = same specialty, same year (handles year-over-year drift too).
PEER_KEYS = ["provider_type", "year"]

# Metrics that get peer-normalized (volume, money, intensity, patient mix).
BASE_METRICS = [
    "tot_hcpcs_codes", "tot_beneficiaries", "tot_services",
    "tot_submitted_charge", "tot_medicare_allowed", "tot_medicare_payment",
    "pay_per_service", "pay_per_bene", "services_per_bene", "charge_to_payment",
    "bene_avg_risk_score",
]

# Peer groups smaller than this are too thin to define a stable "normal";
# their peer-relative features are zeroed (provider looks average) rather than
# producing noisy extreme z-scores.
MIN_PEER_GROUP = 30


def add_peer_features(df: pd.DataFrame) -> pd.DataFrame:
    metrics = [m for m in BASE_METRICS if m in df.columns]
    g = df.groupby(PEER_KEYS, observed=True)

    grp_size = g[metrics[0]].transform("size")
    big_enough = grp_size >= MIN_PEER_GROUP

    new_cols = {}
    for m in metrics:
        mean = g[m].transform("mean")
        std = g[m].transform("std").replace(0, np.nan)
        med = g[m].transform("median").replace(0, np.nan)

        z = (df[m] - mean) / std
        pct = g[m].rank(pct=True)
        pmr = df[m] / med

        # Clean up and damp where peer group is too small to trust.
        z = z.replace([np.inf, -np.inf], np.nan).fillna(0.0).where(big_enough, 0.0)
        pmr = pmr.replace([np.inf, -np.inf], np.nan).fillna(1.0).where(big_enough, 1.0)
        pct = pct.fillna(0.5)

        new_cols[f"{m}_z"] = z.astype("float32")
        new_cols[f"{m}_pct"] = pct.astype("float32")
        new_cols[f"{m}_pmr"] = pmr.astype("float32")

    out = pd.concat([df, pd.DataFrame(new_cols, index=df.index)], axis=1)
    out["peer_group_size"] = grp_size.astype("int32")
    return out, list(new_cols)


def build(in_path: Path) -> Path:
    df = pd.read_parquet(in_path)
    print(f"loaded {len(df):,} rows x {df.shape[1]} cols from {in_path.name}")
    print(f"peer groups: {df.groupby(PEER_KEYS, observed=True).ngroups:,} "
          f"(by {' x '.join(PEER_KEYS)})")

    df, new_feats = add_peer_features(df)
    print(f"added {len(new_feats)} peer-relative features (z / pct / pmr per metric)")

    # Quick sanity: are fraud providers more extreme on a key peer feature?
    if "fraud_label" in df.columns and "services_per_bene_z" in df.columns:
        med = df.groupby("fraud_label")["services_per_bene_z"].median()
        print(f"\nmedian services_per_bene_z  -> clean: {med.get(0, float('nan')):.3f} | "
              f"fraud: {med.get(1, float('nan')):.3f}")
        med2 = df.groupby("fraud_label")["tot_medicare_payment_z"].median()
        print(f"median tot_medicare_payment_z -> clean: {med2.get(0, float('nan')):.3f} | "
              f"fraud: {med2.get(1, float('nan')):.3f}")

    out = PROC_DIR / (in_path.stem.replace("_clean", "") + "_features.parquet")
    df.to_parquet(out, index=False)
    print(f"\nWrote {out}  ({out.stat().st_size / 1e6:.1f} MB)  shape={df.shape}")
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Build Layer 2 peer-relative features.")
    parser.add_argument("--in", dest="in_path", required=True)
    args = parser.parse_args()
    build(Path(args.in_path))
    return 0


if __name__ == "__main__":
    sys.exit(main())
