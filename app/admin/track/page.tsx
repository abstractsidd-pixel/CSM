import { StaffTrackView } from "@/components/admin/staff-track-view"
import {
  getComplaintByDocket,
  getLogsForComplaint,
  getAllComplaints,
  getBuildings,
  getTechnicians,
  getFeedbackForComplaint,
} from "@/lib/queries"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { isAdminRole } from "@/lib/constants"

export const dynamic = "force-dynamic"

export default async function StaffTrackPage({
  searchParams,
}: {
  searchParams: Promise<{ docket?: string }>
}) {
  const params = await searchParams
  const session = await getSession()

  if (!session || !isAdminRole(session.role)) {
    redirect("/login")
  }

  const [buildings, technicians] = await Promise.all([getBuildings(), getTechnicians()])

  let complaint = null
  let logs: Awaited<ReturnType<typeof getLogsForComplaint>> = []
  let feedback = null

  const allComplaints = await getAllComplaints()
  const myComplaints = allComplaints.filter(
    (c) => c.complainantEmail === session.email,
  )

  if (params.docket) {
    const found = await getComplaintByDocket(params.docket.trim())
    if (found && found.complainantEmail === session.email) {
      complaint = found
      logs = await getLogsForComplaint(complaint.id)
      feedback = await getFeedbackForComplaint(complaint.id)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Track My Complaints</h1>
        <p className="text-sm text-muted-foreground">
          Search by docket number or browse complaints you have registered.
        </p>
      </div>
      <StaffTrackView
        initialDocket={params.docket ?? ""}
        complaint={complaint}
        logs={logs}
        feedback={feedback}
        buildings={buildings}
        technicians={technicians}
        allComplaints={myComplaints}
        sessionRole={session.role}
      />
    </div>
  )
}
