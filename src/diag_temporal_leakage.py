"""
Leakage diagnostic for the temporal trajectory features.

The +temporal lift (recall@1% 0.17 -> 0.31) is large, so we check whether it is a
real behavioural signal or a panel-position artifact. The fraud label is gated
year <= excl_year, so positives concentrate in certain years; traj_years (years
billed so far) could separate classes for the WRONG reason.

Reports:
  1. class separation of year / traj_years (medians + AUC of each ALONE).
  2. gradient-boosting feature importance with temporal features in.
  3. how much of the lift survives if we DROP the position-like features
     (traj_years and every *_traj_* ) - i.e. keep only behavioural trajectory
     shape that is genuinely as-of.

Usage:
    python src/diag_temporal_leakage.py \
        --in data/processed/provider_year_panel_2019_2023_features_temporal.parquet
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

from train_model import TARGET, feature_columns, grouped_split, evaluate
from train_pu import run_bags, _impute
from breezeml import classifiers as C


def single_feature_auc(df: pd.DataFrame, col: str) -> float:
    x = df[col].replace([np.inf, -np.inf], np.nan).fillna(df[col].median())
    try:
        a = roc_auc_score(df[TARGET], x)
        return max(a, 1 - a)  # direction-agnostic
    except Exception:
        return float("nan")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="in_path", required=True)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--bags", type=int, default=15)
    ap.add_argument("--neg-ratio", type=int, default=10)
    args = ap.parse_args()
    sys.stdout.reconfigure(line_buffering=True)

    df = pd.read_parquet(args.in_path)
    feats = feature_columns(df)
    print(f"loaded {len(df):,} rows | {len(feats)} features\n")

    # --- 1. position-like separation -----------------------------------------
    print("=== class separation of position-like columns (whole panel) ===")
    for col in ["year", "traj_years"]:
        if col in df:
            m0 = df.loc[df[TARGET] == 0, col].median()
            m1 = df.loc[df[TARGET] == 1, col].median()
            print(f"  {col:12s} median clean {m0} | fraud {m1} | solo AUC {single_feature_auc(df, col):.3f}")

    # --- 2. importance with temporal in --------------------------------------
    train, test = grouped_split(df, 0.25, args.seed)
    med = train[feats].replace([np.inf, -np.inf], np.nan).median()
    pos = train[train[TARGET] == 1]
    neg = train[train[TARGET] == 0].sample(n=min(len(train[train[TARGET] == 0]), len(pos) * args.neg_ratio),
                                            random_state=args.seed)
    Xtr = _impute(pd.concat([pos[feats], neg[feats]]), med)
    ytr = pd.concat([pos[TARGET], neg[TARGET]])
    pipe, _ = C.gradient_boosting(X=Xtr, y=ytr)
    model = pipe.steps[-1][1] if hasattr(pipe, "steps") else pipe
    imp = getattr(model, "feature_importances_", None)
    if imp is not None:
        order = np.argsort(imp)[::-1]
        print("\n=== top 15 gradient-boosting importances (temporal in) ===")
        for i in order[:15]:
            tag = "  <-- POSITION-LIKE" if feats[i] == "traj_years" else ""
            print(f"  {feats[i]:34s} {imp[i]:.4f}{tag}")
        traj = [feats[i] for i in order if "_traj_" in feats[i] or feats[i] == "traj_years"]
        share = sum(imp[i] for i in range(len(feats)) if "_traj_" in feats[i] or feats[i] == "traj_years")
        print(f"\n  temporal features total importance share: {share:.1%}")

    # --- 3. ablation: drop traj_years (pure position), keep behavioural shape --
    Xte = _impute(test[feats], med)
    yte = test[TARGET].to_numpy()
    total = int(yte.sum())
    full = run_bags(pos, train[train[TARGET] == 0], feats, med, Xte, args.bags, args.neg_ratio, args.seed)
    evaluate("PU + ALL temporal", yte, full, total)

    feats_noyears = [f for f in feats if f != "traj_years"]
    med2 = train[feats_noyears].replace([np.inf, -np.inf], np.nan).median()
    Xte2 = _impute(test[feats_noyears], med2)
    no_years = run_bags(pos, train[train[TARGET] == 0], feats_noyears, med2, Xte2, args.bags, args.neg_ratio, args.seed)
    evaluate("PU + temporal, traj_years DROPPED", yte, no_years, total)

    feats_behav = [f for f in feats if "_traj_" not in f and f != "traj_years"]
    med3 = train[feats_behav].replace([np.inf, -np.inf], np.nan).median()
    Xte3 = _impute(test[feats_behav], med3)
    base = run_bags(pos, train[train[TARGET] == 0], feats_behav, med3, Xte3, args.bags, args.neg_ratio, args.seed)
    evaluate("PU + NO temporal at all (behavioural only)", yte, base, total)
    return 0


if __name__ == "__main__":
    sys.exit(main())
