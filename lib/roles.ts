import type { Role } from "@/lib/constants"

// ponytail: hardcoded role mapping, edit this when users change
const ROLE_MAP: Record<string, Role> = {
  "abstract.sidd@gmail.com": "Dean",
}

const ALLOWED_DOMAIN = "@iitgoa.ac.in"

export function isAllowedEmail(email: string): boolean {
  return email.endsWith(ALLOWED_DOMAIN) || email in ROLE_MAP
}

export function getRoleForEmail(email: string): Role | null {
  return ROLE_MAP[email] ?? null
}

export function getAllowedEmails(): string[] {
  return Object.keys(ROLE_MAP)
}
