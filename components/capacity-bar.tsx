import { cn } from "@/lib/utils"

export function CapacityBar({ occupied, total }: { occupied: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((occupied / total) * 100)) : 0
  const full = total > 0 && occupied >= total
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {occupied} / {total} place{total > 1 ? "s" : ""}
        </span>
        <span className={cn("font-medium", full ? "text-destructive" : "text-emerald-700")}>
          {full ? "Complet" : `${Math.max(0, total - occupied)} restante${total - occupied > 1 ? "s" : ""}`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", full ? "bg-destructive" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
