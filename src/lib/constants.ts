import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Shield,
  FileText,
  Zap,
  TrendingUp,
  Settings,
} from "lucide-react"

export const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",     href: "/" },
  { icon: AlertTriangle,   label: "Mora",          href: "/mora" },
  { icon: Users,           label: "Clientes",      href: "/clientes" },
  { icon: FileText,        label: "Facturas",      href: "/facturas" },
  { icon: CreditCard,      label: "Pagos",         href: "/pagos" },
  { icon: Receipt,         label: "Gastos",        href: "/gastos" },
  { icon: Zap,             label: "Medidores",     href: "/medidores" },
  { icon: TrendingUp,      label: "Proyecciones",  href: "/proyecciones" },
  { icon: BarChart3,       label: "Reportes",      href: "/reportes" },
  { icon: Shield,          label: "Usuarios",      href: "/usuarios" },
  { icon: Settings,        label: "Configuración", href: "/configuracion" },
] as const

export const STATUS_COLORS = {
  al_dia: "emerald-500",
  gracia: "amber-500",
  mora: "rose-500",
  proyectado: "blue-500",
  inactivo: "slate-400",
} as const
