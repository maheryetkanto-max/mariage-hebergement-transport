import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: "default" | "primary" | "warning" | "success"
  hint?: string
}) {
  const tones: Record<string, string> = {
    default: "text-muted-foreground bg-muted",
    primary: "text-primary bg-primary/10",
    warning: "text-amber-700 bg-amber-100",
    success: "text-emerald-700 bg-emerald-100",
  }
  return (
    <Card className="flex flex-row items-center gap-4 p-4">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="font-serif text-2xl font-semibold leading-tight text-foreground">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  )
}
