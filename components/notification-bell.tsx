"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Bell, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatDistanceToNow } from "@/lib/utils"
import { getNotificationColor } from "@/lib/notification-helpers"
import type { NotificationRow } from "@/lib/queries"

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationRow[]
  unreadCount: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-hidden rounded-lg border border-border bg-popover shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            <Link
              href="/notifications"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View All
            </Link>
          </div>
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/50",
                    !n.isRead && "bg-muted/30"
                  )}
                >
                  <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", getNotificationColor(n.type))}>
                    <Check className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
