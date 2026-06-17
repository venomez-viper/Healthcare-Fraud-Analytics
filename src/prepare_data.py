"""
Check and prepare the labeled provider data for modeling.

Reads a processed table (single-year or pooled panel), prints a data-quality
report, applies conservative cleaning (per PROJECT.md: never delete genuine
outliers, they may be the fraud), engineers a few core features, and writes a
model-ready table to data/processed/.

Usage:
    python src/prepare_data.py --in data/processed/provider_year_panel_2019_2023.parquet
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PROC_DIR = ROOT / "data" / "processed"

MONEY_COLS = [
    "tot_submitted_charge", "tot_medicare_allowed",
    "tot_medicare_payment", "tot_medicare_standardized",
]
COUNT_COLS = ["tot_hcpcs_codes", "tot_beneficiaries", "tot_services"]
# CMS suppresses providers with fewer than 11 beneficiaries; below this a provider
# cannot be characterized reliably, so we drop them (PROJECT.md Phase A).
MIN_BENES = 11


def quality_report(df: pd.DataFrame) -> None:
    print("=" * 60)
    print("DATA QUALITY REPORT")
    print("=" * 60)
    print(f"rows: {len(df):,}   columns: {df.shape[1]}")
    if "year" in df:
        print("rows per year:")
        print(df["year"].value_counts().sort_index().to_string())
    label = "fraud_label" if "fraud_label" in df else None
    if label:
        pos = int(df[label].sum())
        print(f"\nfraud_label: {pos:,} positive  ({pos/len(df):.4%})")

    print("\nmissing values (cols with any):")
    miss = df.isna().sum()
    miss = miss[miss > 0]
    print(miss.to_string() if len(miss) else "  none")

    dup = df.duplicated(subset=[c for c in ["npi", "year"] if c in df]).sum()
    print(f"\nduplicate (npi, year) rows: {dup:,}")

    print("\nnegative values in money/count cols:")
    any_neg = False
    for c in MONEY_COLS + COUNT_COLS:
        if c in df:
            neg = int((df[c] < 0).sum())
            if neg:
                any_neg = True
                print(f"  {c}: {neg:,}")
    if not any_neg:
        print("  none")
    print()


def prepare(in_path: Path) -> Path:
    df = pd.read_parquet(in_path)
    quality_report(df)

    n0 = len(df)
    # 1. Coerce numerics (CMS ships everything as strings sometimes).
    for c in MONEY_COLS + COUNT_COLS + ["bene_avg_age", "bene_avg_risk_score"]:
        if c in df:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    # 2. Drop clearly broken rows: negative money, missing key fields.
    for c in MONEY_COLS:
        if c in df:
            df = df[df[c].fillna(0) >= 0]
    df = df.dropna(subset=["npi", "tot_services", "tot_beneficiaries"])

    # 3. Drop providers too small to characterize (NOT outlier removal).
    df = df[df["tot_beneficiaries"] >= MIN_BENES]

    # 4. Conservative missing-value fill for the numeric model inputs.
    for c in ["bene_avg_age", "bene_avg_risk_score"]:
        if c in df:
            df[c] = df[c].fillna(df[c].median())

    # 5. Core engineered features (absolute behavior ratios).
    df["pay_per_service"] = df["tot_medicare_payment"] / df["tot_services"].replace(0, np.nan)
    df["pay_per_bene"] = df["tot_medicare_payment"] / df["tot_beneficiaries"].replace(0, np.nan)
    df["services_per_bene"] = df["tot_services"] / df["tot_beneficiaries"].replace(0, np.nan)
    df["charge_to_payment"] = df["tot_submitted_charge"] / df["tot_medicare_payment"].replace(0, np.nan)
    new_feats = ["pay_per_service", "pay_per_bene", "services_per_bene", "charge_to_payment"]
    for c in new_feats:
        df[c] = df[c].replace([np.inf, -np.inf], np.nan).fillna(0)

    print(f"cleaning: {n0:,} -> {len(df):,} rows "
          f"({n0 - len(df):,} dropped, {(n0 - len(df)) / n0:.2%})")
    if "fraud_label" in df:
        pos = int(df["fraud_label"].sum())
        print(f"fraud_label after cleaning: {pos:,} positive ({pos/len(df):.4%})")
    print(f"engineered features: {new_feats}")

    out = PROC_DIR / (in_path.stem + "_clean.parquet")
    df.to_parquet(out, index=False)
    print(f"\nWrote {out}  ({out.stat().st_size / 1e6:.1f} MB)")
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Check + prepare labeled provider data for modeling.")
    parser.add_argument("--in", dest="in_path", required=True, help="processed parquet to clean")
    args = parser.parse_args()
    prepare(Path(args.in_path))
    return 0


if __name__ == "__main__":
    sys.exit(main())
