import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getSession } from "@/lib/session"
import { isAdminRole } from "@/lib/constants"
import { getAllComplaints } from "@/lib/queries"
import {
  ClipboardList,
  Search,
  MessageSquareHeart,
  LayoutDashboard,
  Wrench,
  ShieldCheck,
} from "lucide-react"

export default async function HomePage() {
  const session = await getSession()
  const admin = isAdminRole(session?.role)
  const isStudent = session?.role === "User"
  const complaints = await getAllComplaints()

  const total = complaints.length
  const open = complaints.filter((c) => !["Closed", "Resolved"].includes(c.status)).length
  const resolved = complaints.filter((c) => ["Closed", "Resolved"].includes(c.status)).length

  const dashboardHref = isStudent ? "/student" : admin ? "/admin" : "/login"

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="flex flex-col items-center gap-6 py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Institute Works Department · IIT Goa
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Report, track, and resolve campus maintenance issues
          </h1>
          <p className="max-w-xl text-pretty text-muted-foreground leading-relaxed">
            A single portal for students, faculty, and staff to raise complaints and for the
            IWD team to assign, monitor, and close them within defined service levels.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg">
              <Link href="/register">Register a Complaint</Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="/track">Track Status</Link>
            </Button>
            {(admin || isStudent) && (
              <Button size="lg" variant="secondary">
                <Link href={dashboardHref}>
                  {isStudent ? "My Dashboard" : "Open IWD Dashboard"}
                </Link>
              </Button>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Complaints" value={total} />
          <StatCard label="Currently Open" value={open} accent="text-chart-3" />
          <StatCard label="Resolved / Closed" value={resolved} accent="text-chart-4" />
        </section>

        <section className="grid grid-cols-1 gap-4 py-12 md:grid-cols-3">
          <FeatureCard
            icon={ClipboardList}
            title="Register"
            desc="Pick a building, location, and category. Get an instant docket number and SLA-based priority."
          />
          <FeatureCard
            icon={Search}
            title="Track"
            desc="Follow your complaint across its lifecycle with a full timeline of every update."
          />
          <FeatureCard
            icon={MessageSquareHeart}
            title="Feedback"
            desc="Rate the resolution, reopen if needed, and help the IWD improve service quality."
          />
        </section>

        <section className="mb-16 rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LayoutDashboard className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">For the IWD Team</h2>
                <p className="text-sm text-muted-foreground">
                  Dashboards, technician assignment, SLA monitoring, and reports.
                </p>
              </div>
            </div>
            <Button variant={admin ? "default" : "outline"}>
              <Link href={admin ? "/admin" : "/login"}>
                {admin ? "Go to Dashboard" : "Sign in as IWD staff"}
              </Link>
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: LayoutDashboard, t: "Live dashboard" },
              { icon: Wrench, t: "Assign technicians" },
              { icon: ShieldCheck, t: "SLA tracking" },
              { icon: ClipboardList, t: "Reports & exports" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-2 text-sm text-muted-foreground">
                <f.icon className="size-4 text-primary" />
                {f.t}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          IWD Complaint Management System · Indian Institute of Technology Goa · Demo build
        </p>
      </footer>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent = "text-foreground",
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`text-3xl font-bold ${accent}`}>{value}</span>
      </CardContent>
    </Card>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
}) {
  return (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-3 py-6">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )
}
