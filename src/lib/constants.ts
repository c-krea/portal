import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  CreditCard,
  Receipt,
  FileText,
  Zap,
  TrendingUp,
} from "lucide-react"

export const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Resumen",       href: "/" },
  { icon: TrendingUp,      label: "Proyecciones",  href: "/proyecciones" },
  { icon: AlertTriangle,   label: "Mora",          href: "/mora" },
  { icon: Users,           label: "Clientes",      href: "/clientes" },
  { icon: FileText,        label: "Facturas",      href: "/facturas" },
  { icon: CreditCard,      label: "Pagos",         href: "/pagos" },
  { icon: Receipt,         label: "Gastos",        href: "/gastos" },
  { icon: Zap,             label: "Medidores",     href: "/medidores" },
] as const

export const STATUS_COLORS = {
  al_dia: "emerald-500",
  gracia: "amber-500",
  mora: "rose-500",
  proyectado: "blue-500",
  inactivo: "slate-400",
} as const
