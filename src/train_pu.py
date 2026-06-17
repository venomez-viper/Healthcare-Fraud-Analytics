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


def run_ab(df: pd.DataFrame, feats: list[str], test_size: float, neg_ratio: int,
           bags: int, seed: int) -> tuple[dict, dict]:
    """One seed: grouped split, then Arm A (single draw) and Arm B (PU bagging)."""
    train, test = grouped_split(df, test_size, seed)
    assert set(train["npi"]).isdisjoint(set(test["npi"])), "provider leak across split!"
    pos = train[train[TARGET] == 1]
    unl = train[train[TARGET] == 0]
    med = train[feats].replace([np.inf, -np.inf], np.nan).median()
    Xte = _impute(test[feats], med)
    yte = test[TARGET].to_numpy()
    total_fraud = int(yte.sum())

    scores_a = run_bags(pos, unl, feats, med, Xte, 1, neg_ratio, seed)
    mA = evaluate(f"[seed {seed}] Arm A: supervised (single draw)", yte, scores_a, total_fraud)
    scores_b = run_bags(pos, unl, feats, med, Xte, bags, neg_ratio, seed)
    mB = evaluate(f"[seed {seed}] Arm B: PU bagging ({bags} bags)", yte, scores_b, total_fraud)
    return mA, mB


def summarize(rows: list[dict], keys: list[str]) -> dict:
    return {k: {"mean": float(np.mean([r[k] for r in rows])),
                "std": float(np.std([r[k] for r in rows]))} for k in keys}


def main() -> int:
    ap = argparse.ArgumentParser(description="PU bagging vs supervised baseline (A/B).")
    ap.add_argument("--in", dest="in_path", required=True)
    ap.add_argument("--test-size", type=float, default=0.25)
    ap.add_argument("--neg-ratio", type=int, default=10, help="pseudo-neg per pos, per bag")
    ap.add_argument("--bags", type=int, default=15)
    ap.add_argument("--seeds", type=str, default="42",
                    help="comma-separated seeds; each is a different grouped split")
    args = ap.parse_args()
    sys.stdout.reconfigure(line_buffering=True)

    df = pd.read_parquet(args.in_path)
    feats = feature_columns(df)
    seeds = [int(s) for s in args.seeds.split(",")]
    print(f"loaded {len(df):,} rows | {len(feats)} features | seeds {seeds} | "
          f"{args.bags} bags, {args.neg_ratio}:1 per bag\n")

    A_rows, B_rows = [], []
    for seed in seeds:
        mA, mB = run_ab(df, feats, args.test_size, args.neg_ratio, args.bags, seed)
        A_rows.append(mA)
        B_rows.append(mB)

    keys = ["roc_auc", "pr_auc", "recall_at_1pct", "recall_at_5pct", "recall_at_10pct"]
    sumA, sumB = summarize(A_rows, keys), summarize(B_rows, keys)

    print("\n" + "=" * 64)
    print(f"ROBUSTNESS SUMMARY over {len(seeds)} seeds (mean +/- std)")
    print("=" * 64)
    print(f"{'metric':18s} {'Arm A supervised':>20s} {'Arm B PU bagging':>20s}")
    for k in keys:
        a, b = sumA[k], sumB[k]
        print(f"{k:18s} {a['mean']:.4f} +/- {a['std']:.4f}    "
              f"{b['mean']:.4f} +/- {b['std']:.4f}")
    # per-seed win check on the headline metric
    wins = sum(1 for ra, rb in zip(A_rows, B_rows)
               if rb["recall_at_1pct"] > ra["recall_at_1pct"])
    print(f"\nPU bagging wins on top-1% recall in {wins}/{len(seeds)} seeds")

    MODEL_DIR.mkdir(exist_ok=True)
    out = {"seeds": seeds, "per_seed": {"A": A_rows, "B": B_rows},
           "summary": {"A": sumA, "B": sumB}, "pu_wins_top1pct": f"{wins}/{len(seeds)}"}
    (MODEL_DIR / "pu_metrics.json").write_text(json.dumps(out, indent=2))
    print(f"\nsaved A/B metrics to {MODEL_DIR / 'pu_metrics.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
