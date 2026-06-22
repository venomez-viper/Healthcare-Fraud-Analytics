"""
Temporal trajectory features (LEAKAGE-SAFE, as-of).

The nnPU result showed neural sequence models lose to trees on this small-positive
tabular problem. So instead of a neural RNN, we exploit the 2019 to 2023 panel by
engineering provider TRAJECTORY features and adding them to the gradient-boosted PU
model that is already winning.

CRITICAL: features are computed AS-OF each row's year. A provider-year only sees
that provider's own billing up to and including that year, never future years. This
prevents look-ahead leakage (for example, a fraud provider's billing collapse AFTER
exclusion must not inform an earlier year's prediction).

For each provider-year, over that provider's years so far, for key metrics we add:
  * _traj_slope : least-squares trend up to this year (ramping up or down?)
  * _traj_cv    : coefficient of variation up to this year (how erratic?)
  * _traj_jump  : largest year-over-year jump seen so far (sudden spikes)
  * traj_years  : number of years billed up to this year (continuity)

Usage:
    python src/build_temporal_features.py \
        --in data/processed/provider_year_panel_2019_2023_features.parquet
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

PROC_DIR = Path(__file__).resolve().parents[1] / "data" / "processed"

METRICS = ["tot_services", "tot_medicare_payment", "services_per_bene",
           "pay_per_bene", "charge_to_payment", "tot_beneficiaries"]


def main() -> int:
    ap = argparse.ArgumentParser(description="Add leakage-safe provider trajectory features.")
    ap.add_argument("--in", dest="in_path", required=True)
    args = ap.parse_args()
    sys.stdout.reconfigure(line_buffering=True)

    df = pd.read_parquet(args.in_path)
    print(f"loaded {len(df):,} rows | adding as-of trajectory features for {len(METRICS)} metrics")

    df = df.sort_values(["npi", "year"])
    npi = df["npi"]
    grp = df.groupby("npi", sort=False)

    n = (grp.cumcount() + 1).astype("float64")
    sy = grp["year"].cumsum()
    syy = (df["year"] ** 2).groupby(npi).cumsum()
    denom = (n * syy - sy ** 2).replace(0, np.nan)

    new = {"traj_years": n.astype("float32")}
    for m in METRICS:
        sm = grp[m].cumsum()
        sym = (df["year"] * df[m]).groupby(npi).cumsum()
        smm = (df[m] ** 2).groupby(npi).cumsum()
        slope = (n * sym - sy * sm) / denom
        mean = (sm / n)
        var = (smm / n - mean ** 2).clip(lower=0)
        cv = np.sqrt(var) / mean.replace(0, np.nan)
        jump = grp[m].diff().abs().groupby(npi).cummax()
        new[f"{m}_traj_slope"] = slope.fillna(0).astype("float32")
        new[f"{m}_traj_cv"] = cv.replace([np.inf, -np.inf], np.nan).fillna(0).astype("float32")
        new[f"{m}_traj_jump"] = jump.fillna(0).astype("float32")

    out_df = pd.concat([df, pd.DataFrame(new, index=df.index)], axis=1).sort_index()
    added = list(new)
    print(f"added {len(added)} as-of trajectory features")

    if "fraud_label" in out_df:
        med = out_df.groupby("fraud_label")["tot_medicare_payment_traj_slope"].median()
        print(f"median payment trajectory slope (as-of)  clean {med.get(0, float('nan')):.1f} | "
              f"fraud {med.get(1, float('nan')):.1f}")

    out = PROC_DIR / (Path(args.in_path).stem + "_temporal.parquet")
    out_df.to_parquet(out, index=False)
    print(f"\nwrote {out}  ({out.stat().st_size / 1e6:.1f} MB)  shape={out_df.shape}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
