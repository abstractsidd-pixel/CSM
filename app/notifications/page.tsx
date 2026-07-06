import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import { getNotificationsByEmail, markNotificationsAsRead } from "@/lib/queries"
import { NotificationsList } from "@/components/notifications-list"
import { ArrowLeft } from "lucide-react"
import { isAdminRole } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default async function NotificationsPage() {
  const session = await getSession()
  if (!session?.email) redirect("/login")

  const notifications = await getNotificationsByEmail(session.email)
  await markNotificationsAsRead(session.email)

  const homeHref = session.role === "HallOffice"
    ? "/hall-office"
    : isAdminRole(session.role)
      ? "/admin"
      : "/student"

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={homeHref}
          className={cn(
            "inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
      <NotificationsList notifications={notifications} />
    </main>
  )
}
