import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ponytail: native Intl APIs replace date-fns (28M dependency)
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

export function formatDistanceToNow(d: Date | string, _options?: { addSuffix?: boolean }): string {
  const date = typeof d === "string" ? new Date(d) : d
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  if (diffSec < 60) return rtf.format(-diffSec, "second")
  if (diffMin < 60) return rtf.format(-diffMin, "minute")
  if (diffHr < 24) return rtf.format(-diffHr, "hour")
  return rtf.format(-diffDay, "day")
}
