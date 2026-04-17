#!/usr/bin/env python3
"""
C-Krea DB Import Script
Reads Excel PROYECCION 2026, truncates target tables, and inserts tenants, units, contracts, projections.
"""

import pandas as pd
import psycopg2
import psycopg2.extras
from datetime import datetime
import sys

COMPANY_ID = '00000000-0000-0000-0000-000000000001'
DB_URL = 'postgresql://postgres:XsVQs2FPFGRsmmt5@db.bosylehvmtwtqkrlievy.supabase.co:5432/postgres'
EXCEL_PATH = '/Users/workspace/Ckrea-portal/C-KREA GB.xlsx'

# ─── STEP 1: Read Excel ───────────────────────────────────────────────────────

print("STEP 1: Reading Excel...")

df = pd.read_excel(EXCEL_PATH, sheet_name='PROYECCION 2026', header=None)

# Data rows start at row index 3 (0-based), header is row 2
# Column mapping (0-based):
# 7  = CLASIFICACIÓN
# 9  = FACTURA
# 10 = ENTRADA
# 11 = LOCAL
# 12 = ARRENDATARIO
# 13 = FECHA INICIO LINEA DE TIEMPO
# 16 = Descripción
# 17 = VALOR CANON ACTUAL
# 18 = INCREMENTO IPC
# 19 = FECHA INCREMENTO IPC
# 21 = IVA
# 24 = PROYECCIÓN RECAUDO 2026
# 25 = % DCT0

rows = []
skipped = []

for idx in range(3, len(df)):
    row = df.iloc[idx]

    local_raw = row[11]
    arrendatario = row[12]

    # Skip rows with no local number
    if pd.isna(local_raw):
        continue

    # Skip ADMINISTRACION rows and blank arrendatario
    if pd.isna(arrendatario):
        skipped.append(f"  Row {idx}: local={local_raw} — no ARRENDATARIO, skipping")
        continue

    arrendatario_str = str(arrendatario).strip()

    if arrendatario_str.upper() in ('ADMINISTRACION', 'OFICINA ADMON C-KREA', ''):
        skipped.append(f"  Row {idx}: local={local_raw} — ADMIN row, skipping")
        continue

    # local_num as string
    if isinstance(local_raw, float) or isinstance(local_raw, int):
        local_num = str(int(local_raw))
    else:
        local_num = str(local_raw).strip()

    # entrada as string
    entrada_raw = row[10]
    if pd.isna(entrada_raw):
        entrada = ''
    elif isinstance(entrada_raw, float) or isinstance(entrada_raw, int):
        entrada = str(int(entrada_raw))
    else:
        entrada = str(entrada_raw).strip()

    # clasificacion
    clasificacion_raw = row[7]
    clasificacion = str(clasificacion_raw).strip() if not pd.isna(clasificacion_raw) else ''

    # factura
    factura_raw = row[9]
    if pd.isna(factura_raw):
        factura = None
    else:
        try:
            factura = int(factura_raw)
        except (ValueError, TypeError):
            factura = None

    # fecha_inicio
    fecha_inicio_raw = row[13]
    if pd.isna(fecha_inicio_raw) or not isinstance(fecha_inicio_raw, datetime):
        fecha_inicio = None
    else:
        fecha_inicio = fecha_inicio_raw.strftime('%Y-%m-%d')

    # descripcion
    desc_raw = row[16]
    descripcion = str(desc_raw).strip() if not pd.isna(desc_raw) else ''

    # pp_rate from descripcion
    pp_rate = 10 if 'pp' in descripcion.lower() else 0

    # canon_actual
    canon_raw = row[17]
    if pd.isna(canon_raw):
        canon_actual = None
    else:
        try:
            canon_actual = int(float(canon_raw))
        except (ValueError, TypeError):
            canon_actual = None

    # incremento_ipc
    ipc_raw = row[18]
    if pd.isna(ipc_raw):
        incremento_ipc = None
    else:
        try:
            incremento_ipc = int(float(ipc_raw))
        except (ValueError, TypeError):
            incremento_ipc = None

    # fecha_incremento_ipc
    fecha_ipc_raw = row[19]
    if pd.isna(fecha_ipc_raw) or not isinstance(fecha_ipc_raw, datetime):
        fecha_incremento_ipc = None
    else:
        fecha_incremento_ipc = fecha_ipc_raw.strftime('%Y-%m-%d')

    # pct_dcto
    pct_raw = row[25]
    if pd.isna(pct_raw):
        pct_dcto = 0
    else:
        try:
            pct_dcto = int(float(pct_raw))
        except (ValueError, TypeError):
            pct_dcto = 0

    # iva_anual
    iva_raw = row[21]
    if pd.isna(iva_raw):
        iva_anual = None
    else:
        try:
            iva_anual = int(float(iva_raw))
        except (ValueError, TypeError):
            iva_anual = None

    # proyeccion_2026
    proj_raw = row[24]
    if pd.isna(proj_raw):
        proyeccion_2026 = None
    else:
        try:
            proyeccion_2026 = int(float(proj_raw))
        except (ValueError, TypeError):
            proyeccion_2026 = None

    rows.append({
        'local_num': local_num,
        'entrada': entrada,
        'clasificacion': clasificacion,
        'factura': factura,
        'arrendatario': arrendatario_str,
        'fecha_inicio': fecha_inicio,
        'fecha_incremento_ipc': fecha_incremento_ipc,
        'canon_actual': canon_actual,
        'incremento_ipc': incremento_ipc,
        'pct_dcto': pct_dcto,
        'pp_rate': pp_rate,
        'iva_anual': iva_anual,
        'proyeccion_2026': proyeccion_2026,
        'descripcion': descripcion,
    })

