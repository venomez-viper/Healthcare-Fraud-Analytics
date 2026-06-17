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
```

| Script | Does |
|---|---|
| `src/download_data.py` | Fetches CMS Part B (any year) + OIG LEIE. |
| `src/build_dataset.py` | NPI join + LEIE fraud labeling; `--pool` builds the multi-year panel with temporal labeling. |
| `src/prepare_data.py` | Data-quality report, conservative cleaning, Layer 1 absolute ratios. |
| `src/build_features.py` | Layer 2 peer-relative features within each specialty x year peer group. |

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
| C. Modeling | Supervised (LogReg -> XGBoost) + anomaly detection (Isolation Forest). | Next |
| D. Evaluation | Precision at top-k (1/5/10%) primary; grouped split so providers don't leak. | Next |
| E. Risk Explorer | Ranked queue + per-provider detail view + SHAP and peer-deviation explanations. | Planned |

## Repository contents

| Path | Purpose |
|---|---|
| [`PROJECT.md`](PROJECT.md) | Canonical project document (scope, objective, method, success criteria). |
| [`RESEARCH.md`](RESEARCH.md) | Literature review (2024-2026) grounding each design choice. |
| `src/` | The reproducible data + feature pipeline. |
| [`data/README.md`](data/README.md) | Data provenance, labeling logic, known characteristics. |
| `requirements.txt` | Python dependencies. |
| `SynPUF_DUG.pdf` | CMS DE-SynPUF data user guide (reference for the alternative dataset). |

## Tech stack

Python, pandas, scikit-learn, XGBoost, SHAP, Matplotlib/Seaborn. Optional dashboard: Streamlit.

## Acknowledgments — standing on their shoulders

This project implements established methods from the Medicare-fraud research
community, above all **Taghi M. Khoshgoftaar's group at Florida Atlantic
University**. The data construction, metric choices, imbalance handling, and
explanations here are their results, not ours. Credit where it is due:

- **Matthew Herland, Taghi M. Khoshgoftaar, Richard A. Bauder** — *Big Data fraud detection using multiple Medicare data sources* (J. Big Data, 2018). The CMS Part B + LEIE-on-NPI labeling we build on.
- **Richard A. Bauder, Taghi M. Khoshgoftaar** — *The effects of class rarity on the evaluation of supervised healthcare fraud detection models* (J. Big Data, 2019). Why we lead with top-k precision, not accuracy.
- **Justin M. Johnson, Taghi M. Khoshgoftaar** — *Medicare fraud detection using neural networks* (J. Big Data, 2019). ROS / RUS / ROS-RUS sampling for extreme imbalance.
- **John T. Hancock, Taghi M. Khoshgoftaar** — *Explainable machine learning models for Medicare fraud detection* (J. Big Data, 2023). The SHAP "why flagged" explanations.

Frontier methods for the stretch goals (GNN fraud rings, LLM investigator agents,
conformal triage) and full citations are in [`RESEARCH.md`](RESEARCH.md).

---

See [`PROJECT.md`](PROJECT.md) for the full plan and working agreements.
