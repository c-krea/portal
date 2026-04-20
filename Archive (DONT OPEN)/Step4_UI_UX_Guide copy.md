# C-Krea PayControl — UI/UX Guide & Screen Specifications

**Version:** 1.0 — April 15, 2026  
**Stack:** Next.js 15 (App Router) · shadcn/ui · Tailwind CSS · Tremor · TanStack Table v8  
**Design Language:** Minimalist business-professional — inspired by Paxco Portal Admin  

---

## 1. Design Principles

### 1.1 Visual Identity

The C-Krea logo is a vibrant, multi-colored circular mark. The rest of the UI deliberately contrasts this — neutral, restrained, and typographically clean. The logo is the single accent of color in the sidebar; everything else relies on whitespace, subtle borders, and a muted palette.

**Color System:**

| Token | Hex | Usage |
|---|---|---|
| `--sidebar-bg` | `#0F172A` | Slate-900, dark sidebar background |
| `--sidebar-text` | `#CBD5E1` | Slate-300, sidebar labels |
| `--sidebar-active` | `#3B82F6` | Blue-500, active nav item bg |
| `--surface` | `#FFFFFF` | All content cards and backgrounds |
| `--border` | `#E2E8F0` | Slate-200, card borders and dividers |
| `--text-primary` | `#0F172A` | Slate-900, headings and primary text |
| `--text-secondary` | `#64748B` | Slate-500, labels and secondary text |
| `--text-muted` | `#94A3B8` | Slate-400, placeholders and hints |

**Status Colors (critical — used everywhere):**

| Status | Color | Hex | Tailwind | Meaning |
|---|---|---|---|---|
| Green | Emerald | `#10B981` | `emerald-500` | On-time / Paid / Current |
| Yellow | Amber | `#F59E0B` | `amber-500` | Grace period / Approaching due |
| Red | Rose | `#F43F5E` | `rose-500` | Overdue / Late / Delinquent |
| Blue | Blue | `#3B82F6` | `blue-500` | Informational / Projected |
| Gray | Slate | `#94A3B8` | `slate-400` | Inactive / Vacant / N/A |

### 1.2 Typography

Use Inter (already bundled with Next.js via `next/font`). Clean, modern, excellent number rendering for financial data.

| Element | Size | Weight | Tracking |
|---|---|---|---|
| Page title | 24px / `text-2xl` | Semibold (600) | `-0.025em` |
| Section heading | 18px / `text-lg` | Semibold (600) | Normal |
| Card title | 14px / `text-sm` | Medium (500) | Normal |
| KPI value | 28px / `text-2xl` or `text-3xl` | Bold (700) | `-0.025em` |
| KPI label | 11px / `text-xs` | Medium (500) | `0.05em` uppercase |
| Table header | 12px / `text-xs` | Medium (500) | `0.05em` uppercase |
| Table body | 14px / `text-sm` | Normal (400) | Normal |
| Body text | 14px / `text-sm` | Normal (400) | Normal |

**Number formatting:** All COP currency values use `$` prefix, dot thousands separator, no decimals unless showing cents. Example: `$ 7.662.800.001`. Use `Intl.NumberFormat('es-CO')`.

### 1.3 Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│  ┌─────────┐ ┌────────────────────────────────────────┐  │
│  │         │ │  Header (page title + filters/actions)  │  │
│  │         │ │                                         │  │
│  │ Sidebar │ │  Content Area                           │  │
│  │  220px  │ │  (padded 24px, max-w-7xl centered)      │  │
│  │  fixed  │ │                                         │  │
│  │         │ │                                         │  │
│  │         │ │                                         │  │
│  └─────────┘ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- **Sidebar:** Fixed 220px, dark (`slate-900`), logo at top, nav items with icons, settings/logout at bottom
- **Content area:** Light gray background (`slate-50`), content in white cards with `rounded-xl border shadow-sm`
- **Spacing:** 24px padding around content, 16px gap between cards, 12px internal card padding
- **Max width:** Content capped at `max-w-7xl` (80rem) centered

### 1.4 Component Mapping

