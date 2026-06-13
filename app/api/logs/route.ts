import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { getActivityLog } from "@/lib/audit-log"
import { checkRateLimit } from "@/lib/rate-limit"

const DOWNLOAD_LIMIT = 5
const DOWNLOAD_WINDOW_MS = 60 * 1000

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.role || (session.role !== "EE" && session.role !== "Dean")) {
    return NextResponse.json({ error: "Access denied. EE and Dean only." }, { status: 403 })
  }

  const key = `dl:${session.email}`
  const { allowed, retryAfterMs } = checkRateLimit(key, DOWNLOAD_LIMIT, DOWNLOAD_WINDOW_MS)
  if (!allowed) {
    const seconds = Math.ceil(retryAfterMs / 1000)
    return NextResponse.json(
      { error: `Too many download requests. Please wait ${seconds} seconds.` },
      { status: 429 },
    )
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get("from") || undefined
  const to = searchParams.get("to") || undefined

  const logContent = await getActivityLog(from, to)

  const dateSuffix = from || to ? `-${from || "start"}-to-${to || "now"}` : `-${new Date().toISOString().slice(0, 10)}`

  return new NextResponse(logContent, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="activity-log${dateSuffix}.txt"`,
    },
  })
}
