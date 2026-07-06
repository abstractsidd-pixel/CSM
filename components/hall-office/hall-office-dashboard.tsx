"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { StatusBadge, PriorityBadge, formatDate } from "@/components/shared-ui"
import { approveComplaint, rejectComplaint } from "@/app/actions/hall-office"
import { toast } from "sonner"
import {
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  Mail,
  Clock,
  MessageSquare,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react"
import type { ComplaintRow, BuildingRow } from "@/lib/queries"

export function HallOfficeDashboard({
  complaints,
  buildings,
}: {
  complaints: ComplaintRow[]
  buildings: BuildingRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [reviewing, setReviewing] = useState<ComplaintRow | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const buildingName = (id: number) => buildings.find((b) => b.id === id)?.name ?? "—"

  function onApprove(id: number) {
    const fd = new FormData()
    fd.set("id", String(id))
    startTransition(async () => {
      const res = await approveComplaint(fd)
      if (!res || !res.ok) {
        toast.error(res?.error || "Failed to approve.")
        return
      }
      toast.success("Complaint approved and registered.")
      setReviewing(null)
      router.refresh()
    })
  }

  function onReject(id: number) {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason.")
      return
    }
    const fd = new FormData()
    fd.set("id", String(id))
    fd.set("reason", rejectReason.trim())
    startTransition(async () => {
      const res = await rejectComplaint(fd)
      if (!res || !res.ok) {
        toast.error(res?.error || "Failed to reject.")
        return
      }
      toast.success("Complaint rejected.")
      setReviewing(null)
      setRejectReason("")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hall Office</h1>
        <p className="text-sm text-muted-foreground">
          Review and verify incoming complaints before they are registered.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <span className="flex size-10 items-center justify-center rounded-lg bg-chart-1/15 text-chart-1">
              <ClipboardCheck className="size-5" />
            </span>
            <div>
              <span className="text-2xl font-bold">{complaints.length}</span>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complaints Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No complaints pending review.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Docket</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Complainant</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {c.docketNumber}
                      </TableCell>
                      <TableCell className="text-sm">{buildingName(c.buildingId)}</TableCell>
                      <TableCell className="text-sm">{c.categoryLabel || "—"}</TableCell>
                      <TableCell>
                        <PriorityBadge priority={c.priority} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.complainantName || c.complainantEmail}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setReviewing(c)}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!reviewing} onOpenChange={(open) => { if (!open) { setReviewing(null); setRejectReason("") } }}>
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
          {reviewing && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono">{reviewing.docketNumber}</DialogTitle>
                <DialogDescription>
                  {reviewing.categoryLabel || "—"}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span className="break-words">{buildingName(reviewing.buildingId)}{reviewing.floor ? `, Floor ${reviewing.floor}` : ""}{reviewing.room ? `, ${reviewing.room}` : ""}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span className="break-words">{reviewing.complainantName || "—"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span className="break-all">{reviewing.complainantEmail}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span>{formatDate(reviewing.createdAt)}</span>
                  </div>
                </div>

                {reviewing.description && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm whitespace-pre-wrap break-words rounded-md bg-secondary px-3 py-2">{reviewing.description}</p>
                  </div>
                )}

                {reviewing.photoPath && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">Photo</Label>
                    <img src={reviewing.photoPath} alt="Complaint" className="max-h-96 w-full rounded-lg border border-border object-contain" />
                  </div>
                )}

                {(() => {
                  const timeSlots = [
                    { slot: 1, time: reviewing.preferredTime1 },
                    { slot: 2, time: reviewing.preferredTime2 },
                    { slot: 3, time: reviewing.preferredTime3 },
                  ].filter((s) => s.time != null)
                  if (timeSlots.length === 0) return null
                  return (
                    <div className="flex flex-col gap-1.5">
                      <Label className="flex items-center gap-1.5 text-sm font-medium">
                        <CalendarDays className="size-3.5" />
                        Preferred Times
                      </Label>
                      <div className="flex flex-col gap-1">
                        {timeSlots.map((s) => (
                          <span key={s.slot} className="text-sm">
                            Slot {s.slot}: {formatDate(s.time)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                  <Button onClick={() => onApprove(reviewing.id)} disabled={isPending} className="bg-chart-4 hover:bg-chart-4/90 shrink-0">
                    <CheckCircle2 className="size-4 mr-1.5" />
                    Approve & Register
                  </Button>
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason..."
                      className="flex-1 min-w-0"
                    />
                    <Button variant="destructive" onClick={() => onReject(reviewing.id)} disabled={isPending || !rejectReason.trim()} className="shrink-0">
                      <XCircle className="size-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
