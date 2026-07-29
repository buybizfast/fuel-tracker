#!/usr/bin/env python3
"""
EIA Fuel Data Updater
---------------------
Run this every Monday after EIA releases new data (~9am ET).
It downloads the latest Excel files directly from EIA, parses them,
and redeploys to Vercel automatically.

Usage:
    python3 update-data.py
"""

import urllib.request, xlrd, json, subprocess, sys, os
from datetime import datetime

DIESEL_URL  = "https://www.eia.gov/petroleum/gasdiesel/xls/psw18vwall.xls"
GAS_URL     = "https://www.eia.gov/petroleum/gasdiesel/xls/pswrgvwall.xls"
DIESEL_FILE = "/tmp/psw18vwall.xls"
GAS_FILE    = "/tmp/pswrgvwall.xls"

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_DIR    = os.path.join(SCRIPT_DIR, "src", "data")

def excel_date(n):
    return xlrd.xldate_as_datetime(float(n), 0).strftime("%Y-%m-%d")

def download(url, dest):
    print(f"  Downloading {url} ...")
    urllib.request.urlretrieve(url, dest)

def parse_diesel(path):
    wb = xlrd.open_workbook(path)
    ws = wb.sheet_by_name("Data 1")
    regions = {
        1:"National", 2:"East Coast", 3:"New England", 4:"Central Atlantic",
        5:"Lower Atlantic", 6:"Midwest", 7:"Gulf Coast", 8:"Rocky Mountain",
        9:"West Coast", 10:"California", 11:"West Coast Ex-CA"
    }
    rows = []
    for i in range(3, ws.nrows):
        dv = ws.cell_value(i, 0)
        if not dv: continue
        row = {"date": excel_date(dv)}
        for col, name in regions.items():
            v = ws.cell_value(i, col)
            row[name] = round(float(v), 3) if v != "" else None
        rows.append(row)
    return rows

def parse_gasoline(path):
    wb = xlrd.open_workbook(path)
    ws = wb.sheet_by_name("Data 12")
    cols = {
        1:"National", 2:"East Coast", 3:"New England", 4:"Central Atlantic",
        5:"Lower Atlantic", 6:"Midwest", 7:"Gulf Coast", 8:"Rocky Mountain",
        9:"West Coast", 10:"California", 11:"Colorado", 12:"Florida",
        13:"Massachusetts", 14:"Minnesota", 15:"New York", 16:"Ohio",
        17:"Texas", 18:"Washington", 19:"Boston", 20:"Chicago",
        21:"Cleveland", 22:"Denver", 23:"Houston", 24:"Los Angeles",
        25:"Miami", 26:"New York City", 27:"San Francisco", 28:"Seattle"
    }
    rows = []
    for i in range(3, ws.nrows):
        dv = ws.cell_value(i, 0)
        if not dv: continue
        row = {"date": excel_date(dv)}
        for col, name in cols.items():
            v = ws.cell_value(i, col)
            row[name] = round(float(v), 3) if v != "" else None
        rows.append(row)
    return rows

def save(data, filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Saved {path}")

def main():
    print(f"\n{'='*50}")
    print(f"  EIA Fuel Data Update — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*50}\n")

    # 1. Download
    print("1. Downloading latest EIA files...")
    download(DIESEL_URL, DIESEL_FILE)
    download(GAS_URL, GAS_FILE)

    # 2. Parse
    print("\n2. Parsing data...")
    diesel = parse_diesel(DIESEL_FILE)
    gas    = parse_gasoline(GAS_FILE)
    print(f"  Diesel: {len(diesel)} weeks, latest {diesel[-1]['date']}, US=${diesel[-1]['National']}")
    print(f"  Gas:    {len(gas)} weeks, latest {gas[-1]['date']}, US=${gas[-1]['National']}")

    # 3. Save JSON
    print("\n3. Saving data files...")
    save({
        "source": "U.S. EIA On-Highway Diesel Prices",
        "url": "https://www.eia.gov/petroleum/gasdiesel/",
        "latest": diesel[-1],
        "history_52w": [r for r in diesel if r["date"] >= "2025-01-01"]
    }, "diesel.json")
    save({
        "source": "U.S. EIA Weekly Retail Gasoline Prices - All Grades",
        "url": "https://www.eia.gov/petroleum/gasdiesel/",
        "latest": gas[-1],
        "history_52w": [r for r in gas if r["date"] >= "2025-01-01"]
    }, "gasoline.json")

    # 4. Deploy
    print("\n4. Deploying to Vercel...")
    result = subprocess.run(
        ["npx", "vercel", "--prod"],
        cwd=SCRIPT_DIR,
        capture_output=False
    )
    if result.returncode == 0:
        print(f"\n✅ Done! Site updated at https://fuel-tracker-weld.vercel.app")
    else:
        print("\n❌ Deploy failed — check Vercel output above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
