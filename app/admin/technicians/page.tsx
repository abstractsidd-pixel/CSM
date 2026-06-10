import { getTechnicians } from "@/lib/queries"
import { TechniciansManager } from "@/components/admin/technicians-manager"

export const dynamic = "force-dynamic"

export default async function TechniciansPage() {
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
