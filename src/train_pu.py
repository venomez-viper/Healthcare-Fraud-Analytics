"""
Positive-Unlabeled (PU) learning experiment: PU bagging vs the supervised baseline.

Why: the LEIE only lists fraud that got CAUGHT, so our "negative" providers are
really UNLABELED (an unknown share are uncaught fraud). The standard Medicare-fraud
literature treats this as ordinary supervised classification, which is the wrong
learning setting. This experiment treats it as PU learning.

Method (Mordelet & Vert, 2014, "A bagging SVM to learn from positive and unlabeled
examples"): train many base learners, each on ALL positives plus a fresh random
subsample of the unlabeled pool used as pseudo-negatives, then average the scores.
Each provider is scored mostly by bags that did NOT use it as a pseudo-negative
(out-of-bag), which removes the bias of treating a hidden positive as negative.

A/B design - both arms use the SAME provider-grouped split and per-bag ratio, so the
only difference is single-draw (the baseline style) vs bagged-and-averaged (PU):
  * Arm A: ONE draw of pseudo-negatives, one GradientBoosting fit (supervised baseline).
  * Arm B: N_BAGS draws, averaged (PU bagging).

Base learner is BreezeML's gradient_boosting, our champion model type.

Usage:
    python src/train_pu.py \
        --in data/processed/provider_year_panel_2019_2023_features.parquet
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

# reuse the baseline's split + evaluation so the comparison is apples-to-apples
from train_model import TARGET, feature_columns, grouped_split, evaluate, MODEL_DIR
from breezeml import classifiers as C


def _impute(X: pd.DataFrame, med: pd.Series) -> pd.DataFrame:
    return X.replace([np.inf, -np.inf], np.nan).fillna(med)


def run_bags(pos: pd.DataFrame, unl: pd.DataFrame, feats: list[str], med: pd.Series,
             Xte: pd.DataFrame, n_bags: int, neg_ratio: int, seed: int) -> np.ndarray:
    """Average held-out test scores over n_bags PU draws."""
    n_neg = min(len(unl), len(pos) * neg_ratio)
    test_scores = np.zeros(len(Xte))
    Xpos = _impute(pos[feats], med)
    for b in range(n_bags):
        neg = unl.sample(n=n_neg, random_state=seed + b)
        Xtr = pd.concat([Xpos, _impute(neg[feats], med)])
        ytr = pd.concat([pos[TARGET], neg[TARGET]])
        pipe, _ = C.gradient_boosting(X=Xtr, y=ytr)
        test_scores += pipe.predict_proba(Xte)[:, 1]
    return test_scores / n_bags


def main() -> int:
    ap = argparse.ArgumentParser(description="PU bagging vs supervised baseline (A/B).")
    ap.add_argument("--in", dest="in_path", required=True)
    ap.add_argument("--test-size", type=float, default=0.25)
    ap.add_argument("--neg-ratio", type=int, default=10, help="pseudo-neg per pos, per bag")
    ap.add_argument("--bags", type=int, default=15)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    df = pd.read_parquet(args.in_path)
    feats = feature_columns(df)
    train, test = grouped_split(df, args.test_size, args.seed)
    assert set(train["npi"]).isdisjoint(set(test["npi"])), "provider leak across split!"

    pos = train[train[TARGET] == 1]
    unl = train[train[TARGET] == 0]
    med = train[feats].replace([np.inf, -np.inf], np.nan).median()
    Xte = _impute(test[feats], med)
    yte = test[TARGET].to_numpy()
    total_fraud = int(yte.sum())
    print(f"loaded {len(df):,} rows | {len(feats)} features")
    print(f"split: train pos {len(pos)} / unlabeled {len(unl):,} | test fraud {total_fraud} "
          f"of {len(test):,}")
    print(f"PU config: {args.bags} bags, {args.neg_ratio}:1 pseudo-neg:pos per bag\n")

    metrics = []
    # Arm A: single draw (supervised baseline style)
    scores_a = run_bags(pos, unl, feats, med, Xte, n_bags=1,
                        neg_ratio=args.neg_ratio, seed=args.seed)
    metrics.append(evaluate("Arm A: supervised (single draw)", yte, scores_a, total_fraud))

    # Arm B: PU bagging
    scores_b = run_bags(pos, unl, feats, med, Xte, n_bags=args.bags,
                        neg_ratio=args.neg_ratio, seed=args.seed)
    metrics.append(evaluate(f"Arm B: PU bagging ({args.bags} bags)", yte, scores_b, total_fraud))

    MODEL_DIR.mkdir(exist_ok=True)
    (MODEL_DIR / "pu_metrics.json").write_text(json.dumps(metrics, indent=2))
    print(f"\nsaved A/B metrics to {MODEL_DIR / 'pu_metrics.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
