import { SiteHeader } from "@/components/site-header"
import { TrackView } from "@/components/track-view"
import {
  getComplaintByDocket,
  getLogsForComplaint,
  getComplaintsByEmail,
  getBuildings,
  getTechnicians,
  getFeedbackForComplaint,
} from "@/lib/queries"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ docket?: string; email?: string }>
}) {
  const params = await searchParams
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const [buildings, technicians] = await Promise.all([getBuildings(), getTechnicians()])

  let complaint = null
  let logs: Awaited<ReturnType<typeof getLogsForComplaint>> = []
  let feedback = null
  if (params.docket) {
    complaint = await getComplaintByDocket(params.docket.trim())
    if (complaint) {
      logs = await getLogsForComplaint(complaint.id)
      feedback = await getFeedbackForComplaint(complaint.id)
    }
  }

  const myComplaints =
    session?.role === "User" ? await getComplaintsByEmail(session.email) : []

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Track Complaint</h1>
          <p className="text-sm text-muted-foreground">
            Enter your docket number to see the latest status and full history.
          </p>
        </div>
        <TrackView
          initialDocket={params.docket ?? ""}
          complaint={complaint}
          logs={logs}
          feedback={feedback}
          buildings={buildings}
          technicians={technicians}
          myComplaints={myComplaints}
        />
      </main>
    </div>
  )
}
