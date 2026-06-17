"""
Unsupervised anomaly-detection track (Isolation Forest).

The supervised model learns from KNOWN fraud. But the LEIE labels are deeply
incomplete, so a second, label-free track is part of the design (PROJECT.md):
flag providers whose billing is bizarre relative to peers, with no labels at all.
This catches fraud the labels never recorded.

What it does:
  1. Fit an Isolation Forest on the (peer-relative) features of the TRAIN providers,
     using no labels.
  2. Score the held-out providers by anomaly (higher = weirder).
  3. Evaluate how well that label-free score ranks the KNOWN fraud (top-k, ROC-AUC).
  4. Combine it with the supervised PU score (rank average) to test whether the two
     tracks together beat either alone.

Reference: Bauder & Khoshgoftaar, outlier-based Medicare fraud detection.

Usage:
    python src/train_anomaly.py \
        --in data/processed/provider_year_panel_2019_2023_features.parquet
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import rankdata
from sklearn.ensemble import IsolationForest

from train_model import TARGET, feature_columns, grouped_split, evaluate, MODEL_DIR
from train_pu import _impute, run_bags


def main() -> int:
    ap = argparse.ArgumentParser(description="Isolation Forest anomaly track + two-track combo.")
    ap.add_argument("--in", dest="in_path", required=True)
    ap.add_argument("--test-size", type=float, default=0.25)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--bags", type=int, default=15)
    ap.add_argument("--neg-ratio", type=int, default=10)
    args = ap.parse_args()
    sys.stdout.reconfigure(line_buffering=True)

    df = pd.read_parquet(args.in_path)
    feats = feature_columns(df)
    train, test = grouped_split(df, args.test_size, args.seed)
    med = train[feats].replace([np.inf, -np.inf], np.nan).median()
    Xtr = _impute(train[feats], med)
    Xte = _impute(test[feats], med)
    yte = test[TARGET].to_numpy()
    total_fraud = int(yte.sum())
    print(f"loaded {len(df):,} rows | {len(feats)} features | test fraud {total_fraud}\n")

    metrics = []

    # 1. Isolation Forest (unsupervised: fit without labels).
    print("fitting Isolation Forest (no labels) ...")
    iso = IsolationForest(n_estimators=300, max_samples=512, contamination="auto",
                          random_state=args.seed, n_jobs=-1)
    iso.fit(Xtr)
    anomaly = -iso.score_samples(Xte)  # higher = more anomalous
    metrics.append(evaluate("Isolation Forest (unsupervised)", yte, anomaly, total_fraud))

    # 2. Supervised PU score (for comparison + combination).
    print("\nscoring supervised PU bagging arm ...")
    pos = train[train[TARGET] == 1]
    unl = train[train[TARGET] == 0]
    sup = run_bags(pos, unl, feats, med, Xte, args.bags, args.neg_ratio, args.seed)
    metrics.append(evaluate("Supervised PU bagging", yte, sup, total_fraud))

    # 3. Two-track combination: average of the rank-normalised scores.
    combo = rankdata(anomaly) + rankdata(sup)
    metrics.append(evaluate("Two-track combo (anomaly + supervised)", yte, combo, total_fraud))

    MODEL_DIR.mkdir(exist_ok=True)
    (MODEL_DIR / "anomaly_metrics.json").write_text(json.dumps(metrics, indent=2))
    print(f"\nsaved metrics to {MODEL_DIR / 'anomaly_metrics.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
