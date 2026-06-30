"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { registerComplaint } from "@/app/actions/complaints"
import { PRIORITIES } from "@/lib/constants"
import { toast } from "sonner"
import { CheckCircle2, Copy, Upload, X } from "lucide-react"
import type { BuildingRow, CategoryRow } from "@/lib/queries"

type Sla = { priority: string; hours: number; label: string }

export function RegisterForm({
  buildings,
  categories,
  sla,
  defaultName,
  defaultEmail,
}: {
  buildings: BuildingRow[]
  categories: CategoryRow[]
  sla: Sla[]
  defaultName: string
  defaultEmail: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [docket, setDocket] = useState<string | null>(null)

  const [buildingId, setBuildingId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null)
  const [priority, setPriority] = useState<string | null>("Minor")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const parents = useMemo(() => categories.filter((c) => c.level === 1), [categories])
  const subs = useMemo(
    () => categories.filter((c) => c.level === 2 && String(c.parentId) === categoryId),
    [categories, categoryId],
  )
  const isOther = categoryId === "other"

  const slaLabel = sla.find((s) => s.priority === priority)?.label

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB.")
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("photo", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Upload failed.")
        return
      }
      setPhotoPath(data.path)
      setPhotoPreview(URL.createObjectURL(file))
      toast.success("Photo uploaded.")
    } catch {
      toast.error("Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  function removePhoto() {
    setPhotoPath(null)
    setPhotoPreview(null)
  }

  function onSubmit(formData: FormData) {
    if (!buildingId) {
      toast.error("Please select a building.")
      return
    }
    formData.set("buildingId", buildingId)
    formData.set("priority", priority ?? "Minor")
    if (photoPath) formData.set("photoPath", photoPath)

    if (!isOther) {
      formData.set("categoryId", categoryId ?? "")
      formData.set("subcategoryId", subcategoryId ?? "")
      const cat = categories.find((c) => String(c.id) === categoryId)
      const sub = categories.find((c) => String(c.id) === subcategoryId)
      formData.set(
        "categoryLabel",
        [cat?.name, sub?.name].filter(Boolean).join(" › "),
      )
    } else {
      formData.set("categoryLabel", "Other")
    }

    startTransition(async () => {
      const res = await registerComplaint(formData)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      if (res?.docket) {
        setDocket(res.docket)
        toast.success("Complaint registered")
      }
    })
  }

  if (docket) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-chart-4/15 text-chart-4">
            <CheckCircle2 className="size-7" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Complaint Registered</h2>
            <p className="text-sm text-muted-foreground">
              Save your docket number to track the status.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5">
            <span className="font-mono text-lg font-semibold">{docket}</span>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={() => {
                navigator.clipboard.writeText(docket)
                toast.success("Docket copied")
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/track?docket=${docket}`)}>Track now</Button>
            <Button variant="outline" onClick={() => setDocket(null)}>
              Register another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-6">
        <form action={onSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Building" required>
              <Select
                value={buildingId}
                onValueChange={setBuildingId}
                items={buildings.map((b) => ({ value: String(b.id), label: `${b.name} (${b.code})` }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select building"/>
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name} ({b.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Floor">
                <Input name="floor" placeholder="e.g. 2" />
              </Field>
              <Field label="Room / Area">
                <Input name="room" placeholder="e.g. 204" />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category" required>
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v)
                  setSubcategoryId("")
                }}
                items={[
                  ...parents.map((c) => ({ value: String(c.id), label: c.name })),
                  { value: "other", label: "Other" },
                ]}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {parents.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {!isOther && subs.length > 0 && (
              <Field label="Sub-category">
                <Select
                  value={subcategoryId}
                  onValueChange={setSubcategoryId}
                  items={subs.map((c) => ({ value: String(c.id), label: c.name }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    {subs.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <Field label="Description" required>
            <Textarea name="description" placeholder="Describe the issue you are facing in detail" rows={3} required />
          </Field>

          {isOther && (
            <Field label="Other details" required>
              <Textarea name="otherText" placeholder="Additional details" rows={2} />
            </Field>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Priority">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {slaLabel && (
                <p className="mt-1 text-xs text-muted-foreground">Target resolution: {slaLabel}</p>
              )}
            </Field>
          </div>

          <div className="flex flex-col gap-3">
            <Label className="text-sm">Preferred Visit Times <span className="text-destructive">*</span></Label>
            <p className="text-xs text-muted-foreground">Provide up to 3 time slots. At least one is required.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TimeSlotField index={1} />
              <TimeSlotField index={2} />
              <TimeSlotField index={3} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Photo (optional)</Label>
            {photoPreview ? (
              <div className="relative inline-block w-fit">
                <img src={photoPreview} alt="Preview" className="h-32 rounded-lg border border-border object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 size-6"
                  onClick={removePhoto}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-secondary/50">
                <Upload className="size-4" />
                {uploading ? "Uploading..." : "Click to upload photo (JPEG/PNG, max 5MB)"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Your name">
              <Input name="complainantName" defaultValue={defaultName} placeholder="Full name" />
            </Field>
            <Field label="Email" required>
              <Input
                name="complainantEmail"
                type="email"
                defaultValue={defaultEmail}
                placeholder="you@iitgoa.ac.in"
                required
              />
            </Field>
          </div>

          <Button type="submit" disabled={isPending} size="lg">
            {isPending ? "Submitting..." : "Submit Complaint"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function TimeSlotField({ index }: { index: number }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
      <Label className="text-xs font-medium">Slot {index}</Label>
      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] text-muted-foreground">Date & Time</Label>
        <Input type="datetime-local" name={`preferredTime${index}`} className="h-8 text-xs" />
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  )
}
