import type { Role } from "@/lib/constants"

export type Session = {
  role: Role
  email: string
  name: string
  userId?: number
  staffId?: number
  subdivision?: string | null
}
