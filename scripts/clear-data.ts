import { db } from "../lib/db"
import {
  users,
  complaints,
  complaintLogs,
  complaintComments,
  feedback,
  surveys,
  notifications,
} from "../lib/db/schema"

// ponytail: clears user-generated data, keeps reference data (buildings, categories, etc.)
async function main() {
  console.log("Clearing data...")

  await db.delete(notifications)
  console.log("  Cleared notifications")

  await db.delete(feedback)
  console.log("  Cleared feedback")

  await db.delete(surveys)
  console.log("  Cleared surveys")

  await db.delete(complaintComments)
  console.log("  Cleared complaint_comments")

  await db.delete(complaintLogs)
  console.log("  Cleared complaint_logs")

  await db.delete(complaints)
  console.log("  Cleared complaints")

  await db.delete(users)
  console.log("  Cleared users")

  console.log("\nDone. Buildings, categories, technicians, SLA rules, and notification templates are preserved.")
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
