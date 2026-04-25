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
const CKREA_COMPANY_ID = '00000000-0000-0000-0000-000000000001'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const APPLY = process.argv.includes('--apply')
const DEBUG = process.argv.includes('--debug')

// Locales que el gerente confirma disponibles aunque ERP los reporte con inquilino (Critico)
// Actualizar manualmente cuando gerente confirme cambios
const DISPONIBLES_OVERRIDE = ['312', '313', '506A']

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
  console.log(`=== CSF Sync started (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===\n`)

  // Load tenants → NIT lookup map
  const { data: tenants, error: tErr } = await supabase
    .from('tenants')
    .select('id, nit, razon_social, company_id')
  if (tErr) throw tErr
  const tenantByNit = new Map(tenants!.map(t => [String(t.nit).trim(), t]))
  console.log(`Tenants loaded: ${tenantByNit.size}`)

  // ── 1. CARTERA ──────────────────────────────────────────────
  console.log('\n[1/3] Cartera...')
  const carteraRows: any[] = await fetchCSF('/reportes/cartera-cliente/')
  console.log(`  Fetched: ${carteraRows.length} rows from CSF`)

  const carteraUpserts: object[] = []
  let carteraSkipped = 0

  for (const r of carteraRows) {
    if (!r.RowId) { carteraSkipped++; continue }
    const tenant = tenantByNit.get(String(r.Documento).trim())
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
  console.log('\n[2/3] Payments...')
  const paymentRows: any[] = await fetchCSF('/reportes/recaudo-cartera/')
  console.log(`  Fetched: ${paymentRows.length} rows from CSF`)

  const paymentUpserts: object[] = []
  let paymentSkipped = 0

  for (const r of paymentRows) {
    if (!r.Docto || !r.Cruce) { paymentSkipped++; continue }
    const tenant = tenantByNit.get(String(r.Documento).trim())
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

  // ── 3. OCUPACION ────────────────────────────────────────────
  console.log('\n[3/3] Ocupación...')
  const ocupRows: any[] = await fetchCSF('/reportes/ckrea-ocupacion/')
  console.log(`  Fetched: ${ocupRows.length} rows from CSF`)

  // Group by LOC — ERP may return multiple rows per unit (active + historical)
  const ocupByLoc = new Map<string, any[]>()
  for (const r of ocupRows) {
    const loc = String(r.LOC ?? '').trim()
    if (!loc) continue
    if (!ocupByLoc.has(loc)) ocupByLoc.set(loc, [])
    ocupByLoc.get(loc)!.push(r)
  }
  console.log(`  Unique units in ERP: ${ocupByLoc.size}`)

  if (DEBUG) {
    // Distribution of ESTADO values
    const estadoDist = new Map<string, number>()
    for (const r of ocupRows) {
      const e = String(r.ESTADO ?? '(null)')
      estadoDist.set(e, (estadoDist.get(e) ?? 0) + 1)
    }
    console.log('\n  === DEBUG: ESTADO distribution ===')
    for (const [estado, count] of estadoDist) {
      console.log(`    ${estado}: ${count}`)
    }

    // Show raw data for known units
    const sampleLocs = ['111', '312', '313', '506A', '117', '508', '202', '120']
    console.log('\n  === DEBUG: Raw rows for sample units ===')
    for (const sl of sampleLocs) {
      const rows = ocupByLoc.get(sl) ?? []
      console.log(`\n  LOC ${sl}: ${rows.length} row(s)`)
      for (const r of rows) {
        console.log(`    ${JSON.stringify(r)}`)
      }
    }
    console.log('\n  === END DEBUG ===\n')
  }

  // Load DB units + active contracts + tenant details
  const { data: dbUnits, error: uErr } = await supabase
    .from('units')
    .select('id, unit_number')
  if (uErr) throw uErr

  const { data: dbContracts, error: cErr } = await supabase
    .from('contracts')
    .select('id, unit_id, tenant_id, status, canon_base, descuento_pct, pronto_pago_pct, fecha_inicio')
    .in('status', ['activo', 'critico'])
  if (cErr) throw cErr

  const unitByNumber  = new Map(dbUnits!.map(u => [String(u.unit_number), u]))
  const contractByUnit = new Map(dbContracts!.map(c => [String(c.unit_id), c]))
  const tenantById    = new Map(tenants!.map(t => [String(t.id), t]))

  type Diff = {
    local:    string
    tipo:     string
    erp:      string
    db:       string
  }
  const diffs: Diff[] = []
  const changes: (() => Promise<void>)[] = []

  for (const [loc, rowsForUnit] of ocupByLoc) {
    // ERP reports Activo/Critico. Both are valid occupied states.
    // Prefer Activo; fall back to Critico. Never Inactivo (ERP doesn't use it).
    const chosenRow = rowsForUnit.find(r => r.ESTADO === 'Activo')
                   ?? rowsForUnit.find(r => r.ESTADO === 'Critico')
                   ?? rowsForUnit[0]
    const r = chosenRow
    const rawNit     = r.DOCUMENTO
    const nit        = rawNit != null ? String(rawNit).trim() : ''
    const erpNombre  = String(r.RAZON_SOCIAL ?? '').trim()
    const erpCanon   = Number(r.PRECIO   ?? 0)
    const erpDesc    = Number(r.DESCUENTO ?? 0)
    const erpPp      = Number(r.PRONTO_PAGO ?? 0)
    const erpIngreso = r.INGRESO ?? null

    const unit = unitByNumber.get(loc)
    if (!unit) {
      diffs.push({ local: loc, tipo: 'UNIDAD_NO_EN_DB', erp: erpNombre || '(sin nombre)', db: '(no existe)' })
      continue
    }

    const contract = contractByUnit.get(String(unit.id))
    const dbTenant = contract ? tenantById.get(String(contract.tenant_id)) : null
    const dbNit    = dbTenant ? String(dbTenant.nit).trim() : null

    // Fantasma: ERP lists unit but has no NIT → unit is effectively vacant
    const isFantasma = !nit || !erpNombre
    const isManualDisponible = DISPONIBLES_OVERRIDE.includes(loc)

    if (isFantasma || isManualDisponible) {
      // Should be disponible → terminate DB contract if active
      if (contract) {
        const reason = isFantasma ? 'ERP_SIN_INQUILINO' : 'GERENTE_CONFIRMA_DISPONIBLE'
        diffs.push({
          local: loc,
          tipo:  'DEBE_TERMINAR',
          erp:   `(disponible — ${reason})`,
          db:    `${dbTenant?.razon_social ?? '?'} (activo)`,
        })
        if (APPLY) {
          changes.push(async () => {
            const { error } = await supabase
              .from('contracts')
              .update({ status: 'terminado', fecha_fin: new Date().toISOString().slice(0, 10) })
              .eq('id', contract.id)
            if (error) throw new Error(`Terminate contract for unit ${loc}: ${error.message}`)
            console.log(`    ✓ Contrato terminado: ${loc} (${dbTenant?.razon_social})`)
          })
        }
      }
      continue
    }

    // Normal flow: ERP says occupied (Activo or Critico)
    {
      if (!contract) {
        // Unit shows active in ERP but has no active contract in DB
        diffs.push({ local: loc, tipo: 'SIN_CONTRATO_EN_DB', erp: `${erpNombre} (${nit})`, db: '(vacío)' })

        if (APPLY) {
          changes.push(async () => {
            // Find or create tenant
            let tenant = tenantByNit.get(nit)
            if (!tenant) {
              const { data: newTenant, error } = await supabase
                .from('tenants')
                .insert({ nit, razon_social: erpNombre, company_id: CKREA_COMPANY_ID, juridica: false, is_active: true })
                .select('id, nit, razon_social, company_id')
                .single()
              if (error) throw new Error(`Insert tenant ${nit}: ${error.message}`)
              tenant = newTenant!
              tenantByNit.set(nit, tenant)
            }
            // Create contract
            const { error: ce } = await supabase.from('contracts').insert({
              unit_id:           unit.id,
              tenant_id:         tenant.id,
              company_id:        CKREA_COMPANY_ID,
              canon_base:        erpCanon,
              descuento_pct:     erpDesc,
              pronto_pago_pct:   erpPp,
              fecha_inicio:      erpIngreso,
              interes_mora_rate: 0.0005,
              grace_period_days: 10,
              status:            'activo',
            })
            if (ce) throw new Error(`Insert contract for unit ${loc}: ${ce.message}`)
            console.log(`    ✓ Contrato creado: ${loc} → ${erpNombre}`)
          })
        }
      } else if (dbNit !== nit) {
        // Wrong tenant in this unit
        diffs.push({
          local: loc,
          tipo:  'INQUILINO_DIFERENTE',
          erp:   `${erpNombre} (${nit})`,
          db:    `${dbTenant?.razon_social} (${dbNit})`,
        })

        if (APPLY) {
          changes.push(async () => {
            // Terminate old contract
            const { error: te } = await supabase
              .from('contracts')
              .update({ status: 'terminado', fecha_fin: new Date().toISOString().slice(0, 10) })
              .eq('id', contract.id)
            if (te) throw new Error(`Terminate contract ${contract.id}: ${te.message}`)

            // Find or create new tenant
            let tenant = tenantByNit.get(nit)
            if (!tenant) {
              const { data: newTenant, error } = await supabase
                .from('tenants')
                .insert({ nit, razon_social: erpNombre, company_id: CKREA_COMPANY_ID, juridica: false, is_active: true })
                .select('id, nit, razon_social, company_id')
                .single()
              if (error) throw new Error(`Insert tenant ${nit}: ${error.message}`)
              tenant = newTenant!
              tenantByNit.set(nit, tenant)
            }
            // Create new contract
            const { error: ce } = await supabase.from('contracts').insert({
              unit_id:           unit.id,
              tenant_id:         tenant.id,
              company_id:        CKREA_COMPANY_ID,
              canon_base:        erpCanon,
              descuento_pct:     erpDesc,
              pronto_pago_pct:   erpPp,
              fecha_inicio:      erpIngreso,
              interes_mora_rate: 0.0005,
              grace_period_days: 10,
              status:            'activo',
            })
            if (ce) throw new Error(`Insert contract for unit ${loc}: ${ce.message}`)
            console.log(`    ✓ Inquilino actualizado: ${loc} → ${erpNombre}`)
          })
        }
      } else {
        // Same tenant — check if canon changed
        const canonDiff = Math.abs(Number(contract.canon_base) - erpCanon) > 1
        if (canonDiff) {
          diffs.push({
            local: loc,
            tipo:  'CANON_DIFERENTE',
            erp:   `$${erpCanon.toLocaleString('es-CO')}`,
            db:    `$${Number(contract.canon_base).toLocaleString('es-CO')}`,
          })

          if (APPLY) {
            changes.push(async () => {
              const { error } = await supabase
                .from('contracts')
                .update({ canon_base: erpCanon, updated_at: new Date().toISOString() })
                .eq('id', contract.id)
              if (error) throw new Error(`Update canon for unit ${loc}: ${error.message}`)
              console.log(`    ✓ Canon actualizado: ${loc} → $${erpCanon.toLocaleString('es-CO')}`)
            })
          }
        }
      }
    }
  }

  // Handle DB units with active contracts but NOT reported by ERP → terminate
  const erpLocs = new Set(ocupByLoc.keys())
  for (const c of dbContracts!) {
    const dbUnit = dbUnits!.find(u => u.id === c.unit_id)
    if (!dbUnit) continue
    const loc = String(dbUnit.unit_number)
    if (erpLocs.has(loc)) continue
    const tenant = tenantById.get(String(c.tenant_id))
    diffs.push({
      local: loc,
      tipo:  'DEBE_TERMINAR',
      erp:   '(no está en ERP)',
      db:    `${tenant?.razon_social ?? '?'} (activo)`,
    })
    if (APPLY) {
      changes.push(async () => {
        const { error } = await supabase
          .from('contracts')
          .update({ status: 'terminado', fecha_fin: new Date().toISOString().slice(0, 10) })
          .eq('id', c.id)
        if (error) throw new Error(`Terminate contract for unit ${loc}: ${error.message}`)
        console.log(`    ✓ Contrato terminado: ${loc} (${tenant?.razon_social}) — no está en ERP`)
      })
    }
  }

  // ── Print diff report ───────────────────────────────────────
  if (diffs.length === 0) {
    console.log('\n  ✓ Sin diferencias — DB sincronizada con ERP')
  } else {
    console.log(`\n  ⚠️  ${diffs.length} diferencia(s) encontrada(s):\n`)
    console.log('  LOCAL | TIPO                 | ERP                              | DB')
    console.log('  ------|----------------------|----------------------------------|----------------------------------')
    for (const d of diffs) {
      console.log(`  ${d.local.padEnd(5)} | ${d.tipo.padEnd(20)} | ${d.erp.padEnd(32)} | ${d.db}`)
    }

    if (!APPLY) {
      console.log('\n  → Para aplicar los cambios: npm run sync-csf -- --apply')
    }
  }

  // ── Apply changes ───────────────────────────────────────────
  if (APPLY && changes.length > 0) {
    console.log(`\n  Aplicando ${changes.length} cambio(s)...`)
    for (const fn of changes) await fn()
    console.log(`  ✓ ${changes.length} cambio(s) aplicado(s)`)
  }

  console.log('\n=== CSF Sync complete ===')
}

main().catch(err => {
  console.error('\n✗ Sync failed:', err.message)
  process.exit(1)
})
