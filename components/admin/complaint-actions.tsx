"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { assignComplaint, updateStatus } from "@/app/actions/complaints"
import { toast } from "sonner"
import { Wrench, RefreshCw } from "lucide-react"
import type { ComplaintRow, TechnicianRow } from "@/lib/queries"

const NEXT_STATUSES: Record<string, string[]> = {
  Registered: ["In Progress", "Resolved"],
  Assigned: ["In Progress", "Resolved"],
  "In Progress": ["Resolved"],
  Reactivated: ["In Progress", "Resolved"],
  Resolved: ["Closed", "In Progress"],
  Closed: [],
}

export function ComplaintActions({
  complaint,
  technicians,
  staffLabel,
  currentTech,
}: {
  complaint: ComplaintRow
  technicians: TechnicianRow[]
  staffLabel: string
  currentTech: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [technicianId, setTechnicianId] = useState(
    complaint.assignedTechnicianId ? String(complaint.assignedTechnicianId) : "",
  )
  const [status, setStatus] = useState("")

  const activeTechs = technicians.filter((t) => t.status === "Active")
  const nextStatuses = NEXT_STATUSES[complaint.status] ?? []

  function onAssign(formData: FormData) {
    if (!technicianId) {
      toast.error("Select a technician.")
      return
    }
    const tech = technicians.find((t) => String(t.id) === technicianId)
    formData.set("id", String(complaint.id))
    formData.set("technicianId", technicianId)
    formData.set("technicianName", tech?.name ?? "")
    formData.set("technicianTrade", tech?.trade ?? "")
    formData.set("staffLabel", staffLabel)
    startTransition(() => {
      void (async () => {
        const res = await assignComplaint(formData)
        if (!res || !res.ok) return toast.error("Failed to assign technician")
        toast.success("Technician assigned")
        router.refresh()
      })()
    })
  }

  function onUpdate(formData: FormData) {
    if (!status) {
      toast.error("Select a new status.")
      return
    }
    formData.set("id", String(complaint.id))
    formData.set("status", status)
    formData.set("staffLabel", staffLabel)
    startTransition(() => {
      void (async () => {
        const res = await updateStatus(formData)
        if (!res || !res.ok) return toast.error("Failed to update status")
        toast.success(`Marked as ${status}`)
        setStatus("")
        router.refresh()
      })()
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="size-4 text-primary" />
            Assign Technician
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentTech && (
            <p className="mb-3 rounded-md bg-secondary px-3 py-2 text-sm">
              Currently: <span className="font-medium">{currentTech}</span>
            </p>
          )}
          <form action={onAssign} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Technician</Label>
              <Select
                value={technicianId}
                onValueChange={(value) => setTechnicianId(value ?? "")}
                items={activeTechs.map((t) => ({ value: String(t.id), label: `${t.name} · ${t.trade}` }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {activeTechs.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} · {t.trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Expected start date</Label>
              <Input type="date" name="expectedStart" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Remarks</Label>
              <Textarea name="assignRemarks" rows={2} placeholder="Instructions for technician" />
            </div>
            <Button type="submit" disabled={isPending}>
              {complaint.assignedTechnicianId ? "Reassign" : "Assign"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="size-4 text-primary" />
            Update Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This complaint is closed. No further status changes are available.
            </p>
          ) : (
            <form action={onUpdate} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">New status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value ?? "")}
                  items={nextStatuses.map((s) => ({ value: s, label: s }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {nextStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Note</Label>
                <Textarea name="note" rows={2} placeholder="Add a note for the timeline" />
              </div>
              <Button type="submit" disabled={isPending}>
                Update
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  )
}