| UI Pattern | Component | Library |
|---|---|---|
| Navigation sidebar | Custom component | Tailwind + Lucide icons |
| KPI metric cards | `Card` + custom layout | shadcn/ui `Card` |
| Data tables | `DataTable` | TanStack Table v8 + shadcn/ui `Table` |
| Charts (bar, line, area) | `BarChart`, `LineChart`, `AreaChart` | Tremor |
| Status badges | `Badge` | shadcn/ui `Badge` with custom variants |
| Forms & inputs | `Input`, `Select`, `DatePicker` | shadcn/ui + React Hook Form + Zod |
| Modals/sheets | `Sheet` (slide-over) or `Dialog` | shadcn/ui |
| Dropdown menus | `DropdownMenu` | shadcn/ui |
| Tabs | `Tabs` | shadcn/ui |
| Toast notifications | `Sonner` | shadcn/ui (sonner integration) |
| Skeleton loading | `Skeleton` | shadcn/ui |
| Filters | `Popover` + `Command` combo | shadcn/ui (combobox pattern) |

---

## 2. Global Elements

### 2.1 Sidebar Navigation

Dark vertical sidebar, always visible on desktop. On mobile (< 768px), collapses to a hamburger-triggered overlay.

```
┌─────────────┐
│  [C-Krea     │  ← Logo (48x48) + "C-KREA" text (white, semibold)
│   Logo]      │     8px gap, vertically centered
│              │
│  ─────────── │  ← Subtle divider (slate-700)
│              │
│ ■ Dashboard  │  ← Active: blue-500 bg, rounded-lg, white text
│ △ Mora       │  ← Inactive: slate-400 icon, slate-300 text
│ ⊞ Clientes   │     Hover: slate-700 bg
│ ☐ Pagos      │     Each item: 40px height, 12px left padding
│ $ Gastos     │     Icon (20px) + 12px gap + label
│ ◊ Reportes   │
│ ⚙ Usuarios   │
│              │
│              │
│              │
│  ─────────── │
│ ⚙ Config     │  ← Collapsible section
│ ⇥ Cerrar     │  ← Logout link (slate-500)
│   Sesión     │
└─────────────┘
```

**Nav items (in order):**

| Icon | Label | Route | Description |
|---|---|---|---|
| `LayoutDashboard` | Dashboard | `/` | Portfolio overview |
| `AlertTriangle` | Mora | `/mora` | Delinquency management |
| `Users` | Clientes | `/clientes` | Tenant list |
| `CreditCard` | Pagos | `/pagos` | Payment recording |
| `Receipt` | Gastos | `/gastos` | Shared expenses |
| `BarChart3` | Reportes | `/reportes` | Reports & analytics |
| `Shield` | Usuarios | `/usuarios` | User management (admin only) |

### 2.2 Page Header Pattern

Every page follows the same header structure:

```
Resumen del Portafolio                    [Filter: Proyecto ▾] [Filter: Estado ▾]
```

- Title: `text-2xl font-semibold text-slate-900`, left-aligned
- Filters/actions: right-aligned, same row
- 24px bottom margin before content

### 2.3 Mobile Behavior

- Sidebar becomes a slide-out drawer (hamburger in top-left)
- KPI cards stack to single column
- Tables switch to card-based list view (each row becomes a card)
- Charts maintain aspect ratio, scroll horizontally if needed

---

## 3. Screen Specifications

---

### 3.1 Dashboard — `/`

**Purpose:** Executive overview of entire portfolio. First screen after login. Answers: "How is collection going this month?"

**Layout:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Resumen del Portafolio                    [Proyecto ▾] [Estado ▾]  │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │PORTAFOLIO│ │  TOTAL   │ │PENDIENTE │ │CLIENTES  │               │
│  │  TOTAL   │ │RECAUDADO │ │          │ │ EN MORA  │               │
│  │$7.662M   │ │$1.618M   │ │$ 87.7M   │ │  32/48   │               │
│  │48 activos│ │21% meta  │ │sin clas. │ │ ████████ │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                      │
│  ┌─────────────────────────┐ ┌──────────────────────────────────┐   │
│  │ Desglose de Recaudo     │ │ Seguimiento de Rendimiento       │   │
│  │                         │ │                                  │   │
│  │ ⚠ Cuotas Perdidas       │ │  ● RECIBIDO  ○ PROYECTADO      │   │
│  │   $ 539.131.515         │ │                                  │   │
│  │   130 cuotas            │ │  [Bar chart: Nov-Abr]           │   │
│  │                         │ │  % labels on each bar           │   │
│  │ ◉ Recargos              │ │                                  │   │
│  │   $ 39.808.231          │ │  Prom. Recaudo: $100.4M         │   │
│  │                         │ │  Precisión Proyección: 62.0%    │   │
│  │ ⏱ Prom. Días Mora       │ │                                  │   │
│  │   108 días              │ │                                  │   │
│  │                         │ │                                  │   │
│  │ ◐ Vencimiento Próx.     │ │                                  │   │
│  │   $ 161.120.000         │ │                                  │   │
│  └─────────────────────────┘ └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Data displayed:**

