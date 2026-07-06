import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getComplaintById,
  getLogsForComplaint,
  getBuildings,
  getTechnicians,
  getFeedbackForComplaint,
  getStaff,
  getCategories,
  getCommentsForComplaint,
} from "@/lib/queries"
import { getSession } from "@/lib/session"
import { StatusBadge, PriorityBadge, formatDate, slaStatus } from "@/components/shared-ui"
import { ArrowLeft, MapPin, User, Mail, Clock, Image as ImageIcon } from "lucide-react"
import { ComplaintActions } from "@/components/admin/complaint-actions"
import { CommentSection } from "@/components/admin/comment-section"
import { Star } from "lucide-react"

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const complaint = await getComplaintById(Number(id))
  if (!complaint) notFound()

  const session = await getSession()
  const [logs, buildings, technicians, feedback, allStaff, categories, comments] = await Promise.all([
    getLogsForComplaint(complaint.id),
    getBuildings(),
    getTechnicians(),
    getFeedbackForComplaint(complaint.id),
    getStaff(),
    getCategories(),
    getCommentsForComplaint(complaint.id),
  ])

  if (session?.role === "JE" && session.staffId) {
    const jeStaff = allStaff.find((s) => s.id === session.staffId)
    const division = jeStaff?.subdivision?.trim()
    if (!division) notFound()

    const divisionCategoryIds = categories
      .filter((c) => c.level === 1 && c.name === division)
      .map((c) => c.id)

    if (!complaint.categoryId || !divisionCategoryIds.includes(complaint.categoryId)) {
      notFound()
    }
  }

  const building = buildings.find((b) => b.id === complaint.buildingId)
  const tech = technicians.find((t) => t.id === complaint.assignedTechnicianId)
  const sla = slaStatus(complaint.dueAt, complaint.closedAt)

  const timeSlots = [
    { slot: 1, time: complaint.preferredTime1 },
    { slot: 2, time: complaint.preferredTime2 },
    { slot: 3, time: complaint.preferredTime3 },
  ].filter((s) => s.time != null)

  const isUser = session?.role === "User"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm">
          <Link href={isUser ? "/student" : "/admin/complaints"}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">{complaint.docketNumber}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {complaint.categoryLabel || "—"}
                {complaint.otherText ? ` · ${complaint.otherText}` : ""}
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail icon={MapPin} label="Location">
                {building?.name}
                {complaint.floor ? `, Floor ${complaint.floor}` : ""}
                {complaint.room ? `, ${complaint.room}` : ""}
              </Detail>
              <Detail icon={User} label="Complainant">
                {complaint.complainantName || "—"}
              </Detail>
              <Detail icon={Mail} label="Email">
                {complaint.complainantEmail}
              </Detail>
              <Detail icon={Clock} label="Registered">
                {formatDate(complaint.createdAt)}
              </Detail>
              <Detail icon={Clock} label="SLA Due">
                {formatDate(complaint.dueAt)}{" "}
                <span className={`text-xs font-medium ${sla.className}`}>({sla.label})</span>
              </Detail>
              {complaint.photoPath && (
                <Detail icon={ImageIcon} label="Photo">
                  <a
                    href={complaint.photoPath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    View attachment
                  </a>
                </Detail>
              )}
              {complaint.photoUrl && !complaint.photoPath && (
                <Detail icon={ImageIcon} label="Photo">
                  <a
                    href={complaint.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    View attachment
                  </a>
                </Detail>
              )}
            </CardContent>
          </Card>

          {complaint.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{complaint.description}</p>
              </CardContent>
            </Card>
          )}

          {complaint.photoPath && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={complaint.photoPath}
                  alt="Complaint photo"
                  className="max-h-80 rounded-lg border border-border object-contain"
                />
              </CardContent>
            </Card>
          )}

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
              </ol>
            </CardContent>
          </Card>

          {feedback && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Complainant Feedback</CardTitle>
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

          <CommentSection
            complaintId={complaint.id}
            comments={comments}
            sessionEmail={session?.email || ""}
            sessionName={session?.name || ""}
            sessionRole={session?.role || "User"}
          />
        </div>

        <div className="flex flex-col gap-6">
          <ComplaintActions
            complaint={complaint}
            technicians={technicians}
            staffLabel={`${session?.name} (${session?.role})`}
            currentTech={tech ? `${tech.name} · ${tech.trade}` : null}
            categories={categories}
            sessionRole={session?.role}
            timeSlots={timeSlots}
          />
        </div>
      </div>
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