print(f"  Total data rows parsed: {len(rows)}")
if skipped:
    print("  Skipped rows:")
    for s in skipped:
        print(s)

# Show summary
null_canon = [r for r in rows if r['canon_actual'] is None]
with_canon = [r for r in rows if r['canon_actual'] is not None]
print(f"  Rows with canon (→ contracts + projections): {len(with_canon)}")
print(f"  Rows without canon (units only): {len(null_canon)}")
print(f"  Null-canon locals: {[r['local_num'] for r in null_canon]}")

# Unique tenants
unique_tenants = sorted(set(r['arrendatario'] for r in rows))
print(f"  Unique tenants: {len(unique_tenants)}")

# ─── DB Connection ────────────────────────────────────────────────────────────

print("\nConnecting to database...")
conn = psycopg2.connect(DB_URL)
cur = conn.cursor()
print("  Connected.")

# ─── STEP 2: TRUNCATE ────────────────────────────────────────────────────────

print("\nSTEP 2: Truncating tables...")
truncate_sql = """
TRUNCATE TABLE
  gasto_allocations,
  payment_applications,
  interest_accruals,
  invoice_line_items,
  meter_readings,
  projections,
  contract_phases,
  cartera,
  payments,
  invoices,
  gastos,
  contracts,
  units,
  tenants
CASCADE;
"""
try:
    cur.execute(truncate_sql)
    conn.commit()
    print("  Truncated.")
except Exception as e:
    print(f"  ERROR during truncate: {e}")
    conn.rollback()
    sys.exit(1)

# ─── STEP 3: Insert Tenants ──────────────────────────────────────────────────

print("\nSTEP 3: Inserting tenants...")

tenant_insert_sql = """
INSERT INTO tenants (id, company_id, nit, razon_social, nombre_corto, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), %s, %s, %s, %s, true, NOW(), NOW())
ON CONFLICT DO NOTHING
"""

tenant_count = 0
tenant_errors = 0

for name in unique_tenants:
    nombre_corto = name[:40]
    # Use a placeholder NIT based on name (since we don't have real NITs)
    nit_placeholder = f"IMPORT-{name[:20].replace(' ', '-').upper()}"
    try:
        cur.execute(tenant_insert_sql, (COMPANY_ID, nit_placeholder, name, nombre_corto))
        tenant_count += 1
    except Exception as e:
        print(f"  ERROR inserting tenant '{name}': {e}")
        conn.rollback()
        # Re-open cursor after rollback
        cur = conn.cursor()
        tenant_errors += 1

conn.commit()
print(f"  Inserted {tenant_count} tenants ({tenant_errors} errors).")

# ─── STEP 4: Insert Units ────────────────────────────────────────────────────

print("\nSTEP 4: Inserting units...")

unit_insert_sql = """
INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status, has_electricity_meter, created_at, updated_at)
VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, false, NOW(), NOW())
"""

unit_count = 0
unit_errors = 0

for r in rows:
    local_num = r['local_num']
    entrada = r['entrada']
    clasificacion = r['clasificacion']
    factura = r['factura']

    unit_code = f"ENT{entrada}-{local_num}"

    # Determine status based on clasificacion
    # unit_status enum: 'arrendado', 'disponible', 'oficina', 'mantenimiento'
    if clasificacion.upper() == 'DISPONIBLE':
        status = 'disponible'
    elif clasificacion.upper() == 'ADMINISTRACION':
        status = 'oficina'
    else:
        status = 'arrendado'

    try:
        cur.execute(unit_insert_sql, (
            COMPANY_ID,
            local_num,
            unit_code,
            entrada,
            clasificacion,
            factura,
            status,
        ))
        unit_count += 1
    except Exception as e:
        print(f"  ERROR inserting unit {local_num}: {e}")
        conn.rollback()
        cur = conn.cursor()
        unit_errors += 1

conn.commit()
print(f"  Inserted {unit_count} units ({unit_errors} errors).")

# ─── STEP 5: Insert Contracts ────────────────────────────────────────────────

print("\nSTEP 5: Inserting contracts...")

