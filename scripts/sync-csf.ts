import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const val = trimmed.slice(eqIdx + 1).trim()
  if (!process.env[key]) process.env[key] = val
}

const CSF_BASE_URL = process.env.CSF_BASE_URL!
const CSF_API_KEY = process.env.CSF_API_KEY!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fetchCSF(endpoint: string) {
  const res = await fetch(`${CSF_BASE_URL}${endpoint}`, {
    headers: { Authorization: `Api-Key ${CSF_API_KEY}` },
  })
  if (!res.ok) throw new Error(`CSF ${endpoint} → HTTP ${res.status}`)
  return res.json()
}

async function upsertBatch(table: string, rows: object[], conflict: string) {
  const BATCH = 500
  let total = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflict })
    if (error) throw new Error(`${table} upsert failed: ${error.message}`)
    total += chunk.length
  }
  return total
}

async function main() {
  console.log('=== CSF Sync started ===\n')

  // Load tenants → NIT lookup map
  const { data: tenants, error: tErr } = await supabase
    .from('tenants')
    .select('id, nit, company_id')
  if (tErr) throw tErr
  const tenantMap = new Map(tenants!.map(t => [String(t.nit), { id: t.id, company_id: t.company_id }]))
  console.log(`Tenants loaded: ${tenantMap.size}`)

  // ── 1. CARTERA ──────────────────────────────────────────────
  console.log('\n[1/2] Cartera...')
  const carteraRows: any[] = await fetchCSF('/reportes/cartera-cliente/')
  console.log(`  Fetched: ${carteraRows.length} rows from CSF`)

  const carteraUpserts: object[] = []
  let carteraSkipped = 0

  for (const r of carteraRows) {
    if (!r.RowId) { carteraSkipped++; continue }
    const tenant = tenantMap.get(String(r.Documento))
    if (!tenant) { carteraSkipped++; continue }

    carteraUpserts.push({
      siesa_row_id:      String(r.RowId),
      siesa_factura:     r.Factura    ?? null,
      siesa_sucursal:    r.IdSucursal != null ? String(r.IdSucursal) : null,
      observacion:       r.Obs        ?? null,
      fecha_factura:     r.FechaFactura    ?? null,
      fecha_pronto_pago: r.FechaProntoPago ?? null,
      fecha_vence:       r.FechaVence      ?? null,
      dias_financia:     r.Financia  ?? null,
      dias_mora:         r.Dias      ?? null,
      valor_vencido:     r.VrVencido ?? null,
      saldo:             r.Saldo,
      tenant_id:         tenant.id,
      company_id:        tenant.company_id,
      last_synced_at:    new Date().toISOString(),
    })
  }

  const carteraDone = await upsertBatch('cartera', carteraUpserts, 'siesa_row_id')
  console.log(`  ✓ Upserted: ${carteraDone} | Skipped: ${carteraSkipped}`)

  // ── 2. PAYMENTS ─────────────────────────────────────────────
  console.log('\n[2/2] Payments...')
  const paymentRows: any[] = await fetchCSF('/reportes/recaudo-cartera/')
  console.log(`  Fetched: ${paymentRows.length} rows from CSF`)

const paymentUpserts: object[] = []
  let paymentSkipped = 0

  for (const r of paymentRows) {
    if (!r.Docto || !r.Cruce) { paymentSkipped++; continue }
    const tenant = tenantMap.get(String(r.Documento).trim())
    if (!tenant) { paymentSkipped++; continue }

    paymentUpserts.push({
      siesa_docto:         String(r.Docto),
      siesa_cruce:         String(r.Cruce),
      siesa_clasificacion: r.Clasificacion ?? null,
      fecha_recaudo:       r.FechaRecaudo,
      fecha_pronto_pago:   r.FechaPp    ?? null,
      fecha_vencimiento:   r.FechaVcto  ?? null,
      fecha_factura:       r.FechaFact  ?? null,
      valor_aplicado:      r.ValorAplicado,
      pronto_pago_aplicado: r.ProntoPago ?? null,
      valor_final:         r.ValorFinal,
      status:              'recaudado',
      tenant_id:           tenant.id,
      company_id:          tenant.company_id,
    })
  }

  const paymentsDone = await upsertBatch('payments', paymentUpserts, 'siesa_docto,siesa_cruce')
  console.log(`  ✓ Upserted: ${paymentsDone} | Skipped: ${paymentSkipped}`)

  console.log('\n=== CSF Sync complete ===')
}

main().catch(err => {
  console.error('\n✗ Sync failed:', err.message)
  process.exit(1)
})
