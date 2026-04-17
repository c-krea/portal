# WOR-47 — Medidores: OCR Self-Reporting

**Linear:** https://linear.app/workspacegb29/issue/WOR-47  
**Status:** Backlog — Phase 2  
**Área:** Electricidad / Medidores

---

## Problema actual

Un operario visita cada local físicamente, lee el contador eléctrico, y registra el valor a mano. Luego se hace la distribución del costo de energía por consumo real. Este proceso es lento, propenso a error, y requiere coordinación manual cada mes.

---

## Solución propuesta

Los inquilinos se loguean al mismo portal (vista inquilino), toman una foto del contador desde la app, y la suben. La foto va a Google Drive. Un OCR extrae el valor. El sistema **auto-valida** comparando contra el promedio de los últimos 3 meses — si está dentro del rango, se aprueba automáticamente. Si no, queda en revisión manual.

### Flujo completo

```
Inquilino abre portal (vista tenant) → login con su cuenta
  → sección Medidor → "Subir foto del mes"
  → toma foto o sube imagen
  → foto guardada en Google Drive (carpeta por local/mes)
  → OCR extrae valor numérico del contador
  → sistema calcula consumo = lectura_actual − lectura_anterior
  → auto-validación vs promedio 3 meses:
      ├─ dentro del rango → ✓ aprobado automáticamente
      └─ fuera del rango  → ⚠ flagged → admin revisa
  → admin confirma / corrige desde /medidores
  → se genera cargo de electricidad en la factura del mes
```

---

## Reglas de negocio

### Auto-validación

```
promedio_3m = AVG(consumo últimos 3 meses)
rango_min   = promedio_3m × (1 − tolerancia%)
rango_max   = promedio_3m × (1 + tolerancia%)

si consumo_nuevo BETWEEN rango_min AND rango_max → estado = 'aprobado'
sino                                              → estado = 'revision'
```

> Tolerancia % por definir (sugerencia: ±25%). Configurable en Configuración.

### Sin foto (límite alto)

- Si no llega foto antes del plazo (ej. día 5): se aplica el **promedio_3m × factor_alto** (ej. 1.3×).
- Resultado: todos tienen interés en enviar foto — si su consumo real es menor, pagan menos.

| Parámetro | Valor sugerido | Configurable |
|---|---|---|
| Tolerancia auto-aprobación | ±25% del promedio 3m | Sí |
| Factor alto (sin foto) | 1.3× el promedio 3m | Sí |
| Plazo de envío | Día 5 de cada mes | Sí |
| Unidades con medidor | **Todas las unidades** | N/A |

---

## Canal de envío — Tenant Portal

El inquilino usa el **mismo portal web** con un login propio (rol `tenant` en Supabase Auth). No es una app separada — es una vista restringida del mismo sistema.

### Lo que ve el inquilino al iniciar sesión

```
┌─────────────────────────────────────────┐
│  C-KREA — Local 205                     │
│                                         │
│  📸 Medidor — Abril 2026               │
│  Plazo: 5 de abril · Faltan 3 días     │
│                                         │
│  [Tomar foto / Subir imagen]           │
│                                         │
│  Historial:                             │
│  Mar → 310 kWh  ✓ aprobado            │
│  Feb → 295 kWh  ✓ aprobado            │
│  Ene → 280 kWh  ✓ aprobado            │
└─────────────────────────────────────────┘
```

### Almacenamiento de fotos

- **Google Drive** como repositorio de fotos (una carpeta por local, una foto por mes).
- Integración vía Google Drive API con service account de C-Krea.
- El portal guarda la URL/fileId de Drive en la columna `photo_url` de `meter_readings`.

---

## Admin View

### `/medidores` — lista del mes

