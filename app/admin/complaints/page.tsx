import { getAllComplaints, getBuildings, getTechnicians } from "@/lib/queries"
import { getSession } from "@/lib/session"
import { ComplaintsTable } from "@/components/admin/complaints-table"

export default async function AdminComplaintsPage() {
  const session = await getSession()
  const [complaints, buildings, technicians] = await Promise.all([
    getAllComplaints(),
    getBuildings(),
    getTechnicians(),
  ])

  const scoped =
    session?.role === "JE" && session.staffId
      ? complaints.filter((c) => c.jeId === session.staffId)
      : complaints

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Complaints</h1>
        <p className="text-sm text-muted-foreground">
          Filter, assign, and update the status of registered complaints.
        </p>
      </div>
      <ComplaintsTable complaints={scoped} buildings={buildings} technicians={technicians} />
    </div>
  )
}
