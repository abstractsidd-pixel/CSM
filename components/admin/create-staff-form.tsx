"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createStaff } from "@/app/actions/admin"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface StaffMember {
  id: number
  name: string
  role: string
}

interface Building {
  id: number
  name: string
}

interface Division {
  id: number
  name: string
}

const STAFF_ROLES = ["HallOffice", "JE", "AE", "EE", "Dean"]

export function CreateStaffForm({
  buildings,
  staff,
  divisions,
}: {
  buildings: Building[]
  staff: StaffMember[]
  divisions: Division[]
}) {
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState("JE")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const aeList = staff.filter((s) => s.role === "AE")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      formData.set("password", password)
      const result = await createStaff(formData)
      if (result.ok) {
        toast.success("Staff member added successfully.")
        form.reset()
        setPassword("")
        setConfirm("")
        setRole("JE")
      } else {
        toast.error(result.error || "Failed to add staff.")
      }
    } catch {
      toast.error("An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field name="name" label="Name" required />
      <Field name="email" label="IIT Goa Email" type="email" placeholder="name@iitgoa.ac.in" required />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      {role === "JE" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="aeId">Reports To (AE)</Label>
          <select
            id="aeId"
            name="aeId"
            defaultValue=""
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Select AE</option>
            {aeList.map((ae) => (
              <option key={ae.id} value={ae.id}>
                {ae.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {role !== "HallOffice" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subdivision">Division</Label>
          <select
            id="subdivision"
            name="subdivision"
            defaultValue=""
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Select Division</option>
            {divisions.map((div) => (
              <option key={div.id} value={div.name}>
                {div.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buildingId">Assigned Building</Label>
        <select
          id="buildingId"
          name="buildingId"
          defaultValue=""
          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Campus-wide / not assigned</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter password"
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="size-3.5 animate-spin mr-2" /> : null}
        Add Staff
      </Button>
    </form>
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
