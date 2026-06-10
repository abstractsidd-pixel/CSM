export const ROLES = ["User", "JE", "AE", "EE", "Dean"] as const
export type Role = (typeof ROLES)[number]

export const PRIORITIES = ["Critical", "Major", "Minor"] as const
export type Priority = (typeof PRIORITIES)[number]

// Complaint lifecycle statuses
export const STATUSES = [
  "Registered",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
  "Reactivated",
] as const
export type Status = (typeof STATUSES)[number]

export const PRIORITY_BADGE: Record<string, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  Major: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  Minor: "bg-muted text-muted-foreground border-border",
}

export const STATUS_BADGE: Record<string, string> = {
  Registered: "bg-secondary text-secondary-foreground border-border",
  Assigned: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  "In Progress": "bg-primary/15 text-primary border-primary/30",
  Resolved: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  Closed: "bg-muted text-muted-foreground border-border",
  Reactivated: "bg-chart-3/15 text-chart-3 border-chart-3/30",
}

export const TRADES = [
  "Electrical",
  "Plumbing",
  "Civil",
  "Carpentry",
  "AC/HVAC",
  "Housekeeping",
] as const

// Which roles can access the IWD admin module
export const ADMIN_ROLES: Role[] = ["JE", "AE", "EE", "Dean"]

export function isAdminRole(role: Role | undefined | null) {
  return !!role && ADMIN_ROLES.includes(role)
}
