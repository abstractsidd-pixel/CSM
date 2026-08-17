import type { ComplaintRow, CategoryRow } from "./queries"

type StaffRow = { id: number; role: string; subdivision: string | null; aeId: number | null }

export function scopeComplaints(
  complaints: ComplaintRow[],
  categories: CategoryRow[],
  allStaff: StaffRow[],
  session: { role: string; staffId?: number } | null,
  visibleStatuses: string[],
): ComplaintRow[] {
  if (!session) return []

  const filtered = complaints.filter((c) => visibleStatuses.includes(c.status))

  if (session.role === "EE" || session.role === "Dean") {
    return filtered
  }

  if (session.role === "AE" && session.staffId) {
    const jeDivisions = allStaff
      .filter((s) => s.role === "JE" && s.aeId === session.staffId && s.subdivision)
      .flatMap((s) => s.subdivision!.split(",").map((d) => d.trim()))
      .filter(Boolean)

    if (jeDivisions.length === 0) return []

    const divisionCategoryIds = categories
      .filter((c) => c.level === 1 && jeDivisions.includes(c.name))
      .map((c) => c.id)

    return filtered.filter(
      (c) => c.categoryId && divisionCategoryIds.includes(c.categoryId),
    )
  }

  if (session.role === "JE" && session.staffId) {
    const jeStaff = allStaff.find((s) => s.id === session.staffId)
    const divisions = jeStaff?.subdivision
      ? jeStaff.subdivision.split(",").map((d) => d.trim()).filter(Boolean)
      : []

    if (divisions.length === 0) return []

    const divisionCategoryIds = categories
      .filter((c) => c.level === 1 && divisions.includes(c.name))
      .map((c) => c.id)

    return filtered.filter(
      (c) => c.categoryId && divisionCategoryIds.includes(c.categoryId),
    )
  }

  return filtered
}
