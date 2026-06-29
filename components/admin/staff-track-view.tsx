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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  StatusBadge,
  PriorityBadge,
  formatDate,
  slaStatus,
} from "@/components/shared-ui"
import { submitFeedback, reactivateComplaint } from "@/app/actions/complaints"
import { Search, Star, RotateCcw, MapPin, Clock, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import type { ComplaintRow, LogRow, BuildingRow, TechnicianRow } from "@/lib/queries"

type FeedbackRow = { id: number; rating: number; comment: string | null } | null

export function StaffTrackView({
  initialDocket,
  complaint,
  logs,
  feedback,
  buildings,
  technicians,
  allComplaints,
  sessionRole,
}: {
  initialDocket: string
  complaint: ComplaintRow | null
  logs: LogRow[]
  feedback: FeedbackRow
  buildings: BuildingRow[]
  technicians: TechnicianRow[]
  allComplaints: ComplaintRow[]
  sessionRole: string
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
    router.push(`/admin/track?docket=${encodeURIComponent(docket.trim())}`)
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

  const buildingName = (id: number) => buildings.find((b) => b.id === id)?.name ?? "-"

  if (complaint) {
    const sla = slaStatus(complaint.dueAt, complaint.closedAt)

    return (
      <div className="flex flex-col gap-6">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/track")}>
            <ArrowLeft className="size-4" />
            Back to list
          </Button>
        </div>

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
              {buildingName(complaint.buildingId)}
              {complaint.floor ? `, Floor ${complaint.floor}` : ""}
              {complaint.room ? `, ${complaint.room}` : ""}
            </Detail>
            <Detail icon={Clock} label="Registered">
              {formatDate(complaint.createdAt)}
            </Detail>
            <Detail icon={Clock} label="SLA Due">
              {formatDate(complaint.dueAt)}
              <span className={`ml-2 text-xs font-medium ${sla.className}`}>
                ({sla.label})
              </span>
            </Detail>
            <Detail icon={MapPin} label="Assigned Technician">
              {tech ? `${tech.name} · ${tech.trade}` : "Not assigned yet"}
            </Detail>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
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
              {logs.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
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
      </div>
    )
  }

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
            <span className="font-mono font-medium text-foreground">{initialDocket}</span>.{" "}
            You may not have permission to view this complaint.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            My Registered Complaints
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({allComplaints.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Docket</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allComplaints.map((c) => {
                const sla = slaStatus(c.dueAt, c.closedAt)
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {c.docketNumber}
                    </TableCell>
                    <TableCell>{buildingName(c.buildingId)}</TableCell>
                    <TableCell>{c.categoryLabel || "—"}</TableCell>
                    <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/track?docket=${encodeURIComponent(c.docketNumber)}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {allComplaints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No complaints found.
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
