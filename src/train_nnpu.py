"""
nnPU: non-negative Positive-Unlabeled learning (Kiryo et al., 2017), in PyTorch.

This is the advanced, principled form of our breakthrough. Instead of the heuristic
PU bagging, nnPU trains a neural network directly with the non-negative PU risk
estimator: it learns from positives + unlabeled with NO assumed negatives, and
corrects the risk so it cannot go negative (which is what made earlier unbiased
PU estimators overfit).

Reference: Kiryo, Niu, du Plessis, Sugiyama (2017), Positive-Unlabeled learning
with non-negative risk estimator, NeurIPS.

Usage:
    python src/train_nnpu.py \
        --in data/processed/provider_year_panel_2019_2023_features.parquet --prior 0.05
"""
from __future__ import annotations

import argparse
import json
import sys

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.preprocessing import StandardScaler

from train_model import TARGET, feature_columns, grouped_split, evaluate, MODEL_DIR


class MLP(nn.Module):
    def __init__(self, d):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(d, 128), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(128, 64), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(64, 1),
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)


def sigmoid_loss(g, positive: bool):
    # surrogate loss; for label +1 use sigmoid(-g), for -1 use sigmoid(g)
    return torch.sigmoid(-g) if positive else torch.sigmoid(g)


def nnpu_loss(g_p, g_u, prior, beta=0.0, gamma=1.0):
    r_p_plus = sigmoid_loss(g_p, True).mean()
    r_p_minus = sigmoid_loss(g_p, False).mean()
    r_u_minus = sigmoid_loss(g_u, False).mean()
    positive_risk = prior * r_p_plus
    negative_risk = r_u_minus - prior * r_p_minus
    if negative_risk < -beta:
        return -gamma * negative_risk, positive_risk + negative_risk
    return positive_risk + negative_risk, positive_risk + negative_risk


def main() -> int:
    ap = argparse.ArgumentParser(description="nnPU neural Positive-Unlabeled learning.")
    ap.add_argument("--in", dest="in_path", required=True)
    ap.add_argument("--prior", type=float, default=0.05, help="assumed true fraud prior")
    ap.add_argument("--steps", type=int, default=3000)
    ap.add_argument("--pos-batch", type=int, default=64)
    ap.add_argument("--unl-batch", type=int, default=256)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    sys.stdout.reconfigure(line_buffering=True)
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    df = pd.read_parquet(args.in_path)
    feats = feature_columns(df)
    train, test = grouped_split(df, 0.25, args.seed)

    med = train[feats].replace([np.inf, -np.inf], np.nan).median()
    scaler = StandardScaler().fit(train[feats].replace([np.inf, -np.inf], np.nan).fillna(med))

    def prep(frame):
        return scaler.transform(frame[feats].replace([np.inf, -np.inf], np.nan).fillna(med)).astype("float32")

    P = torch.from_numpy(prep(train[train[TARGET] == 1]))
    U = torch.from_numpy(prep(train[train[TARGET] == 0]))
    Xte = prep(test)
    yte = test[TARGET].to_numpy()
    total_fraud = int(yte.sum())
    print(f"positives {len(P)} | unlabeled {len(U):,} | test fraud {total_fraud} | prior {args.prior}")

    model = MLP(len(feats))
    opt = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)

    model.train()
    for step in range(1, args.steps + 1):
        pi = torch.randint(0, len(P), (args.pos_batch,))
        ui = torch.randint(0, len(U), (args.unl_batch,))
        g_p = model(P[pi])
        g_u = model(U[ui])
        obj, monitor = nnpu_loss(g_p, g_u, args.prior)
        opt.zero_grad()
        obj.backward()
        opt.step()
        if step % 600 == 0:
            print(f"  step {step:5d}  risk {monitor.item():.4f}")

    # ---- score the held-out test set ----
    model.eval()
    scores = np.empty(len(Xte), dtype="float32")
    with torch.no_grad():
        for i in range(0, len(Xte), 100000):
            chunk = torch.from_numpy(Xte[i:i + 100000])
            scores[i:i + 100000] = torch.sigmoid(model(chunk)).numpy()

    m = evaluate(f"nnPU (prior={args.prior})", yte, scores, total_fraud)
    MODEL_DIR.mkdir(exist_ok=True)
    (MODEL_DIR / "nnpu_metrics.json").write_text(json.dumps([m], indent=2))
    print(f"\nsaved {MODEL_DIR / 'nnpu_metrics.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