| KPI Card | Value Source | Subtext | Visual |
|---|---|---|---|
| Portafolio Total | Sum of all active contract values | `{n} clientes activos` (green) | — |
| Total Recaudado | Sum of payments received this period | `{n}% de la meta alcanzada` + thin progress bar (blue) | Progress bar under value |
| Pendiente | Outstanding balance not yet classified | `Pagos sin clasificar` (muted) | — |
| Clientes en Mora | Count of tenants with overdue balance | `{n} de {total} clientes` (red number) | Red progress bar (overdue ratio) |

**Desglose de Recaudo card (left):**

Four metric rows, each with:
- Icon (colored circle with icon inside: rose for alert, emerald for charges, amber for time, blue for upcoming)
- Label (uppercase, `text-xs`, `text-slate-500`, `tracking-wide`)
- Value (bold, `text-lg`)
- Subtext (muted, `text-xs`)

Metrics: Cuotas Perdidas, Recargos (late fees), Promedio Días en Mora, Vencimiento Mes Próximo.

**Seguimiento de Rendimiento card (right):**

- Tremor `BarChart` component
- Two series: `RECIBIDO` (dark blue, `blue-600`) and `PROYECTADO` (light gray, `slate-200`)
- X-axis: months (NOV through current month)
- Percentage labels above each bar group (colored: green if ≥80%, amber if 50-79%, red if <50%)
- Below chart: two summary stats — `Prom. Recaudo Mensual` and `Precisión Proyección`

**Filters:**
- Project dropdown (shadcn `Select`): "Todos" | specific project names
- Status dropdown: "Todos los Estados" | "Al día" | "En mora" | "Crítico"

**Actions available:** None directly — this is a read-only overview. Click any KPI card to navigate to the relevant detail view.

**Component mapping:**

```tsx
// KPI cards
<Card className="rounded-xl border shadow-sm p-6">
  <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">{label}</p>
  <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  <p className="text-xs text-emerald-600 mt-1">{subtext}</p>
</Card>

// Bar chart
import { BarChart } from "@tremor/react"
<BarChart data={monthlyData} index="month" categories={["recibido", "proyectado"]} />

// Metric rows in desglose card
<div className="flex items-center gap-4 py-3">
  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
    <AlertTriangle className="w-5 h-5 text-rose-500" />
  </div>
  <div>
    <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">{label}</p>
    <p className="text-lg font-bold text-slate-900">{value}</p>
    <p className="text-xs text-slate-400">{subtext}</p>
  </div>
</div>
```

---

### 3.2 Mora (Delinquency) — `/mora`

**Purpose:** Focused view of all overdue tenants. Answers: "Who owes money, how much, and for how long?"

**Layout:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Gestión de Mora                          [Buscar...] [Exportar ▾]  │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                            │
│  │ TOTAL    │ │ CLIENTES │ │ PROM.    │                            │
│  │ MORA     │ │ EN MORA  │ │ DÍAS     │                            │
│  │$539.1M   │ │   32     │ │  108     │                            │
│  └──────────┘ └──────────┘ └──────────┘                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Clientes en Mora                                  [Filtros]  │   │
│  │                                                              │   │
│  │  Local │ Cliente      │ Días Mora │ Saldo Vencido │ Interés │   │
│  │  ──────┼──────────────┼───────────┼───────────────┼─────────│   │
│  │  L-101 │ Juan Pérez   │ ●● 45     │ $ 12.500.000  │ $375K   │   │
│  │  L-205 │ María López  │ ●●● 120   │ $ 8.200.000   │ $1.2M   │   │
│  │  ...   │ ...          │ ...       │ ...           │ ...     │   │
│  │                                                              │   │
│  │  [← Anterior]                              [Siguiente →]    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Table columns (TanStack Table):**

| Column | Width | Content | Sortable | Filterable |
|---|---|---|---|---|
| Local | 80px | Unit number | Yes | Yes (text) |
| Cliente | flex | Tenant name + contract ID below | Yes | Yes (text) |
| Estado | 100px | Color badge (see below) | Yes | Yes (select) |
| Días en Mora | 100px | Number + severity dots | Yes (default: desc) | Yes (range) |
| Saldo Vencido | 140px | COP amount, right-aligned | Yes | Yes (range) |
| Interés Acumulado | 120px | COP amount, right-aligned | Yes | — |
| Última Gestión | 120px | Date of last contact/action | Yes | — |
| Acciones | 80px | `...` menu | — | — |

