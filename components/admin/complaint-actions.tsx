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
import { assignComplaint, updateStatus, reassignCategory } from "@/app/actions/complaints"
import { toast } from "sonner"
import { Wrench, RefreshCw, ArrowRightLeft, CalendarDays, Check } from "lucide-react"
import type { ComplaintRow, TechnicianRow, CategoryRow } from "@/lib/queries"
import { formatDate } from "@/components/shared-ui"

const NEXT_STATUSES: Record<string, string[]> = {
  "Pending Review": [],
  Rejected: [],
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
  categories,
  sessionRole,
  timeSlots,
}: {
  complaint: ComplaintRow
  technicians: TechnicianRow[]
  staffLabel: string
  currentTech: string | null
  categories: CategoryRow[]
  sessionRole?: string
  timeSlots: { slot: number; time: Date | string | null }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [technicianId, setTechnicianId] = useState(
    complaint.assignedTechnicianId ? String(complaint.assignedTechnicianId) : "",
  )
  const [status, setStatus] = useState("")
  const [newCategoryId, setNewCategoryId] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<number>(complaint.selectedTimeSlot ?? 0)

  const activeTechs = technicians.filter((t) => t.status === "Active")
  const nextStatuses = NEXT_STATUSES[complaint.status] ?? []
  const isJE = sessionRole === "JE"

  const level1Categories = categories.filter((c) => c.level === 1)

  function onAssign(formData: FormData) {
    if (!technicianId) {
      toast.error("Select a technician.")
      return
    }
    if (!selectedSlot) {
      toast.error("Please select a visit time slot.")
      return
    }
    const tech = technicians.find((t) => String(t.id) === technicianId)
    formData.set("id", String(complaint.id))
    formData.set("technicianId", technicianId)
    formData.set("technicianName", tech?.name ?? "")
    formData.set("technicianTrade", tech?.trade ?? "")
    formData.set("staffLabel", staffLabel)
    formData.set("selectedTimeSlot", String(selectedSlot))
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

  function onReassignCategory() {
    if (!newCategoryId) {
      toast.error("Select a category.")
      return
    }
    const formData = new FormData()
    formData.set("id", String(complaint.id))
    formData.set("categoryId", newCategoryId)
    startTransition(() => {
      void (async () => {
        const res = await reassignCategory(formData)
        if (!res || !res.ok) return toast.error(res?.error || "Failed to reassign category")
        toast.success("Category reassigned successfully")
        setNewCategoryId("")
        router.refresh()
      })()
    })
  }

  return (
    <>
      {isJE && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="size-4 text-primary" />
              Reassign Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Move this complaint to a different category if it was classified incorrectly.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">New Category</Label>
                <Select
                  value={newCategoryId}
                  onValueChange={(value) => setNewCategoryId(value ?? "")}
                  items={level1Categories.map((c) => ({ value: String(c.id), label: c.name }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {level1Categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={onReassignCategory} disabled={isPending || !newCategoryId}>
                Reassign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Label className="text-sm">Expected Start Date & Time</Label>
              <Input type="datetime-local" name="expectedStart" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Remarks</Label>
              <Textarea name="assignRemarks" rows={2} placeholder="Instructions for technician" />
            </div>
            {timeSlots.length > 0 && !complaint.assignedTechnicianId && (
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <CalendarDays className="size-3.5" />
                  Visit Time Slot *
                </Label>
                <div className="flex flex-col gap-2">
                  {timeSlots.map((s) => {
                    return (
                      <button
                        key={s.slot}
                        type="button"
                        onClick={() => setSelectedSlot(s.slot)}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          selectedSlot === s.slot
                            ? "border-primary bg-primary/5 font-medium"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                          {s.slot}
                        </span>
                        <span className="flex-1 text-left">{formatDate(s.time)}</span>
                        {selectedSlot === s.slot && (
                          <Check className="size-4 text-primary" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
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
