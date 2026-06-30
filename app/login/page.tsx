"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { credentialLogin } from "@/app/actions/auth"
import { Building2, Loader2, LogIn, GraduationCap, Wrench, UserCog, ClipboardCheck } from "lucide-react"
import { toast } from "sonner"
import type { Role } from "@/lib/constants"
import { cn } from "@/lib/utils"

const ROLE_OPTIONS: { role: Role; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { role: "User", label: "Student / Faculty", desc: "Register & track complaints", icon: GraduationCap },
  { role: "HallOffice", label: "Hall Office", desc: "Verify & approve complaints", icon: ClipboardCheck },
  { role: "JE", label: "Junior Engineer", desc: "Manage assigned building", icon: Wrench },
  { role: "AE", label: "Assistant Engineer", desc: "Supervise complaints", icon: UserCog },
  { role: "EE", label: "Executive Engineer", desc: "Reports & technicians", icon: UserCog },
  { role: "Dean", label: "Dean (IWD)", desc: "Full admin access", icon: UserCog },
]

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRole) return
    startTransition(async () => {
      const result = await credentialLogin(email, password, selectedRole)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Logged in successfully")
      router.push(result.redirectTo!)
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="size-5" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-base font-semibold tracking-tight">IWD Portal</span>
          <span className="text-xs text-muted-foreground">IIT Goa</span>
        </span>
      </Link>

      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LogIn className="size-6" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Select your role and enter your credentials
            </p>
          </div>

          {!selectedRole ? (
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.role}
                    onClick={() => setSelectedRole(opt.role)}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/60"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                  {ROLE_OPTIONS.find((o) => o.role === selectedRole)?.label}
                </span>
                <button
                  onClick={() => { setSelectedRole(null); setEmail(""); setPassword("") }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Change
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@iitgoa.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        IWD Complaint Management System · IIT Goa
      </p>
    </div>
  )
}
