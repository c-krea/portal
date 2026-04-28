"""
Phase C loader: SIESA connexion.xlsx -> siesa_raw.*
Idempotent UPSERT via row_hash. Single sync_batch per sheet.

Usage:
  source .env.local && python3 scripts/load_siesa_raw.py
"""

import hashlib
import os
import sys
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

XLSX = Path(__file__).resolve().parent.parent / "SIESA connexion.xlsx"
DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    sys.exit("DATABASE_URL not set; run: source .env.local first")


def md5_row(values: list) -> str:
    payload = "||".join("\\N" if v is None or pd.isna(v) else str(v) for v in values)
    return hashlib.md5(payload.encode("utf-8")).hexdigest()


def cleanrow(d: dict) -> dict:
    return {k: (None if pd.isna(v) else v) for k, v in d.items()}


SHEETS = {
    "cartera": {
        "table": "siesa_raw.cartera",
        "pk": ["row_id"],
        "strip_dot_zero": [],
        "rename": {
            "RowId": "row_id", "RowIdTercero": "row_id_tercero",
            "Documento": "documento", "IdSucursal": "id_sucursal",
            "Cliente": "cliente", "Sucursal": "sucursal",
            "Factura": "factura", "Obs": "obs",
            "FechaFactura": "fecha_factura", "FechaProntoPago": "fecha_pronto_pago",
            "FechaVence": "fecha_vence", "Dias": "dias", "Financia": "financia",
            "VrCorriente": "vr_corriente", "VrVencido": "vr_vencido",
            "Saldo": "saldo", "IdVendedor": "id_vendedor", "Vendedor": "vendedor",
            "IdZona": "id_zona", "Zona": "zona",
            "IdCobrador": "id_cobrador", "Cobrador": "cobrador",
        },
    },
    "recaudo": {
        "table": "siesa_raw.recaudo",
        "pk": ["docto", "cruce", "fecha_recaudo", "valor_aplicado"],
        "conflict_constraint": "recaudo_natural_key",
        "strip_dot_zero": [],
        "rename": {
            "Clasificacion": "clasificacion", "IdZona": "id_zona", "Zona": "zona",
            "IdAsesor": "id_asesor", "Asesor": "asesor",
            "Documento": "documento", "Cliente": "cliente",
            "CondPago": "cond_pago", "TipoCliente": "tipo_cliente",
            "FechaRecaudo": "fecha_recaudo", "Docto": "docto", "Cruce": "cruce",
            "FechaPp": "fecha_pp", "FechaVcto": "fecha_vcto", "FechaFact": "fecha_fact",
            "ValorAplicado": "valor_aplicado", "ProntoPago": "pronto_pago",
            "ValorFinal": "valor_final",
        },
    },
    "ocupacion": {
        "table": "siesa_raw.ocupacion",
        "pk": ["documento", "local"],
        "conflict_constraint": "ocupacion_natural_key",
        "strip_dot_zero": ["documento"],
        "rename": {
            "ENTRADA": "entrada", "LOC": "loc",
            "DOCUMENTO": "documento", "RAZON_SOCIAL": "razon_social",
            "LOCAL": "local", "INGRESO": "ingreso", "LISTA": "lista",
            "PRECIO": "precio", "DESCUENTO": "descuento",
            "PRONTO_PAGO": "pronto_pago", "ESTADO": "estado",
            "UNO": "uno", "ONCE": "once", "VEINTIUNO": "veintiuno",
            "CRITICO": "critico",
        },
    },
    "documentos": {
        "table": "siesa_raw.documentos",
        "pk": ["documento"],
        "strip_dot_zero": ["tipo_cliente"],
        # already snake_case in xlsx
        "rename": {},
    },
}


def open_batch(cur, sheet: str) -> str:
    cur.execute(
        "INSERT INTO siesa_raw.sync_batches (sheet, status, source_system) "
        "VALUES (%s,'in_progress','xlsx_phase_c') RETURNING id",
        (sheet,),
    )
    return cur.fetchone()[0]


