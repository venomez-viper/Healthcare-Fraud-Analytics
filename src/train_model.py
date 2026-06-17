"""
Supervised fraud model, built on BreezeML (our own scikit-learn wrapper).

BreezeML (https://github.com/venomez-viper/breezeml) handles the pipeline build,
fit, and standard report. Two things are out of BreezeML's scope, so we add them
here because they are the heart of this problem:

  * Imbalance handling - random undersampling (RUS) of the majority class on the
    TRAIN split only, per Johnson & Khoshgoftaar (2019).
  * Top-k precision evaluation under class rarity, per Bauder & Khoshgoftaar
    (2019) - we rank the held-out providers by fraud probability and measure how
    dense the top 1 / 5 / 10 percent is with real fraud.

The split is provider-grouped (GroupShuffleSplit on NPI) so the same provider's
different years never sit on both sides of the split. Logistic regression is the
baseline, per Herland, Khoshgoftaar & Bauder (2018).

Usage:
    python src/train_model.py \
        --in data/processed/provider_year_panel_2019_2023_features.parquet
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler

import breezeml as bm
from breezeml import classifiers as C

ROOT = Path(__file__).resolve().parents[1]
PROC_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"

TARGET = "fraud_label"
# Columns that are identifiers, leak the label, or are categorical strings we do
# not feed to the linear/tree baseline (the specialty signal is already encoded
# in the peer-relative features).
DROP = {
    TARGET, "excluded_any", "excl_year",          # label leakage
    "npi", "last_or_org_name", "first_name",       # identifiers
    "entity_code", "state", "provider_type", "medicare_participating",  # categoricals
    "year",                                         # temporal label gating -> drop
}


def feature_columns(df: pd.DataFrame) -> list[str]:
    num = df.select_dtypes(include=[np.number]).columns
    return [c for c in num if c not in DROP]


def grouped_split(df: pd.DataFrame, test_size: float, seed: int):
    gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
    tr_idx, te_idx = next(gss.split(df, df[TARGET], groups=df["npi"]))
    return df.iloc[tr_idx], df.iloc[te_idx]


def undersample(df: pd.DataFrame, neg_per_pos: int, seed: int) -> pd.DataFrame:
    pos = df[df[TARGET] == 1]
    neg = df[df[TARGET] == 0]
    n_neg = min(len(neg), len(pos) * neg_per_pos)
    neg_s = neg.sample(n=n_neg, random_state=seed)
    return pd.concat([pos, neg_s]).sample(frac=1, random_state=seed)


def precision_at_k(y_true: np.ndarray, scores: np.ndarray, k_frac: float) -> tuple[float, int, int]:
    n_k = max(1, int(len(scores) * k_frac))
    top = np.argsort(scores)[::-1][:n_k]
    hits = int(y_true[top].sum())
    return hits / n_k, hits, n_k


def evaluate(name: str, y_true: np.ndarray, scores: np.ndarray, total_fraud: int) -> dict:
    print(f"\n=== {name} (evaluated on full imbalanced test set) ===")
    res = {"model": name,
           "pr_auc": float(average_precision_score(y_true, scores)),
           "roc_auc": float(roc_auc_score(y_true, scores))}
    print(f"  PR-AUC : {res['pr_auc']:.4f}   ROC-AUC: {res['roc_auc']:.4f}")
    for kf in (0.01, 0.05, 0.10):
        prec, hits, n_k = precision_at_k(y_true, scores, kf)
        recall = hits / total_fraud if total_fraud else 0.0
        res[f"prec_at_{int(kf*100)}pct"] = prec
        res[f"recall_at_{int(kf*100)}pct"] = recall
        print(f"  top {int(kf*100):>2}% (n={n_k:>6}): precision {prec:.4f} | "
              f"caught {hits}/{total_fraud} fraud ({recall:.1%})")
    return res


def main() -> int:
    ap = argparse.ArgumentParser(description="Train BreezeML fraud model with RUS + top-k eval.")
    ap.add_argument("--in", dest="in_path", required=True)
    ap.add_argument("--test-size", type=float, default=0.25)
    ap.add_argument("--neg-per-pos", type=int, default=20, help="RUS ratio on train")
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    df = pd.read_parquet(args.in_path)
    feats = feature_columns(df)
    print(f"loaded {len(df):,} rows | {len(feats)} features | "
          f"{int(df[TARGET].sum()):,} positives ({df[TARGET].mean():.4%})")

    train, test = grouped_split(df, args.test_size, args.seed)
    # guard: no provider leaks across the split
    assert set(train["npi"]).isdisjoint(set(test["npi"])), "provider leak across split!"
    print(f"split (provider-grouped): train {len(train):,} / test {len(test):,} | "
          f"train fraud {int(train[TARGET].sum())} / test fraud {int(test[TARGET].sum())}")

    train_bal = undersample(train, args.neg_per_pos, args.seed)
    print(f"RUS train: {len(train_bal):,} rows "
          f"({train_bal[TARGET].mean():.2%} positive, {args.neg_per_pos}:1 neg:pos)")

    Xtr, ytr = train_bal[feats].copy(), train_bal[TARGET]
    Xte, yte = test[feats].copy(), test[TARGET]
    # BreezeML's X/y path skips imputation; median-impute (fit on train) so the
    # linear baseline accepts the matrix. Trees would tolerate NaN, LR does not.
    Xtr = Xtr.replace([np.inf, -np.inf], np.nan)
    Xte = Xte.replace([np.inf, -np.inf], np.nan)
    med = Xtr.median()
    Xtr = Xtr.fillna(med)
    Xte = Xte.fillna(med)
    yte_arr = yte.to_numpy()
    total_fraud = int(yte.sum())

    MODEL_DIR.mkdir(exist_ok=True)
    all_metrics = []

    # 1. Logistic regression baseline (Herland 2018), now with scaling. BreezeML's
    #    X/y path skips the StandardScaler its df/target path adds, so we scale here
    #    (fit on train) - without it lbfgs fails to converge and the ranker is weak.
    scaler = StandardScaler().fit(Xtr)
    Xtr_s = pd.DataFrame(scaler.transform(Xtr), columns=feats, index=Xtr.index)
    Xte_s = pd.DataFrame(scaler.transform(Xte), columns=feats, index=Xte.index)
    lr_pipe, _ = C.logistic(X=Xtr_s, y=ytr, X_test=Xte_s, y_test=yte)
    lr_scores = lr_pipe.predict_proba(Xte_s)[:, 1]
    all_metrics.append(evaluate("LogisticRegression (scaled)", yte_arr, lr_scores, total_fraud))
    bm.save({"scaler": scaler, "model": lr_pipe}, str(MODEL_DIR / "LogisticRegression.joblib"))

    # 2. Gradient boosting via BreezeML (raw features; trees do not need scaling).
    gb_pipe, _ = C.gradient_boosting(X=Xtr, y=ytr, X_test=Xte, y_test=yte)
    gb_scores = gb_pipe.predict_proba(Xte)[:, 1]
    all_metrics.append(evaluate("GradientBoosting", yte_arr, gb_scores, total_fraud))
    bm.save(gb_pipe, str(MODEL_DIR / "GradientBoosting.joblib"))

    # 3. XGBoost (not wrapped by BreezeML). Trained on the full imbalanced train set
    #    with scale_pos_weight instead of RUS, the native way to handle class rarity.
    import xgboost as xgb
    Xtr_full = train[feats].replace([np.inf, -np.inf], np.nan).fillna(med)
    ytr_full = train[TARGET]
    spw = (ytr_full == 0).sum() / max(1, (ytr_full == 1).sum())
    xgb_clf = xgb.XGBClassifier(
        n_estimators=400, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, tree_method="hist",
        scale_pos_weight=spw, eval_metric="aucpr", n_jobs=-1, random_state=args.seed)
    xgb_clf.fit(Xtr_full, ytr_full)
    xgb_scores = xgb_clf.predict_proba(Xte)[:, 1]
    all_metrics.append(evaluate(f"XGBoost (scale_pos_weight={spw:.0f})", yte_arr, xgb_scores, total_fraud))
    xgb_clf.save_model(str(MODEL_DIR / "XGBoost.json"))

    (MODEL_DIR / "metrics.json").write_text(json.dumps(all_metrics, indent=2))
    print(f"\nsaved models + metrics to {MODEL_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
