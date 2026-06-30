import { getPendingComplaints } from "@/app/actions/hall-office"
import { getBuildings } from "@/lib/queries"
import { HallOfficeDashboard } from "@/components/hall-office/hall-office-dashboard"

export default async function HallOfficePage() {
  const [complaints, buildings] = await Promise.all([
    getPendingComplaints(),
    getBuildings(),
  ])

  return (
    <HallOfficeDashboard complaints={complaints} buildings={buildings} />
  )
}
