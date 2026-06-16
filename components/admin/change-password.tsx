"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Loader2 } from "lucide-react"
import { changeOwnPassword } from "@/app/actions/admin"
import { toast } from "sonner"

export function ChangePasswordForm({ userId }: { userId: number }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error("Current password is required.")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.")
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.set("userId", String(userId))
      formData.set("currentPassword", currentPassword)
      formData.set("password", password)
      const result = await changeOwnPassword(formData)
      if (result.ok) {
        toast.success("Password updated successfully.")
        setCurrentPassword("")
        setPassword("")
        setConfirm("")
      } else {
        toast.error(result.error || "Failed to update password.")
      }
    } catch {
      toast.error("An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="size-4 text-primary" />
          Change Your Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="size-3.5 animate-spin mr-2" /> : null}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
