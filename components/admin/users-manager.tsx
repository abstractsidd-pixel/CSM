"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, X, Check } from "lucide-react"
import { deleteUser, updateUser } from "@/app/actions/admin"
import { toast } from "sonner"

interface User {
  id: number
  name: string
  email: string
  role: string
}

const ALL_ROLES = ["User", "JE", "AE", "EE", "Dean"]

export function UsersManager({
  users,
  sessionRole,
}: {
  users: User[]
  sessionRole: string
}) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<User | null>(null)
  const router = useRouter()

  const canEditDelete = sessionRole === "EE" || sessionRole === "Dean"

  const startEdit = (user: User) => {
    setEditingId(user.id)
    setEditForm({ ...user })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"?`)) return
    try {
      await deleteUser(id)
      toast.success("User deleted.")
      router.refresh()
    } catch {
      toast.error("Failed to delete user.")
    }
  }

  const handleUpdate = async () => {
    if (!editForm) return
    const formData = new FormData()
    formData.set("id", String(editForm.id))
    formData.set("name", editForm.name)
    formData.set("email", editForm.email)
    formData.set("role", editForm.role)
    try {
      await updateUser(formData)
      toast.success("User updated.")
      setEditingId(null)
      setEditForm(null)
      router.refresh()
    } catch {
      toast.error("Failed to update user.")
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          {canEditDelete && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) =>
          editingId === user.id && editForm ? (
            <TableRow key={user.id}>
              <TableCell>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="h-8 text-xs"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="h-8 text-xs"
                />
              </TableCell>
              <TableCell>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </TableCell>
              {canEditDelete && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={handleUpdate}>
                      <Check className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ) : (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              {canEditDelete && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(user)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id, user.name)}>
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ),
        )}
        {users.length === 0 && (
          <TableRow>
            <TableCell colSpan={canEditDelete ? 4 : 3} className="py-8 text-center text-sm text-muted-foreground">
              No user accounts yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
