#\!/usr/bin/env python3
"""
C-KREA PayControl — Projection Validation Script (Step 6)
=========================================================
Compares portal database projections against the source-of-truth
C-KREA GB.xlsx spreadsheet. Catches mismatches in:
  - Monthly canon per unit
  - Discount amounts (contract-phase based)
  - Pronto pago amounts
  - Net receivable (canon - descuento - pronto_pago)

Usage:
  # Against the seed SQL (offline, no DB needed):
  python validate_projections.py --mode file

  # Against a live Supabase database:
  python validate_projections.py --mode db --url <SUPABASE_URL> --key <SERVICE_KEY>
"""

import argparse
import json
import os
import re
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

try:
    import pandas as pd
    import openpyxl
except ImportError:
    print("ERROR: pip install pandas openpyxl")
    sys.exit(1)


# ─── CONFIG ──────────────────────────────────────────────────────────────────

TOLERANCE_COP = 1.0  # Allow $1 COP rounding tolerance
EXCEL_FILE = "data/C-KREA GB.xlsx"
SHEET_NAME = "2. PROYECCION MENSUAL"
SEED_FILE = "002_seed_data.sql"
MONTHS = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
          'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']


# ─── LOAD SPREADSHEET (SOURCE OF TRUTH) ─────────────────────────────────────

def load_spreadsheet_projections(excel_path: str) -> dict:
    """
    Parse C-KREA GB 'PROYECCION MENSUAL' sheet.
    Returns: { 'LOC': { month_1: {canon, descuento, pp}, ... }, ... }
    """
    df = pd.read_excel(excel_path, sheet_name=SHEET_NAME, header=None, skiprows=2)
    df = df[df[0].notna()].copy()
    df[0] = df[0].astype(str).str.strip()

    # Filter out summary rows
    summary = ['CANON','DESCUENTOS','IVA','CXC','DCTO CXC','RETENCIONES',
               'CARTERA MOROSA','CARTERA CRITICA','RECAUDO','TOTAL']
    df = df[~df[0].isin(summary)]

    result = {}
    for _, row in df.iterrows():
        unit = row[0]
        months_data = {}
        for m_idx in range(12):
            base = 1 + (m_idx * 3)
            canon = float(row.iloc[base]) if pd.notna(row.iloc[base]) else 0.0
            desc  = float(row.iloc[base+1]) if pd.notna(row.iloc[base+1]) else 0.0
            pp    = float(row.iloc[base+2]) if pd.notna(row.iloc[base+2]) else 0.0
            months_data[m_idx + 1] = {
                'canon': round(canon, 2),
                'descuento': round(desc, 2),
                'pronto_pago': round(pp, 2),
                'neto': round(canon - desc - pp, 2),
            }
        result[unit] = months_data
    return result


# ─── LOAD PORTAL PROJECTIONS (FROM SEED SQL) ────────────────────────────────

def load_seed_projections(seed_path: str) -> dict:
    """
    Parse INSERT statements from 002_seed_data.sql for projections table.
    Returns same structure as load_spreadsheet_projections.
    """
    # We need to map unit_id UUIDs back to unit_numbers
    unit_map = {}  # uuid -> unit_number
    with open(seed_path, 'r') as f:
        content = f.read()

    # Extract unit inserts: unit_number from INSERT INTO units
    unit_pattern = re.compile(
        r"INSERT INTO units.*?VALUES\s*\(\s*'([^']+)'::uuid.*?'([^']+)'::uuid.*?'(\w+)'",
        re.DOTALL
    )
    for m in unit_pattern.finditer(content):
        uid, company, unit_num = m.group(1), m.group(2), m.group(3)
        unit_map[uid] = unit_num

    # Extract projection inserts
    proj_pattern = re.compile(
        r"INSERT INTO projections.*?VALUES\s*\("
        r".*?'([^']+)'::uuid"        # company_id
        r".*?"
        r"'([^']+)'::uuid"           # unit_id
        r",\s*(\d+),\s*(\d+)"        # year, month
        r",\s*([\d.]+)"              # canon
        r",\s*([\d.]+)"              # descuento
        r",\s*([\d.]+)",             # pronto_pago
        re.DOTALL
    )

    result = {}
    for m in proj_pattern.finditer(content):
        unit_id = m.group(2)
        year = int(m.group(3))
        month = int(m.group(4))
        canon = float(m.group(5))
        desc = float(m.group(6))
        pp = float(m.group(7))

        unit_num = unit_map.get(unit_id, unit_id[:8])
        if unit_num not in result:
            result[unit_num] = {}
        result[unit_num][month] = {
            'canon': round(canon, 2),
            'descuento': round(desc, 2),
            'pronto_pago': round(pp, 2),
            'neto': round(canon - desc - pp, 2),
        }
    return result


# ─── LOAD PORTAL PROJECTIONS (FROM LIVE DB) ─────────────────────────────────

