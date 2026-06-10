import Link from "next/link"
import { getSession } from "@/lib/session"
import { isAdminRole } from "@/lib/constants"
import { RoleSwitcher } from "@/components/role-switcher"
import { Building2 } from "lucide-react"
import { NavLinks } from "@/components/nav-links"

export async function SiteHeader() {
  const session = await getSession()
  const admin = isAdminRole(session?.role)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">IWD Portal</span>
            <span className="text-[11px] text-muted-foreground">IIT Goa</span>
          </span>
        </Link>

        <NavLinks isAdmin={admin} />

        <div className="ml-auto flex items-center gap-2">
          <RoleSwitcher session={session} />
        </div>
      </div>
    </header>
  )
}
