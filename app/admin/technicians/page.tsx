import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getTechnicians } from "@/lib/queries"
import { TechniciansManager } from "@/components/admin/technicians-manager"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function TechniciansPage() {
  const session = await getSession()

  if (session?.role !== "EE" && session?.role !== "Dean") {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="text-xl font-semibold">Access Restricted</h1>
        <p className="text-sm text-muted-foreground">
          Technician management is available to EE and Dean only.
        </p>
        <Button variant="outline">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const technicians = await getTechnicians()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Technicians</h1>
        <p className="text-sm text-muted-foreground">
          Manage the field workforce available for complaint assignment.
        </p>
      </div>
      <TechniciansManager technicians={technicians} />
    </div>
  )
}
