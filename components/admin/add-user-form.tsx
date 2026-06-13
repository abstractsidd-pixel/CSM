"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createUser } from "@/app/actions/admin"
import { toast } from "sonner"

export function AddUserForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await createUser(formData)
      if (result && "error" in result) {
        toast.error(result.error || "Failed to create user.")
      } else {
        toast.success("User created successfully.")
        router.refresh()
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <Field name="name" label="Full Name" placeholder="Siddharth Suryavanshi" required />
      <Field name="email" label="Email" type="email" placeholder="user@iitgoa.ac.in" required />
      <Field name="password" label="Password" type="password" placeholder="Set a password" required />
      <input type="hidden" name="role" value="User" />
      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Account"}
      </Button>
    </form>
  )
}

function Field({
  label,
  name,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  name: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  )
}
