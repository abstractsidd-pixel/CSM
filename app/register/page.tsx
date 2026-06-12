import { SiteHeader } from "@/components/site-header"
import { RegisterForm } from "@/components/register-form"
import { getBuildings, getCategories, getSlaRules } from "@/lib/queries"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function RegisterPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const [buildings, categories, sla] = await Promise.all([
    getBuildings(),
    getCategories(),
    getSlaRules(),
  ])

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Register a Complaint</h1>
          <p className="text-sm text-muted-foreground">
            Provide the location and issue details. You will receive a docket number to track
            progress.
          </p>
        </div>
        <RegisterForm
          buildings={buildings}
          categories={categories}
          sla={sla}
          defaultName={session?.role === "User" ? session.name : ""}
          defaultEmail={session?.role === "User" ? session.email : ""}
        />
      </main>
    </div>
  )
}
