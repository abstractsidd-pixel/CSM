import { Bell, MessageSquare, AlertTriangle, CheckCircle, XCircle, Edit, RotateCcw } from "lucide-react"
import type { ElementType } from "react"

export function getNotificationIcon(type: string): ElementType {
  switch (type) {
    case "NEW_COMPLAINT":
    case "COMPLAINT_ASSIGNED":
      return Bell
    case "STATUS_CHANGED":
    case "COMPLAINT_APPROVED":
      return CheckCircle
    case "NEW_COMMENT":
      return MessageSquare
    case "COMPLAINT_REJECTED":
      return XCircle
    case "COMPLAINT_EDITED":
      return Edit
    case "COMPLAINT_REACTIVATED":
      return RotateCcw
    case "SLA_BREACH":
      return AlertTriangle
    default:
      return Bell
  }
}

export function getNotificationColor(type: string): string {
  switch (type) {
    case "NEW_COMPLAINT":
      return "bg-blue-500/15 text-blue-600"
    case "COMPLAINT_ASSIGNED":
      return "bg-purple-500/15 text-purple-600"
    case "STATUS_CHANGED":
      return "bg-amber-500/15 text-amber-600"
    case "NEW_COMMENT":
      return "bg-teal-500/15 text-teal-600"
    case "COMPLAINT_APPROVED":
      return "bg-green-500/15 text-green-600"
    case "COMPLAINT_REJECTED":
      return "bg-red-500/15 text-red-600"
    case "COMPLAINT_EDITED":
      return "bg-orange-500/15 text-orange-600"
    case "COMPLAINT_REACTIVATED":
      return "bg-pink-500/15 text-pink-600"
    case "SLA_BREACH":
      return "bg-red-600/15 text-red-700"
    default:
      return "bg-muted text-muted-foreground"
  }
}
