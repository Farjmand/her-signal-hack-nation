"""
One-time preprocessing step: downloads two public NHANES 2017-2018 files
(SAS Transport / .xpt format) and converts the columns this benchmark task
needs into a small CSV committed alongside this script.

This is NOT a runtime dependency of the HerSignal app or backend -- it is a
reproducible data-prep step, run once (or re-run to refresh/re-verify), whose
output (data/nhanes_2017_2018_reproductive.csv) is what benchmark/nhanes_stage
/run.ts actually reads.

Source (US government public domain, no credentialing required -- unlike
PhysioNet-hosted datasets such as mcPHASES):
  https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/RHQ_J.xpt
  https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/DEMO_J.xpt

Usage:
  python3 -m venv venv && source venv/bin/activate
  pip install -r requirements.txt
  python fetch_and_convert.py
"""
import os
import urllib.request

import pandas as pd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(SCRIPT_DIR, ".raw")
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
OUT_PATH = os.path.join(DATA_DIR, "nhanes_2017_2018_reproductive.csv")

SOURCES = {
    "RHQ_J.xpt": "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/RHQ_J.xpt",
    "DEMO_J.xpt": "https://wwwn.cdc.gov/Nchs/Data/Nhanes/Public/2017/DataFiles/DEMO_J.xpt",
}

# Only the columns this benchmark task's crosswalk (../labels.ts) needs.
RHQ_COLUMNS = ["SEQN", "RHQ031", "RHQ060"]
DEMO_COLUMNS = ["SEQN", "RIAGENDR", "RIDAGEYR"]


def download(filename: str, url: str) -> str:
    os.makedirs(RAW_DIR, exist_ok=True)
    path = os.path.join(RAW_DIR, filename)
    if not os.path.exists(path):
        print(f"Downloading {url} -> {path}")
        urllib.request.urlretrieve(url, path)
    else:
        print(f"Using cached {path}")
    return path


def main() -> None:
    rhq_path = download("RHQ_J.xpt", SOURCES["RHQ_J.xpt"])
    demo_path = download("DEMO_J.xpt", SOURCES["DEMO_J.xpt"])

    rhq = pd.read_sas(rhq_path, format="xport")[RHQ_COLUMNS]
    demo = pd.read_sas(demo_path, format="xport")[DEMO_COLUMNS]

    merged = rhq.merge(demo, on="SEQN", how="inner")
    merged = merged.rename(
        columns={
            "SEQN": "seqn",
            "RHQ031": "regular_periods",
            "RHQ060": "age_at_menopause",
            "RIAGENDR": "sex",
            "RIDAGEYR": "age_years",
        }
    )
    # Preserve NaN as truly empty rather than pandas' default float "NaN"
    # string, and keep whole-number columns as integers where present so the
    # CSV is readable without a schema.
    for col in ["seqn", "sex", "age_years"]:
        merged[col] = merged[col].astype("Int64")
    for col in ["regular_periods", "age_at_menopause"]:
        merged[col] = merged[col].astype("Int64")

    os.makedirs(DATA_DIR, exist_ok=True)
    merged.to_csv(OUT_PATH, index=False)
    print(f"Wrote {len(merged)} rows -> {OUT_PATH}")


if __name__ == "__main__":
    main()
