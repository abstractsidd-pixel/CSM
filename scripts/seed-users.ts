import "dotenv/config"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
})

const ACCOUNTS = [
  { email: "suryavanshi.siddharth.23033@iitgoa.ac.in", name: "Siddharth Suryavanshi", role: "User" },
  { email: "je@iitgoa.ac.in", name: "Rajesh Kumar", role: "JE" },
  { email: "ae@iitgoa.ac.in", name: "Amit Desai", role: "AE" },
  { email: "ee@iitgoa.ac.in", name: "Dr. Pradeep Rao", role: "EE" },
  { email: "dean@iitgoa.ac.in", name: "Prof. Meera Iyer", role: "Dean" },
]

const PASSWORD = "Sidd@04092005"

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'User',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `)
  console.log("✓ users table created/verified")

  const passwordHash = await bcrypt.hash(PASSWORD, 12)

  for (const account of ACCOUNTS) {
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = $3, role = $4`,
      [account.email, passwordHash, account.name, account.role]
    )
    console.log(`✓ ${account.role} account: ${account.email}`)
  }

  console.log(`\nAll accounts use password: ${PASSWORD}`)
  await pool.end()
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