**Status badges (Mora severity):**

| Days Overdue | Badge | Color | Label |
|---|---|---|---|
| 1–30 | `Badge variant="outline"` | Amber border + text | Leve |
| 31–90 | `Badge variant="default"` | Amber bg | Moderado |
| 91–180 | `Badge variant="default"` | Rose bg | Crítico |
| 180+ | `Badge variant="destructive"` | Dark rose bg | Grave |

**Row actions (DropdownMenu):**

- Ver Detalle → navigates to `/clientes/{id}`
- Registrar Gestión → opens Sheet (slide-over) with form: date, type (llamada/email/visita/carta), notes, next follow-up
- Enviar Recordatorio → triggers email/SMS
- Aplicar Acuerdo de Pago → opens payment plan dialog

---

### 3.3 Clientes (Tenant List) — `/clientes`

**Purpose:** Master list of all tenants/units. Answers: "Show me everyone and their current status."

**Layout:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Clientes                     [Buscar...] [+ Nuevo Cliente] [⤓]    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [Todos] [Activos] [En Mora] [Críticos] [Inactivos]          │   │
│  │                                                              │   │
│  │  Local │ Cliente       │ Estado │ Canon     │ Saldo   │ ... │   │
│  │  ──────┼───────────────┼────────┼───────────┼─────────┼─────│   │
│  │  L-101 │ ● Juan Pérez  │ 🟢     │ $3.500K   │ $0      │     │   │
│  │  L-102 │ ● Café Aroma  │ 🟡     │ $2.800K   │ $2.8M   │     │   │
│  │  L-103 │ ● SportMax    │ 🔴     │ $5.200K   │ $15.6M  │     │   │
│  │  L-104 │ ○ (Vacante)   │ ⚪     │ —         │ —       │     │   │
│  │  ...                                                         │   │
│  │                                                              │   │
│  │  Mostrando 1-20 de 85               [← 1 2 3 4 5 →]        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Table columns:**

| Column | Width | Content |
|---|---|---|
| Local | 80px | Unit number (e.g., "L-101") |
| Cliente | flex | Name, below: NIT/ID in muted text |
| Entrada | 80px | Building entrance number (1-6) |
| Estado | 90px | Color dot + label |
| Fase | 80px | Current contract phase (1, 2, 3) |
| Canon Mensual | 120px | Monthly rent, right-aligned |
| Descuento | 80px | Active discount %, right-aligned |
| Saldo Pendiente | 120px | Outstanding balance |
| Último Pago | 100px | Date |
| Acciones | 60px | `→` arrow to detail view |

**Status dot mapping:**

| Status | Dot | Label | Condition |
|---|---|---|---|
| Al Día | `bg-emerald-500` | Al Día | No overdue balance |
| Gracia | `bg-amber-500` | Gracia | Within grace period |
| En Mora | `bg-rose-500` | En Mora | Overdue balance > 0 |
| Inactivo | `bg-slate-300` | Inactivo | Contract ended or unit vacant |

**Tab filters (above table):**

- Todos (default) — all units
- Activos — status ≠ Inactivo
- En Mora — has overdue balance
- Críticos — overdue > 90 days
- Inactivos — vacant or ended

Each tab shows a count badge: `Activos (56)`.

**Row click:** Navigates to tenant detail view (`/clientes/{id}`).

---

### 3.4 Tenant Detail — `/clientes/[id]`

**Purpose:** Complete view of a single tenant/unit. Answers: "What's the full story on this tenant?"

