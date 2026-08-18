import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { isAdminRole } from "@/lib/constants"
import { getAllUsers } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { UserManager } from "@/components/admin/user-manager"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const session = await getSession()

  if (!isAdminRole(session?.role)) {
    redirect("/login")
  }

  const allUsers = await getAllUsers()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Manage registered user accounts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" />
            Registered Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserManager users={allUsers} />
        </CardContent>
      </Card>
    </div>
  )
}
