import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Eyebrow({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div
      className={cn(
        "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-primary",
        className
      )}
    >
      {children}
    </div>
  )
}
