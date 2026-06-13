"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"

const COOLDOWN_MS = 10000

export function LogDownload() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [cooldown, setCooldown] = useState(false)
  const [message, setMessage] = useState("")

  const handleDownload = useCallback(() => {
    if (cooldown) return

    const params = new URLSearchParams()
    if (from) params.set("from", from)
    if (to) params.set("to", to)

    const url = `/api/logs${params.toString() ? `?${params.toString()}` : ""}`

    const a = document.createElement("a")
    a.href = url
    a.download = ""
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    setCooldown(true)
    setMessage("Please wait 10 seconds before downloading again.")

    let remaining = 10
    const interval = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearInterval(interval)
        setCooldown(false)
        setMessage("")
      } else {
        setMessage(`Please wait ${remaining} seconds before downloading again.`)
      }
    }, 1000)
  }, [from, to, cooldown])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="log-from" className="text-xs">From</Label>
          <Input
            id="log-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 w-[150px] text-xs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="log-to" className="text-xs">To</Label>
          <Input
            id="log-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 w-[150px] text-xs"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          disabled={cooldown}
        >
          <Download className="size-3.5" />
          {cooldown ? "Downloading..." : "Download Log"}
        </Button>
      </div>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
