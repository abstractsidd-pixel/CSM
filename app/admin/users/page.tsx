import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { isAdminRole } from "@/lib/constants"
import { getAllUsers } from "@/lib/queries"
import { createUser, deleteUser } from "@/app/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, Trash2 } from "lucide-react"
import { ExcelImport } from "@/components/admin/excel-import"

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
          Manage student and faculty accounts. Only IWD staff (JE+) can create accounts.
        </p>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
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
                      No user accounts yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Student / Faculty</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={async (formData: FormData) => { "use server"; await createUser(formData) }} className="flex flex-col gap-3">
                <Field name="name" label="Full Name" placeholder="Siddharth Suryavanshi" required />
                <Field name="email" label="Email" type="email" placeholder="user@iitgoa.ac.in" required />
                <Field name="password" label="Password" type="password" placeholder="Set a password" required />
                <input type="hidden" name="role" value="User" />
                <Button type="submit">Create Account</Button>
              </form>
            </CardContent>
          </Card>

          <ExcelImport />
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  name,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  name: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  )
}
