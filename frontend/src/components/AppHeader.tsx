import { Link } from "react-router"
import { Logo } from "@/components/Logo"

export function AppHeader() {
  return (
    <header className="flex shrink-0 items-center gap-2.5 border-b border-border bg-card px-4 py-3">
      <Link to="/" className="flex items-center gap-2.5">
        <Logo />
        <span className="text-[15px] font-semibold tracking-tight">HerSignal</span>
      </Link>
      <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        Demo
      </span>
    </header>
  )
}