```
┌───────────────────────────────────────────────────────┐
│  Medidores — Abril 2026      [◀ Mar] [Abr ▶]         │
│                                                        │
│  Enviadas: 61/84  ·  Aprobadas: 58  ·  Revisión: 3  │
│  Sin foto: 23  ·  Total kWh: XX,XXX                  │
│                                                        │
│  ┌──────┬────────────────┬───────┬───────┬──────────┐ │
│  │Local │ Arrendatario   │ kWh   │ vs 3m │ Estado   │ │
│  ├──────┼────────────────┼───────┼───────┼──────────┤ │
│  │ 101  │ MEDIOS IMP.    │  320  │ +3%   │ ✓ Auto   │ │
│  │ 205  │ MORALES C.     │  580  │ +87%  │ ⚠ Revisar│ │
│  │ 303  │ FAJARDO N.     │  —    │  —    │ ⏳ Sin foto│ │
│  └──────┴────────────────┴───────┴───────┴──────────┘ │
└───────────────────────────────────────────────────────┘
```

### `/medidores/[unitId]` — detalle por unidad

```
┌──────────────────────────────────────────────┐
│  Local 205 — MORALES CLAVIJO JUAN FELIPE     │
│                                              │
│  [Foto del contador]  Lectura OCR: 5,847    │
│                       Lectura anterior: 5,267│
│                       Consumo: 580 kWh ⚠    │
│                       Promedio 3m: 310 kWh  │
│                       Desviación: +87%       │
│                       [✓ Aprobar] [✏ Corregir]│
│                                              │
│  Historial consumo (últimos 6 meses)         │
│  ████░░░  Ene 280 kWh                       │
│  ██████░  Feb 295 kWh                       │
│  ███████  Mar 310 kWh                       │
│  ??????????  Abr 580 kWh ⚠                  │
└──────────────────────────────────────────────┘
```

---

## Schema DB — cambios a `meter_readings`

```sql
ALTER TABLE meter_readings ADD COLUMN
  photo_url        text,          -- Google Drive file URL
  photo_drive_id   text,          -- Drive fileId para acceso directo
  ocr_raw          text,          -- texto bruto extraído por OCR
  ocr_value        numeric,       -- número parseado del OCR
  consumo_kwh      numeric,       -- lectura_actual - lectura_anterior
  promedio_3m      numeric,       -- snapshot del promedio al momento de validar
  desviacion_pct   numeric,       -- % diferencia vs promedio_3m
  read_method      text DEFAULT 'manual',  -- 'ocr_auto' | 'ocr_manual' | 'manual' | 'default'
  read_status      text DEFAULT 'pendiente', -- 'pendiente' | 'aprobado' | 'revision' | 'default'
  submitted_at     timestamptz,   -- cuándo subió el inquilino
  confirmed_by     uuid REFERENCES profiles(id),
  confirmed_at     timestamptz;
```

---

## Stack técnico

| Componente | Decisión |
|---|---|
| Fotos | Google Drive API (service account C-Krea) |
| OCR | Google Cloud Vision API (misma cuenta GCP) |
| Tenant login | Supabase Auth, rol `tenant`, misma app |
| Tenant view | Nueva ruta `/tenant/medidor` (route group `(tenant)`) |
| Validación | Server action: calcula promedio 3m → compara → asigna status |

---

## Fases de implementación

| Fase | Alcance | Prerequisito |
|---|---|---|
| **1** | Admin view completa: lista + bar chart consumo + estado por mes | Hecho parcialmente |
| **2** | Schema update + validación automática (promedio 3m) | Fase 1 |
| **3** | OCR pipeline: Google Drive upload → Cloud Vision → extracción | GCP service account |
| **4** | Tenant portal: login tenant + formulario subida foto | Supabase Auth roles |

---

## Decisiones pendientes

- [ ] Tolerancia exacta para auto-aprobación (sugerencia: ±25%)
- [ ] Factor alto para "sin foto" (sugerencia: promedio_3m × 1.3)
- [ ] Plazo exacto de envío (sugerencia: día 5 del mes)
- [ ] Cuenta GCP para Google Drive + Cloud Vision (IT guy)
- [ ] ¿El inquilino ve solo su medidor o también su historial de facturas?

---

*Creado: 2026-04-16 — German Burgos*  
*Actualizado: 2026-04-16 — Decisiones: todas unidades tienen medidor, validación por promedio 3m, portal mismo app con login tenant, fotos a Google Drive*
