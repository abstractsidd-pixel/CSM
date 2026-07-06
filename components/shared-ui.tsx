import { Badge } from "@/components/ui/badge"
import { PRIORITY_BADGE, STATUS_BADGE } from "@/lib/constants"
import { cn, formatDate } from "@/lib/utils"

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_BADGE[status])}>
      {status}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", PRIORITY_BADGE[priority])}>
      {priority}
    </Badge>
  )
}

export { formatDate }

export function slaStatus(dueAt: Date | string | null, closedAt: Date | string | null) {
  if (!dueAt) return { label: "—", className: "text-muted-foreground" }
  const due = new Date(dueAt).getTime()
  const ref = closedAt ? new Date(closedAt).getTime() : Date.now()
  const diffH = Math.round((due - ref) / (1000 * 60 * 60))
  if (closedAt) {
    return diffH >= 0
      ? { label: "Met", className: "text-chart-4" }
      : { label: "Breached", className: "text-destructive" }
  }
  if (diffH < 0) return { label: `Overdue ${Math.abs(diffH)}h`, className: "text-destructive" }
  if (diffH <= 6) return { label: `${diffH}h left`, className: "text-chart-3" }
  return { label: `${diffH}h left`, className: "text-muted-foreground" }
}
