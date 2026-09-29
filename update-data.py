#!/usr/bin/env python3
"""
EIA Fuel Data Updater
---------------------
Downloads the weekly EIA retail price workbooks, parses them, records
freshness metadata, and redeploys to Vercel.

Safety: the JSON files are only overwritten once the freshly parsed data
passes validation. A failed download, a malformed workbook, or data that
looks wrong leaves the previous good data in place, and the site then
surfaces it as stale rather than showing nothing or showing placeholders.

Usage:
    python3 update-data.py
"""

import urllib.request, xlrd, json, subprocess, sys, os, re, datetime

DIESEL_URL  = "https://www.eia.gov/petroleum/gasdiesel/xls/psw18vwall.xls"
GAS_URL     = "https://www.eia.gov/petroleum/gasdiesel/xls/pswrgvwall.xls"
LANDING_URL = "https://www.eia.gov/petroleum/gasdiesel/"
DIESEL_FILE = "/tmp/psw18vwall.xls"
GAS_FILE    = "/tmp/pswrgvwall.xls"

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_DIR    = os.path.join(SCRIPT_DIR, "src", "data")

# Charts start here; EIA history runs back to 1994 and we don't need all of it.
HISTORY_START = "2025-01-01"

# Sanity bounds for a US retail price per gallon. Anything outside this means
# the workbook layout changed and the parse should not be trusted.
MIN_PRICE, MAX_PRICE = 0.50, 25.00


def excel_date(n):
    return xlrd.xldate_as_datetime(float(n), 0).strftime("%Y-%m-%d")


def download(url, dest):
    print(f"  Downloading {url} ...")
    urllib.request.urlretrieve(url, dest)


def fetch_release_dates():
    """Scrape EIA's published release dates. Returns {} if unavailable."""
    try:
        req = urllib.request.Request(LANDING_URL, headers={"User-Agent": "Mozilla/5.0"})
        html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    except Exception as e:
        print(f"  ! Could not fetch release dates ({e}); will record null")
        return {}

    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
    out = {}
    for key, label in [("diesel", "Diesel Fuel Release Date"), ("gasoline", "Gasoline Release Date")]:
        m = re.search(re.escape(label) + r"\s*:?\s*([A-Z][a-z]+ \d{1,2}, \d{4})", text)
        if m:
            try:
                out[key] = datetime.datetime.strptime(m.group(1), "%B %d, %Y").strftime("%Y-%m-%d")
            except ValueError:
                pass
    m = re.search(r"Next Release Date\s*:?\s*([A-Z][a-z]+ \d{1,2}, \d{4})", text)
    if m:
        try:
            out["next"] = datetime.datetime.strptime(m.group(1), "%B %d, %Y").strftime("%Y-%m-%d")
        except ValueError:
            pass
    return out


def parse_sheet(path, sheet, cols, expect_header_contains):
    """Parse a workbook sheet, verifying the column layout before trusting it."""
    ws = xlrd.open_workbook(path).sheet_by_name(sheet)

    # Guard against EIA reordering columns: row 2 holds the series descriptions.
    for col, token in expect_header_contains.items():
        header = str(ws.cell_value(2, col)) if col < ws.ncols else ""
        if token.lower() not in header.lower():
            raise ValueError(
                f"{sheet} column {col} expected to contain '{token}' but reads '{header}'. "
                "EIA may have changed the workbook layout; refusing to write data."
            )

    rows = []
    for i in range(3, ws.nrows):
        dv = ws.cell_value(i, 0)
        if not dv:
            continue
        row = {"date": excel_date(dv)}
        for col, name in cols.items():
            v = ws.cell_value(i, col)
            row[name] = round(float(v), 3) if v != "" else None
        rows.append(row)
    return rows


def validate(rows, label):
    """Reject an obviously broken parse before it can overwrite good data."""
    if len(rows) < 100:
        raise ValueError(f"{label}: only {len(rows)} rows parsed; expected a long history")

    nat = [r["National"] for r in rows[-52:] if r["National"] is not None]
    if not nat:
        raise ValueError(f"{label}: no National prices in the most recent year")
    if not all(MIN_PRICE <= p <= MAX_PRICE for p in nat):
        raise ValueError(f"{label}: National price outside {MIN_PRICE}-{MAX_PRICE} sanity range")

    if rows[-1]["National"] is None:
        raise ValueError(f"{label}: newest row has no National price")

    dates = [r["date"] for r in rows]
    if dates != sorted(dates):
        raise ValueError(f"{label}: dates are not in ascending order")
    return True


