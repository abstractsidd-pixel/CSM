import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { SiteHeader } from "@/components/site-header"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function HallOfficeLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (session?.role !== "HallOffice") {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-7" />
          </span>
          <h1 className="text-xl font-semibold">Hall Office Access Only</h1>
          <p className="text-sm text-muted-foreground">
            This area is restricted to Hall Office staff.
          </p>
          <div className="flex gap-2">
            <Button>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
