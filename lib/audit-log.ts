import fs from "fs/promises"
import path from "path"

const LOG_DIR = path.join(process.cwd(), "logs")
const LOG_FILE = path.join(LOG_DIR, "activity.log")

export interface AuditEntry {
  timestamp: string
  user: string
  role: string
  action: string
  details: string
}

async function ensureLogDir() {
  try {
    await fs.access(LOG_DIR)
  } catch {
    await fs.mkdir(LOG_DIR, { recursive: true })
  }
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

export async function logActivity(
  user: string,
  role: string,
  action: string,
  details: string = "",
) {
  try {
    await ensureLogDir()

    const entry: AuditEntry = {
      timestamp: formatTimestamp(),
      user,
      role,
      action,
      details,
    }

    const line = `[${entry.timestamp}] [${entry.role}] ${entry.user} | ${entry.action} | ${entry.details}\n`

    await fs.appendFile(LOG_FILE, line, "utf-8")
  } catch {
    // Silently fail on read-only filesystems (e.g. Vercel serverless)
  }
}

export async function getActivityLog(from?: string, to?: string): Promise<string> {
  try {
    const content = await fs.readFile(LOG_FILE, "utf-8")
    if (!from && !to) return content

    const fromDate = from ? new Date(`${from}T00:00:00Z`) : null
    const toDate = to ? new Date(`${to}T23:59:59Z`) : null

    const lines = content.split("\n").filter((line) => {
      if (!line.trim()) return false
      const match = line.match(/^\[([^\]]+)\]/)
      if (!match) return false
      const ts = new Date(match[1])
      if (fromDate && ts < fromDate) return false
      if (toDate && ts > toDate) return false
      return true
    })

    return lines.join("\n") + (lines.length > 0 ? "\n" : "")
  } catch {
    return ""
  }
}