DIESEL_COLS = {1:"National",2:"East Coast",3:"New England",4:"Central Atlantic",5:"Lower Atlantic",
               6:"Midwest",7:"Gulf Coast",8:"Rocky Mountain",9:"West Coast",10:"California",
               11:"West Coast Ex-CA"}
DIESEL_CHECK = {1:"U.S.", 6:"Midwest", 10:"California"}

GAS_COLS = {1:"National",2:"East Coast",3:"New England",4:"Central Atlantic",5:"Lower Atlantic",
            6:"Midwest",7:"Gulf Coast",8:"Rocky Mountain",9:"West Coast",10:"California",
            11:"Colorado",12:"Florida",13:"Massachusetts",14:"Minnesota",15:"New York",16:"Ohio",
            17:"Texas",18:"Washington",19:"Boston",20:"Chicago",21:"Cleveland",22:"Denver",
            23:"Houston",24:"Los Angeles",25:"Miami",26:"New York City",27:"San Francisco",
            28:"Seattle"}
GAS_CHECK = {1:"U.S.", 17:"Texas", 28:"Seattle"}


def save(data, filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Saved {path}")


def main():
    now = datetime.datetime.now(datetime.timezone.utc)
    print(f"\n{'='*52}")
    print(f"  EIA Fuel Data Update - {now.astimezone().strftime('%Y-%m-%d %H:%M %Z')}")
    print(f"{'='*52}\n")

    print("1. Downloading latest EIA files...")
    download(DIESEL_URL, DIESEL_FILE)
    download(GAS_URL, GAS_FILE)

    print("\n2. Reading EIA release dates...")
    releases = fetch_release_dates()
    print(f"  diesel released: {releases.get('diesel') or 'unknown'}"
          f" | gasoline released: {releases.get('gasoline') or 'unknown'}"
          f" | next: {releases.get('next') or 'unknown'}")

    print("\n3. Parsing and validating...")
    diesel = parse_sheet(DIESEL_FILE, "Data 1", DIESEL_COLS, DIESEL_CHECK)
    gas    = parse_sheet(GAS_FILE, "Data 12", GAS_COLS, GAS_CHECK)
    validate(diesel, "diesel")
    validate(gas, "gasoline")
    print(f"  Diesel: {len(diesel)} weeks, latest {diesel[-1]['date']}, US=${diesel[-1]['National']}")
    print(f"  Gas:    {len(gas)} weeks, latest {gas[-1]['date']}, US=${gas[-1]['National']}")

    stamp = now.isoformat(timespec="seconds").replace("+00:00", "Z")

    print("\n4. Saving data files...")
    save({
        "source": "U.S. EIA Weekly Retail On-Highway Diesel Prices",
        "url": LANDING_URL,
        "meta": {
            "series": "Weekly U.S. No 2 Diesel Retail Prices (Dollars per Gallon)",
            "source_url": LANDING_URL,
            "workbook_url": DIESEL_URL,
            "observation_date": diesel[-1]["date"],
            "release_date": releases.get("diesel"),
            "next_release_date": releases.get("next"),
            "refreshed_at": stamp,
        },
        "latest": diesel[-1],
        "history": [r for r in diesel if r["date"] >= HISTORY_START],
    }, "diesel.json")

    save({
        "source": "U.S. EIA Weekly Retail Gasoline Prices - All Grades",
        "url": LANDING_URL,
        "meta": {
            "series": "Weekly U.S. All Grades All Formulations Retail Gasoline Prices (Dollars per Gallon)",
            "source_url": LANDING_URL,
            "workbook_url": GAS_URL,
            "observation_date": gas[-1]["date"],
            "release_date": releases.get("gasoline"),
            "next_release_date": releases.get("next"),
            "refreshed_at": stamp,
        },
        "latest": gas[-1],
        "history": [r for r in gas if r["date"] >= HISTORY_START],
    }, "gasoline.json")

    print("\n5. Deploying to Vercel...")
    result = subprocess.run(["npx", "vercel", "--prod"], cwd=SCRIPT_DIR, capture_output=False)
    if result.returncode == 0:
        print(f"\nDone. Site updated at https://www.fsctracker.com")
    else:
        print("\nDeploy failed - check Vercel output above.")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        # Leave the previous good JSON untouched; the site shows a stale notice.
        print(f"\nUPDATE ABORTED: {e}")
        print("Existing data left unchanged.")
        sys.exit(1)