def close_batch(cur, batch_id: str, received: int, ins: int, upd: int, status="success"):
    cur.execute(
        "UPDATE siesa_raw.sync_batches SET completed_at=now(), "
        "rows_received=%s, rows_inserted=%s, rows_updated=%s, status=%s "
        "WHERE id=%s",
        (received, ins, upd, status, batch_id),
    )


def load_sheet(conn, sheet_name: str, df: pd.DataFrame, cfg: dict):
    df = df.rename(columns=cfg["rename"])
    cols = [c for c in cfg["rename"].values()] if cfg["rename"] else list(df.columns)
    # restrict to known cols only (skip xlsx-only artifacts)
    df = df[cols]

    # strip pandas float→string '.0' artifact on declared id-like cols
    for col in cfg.get("strip_dot_zero", []):
        if col in df.columns:
            df[col] = df[col].apply(
                lambda v: None if pd.isna(v) else str(v).removesuffix(".0")
            )

    print(f"\n[{sheet_name}] {len(df)} rows, {len(cols)} cols")

    with conn.cursor() as cur:
        batch_id = open_batch(cur, sheet_name)
        conn.commit()

        rows = []
        for _, r in df.iterrows():
            d = cleanrow(r.to_dict())
            ordered_vals = [d[c] for c in cols]
            rh = md5_row(ordered_vals)
            rows.append(tuple(ordered_vals) + (batch_id, rh))

        full_cols = cols + ["sync_batch_id", "row_hash"]
        sql_cols = ", ".join(f'"{c}"' for c in full_cols)
        update_cols = [c for c in cols] + ["sync_batch_id", "row_hash"]
        update_set = ", ".join(f'"{c}"=EXCLUDED."{c}"' for c in update_cols + ["siesa_synced_at"])
        # Add EXCLUDED clause for siesa_synced_at via DEFAULT now()
        update_set = ", ".join(f'"{c}"=EXCLUDED."{c}"' for c in update_cols) \
                     + ', "siesa_synced_at"=now()'

        if cfg.get("conflict_constraint"):
            conflict_clause = f'ON CONSTRAINT {cfg["conflict_constraint"]}'
        else:
            conflict_clause = "(" + ", ".join(f'"{p}"' for p in cfg["pk"]) + ")"
        sql = (
            f'INSERT INTO {cfg["table"]} ({sql_cols}) VALUES %s '
            f"ON CONFLICT {conflict_clause} DO UPDATE SET {update_set} "
            f"WHERE {cfg['table']}.row_hash IS DISTINCT FROM EXCLUDED.row_hash"
        )

        # Detect existing PKs to count INS vs UPD
        before_ids = set()
        if rows:
            id_select = ", ".join(f'"{p}"' for p in cfg["pk"])
            cur.execute(f'SELECT {id_select} FROM {cfg["table"]}')
            before_ids = {tuple(row) for row in cur.fetchall()}

        execute_values(cur, sql, rows, page_size=500)
        conn.commit()

        # Count after
        cur.execute(f'SELECT COUNT(*) FROM {cfg["table"]} WHERE sync_batch_id = %s', (batch_id,))
        affected = cur.fetchone()[0]
        # Crude split: inserts = rows whose pk wasn't in before
        pk_idx = [cols.index(p) for p in cfg["pk"]]
        ins = sum(1 for r in rows if tuple(r[i] for i in pk_idx) not in before_ids)
        upd = affected - ins

        close_batch(cur, batch_id, len(rows), ins, upd)
        conn.commit()
        print(f"  → batch {batch_id} | received={len(rows)} ins={ins} upd={upd}")


def main():
    if not XLSX.exists():
        sys.exit(f"missing: {XLSX}")
    print(f"reading {XLSX}")
    xl = pd.ExcelFile(XLSX)

    conn = psycopg2.connect(DB_URL)
    try:
        for sheet_excel, cfg in [
            ("Cartera", SHEETS["cartera"]),
            ("Recaudo", SHEETS["recaudo"]),
            ("Ocupacion", SHEETS["ocupacion"]),
            ("Documentos", SHEETS["documentos"]),
        ]:
            df = xl.parse(sheet_excel)
            sheet_name = sheet_excel.lower()
            load_sheet(conn, sheet_name, df, cfg)
    finally:
        conn.close()
    print("\nDONE")


if __name__ == "__main__":
    main()
