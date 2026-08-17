"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const USER_LINKS = [
  { href: "/student", label: "Dashboard" },
  { href: "/register", label: "Register" },
  { href: "/track", label: "Track" },
  { href: "/notifications", label: "Notifications" },
  { href: "/feedback", label: "Feedback" },
]

const JE_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/notifications", label: "Notifications" },
]

const AE_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/notifications", label: "Notifications" },
]

const EE_DEAN_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/technicians", label: "Technicians" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
  { href: "/notifications", label: "Notifications" },
]

const HALL_OFFICE_LINKS = [
  { href: "/hall-office", label: "Review Queue" },
  { href: "/notifications", label: "Notifications" },
]

const ROLE_LINKS: Record<string, typeof USER_LINKS> = {
  User: USER_LINKS,
  HallOffice: HALL_OFFICE_LINKS,
  JE: JE_LINKS,
  AE: AE_LINKS,
  EE: EE_DEAN_LINKS,
  Dean: EE_DEAN_LINKS,
}

export function NavLinks({ isAdmin, role }: { isAdmin: boolean; role?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const links = role ? (ROLE_LINKS[role] ?? (isAdmin ? JE_LINKS : USER_LINKS)) : (isAdmin ? JE_LINKS : USER_LINKS)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  function isActive(href: string) {
    if (href === "/admin" || href === "/student" || href === "/hall-office") {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-1 md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive(l.href)
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Mobile */}
      <div className="relative md:hidden" ref={ref}>
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(!open)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">Menu</span>
        </Button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-popover p-2 shadow-lg">
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(l.href)
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  )
}
