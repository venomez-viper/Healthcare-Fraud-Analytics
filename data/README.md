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

```bash
python src/download_data.py --year 2023     # pulls CMS Part B + OIG LEIE into data/raw
python src/build_dataset.py  --year 2023     # joins them -> data/processed/provider_fraud_2023.parquet
```

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
- **To grow the positive set**, pool multiple data years (2019-2023) so providers
  who billed in earlier years and were later excluded are captured. See the
  multi-year note in the project plan.
