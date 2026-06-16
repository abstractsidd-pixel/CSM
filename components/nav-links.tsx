"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const USER_LINKS = [
  { href: "/student", label: "Dashboard" },
  { href: "/register", label: "Register" },
  { href: "/track", label: "Track" },
  { href: "/feedback", label: "Feedback" },
]

const JE_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/track", label: "Track" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/register", label: "Register" },
]

const AE_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/track", label: "Track" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/register", label: "Register" },
]

const EE_DEAN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/track", label: "Track" },
  { href: "/admin/technicians", label: "Technicians" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
  { href: "/register", label: "Register" },
]

const ROLE_LINKS: Record<string, typeof USER_LINKS> = {
  User: USER_LINKS,
  JE: JE_LINKS,
  AE: AE_LINKS,
  EE: EE_DEAN_LINKS,
  Dean: EE_DEAN_LINKS,
}

export function NavLinks({ isAdmin, role }: { isAdmin: boolean; role?: string }) {
  const pathname = usePathname()
  const links = role ? (ROLE_LINKS[role] ?? (isAdmin ? JE_LINKS : USER_LINKS)) : (isAdmin ? JE_LINKS : USER_LINKS)

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map((l) => {
        const active =
          l.href === "/admin" || l.href === "/student"
            ? pathname === l.href
            : pathname === l.href || pathname.startsWith(l.href + "/")
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            )}
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
