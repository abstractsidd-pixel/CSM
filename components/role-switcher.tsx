"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
import { loginAction, logoutAction } from "@/app/actions/auth"
import type { Role } from "@/lib/constants"
import { ChevronDown, LogOut, UserCog } from "lucide-react"
import type { Session } from "@/lib/session"
import { toast } from "sonner"

const DEMO_ACCOUNTS: { role: Role; email: string; name: string; desc: string }[] = [
  { role: "User", email: "student@iitgoa.ac.in", name: "Ananya Sharma", desc: "Student / Faculty" },
  { role: "JE", email: "je.civil@iitgoa.ac.in", name: "Rajesh Kumar", desc: "Junior Engineer" },
  { role: "AE", email: "ae@iitgoa.ac.in", name: "Amit Desai", desc: "Assistant Engineer" },
  { role: "EE", email: "ee@iitgoa.ac.in", name: "Dr. Pradeep Rao", desc: "Executive Engineer" },
  { role: "Dean", email: "dean.iwd@iitgoa.ac.in", name: "Prof. Meera Iyer", desc: "Dean (IWD)" },
]

export function RoleSwitcher({ session }: { session: Session | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function login(role: Role, email: string, name: string) {
    startTransition(async () => {
      await loginAction(role, email, name)
      toast.success(`Signed in as ${name} (${role})`)
      router.refresh()
      setOpen(false)
    })
  }

  function logout() {
    startTransition(async () => {
      await logoutAction()
    })
  }

  if (!session) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger>
          <span
            data-slot="button"
            role="button"
            tabIndex={0}
            aria-disabled={isPending}
            className={cn(buttonVariants({ variant: "secondary", size: "sm", className: "gap-1.5" }))}
          >
            <UserCog className="size-4" />
            Demo Login
            <ChevronDown className="size-3.5 opacity-70" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Sign in as (demo)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DEMO_ACCOUNTS.map((a) => (
            <DropdownMenuItem
              key={a.role}
              onClick={() => login(a.role, a.email, a.name)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span className="text-sm font-medium">{a.name}</span>
              <span className="text-xs text-muted-foreground">{a.desc}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const initials = session.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")

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
          <ChevronDown className="size-3.5 opacity-70" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col">
          <span>{session.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{session.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch demo role
        </DropdownMenuLabel>
        {DEMO_ACCOUNTS.map((a) => (
          <DropdownMenuItem
            key={a.role}
            onClick={() => login(a.role, a.email, a.name)}
            className="text-sm"
          >
            {a.desc}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
