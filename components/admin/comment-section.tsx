"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send } from "lucide-react"
import { addComment } from "@/app/actions/complaints"
import { toast } from "sonner"
import { formatDate } from "@/components/shared-ui"

interface Comment {
  id: number
  complaintId: number
  message: string
  authorEmail: string
  authorName: string | null
  authorRole: string
  createdAt: Date
}

export function CommentSection({
  complaintId,
  comments,
  sessionEmail,
  sessionName,
  sessionRole,
}: {
  complaintId: number
  comments: Comment[]
  sessionEmail: string
  sessionName: string
  sessionRole: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState("")

  function handleSubmit() {
    if (!message.trim()) {
      toast.error("Please enter a message.")
      return
    }
    const formData = new FormData()
    formData.set("complaintId", String(complaintId))
    formData.set("message", message.trim())
    startTransition(async () => {
      const res = await addComment(formData)
      if (!res || !res.ok) {
        toast.error(res?.error || "Failed to post comment.")
        return
      }
      setMessage("")
      toast.success("Comment posted.")
      router.refresh()
    })
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      User: "bg-secondary text-secondary-foreground",
      JE: "bg-chart-2/15 text-chart-2",
      AE: "bg-chart-1/15 text-chart-1",
      EE: "bg-primary/15 text-primary",
      Dean: "bg-destructive/15 text-destructive",
    }
    return (
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors[role] || "bg-secondary text-secondary-foreground"}`}>
        {role}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4 text-primary" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet. Start the conversation below.</p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className={`flex flex-col gap-1 rounded-lg border p-3 ${
              c.authorEmail === sessionEmail ? "border-primary/30 bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{c.authorName || c.authorEmail}</span>
              {roleBadge(c.authorRole)}
              <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{c.message}</p>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message to JE/complainant..."
            rows={2}
          />
          <Button onClick={handleSubmit} disabled={isPending || !message.trim()} size="sm">
            <Send className="size-3.5 mr-1.5" />
            {isPending ? "Sending..." : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
