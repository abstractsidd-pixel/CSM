import { SiteHeader } from "@/components/site-header"
import { SurveyForm } from "@/components/survey-form"
import { getSession } from "@/lib/session"

export default async function FeedbackPage() {
  const session = await getSession()
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Service Feedback</h1>
          <p className="text-sm text-muted-foreground">
            Share your overall experience with the Institute Works Department. To rate a specific
            complaint, use the Track page.
          </p>
        </div>
        <SurveyForm defaultEmail={session?.email ?? ""} />
      </main>
    </div>
  )
}
