"""
Download the real-world source data for the Healthcare Provider Fraud Risk Explorer.

Sources (both public, no PHI):
  1. CMS Medicare Physician & Other Practitioners - by Provider (Part B).
     One row per provider (NPI) per year, with billing/utilization aggregates.
  2. OIG LEIE (List of Excluded Individuals/Entities).
     Providers barred from federal health programs; the source of our fraud labels.

The raw files are large and are NOT committed to git (see .gitignore). Run this
script to (re)create data/raw locally.

Usage:
    python src/download_data.py            # default year (2023)
    python src/download_data.py --year 2024
"""
from __future__ import annotations

import argparse
import sys
import urllib.request
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"

# CMS "by Provider" Part B CSV distributions, keyed by data year.
# Source: https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners
CMS_BY_PROVIDER = {
    2024: "https://data.cms.gov/sites/default/files/2026-05/7323ba02-52e7-4a86-b2ce-ad210c25d9aa/MUP_PHY_R26_P05_V10_D24_Prov.csv",
    2023: "https://data.cms.gov/sites/default/files/2025-04/22edfd1e-d17a-4478-ad6b-92cac2a5a3c4/MUP_PHY_R25_P05_V20_D23_Prov.csv",
    2022: "https://data.cms.gov/sites/default/files/2025-11/adcd20c5-4534-43cd-8dfa-881ebe7bacfd/MUP_PHY_R25_P07_V20_D22_Prov.csv",
    2021: "https://data.cms.gov/sites/default/files/2025-11/fc6ea9aa-12f0-4c2f-9909-6c8e06c961cf/MUP_PHY_R25_P07_V20_D21_Prov.csv",
    2020: "https://data.cms.gov/sites/default/files/2025-11/056e8c6b-7e39-4945-b9a4-52d0a1cbbb9a/MUP_PHY_R25_P07_V20_D20_Prov.csv",
    2019: "https://data.cms.gov/sites/default/files/2025-11/ac110c46-3429-4f3c-9348-56f0a5312cb8/MUP_PHY_R25_P07_V20_D19_Prov.csv",
}

# OIG LEIE: the full current exclusion list, refreshed monthly.
# Source: https://oig.hhs.gov/exclusions/exclusions_list.asp
LEIE_URL = "https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv"


def _download(url: str, dest: Path) -> None:
    if dest.exists():
        size_mb = dest.stat().st_size / 1e6
        print(f"  already present, skipping: {dest.name} ({size_mb:.1f} MB)")
        return
    print(f"  downloading {dest.name} ...")
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp, open(dest, "wb") as out:
        chunk = 1 << 20
        while True:
            data = resp.read(chunk)
            if not data:
                break
            out.write(data)
    print(f"  done: {dest.name} ({dest.stat().st_size / 1e6:.1f} MB)")


def main() -> int:
    parser = argparse.ArgumentParser(description="Download CMS Part B + OIG LEIE source data.")
    parser.add_argument("--year", type=int, default=2023, choices=sorted(CMS_BY_PROVIDER),
                        help="CMS data year to download (default: 2023)")
    args = parser.parse_args()

    print("LEIE exclusions:")
    _download(LEIE_URL, RAW_DIR / "LEIE_exclusions.csv")

    print(f"CMS Part B by Provider ({args.year}):")
    _download(CMS_BY_PROVIDER[args.year], RAW_DIR / f"CMS_PartB_byProvider_{args.year}.csv")

    print("\nAll downloads complete. Next: python src/build_dataset.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
