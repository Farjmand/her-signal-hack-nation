import { Link, useLocation } from "react-router"
import { SquarePen, History, ShieldCheck, Download } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/", label: "Capture", icon: SquarePen },
  { to: "/timeline", label: "Timeline", icon: History },
  { to: "/consent", label: "Consent", icon: ShieldCheck },
  { to: "/export", label: "Export", icon: Download }
] as const

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="flex shrink-0 border-t border-border bg-card">
      {NAV_ITEMS.map((item) => {
        const active = item.to === "/" ? pathname === "/" || pathname === "/review" : pathname.startsWith(item.to)
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
