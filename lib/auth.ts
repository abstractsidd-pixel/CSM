import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { getRoleForEmail, isAllowedEmail } from "@/lib/roles"
import { db } from "@/lib/db"
import { staff, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { Role } from "@/lib/constants"

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      const email = user.email
      if (!email) return false
      if (!isAllowedEmail(email)) return false

      // Auto-create user in DB on first Google sign-in (non-staff only)
      const staffRow = await db.select().from(staff).where(eq(staff.email, email)).limit(1)
      if (!staffRow[0]) {
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!existing[0]) {
          await db.insert(users).values({
            name: user.name || "",
            email,
            passwordHash: "google-oauth",
            role: "User",
          })
        }
      }

      return true
    },
    async jwt({ token, user }: any) {
      const email = user?.email ?? token.email
      if (email) {
        token.email = email
        let role = getRoleForEmail(email)
        const staffRow = await db.select().from(staff).where(eq(staff.email, email)).limit(1)
        if (staffRow[0]) {
          role = staffRow[0].role as Role
        } else if (!role) {
          const userRow = await db.select().from(users).where(eq(users.email, email)).limit(1)
          if (userRow[0]) role = userRow[0].role as Role
        }
        token.role = role ?? null
      }
      return token
    },
    async session({ session, token }: any) {
      session.user.role = token.role ?? null
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
}