def load_db_projections(url: str, key: str) -> dict:
    """
    Query projections + units from live Supabase.
    """
    try:
        import httpx
    except ImportError:
        print("ERROR: pip install httpx (needed for DB mode)")
        sys.exit(1)

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    # Get units
    r = httpx.get(f"{url}/rest/v1/units?select=id,unit_number", headers=headers)
    r.raise_for_status()
    unit_map = {u['id']: u['unit_number'] for u in r.json()}

    # Get projections
    r = httpx.get(
        f"{url}/rest/v1/projections?select=unit_id,year,month,canon_proyectado,descuento_proyectado,pronto_pago_proyectado&year=eq.2026",
        headers=headers
    )
    r.raise_for_status()

    result = {}
    for p in r.json():
        unit_num = unit_map.get(p['unit_id'], p['unit_id'][:8])
        if unit_num not in result:
            result[unit_num] = {}
        canon = float(p['canon_proyectado'])
        desc = float(p['descuento_proyectado'])
        pp = float(p['pronto_pago_proyectado'])
        result[unit_num][p['month']] = {
            'canon': round(canon, 2),
            'descuento': round(desc, 2),
            'pronto_pago': round(pp, 2),
            'neto': round(canon - desc - pp, 2),
        }
    return result


# ─── FINANCIAL RULES VALIDATION ─────────────────────────────────────────────

def validate_financial_rules(spreadsheet: dict) -> list:
    """
    Additional checks: discount & PP consistency with known business rules.
    """
    issues = []
    for unit, months in spreadsheet.items():
        for m, data in months.items():
            # PP should not exceed 30% of canon
            if data['canon'] > 0 and data['pronto_pago'] > 0:
                pp_pct = (data['pronto_pago'] / data['canon']) * 100
                if pp_pct > 30.5:  # small tolerance
                    issues.append({
                        'type': 'RULE_WARNING',
                        'unit': unit,
                        'month': m,
                        'message': f'Pronto pago {pp_pct:.1f}% exceeds 30% threshold',
                        'detail': f'canon={data["canon"]:,.0f}, pp={data["pronto_pago"]:,.0f}'
                    })
            # Discount should not exceed canon
            if data['descuento'] > data['canon'] and data['canon'] > 0:
                issues.append({
                    'type': 'RULE_ERROR',
                    'unit': unit,
                    'month': m,
                    'message': 'Discount exceeds canon',
                    'detail': f'canon={data["canon"]:,.0f}, desc={data["descuento"]:,.0f}'
                })
            # Neto should not be negative
            if data['neto'] < -TOLERANCE_COP and data['canon'] > 0:
                issues.append({
                    'type': 'RULE_WARNING',
                    'unit': unit,
                    'month': m,
                    'message': f'Negative net receivable: ${data["neto"]:,.0f}',
                    'detail': f'canon={data["canon"]:,.0f}, desc={data["descuento"]:,.0f}, pp={data["pronto_pago"]:,.0f}'
                })
    return issues


# ─── COMPARE ─────────────────────────────────────────────────────────────────

def compare_projections(spreadsheet: dict, portal: dict) -> dict:
    """
    Compare spreadsheet vs portal projection data.
    Returns summary with mismatches.
    """
    results = {
        'total_checks': 0,
        'passed': 0,
        'failed': 0,
        'missing_in_portal': [],
        'missing_in_spreadsheet': [],
        'mismatches': [],
        'sample_matches': [],
    }

    all_units = set(spreadsheet.keys()) | set(portal.keys())

    for unit in sorted(all_units):
        if unit not in portal:
            results['missing_in_portal'].append(unit)
            continue
        if unit not in spreadsheet:
            results['missing_in_spreadsheet'].append(unit)
            continue

        for month in range(1, 13):
            if month not in spreadsheet[unit]:
                continue
            if month not in portal.get(unit, {}):
                results['missing_in_portal'].append(f"{unit}/month-{month}")
                continue

            ss = spreadsheet[unit][month]
            pt = portal[unit][month]

            for field in ['canon', 'descuento', 'pronto_pago']:
                results['total_checks'] += 1
                diff = abs(ss[field] - pt[field])

                if diff <= TOLERANCE_COP:
                    results['passed'] += 1
                    # Collect a few sample matches
                    if len(results['sample_matches']) < 5 and ss[field] > 0:
                        results['sample_matches'].append({
                            'unit': unit,
                            'month': MONTHS[month-1],
                            'field': field,
                            'spreadsheet': ss[field],
                            'portal': pt[field],
                        })
                else:
                    results['failed'] += 1
                    results['mismatches'].append({
                        'unit': unit,
                        'month': MONTHS[month-1],
                        'field': field,
                        'spreadsheet': ss[field],
                        'portal': pt[field],
                        'diff': diff,
                    })

    return results


# ─── REPORT ──────────────────────────────────────────────────────────────────

