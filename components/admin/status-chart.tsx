"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { countBy } from "@/lib/stats"
import { STATUSES } from "@/lib/constants"
import type { ComplaintRow } from "@/lib/queries"

const config: ChartConfig = {
  count: { label: "Complaints", color: "var(--chart-1)" },
}

export function StatusChart({ complaints }: { complaints: ComplaintRow[] }) {
  const counts = countBy(complaints, (c) => c.status)
  const data = STATUSES.map((s) => ({ status: s, count: counts[s] ?? 0 }))

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart data={data} margin={{ left: -16, right: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="status"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={50}
        />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
