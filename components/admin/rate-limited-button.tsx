"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"

const COOLDOWN_MS = 10000

interface RateLimitedButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link"
  className?: string
}

export function RateLimitedButton({
  children,
  onClick,
  disabled = false,
  variant = "outline",
  className,
}: RateLimitedButtonProps) {
  const [cooldown, setCooldown] = useState(false)
  const [message, setMessage] = useState("")

  const handleClick = useCallback(() => {
    if (cooldown || disabled) return

    onClick?.()

    setCooldown(true)
    setMessage("Please wait 10 seconds before clicking again.")

    let remaining = 10
    const interval = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearInterval(interval)
        setCooldown(false)
        setMessage("")
      } else {
        setMessage(`Please wait ${remaining}s`)
      }
    }, 1000)
  }, [cooldown, disabled, onClick])

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant}
        onClick={handleClick}
        disabled={disabled || cooldown}
        className={className}
      >
        {children}
      </Button>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