**Layout:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← Clientes  /  Local L-101 — Juan Pérez          [Editar] [...]   │
│                                                                      │
│  ┌───────────────────────────┐  ┌───────────────────────────────┐   │
│  │ Información del Contrato  │  │ Estado Actual                 │   │
│  │                           │  │                               │   │
│  │ Local:     L-101          │  │ ● AL DÍA                     │   │
│  │ Entrada:   3              │  │                               │   │
│  │ Inquilino: Juan Pérez     │  │ Próx. Vencimiento: May 1     │   │
│  │ NIT:       900.123.456-7  │  │ Días para vencer: 16         │   │
│  │ Inicio:    2024-01-15     │  │ Descuento PP: 5% (si paga    │   │
│  │ Fin:       2026-12-31     │  │   antes May 10)              │   │
│  │ Fase:      2 de 3         │  │ Interés acumulado: $0        │   │
│  │ Canon:     $ 3.500.000    │  │ Gastos asignados: $185.000   │   │
│  │ Descuento: 15%            │  │                               │   │
│  │ Pronto P.: 5%             │  │ Total a pagar: $ 3.160.000   │   │
│  └───────────────────────────┘  └───────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [Historial de Pagos] [Gastos Asignados] [Línea de Tiempo]   │   │
│  │                                                              │   │
│  │  Fecha    │ Concepto  │ Valor      │ Desc.   │ Estado │ Ref │   │
│  │  ─────────┼───────────┼────────────┼─────────┼────────┼─────│   │
│  │  2026-04  │ Canon     │ $3.500.000 │ -$525K  │ Pagado │ FV- │   │
│  │  2026-04  │ Aseo      │ $  120.000 │ —       │ Pagado │ FV- │   │
│  │  2026-04  │ Elect.    │ $   65.000 │ —       │ Pagado │ FV- │   │
│  │  2026-03  │ Canon     │ $3.500.000 │ -$525K  │ Pagado │ FV- │   │
│  │  ...                                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Línea de Tiempo del Contrato                                 │   │
│  │                                                              │   │
│  │  ●━━━━━━━━━━━━●━━━━━━━━●━━━━━━○━━━━━━○                     │   │
│  │  Inicio     Fase 1   Fase 2  Fase 3   Fin                  │   │
│  │  2024-01    2024-07  2025-01 2025-07  2026-12               │   │
│  │             35% dto  15% dto  0% dto                        │   │
│  │                       ▲ Estamos aquí                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Top section — two cards side by side:**

**Información del Contrato (left card):**
Key-value pairs in a 2-column grid. Labels in `text-sm text-slate-500`, values in `text-sm font-medium text-slate-900`. Fields: Local, Entrada, Inquilino, NIT, Contacto (phone/email), Fecha Inicio, Fecha Fin, Fase Actual, Canon Base, Descuento Fase (%), Pronto Pago (%).

**Estado Actual (right card):**
- Large status badge at top (green/yellow/red, using shadcn `Badge` with size variant)
- Key metrics below: Próximo Vencimiento (date), Días para vencer / en mora (number), Descuento pronto pago available, Interés acumulado, Gastos asignados este mes, **Total a pagar** (bold, larger)

**Tabs section (shadcn `Tabs`):**

**Tab 1 — Historial de Pagos (default):**
TanStack Table with columns: Fecha, Concepto (Canon/Aseo/Electricidad/Vigilancia/etc.), Valor, Descuento, Interés, Estado (badge), Referencia Siesa. Sorted by date descending.

**Tab 2 — Gastos Asignados:**
Table showing monthly breakdown of shared expenses allocated to this unit: Concepto, Método (pro-rata/fijo), Valor Asignado, Facturado (checkbox), Pagado (checkbox).

**Tab 3 — Línea de Tiempo:**
Visual timeline of contract phases using a horizontal bar. Filled sections for completed phases, current phase highlighted, future phases outlined. Each phase shows: date range, discount percentage, and key events (payments, late notices, etc.) as dots on the timeline.

**Actions (top-right DropdownMenu):**

- Registrar Pago → opens payment recording flow
- Generar Factura → creates invoice
- Aplicar Ajuste → manual override dialog (requires reason + audit)
- Exportar Historial → Excel/PDF
- Sincronizar con Siesa → force sync

---

### 3.5 Pagos (Payment Recording) — `/pagos`

**Purpose:** Record and manage payments. Answers: "What payments have come in, and which need processing?"

**Layout:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Pagos                          [Buscar...] [+ Registrar Pago] [⤓] │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │RECAUDADO │ │POR CLAS. │ │DESCUENTOS│ │INTERESES │               │
│  │ ESTE MES │ │          │ │ APLICADOS│ │COBRADOS  │               │
│  │ $142.3M  │ │  $87.7M  │ │  $12.1M  │ │  $3.8M   │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ [Todos] [Procesados] [Pendientes] [Rechazados]               │   │
│  │                                                              │   │
│  │  Fecha    │ Cliente     │ Local │ Valor      │ Estado  │ ... │   │
│  │  ─────────┼─────────────┼───────┼────────────┼─────────┼─────│   │
│  │  Apr 14   │ Juan Pérez  │ L-101 │ $3.160.000 │ ✓ Proc. │     │   │
│  │  Apr 14   │ Café Aroma  │ L-102 │ $2.380.000 │ ◷ Pend. │     │   │
│  │  Apr 13   │ SportMax    │ L-103 │ $5.200.000 │ ✗ Rech. │     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Payment Recording Flow (triggered by "+ Registrar Pago"):**

