import type { ComplaintRow } from "@/lib/queries"

export const OPEN_STATUSES = ["Registered", "Assigned", "In Progress", "Reactivated"]
export const CLOSED_STATUSES = ["Resolved", "Closed"]

export function computeStats(complaints: ComplaintRow[]) {
  const total = complaints.length
  const open = complaints.filter((c) => OPEN_STATUSES.includes(c.status)).length
  const resolved = complaints.filter((c) => CLOSED_STATUSES.includes(c.status)).length
  const unassigned = complaints.filter((c) => c.status === "Registered").length

  const now = Date.now()
  const overdue = complaints.filter(
    (c) =>
      OPEN_STATUSES.includes(c.status) &&
      c.dueAt &&
      new Date(c.dueAt).getTime() < now,
  ).length

  // SLA compliance among closed complaints
  const closed = complaints.filter((c) => c.closedAt && c.dueAt)
  const met = closed.filter(
    (c) => new Date(c.closedAt!).getTime() <= new Date(c.dueAt!).getTime(),
  ).length
  const slaCompliance = closed.length ? Math.round((met / closed.length) * 100) : 100

  // avg resolution time (hours)
  const resolvedWithTimes = complaints.filter((c) => c.closedAt)
  const avgHours = resolvedWithTimes.length
    ? Math.round(
        resolvedWithTimes.reduce(
          (sum, c) =>
            sum +
            (new Date(c.closedAt!).getTime() - new Date(c.createdAt).getTime()) /
              (1000 * 60 * 60),
          0,
        ) / resolvedWithTimes.length,
      )
    : 0

  return { total, open, resolved, unassigned, overdue, slaCompliance, avgHours }
}

export function countBy<T extends string>(
  complaints: ComplaintRow[],
  key: (c: ComplaintRow) => T,
): Record<string, number> {
  return complaints.reduce<Record<string, number>>((acc, c) => {
    const k = key(c)
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
}
