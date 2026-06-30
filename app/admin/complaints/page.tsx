import { getAllComplaints, getBuildings, getTechnicians, getStaff, getCategories } from "@/lib/queries"
import { getSession } from "@/lib/session"
import { ComplaintsTable } from "@/components/admin/complaints-table"

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

  const scoped =
    session?.role === "JE" && session.staffId
      ? (() => {
          const jeStaff = allStaff.find((s) => s.id === session.staffId)
          const division = jeStaff?.subdivision?.trim()
          if (!division) return []

          const divisionCategoryIds = categories
            .filter((c) => c.level === 1 && c.name === division)
            .map((c) => c.id)

          return complaints.filter(
            (c) =>
              c.categoryId &&
              divisionCategoryIds.includes(c.categoryId) &&
              visibleStatuses.includes(c.status),
          )
        })()
      : complaints.filter((c) => visibleStatuses.includes(c.status))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Complaints</h1>
        <p className="text-sm text-muted-foreground">
          {session?.role === "JE"
            ? "View and manage complaints in your division."
            : "Filter, assign, and update the status of registered complaints."}
        </p>
      </div>
      <ComplaintsTable complaints={scoped} buildings={buildings} technicians={technicians} />
    </div>
  )
}
