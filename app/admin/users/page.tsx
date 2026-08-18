import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { isAdminRole } from "@/lib/constants"
import { getAllUsers } from "@/lib/queries"
import { deleteUser } from "@/app/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, Trash2 } from "lucide-react"

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
          All registered user accounts. Users are created via the setup script.
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="text-right">
                    <form action={async () => { "use server"; await deleteUser(user.id) }}>
                      <Button variant="ghost" size="sm" type="submit">
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {allUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No user accounts yet. Run the setup script to create users.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
