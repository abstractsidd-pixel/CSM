import nodemailer from "nodemailer"
import { db } from "@/lib/db"
import { notificationTemplates } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function render(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value ?? "")
  }
  return result
}

export async function sendEmail(
  event: string,
  to: string,
  vars: Record<string, string>,
) {
  if (!process.env.SMTP_USER) return

  try {
    const rows = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.event, event))
      .limit(1)

    const tmpl = rows[0]
    if (!tmpl || !tmpl.subject) return
    if (tmpl.channel !== "Email" && tmpl.channel !== "Email+SMS") return

    const subject = render(tmpl.subject, vars)
    const body = render(tmpl.body, vars)

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: body,
    })
  } catch (e) {
    console.error(`[email] failed to send ${event} to ${to}:`, e)
  }
}
