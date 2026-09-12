import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  Receipt,
  Zap,
  TrendingUp,
  UserCog,
  FolderOpen,
} from "lucide-react"

export const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Resumen",       href: "/" },
  { icon: AlertTriangle,   label: "Mora",          href: "/mora" },
  { icon: Users,           label: "Locales",       href: "/locales" },
  { icon: Receipt,         label: "Gastos",        href: "/gastos" },
  { icon: Zap,             label: "Medidores",     href: "/medidores" },
  { icon: FolderOpen,      label: "Archivos",      href: "/archivos" },
  { icon: UserCog,         label: "Usuarios",      href: "/usuarios" },
  { icon: TrendingUp,      label: "Proyecciones",  href: "/proyecciones" },
] as const

export const STATUS_COLORS = {
  al_dia: "emerald-500",
  gracia: "amber-500",
  mora: "rose-500",
  proyectado: "blue-500",
  inactivo: "slate-400",
} as const