def print_report(results: dict, rule_issues: list):
    """Pretty-print validation results."""
    W = 72
    print("=" * W)
    print("  C-KREA PayControl — Projection Validation Report")
    print("=" * W)

    total = results['total_checks']
    passed = results['passed']
    failed = results['failed']
    pct = (passed / total * 100) if total > 0 else 0

    print(f"\n  Total field-level checks:  {total:,}")
    print(f"  Passed:                    {passed:,} ({pct:.1f}%)")
    print(f"  Failed:                    {failed:,}")

    if results['missing_in_portal']:
        print(f"\n  Missing in portal ({len(results['missing_in_portal'])}):")
        for item in results['missing_in_portal'][:10]:
            print(f"    - {item}")
        if len(results['missing_in_portal']) > 10:
            print(f"    ... and {len(results['missing_in_portal']) - 10} more")

    if results['missing_in_spreadsheet']:
        print(f"\n  Extra in portal (not in spreadsheet): {results['missing_in_spreadsheet']}")

    # Sample matches
    if results['sample_matches']:
        print(f"\n  Sample Matches (showing portal = spreadsheet):")
        print(f"  {'Unit':<8} {'Month':<12} {'Field':<14} {'Value':>15}")
        print(f"  {'-'*8} {'-'*12} {'-'*14} {'-'*15}")
        for s in results['sample_matches']:
            print(f"  {s['unit']:<8} {s['month']:<12} {s['field']:<14} ${s['spreadsheet']:>13,.2f}")

    # Mismatches
    if results['mismatches']:
        print(f"\n  MISMATCHES ({len(results['mismatches'])}):")
        print(f"  {'Unit':<8} {'Month':<12} {'Field':<14} {'Spreadsheet':>15} {'Portal':>15} {'Diff':>12}")
        print(f"  {'-'*8} {'-'*12} {'-'*14} {'-'*15} {'-'*15} {'-'*12}")
        for mm in results['mismatches'][:25]:
            print(f"  {mm['unit']:<8} {mm['month']:<12} {mm['field']:<14} "
                  f"${mm['spreadsheet']:>13,.2f} ${mm['portal']:>13,.2f} ${mm['diff']:>10,.2f}")
        if len(results['mismatches']) > 25:
            print(f"  ... and {len(results['mismatches']) - 25} more mismatches")

    # Rule validation
    if rule_issues:
        errors = [i for i in rule_issues if i['type'] == 'RULE_ERROR']
        warnings = [i for i in rule_issues if i['type'] == 'RULE_WARNING']
        print(f"\n  Financial Rule Checks:")
        print(f"  Errors:   {len(errors)}")
        print(f"  Warnings: {len(warnings)}")
        for issue in (errors + warnings)[:10]:
            icon = "\!\!" if issue['type'] == 'RULE_ERROR' else "??"
            print(f"    {icon} Unit {issue['unit']} / {MONTHS[issue['month']-1]}: "
                  f"{issue['message']} ({issue['detail']})")

    # Final verdict
    print("\n" + "=" * W)
    if failed == 0 and not results['missing_in_portal']:
        print("  RESULT: ALL PROJECTIONS MATCH")
    elif failed == 0:
        print(f"  RESULT: PROJECTIONS MATCH (but {len(results['missing_in_portal'])} units missing in portal)")
    else:
        print(f"  RESULT: {failed} MISMATCHES FOUND — investigate before going live")
    print("=" * W)

    return failed == 0


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Validate C-KREA projections")
    parser.add_argument('--mode', choices=['file', 'db'], default='file',
                        help='file = compare seed SQL vs spreadsheet; db = compare live DB')
    parser.add_argument('--url', help='Supabase project URL (for db mode)')
    parser.add_argument('--key', help='Supabase service_role key (for db mode)')
    parser.add_argument('--excel', default=EXCEL_FILE, help='Path to C-KREA GB.xlsx')
    parser.add_argument('--seed', default=SEED_FILE, help='Path to 002_seed_data.sql')
    args = parser.parse_args()

    # Resolve paths relative to script location
    script_dir = Path(__file__).parent
    excel_path = script_dir / args.excel
    seed_path = script_dir / args.seed

    if not excel_path.exists():
        print(f"ERROR: Excel file not found: {excel_path}")
        sys.exit(1)

    print(f"Loading spreadsheet: {excel_path}")
    spreadsheet = load_spreadsheet_projections(str(excel_path))
    print(f"  -> {len(spreadsheet)} units loaded from spreadsheet")

    if args.mode == 'file':
        if not seed_path.exists():
            print(f"ERROR: Seed file not found: {seed_path}")
            sys.exit(1)
        print(f"Loading seed SQL: {seed_path}")
        portal = load_seed_projections(str(seed_path))
        print(f"  -> {len(portal)} units loaded from seed SQL")
    else:
        if not args.url or not args.key:
            print("ERROR: --url and --key required for db mode")
            sys.exit(1)
        print(f"Loading from Supabase: {args.url}")
        portal = load_db_projections(args.url, args.key)
        print(f"  -> {len(portal)} units loaded from database")

    print("\nComparing...")
    results = compare_projections(spreadsheet, portal)

    print("Running financial rule checks...")
    rule_issues = validate_financial_rules(spreadsheet)

    success = print_report(results, rule_issues)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
