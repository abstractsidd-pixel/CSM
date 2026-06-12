import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge, formatDate, slaStatus } from "@/components/shared-ui"
import {
  getAllComplaints,
  getAllFeedback,
  getBuildings,
  getCategories,
  getTechnicians,
} from "@/lib/queries"
import { BarChart3, Download, FileSpreadsheet, Star, Timer, ShieldAlert } from "lucide-react"
import { getSession } from "@/lib/session"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await getSession()

  if (session?.role !== "EE" && session?.role !== "Dean") {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="text-xl font-semibold">Access Restricted</h1>
        <p className="text-sm text-muted-foreground">
          Reports & analytics are available to EE and Dean only.
        </p>
        <Button variant="outline">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const { from, to } = await searchParams
  const [complaints, feedback, buildings, categories, technicians] = await Promise.all([
    getAllComplaints(),
    getAllFeedback(),
    getBuildings(),
    getCategories(),
    getTechnicians(),
  ])

  const fromDate = from ? new Date(`${from}T00:00:00`) : null
  const toDate = to ? new Date(`${to}T23:59:59`) : null
  const filtered = complaints.filter((complaint) => {
    const created = new Date(complaint.createdAt)
    if (fromDate && created < fromDate) return false
    if (toDate && created > toDate) return false
    return true
  })

  const buildingName = (id: number) => buildings.find((building) => building.id === id)?.name ?? "-"
  const technicianName = (id: number | null) =>
    id ? technicians.find((technician) => technician.id === id)?.name ?? `#${id}` : "Unassigned"
  const categoryName = (id: number | null) =>
    id ? categories.find((category) => category.id === id)?.name ?? "-" : "-"

  const overdue = filtered
    .filter((complaint) => slaStatus(complaint.dueAt, complaint.closedAt).label.startsWith("Overdue"))
    .sort((a, b) => overdueHours(b.dueAt) - overdueHours(a.dueAt))

  const closed = filtered.filter((complaint) => complaint.closedAt)
  const filteredComplaintIds = new Set(filtered.map((complaint) => complaint.id))
  const filteredFeedback = feedback.filter((row) => filteredComplaintIds.has(row.complaintId))
  const avgRating = filteredFeedback.length
    ? (filteredFeedback.reduce((sum, row) => sum + row.rating, 0) / filteredFeedback.length).toFixed(1)
    : "-"

  const byBuilding = buildings.map((building) => ({
    label: building.name,
    count: filtered.filter((complaint) => complaint.buildingId === building.id).length,
  }))
  const byCategory = groupCounts(filtered.map((complaint) => complaint.categoryLabel || categoryName(complaint.categoryId)))
  const technicianOutput = technicians.map((technician) => {
    const rows = filtered.filter((complaint) => complaint.assignedTechnicianId === technician.id)
    return {
      technician,
      assigned: rows.length,
      resolved: rows.filter((complaint) => ["Resolved", "Closed"].includes(complaint.status)).length,
      pending: rows.filter((complaint) => !["Resolved", "Closed"].includes(complaint.status)).length,
    }
  })

  const satisfaction = filteredFeedback.map((row) => {
    const complaint = complaints.find((item) => item.id === row.complaintId)
    return {
      id: row.id,
      rating: row.rating,
      building: complaint ? buildingName(complaint.buildingId) : "-",
      category: complaint?.categoryLabel || categoryName(complaint?.categoryId ?? null),
      createdAt: row.createdAt,
    }
  })

  const satisfactionByBuilding = buildings.map((building) => {
    const rows = filteredFeedback.filter((row) => {
      const complaint = complaints.find((item) => item.id === row.complaintId)
      return complaint?.buildingId === building.id
    })
    return {
      label: building.name,
      value: rows.length ? Number((rows.reduce((sum, row) => sum + row.rating, 0) / rows.length).toFixed(1)) : 0,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">
            EE / Dean view for complaint trends, SLA ageing, technician output, and satisfaction.
          </p>
        </div>
        <form className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[150px_150px_auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" type="date" defaultValue={from ?? ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="date" defaultValue={to ?? ""} />
          </div>
          <Button type="submit" className="self-end">Apply</Button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Complaints" value={filtered.length} icon={BarChart3} />
        <MetricCard title="Closed" value={closed.length} icon={FileSpreadsheet} />
        <MetricCard title="Overdue" value={overdue.length} icon={Timer} danger />
        <MetricCard title="Avg Rating" value={avgRating} icon={Star} />
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <ReportCard
          title="Monthly Complaint Summary"
          description="Building-wise and category-wise complaint distribution."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <BarList title="By Building" rows={byBuilding} />
            <BarList title="By Category" rows={byCategory.slice(0, 8)} />
          </div>
        </ReportCard>

        <ReportCard
          title="User Satisfaction Scores"
          description="Average star ratings by building, plus latest feedback entries."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <BarList title="Average by Building" rows={satisfactionByBuilding} maxValue={5} suffix="/5" />
            <div>
              <h3 className="mb-2 text-sm font-medium">Latest Ratings</h3>
              <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {satisfaction.slice(0, 6).map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3 p-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.building}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-chart-3">{row.rating}/5</span>
                  </div>
                ))}
                {satisfaction.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">No feedback received yet.</p>
                )}
              </div>
            </div>
          </div>
        </ReportCard>
      </section>

      <ReportCard
        title="Pending Complaints with Ageing Analysis"
        description="Complaints overdue beyond SLA, sorted by ageing."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Docket</TableHead>
              <TableHead>Building</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due At</TableHead>
              <TableHead className="text-right">Ageing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overdue.map((complaint) => (
              <TableRow key={complaint.id}>
                <TableCell className="font-mono text-xs font-medium">{complaint.docketNumber}</TableCell>
                <TableCell>{buildingName(complaint.buildingId)}</TableCell>
                <TableCell>{complaint.categoryLabel || categoryName(complaint.categoryId)}</TableCell>
                <TableCell><StatusBadge status={complaint.status} /></TableCell>
                <TableCell>{formatDate(complaint.dueAt)}</TableCell>
                <TableCell className="text-right font-medium text-destructive">
                  {Math.ceil(overdueHours(complaint.dueAt) / 24)} days
                </TableCell>
              </TableRow>
            ))}
            {overdue.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No overdue complaints in the selected range.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ReportCard>

      <ReportCard
        title="Technician-wise Work Output"
        description="Assigned, resolved, and pending workload per technician."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Technician</TableHead>
              <TableHead>Trade</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Resolved</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Current Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicianOutput.map((row) => (
              <TableRow key={row.technician.id}>
                <TableCell className="font-medium">{technicianName(row.technician.id)}</TableCell>
                <TableCell>{row.technician.trade}</TableCell>
                <TableCell>{row.assigned}</TableCell>
                <TableCell>{row.resolved}</TableCell>
                <TableCell>{row.pending}</TableCell>
                <TableCell>{row.technician.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportCard>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Exportable Reports</p>
            <p className="text-sm text-muted-foreground">
              PDF and Excel export controls are placed here for the next integration pass.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Download className="size-4" />
              Export PDF
            </Button>
            <Button variant="outline" disabled>
              <Download className="size-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  danger = false,
}: {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  danger?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={danger ? "mt-1 text-2xl font-semibold text-destructive" : "mt-1 text-2xl font-semibold"}>
            {value}
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )
}

function ReportCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function BarList({
  title,
  rows,
  maxValue,
  suffix = "",
}: {
  title: string
  rows: { label: string; count?: number; value?: number }[]
  maxValue?: number
  suffix?: string
}) {
  const highest = maxValue ?? Math.max(1, ...rows.map((row) => row.count ?? row.value ?? 0))

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          const value = row.count ?? row.value ?? 0
          const width = highest ? Math.max(4, (value / highest) * 100) : 4

          return (
            <div key={row.label} className="grid grid-cols-[minmax(90px,0.8fr)_minmax(120px,1fr)_48px] items-center gap-2">
              <span className="truncate text-xs text-muted-foreground">{row.label}</span>
              <span className="h-2 rounded-full bg-muted">
                <span className="block h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
              </span>
              <span className="text-right text-xs font-medium">
                {value}{suffix}
              </span>
            </div>
          )
        })}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No data available.</p>}
      </div>
    </div>
  )
}

function groupCounts(labels: string[]) {
  const map = new Map<string, number>()
  for (const label of labels) map.set(label, (map.get(label) ?? 0) + 1)
  return Array.from(map, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
}

function overdueHours(dueAt: Date | string | null) {
  if (!dueAt) return 0
  return Math.max(0, Math.round((Date.now() - new Date(dueAt).getTime()) / (1000 * 60 * 60)))
}
