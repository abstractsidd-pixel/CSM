import nodemailer from "nodemailer"

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

const TEMPLATES: Record<string, { subject: string; body: string }> = {
  NEW_COMPLAINT: {
    subject: "New Complaint Registered - {{docketNumber}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a56db">New Complaint Registered</h2>
<p>Dear Staff,</p>
<p>A new complaint has been registered with the following details:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Docket Number</td><td style="padding:8px;border:1px solid #ddd">{{docketNumber}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Priority</td><td style="padding:8px;border:1px solid #ddd">{{priority}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Building</td><td style="padding:8px;border:1px solid #ddd">{{buildingName}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Complainant</td><td style="padding:8px;border:1px solid #ddd">{{complainantName}}</td></tr>
</table>
<p>{{description}}</p>
<p>Please take necessary action.</p>
<p style="color:#666;font-size:12px">IWD Complaint Management System - IIT Goa</p>
</div>`,
  },
  COMPLAINT_APPROVED: {
    subject: "Complaint Approved - {{docketNumber}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#16a34a">Complaint Approved</h2>
<p>Dear {{complainantName}},</p>
<p>Your complaint has been approved by Hall Office.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Docket Number</td><td style="padding:8px;border:1px solid #ddd">{{docketNumber}}</td></tr>
</table>
<p>You can now track your complaint using the docket number above.</p>
<p style="color:#666;font-size:12px">IWD Complaint Management System - IIT Goa</p>
</div>`,
  },
  COMPLAINT_REJECTED: {
    subject: "Complaint Rejected - {{docketNumber}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#dc2626">Complaint Rejected</h2>
<p>Dear {{complainantName}},</p>
<p>Your complaint has been reviewed and rejected by Hall Office.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Docket Number</td><td style="padding:8px;border:1px solid #ddd">{{docketNumber}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Reason</td><td style="padding:8px;border:1px solid #ddd">{{reason}}</td></tr>
</table>
<p>If you believe this is an error, please contact the Hall Office.</p>
<p style="color:#666;font-size:12px">IWD Complaint Management System - IIT Goa</p>
</div>`,
  },
  COMPLAINT_ASSIGNED: {
    subject: "Technician Assigned - {{docketNumber}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a56db">Technician Assigned</h2>
<p>Dear {{complainantName}},</p>
<p>A technician has been assigned to your complaint.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Docket Number</td><td style="padding:8px;border:1px solid #ddd">{{docketNumber}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Technician</td><td style="padding:8px;border:1px solid #ddd">{{technicianName}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Expected Start</td><td style="padding:8px;border:1px solid #ddd">{{expectedStart}}</td></tr>
</table>
<p><strong>Remarks:</strong> {{assignRemarks}}</p>
<p style="color:#666;font-size:12px">IWD Complaint Management System - IIT Goa</p>
</div>`,
  },
  STATUS_CHANGED: {
    subject: "Complaint Status Updated - {{docketNumber}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a56db">Status Updated</h2>
<p>Dear {{complainantName}},</p>
<p>The status of your complaint has been updated.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Docket Number</td><td style="padding:8px;border:1px solid #ddd">{{docketNumber}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">New Status</td><td style="padding:8px;border:1px solid #ddd">{{status}}</td></tr>
</table>
<p><strong>Note:</strong> {{note}}</p>
<p style="color:#666;font-size:12px">IWD Complaint Management System - IIT Goa</p>
</div>`,
  },
  NEW_COMMENT: {
    subject: "New Comment on Complaint - {{docketNumber}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a56db">New Comment</h2>
<p>Dear User,</p>
<p><strong>{{authorName}}</strong> commented on complaint <strong>{{docketNumber}}</strong>:</p>
<div style="background:#f3f4f6;padding:12px;border-radius:6px;margin:16px 0;border-left:4px solid #1a56db">
<p style="margin:0">{{comment}}</p>
</div>
<p style="color:#666;font-size:12px">IWD Complaint Management System - IIT Goa</p>
</div>`,
  },
  COMPLAINT_REACTIVATED: {
    subject: "Complaint Reactivated - {{docketNumber}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#d97706">Complaint Reactivated</h2>
<p>Dear Staff,</p>
<p>A complaint has been reactivated by the complainant.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Docket Number</td><td style="padding:8px;border:1px solid #ddd">{{docketNumber}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Complainant</td><td style="padding:8px;border:1px solid #ddd">{{complainantName}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Reason</td><td style="padding:8px;border:1px solid #ddd">{{reason}}</td></tr>
</table>
<p>Please review and take action.</p>
<p style="color:#666;font-size:12px">IWD Complaint Management System - IIT Goa</p>
</div>`,
  },
  COMPLAINT_EDITED: {
    subject: "Complaint Updated - {{docketNumber}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#1a56db">Complaint Updated</h2>
<p>Dear Staff,</p>
<p>Complaint <strong>{{docketNumber}}</strong> has been updated by the complainant ({{complainantName}}).</p>
<p>Please review the changes.</p>
<p style="color:#666;font-size:12px">IWD Complaint Management System - IIT Goa</p>
</div>`,
  },
  SLA_BREACH: {
    subject: "SLA Breach Alert - {{docketNumber}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#dc2626">SLA Breach Alert</h2>
<p>Dear Staff,</p>
<p>A complaint has breached its SLA deadline.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Docket Number</td><td style="padding:8px;border:1px solid #ddd">{{docketNumber}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Priority</td><td style="padding:8px;border:1px solid #ddd">{{priority}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Hours Overdue</td><td style="padding:8px;border:1px solid #ddd">{{hoursOverdue}} hours</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Current Status</td><td style="padding:8px;border:1px solid #ddd">{{status}}</td></tr>
</table>
<p>Please take immediate action to resolve this complaint.</p>
<p style="color:#666;font-size:12px">IWD Complaint Management System - IIT Goa</p>
</div>`,
  },
  SLA_BREACH_ESCALATED: {
    subject: "SLA Breach Escalated - {{docketNumber}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h2 style="color:#dc2626">SLA Breach Escalated</h2>
<p>Dear EE/Dean,</p>
<p>A complaint has breached its SLA deadline and requires immediate attention.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Docket Number</td><td style="padding:8px;border:1px solid #ddd">{{docketNumber}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Priority</td><td style="padding:8px;border:1px solid #ddd">{{priority}}</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Hours Overdue</td><td style="padding:8px;border:1px solid #ddd">{{hoursOverdue}} hours</td></tr>
<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Current Status</td><td style="padding:8px;border:1px solid #ddd">{{status}}</td></tr>
</table>
<p>This complaint has been overdue for more than 24 hours. Please intervene immediately.</p>
<p style="color:#666;font-size:12px">IWD Complaint Management System - IIT Goa</p>
</div>`,
  },
}

export async function sendEmail(
  event: string,
  to: string,
  vars: Record<string, string>,
) {
  if (!process.env.SMTP_USER) return

  const tmpl = TEMPLATES[event]
  if (!tmpl) return

  try {
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
