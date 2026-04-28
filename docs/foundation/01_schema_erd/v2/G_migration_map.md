# Fase G — Mapping Doc

**Fecha:** 2026-04-28
**Branch:** `refactor/v2-migration`
**Scope:** Migrar portal de `public.*` (legacy, inglés, 25 tablas) → `v2.*` + `siesa_raw.*` vistas (español, 12 tablas + 4 vistas + 5 RPCs).
**Empresa:** Solo C-Krea. Reymon NO migra.

---

## 1. Decisiones lockeadas

| # | Decisión | Valor |
|---|---|---|
| 1 | Sync raw → v2 | Cron automático (IT pushea cada 6h, nuestro sync corre con offset 30min) |
| 2 | 3 tablas legacy huérfanas | **DELETE** (`payment_applications`, `invoice_line_items`, `interest_accruals`) |
| 3 | Branch | `refactor/v2-migration` (NO main directo) |
| 4 | Multi-empresa | Solo C-Krea |
| 5 | Ritmo | Una sesión enfocada, foco en estructura no tiempo |

---

## 2. Mapping de tablas (25 → 12 + 4 vistas + delete)

### Activas — migran (12)

| `public.*` (legacy) | `v2.*` (nueva) | Filas hoy | Notas |
|---|---|---|---|
| `companies` | `empresas` | 1 | Solo C-Krea, hardcode 1 fila |
| `profiles` | `perfiles` | 7 | FK `auth.users`, agregar `inquilino_id` para portal |
| `tenants` | `inquilinos` | 66 | **Re-seed**: UNION de `ocupacion ∪ recaudo ∪ cartera`.documento (capta ex-arrendatarios con deuda) |
| `units` | `locales` | 84 | Rename + traducción de campos |
| `contracts` | `contratos` | 78 | Rename + traducción |
| `financial_rules` | `reglas_financieras` | 5 | Rename + traducción |
| `gasto_types` | `tipos_gasto` | 11 | Rename + traducción |
| `gastos` | `gastos` | 40 | Mismo nombre, diferente schema |
| `projections` | `proyecciones` | 899 | Rename + traducción |
| `meter_readings` | `lecturas_medidor` | 1180 | Rename + traducción |
| `electricity_invoices` | `facturas_energia` | 0 | Vacía hoy, schema listo |
| `agent_chat_history` | `agente_chat` | 130 | Rename + simplificación |

### Reemplazadas por vistas en `siesa_raw` (3)

| `public.*` (legacy) | Reemplazo | Filas hoy | Notas |
|---|---|---|---|
| `payments` | `v2.vista_pagos` | 5551 | Vista deriva de `siesa_raw.recaudo` (3221 filas, las 2330 extras eran ruido/duplicados) |
| `cartera` | `v2.vista_cartera_actual` | 195 | Vista deriva de `siesa_raw.cartera` (125 filas) |
| `invoices` | `v2.vista_facturas` | 0 | Vista deriva de `siesa_raw.documentos` |

### A borrar — definitivo (10)

| `public.*` | Razón |
|---|---|
| `contract_phases` | Vacía (0 filas), reemplazada por sync desde `ocupacion` |
| `invoice_line_items` | Vacía (0 filas), calculado on-demand desde `vista_facturas` |
| `payment_applications` | Vacía (0 filas), reemplazada por patrón Descuentos del ERP |
| `interest_accruals` | Vacía (0 filas), calculado on-demand desde `vista_cartera_actual.dias` |
| `gasto_allocations` | Vacía (0 filas), método de asignación vive en `tipos_gasto.metodo_asignacion` |
| `accounting_entries` | Vacía (0 filas), nunca usado |
| `siesa_sync_log` | Vacía (0 filas), reemplazada por `siesa_raw.sync_batches` |
| `audit_log` | Vacía (0 filas), nunca usado |
| `notifications` | Vacía (0 filas), nunca usado |
| `agent_budget_state` | 1 fila — **DECISIÓN PENDIENTE**: ¿conservar como tabla portal-interna o mover a v2? Por ahora dejar en `public.*`, atender en Fase H |

---

## 3. Mapping de campos (los críticos)

