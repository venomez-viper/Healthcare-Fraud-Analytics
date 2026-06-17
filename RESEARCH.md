# Research Foundation: Literature Review
## Healthcare Provider Fraud Risk Explorer

**Compiled by:** Akash and Shruti Pingle
**Scope:** The foundational methods this repo directly implements (2018 to 2023), plus current frontier work (2024 to 2026) for the stretch goals, all grounding the design choices in PROJECT.md

> This is the evidence base. Each thing we build maps to a real, published paper, and we credit the authors who established the method.

---

## 0. Foundational methods we directly implement (and credit)

Our actual pipeline (CMS Medicare Part B "by Provider" joined to the OIG LEIE on
NPI, provider-level labeling, extreme class imbalance, top-k / class-rarity
evaluation) follows the body of work from **Taghi M. Khoshgoftaar's group at
Florida Atlantic University**. We are standing on their shoulders.

| What we built | Paper we implement | Authors we credit |
|---|---|---|
| CMS Part B + LEIE NPI labeling, provider-level, LR baseline | *Big Data fraud detection using multiple Medicare data sources*, **J. Big Data** 5:29, 2018 | **Matthew Herland, Taghi M. Khoshgoftaar, Richard A. Bauder** |
| Why we lead with top-k precision under class rarity (not accuracy) | *The effects of class rarity on the evaluation of supervised healthcare fraud detection models*, **J. Big Data** 6:21, 2019 | **Richard A. Bauder, Taghi M. Khoshgoftaar** |
| Imbalance handling: random over/under-sampling (ROS / RUS / ROS-RUS), class weighting | *Medicare fraud detection using neural networks*, **J. Big Data** 6:63, 2019 | **Justin M. Johnson, Taghi M. Khoshgoftaar** |
| Per-provider SHAP "why flagged" explanations | *Explainable machine learning models for Medicare fraud detection*, **J. Big Data** 10:154, 2023 | **John T. Hancock, Taghi M. Khoshgoftaar** |

These four papers are why the project is shaped the way it is: the 99.97 / 0.03
imbalance, the LEIE-as-labels construction, the top-k metric, and the mandatory
explanations are all established results, not our invention.

## 1. The problem is large, and the literature agrees on the hard parts

- **Scale:** An estimated **3 to 10 percent of US healthcare spending, roughly 300 billion dollars per year**, is lost to fraud. Source: systematic review, *Artificial Intelligence in Medicine*, 2025.
- **The three recurring challenges** named across reviews: **class imbalance, scarce/incomplete labels, and interpretability**. Reviews explicitly recommend **explainable AI** as the top future direction. This is exactly why our design leads with top-k precision and mandatory explanations.

## 2. Where the field actually is (the survey view)

- A 2025 *Journal of Big Data* review covers **22 techniques published Dec 2017 to Oct 2024**, grouping them into **supervised (deep learning, graph-based, meta-learning), unsupervised, and semi-supervised**. Graph-based and ensemble methods are highlighted as strong performers.
- Takeaway: our **two-track (supervised + anomaly) plus graph plus LLM** stack is aligned with the current frontier, not a tutorial rehash.

## 3. Evidence for each cutting-edge feature we plan

| Feature in our plan | Supporting paper | What it establishes |
|---|---|---|
| **Graph / GNN ring detection** | *Fraud detection and explanation in medical claims using GNN architectures*, Scientific Reports, 2025 | Models patients, providers, diagnoses, and services as a heterogeneous graph; GNNs detect fraud AND yield explanations |
| **Heterogeneous graph learning** | *Multi-channel heterogeneous graph structure learning (MHGSL)*, Heliyon, 2024 (PMC11061682) | Multi-channel graph fusion captures complex provider-claim relationships, improving accuracy |
| **LLM investigator agent** | *FAA: Fraud Analysis Agent*, arXiv:2506.11635, 2025 | An LLM agent runs a multi-step investigation with tools and writes human-readable reports, moving past binary labels |
| **Conformal confidence + triage** | *Integrated Transparency and Confidence Framework (ITCF)*, Technologies, 2025 | Combines explainability with conformal abstention and entropy to route ambiguous cases to humans |
| **Generative augmentation / red-team** | *An attack method for medical insurance claim fraud detection based on GANs*, arXiv:2506.19871, 2025 | Generative models both attack and augment medical-claims fraud detectors |
| **Unsupervised anomaly detection** | *Unsupervised anomaly detection of healthcare providers using GANs*, PMC7134221 | Flags providers diverging from peers without any labels |

## 4. What this means for our build

1. **We are not guessing.** Graph neural networks, LLM investigation agents, and conformal uncertainty are precisely where 2025 to 2026 fraud research is heading.
2. **Explainability is the consensus priority**, which validates making per-provider explanations non-negotiable.
3. **Class imbalance and label scarcity are universal**, which is why our anomaly track, synthetic fraud injection, and generative augmentation are well-motivated rather than gimmicks.

## 5. Full reference list

1. Fraud detection in healthcare claims using machine learning: a systematic review. *Artificial Intelligence in Medicine*, 2025. doi:10.1016/j.artmed.2024.103061
2. A review of distinct machine learning classifiers for healthcare fraud detection. *Journal of Big Data*, 2025. doi:10.1186/s40537-025-01295-3
3. Fraud detection and explanation in medical claims using GNN architectures. *Scientific Reports*, 2025. doi:10.1038/s41598-025-22910-6
4. Health insurance fraud detection based on multi-channel heterogeneous graph structure learning. *Heliyon*, 2024. PMC11061682
5. Shuster et al. FAA: a large language model-based fraud analysis agent. arXiv:2506.11635, 2025
6. Integrating model explainability and uncertainty quantification for trustworthy fraud detection. *Technologies*, 2025. doi:10.3390/technologies14040212
7. An attack method for medical insurance claim fraud detection based on generative adversarial networks. arXiv:2506.19871, 2025
8. Unsupervised anomaly detection of healthcare providers using generative adversarial networks. PMC7134221
9. LLM-assisted financial fraud detection with reinforcement learning. *Algorithms*, 2025, 18(12):792
10. CMS Linkable 2008 to 2010 Medicare DE-SynPUF User Manual, 2013 (in this folder: SynPUF_DUG.pdf)

### Foundational methods (Section 0)

11. Herland M, Khoshgoftaar TM, Bauder RA. Big Data fraud detection using multiple Medicare data sources. *Journal of Big Data*, 2018, 5:29. doi:10.1186/s40537-018-0138-3
12. Bauder RA, Khoshgoftaar TM. The effects of class rarity on the evaluation of supervised healthcare fraud detection models. *Journal of Big Data*, 2019, 6:21. doi:10.1186/s40537-019-0181-8
13. Johnson JM, Khoshgoftaar TM. Medicare fraud detection using neural networks. *Journal of Big Data*, 2019, 6:63. doi:10.1186/s40537-019-0225-0
14. Hancock JT, Khoshgoftaar TM. Explainable machine learning models for Medicare fraud detection. *Journal of Big Data*, 2023, 10:154. doi:10.1186/s40537-023-00821-5
