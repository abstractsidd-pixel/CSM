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
import { deleteStaff, updateStaff } from "@/app/actions/admin"
import { toast } from "sonner"

interface StaffMember {
  id: number
  name: string
  email: string
  role: string
  subdivision: string | null
  buildingId: number | null
  aeId: number | null
}

interface Building {
  id: number
  name: string
}

const STAFF_ROLES = ["JE", "AE", "EE", "Dean"]
const EDITABLE_ROLES = ["JE", "AE"]

export function StaffManager({
  staff,
  buildings,
  sessionRole,
}: {
  staff: StaffMember[]
  buildings: Building[]
  sessionRole: string
}) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<StaffMember | null>(null)
  const router = useRouter()

  const canEditDelete = sessionRole === "EE" || sessionRole === "Dean"

  const canEditMember = (member: StaffMember) => {
    if (!canEditDelete) return false
    return EDITABLE_ROLES.includes(member.role)
  }

  const startEdit = (member: StaffMember) => {
    setEditingId(member.id)
    setEditForm({ ...member })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return
    try {
      await deleteStaff(id)
      toast.success("Staff member deleted.")
      router.refresh()
    } catch {
      toast.error("Failed to delete staff member.")
    }
  }

  const handleUpdate = async () => {
    if (!editForm) return
    const formData = new FormData()
    formData.set("id", String(editForm.id))
    formData.set("name", editForm.name)
    formData.set("email", editForm.email)
    formData.set("role", editForm.role)
    formData.set("subdivision", editForm.subdivision || "")
    formData.set("buildingId", editForm.buildingId ? String(editForm.buildingId) : "")
    formData.set("aeId", editForm.aeId ? String(editForm.aeId) : "")
    try {
      await updateStaff(formData)
      toast.success("Staff member updated.")
      setEditingId(null)
      setEditForm(null)
      router.refresh()
    } catch {
      toast.error("Failed to update staff member.")
    }
  }

  const aeList = staff.filter((s) => s.role === "AE")

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Subdivision</TableHead>
            <TableHead>Building</TableHead>
            <TableHead>Reports To (AE)</TableHead>
            {canEditDelete && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((member) =>
            editingId === member.id && editForm ? (
              <TableRow key={member.id}>
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
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <Input
                    value={editForm.subdivision || ""}
                    onChange={(e) => setEditForm({ ...editForm, subdivision: e.target.value || null })}
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell>
                  <select
                    value={editForm.buildingId ?? ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        buildingId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none"
                  >
                    <option value="">None</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  {editForm.role === "JE" ? (
                    <select
                      value={editForm.aeId ?? ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          aeId: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs outline-none"
                    >
                      <option value="">None</option>
                      {aeList.map((ae) => (
                        <option key={ae.id} value={ae.id}>
                          {ae.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
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
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>{member.subdivision || "-"}</TableCell>
                <TableCell>
                  {buildings.find((b) => b.id === member.buildingId)?.name ?? "-"}
                </TableCell>
                <TableCell>
                  {member.role === "JE"
                    ? staff.find((s) => s.id === member.aeId)?.name ?? "-"
                    : "-"}
                </TableCell>
                {canEditDelete && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEditMember(member) && (
                        <Button variant="ghost" size="sm" onClick={() => startEdit(member)}>
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                      )}
                      {canEditMember(member) && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}>
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          )}
          {staff.length === 0 && (
            <TableRow>
              <TableCell colSpan={canEditDelete ? 7 : 6} className="py-8 text-center text-sm text-muted-foreground">
                No staff members yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  )
}