### `tenants` → `inquilinos`
| public | v2 | Tipo |
|---|---|---|
| `id` | `id` | uuid (regenera) |
| `company_id` | `empresa_id` | uuid |
| `name` | `razon_social` | text |
| `ruc` / `nit` | `nit` | text |
| `email` | `portal_email` | text |
| `juridica` | `juridica` | bool (preservar valor) |
| `pp_historico_pct` | `pp_historico_pct` | numeric (preservar) |
| `pp_historico_pagos` | `pp_historico_pagos` | int (preservar) |

### `units` → `locales`
| public | v2 | Tipo |
|---|---|---|
| `id` | `id` | uuid (regenera) |
| `company_id` | `empresa_id` | uuid |
| `unit_number` | `unidad` | text |
| `code` (ej `E1L101`) | `codigo` | text |
| `entrance` | `entrada` | text |
| `area_m2` | `area_m2` | numeric |
| `has_electricity_meter` | `tiene_medidor` | bool |
| `electricity_group` | `grupo_energia` | text |

### `contracts` → `contratos`
| public | v2 |
|---|---|
| `tenant_id` | `inquilino_id` |
| `unit_id` | `local_id` |
| `start_date` | `fecha_inicio` |
| `canon_base` | `canon_base` |
| `descuento_pct` | `descuento_pct` |
| `pronto_pago_pct` | `pronto_pago_pct` |
| `status` | `estado` (enum: activo/critico/vencido/terminado) |

### `projections` → `proyecciones`
| public | v2 |
|---|---|
| `contract_id` | `contrato_id` |
| `unit_id` | `local_id` |
| `year` | `anio` |
| `month` | `mes` |
| `canon_proyectado` | `canon_proyectado` |
| `descuento_proyectado` | `descuento_proyectado` |
| `pronto_pago_proyectado` | **DROP** (PP no se proyecta) |

### `meter_readings` → `lecturas_medidor`
| public | v2 |
|---|---|
| `unit_id` | `local_id` |
| `periodo` | `periodo` |
| `previous_reading` | `lectura_anterior` |
| `current_reading` | `lectura_actual` |
| `kwh` | `kwh` |
| `tarifa_kwh` | `tarifa_kwh` |
| `total_energia` | `total_energia` |
| `foto_drive_id` | `foto_drive_id` |
| `validation_status` | `estado_validacion` (enum) |

### `gasto_types` → `tipos_gasto`
| public | v2 |
|---|---|
| `category` | `categoria` (enum) |
| `name` | `nombre` |
| `allocation_method` | `metodo_asignacion` (enum) |
| `is_billable` | `es_facturable` |

### `financial_rules` → `reglas_financieras`
| public | v2 |
|---|---|
| `rule_key` | `clave` |
| `rule_value` | `valor` |
| `description` | `descripcion` |

---

## 4. Inventario de archivos del portal (35)

**Hallazgo**: estimación previa decía 17 archivos. Grep real = **35 archivos**. Ajuste de scope.

### G.4.1 — Auth + perfiles (4)
- `src/proxy.ts`
- `src/app/(app)/layout.tsx`
- `src/app/(portal)/layout.tsx`
- `src/app/(app)/usuarios/actions.ts`

### G.4.2 — Inquilinos + locales + mora (6)
- `src/lib/data/clientes.ts`
- `src/lib/data/tenant-detail.ts`
- `src/lib/data/mora.ts`
- `src/lib/data/usuarios.ts`
- `src/lib/data/dashboard.ts`
- `src/app/(app)/mora/actions.ts`

### G.4.3 — Pagos + recaudo (3)
- `src/lib/data/pagos.ts`
- `src/lib/data/reportes.ts`
- `src/app/(app)/pagos/actions.ts`

### G.4.4 — Facturas + proyecciones (8)
- `src/lib/data/facturas.ts`
- `src/lib/data/proyecciones.ts`
- `src/lib/invoice-engine.ts`
- `src/lib/interest-engine.ts`
- `src/lib/reconciliation.ts`
- `src/app/(app)/facturas/actions.ts`
- `src/app/(app)/facturas/export/route.ts`
- `src/app/(app)/proyecciones/actions.ts`
- `src/app/(app)/proyecciones/page.tsx`
- `src/app/api/cron/accrual/route.ts`

### G.4.5 — Gastos + medidores + portal (8)
- `src/lib/data/gastos.ts`
- `src/lib/data/medidores.ts`
- `src/lib/data/portal.ts`
- `src/app/(app)/medidores/actions.ts`
- `src/app/(app)/medidores/page.tsx`
- `src/app/(app)/medidores/facturas/actions.ts`
- `src/app/(app)/medidores/facturas/page.tsx`
- `src/app/(portal)/portal/medidor/actions.ts`
- `src/app/(portal)/portal/medidor/page.tsx`

