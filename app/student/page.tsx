import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getComplaintsByEmail, getBuildings } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge, PriorityBadge, slaStatus } from "@/components/shared-ui"
import { SiteHeader } from "@/components/site-header"
import { computeStats } from "@/lib/stats"
import {
  ClipboardList,
  Search,
  MessageSquareHeart,
  Inbox,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

export default async function StudentDashboard() {
  const session = await getSession()

  if (!session || session.role !== "User") {
    redirect("/login")
  }

  const [complaints, buildings] = await Promise.all([
    getComplaintsByEmail(session.email),
    getBuildings(),
  ])

  const { total, open, resolved, overdue } = computeStats(complaints)

  const buildingName = (id: number) => buildings.find((b) => b.id === id)?.name ?? "—"
  const recent = complaints.slice(0, 5)

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {session.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button>
                <Link href="/register">Register Complaint</Link>
              </Button>
              <Button variant="outline">
                <Link href="/track">Track Status</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={ClipboardList} label="Total Complaints" value={total} />
            <Stat icon={Inbox} label="Open" value={open} accent="text-chart-3" />
            <Stat icon={AlertTriangle} label="Overdue" value={overdue} accent="text-destructive" />
            <Stat icon={CheckCircle2} label="Resolved" value={resolved} accent="text-chart-4" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link href="/register">
              <Card className="h-full transition-colors hover:bg-secondary/50">
                <CardContent className="flex flex-col gap-3 py-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="size-5" />
                  </span>
                  <h3 className="font-semibold">Register Complaint</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Report a new maintenance issue in your building.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/track">
              <Card className="h-full transition-colors hover:bg-secondary/50">
                <CardContent className="flex flex-col gap-3 py-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Search className="size-5" />
                  </span>
                  <h3 className="font-semibold">Track Status</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Follow your complaint across its lifecycle.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/feedback">
              <Card className="h-full transition-colors hover:bg-secondary/50">
                <CardContent className="flex flex-col gap-3 py-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageSquareHeart className="size-5" />
                  </span>
                  <h3 className="font-semibold">Give Feedback</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Rate the resolution and help improve service.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">My Recent Complaints</CardTitle>
              <Button variant="ghost" size="sm">
                <Link href="/track">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {recent.map((c) => {
                const sla = c.dueAt ? slaStatus(c.dueAt, c.closedAt) : null
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-sm font-medium">{c.docketNumber}</span>
                      <p className="truncate text-xs text-muted-foreground">
                        {buildingName(c.buildingId)} · {c.categoryLabel || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sla && <span className={`text-xs font-medium ${sla.className}`}>{sla.label}</span>}
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                )
              })}
              {recent.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No complaints yet. Register your first complaint to get started.
                </p>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
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
