import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { getSession } from "@/lib/session"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
const MAX_UPLOADS_PER_MINUTE = 10

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const ip = await getClientIp()
    const { allowed } = checkRateLimit(`upload:${ip}`, MAX_UPLOADS_PER_MINUTE, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: "Too many uploads. Please wait." }, { status: 429 })
    }

    const formData = await request.formData()
    const file = formData.get("photo") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed." }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size must be under 5MB." }, { status: 400 })
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    const ext = MIME_TO_EXT[file.type] || "jpg"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    return NextResponse.json({ path: `/uploads/${filename}` })
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 })
  }
}
