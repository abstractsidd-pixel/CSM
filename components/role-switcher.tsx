"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { logoutAction } from "@/app/actions/auth"
import { LogIn, LogOut, User } from "lucide-react"
import type { Session } from "@/lib/session"

export function RoleSwitcher({ session }: { session: Session | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function logout() {
    startTransition(async () => {
      await logoutAction()
    })
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}
      >
        <LogIn className="size-4" />
        Sign In
      </Link>
    )
  }

  const initials = session.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")

  const dashboardHref = session.role === "User" ? "/student" : "/admin"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span
          data-slot="button"
          role="button"
          tabIndex={0}
          className={cn(buttonVariants({ variant: "ghost", size: "sm", className: "gap-2 pl-1.5" }))}
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-medium">{session.name}</span>
            <span className="text-[11px] text-muted-foreground">{session.role}</span>
          </span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>{session.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{session.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(dashboardHref)} className="flex items-center gap-2 text-sm">
          <User className="size-4" />
          My Dashboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
