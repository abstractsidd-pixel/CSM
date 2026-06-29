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
import { submitFeedback, reactivateComplaint } from "@/app/actions/complaints"
import { toast } from "sonner"
import { Search, Star, RotateCcw, MapPin, Clock } from "lucide-react"
import type { ComplaintRow, LogRow, BuildingRow, TechnicianRow } from "@/lib/queries"

type FeedbackRow = { id: number; rating: number; comment: string | null } | null

export function TrackView({
  initialDocket,
  complaint,
  logs,
  feedback,
  buildings,
  technicians,
  myComplaints,
}: {
  initialDocket: string
  complaint: ComplaintRow | null
  logs: LogRow[]
  feedback: FeedbackRow
  buildings: BuildingRow[]
  technicians: TechnicianRow[]
  myComplaints: ComplaintRow[]
}) {
  const router = useRouter()
  const [docket, setDocket] = useState(initialDocket)
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(0)

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

  const canFeedback = complaint?.status === "Resolved" && !feedback
  const canReactivate =
    complaint && ["Resolved", "Closed"].includes(complaint.status)
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
