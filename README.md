# Healthcare Provider Fraud Risk Explorer

An end-to-end workflow that turns raw healthcare claims into a **ranked, explainable list of providers** most likely to be committing fraud, so a human investigator knows who to look at first and why.

**One-line pitch:** Turn millions of claims into a short, prioritized, explained worklist for fraud investigators.

```
Raw claims  ->  Clean & link  ->  Features  ->  Models  ->  Ranked queue  ->  Explainable interface
```

**Owners:** Akash and Shuthi

---

## The idea

We are not trying to "detect all fraud." Given a fixed investigator budget (only the top few percent of providers can ever be reviewed), the goal is to **make that small slice as dense with real fraud as possible, and explain every flag.** That reframing drives every technical choice, which is why the headline metric is **precision at top-k**, not accuracy or AUC.

The unit of everything (labels, features, scores, queue) is the **provider**.

## Method at a glance

| Phase | What happens |
|---|---|
| A. Data foundation | Join beneficiary + inpatient + outpatient + provider labels into one provider-keyed table; clean conservatively (outliers are the signal). |
| B. Feature engineering | Absolute provider behavior **plus** peer-relative position (z-scores, percentiles, ratios to peer medians). Peer features double as the explanation. |
| C. Modeling | Two tracks: supervised (LogReg -> XGBoost/LightGBM/RF) for known fraud, and anomaly detection (Isolation Forest et al.) for unlabeled weirdness. |
| D. Evaluation | Precision at top-k (1/5/10%) as primary, with PR/F1/ROC as support; stratified splits, k-fold CV, untouched holdout. |
| E. Risk Explorer | Ranked queue + per-provider detail view + SHAP and peer-deviation explanations. |

## Data

- **Primary (labeled):** Kaggle "Healthcare Provider Fraud Detection Analysis" (provider-level `PotentialFraud` label).
- **Supplementary (synthetic, no labels):** CMS DE-SynPUF 2008-2010 5% Medicare sample. Manual: [`SynPUF_DUG.pdf`](SynPUF_DUG.pdf).
- **Generalization test:** Kaggle NHIS Healthcare Claims and Fraud Dataset.

## Repository contents

| File | Purpose |
|---|---|
| [`PROJECT.md`](PROJECT.md) | Canonical project document (single source of truth): scope, objective, method, success criteria. |
| [`RESEARCH.md`](RESEARCH.md) | Literature review (2024-2026) grounding each design choice in recent peer-reviewed work. |
| `Healthcare Fraud Risk Explorer - Akash & Shruthi.docx` | Generated narrative report. |
| `SynPUF_DUG.pdf` | CMS DE-SynPUF data user guide (reference). |

## Tech stack

Python, pandas, scikit-learn, XGBoost/LightGBM, SHAP, Matplotlib/Seaborn. Optional dashboard: Streamlit.

---

See [`PROJECT.md`](PROJECT.md) for the full plan and working agreements.