Opens a `Sheet` (right slide-over, 480px wide) with a multi-step form:

**Step 1 — Seleccionar Cliente:**
- Combobox search (shadcn `Command` + `Popover`): type to search by name, NIT, or unit number
- Shows: Unit number, tenant name, current balance
- On select: loads their outstanding balance and line items

**Step 2 — Detalle del Pago:**
- Fecha de Pago: DatePicker (defaults to today)
- Valor Recibido: Currency input
- Método: Select (Transferencia / Consignación / Cheque / Efectivo)
- Referencia bancaria: Text input
- Auto-calculated section (read-only, real-time):
  - Saldo pendiente: (current outstanding)
  - Descuento pronto pago: (if within 10-day window, auto-apply)
  - Descuento fase: (if applicable)
  - Interés acumulado: (if overdue)
  - Valor neto a aplicar: (bold)

**Step 3 — Confirmar y Aplicar:**
- Summary card showing all values
- Checkbox: "Sincronizar automáticamente con Siesa"
- Button: "Confirmar Pago" (blue) / "Cancelar" (ghost)

**Validation (Zod):**
- Valor > 0
- Fecha ≤ today
- Cliente required
- Referencia required for Transferencia/Consignación

**Table columns:**

| Column | Content |
|---|---|
| Fecha | Payment date |
| Cliente | Name + NIT |
| Local | Unit number |
| Concepto | Canon / Gastos / Interés |
| Valor Bruto | Original amount |
| Descuento | Applied discount |
| Interés | Late interest if applicable |
| Valor Neto | Final applied amount |
| Estado | Procesado (green) / Pendiente (amber) / Rechazado (red) |
| Siesa | Sync status icon (✓ synced / ◷ pending / ✗ error) |
| Acciones | View detail, void, re-sync |

---

### 3.6 Gastos (Shared Expenses) — `/gastos`

**Purpose:** Manage common-area expenses and their allocation across units. Answers: "What are this month's shared costs, and how are they split?"

**Layout:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Gastos Compartidos                    [Mes: Abril 2026 ▾] [+ Nuevo]│
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ TOTAL    │ │SERVICIOS │ │ ASEO     │ │VIGILANCIA│               │
│  │ GASTOS   │ │ PÚBLICOS │ │          │ │          │               │
│  │ $18.5M   │ │ $10.5M   │ │ $3.7M    │ │ $2.8M    │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                      │
│  ┌────────────────────────────────┐ ┌───────────────────────────┐   │
│  │ Gastos del Mes                 │ │ Distribución por Categoría│   │
│  │                                │ │                           │   │
│  │ Categoría   │ Monto    │ Mét. │ │  [Donut chart]            │   │
│  │ ────────────┼──────────┼──────│ │  Serv. Públicos  57%     │   │
│  │ Electricidad│ $8.2M    │ Pror │ │  Aseo            20%     │   │
│  │ Agua        │ $1.3M    │ Fijo │ │  Vigilancia      15%     │   │
│  │ Aseo        │ $3.7M    │ Fijo │ │  Nómina           5%     │   │
│  │ Vigilancia  │ $2.8M    │ Fijo │ │  Otro             3%     │   │
│  │ Nómina      │ $1.0M    │ Fijo │ │                           │   │
│  │ Publicidad  │ $0.5M    │ Fijo │ │                           │   │
│  │ Cafetería   │ $1.0M    │ Fijo │ │                           │   │
│  └────────────────────────────────┘ └───────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Asignación por Local                          [Exportar ⤓]  │   │
│  │                                                              │   │
│  │  Local │ Cliente    │ Elect.  │ Agua  │ Aseo  │ Total  │ Est│   │
│  │  ──────┼────────────┼─────────┼───────┼───────┼────────┼────│   │
│  │  L-101 │ Juan Pérez │ $98.000 │$15.5K │$44.1K │$185.0K │ ✓  │   │
│  │  ...                                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Gastos del Mes table:**

