# C-Krea PayControl — Documentación Técnica

**Versión:** 01  
**Fecha:** 2026-05-12  
**Estado:** Documento vivo — actualizar con cada release significativo  
**Autor:** German Burgos

---

## Tabla de Contenidos

1. [Descripción del Sistema](#1-descripción-del-sistema)
2. [Arquitectura del Flujo de Datos](#2-arquitectura-del-flujo-de-datos)
3. [Origen de Datos](#3-origen-de-datos)
4. [Lógica de Negocio y Transformaciones](#4-lógica-de-negocio-y-transformaciones)
5. [Modelo de Datos](#5-modelo-de-datos)
6. [Métricas e Indicadores Clave](#6-métricas-e-indicadores-clave)
7. [Estructura del Informe / Vistas](#7-estructura-del-informe--vistas)
8. [Filtros e Interacciones](#8-filtros-e-interacciones)
9. [Seguridad y Acceso](#9-seguridad-y-acceso)
10. [Control de Cambios](#10-control-de-cambios)

---

## 1. Descripción del Sistema

### 1.1 Propósito

**C-Krea PayControl** es el portal digital de gestión de pagos del centro comercial **Central Kreativa**, ubicado en Bogotá, Colombia. Reemplaza el control manual en hojas Excel que existía previamente y centraliza toda la operación financiera de arrendamiento en una sola aplicación web.

El sistema gestiona aproximadamente **85 locales comerciales** distribuidos en 6 sedes/direcciones. Sus funciones principales son:

- Consultar en tiempo real la cartera de deuda de cada inquilino, obtenida directamente del ERP Siesa
- Visualizar y proyectar ingresos por canon de arrendamiento para el año en curso
- Controlar el estado de mora, con clasificación por severidad y alertas automáticas
- Gestionar la facturación de energía eléctrica (medida por local) como gasto separado del canon
- Proporcionar a cada inquilino un portal propio donde puede ver su cuenta, sus pagos y registrar la lectura mensual de su medidor de energía
- Permitir pagos en línea via Wompi directamente desde el portal del inquilino

### 1.2 Tipos de Usuario

| Tipo | Acceso | Descripción |
|------|--------|-------------|
| `admin` | Portal administrativo completo `/` | Gestión total: usuarios, configuración financiera, todos los módulos |
| `finanzas` | Portal administrativo completo `/` | Consulta y operación financiera, sin gestión de usuarios |
| `visor` | Portal administrativo (solo lectura) `/` | Visualización de datos, sin acciones de escritura |
| `inquilino` | Portal de inquilino `/portal` | Vista limitada: su cuenta, historial de pagos, formulario medidor, perfil |

### 1.3 Tecnologías Principales

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js App Router | ^16.2.4 |
| Lenguaje | TypeScript | — |
| UI base | shadcn/ui + Tailwind CSS v4 | — |
| Gráficas | Tremor | ^3.18.7 |
| Tablas | TanStack Table | ^8.21.3 |
| Formularios | React Hook Form + Zod | ^7.x / ^4.x |
| Base de datos | Supabase (PostgreSQL + Auth + RLS) | ^2.x |
| ORM (schema) | Drizzle ORM | ^0.45.2 |
| Runtime DB | Supabase REST RPC (`exec_sql`) | — |
| Almacenamiento archivos | Cloudflare R2 (S3-compatible) | — |
| Email transaccional | Brevo (ex-Sendinblue) | ^5.x |
| Pasarela de pagos | Wompi | — |
| Push notifications | Web Push API + VAPID | — |
| Monitoreo errores | Sentry | ^10.x |
| Analytics | PostHog | ^1.x (Fase 2) |
| Deploy | Vercel Hobby (Node 24 LTS, Fluid Compute) | — |

### 1.4 Entorno de Ejecución

La aplicación corre completamente en la nube:
- **Vercel** sirve el frontend y las funciones serverless (Server Components, Server Actions, API Routes)
- **Supabase** aloja la base de datos PostgreSQL con dos schemas: `siesa_raw` (datos del ERP) y `v2` (datos propios del portal)
- **Cloudflare R2** almacena fotos de medidores subidas por inquilinos
- **Siesa ERP** (sistema externo, solo escritura hacia Supabase) empuja datos automáticamente cada ~3 horas

---

## 2. Arquitectura del Flujo de Datos

### 2.1 Visión General

```
┌─────────────────────────────────────────────────────────────────┐
│  SIESA ERP (externo)                                            │
│  Empuja datos zona Z40 (C-Krea) cada ~3h                        │
│  Rol DB: siesa_sync                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │ INSERT / UPSERT directo
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  siesa_raw.* (5 tablas)  — FUENTE DE VERDAD FINANCIERA          │
│  ocupacion · cartera · documentos · recaudo · estado_resultados  │
└──────────────┬──────────────────────────────────────────────────┘
               │ Cron diario 05:30 COT
               │ v2.sync_desde_raw()  +  v2.recalcular_criticos()
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  v2.* (8 tablas + vistas SQL)  — DATOS PROPIOS DEL PORTAL       │
│  inquilinos · locales · contratos · proyecciones                 │
│  lecturas_medidor · facturas_energia · reglas_financieras        │
│  push_subscriptions · push_notification_log · agente_chat       │
│                                                                 │
│  VISTAS:  vista_pagos · vista_facturas · vista_cartera_actual   │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTP via exec_sql() RPC
               │ supabaseAdmin (service role) para escrituras
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/lib/data/*.ts  — CAPA DE ACCESO A DATOS                    │
│  dashboard · proyecciones · mora · pagos · facturas             │
│  gastos · medidores · electricity · portal · clientes           │
│  usuarios · configuracion · reportes · tenant-detail            │
└──────────────┬──────────────────────────────────────────────────┘
               │ Server Components (async fetch)
               │ Server Actions (mutaciones)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js App Router  — UI                                       │
│  (app)/* → Portal administrativo                                │
│  (portal)/* → Portal inquilino                                  │
│  (auth)/* → Flujos de autenticación                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Escrituras

Las escrituras del portal (lecturas de medidor, facturas de energía, proyecciones, etc.) usan `supabaseAdmin` directamente con operaciones `.insert()`, `.update()`, `.upsert()`. No pasan por `exec_sql()`.

Las escrituras del ERP entran por el rol `siesa_sync` que tiene permisos de INSERT/UPSERT solo en el schema `siesa_raw`.

### 2.3 Mecanismo de Ejecución SQL

**Archivo:** `src/lib/db/executor.ts`

Toda lectura de datos usa la función:

```typescript
execute(query: string): Promise<Row[]>
```

Que internamente llama al RPC de Supabase `exec_sql({ q: query })`. Este mecanismo reemplaza una conexión TCP directa a PostgreSQL (bloqueada en Vercel por IPv6) y usa HTTPS como transporte. El cliente usa la `SUPABASE_SERVICE_ROLE_KEY` para saltar RLS en operaciones de administración.

### 2.4 Cron Jobs Automáticos

Definidos en `vercel.json`. Todos requieren el header `Authorization: Bearer {CRON_SECRET}`.

| Endpoint | Schedule (UTC) | Hora COT | Función |
|----------|---------------|----------|---------|
| `/api/cron/sync-v2` | `30 5 * * *` | 00:30 | Sincroniza siesa_raw → v2 via `sync_desde_raw()` y recalcula contratos críticos |
| `/api/cron/accrual` | `0 6 * * *` | 01:00 | Legacy (no-op). Mantenido para no romper callers |
| `/api/cron/notifications` | `0 8 * * *` | 03:00 | Envía push notifications a inquilinos suscritos |

> **Limitación Vercel Hobby:** máximo 1 cron por endpoint por día. No es posible schedular más frecuencia.

---

## 3. Origen de Datos

### 3.1 Sistemas de Origen

#### Siesa ERP

El ERP Siesa actúa como sistema de registro (system of record) para toda la información financiera: precios, contratos, cartera, recaudos y estado de resultados. El portal **nunca escribe en siesa_raw**, solo lee. El ERP empuja datos con el rol `siesa_sync`, filtrando por la zona `Z40` (identificador de C-Krea en Siesa).

#### Supabase PostgreSQL

Base de datos principal. Dos schemas:

- **`siesa_raw`** — datos empujados por el ERP. Solo lectura desde el portal.
- **`v2`** — tablas propias del portal: inquilinos enriquecidos, locales, contratos, medidores, facturas de energía, proyecciones, usuarios, notificaciones.

#### Cloudflare R2

Almacenamiento de objetos S3-compatible para fotos de medidores. Las fotos se suben via Server Action usando `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner`. La ruta de almacenamiento sigue el patrón:

```
medidores/{YYYY-MM}/local-{unidad}-{timestamp}.{ext}
```

Las URLs de visualización son pre-firmadas (signed URLs) con expiración configurada.

### 3.2 Variables de Entorno Requeridas

| Variable | Alcance | Descripción |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Público | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público | Clave anónima para auth del lado cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor | Clave de rol de servicio, bypasa RLS |
| `DATABASE_URL` | Servidor | Pooler URL de Supabase (puerto 5432 via pooler, no directo) |
| `CRON_SECRET` | Servidor | Token secreto para autenticar endpoints de cron |
| `BREVO_API_KEY` | Servidor | API key del servicio de email Brevo |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Público | Clave VAPID pública para Web Push |
| `VAPID_PRIVATE_KEY` | Servidor | Clave VAPID privada para Web Push |
| `VAPID_SUBJECT` | Servidor | Email o URL de contacto VAPID |
| `R2_ACCOUNT_ID` | Servidor | ID de cuenta Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | Servidor | Clave de acceso R2 |
| `R2_SECRET_ACCESS_KEY` | Servidor | Clave secreta R2 |
| `R2_BUCKET_NAME` | Servidor | Nombre del bucket R2 |
| `R2_PUBLIC_URL` | Servidor | URL pública del bucket R2 |
| `NEXT_PUBLIC_SITE_URL` | Público | URL del sitio (usado en emails) |

### 3.3 Tablas del Schema `siesa_raw`

#### `siesa_raw.ocupacion`

**Fuente de verdad de contratos y precios activos.** El ERP mantiene aquí qué local ocupa qué inquilino, con qué precio y con qué descuentos.

| Campo clave | Tipo | Descripción |
|-------------|------|-------------|
| `loc` | text | Código del local (ej. `L101`). Hace JOIN con `v2.locales.unidad` |
| `documento` | text | NIT del inquilino. Hace JOIN con `v2.inquilinos.nit` |
| `razon_social` | text | Nombre del inquilino en el ERP |
| `precio` | numeric | Canon mensual bruto sin IVA |
| `descuento` | numeric | Descuento de fase en % (0/10/20/30/43%) |
| `pronto_pago` | numeric | Descuento por pronto pago en % (ej. 10, 20, 30) |
| `fecha_inicio` | date | Inicio del contrato (determina qué meses aplica descuento de fase) |

#### `siesa_raw.cartera`

**Cartera vencida y por vencer por inquilino.** Cada fila = una cuota/factura pendiente de cobro.

| Campo clave | Tipo | Descripción |
|-------------|------|-------------|
| `documento` | text | NIT del inquilino |
| `factura` | text | Número de factura (prefijo `FVS-` para facturas de arriendo) |
| `saldo` | numeric | Saldo pendiente de esa cuota |
| `vr_vencido` | numeric | Monto ya vencido de esa cuota |
| `dias_mora` | int | Días desde fecha de vencimiento |
| `financia` | int | Días financiados (usado para detectar mora: `financia > 30` = en mora) |
| `fecha_vence` | date/text | Fecha de vencimiento (atención: campo misconfigured para facturas pre-mayo 2026; usar `financia - 30` para calcular interés) |
| `sucursal` | text | Identificador de la unidad/local |

> **Nota crítica:** La columna `fecha_vencimiento` de `siesa_raw.cartera` está mal configurada para facturas anteriores a mayo 2026. Para interés de mora, el umbral correcto es `financia - 30`, no `fecha_vence`. Ver `financial_rules_payment_timeline.md`.

#### `siesa_raw.documentos`

**Histórico de facturas emitidas (ventana de ~4 meses).** De aquí proviene `v2.vista_facturas`.

| Campo clave | Tipo | Descripción |
|-------------|------|-------------|
| `doc` | text | Número de documento/factura. Es la clave de join con otros registros |
| `nit_inquilino` | text | NIT del inquilino |
| `periodo` | int | Período YYYYMM (ej. 202605) |
| `base_neta` | numeric | Base antes de impuestos |
| `iva` | numeric | Valor del IVA |
| `retenciones` | numeric | Retefuente u otras retenciones |
| `valor_total` | numeric | Total a pagar (base + IVA - retenciones) |
| `tipo` | text | Tipo de documento: `Facturas`, `Descuentos`, etc. |

> **Nota de deduplicación:** Los documentos de tipo `Descuentos` con prefijos `RK-` o `CN-` representan el cierre contable del pronto pago (PP). La vista `vista_facturas` filtra `is_factura = true` para excluir estos registros y mostrar solo facturas reales.

#### `siesa_raw.recaudo`

**Pagos recibidos registrados en el ERP.** La vista `v2.vista_pagos` aplica 4 filtros canónicos sobre esta tabla para obtener pagos limpios:
1. Tipo de documento `FVS` (cruce válido)
2. Deduplicación (mismo docto/cruce no se cuenta dos veces)
3. Valores < $1.000.000.000 (excluye movimientos internos)
4. Zona `Z40` (solo C-Krea)

| Campo clave | Tipo | Descripción |
|-------------|------|-------------|
| `documento` | text | NIT del inquilino (no el número de factura) |
| `docto` | text | Número del documento de pago |
| `cruce` | text | Factura con la que se cruza el pago |
| `valor_final` | numeric | Monto aplicado del pago |
| `fecha_recaudo` | date | Fecha de recepción del pago |
| `pronto_pago_aplicado` | numeric | Descuento por PP aplicado en este pago |

#### `siesa_raw.estado_resultados`

**Estado de resultados mensual del ERP, por cuenta contable y centro de costo.** Usado por el módulo de Gastos.

| Campo clave | Tipo | Descripción |
|-------------|------|-------------|
| `cuenta` | text | Código de cuenta contable PUC |
| `desc_cuenta` | text | Descripción de la cuenta |
| `valor` | numeric | Valor del gasto en el período |
| `periodo` | int | Período YYYYMM |
| `ccosto` | text | Centro de costo. `285` = C-Krea |
| `notas` | text | Notas del asiento (usado para identificar facturas de energía por número de contrato) |

### 3.4 Tablas del Schema `v2` (propias del portal)

#### `v2.empresas`

Entidad raíz del portal. Permite operar múltiples empresas desde la misma base de datos (multi-tenant a nivel empresa).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | Identificador interno |
| `nombre` | text | Nombre de la empresa (ej. "Central Kreativa C-KREA") |
| `nit` | text UNIQUE | NIT de la empresa |
| `siesa_co_id` | text | ID de compañía en Siesa |
| `siesa_zona` | text | Zona en Siesa (Z40 para C-Krea) |
| `siesa_ccosto` | text | Centro de costo Siesa (285) |

#### `v2.perfiles`

Usuarios del portal con su rol y vínculo al inquilino (si aplica).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | Mismo UUID que Supabase Auth (1:1 con `auth.users`) |
| `empresa_id` | uuid FK | Empresa a la que pertenece |
| `inquilino_id` | uuid FK nullable | Vincula al inquilino (solo para rol `inquilino`) |
| `rol` | enum | `admin`, `finanzas`, `visor`, `inquilino` |
| `activo` | boolean | Si el usuario puede iniciar sesión |

#### `v2.inquilinos`

Directorio de inquilinos enriquecido. La clave de join con `siesa_raw` es `nit`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | Identificador interno |
| `nit` | text | NIT del inquilino (JOIN key con `siesa_raw.*.documento`) |
| `razon_social` | text | Nombre legal completo |
| `nombre_corto` | text | Nombre comercial para mostrar en UI |
| `tipo_persona` | text | `PJ` (persona jurídica) o `PN` (persona natural). Determina retefuente |
| `juridica` | boolean | `true` = en cobro jurídico. Filtra la vista de mora comercial |
| `portal_email` | text | Email para el portal (puede diferir del email contable) |
| `pp_historico_pct` | numeric | % histórico de veces que pagó con pronto pago (0-100). Usado en proyecciones esperadas |
| `pp_historico_pagos` | int | Número total de pagos para calcular el % histórico |

#### `v2.locales`

Registro de cada unidad arrendable.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | Identificador interno |
| `unidad` | text | Código del local (ej. `L101`). JOIN key con `siesa_raw.ocupacion.loc` |
| `codigo` | text | Código alternativo del local |
| `entrada` | text | Acceso/bloque al que pertenece (filtra la vista por zona) |
| `area_m2` | numeric | Área en metros cuadrados |
| `grupo_energia` | text | Grupo eléctrico al que pertenece (determina a qué factura de energía se asocia) |
| `tiene_medidor` | boolean | Si el local tiene medidor de energía individual |
| `estado` | enum | `arrendado`, `disponible`, `oficina`, `mantenimiento` |

#### `v2.contratos`

Contratos entre inquilino y local. El portal los sincroniza desde `siesa_raw.ocupacion` via `sync_desde_raw()`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | Identificador interno |
| `inquilino_id` | uuid FK | Inquilino contratante |
| `local_id` | uuid FK | Local arrendado |
| `fecha_inicio` | date | Inicio del contrato |
| `canon_base` | numeric | Canon base mensual |
| `descuento_pct` | numeric | Descuento general en % |
| `pronto_pago_pct` | numeric | Descuento por pronto pago en % |
| `descuento_phase_pct` | numeric | Descuento de fase temporal |
| `descuento_hasta_mes` | int | Mes (desde inicio) hasta el que aplica el descuento de fase |
| `flag_uno` | boolean | Contrato con condición especial día 1 |
| `flag_once` | boolean | Contrato con condición especial día 11 |
| `flag_veintiuno` | boolean | Contrato con condición especial día 21 |
| `flag_critico` | boolean | Marca de escalación crítica |
| `estado` | enum | `activo`, `critico`, `vencido`, `terminado` |

#### `v2.proyecciones`

Proyecciones de ingresos por contrato por mes. Un registro por local × año × mes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `contrato_id` | uuid FK | Contrato proyectado |
| `local_id` | uuid FK | Local |
| `anio` | int | Año de la proyección |
| `mes` | int | Mes (1-12) |
| `canon_proyectado` | numeric | Canon proyectado para ese mes |
| `descuento_proyectado` | numeric | Descuento proyectado para ese mes |

#### `v2.lecturas_medidor`

Lecturas mensuales de medidores eléctricos, una por local por período.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `local_id` | uuid FK | Local cuyo medidor se leyó |
| `periodo` | text | Período YYYY-MM |
| `lectura_anterior` | numeric | Lectura del mes anterior |
| `lectura_actual` | numeric | Lectura del mes actual |
| `kwh` | numeric | Consumo = lectura_actual - lectura_anterior |
| `tarifa_kwh` | numeric | Tarifa aplicada ($/kWh) |
| `total_energia` | numeric | Total = MROUND(kwh × tarifa, 50) |
| `foto_url` | text | Clave del objeto en Cloudflare R2 |
| `submitted_by` | uuid FK | Usuario que registró la lectura |
| `estado_validacion` | enum | `pendiente`, `aprobado`, `revision`, `critico` |

#### `v2.facturas_energia`

Facturas consolidadas de energía por grupo eléctrico por período. Una por grupo × mes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `periodo` | text | Período YYYY-MM |
| `grupo_energia` | text | Código del grupo (ej. `CRA2710065`) |
| `direccion` | text | Dirección física del contador |
| `proveedor` | text | Proveedor (ERCO ENERGÍA / CODENSA) |
| `valor_factura` | numeric | Valor total de la factura del proveedor |
| `kwh_factura` | numeric | kWh totales facturados |
| `tarifa_kwh` | numeric | Tarifa calculada = valor_factura / kwh_factura |

#### `v2.reglas_financieras`

Parámetros financieros configurables con vigencia temporal.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `clave` | text | Identificador de la regla (ej. `interes_mora_diario`, `periodo_gracia`) |
| `valor` | numeric | Valor de la regla |
| `fecha_desde` | date | Desde cuándo aplica |
| `fecha_hasta` | date nullable | Hasta cuándo aplica (null = vigente indefinidamente) |

#### `v2.push_subscriptions` y `v2.push_notification_log`

Tablas para el sistema de notificaciones push.

- `push_subscriptions`: endpoint, p256dh, auth keys del browser de cada usuario suscrito
- `push_notification_log`: registro dedup de notificaciones enviadas (tipo, reference_id, user_id) para evitar re-envíos

### 3.5 Vistas SQL en `v2`

#### `v2.vista_facturas`

Deriva de `siesa_raw.documentos`. Expone facturas de arrendamiento con flag `is_factura = true` para separar facturas reales de notas de crédito y descuentos. Campos principales: `doc_id`, `inquilino_id`, `empresa_id`, `periodo` (int YYYYMM), `razon_social`, `nit_inquilino`, `base_neta`, `iva`, `retenciones`, `valor_total`.

#### `v2.vista_pagos`

Aplica los 4 filtros canónicos sobre `siesa_raw.recaudo`. Expone pagos validados con: `inquilino_id`, `fecha_recaudo`, `valor_final`, `pronto_pago_aplicado`, `docto`, `cruce`, `dias_mora_al_pago`.

#### `v2.vista_cartera_actual`

Estado de cartera vigente por inquilino. Derivada de `siesa_raw.cartera` con joins a `v2.inquilinos`. Campos clave: `inquilino_id`, `vr_vencido`, `saldo`, `dias_mora`, `juridica`, `empresa_id`, `row_id`.

---

## 4. Lógica de Negocio y Transformaciones

### 4.1 Las Cuatro Reglas Financieras

Toda la matemática de facturación del portal se rige por cuatro reglas que deben consultarse en `docs/foundation/02_financial_rules/financial-rules-engine-spec.md` ante cualquier duda. Nunca se deben asumir sin verificar.

#### Regla A — Pronto Pago (PP)

Si el inquilino paga dentro de los **10 primeros días del mes**, se le aplica un descuento de pronto pago. El porcentaje está pactado por contrato (típicamente 10%, 20% o 30%).

**Cuándo aplicar:** Solo en el momento del pago real. **Nunca** en proyecciones ni en el cálculo de cartera (`vista_cartera_actual`). Aplicarlo en proyecciones infla el denominador y produce double-counting.

**Dónde vive el PP en el sistema:**
- `v2.vista_pagos.pronto_pago_aplicado` → monto que ya se descontó en un pago recibido
- `siesa_raw.documentos` tipo `Descuentos` (prefijos `RK-`, `CN-`) → cierre contable del PP en Siesa
- `v2.contratos.pronto_pago_pct` → % pactado en el contrato

#### Regla B — Descuento de Fase (Phase Discount)

Descuento temporal por tiempo de contrato. Aplica durante un número determinado de meses desde el inicio del contrato y luego expira. Los porcentajes posibles son: 0%, 10%, 20%, 30%, 43%.

**Cómo se modela en SQL:**
```sql
-- Mes hasta el que aplica el descuento de fase:
CASE
  WHEN c.descuento_hasta_mes IS NULL THEN 13  -- nunca expira en el año
  WHEN (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval) < DATE '2026-01-01' THEN 0  -- ya expiró
  WHEN (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval) > DATE '2026-12-31' THEN 13 -- expira después del año
  ELSE EXTRACT(MONTH FROM (c.fecha_inicio + (c.descuento_hasta_mes || ' months')::interval))::int
END AS mes_dcto_end
```

Esto produce un "step-up" en el gráfico de proyecciones mensuales cuando el descuento expira a mitad de año.

#### Regla C — Interés de Mora

**Tasa:** 0.05% diario (equivale a ~1.5% mensual).  
**Inicio:** día 31 desde la fecha de vencimiento de la factura (no desde el día 11 como configuró Siesa incorrectamente para facturas pre-mayo 2026).

**Cálculo correcto:**
```
días en mora = financia - 30
interés = saldo × 0.0005 × días_en_mora
```

El campo `financia` de `siesa_raw.cartera` es el número de días que lleva el documento financiado. `financia > 30` significa que entró en mora.

**Implementación actual:** El interés se calcula bajo demanda desde `v2.vista_cartera_actual.dias_mora`. La función `runInterestAccrual()` en `src/lib/interest-engine.ts` es un **no-op** (preservada para compatibilidad). No existe tabla de accruals — el interés no se persiste, se calcula en cada consulta.

#### Regla D — Gastos Facturables

- **Agua:** tarifa plana por unidad ($29,947 COP/unidad en la configuración actual)
- **Energía eléctrica:** medida por local. Fórmula: `MROUND(kWh × tarifa_kWh, 50)`. El factor de redondeo es 50 (no 250)
- **Otros gastos (vigilancia, nómina, reparaciones, etc.):** absorbidos por C-Krea, **no** se cobran al inquilino

### 4.2 Cadena de Cálculo de Factura

El flujo de cálculo de lo que paga un inquilino es:

```
Canon bruto mensual (de siesa_raw.ocupacion.precio)
  − Descuento de fase  (si aplica según mes y fecha_inicio del contrato)
  = Base neta antes de IVA
  × IVA 19%
  − Retefuente 3.5% (solo si tipo_persona = 'PJ')
    → Multiplicador efectivo: PJ = × 1.155, PN = × 1.19
  − Pronto Pago (solo si se aplica al momento del pago)
  + Gastos facturables (energía: medida | agua: plana)
  + Interés de mora (si dias_mora > 30)
  = Total a pagar
```

### 4.3 Proyecciones de Ingresos

**Archivo:** `src/lib/data/proyecciones.ts`

El sistema calcula tres escenarios de ingreso anual desde `siesa_raw.ocupacion` (fuente viva, no tabla histórica):

| Escenario | Fórmula | Descripción |
|-----------|---------|-------------|
| `techo_con_iva` | `canon × (1 - dcto_fase) × multiplicador_iva` | Máximo teórico: nadie toma pronto pago |
| `piso_con_iva` | `canon × (1 - dcto_fase) × (1 - pp_pct) × multiplicador_iva` | Piso: todos toman pronto pago |
| `neto_esperado` | `canon × (1 - dcto_fase) × (1 - pp_pct × pp_hist_pct) × multiplicador_iva` | Esperado: ponderado por historial de PP por inquilino |

Donde `pp_hist_pct` es `v2.inquilinos.pp_historico_pct / 100`. Si un inquilino tiene 40% de historial de PP, significa que en promedio aplica PP el 40% de las veces que puede.

**El IPC no está modelado.** Los incrementos anuales no se proyectan automáticamente.

**Contratos de inicio en el año** se manejan con `mes_start` = mes de la fecha de inicio (los meses anteriores aportan $0 al cálculo anual).

### 4.4 Cálculo de Gastos Operativos

**Archivo:** `src/lib/data/gastos.ts`

Los gastos se leen directamente de `siesa_raw.estado_resultados` filtrando `ccosto = '285'` (centro de costo de C-Krea). Las cuentas contables PUC se mapean a categorías de negocio mediante una expresión CASE SQL:

| Cuenta(s) contable(s) | Categoría de negocio |
|-----------------------|----------------------|
| `52350506` | Vigilancia |
| `5205*` (cualquier subcuenta) | Nómina |
| `52352501`, `52353001`, `52353502`, `52353505` | Servicios públicos |
| `52350505`, `52952501`, `52952502` | Aseo y cafetería |
| `52356001` | Publicidad |
| `52501501` | Reparaciones |
| `5215*` (cualquier subcuenta) | Impuestos |
| Resto | Otros |

El período se convierte de formato `YYYY-MM` a entero YYYYMM para hacer JOIN con `siesa_raw.estado_resultados.periodo`.

### 4.5 Facturación de Energía Eléctrica

**Archivos:** `src/lib/data/electricity.ts`, `src/lib/data/medidores.ts`, `src/app/(app)/medidores/facturas/`

El flujo completo de facturación de energía es:

1. **Inquilino registra lectura** via portal (`/portal/medidor`). Se guarda en `v2.lecturas_medidor`.
2. **Admin valida las lecturas** en `/medidores`. Estado: `pendiente → aprobado/revision/critico`.
3. **Admin ingresa factura del proveedor** en `/medidores/facturas`. Se guarda en `v2.facturas_energia`. Alternativamente, el sistema intenta leer el valor de la factura desde `siesa_raw.estado_resultados` por número de contrato del proveedor.
4. **Sistema calcula tarifa** = `valor_factura / kwh_factura` y la aplica a cada lectura del grupo.
5. **Fórmula por local:** `total_energia = MROUND(kwh × tarifa_kwh, 50)`.
6. **Fecha límite** de registro de lectura: día 9 de cada mes. El admin factura asumiendo fecha de facturación día 9.

**Los 6 grupos eléctricos** (definidos en `src/lib/data/electricity.ts` como `ELECTRICITY_GROUPS`):

| Grupo | Dirección | Proveedor | NIT Proveedor | N° Contrato |
|-------|-----------|-----------|---------------|-------------|
| `CRA2710065` | CARRERA 27 #10-65 | ERCO ENERGÍA SA ESP | 900.570.286-9 | 359580 |
| `CRA2710071` | KR 27 N°10-71 | CODENSA SA ESP | 860.063.875-8 | 359581 |
| `CRA2710073` | KR 27 N°10-73 | CODENSA SA ESP | 860.063.875-8 | 359583 |
| `CLL112733` | CALLE 11 #27-33 | ERCO ENERGÍA SA ESP | 900.570.286-9 | 354985 |
| `CLL112739` | CALLE 11 #27-39 | ERCO ENERGÍA SA ESP | 900.570.286-9 | 902329 |
| `CRA2710079` | KR 27 N°10-79 | CODENSA SA ESP | 860.063.875-8 | 359585 |

El número de contrato se usa para identificar la factura del proveedor en `siesa_raw.estado_resultados.notas` (el ERP registra el número de contrato en las notas del asiento contable de energía).

### 4.6 Retefuente (Personas Jurídicas)

Los inquilinos con `tipo_persona = 'PJ'` retienen en la fuente el 3.5% sobre la base neta (la ley colombiana obliga a los compradores personas jurídicas a retener y girar directamente al estado).

**Efecto en el multiplicador:**
- **PN (persona natural):** `× 1.19` (solo IVA)
- **PJ (persona jurídica):** `× 1.155` (IVA 19% menos retefuente 3.5%)

**Importante:** `tipo_persona` (entidad jurídica vs natural para retefuente) es diferente de `juridica` (campo booleano que indica si el inquilino está en cobro jurídico/legal). No confundir.

### 4.7 Sincronización ERP → Portal

**Endpoint:** `/api/cron/sync-v2` → llama RPC `v2.sync_desde_raw()`.

La función `sync_desde_raw()` es un procedimiento almacenado en Supabase que hace UPSERT de datos desde `siesa_raw.*` hacia `v2.*` (inquilinos, locales, contratos). Es de solo actualización/inserción, no hace DELETE — los registros eliminados en Siesa permanecen en `v2` como huérfanos hasta limpieza manual.

Posterior a la sincronización, `v2.recalcular_criticos()` evalúa contratos para marcar estado `critico` según las reglas de escalación.

### 4.8 Sistema de Notificaciones Push

**Archivo:** `src/api/cron/notifications/route.ts`, `src/lib/push.ts`

El cron de notificaciones corre diariamente a las 08:00 UTC y evalúa 6 tipos de eventos para cada inquilino suscrito:

| Tipo | Trigger | Frecuencia máxima |
|------|---------|-------------------|
| `due3d` | Factura vence en 3 días | 1 vez por factura |
| `due0d` | Factura vence hoy | 1 vez por factura |
| `overdue` | Primer día en mora (`financia = 31`) | 1 vez por factura |
| `mora_weekly` | Lunes, si tiene facturas con `financia > 31` | 1 vez por semana por usuario |
| `lease{30\|60}d` | Contrato vence en exactamente 30 o 60 días | 1 vez por umbral |
| `meter` | Día 7 del mes, si no hay lectura registrada para el período | 1 vez por período |
| `payment_confirmed` | Pago registrado ayer en `v2.vista_pagos` | 1 vez por pago (docto+cruce) |

La deduplicación se hace via tabla `v2.push_notification_log` (tipo + reference_id). Si el INSERT falla por unicidad, la notificación ya fue enviada y se salta.

Las notificaciones usan el protocolo **Web Push con VAPID**. Las suscripciones se almacenan en `v2.push_subscriptions` con los campos estándar: `endpoint`, `p256dh`, `auth`.

### 4.9 Emails Transaccionales

**Archivo:** `src/lib/email/index.ts`

Proveedor: Brevo. Remitente: `noreply@ckrea.com.co` (nombre: "C-Krea Portal").

| Función | Trigger | Asunto |
|---------|---------|--------|
| `sendWelcomeEmail()` | Admin crea nuevo usuario inquilino | "Bienvenido al Portal C-Krea — crea tu contraseña" |
| `sendPasswordResetEmail()` | Usuario solicita reset de contraseña | "Restablecer contraseña — Portal C-Krea" |

Los emails son HTML responsivos con diseño branded (fondo slate-900, logo C-Krea).

---

## 5. Modelo de Datos

### 5.1 Relaciones entre Entidades

```
v2.empresas (1)
  └── v2.locales          (N)  empresa_id FK
  └── v2.inquilinos       (N)  empresa_id FK
  └── v2.contratos        (N)  empresa_id FK
  └── v2.proyecciones     (N)  empresa_id FK
  └── v2.reglas_financieras(N) empresa_id FK
  └── v2.facturas_energia (N)  empresa_id FK
  └── v2.lecturas_medidor (N)  empresa_id FK
  └── v2.perfiles         (N)  empresa_id FK

v2.contratos (N:1 con inquilinos, N:1 con locales)
  ├── inquilino_id  → v2.inquilinos.id
  └── local_id      → v2.locales.id

v2.proyecciones
  ├── contrato_id → v2.contratos.id
  └── local_id    → v2.locales.id
  UNIQUE: (local_id, anio, mes)

v2.lecturas_medidor
  └── local_id → v2.locales.id
  UNIQUE: (local_id, periodo)

v2.facturas_energia
  └── empresa_id FK
  UNIQUE: (empresa_id, periodo, grupo_energia)

v2.perfiles (1:1 con auth.users)
  └── inquilino_id → v2.inquilinos.id (nullable, solo rol inquilino)
```

### 5.2 Joins Críticos con `siesa_raw`

Estos joins no son FK declaradas — son joins lógicos vía campos de texto:

| `v2` campo | `siesa_raw` campo | Tabla siesa |
|------------|-------------------|-------------|
| `v2.inquilinos.nit` | `siesa_raw.ocupacion.documento` | ocupacion |
| `v2.inquilinos.nit` | `siesa_raw.cartera.documento` | cartera |
| `v2.inquilinos.nit` | `siesa_raw.recaudo.documento` | recaudo |
| `v2.locales.unidad` | `siesa_raw.ocupacion.loc` | ocupacion |
| `v2.locales.grupo_energia` | detectado via `notas` del asiento | estado_resultados |

### 5.3 Enums de Base de Datos

Todos definidos en `src/lib/db/schema/v2/enums.ts`:

| Enum | Valores |
|------|---------|
| `rol_usuario` | `admin`, `finanzas`, `visor`, `inquilino` |
| `estado_local` | `arrendado`, `disponible`, `oficina`, `mantenimiento` |
| `estado_contrato` | `activo`, `critico`, `vencido`, `terminado` |
| `categoria_gasto` | `servicios_publicos`, `aseo_cafeteria`, `vigilancia`, `nomina`, `publicidad`, `reparaciones`, `impuestos`, `otros` |
| `metodo_asignacion` | `pro_rata`, `fijo`, `medido`, `porcentaje` |
| `estado_validacion_lectura` | `aprobado`, `revision`, `critico`, `pendiente` |

---

## 6. Métricas e Indicadores Clave

### 6.1 Dashboard Principal (`/`)

**Archivo:** `src/lib/data/dashboard.ts`

| KPI | Descripción | Cómo se calcula | Fuente |
|-----|-------------|-----------------|--------|
| **Piso realista** | Ingreso mínimo esperado del portafolio para el año | `SUM(canon × (1-dcto_fase) × (1-pp_pct) × multiplicador_iva)` por todos los contratos activos × 12 meses | `siesa_raw.ocupacion` + `v2.contratos` |
| **Techo máximo** | Ingreso máximo si nadie usa pronto pago | `SUM(canon × (1-dcto_fase) × multiplicador_iva)` | `siesa_raw.ocupacion` |
| **Locales activos** | Contratos en estado `activo` o `critico` | `COUNT(DISTINCT local_id)` en `v2.contratos` | `v2.contratos` |
| **Total unidades** | Todas las unidades registradas | `COUNT(*)` en `v2.locales` | `v2.locales` |
| **Ocupación %** | Locales activos / total unidades | `(active_clients / total_units) × 100` | Calculado en página |
| **Total recaudado año** | Suma de pagos recibidos en el año | `SUM(valor_final)` de `v2.vista_pagos` | `v2.vista_pagos` |
| **PP otorgado** | Descuentos de pronto pago aplicados | `SUM(pronto_pago_aplicado)` | `v2.vista_pagos` |
| **Meta %** | Recaudado vs piso realista | `recaudado / piso_realista × 100` (no suma PP para evitar double-count) | Calculado en página |
| **Mora total** | Suma de cartera vencida (excl. jurídica) | `SUM(vr_vencido)` donde `dias_mora > periodo_gracia` y `juridica = false` | `v2.vista_cartera_actual` |
| **Mora crítica** | Cartera con más de 60 días de mora | `SUM(vr_vencido)` donde `dias_mora > 60` | `v2.vista_cartera_actual` |
| **Mora activa** | Cartera entre `gracia+1` y 60 días | `SUM(vr_vencido)` en ese rango | `v2.vista_cartera_actual` |
| **Clientes en mora** | Número de inquilinos con saldo vencido | `COUNT(DISTINCT inquilino_id)` | `v2.vista_cartera_actual` |
| **Promedio días mora** | Días promedio de atraso | `AVG(NULLIF(dias_mora, 0))` | `v2.vista_cartera_actual` |

### 6.2 Proyecciones (`/proyecciones`)

| KPI | Descripción |
|-----|-------------|
| **Canon bruto anual** | Suma de cánones sin descuentos |
| **Descuentos de fase** | Total de descuentos por fase del año |
| **IVA total** | 19% sobre base neta |
| **Piso con IVA** | Ingreso si todos usan PP |
| **Techo con IVA** | Ingreso si nadie usa PP |
| **Neto esperado** | Ingreso ponderado por historial de PP |
| **PP esperado** | Descuentos de PP que se proyectan dar |

### 6.3 Aging de Cartera

Calculado en `src/lib/data/reportes.ts → getAgingBuckets()`:

| Bucket | Condición |
|--------|-----------|
| Al día | `dias_mora <= 0` |
| 1–30 días | `dias_mora <= 30` |
| 31–60 días | `dias_mora <= 60` |
| Crítica | `dias_mora > 60` |

### 6.4 Proyectado vs Real por Mes

Función `getProyectadoVsReal()` en `src/lib/data/reportes.ts`. Combina:
- `proyectado` (= `piso`): calculado desde `siesa_raw.ocupacion`
- `recaudado`: de `v2.vista_pagos`
- `ppOtorgado`: de `v2.vista_pagos`
- `pendiente`: `piso - recaudado`
- `diferencia`: `recaudado - piso`

### 6.5 KPIs de Gastos

| KPI | Cómo |
|-----|------|
| Total YTD | `SUM(valor)` de `estado_resultados` donde `ccosto='285'` y año = filtro |
| Promedio mensual | `AVG(total mensual)` |
| Último período | Mes más reciente con datos |

---

## 7. Estructura del Informe / Vistas

### 7.1 Páginas y Rutas

#### Portal Administrativo `(app)/`

| Ruta | Archivo | Descripción | Roles |
|------|---------|-------------|-------|
| `/` | `(app)/page.tsx` | Dashboard: KPIs de portafolio, mora, recaudo, gráfico proyectado vs real | Todos |
| `/proyecciones` | `(app)/proyecciones/page.tsx` | Proyecciones anuales: summary cards, gráfico barras mensual, tabla detalle por contrato, snapshot mes actual vs siesa | Todos |
| `/mora` | `(app)/mora/page.tsx` | Tabla de inquilinos en mora (comercial), tabla jurídica separada, summary cards, botón calcular intereses | Todos |
| `/pagos` | `(app)/pagos/page.tsx` | Historial de pagos con filtro por mes e inquilino | Todos |
| `/locales` | `(app)/locales/page.tsx` | KPIs de ocupación, tabla de todos los locales con estado | Todos |
| `/locales/[id]` | `(app)/locales/[id]/page.tsx` | Detalle de un local: contrato activo, historial de pagos, cartera | Todos |
| `/gastos` | `(app)/gastos/page.tsx` | Estado de resultados por categoría, gráfico histórico por mes, drill-down por cuenta contable | Todos |
| `/medidores` | `(app)/medidores/page.tsx` | Tabla de lecturas por período: kWh, desviación vs promedio 3 meses, estado de validación, foto | Admin, finanzas |
| `/medidores/facturas` | `(app)/medidores/facturas/page.tsx` | Gestión de facturas de energía por grupo y período | Admin, finanzas |
| `/facturas` | `(app)/facturas/page.tsx` | Listado de facturas desde `vista_facturas`, filtro por período | Todos |
| `/facturas/[id]` | `(app)/facturas/[id]/page.tsx` | Detalle de factura individual, botón imprimir PDF | Todos |
| `/archivos` | `(app)/archivos/page.tsx` | Gestión de archivos en Cloudflare R2 | Todos |
| `/usuarios` | `(app)/usuarios/page.tsx` | Gestión de usuarios admin y usuarios inquilino, invitaciones, edición | Admin |
| `/configuracion` | `(app)/configuracion/page.tsx` | Configuración de reglas financieras (`v2.reglas_financieras`) | Admin |

#### Portal Inquilino `(portal)/`

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/portal` | `(portal)/portal/page.tsx` | Dashboard del inquilino: estado cuenta, saldo pendiente, cartera desglosada, botón Wompi, factura energía del período |
| `/portal/pagos` | `(portal)/portal/pagos/page.tsx` | Historial completo de pagos del inquilino |
| `/portal/medidor` | `(portal)/portal/medidor/page.tsx` | Formulario de registro de lectura de medidor + foto, historial de consumo |
| `/portal/perfil` | `(portal)/portal/perfil/page.tsx` | Datos del contrato: canon, descuentos, fechas, NIT, contacto |

#### Autenticación `(auth)/`

| Ruta | Descripción |
|------|-------------|
| `/login` | Formulario de login con email/contraseña via Supabase Auth |
| `/forgot-password` | Solicitud de reset de contraseña (envía email via Brevo) |
| `/update-password` | Formulario de nueva contraseña (token en URL) |
| `/auth/confirm` | Callback de confirmación de email de Supabase |

#### API Routes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/callback` | GET | Callback OAuth de Supabase Auth |
| `/api/cron/sync-v2` | GET | Sincronización ERP → portal (requiere `CRON_SECRET`) |
| `/api/cron/accrual` | GET | Legacy no-op (requiere `CRON_SECRET`) |
| `/api/cron/notifications` | GET | Envío de push notifications (requiere `CRON_SECRET`) |
| `/api/medidores/export-energia` | GET | Exporta tabla de energía como Excel (.xlsx) |
| `/api/push` | POST | Registro/actualización de suscripción push del browser |

### 7.2 Componentes Principales

#### Componentes de Layout

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `Sidebar` | `components/layout/sidebar.tsx` | Navegación lateral fija (220px, fondo slate-900). Muestra los 9 ítems del menú admin con íconos Lucide |

#### Dashboard

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `RecaudoCard` | `components/dashboard/recaudo-card.tsx` | Tarjeta de recaudo anual con breakdown de PP otorgado y porcentaje de meta |
| `RendimientoChart` | `components/dashboard/rendimiento-chart.tsx` | Gráfico de barras (Tremor) proyectado vs real por mes |

#### Módulo Mora

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `MoraTable` | `components/mora/mora-table.tsx` | Tabla TanStack de inquilinos en mora con días, saldo vencido, meses pendientes |
| `AccrualForm` | `components/mora/accrual-form.tsx` | Formulario de cálculo de intereses (botón que llama Server Action) |

#### Módulo Pagos

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `PagosTable` | `components/pagos/pagos-table.tsx` | Tabla de pagos con columnas: fecha, cliente, local, monto, días mora al pago |
| `MonthFilter` | `components/pagos/month-filter.tsx` | Selector de mes para filtrar pagos |

#### Módulo Proyecciones

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `ProyeccionesChart` | `components/proyecciones/proyecciones-chart.tsx` | Gráfico mensual con 3 líneas: techo, piso, esperado |
| `DetalleTable` | `components/proyecciones/detalle-table.tsx` | Tabla por contrato con canon, descuentos, PP histórico, neto anual |
| `MensualDetalleTable` | `components/proyecciones/mensual-detalle-table.tsx` | Tabla del mes actual facturado vs proyectado |
| `GenerateButton` | `components/proyecciones/generate-button.tsx` | Genera proyecciones para el año seleccionado |

#### Módulo Locales / Clientes

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `ClientesTable` | `components/clientes/clientes-table.tsx` | Vista consolidada de todos los locales con estado de mora |
| `CarteraTable` | `components/clientes/cartera-table.tsx` | Tabla de cartera por factura del inquilino seleccionado |

#### Módulo Medidores

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `MedidoresAdminTable` | `components/medidores/medidores-admin-table.tsx` | Tabla de lecturas del período: kWh, desviación %, validación, foto con signed URL |
| `LecturaForm` | `components/medidores/lectura-form.tsx` | Formulario de ingreso de lectura manual por el admin |
| `MedidoresFilter` | `components/medidores/medidores-filter.tsx` | Filtro por período (selector mes/año) |

#### Módulo Facturas

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `GenerateForm` | `components/facturas/generate-form.tsx` | Generación de facturas (interfaz con Siesa) |
| `EmitButton` | `components/facturas/emit-button.tsx` | Botón para emitir factura individual |
| `PrintButton` | `components/facturas/print-button.tsx` | Botón de impresión PDF via `@react-pdf/renderer` |

#### Portal Inquilino

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `WompiButton` | `(portal)/portal/wompi-button.tsx` | Modal de pago en línea. 3 pasos: selector tipo (arriendo/energía), datos de pago, link a Wompi. Muestra NIT/cédula como referencia de pago |
| `CarteraBreakdown` | `(portal)/portal/cartera-breakdown.tsx` | Desglose visual de la cartera del inquilino por factura |
| `FacturasDownloadButton` | `(portal)/portal/facturas-download-button.tsx` | Descarga PDF de las facturas del inquilino |
| `ProfileCard` | `(portal)/portal/profile-card.tsx` | Tarjeta con datos del contrato del inquilino |
| `MedidorChart` | `(portal)/portal/medidor/chart.tsx` | Gráfico de consumo histórico de energía del local |

#### Configuración

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| `RuleForm` | `components/configuracion/rule-form.tsx` | Formulario para crear/editar reglas financieras en `v2.reglas_financieras` |

---

## 8. Filtros e Interacciones

### 8.1 Filtros por Módulo

| Módulo | Filtros disponibles |
|--------|---------------------|
| **Proyecciones** | Año (selector: años con datos en `v2.proyecciones`) |
| **Mora** | Ninguno (muestra todos los en mora) — separación automática en dos tablas: comercial vs jurídica |
| **Pagos** | Mes/año (selector), Inquilino (búsqueda en la tabla) |
| **Locales** | Entrada/bloque (selector), búsqueda por nombre |
| **Gastos** | Período YYYY-MM (selector desde `siesa_raw.estado_resultados`), Año (para KPI summary) |
| **Medidores** | Período YYYY-MM, Año |
| **Facturas** | Período YYYY-MM |

### 8.2 Exportaciones

| Exportación | Endpoint / Mecanismo | Formato | Descripción |
|-------------|---------------------|---------|-------------|
| Tabla de energía | `/api/medidores/export-energia` | Excel (.xlsx) | Exporta lecturas del período con kWh, tarifa, total por local |
| Factura individual | `components/facturas/print-button.tsx` | PDF | PDF generado client-side con `@react-pdf/renderer` |
| Facturas portal inquilino | `FacturasDownloadButton` | PDF | Facturas del inquilino autenticado |

### 8.3 Acciones de Escritura (Server Actions)

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| Crear lectura medidor | `(app)/medidores/actions.ts` | Guarda `v2.lecturas_medidor`, sube foto a R2 |
| Aprobar/rechazar lectura | `(app)/medidores/actions.ts` | Actualiza `estado_validacion` |
| Guardar factura energía | `(app)/medidores/facturas/actions.ts` | Upsert en `v2.facturas_energia` |
| Generar proyecciones | `(app)/proyecciones/actions.ts` | Inserta registros en `v2.proyecciones` |
| Crear/editar usuario | `(app)/usuarios/actions.ts` | Crea cuenta en Supabase Auth + perfil en `v2.perfiles`, envía email de bienvenida |
| Enviar email a inquilino | `(app)/usuarios/actions.ts` | Envía email transaccional via Brevo |
| Guardar regla financiera | `(app)/configuracion/actions.ts` | Upsert en `v2.reglas_financieras` |
| Registrar lectura (portal) | `(portal)/portal/medidor/actions.ts` | Guarda lectura desde el lado del inquilino |
| Suscribir push | `(portal)/portal/actions.ts` | Registra suscripción en `v2.push_subscriptions` |

### 8.4 Pago en Línea (Wompi)

El botón de pago en línea en el portal del inquilino abre un modal de 3 pasos:

1. **Selector de tipo:** Arriendo o Energía (si hay factura de energía activa para el período)
2. **Instrucciones de pago:** Muestra NIT/cédula como referencia de pago, monto a pagar (copiable)
3. **Link a Wompi:** Redirige a `https://checkout.wompi.co/l/CBEaKx`

El inquilino usa su NIT o cédula como referencia en el formulario de Wompi. El pago queda registrado en el ERP Siesa y llega al portal via la siguiente sincronización del cron.

Para el caso de energía, el modal muestra tarjetas por local con: proveedor, NIT del proveedor, N° de contrato, período, consumo kWh, tarifa y total. Con nota contable explicando que es un reintegro de gasto.

---

## 9. Seguridad y Acceso

### 9.1 Autenticación

Toda la autenticación usa **Supabase Auth** (email/contraseña). Los tokens de sesión se manejan via cookies SSR usando `@supabase/ssr`.

El flujo de login:
1. Usuario envía credenciales en `/login`
2. Server Action llama `supabase.auth.signInWithPassword()`
3. Supabase establece cookie de sesión
4. `proxy.ts` (middleware) verifica la sesión en cada request y redirige según rol

### 9.2 Middleware de Rutas (`proxy.ts`)

**Archivo:** `src/proxy.ts` (este es el middleware de Next.js 16, no `middleware.ts`)

Lógica de routing por rol:

```
Request entrante
  ↓
¿Ruta pública? (login, forgot-password, /api/*, /_next/*, archivos estáticos)
  → SÍ: dejar pasar
  → NO:
      ¿Hay sesión activa?
        → NO: redirigir a /login
        → SÍ: consultar v2.perfiles para obtener rol
            → rol = 'inquilino': solo puede acceder a /portal/*
              Si intenta acceder a / → redirigir a /portal
            → rol = admin/finanzas/visor: puede acceder a /*
              Si intenta acceder a /portal → redirigir a /
```

El middleware usa `SUPABASE_SERVICE_ROLE_KEY` para leer el perfil del usuario (necesario para saltar RLS y leer el rol sin restricciones).

### 9.3 Row Level Security (RLS)

Todas las tablas de `v2.*` tienen RLS habilitado en Supabase. Las políticas garantizan que:
- Un inquilino solo puede ver sus propios datos (filtrado por `inquilino_id`)
- Los roles de staff (admin/finanzas/visor) pueden ver todos los datos de su empresa
- El schema `siesa_raw` es de solo lectura para el portal

### 9.4 Validación de Inputs del Servidor

**Archivo:** `src/lib/security/validators.ts`

Toda función de acceso a datos que recibe parámetros externos valida el formato antes de interpolar en SQL:

| Función | Regex | Ejemplo válido | Propósito |
|---------|-------|----------------|-----------|
| `assertUuid(id)` | `/^[0-9a-f]{8}-...-[0-9a-f]{12}$/i` | `550e8400-e29b-...` | UUIDs de entidades |
| `assertPeriodo(p)` | `/^\d{4}-(0[1-9]\|1[0-2])$/` | `2026-05` | Períodos YYYY-MM |
| `assertYear(y)` | `/^(20[2-3][0-9])$/` | `2026` | Años 2020-2039 |
| `assertUnit(u)` | `/^[A-Za-z0-9-]{1,20}$/` | `L101` | Códigos de local |
| `assertEmail(e)` | Regex estándar | `x@x.com` | Emails |

Estas funciones lanzan excepción si el valor no es válido, cortocircuitando cualquier posible inyección SQL antes de que el valor llegue al query.

### 9.5 Protección de Endpoints de Cron

Los 3 endpoints de cron requieren el header:
```
Authorization: Bearer {CRON_SECRET}
```
donde `CRON_SECRET` es una variable de entorno solo conocida por Vercel. Sin este header devuelven HTTP 401.

### 9.6 Permisos por Rol

| Acción | `admin` | `finanzas` | `visor` | `inquilino` |
|--------|---------|-----------|---------|-------------|
| Ver dashboard, mora, pagos, facturas | ✅ | ✅ | ✅ | ❌ |
| Ver portal del inquilino | ❌ | ❌ | ❌ | ✅ |
| Gestionar usuarios | ✅ | ❌ | ❌ | ❌ |
| Editar reglas financieras | ✅ | ❌ | ❌ | ❌ |
| Validar lecturas medidor | ✅ | ✅ | ❌ | ❌ |
| Registrar factura energía | ✅ | ✅ | ❌ | ❌ |
| Registrar lectura medidor (portal) | ❌ | ❌ | ❌ | ✅ |
| Ver historial pagos propio | ❌ | ❌ | ❌ | ✅ |
| Pagar online (Wompi) | ❌ | ❌ | ❌ | ✅ |

---

## 10. Control de Cambios

| Versión | Fecha | Descripción | Autor |
|---------|-------|-------------|-------|
| 01 | 2026-05-12 | Versión inicial — cobertura completa del repositorio en su estado actual | German Burgos |

---

*Documento generado desde análisis directo del código fuente del repositorio `Portal Ckrea`. Para mantener este documento actualizado, revisar las secciones de Lógica de Negocio (§4) y Modelo de Datos (§5) ante cualquier cambio en las tablas o reglas financieras, y la sección de Vistas (§7) ante adición de nuevas rutas o módulos.*
