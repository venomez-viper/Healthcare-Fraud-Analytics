# Healthcare Provider Fraud Risk Explorer
## Project Source Document (Single Source of Truth)

**Owners:** Akash and Shruthi
**Status:** Active build
**Last updated:** June 2026

> This is the canonical project document. Everything we build links back here. Update this file as decisions change, not your memory or scattered notes.

---

## 1. What Are We Building

A **Provider Fraud Risk Explorer**: an end-to-end workflow that takes raw healthcare claims data and produces a **ranked, explainable list of providers** most likely to be committing fraud, so a human investigator knows who to look at first and why.

It is not just a model. It is the full chain:

```
Raw claims  ->  Clean & link  ->  Features  ->  Models  ->  Ranked queue  ->  Explainable interface
```

The end product is something an analyst can open, see the top suspicious providers, click one, and immediately understand the case for investigating it.

**One-line pitch:** Turn millions of claims into a short, prioritized, explained worklist for fraud investigators.

---

## 2. What Are We Going to Do (Scope)

### In scope (v1)
- Use the **labeled Kaggle Healthcare Provider Fraud Detection** dataset.
- Build at the **provider level** (the unit that gets labeled, investigated, and budgeted).
- Train a **supervised model** to predict fraud probability.
- Train an **anomaly model** to catch unlabeled weird behavior.
- Build a **ranked queue + per-provider explanation** view.

### Out of scope (for now)
- Real-time scoring or production deployment.
- Claim-level or patient-level detection.
- Live PHI or real payer data (we use synthetic/public data only).

### Parking lot (later phases)
- Validate on a second dataset (NHIS, SynPUF) to test generalization.
- Interactive web dashboard.
- Network/graph features (provider-to-beneficiary referral patterns).

---

## 3. Objective and End Results

### 3.1 The Objective
Given a fixed investigator budget (they can only review the top few percent of providers), **make that small slice as dense with real fraud as possible, and explain every flag.**

We are NOT trying to "detect all fraud." We are trying to **prioritize a limited worklist**. That reframing drives every technical choice.

### 3.2 Concrete End Results (Definition of Done)
By the end, we will have:

1. A **clean, provider-keyed dataset** joining claims + beneficiary + labels.
2. A **feature set** of provider behavior and peer-relative metrics.
3. A **trained supervised model** with a fraud probability per provider.
4. An **anomaly score** per provider (unsupervised).
5. An **evaluation report** led by **precision at top-k** (top 1%, 5%, 10%).
6. A **ranked Risk Explorer**: queue table + provider detail view + explanations.
7. This document, kept current, plus a clean README and notebook.

### 3.3 Success Criteria
- Top-5% of the ranked list captures a meaningfully high share of true fraud providers.
- Every flagged provider has a readable reason (peer comparison + top features).
- The whole pipeline runs end-to-end from raw files to the queue.

---

## 4. How Are We Going to Do It (Method)

### Phase A: Data Foundation
- Load the four tables: beneficiary, inpatient claims, outpatient claims, provider labels.
- Clean conservatively. **In fraud data, outliers are the signal, do not over-smooth them.**
  - Fill missing chronic-condition flags with 0.
  - Fix types (dates to datetime, money to numeric).
  - Remove only clearly broken values (e.g. negative reimbursements).
  - Drop providers with too few claims to characterize.
- Join everything to one table keyed by provider ID.

### Phase B: Feature Engineering
Two layers. The second is what makes it work.

**Layer 1: Provider behavior (absolute)**
- Volume: total claims, unique beneficiaries, inpatient/outpatient ratio.
- Financial: total reimbursed, average per claim, 90th-percentile claim amount.
- Service mix: procedure-code frequencies, average length of stay, share of high-cost procedures.
- Patient mix: average beneficiary age, age spread, chronic-condition counts.

**Layer 2: Peer-relative position (comparative)**
- Z-scores vs comparable providers (geography/specialty if available).
- Percentile rank of reimbursement and volume.
- Ratios to peer medians.

> Peer features do double duty: they sharpen the model AND pre-build the explanation ("bills 3 SD above peer average for procedure X").

