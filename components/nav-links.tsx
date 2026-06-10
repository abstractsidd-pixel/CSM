"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const USER_LINKS = [
  { href: "/register", label: "Register" },
  { href: "/track", label: "Track" },
  { href: "/feedback", label: "Feedback" },
]

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/technicians", label: "Technicians" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
]

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const links = isAdmin ? ADMIN_LINKS : USER_LINKS

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map((l) => {
        const active =
          l.href === "/admin"
            ? pathname === "/admin"
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
