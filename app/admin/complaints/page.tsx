import { getAllComplaints, getBuildings, getTechnicians, getStaff } from "@/lib/queries"
import { getSession } from "@/lib/session"
import { ComplaintsTable } from "@/components/admin/complaints-table"

export default async function AdminComplaintsPage() {
  const session = await getSession()
  const [complaints, buildings, technicians, allStaff] = await Promise.all([
    getAllComplaints(),
    getBuildings(),
    getTechnicians(),
    getStaff(),
  ])

  const scoped =
    session?.role === "JE" && session.staffId
      ? (() => {
          const assignedBuildingIds = allStaff
            .filter((s) => s.id === session.staffId && s.buildingId)
            .map((s) => s.buildingId as number)
          return complaints.filter(
            (c) => assignedBuildingIds.includes(c.buildingId),
          )
        })()
      : complaints

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Complaints</h1>
        <p className="text-sm text-muted-foreground">
          {session?.role === "JE"
            ? "View and manage complaints in your assigned scope."
            : "Filter, assign, and update the status of registered complaints."}
        </p>
      </div>
      <ComplaintsTable complaints={scoped} buildings={buildings} technicians={technicians} />
    </div>
  )
}
