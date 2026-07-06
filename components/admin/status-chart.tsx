"use client"

import { countBy } from "@/lib/stats"
import { STATUSES } from "@/lib/constants"
import type { ComplaintRow } from "@/lib/queries"

export function StatusChart({ complaints }: { complaints: ComplaintRow[] }) {
  const counts = countBy(complaints, (c) => c.status)
  const data = STATUSES.map((s) => ({ status: s, count: counts[s] ?? 0 }))
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex h-[240px] w-full items-end gap-1.5 px-2 pb-6 pt-2">
      {data.map((d) => (
        <div key={d.status} className="group flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-primary transition-all group-hover:bg-primary/80"
            style={{ height: `${(d.count / maxCount) * 160}px`, minHeight: d.count > 0 ? "4px" : "0" }}
          />
          <span className="text-[10px] leading-tight text-muted-foreground text-center -rotate-45 origin-top-left whitespace-nowrap">
            {d.status}
          </span>
          {d.count > 0 && (
            <span className="text-xs font-medium text-foreground">{d.count}</span>
          )}
        </div>
      ))}
    </div>
  )
}
