"use client"

import Link from "next/link"
import { formatDistanceToNow } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { getNotificationIcon, getNotificationColor } from "@/lib/notification-helpers"
import type { NotificationRow } from "@/lib/queries"

export function NotificationsList({ notifications }: { notifications: NotificationRow[] }) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Bell className="mx-auto mb-4 size-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No notifications yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50",
            !n.isRead && "bg-muted/30 border-primary/20"
          )}
        >
          <div
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border",
              getNotificationColor(n.type)
            )}
          >
            {(() => { const Icon = getNotificationIcon(n.type); return <Icon className="size-4" /> })()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{n.title}</p>
              {!n.isRead && (
                <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </span>
              {n.complaintId && n.docketNumber && (
                <Link
                  href={`/track?docket=${encodeURIComponent(n.docketNumber)}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View Complaint →
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
