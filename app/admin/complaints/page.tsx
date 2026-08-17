import { getAllComplaints, getBuildings, getTechnicians, getStaff, getCategories } from "@/lib/queries"
import { getSession } from "@/lib/session"
import { ComplaintsTable } from "@/components/admin/complaints-table"
import { scopeComplaints } from "@/lib/complaint-scope"

export default async function AdminComplaintsPage() {
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Complaints</h1>
        <p className="text-sm text-muted-foreground">
          {session?.role === "JE"
            ? "View and manage complaints in your division."
            : session?.role === "AE"
              ? "View and manage complaints from JEs under you."
              : "Filter, assign, and update the status of registered complaints."}
        </p>
      </div>
      <ComplaintsTable complaints={scoped} buildings={buildings} technicians={technicians} />
    </div>
  )
}
