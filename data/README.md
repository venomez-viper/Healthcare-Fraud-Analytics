# Data

Raw and processed data live here but are **not committed to git** (large files,
and CMS asks that its files not be redistributed). Recreate them locally with the
scripts in `../src`.

```
data/
  raw/         <- downloaded, untouched source files
  interim/     <- intermediate working files
  processed/   <- analysis-ready, provider-keyed labeled table
```

## How to recreate

Single year (the Risk Explorer ranking unit):
```bash
python src/download_data.py --year 2023
python src/build_dataset.py  --year 2023      # -> data/processed/provider_fraud_2023.parquet
```

Pooled 2019-2023 panel (the supervised modeling table, more positives):
```bash
for y in 2019 2020 2021 2022 2023; do python src/download_data.py --year $y; done
python src/build_dataset.py --pool 2019,2020,2021,2022,2023   # -> provider_year_panel_2019_2023.parquet
python src/prepare_data.py  --in data/processed/provider_year_panel_2019_2023.parquet  # -> *_clean.parquet
python src/build_features.py --in data/processed/provider_year_panel_2019_2023_clean.parquet  # -> *_features.parquet
```

The `*_features.parquet` (~1.3 GB) adds Layer 2 peer-relative features and is
regenerable, so it is not committed. The `*_clean.parquet` IS shared via LFS; run
`build_features.py` on it to get the full modeling matrix.

## Sources

| File | Source | What it is |
|---|---|---|
| `raw/CMS_PartB_byProvider_<year>.csv` | [CMS Medicare Physician & Other Practitioners - by Provider](https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners/medicare-physician-other-practitioners-by-provider) | One row per provider (NPI) with real billing/utilization aggregates. No PHI. ~470 MB/year. |
| `raw/LEIE_exclusions.csv` | [OIG LEIE](https://oig.hhs.gov/exclusions/exclusions_list.asp) | Providers excluded from federal health programs. Source of the fraud labels. Refreshed monthly. |

## How labels are made

Real claims data has no "fraud" column. We construct it by joining CMS to the LEIE
on **NPI**:

- `excluded_any` = 1 if the provider is in the LEIE for any reason.
- `fraud_label`  = 1 if the provider is in the LEIE for a **fraud-related** exclusion
  authority (`1128a1`, `1128a3`, `1128b1`, `1128b7`, `1128b8`). License-only
  revocations (`1128b4`) are deliberately excluded from `fraud_label`. Edit
  `FRAUD_EXCLTYPES` in `src/build_dataset.py` to change this.

## Known characteristics (read before modeling)

- **Extreme imbalance.** For 2023, ~91 fraud-labeled providers out of ~1.26M
  (~0.007%). This is real, not a bug: excluded providers largely stop billing, so
  only those excluded shortly *after* the data year still appear. This is exactly
  why the project leads with **top-k precision** and an **anomaly-detection track**
  rather than accuracy.
- **LEIE NPI coverage is partial.** ~74,000 of ~83,000 LEIE records carry a
  placeholder NPI (`0000000000`) and cannot be joined. Only ~8,500 are joinable.
- **Pooling fixes the sparsity.** The 2019-2023 panel has **6.0M provider-years**
  with **1,275 fraud provider-years across 473 unique fraud providers** (~0.021%).
  Labeling is temporal: a provider-year is flagged fraud only at/before the
  exclusion year, capturing pre-exclusion billing. This matches published Medicare
  Part B fraud benchmarks.
- **The signal is real.** Fraud providers bill ~2x the services, ~6.5 services per
  beneficiary (vs ~2.7 for clean providers), and higher total payments.
