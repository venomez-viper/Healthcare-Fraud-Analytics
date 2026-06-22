# Healthcare Provider Fraud Risk Explorer -- reproducible pipeline
#
# Thin wrapper around the documented `src/` commands so the end-to-end
# build is one command instead of a copy-pasted sequence. Every target
# calls the same scripts described in README.md; no logic lives here.
#
#   make install     # pip install -r requirements.txt
#   make pipeline    # dataset -> prepare -> features -> temporal -> score
#   make train       # train + evaluate the supervised models
#   make help        # list all targets
#
# Override the years or the model input on the command line, e.g.
#   make dataset YEARS="2022 2023" POOL=2022,2023

PYTHON ?= python
YEARS  ?= 2019 2020 2021 2022 2023
POOL   ?= 2019,2020,2021,2022,2023

PROC     := data/processed
PANEL    := $(PROC)/provider_year_panel_2019_2023.parquet
CLEAN    := $(PROC)/provider_year_panel_2019_2023_clean.parquet
FEATURES := $(PROC)/provider_year_panel_2019_2023_features.parquet
TEMPORAL := $(PROC)/provider_year_panel_2019_2023_features_temporal.parquet

# Trajectory features are the headline model input; override to use the
# behavioural-only features ($(FEATURES)) instead.
MODEL_IN ?= $(TEMPORAL)

.DEFAULT_GOAL := help

.PHONY: help install download dataset prepare features temporal \
        data train pu anomaly shap score pipeline

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install Python dependencies
	$(PYTHON) -m pip install -r requirements.txt

download: ## Fetch CMS Part B + OIG LEIE into data/raw/ for $(YEARS)
	@for y in $(YEARS); do $(PYTHON) src/download_data.py --year $$y; done

# --- data chain (file targets: each step rebuilds only if missing/stale) ---

$(PANEL): ## (internal) join CMS + LEIE into the labeled provider-year panel
	$(PYTHON) src/build_dataset.py --pool $(POOL)

$(CLEAN): $(PANEL)
	$(PYTHON) src/prepare_data.py --in $(PANEL)

$(FEATURES): $(CLEAN)
	$(PYTHON) src/build_features.py --in $(CLEAN)

$(TEMPORAL): $(FEATURES)
	$(PYTHON) src/build_temporal_features.py --in $(FEATURES)

dataset: $(PANEL)   ## Build the labeled provider-year panel
prepare: $(CLEAN)   ## Quality-check + conservative cleaning (Layer 1 features)
features: $(FEATURES) ## Add Layer 2 peer-relative features
temporal: $(TEMPORAL) ## Add leakage-safe trajectory features
data: $(TEMPORAL)   ## Full data build through trajectory features

# --- models + scoring ---

train: $(MODEL_IN) ## Train + evaluate the supervised models (top-k precision)
	$(PYTHON) src/train_model.py --in $(MODEL_IN)

pu: $(MODEL_IN) ## PU-bagging A/B vs the supervised baseline
	$(PYTHON) src/train_pu.py --in $(MODEL_IN)

anomaly: $(MODEL_IN) ## Unsupervised Isolation Forest track
	$(PYTHON) src/train_anomaly.py --in $(MODEL_IN)

shap: $(MODEL_IN) ## SHAP global + per-provider explanations
	$(PYTHON) src/explain_shap.py --in $(MODEL_IN)

score: $(MODEL_IN) ## Score providers + export the ranked worklist for the web app
	$(PYTHON) src/score_providers.py --in $(MODEL_IN)

pipeline: data score ## End-to-end: build data, then score the ranked worklist