### G.4.6 — Configuración (3)
- `src/lib/data/configuracion.ts`
- `src/app/(app)/configuracion/actions.ts`
- `src/app/(app)/configuracion/page.tsx`

**Patrón común a borrar en TODOS los archivos**:
```ts
const companies = await execute(`SELECT id FROM companies LIMIT 1`)
```
→ reemplazar por hardcode del UUID de C-Krea (1 sola empresa) o helper `getEmpresaId()`.

---

## 5. Schedule de cron

| Sistema | Cron | Acción |
|---|---|---|
| IT (externo) | `0 */6 * * *` (cada 6h en punto) | Pushea xlsx → `siesa_raw.*` |
| Portal (nuestro) | `30 */6 * * *` (cada 6h, +30min offset) | Corre `v2.sync_desde_raw()` para detectar NITs/locales nuevos |

3 corridas/día por sistema = 6 ventanas de actualización al día. Datos tarde como mucho 6h en reflejarse.

---

## 6. Convenciones del refactor

1. **Cliente Supabase**: `supabase.schema('v2').from('inquilinos')` — siempre prefijo `v2`.
2. **Vistas**: leer directo, sin schema `v2.` prefijo cuando uses RPC (`obtener_recaudo`).
3. **RPCs disponibles** (ya en DB):
   - `obtener_recaudo(p_anio_desde, p_anio_hasta)` — recaudo agregado
   - `obtener_cartera_actual()` — snapshot mora viva
   - `obtener_buckets_mora()` — buckets agregados
   - `obtener_recaudo_vs_proyectado(p_anio)` — para dashboard chart
   - `obtener_resumen_inquilino(p_inquilino_id)` — ficha cliente
4. **Hardcode empresa_id**: solo 1 empresa (C-Krea). Helper en `src/lib/empresa.ts`:
   ```ts
   export const EMPRESA_CKREA_ID = '<uuid>'  // se llena en G.2
   ```
5. **Drizzle**: regenerar tipos desde `v2` con `drizzle-kit pull`. Schemas viejos quedan hasta G.4 completo, después se borran.

---

## 7. Gates de verificación

| Gate | Salida esperada |
|---|---|
| Después de G.1 | 12 tablas v2 visibles desde JS, build TS clean |
| Después de G.2 | Row counts: empresas=1, inquilinos≥66, locales=84, contratos≥78. 3 inquilinos del Drill A cuadran números. |
| Después de G.3 | NIT nuevo en raw → aparece en `inquilinos`. Segunda corrida no duplica. |
| Después de cada subgrupo G.4.x | Página afectada renderiza KPIs idénticos a prod actual |
| Después de G.5 | `npm run build` + `npm run lint` clean, 0 errores TS |
| Después de G.6 | Preview Vercel: 3 inquilinos del Drill A muestran mismos totales que prod |
| Después de G.7 | PR mergeado, prod live, Fase F desbloqueada |

---

## 8. Rollback strategy

En cualquier punto si algo se rompe:
- **G.1–G.3**: nada en main, branch puede borrarse sin daño
- **G.4 subgrupo X falla**: revertir solo ese commit, los demás subgrupos quedan intactos
- **G.6 preview rojo**: no merge, fix en branch
- **G.7 prod rojo**: `vercel rollback` al deploy previo + investigar en branch

`public.*` queda intacto durante toda Fase G. Solo Fase F la archiva.

---

## 9. Lo que NO se toca en Fase G

- `public.*` tablas — siguen ahí read-only durante G
- `siesa_raw.*` — ya está bien, no cambios
- `agent_budget_state` — queda en `public.*`, decisión en Fase H
- Frontend UI — solo cambia capa de datos, no UI
- Auth — solo cambia tabla `profiles` → `perfiles`, lógica idéntica

---

## 10. Checklist de arranque G.1

- [ ] Mapping doc aprobado por usuario ✋ (este paso)
- [ ] Crear branch `refactor/v2-migration`
- [ ] Confirmar acceso Supabase MCP funcional
- [ ] Confirmar `.env.local` actualizado con pooler URL
- [ ] Inventario actualizado en JOURNAL