### Phase C: Modeling (two tracks, two jobs)
- **Supervised (known fraud):** logistic regression baseline, then XGBoost/LightGBM and random forest.
- **Unsupervised (unlabeled weirdness):** Isolation Forest primary, plus Local Outlier Factor / Elliptic Envelope.
- **Handle imbalance:** class weighting, PR-curve metrics, and top-k precision as the headline.

### Phase D: Evaluation
| Metric | Answers | Priority |
|---|---|---|
| Precision at top-k (1/5/10%) | Of who we'd actually review, how many are real fraud? | Primary |
| Precision / Recall (fraud) | How clean / complete are flags? | Supporting |
| F1 | Balanced single number | Supporting |
| ROC AUC | Overall ranking ability | Context |

Use stratified splits, k-fold CV, and a final untouched holdout.

### Phase E: The Risk Explorer
1. **Ranked table:** provider ID, fraud probability, anomaly score, total reimbursement, claim count, label.
2. **Detail view:** time series of volume and reimbursement, procedure mix, patient profile, peer comparisons.
3. **Filters:** geography, specialty, investigation status.
4. **Explanations:** global feature importance + per-provider SHAP + peer-deviation visuals.

---

## 5. Tech Stack

- **Data + modeling:** Python, pandas, scikit-learn, XGBoost/LightGBM.
- **Notebooks:** Jupyter.
- **Viz:** Matplotlib, Seaborn, or Plotly.
- **Optional dashboard:** Power BI, Tableau, or a lightweight Streamlit/web app.

---

## 6. Additional Cool Things to Do (Stretch Goals)

Pick these up once v1 works. Each one is a strong portfolio upgrade.

- **SHAP-powered "why flagged" cards** auto-generated per provider in plain English.
- **Graph features:** model provider-beneficiary networks; shared-patient rings can reveal collusion.
- **Streamlit app** so anyone can click through the queue live (great for interviews).
- **Specialty-aware peer grouping** so a cardiologist is compared to cardiologists, not dentists.
- **Threshold/budget simulator:** slider for "how many can I investigate this week" that updates the queue and expected fraud caught.
- **Second-dataset validation** (NHIS or SynPUF) to show the approach generalizes.
- **Cost-of-fraud framing:** estimate dollars at risk in the top-k, not just counts.
- **Drift check:** show how a provider's risk changes year over year (2008 to 2010 in SynPUF).

---

## 7. Learning Outcomes

What we will actually be able to say we can do after this:

- **Problem framing:** turn a vague goal ("find fraud") into the real constraint ("rank a fixed worklist").
- **Claims data wrangling:** join multi-table healthcare claims into an analysis-ready provider view.
- **Feature engineering with peer benchmarking:** absolute + relative metrics, the core of fraud analytics.
- **Imbalanced classification:** class weighting, PR curves, top-k precision instead of naive accuracy.
- **Anomaly detection:** Isolation Forest and friends for unlabeled risk.
- **Model explainability:** global and per-instance interpretation with SHAP.
- **Evaluation that matches the use case:** choosing metrics that reflect the real decision.
- **Communicating to non-technical stakeholders:** turning scores into an investigator-ready interface and narrative.
- **Ethics and fairness in high-stakes ML:** bias auditing, human-in-the-loop, honest limits of synthetic data.

---

## 8. Data Sources Reference

- **Primary:** Kaggle "Healthcare Provider Fraud Detection Analysis" (provider-level `PotentialFraud` label).
- **Supplementary (no fraud labels, synthetic):** CMS DE-SynPUF 2008 to 2010, a 5% Medicare sample with linkable beneficiary/inpatient/outpatient/carrier claims. Use for the anomaly + engineering track, NOT supervised training. Manual is in this folder (`SynPUF_DUG.pdf`).
- **Generalization test:** Kaggle NHIS Healthcare Claims and Fraud Dataset.

---

## 9. Working Agreements

- This file is the source of truth. Decisions get recorded here.
- Conservative cleaning: never delete genuine outliers, they may be the fraud.
- Provider level is the unit of everything: labels, features, scores, queue.
- Top-k precision is the metric we optimize, not accuracy or AUC.
- Every flag must be explainable, or it does not ship.
