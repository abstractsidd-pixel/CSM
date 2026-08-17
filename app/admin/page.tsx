import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getAllComplaints,
  getBuildings,
  getTechnicians,
  getStaff,
  getCategories,
} from "@/lib/queries"
import { getSession } from "@/lib/session"
import { computeStats } from "@/lib/stats"
import { StatusBadge, PriorityBadge, slaStatus } from "@/components/shared-ui"
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Timer,
  ArrowRight,
} from "lucide-react"
import { StatusChart } from "@/components/admin/status-chart"
import { checkAndNotifySlaBreaches } from "@/app/actions/sla-check"
import { scopeComplaints } from "@/lib/complaint-scope"

export default async function AdminDashboard() {
  await checkAndNotifySlaBreaches()
  const session = await getSession()
  const [complaints, buildings, technicians, allStaff, categories] = await Promise.all([
    getAllComplaints(),
    getBuildings(),
    getTechnicians(),
    getStaff(),
    getCategories(),
  ])

  const visibleStatuses = ["Registered", "Assigned", "In Progress", "Resolved", "Closed", "Reactivated"]
  const scoped = scopeComplaints(complaints, categories, allStaff, session, visibleStatuses)

  const stats = computeStats(scoped)
  const recent = scoped.slice(0, 8)
  const needsAttention = scoped
    .filter((c) => c.status === "Registered" || (c.dueAt && slaStatus(c.dueAt, c.closedAt).label.includes("Overdue")))
    .slice(0, 5)

  const buildingName = (id: number) => buildings.find((b) => b.id === id)?.name ?? "—"
  const techName = (id: number | null) =>
    id ? technicians.find((t) => t.id === id)?.name ?? "—" : "Unassigned"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IWD Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome, {session?.name} · {session?.role}
            {session?.role === "JE" ? " (your assigned scope)" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Link href="/admin/complaints">
              Manage Complaints
            </Link>
          </Button>
          <Button variant="outline">
            <Link href="/admin/users">
              Manage Users
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={ClipboardList} label="Total" value={stats.total} />
        <Stat icon={Inbox} label="Open" value={stats.open} accent="text-chart-3" />
        <Stat
          icon={AlertTriangle}
          label="Overdue"
          value={stats.overdue}
          accent="text-destructive"
        />
        <Stat icon={CheckCircle2} label="Resolved" value={stats.resolved} accent="text-chart-4" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Performance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Metric label="SLA Compliance" value={`${stats.slaCompliance}%`} icon={Timer} />
            <Metric
              label="Avg Resolution"
              value={stats.avgHours ? `${stats.avgHours}h` : "—"}
              icon={CheckCircle2}
            />
            <Metric label="Unassigned" value={stats.unassigned} icon={Inbox} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Complaints by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart complaints={scoped} />
          </CardContent>
        </Card>
      </div>

      {needsAttention.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {needsAttention.map((c) => {
              const sla = slaStatus(c.dueAt, c.closedAt)
              return (
                <Link
                  key={c.id}
                  href={`/admin/complaints/${c.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"
                >
                  <div>
                    <span className="font-mono text-sm font-medium">{c.docketNumber}</span>
                    <p className="text-xs text-muted-foreground">
                      {buildingName(c.buildingId)} · {c.categoryLabel || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${sla.className}`}>{sla.label}</span>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Complaints</CardTitle>
          <Button variant="ghost" size="sm">
            <Link href="/admin/complaints">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {recent.map((c) => (
            <Link
              key={c.id}
              href={`/admin/complaints/${c.id}`}
              className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"
            >
              <div className="min-w-0">
                <span className="font-mono text-sm font-medium">{c.docketNumber}</span>
                <p className="truncate text-xs text-muted-foreground">
                  {buildingName(c.buildingId)} · {techName(c.assignedTechnicianId)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
          {recent.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No complaints yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  accent = "text-foreground",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  accent?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <div className="flex flex-col">
          <span className={`text-2xl font-bold ${accent}`}>{value}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  )
}
