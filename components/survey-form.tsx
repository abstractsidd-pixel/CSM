"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitSurvey } from "@/app/actions/complaints"
import { toast } from "sonner"
import { Star, CheckCircle2 } from "lucide-react"

export function SurveyForm({ defaultEmail }: { defaultEmail: string }) {
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(0)
  const [done, setDone] = useState(false)

  function onSubmit(formData: FormData) {
    if (!rating) {
      toast.error("Please select a rating.")
      return
    }
    formData.set("rating", String(rating))
    startTransition(async () => {
      const res = await submitSurvey(formData)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setDone(true)
      toast.success("Thank you for your feedback")
    })
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-chart-4/15 text-chart-4">
            <CheckCircle2 className="size-7" />
          </span>
          <h2 className="text-lg font-semibold">Feedback Submitted</h2>
          <p className="text-sm text-muted-foreground">
            We appreciate you helping us improve campus services.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-6">
        <form action={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Overall satisfaction</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} star`}>
                  <Star
                    className={`size-9 transition-colors ${
                      i <= rating
                        ? "fill-chart-3 text-chart-3"
                        : "text-muted-foreground/40 hover:text-chart-3/60"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Comments</Label>
            <Textarea name="comment" rows={4} placeholder="Tell us about your experience..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Email (optional)</Label>
            <Input name="respondentEmail" type="email" defaultValue={defaultEmail} />
          </div>
          <Button type="submit" disabled={isPending} className="self-start">
            {isPending ? "Submitting..." : "Submit Feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
