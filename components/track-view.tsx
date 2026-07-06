"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  StatusBadge,
  PriorityBadge,
  formatDate,
  slaStatus,
} from "@/components/shared-ui"
import { submitFeedback, reactivateComplaint, editComplaint } from "@/app/actions/complaints"
import { toast } from "sonner"
import { Search, Star, RotateCcw, MapPin, Clock, CalendarDays, MessageSquare, Pencil, X, Save } from "lucide-react"
import type { ComplaintRow, LogRow, BuildingRow, TechnicianRow } from "@/lib/queries"
import { CommentSection } from "@/components/admin/comment-section"

type FeedbackRow = { id: number; rating: number; comment: string | null } | null

export function TrackView({
  initialDocket,
  complaint,
  logs,
  feedback,
  comments,
  buildings,
  technicians,
  myComplaints,
  sessionEmail,
  sessionName,
  sessionRole,
}: {
  initialDocket: string
  complaint: ComplaintRow | null
  logs: LogRow[]
  feedback: FeedbackRow
  comments: { id: number; complaintId: number; message: string; authorEmail: string; authorName: string | null; authorRole: string; createdAt: Date }[]
  buildings: BuildingRow[]
  technicians: TechnicianRow[]
  myComplaints: ComplaintRow[]
  sessionEmail: string
  sessionName: string
  sessionRole: string
}) {
  const router = useRouter()
  const [docket, setDocket] = useState(initialDocket)
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(0)
  const [editing, setEditing] = useState(false)
  const [editPhotoPath, setEditPhotoPath] = useState<string | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const building = complaint ? buildings.find((b) => b.id === complaint.buildingId) : null
  const tech = complaint
    ? technicians.find((t) => t.id === complaint.assignedTechnicianId)
    : null

  function search() {
    if (!docket.trim()) return toast.error("Enter a docket number.")
    router.push(`/track?docket=${encodeURIComponent(docket.trim())}`)
  }

  function onFeedback(formData: FormData) {
    if (!rating) {
      toast.error("Please select a rating.")
      return
    }
    formData.set("rating", String(rating))
    formData.set("complaintId", String(complaint!.id))
    startTransition(async () => {
      await submitFeedback(formData)
      toast.success("Thank you for your feedback")
      router.refresh()
    })
  }

  function onReactivate() {
    const reason = prompt("Why are you reopening this complaint?")
    if (reason === null) return
    const fd = new FormData()
    fd.set("id", String(complaint!.id))
    fd.set("reason", reason || "Reopened by complainant.")
    startTransition(async () => {
      await reactivateComplaint(fd)
      toast.success("Complaint reactivated")
      router.refresh()
    })
  }

  function onEdit(formData: FormData) {
    formData.set("id", String(complaint!.id))
    if (editPhotoPath) formData.set("photoPath", editPhotoPath)
    startTransition(async () => {
      const res = await editComplaint(formData)
      if (!res || !res.ok) {
        toast.error(res?.error || "Failed to update complaint.")
        return
      }
      toast.success("Complaint updated.")
      setEditing(false)
      router.refresh()
    })
  }

  async function handleEditPhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB.")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("photo", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Upload failed.")
        return
      }
      setEditPhotoPath(data.path)
      setEditPhotoPreview(URL.createObjectURL(file))
      toast.success("Photo uploaded.")
    } catch {
      toast.error("Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const canFeedback = complaint?.status === "Resolved" && !feedback
  const canReactivate =
    complaint && ["Resolved", "Closed"].includes(complaint.status)
  const canEdit =
    complaint && ["Registered", "Reactivated"].includes(complaint.status)
  const sla = complaint ? slaStatus(complaint.dueAt, complaint.closedAt) : null

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-2">
            <Input
              value={docket}
              onChange={(e) => setDocket(e.target.value)}
              placeholder="e.g. IITGoa/CMS/AKB/ELC/2026/0001"
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <Button onClick={search}>
              <Search className="size-4" />
              Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {initialDocket && !complaint && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No complaint found for docket{" "}
            <span className="font-mono font-medium text-foreground">{initialDocket}</span>.
          </CardContent>
        </Card>
      )}

      {complaint && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="font-mono text-lg">{complaint.docketNumber}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {complaint.categoryLabel || "—"}
                  {complaint.otherText ? ` · ${complaint.otherText}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail icon={MapPin} label="Location">
                {building?.name}
                {complaint.floor ? `, Floor ${complaint.floor}` : ""}
                {complaint.room ? `, ${complaint.room}` : ""}
              </Detail>
              <Detail icon={Clock} label="Registered">
                {formatDate(complaint.createdAt)}
              </Detail>
              <Detail icon={Clock} label="SLA Due">
                {formatDate(complaint.dueAt)}
                {sla && (
                  <span className={`ml-2 text-xs font-medium ${sla.className}`}>
                    ({sla.label})
                  </span>
                )}
              </Detail>
              <Detail icon={MapPin} label="Assigned Technician">
                {tech ? `${tech.name} · ${tech.trade}` : "Not assigned yet"}
              </Detail>
            </CardContent>
          </Card>

          {canEdit && !editing && (
            <Button variant="outline" size="sm" className="self-start" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5 mr-1.5" />
              Edit Complaint
            </Button>
          )}

          {canEdit && editing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Pencil className="size-4 text-primary" />
                  Edit Complaint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form action={onEdit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Description</Label>
                    <Textarea name="description" defaultValue={complaint.description ?? ""} rows={3} placeholder="Describe the issue" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Floor</Label>
                      <Input name="floor" defaultValue={complaint.floor ?? ""} placeholder="e.g. 2" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Room</Label>
                      <Input name="room" defaultValue={complaint.room ?? ""} placeholder="e.g. 204" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Other Details</Label>
                    <Input name="otherText" defaultValue={complaint.otherText ?? ""} placeholder="Any extra info" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Slot 1 *</Label>
                      <Input type="datetime-local" name="preferredTime1" defaultValue={complaint.preferredTime1 ? new Date(complaint.preferredTime1).toISOString().slice(0, 16) : ""} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Slot 2</Label>
                      <Input type="datetime-local" name="preferredTime2" defaultValue={complaint.preferredTime2 ? new Date(complaint.preferredTime2).toISOString().slice(0, 16) : ""} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Slot 3</Label>
                      <Input type="datetime-local" name="preferredTime3" defaultValue={complaint.preferredTime3 ? new Date(complaint.preferredTime3).toISOString().slice(0, 16) : ""} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Photo</Label>
                    {complaint.photoPath && !editPhotoPreview && (
                      <div className="flex items-center gap-2">
                        <img src={complaint.photoPath} alt="Current" className="h-16 rounded border border-border object-cover" />
                        <span className="text-xs text-muted-foreground">Current photo</span>
                      </div>
                    )}
                    {editPhotoPreview && (
                      <div className="flex items-center gap-2">
                        <img src={editPhotoPreview} alt="New" className="h-16 rounded border border-border object-cover" />
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setEditPhotoPath(null); setEditPhotoPreview(null) }}>
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    )}
                    <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEditPhotoUpload} disabled={uploading} className="text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending || uploading}>
                      <Save className="size-3.5 mr-1.5" />
                      {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setEditing(false); setEditPhotoPath(null); setEditPhotoPreview(null) }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {complaint.description && !editing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="size-4 text-primary" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{complaint.description}</p>
              </CardContent>
            </Card>
          )}

          {(() => {
            const timeSlots = [
              { slot: 1, time: complaint.preferredTime1 },
              { slot: 2, time: complaint.preferredTime2 },
              { slot: 3, time: complaint.preferredTime3 },
            ].filter((s) => s.time != null)

            if (timeSlots.length === 0) return null

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="size-4 text-primary" />
                    Preferred Visit Times
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {timeSlots.map((s) => (
                      <div
                        key={s.slot}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${
                          complaint.selectedTimeSlot === s.slot
                            ? "border-primary bg-primary/5 font-medium"
                            : "border-border"
                        }`}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                          {s.slot}
                        </span>
                        <span>{formatDate(s.time)}</span>
                        {complaint.selectedTimeSlot === s.slot && (
                          <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                            Confirmed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative flex flex-col gap-5 border-l border-border pl-6">
                {logs.map((log) => (
                  <li key={log.id} className="relative">
                    <span className="absolute -left-[1.625rem] top-1 size-3 rounded-full border-2 border-background bg-primary" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{log.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    )}
                    {log.staffLabel && (
                      <p className="text-xs text-muted-foreground">— {log.staffLabel}</p>
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {feedback && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Feedback</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`size-5 ${
                        i <= feedback.rating
                          ? "fill-chart-3 text-chart-3"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>
                {feedback.comment && (
                  <p className="text-sm text-muted-foreground">{feedback.comment}</p>
                )}
              </CardContent>
            </Card>
          )}

          {(canFeedback || canReactivate) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {canFeedback ? "Rate the Resolution" : "Not satisfied?"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {canFeedback && (
                  <form action={onFeedback} className="flex flex-col gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(i)}
                          aria-label={`${i} star`}
                        >
                          <Star
                            className={`size-7 transition-colors ${
                              i <= rating
                                ? "fill-chart-3 text-chart-3"
                                : "text-muted-foreground/40 hover:text-chart-3/60"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Comments (optional)</Label>
                      <Textarea name="comment" rows={3} placeholder="How was the service?" />
                    </div>
                    <Button type="submit" disabled={isPending} className="self-start">
                      Submit Feedback
                    </Button>
                  </form>
                )}
                {canFeedback && canReactivate && <Separator />}
                {canReactivate && (
                  <Button
                    variant="outline"
                    onClick={onReactivate}
                    disabled={isPending}
                    className="self-start"
                  >
                    <RotateCcw className="size-4" />
                    Reopen Complaint
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <CommentSection
            complaintId={complaint.id}
            comments={comments}
            sessionEmail={sessionEmail}
            sessionName={sessionName}
            sessionRole={sessionRole}
          />
        </>
      )}

      {myComplaints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Recent Complaints</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {myComplaints.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/track?docket=${encodeURIComponent(c.docketNumber)}`)}
                className="flex items-center justify-between gap-3 py-2.5 text-left hover:opacity-80"
              >
                <div>
                  <span className="font-mono text-sm font-medium">{c.docketNumber}</span>
                  <p className="text-xs text-muted-foreground">{c.categoryLabel || "—"}</p>
                </div>
                <StatusBadge status={c.status} />
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="text-sm">{children}</span>
    </div>
  )
}
