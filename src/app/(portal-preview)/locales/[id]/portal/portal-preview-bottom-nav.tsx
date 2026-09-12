import { Home, Zap, CreditCard, User } from "lucide-react"
import { cn } from "@/lib/utils"

// Static, non-interactive replica of PortalBottomNav for the staff "Ver portal"
// preview. Same 4 tabs, icons, layout and classes — but no href/Link on any tab:
// the real tabs point at /portal/* routes gated by requireInquilino(), which would
// bounce a staff viewer. "Inicio" renders active, exactly as the real nav looks on
// the tenant home page. Do not add links or behaviour here.
const TABS = [
  { label: "Inicio", icon: Home },
  { label: "Medidor", icon: Zap },
  { label: "Pagos", icon: CreditCard },
  { label: "Perfil", icon: User },
]

export function PortalPreviewBottomNav() {
  return (
    <nav
      aria-hidden="true"
      className="fixed bottom-0 inset-x-0 z-40 flex border-t border-slate-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ label, icon: Icon }, i) => {
        const active = i === 0
        return (
          <div
            key={label}
            className="flex flex-1 flex-col items-center justify-center gap-1 min-h-[60px] py-2"
          >
            <Icon className={cn("h-5 w-5", active ? "text-blue-500" : "text-slate-400")} />
            <span
              className={cn(
                "text-[10px] font-medium",
                active ? "text-blue-500" : "text-slate-400"
              )}
            >
              {label}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