| Column | Content |
|---|---|
| Categoría | Expense name |
| Monto Total | Total COP for this expense |
| Método | Pro-rata (electricity) or Fijo (fixed per unit) |
| Unidades | How many units it's distributed across |
| Estado | Asignado / Pendiente / Facturado |
| Acciones | Edit amount, view distribution, re-calculate |

**Asignación por Local table (bottom):**
Pivot table: rows = units, columns = expense categories, values = allocated amounts. Final column = Total per unit. Status column shows if allocated amounts have been billed.

**"+ Nuevo Gasto" flow:**
Dialog (shadcn `Dialog`) with form:
- Categoría: Select from predefined + "Otro"
- Monto Total: Currency input
- Método de Distribución: Select (Pro-rata por área / Fijo por local / Personalizado)
- Mes: Month picker
- Notas: Textarea
- Button: "Calcular Distribución" → shows preview table → "Confirmar"

**Electricity special handling:**
Electricity uses pro-rata allocation based on each unit's area (m²). The system calculates: `unit_share = (unit_area / total_area) * total_electricity_cost`. This is shown with a tooltip explaining the calculation on hover.

---

### 3.7 Reportes (Reports) — `/reportes`

**Purpose:** Generate and view financial reports. Answers: "Give me the numbers for management review."

**Layout:**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Reportes                                     [Período: Abr 2026 ▾] │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Reportes Disponibles                                         │   │
│  │                                                              │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │   │
│  │  │ 📊 Resumen     │  │ 📈 Aging       │  │ 💰 Descuentos  │ │   │
│  │  │  Mensual de    │  │  Cartera       │  │  e Intereses   │ │   │
│  │  │  Recaudo       │  │  Vencida       │  │  del Período   │ │   │
│  │  │  [Generar →]   │  │  [Generar →]   │  │  [Generar →]   │ │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │   │
│  │                                                              │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │   │
│  │  │ 🏢 Desempeño   │  │ 🧾 Gastos     │  │ 🔄 Siesa      │ │   │
│  │  │  por Inquilino │  │  Compartidos   │  │  Reconciliación│ │   │
│  │  │               │  │  del Mes       │  │               │ │   │
│  │  │  [Generar →]   │  │  [Generar →]   │  │  [Generar →]   │ │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Reporte Generado                          [⤓ Excel] [⤓ PDF] │   │
│  │                                                              │   │
│  │  (Generated report renders here as table + chart)            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

**Available reports (cards in a 3-column grid):**

| Report | Description | Key Data |
|---|---|---|
| Resumen Mensual de Recaudo | Monthly collection summary | Total billed, collected, outstanding, % achieved |
| Aging de Cartera | Receivables aging | Buckets: Current, 1-30, 31-60, 61-90, 90+ days |
| Descuentos e Intereses | Discount/penalty impact | Total discounts given, interest charged, net impact |
| Desempeño por Inquilino | Tenant ranking | Payment timeliness, total paid, average days to pay |
| Gastos Compartidos | Shared expense summary | By category, by unit, month-over-month |
| Reconciliación Siesa | Sync status | Matched, unmatched, errors, last sync |

Each report card: shadcn `Card` with icon, title, description, and "Generar →" button. On click, the report renders inline in the bottom section with export options (Excel via XLSX generation, PDF via server-side).

---

### 3.8 Usuarios (User Management) — `/usuarios`

**Purpose:** Admin-only screen for managing portal users and roles.

**Layout:** Simple table with columns: Nombre, Email, Rol (Admin/Operador/Viewer), Estado (Activo/Inactivo), Último Acceso. Actions: Invite user, edit role, deactivate.

**Roles:**

| Role | Dashboard | Mora | Clientes | Pagos | Gastos | Reportes | Usuarios |
|---|---|---|---|---|---|---|---|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Operador | ✓ | ✓ | ✓ | ✓ | ✓ read | ✓ | ✗ |
| Viewer | ✓ read | ✓ read | ✓ read | ✗ | ✗ | ✓ | ✗ |

---

## 4. Interaction Patterns

### 4.1 Loading States

Every data-fetching component shows shadcn `Skeleton` components matching the layout:
- KPI cards: 4 skeleton rectangles in a row
- Tables: Skeleton rows (5 rows of alternating-width bars)
- Charts: Single skeleton rectangle at chart dimensions

### 4.2 Empty States

When a table or section has no data:
- Centered illustration (simple line art, not emoji)
- Primary text: "No hay {items} para mostrar" (`text-lg font-medium text-slate-600`)
- Secondary text: helpful guidance (`text-sm text-slate-400`)
- CTA button if applicable

