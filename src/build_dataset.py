"""
Build the labeled, provider-keyed dataset for the Fraud Risk Explorer.

What it does:
  1. Loads the CMS Part B "by Provider" file (one row per NPI, with billing features).
  2. Loads the OIG LEIE exclusion list and extracts the set of excluded NPIs.
  3. Joins them on NPI to create the labels:
        - excluded_any  : 1 if the provider appears in LEIE for ANY reason.
        - fraud_label   : 1 if the provider appears in LEIE for a FRAUD-related reason
                          (this is the supervised target).
  4. Writes the analysis-ready table to data/processed/.

Labeling note (read before trusting the target):
  The LEIE has no "fraud" flag; exclusions are coded by statutory authority in the
  EXCLTYPE column. We treat the codes below as fraud-related. License-only
  revocations (1128b4) are the largest bucket and are NOT inherently fraud, so they
  are EXCLUDED from `fraud_label` by default but still captured by `excluded_any`.
  Adjust FRAUD_EXCLTYPES if your definition differs.

Usage:
    python src/build_dataset.py                 # uses data year 2023
    python src/build_dataset.py --year 2024
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
PROC_DIR = ROOT / "data" / "processed"

# Fraud-related LEIE exclusion authorities.
# See: https://oig.hhs.gov/exclusions/authorities.asp
FRAUD_EXCLTYPES = {
    "1128a1",  # Conviction of program-related crimes (Medicare/Medicaid fraud)
    "1128a3",  # Felony conviction relating to health care fraud
    "1128b1",  # Conviction relating to fraud (misdemeanor)
    "1128b7",  # Fraud, kickbacks, and other prohibited activities
    "1128b8",  # Entity controlled by a sanctioned (fraud-excluded) individual
}

# CMS column -> friendly name. We keep the identifiers, geography/specialty needed
# for peer grouping, and the core utilization/financial aggregates.
CMS_KEEP = {
    "Rndrng_NPI": "npi",
    "Rndrng_Prvdr_Last_Org_Name": "last_or_org_name",
    "Rndrng_Prvdr_First_Name": "first_name",
    "Rndrng_Prvdr_Ent_Cd": "entity_code",            # I = individual, O = organization
    "Rndrng_Prvdr_State_Abrvtn": "state",
    "Rndrng_Prvdr_RUCA": "ruca",                     # rural-urban code
    "Rndrng_Prvdr_Type": "provider_type",            # specialty (peer-group key)
    "Rndrng_Prvdr_Mdcr_Prtcptg_Ind": "medicare_participating",
    "Tot_HCPCS_Cds": "tot_hcpcs_codes",
    "Tot_Benes": "tot_beneficiaries",
    "Tot_Srvcs": "tot_services",
    "Tot_Sbmtd_Chrg": "tot_submitted_charge",
    "Tot_Mdcr_Alowd_Amt": "tot_medicare_allowed",
    "Tot_Mdcr_Pymt_Amt": "tot_medicare_payment",
    "Tot_Mdcr_Stdzd_Amt": "tot_medicare_standardized",
    "Bene_Avg_Age": "bene_avg_age",
    "Bene_Avg_Risk_Scre": "bene_avg_risk_score",
}


def load_fraud_npis(leie_path: Path) -> tuple[set[str], set[str]]:
    """Return (all_excluded_npis, fraud_excluded_npis) from the LEIE."""
    leie = pd.read_csv(leie_path, dtype=str, encoding="utf-8-sig").fillna("")
    leie["NPI"] = leie["NPI"].str.strip()
    leie["EXCLTYPE"] = leie["EXCLTYPE"].str.strip()

    # Drop placeholder NPIs (0000000000) that cannot be joined.
    valid = leie[(leie["NPI"].str.len() == 10) & (leie["NPI"] != "0000000000")]

    all_excluded = set(valid["NPI"])
    fraud_excluded = set(valid.loc[valid["EXCLTYPE"].isin(FRAUD_EXCLTYPES), "NPI"])
    print(f"LEIE: {len(leie):,} records | {len(all_excluded):,} with usable NPI | "
          f"{len(fraud_excluded):,} fraud-related")
    return all_excluded, fraud_excluded


def build(year: int) -> Path:
    cms_path = RAW_DIR / f"CMS_PartB_byProvider_{year}.csv"
    leie_path = RAW_DIR / "LEIE_exclusions.csv"
    for p in (cms_path, leie_path):
        if not p.exists():
            raise SystemExit(f"Missing {p}. Run: python src/download_data.py --year {year}")

    all_excluded, fraud_excluded = load_fraud_npis(leie_path)

    print(f"Loading CMS Part B {year} (this is a ~470 MB file) ...")
    df = pd.read_csv(
        cms_path,
        usecols=list(CMS_KEEP),
        dtype={"Rndrng_NPI": str},
    ).rename(columns=CMS_KEEP)

    df["npi"] = df["npi"].str.strip()
    df["excluded_any"] = df["npi"].isin(all_excluded).astype("int8")
    df["fraud_label"] = df["npi"].isin(fraud_excluded).astype("int8")

    n = len(df)
    n_fraud = int(df["fraud_label"].sum())
    n_excl = int(df["excluded_any"].sum())
    print(f"CMS: {n:,} providers")
    print(f"  matched to a fraud exclusion : {n_fraud:,}  ({n_fraud / n:.4%})")
    print(f"  matched to any exclusion     : {n_excl:,}  ({n_excl / n:.4%})")

    PROC_DIR.mkdir(parents=True, exist_ok=True)
    out = PROC_DIR / f"provider_fraud_{year}.parquet"
    df.to_parquet(out, index=False)

    # Small CSV preview that is safe to glance at / share internally.
    sample = pd.concat([
        df[df["fraud_label"] == 1].head(200),
        df[df["fraud_label"] == 0].head(800),
    ])
    sample.to_csv(PROC_DIR / f"provider_fraud_{year}_sample.csv", index=False)

    print(f"\nWrote {out}  ({out.stat().st_size / 1e6:.1f} MB)")
    print(f"Wrote preview {PROC_DIR / f'provider_fraud_{year}_sample.csv'}")
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Join CMS Part B + LEIE into a labeled provider table.")
    parser.add_argument("--year", type=int, default=2023)
    args = parser.parse_args()
    build(args.year)
    return 0


if __name__ == "__main__":
    sys.exit(main())
