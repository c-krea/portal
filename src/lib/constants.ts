import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  CreditCard,
  Receipt,
  FileText,
  Zap,
  TrendingUp,
  UserCog,
} from "lucide-react"

export const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Resumen",       href: "/" },
  { icon: TrendingUp,      label: "Proyecciones",  href: "/proyecciones" },
  { icon: AlertTriangle,   label: "Mora",          href: "/mora" },
  { icon: Users,           label: "Locales",       href: "/locales" },
  { icon: CreditCard,      label: "Pagos",         href: "/pagos" },
  { icon: Receipt,         label: "Gastos",        href: "/gastos" },
  { icon: Zap,             label: "Medidores",     href: "/medidores" },
  { icon: UserCog,         label: "Usuarios",      href: "/usuarios" },
] as const

export const STATUS_COLORS = {
  al_dia: "emerald-500",
  gracia: "amber-500",
  mora: "rose-500",
  proyectado: "blue-500",
  inactivo: "slate-400",
} as const
