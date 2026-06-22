# Healthcare Provider Fraud Risk Explorer

An end-to-end workflow that turns real Medicare billing data into a **ranked, explainable list of providers** most likely to be committing fraud, so a human investigator knows who to look at first and why.

**One-line pitch:** Turn millions of claims into a short, prioritized, explained worklist for fraud investigators.

```
CMS claims  ->  Label (LEIE)  ->  Clean  ->  Peer features  ->  Models  ->  Ranked queue  ->  Explanations
```

**Owners:** Akash and Shruti Pingle

---

## The idea

We are not trying to "detect all fraud." Given a fixed investigator budget (only the top few percent of providers can ever be reviewed), the goal is to **make that small slice as dense with real fraud as possible, and explain every flag.** That reframing drives every technical choice, which is why the headline metric is **precision at top-k**, not accuracy or AUC.

The unit of everything (labels, features, scores, queue) is the **provider**.

## Data: real-world, not a toy dataset

We build on **real US government data**, with no PHI:

| Role | Source | What it is |
|---|---|---|
| **Features** | [CMS Medicare Physician & Other Practitioners - by Provider](https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners/medicare-physician-other-practitioners-by-provider) (Part B) | One row per provider (NPI) per year with real billing/utilization aggregates. ~1.2M providers/year. |
| **Labels** | [OIG LEIE](https://oig.hhs.gov/exclusions/exclusions_list.asp) | Providers excluded from federal health programs. Joined on NPI to build the fraud label. |

Real claims data has no "fraud" column, so we **construct the label** by joining CMS to the LEIE on NPI and keeping fraud-related exclusion types. Pooling **2019-2023** gives a **6.0M provider-year panel with 1,275 fraud provider-years (473 unique fraud providers)** - a ~0.02% fraud rate, the extreme imbalance this project is designed for. See [`data/README.md`](data/README.md) for full provenance.

> The original plan also referenced the Kaggle "Healthcare Provider Fraud Detection" set and CMS DE-SynPUF ([`SynPUF_DUG.pdf`](SynPUF_DUG.pdf)) as alternatives. We moved to CMS + LEIE for a defensible, real-world dataset.

## Pipeline

Everything is reproducible from `src/`:

```bash
pip install -r requirements.txt

# 1. Download CMS Part B (per year) + OIG LEIE into data/raw/
for y in 2019 2020 2021 2022 2023; do python src/download_data.py --year $y; done

# 2. Join CMS + LEIE into a labeled provider-year panel
python src/build_dataset.py --pool 2019,2020,2021,2022,2023

# 3. Quality-check + conservative cleaning + Layer 1 ratio features
python src/prepare_data.py --in data/processed/provider_year_panel_2019_2023_clean.parquet  # see note

# 4. Layer 2 peer-relative features (z-score / percentile / peer-median ratio)
python src/build_features.py --in data/processed/provider_year_panel_2019_2023_clean.parquet

# 5. Train + evaluate the supervised models (top-k precision)
python src/train_model.py --in data/processed/provider_year_panel_2019_2023_features.parquet
```

| Script | Does |
|---|---|
| `src/download_data.py` | Fetches CMS Part B (any year) + OIG LEIE. |
| `src/build_dataset.py` | NPI join + LEIE fraud labeling; `--pool` builds the multi-year panel with temporal labeling. |
| `src/prepare_data.py` | Data-quality report, conservative cleaning, Layer 1 absolute ratios. |
| `src/build_features.py` | Layer 2 peer-relative features within each specialty x year peer group. |
| `src/build_temporal_features.py` | Provider trajectory features (trend, volatility, year-over-year jumps). |
| `src/train_model.py` | Provider-grouped split, RUS imbalance handling, fits via BreezeML, top-k evaluation. |
| `src/train_pu.py` | Positive-Unlabeled (PU) bagging A/B vs the supervised baseline, multi-seed. |
| `src/train_anomaly.py` | Unsupervised Isolation Forest track + two-track combination. |
| `src/train_nnpu.py` | Neural non-negative PU learning (Kiryo 2017), PyTorch. |
| `src/explain_shap.py` | SHAP global importance + per-provider "why flagged" reasons. |
| `src/score_providers.py` | Scores providers and exports the ranked worklist for the web app. |

## Feature engineering

- **Layer 1 (absolute):** `pay_per_service`, `pay_per_bene`, `services_per_bene`, `charge_to_payment`.
- **Layer 2 (peer-relative) - the layer that makes it work:** for 11 base metrics, the z-score, percentile rank, and peer-median ratio **within each (specialty, year) peer group**, so a provider is compared to genuine peers, not the whole population.

The peer features carry strong, learnable signal in the tail where fraud lives:

| Peer feature | Fraud providers in their specialty's top 5% | Lift vs clean |
|---|---|---|
| `pay_per_bene` | 22.7% | **4.5x** |
| `services_per_bene` | 20.8% | **4.2x** |
| `tot_medicare_payment` | 17.2% | **3.4x** |

They also pre-write the Risk Explorer's plain-English reasons ("bills 2.5 SD above same-specialty peers").

## Modeling and results

Models are fit with **[BreezeML](https://github.com/venomez-viper/breezeml)** (our own
scikit-learn wrapper). Because BreezeML does not cover imbalance or top-k metrics,
we add the paper-backed pieces ourselves: a **provider-grouped split** (no NPI on
both sides), **random undersampling** of the majority on train (Johnson and
Khoshgoftaar 2019), and **top-k precision under class rarity** (Bauder and
Khoshgoftaar 2019).

### Train / test split

The 6.0M-row panel is split **75% train / 25% test**, grouped by **provider (NPI)**
using `GroupShuffleSplit`, so a provider's 2019-2023 rows never appear on both
sides (an assertion enforces this). Random undersampling is applied to the **train
side only**; the test set stays full and untouched at the true 0.022% prevalence,
so evaluation reflects real-world imbalance.

| | Provider-years | Known fraud |
|---|---|---|
| Train (75%) | 4,504,136 | 944 |
| Test (25%) | 1,501,666 | 331 |
| Train after RUS | ~19,800 | 944 |

Evaluated on the held-out, provider-grouped test set (1.5M provider-years, 331 known
fraud):

| Model | ROC-AUC | Top 1% caught | Top 5% caught | Top 10% caught |
|---|---|---|---|---|
| Logistic Regression (scaled) | 0.747 | 12.1% | 31.7% | 43.2% |
| **Gradient Boosting** | **0.809** | **17.2%** | **39.6%** | **55.6%** |
| XGBoost (scale_pos_weight) | 0.767 | 16.9% | 34.4% | 45.6% |

Gradient Boosting's **ROC-AUC of 0.809 matches the published Part B benchmark**
(Herland, Khoshgoftaar and Bauder 2018: 0.805 to 0.816). Reviewing the top 10% of
the ranked list surfaces ~56% of known fraud.

**Honest caveat on precision.** Absolute precision is low (top 1% ~0.4%) for two
real reasons, not model failure: test prevalence is 0.022% (so this is still ~17x
random), and the LEIE labels are incomplete (most real fraud is unlabeled and sits
in the data as "clean"), which understates precision. ROC-AUC and top-k recall are
the trustworthy signals here.

### Beyond the baseline: two tracks, explainability, and the PU breakthrough

**Positive-Unlabeled (PU) learning (our headline contribution).** The incomplete-label
problem is an opportunity. With positives + unlabeled and no true negatives, this is
really a PU problem, not supervised classification. PU bagging (many models, each on
all positives plus a fresh random sample of the unlabeled pool, averaged) beats a
matched supervised baseline on the mean of every metric. Over **5 random splits** it
wins **4 of 5** on top-1% recall, lifting it from ~15% to ~17% (a real, consistent,
if modest, gain). We report the robust multi-seed number, not the lucky single seed.

**Unsupervised anomaly track (Isolation Forest).** A label-free detector that flags
providers who look bizarre versus peers. With **zero labels** it catches **32% of
fraud in the top 10%** (ROC-AUC 0.68). Useful as a standalone second opinion, but see
the weighted-fusion result below: once the trajectory features are in, even a tuned
blend does not improve the prioritised worklist.

**Explainability (SHAP).** Every flag carries plain-English reasons. The top global
drivers are the **charge-to-payment ratio** and **services per beneficiary**, classic
over-billing and over-servicing signals (grounds the model in the right behaviour).

**Honest negative result (nnPU).** We also implemented the principled neural PU method
(non-negative PU, Kiryo 2017). It underperforms the tree-based methods (ROC-AUC 0.69
vs 0.82). The lesson: with only 944 positives on tabular data, gradient-boosted trees
beat deep learning, so **PU bagging on trees remains our best approach**.

**Temporal trajectory features (new headline result).** Exploiting the 2019-2023
panel, we add **leakage-safe, as-of** trajectory features per provider-year: the
least-squares slope, coefficient of variation, and largest year-over-year jump of
payment, services, beneficiaries, etc., each computed from *only that provider's own
billing up to and including that year* (never the future). Added to the PU-bagging
tree model, over the same **5 grouped splits** they lift:

| metric | behavioural only | + trajectory | lift |
|---|---|---|---|
| top-1% recall | 0.169 | **0.290** | **+72%** |
| top-5% recall | 0.374 | **0.503** | +0.129 |
| top-10% recall | 0.499 | **0.609** | +0.110 |
| ROC-AUC | 0.807 | **0.859** | +0.051 |

PU still wins 4/5 seeds. **We audited this large jump for leakage.** One feature,
`traj_years` (years billed so far), separated the classes as a *panel-position*
artifact: positives are gated to years at/before the exclusion year, so years-so-far
leaks where a row sits in the panel, not behaviour (it scored solo ROC-AUC 0.72). We
**dropped it**, and an ablation confirmed the lift *survives without it* (recall@1%
0.31 -> 0.33 on the audit seed). The real signal is the behavioural shape, led by the
**Medicare-payment trajectory slope** and **pay-per-beneficiary slope**. The table
above is the post-audit, defensible number. See `src/diag_temporal_leakage.py`.

**Weighted two-track fusion (honest null).** We swept the anomaly weight (0.00 to
0.50) on rank-normalised scores. Once the supervised ranker carries the trajectory
features, **no weighted blend with the Isolation Forest beats supervised-alone on
top-1%** (best weight = 0.00). The label-free track remains a useful independent
second opinion; it just does not improve the prioritised queue.

**Next:** an LLM investigator agent for richer per-provider writeups, and GNN
shared-patient ring detection.

## For collaborators (getting the data)

The labeled, model-ready data is shared via **Git LFS** (the 2.3 GB raw CSVs are not - they are regenerable with `download_data.py`).

```bash
git lfs install            # once per machine
git clone https://github.com/venomez-viper/Healthcare-Fraud-Analytics.git
# you now have data/processed/*.parquet (clean panel + single-year) and the LEIE
python src/build_features.py --in data/processed/provider_year_panel_2019_2023_clean.parquet
```

## Method at a glance

| Phase | What happens | Status |
|---|---|---|
| A. Data foundation | CMS Part B + LEIE -> labeled provider-year panel; conservative cleaning. | Done |
| B. Feature engineering | Absolute behavior + peer-relative position (z / percentile / median ratio). | Done |
| C. Modeling | Supervised (LogReg, GradientBoosting, XGBoost), PU bagging, Isolation Forest anomaly track, nnPU. | Done |
| D. Evaluation | Precision at top-k (1/5/10%) primary; grouped split; multi-seed robustness. | Done |
| E. Explainability | SHAP global importance + per-provider "why flagged" reasons. | Done |
| F. Risk Explorer | Ranked queue + per-provider detail + explanations (web app, live). | Live |
| G. Advanced | Temporal trajectory features (**+72% top-1% recall, leakage-audited**); weighted fusion (tested, null). | Done |
| H. Frontier | LLM investigator agent, GNN shared-patient ring detection. | Planned |

## Repository contents

| Path | Purpose |
|---|---|
| [`PROJECT.md`](PROJECT.md) | Canonical project document (scope, objective, method, success criteria). |
| [`RESEARCH.md`](RESEARCH.md) | Literature review (2024-2026) grounding each design choice. |
| `src/` | The reproducible data + feature + model pipeline. |
| `Makefile` | One-command wrapper around the `src/` pipeline (`make pipeline`, `make train`, `make help`). |
| `models/metrics.json` | Saved evaluation metrics for the trained models. |
| [`data/README.md`](data/README.md) | Data provenance, labeling logic, known characteristics. |
| [`CITATIONS.bib`](CITATIONS.bib) | BibTeX for the foundational papers. |
| `requirements.txt` | Python dependencies. |
| `SynPUF_DUG.pdf` | CMS DE-SynPUF data user guide (reference for the alternative dataset). |

## Tech stack

Python, pandas, scikit-learn, [BreezeML](https://github.com/venomez-viper/breezeml), XGBoost, SHAP, Matplotlib/Seaborn. Optional dashboard: Streamlit.

## Acknowledgments

This project implements established methods from the Medicare fraud research
community, primarily **Taghi M. Khoshgoftaar's group at Florida Atlantic
University**. The data construction, metric choices, imbalance handling, and
explanations come from their published work:

- **Matthew Herland, Taghi M. Khoshgoftaar, Richard A. Bauder.** *Big Data fraud detection using multiple Medicare data sources* (J. Big Data, 2018). Basis for the CMS Part B plus LEIE-on-NPI labeling.
- **Richard A. Bauder, Taghi M. Khoshgoftaar.** *The effects of class rarity on the evaluation of supervised healthcare fraud detection models* (J. Big Data, 2019). Basis for leading with top-k precision instead of accuracy.
- **Justin M. Johnson, Taghi M. Khoshgoftaar.** *Medicare fraud detection using neural networks* (J. Big Data, 2019). Basis for ROS / RUS / ROS-RUS sampling under extreme imbalance.
- **John T. Hancock, Taghi M. Khoshgoftaar.** *Explainable machine learning models for Medicare fraud detection* (J. Big Data, 2023). Basis for the SHAP per-provider explanations.

Frontier methods for the stretch goals (GNN fraud rings, LLM investigator agents,
conformal triage) and full citations are in [`RESEARCH.md`](RESEARCH.md).

---

See [`PROJECT.md`](PROJECT.md) for the full plan and working agreements.
