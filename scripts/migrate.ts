import "dotenv/config"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  const client = await pool.connect()
  try {
    console.log("Adding is_hostel column...")
    await client.query(`ALTER TABLE buildings ADD COLUMN IF NOT EXISTS is_hostel boolean NOT NULL DEFAULT false`)

    console.log("Marking hostel buildings...")
    await client.query(`UPDATE buildings SET is_hostel = true WHERE code IN ('BH-1', 'BH-2', 'B2', 'B3', 'GH-1', 'GH-2')`)

    const res = await client.query(`SELECT id, name, code, is_hostel FROM buildings ORDER BY id`)
    console.log("\nBuildings:")
    for (const r of res.rows) {
      console.log(`  ${r.code} - ${r.name} (hostel: ${r.is_hostel})`)
    }
    console.log("\nDone!")
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