contract_insert_sql = """
INSERT INTO contracts (
    id, company_id, tenant_id, unit_id,
    fecha_inicio, fecha_fin,
    canon_base, incremento_ipc, fecha_incremento_ipc,
    descuento_pct, pronto_pago_pct,
    interes_mora_rate, grace_period_days,
    status, descripcion_descuentos,
    flag_uno, flag_once, flag_veintiuno, flag_critico,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    %s,
    (SELECT id FROM tenants WHERE razon_social = %s AND company_id = %s LIMIT 1),
    (SELECT id FROM units WHERE unit_number = %s AND company_id = %s LIMIT 1),
    %s,
    NULL,
    %s,
    %s,
    %s,
    %s,
    %s,
    0.0005,
    10,
    'activo',
    %s,
    false, false, false, false,
    NOW(), NOW()
)
"""

contract_count = 0
contract_errors = 0
contract_rows = [r for r in rows if r['canon_actual'] is not None]

for r in contract_rows:
    try:
        cur.execute(contract_insert_sql, (
            COMPANY_ID,
            r['arrendatario'],
            COMPANY_ID,
            r['local_num'],
            COMPANY_ID,
            r['fecha_inicio'],
            r['canon_actual'],
            r['incremento_ipc'] if r['incremento_ipc'] is not None else 0,
            r['fecha_incremento_ipc'],
            r['pct_dcto'],
            r['pp_rate'],
            r['descripcion'],
        ))
        contract_count += 1
    except Exception as e:
        print(f"  ERROR inserting contract for local {r['local_num']} / tenant '{r['arrendatario']}': {e}")
        conn.rollback()
        cur = conn.cursor()
        contract_errors += 1

conn.commit()
print(f"  Inserted {contract_count} contracts ({contract_errors} errors).")

# ─── STEP 6: Insert Projections ───────────────────────────────────────────────

print("\nSTEP 6: Inserting projections (12 months × 2026)...")

projection_insert_sql = """
INSERT INTO projections (id, company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    %s,
    (SELECT c.id FROM contracts c
     JOIN units u ON c.unit_id = u.id
     WHERE u.unit_number = %s AND u.company_id = %s
     LIMIT 1),
    (SELECT id FROM units WHERE unit_number = %s AND company_id = %s LIMIT 1),
    %s,
    %s,
    %s,
    %s,
    %s,
    NOW(), NOW()
)
"""

projection_count = 0
projection_errors = 0

for r in contract_rows:
    local_num = r['local_num']
    canon_actual = r['canon_actual']
    incremento_ipc = r['incremento_ipc'] or 0
    fecha_ipc = r['fecha_incremento_ipc']
    pct_dcto = r['pct_dcto']
    pp_rate = r['pp_rate']

    # Parse fecha_incremento_ipc to determine which months get the bump
    ipc_year = None
    ipc_month = None
    if fecha_ipc:
        try:
            dt = datetime.strptime(fecha_ipc, '%Y-%m-%d')
            ipc_year = dt.year
            ipc_month = dt.month
        except ValueError:
            pass

    for month in range(1, 13):
        # Determine canon for this month
        if ipc_year == 2026 and ipc_month is not None and ipc_month <= month:
            canon_mes = canon_actual + incremento_ipc
        else:
            canon_mes = canon_actual

        descuento_mes = round(canon_mes * pct_dcto / 100)
        canon_after_dcto = canon_mes - descuento_mes
        pp_mes = round(canon_after_dcto * pp_rate / 100)

        try:
            cur.execute(projection_insert_sql, (
                COMPANY_ID,
                local_num,
                COMPANY_ID,
                local_num,
                COMPANY_ID,
                2026,
                month,
                canon_mes,
                descuento_mes,
                pp_mes,
            ))
            projection_count += 1
        except Exception as e:
            print(f"  ERROR inserting projection for local {local_num} month {month}: {e}")
            conn.rollback()
            cur = conn.cursor()
            projection_errors += 1

conn.commit()
print(f"  Inserted {projection_count} projections ({projection_errors} errors).")

# ─── STEP 7: Verify ──────────────────────────────────────────────────────────

print("\nSTEP 7: Verifying counts...")

verify_sql = """
SELECT
    (SELECT COUNT(*) FROM tenants WHERE company_id = %s) as tenants,
    (SELECT COUNT(*) FROM units WHERE company_id = %s) as units,
    (SELECT COUNT(*) FROM contracts WHERE company_id = %s) as contracts,
    (SELECT COUNT(*) FROM projections WHERE company_id = %s) as projections;
"""

cur.execute(verify_sql, (COMPANY_ID, COMPANY_ID, COMPANY_ID, COMPANY_ID))
result = cur.fetchone()
print(f"\n{'='*50}")
print(f"  tenants:     {result[0]}")
print(f"  units:       {result[1]}")
print(f"  contracts:   {result[2]}")
print(f"  projections: {result[3]}")
print(f"{'='*50}")

cur.close()
conn.close()
print("\nImport complete.")