### 4.3 Error States

- Inline error: Red border on card + error message inside
- Toast for transient errors (Sonner, bottom-right, auto-dismiss 5s)
- Full-page error: centered with retry button (only for critical failures)

### 4.4 Confirmation Patterns

- Destructive actions (void payment, delete): shadcn `AlertDialog` with red confirm button
- Financial actions (record payment, apply adjustment): `Sheet` slide-over with summary + confirm
- All overrides require a "Motivo" (reason) textarea — this is non-negotiable for audit trail

### 4.5 Search

Global search bar in the sidebar (below logo) or in each page header:
- Debounced (300ms)
- Searches across: unit number, tenant name, NIT, contract ID
- Results as dropdown with categorized sections (Clientes, Pagos, Locales)

### 4.6 Notifications

- Siesa sync errors: persistent toast until resolved
- New payment received: ephemeral toast
- Approaching due dates: badge count on Mora nav item

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|---|---|---|
| Desktop | ≥ 1280px | Full sidebar + all columns visible |
| Laptop | 1024–1279px | Sidebar visible, some table columns hidden |
| Tablet | 768–1023px | Sidebar overlay, 2-column KPI grid |
| Mobile | < 768px | No sidebar (hamburger), single column, card-based tables |

**Mobile table transformation:** Each table row becomes a card:

```
┌─────────────────────────┐
│ L-101 — Juan Pérez    → │
│ Canon: $3.500.000       │
│ Estado: ● Al Día        │
│ Saldo: $0               │
└─────────────────────────┘
```

---

## 6. Siesa Sync Indicator

A small persistent indicator in the sidebar footer shows sync health:

- `●` Green + "Sincronizado" — last sync < 1 hour ago, no errors
- `●` Amber + "Sincronizando..." — sync in progress
- `●` Red + "Error de Sincronización" — last sync failed (click to view details)

---

## 7. Dark Mode

Support `dark` class on `<html>` via shadcn/ui theme toggle (in sidebar settings).

| Element | Light | Dark |
|---|---|---|
| Sidebar bg | `slate-900` | `slate-950` |
| Content bg | `slate-50` | `slate-900` |
| Card bg | `white` | `slate-800` |
| Text primary | `slate-900` | `slate-50` |
| Text secondary | `slate-500` | `slate-400` |
| Borders | `slate-200` | `slate-700` |

Status colors (green/amber/red) remain unchanged in both modes.

---

## 8. File & Folder Structure (Next.js App Router)

```
src/
├── app/
│   ├── layout.tsx              ← Root layout (sidebar + content wrapper)
│   ├── page.tsx                ← Dashboard
│   ├── mora/page.tsx
│   ├── clientes/
│   │   ├── page.tsx            ← Tenant list
│   │   └── [id]/page.tsx       ← Tenant detail
│   ├── pagos/page.tsx
│   ├── gastos/page.tsx
│   ├── reportes/page.tsx
│   └── usuarios/page.tsx
├── components/
│   ├── ui/                     ← shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── page-header.tsx
│   │   └── mobile-nav.tsx
│   ├── dashboard/
│   │   ├── kpi-cards.tsx
│   │   ├── desglose-recaudo.tsx
│   │   └── rendimiento-chart.tsx
│   ├── clientes/
│   │   ├── clientes-table.tsx
│   │   ├── cliente-detail.tsx
│   │   └── contrato-timeline.tsx
│   ├── pagos/
│   │   ├── pagos-table.tsx
│   │   └── registrar-pago-sheet.tsx
│   ├── gastos/
│   │   ├── gastos-table.tsx
│   │   └── asignacion-table.tsx
│   ├── mora/
│   │   ├── mora-table.tsx
│   │   └── gestion-sheet.tsx
│   └── shared/
│       ├── status-badge.tsx
│       ├── currency-display.tsx
│       ├── data-table.tsx       ← Generic TanStack Table wrapper
│       ├── search-combobox.tsx
│       └── siesa-sync-indicator.tsx
├── lib/
│   ├── utils.ts
│   ├── formatters.ts            ← COP currency, dates, percentages
│   └── constants.ts             ← Status colors, nav items, role permissions
└── styles/
    └── globals.css              ← Tailwind + shadcn/ui theme variables
```

---

*This guide provides sufficient specification for any Claude coding session to build each screen without ambiguity. Each screen defines its data, actions, component mappings, and status color logic.*
