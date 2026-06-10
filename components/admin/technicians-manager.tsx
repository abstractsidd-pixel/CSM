"use client"

import { useMemo, useState, useTransition } from "react"
import { createTechnician, toggleTechnician, updateTechnician } from "@/app/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TechnicianRow } from "@/lib/queries"
import { cn } from "@/lib/utils"
import { CheckCircle2, Edit3, Plus, Search, Upload, UserX } from "lucide-react"
import { toast } from "sonner"

const DEFAULT_TRADES = ["Civil", "Electrical", "Plumbing", "Housekeeping", "IT"]
const STATUSES = ["Active", "Inactive"]

export function TechniciansManager({ technicians }: { technicians: TechnicianRow[] }) {
  const [query, setQuery] = useState("")
  const [trade, setTrade] = useState("all")
  const [status, setStatus] = useState("all")
  const [editing, setEditing] = useState<TechnicianRow | null>(null)
  const [showForm, setShowForm] = useState(technicians.length === 0)
  const [isPending, startTransition] = useTransition()

  const trades = useMemo(() => {
    const available = technicians.map((t) => t.trade).filter(Boolean)
    return Array.from(new Set([...DEFAULT_TRADES, ...available])).sort()
  }, [technicians])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return technicians.filter((tech) => {
      if (trade !== "all" && tech.trade !== trade) return false
      if (status !== "all" && tech.status !== status) return false
      if (!needle) return true

      return [tech.name, tech.trade, tech.contact, tech.area, tech.status]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle))
    })
  }, [technicians, query, trade, status])

  const activeCount = technicians.filter((t) => t.status === "Active").length
  const inactiveCount = technicians.length - activeCount

  function openCreate() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(technician: TechnicianRow) {
    setEditing(technician)
    setShowForm(true)
  }

  function closeForm() {
    setEditing(null)
    setShowForm(false)
  }

  function saveTechnician(formData: FormData) {
    if (editing) formData.set("id", String(editing.id))

    startTransition(() => {
      void (async () => {
        const action = editing ? updateTechnician : createTechnician
        const res = await action(formData)

        if (!res || !("ok" in res)) {
          toast.error(editing ? "Could not update technician" : "Could not add technician")
          return
        }

        toast.success(editing ? "Technician updated" : "Technician added")
        closeForm()
      })()
    })
  }

  function setTechnicianStatus(technician: TechnicianRow) {
    const nextStatus = technician.status === "Active" ? "Inactive" : "Active"

    startTransition(() => {
      void (async () => {
        await toggleTechnician(technician.id, nextStatus)
        toast.success(`${technician.name} marked ${nextStatus.toLowerCase()}`)
      })()
    })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total Technicians" value={technicians.length} />
          <SummaryCard label="Active" value={activeCount} tone="success" />
          <SummaryCard label="Inactive" value={inactiveCount} tone="muted" />
        </div>

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base">Technician Master List</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This list feeds the technician dropdown in complaint assignment.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled title="Excel import will be wired in the next pass">
                  <Upload className="size-4" />
                  Import Excel
                </Button>
                <Button onClick={openCreate}>
                  <Plus className="size-4" />
                  Add Technician
                </Button>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_160px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, trade, contact, area..."
                  className="pl-9"
                />
              </div>
              <Select value={trade} onValueChange={(value) => setTrade(value ?? "all")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All trades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All trades</SelectItem>
                  {trades.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Area of Operation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((technician) => (
                  <TableRow key={technician.id}>
                    <TableCell className="font-medium">{technician.name}</TableCell>
                    <TableCell>{technician.trade}</TableCell>
                    <TableCell>{technician.contact || "-"}</TableCell>
                    <TableCell>{technician.area || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={technician.status === "Active" ? "secondary" : "outline"}>
                        {technician.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(technician)}
                        >
                          <Edit3 className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant={technician.status === "Active" ? "destructive" : "secondary"}
                          size="sm"
                          disabled={isPending}
                          onClick={() => setTechnicianStatus(technician)}
                        >
                          {technician.status === "Active" ? (
                            <UserX className="size-3.5" />
                          ) : (
                            <CheckCircle2 className="size-3.5" />
                          )}
                          {technician.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No technicians match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing {filtered.length} of {technicians.length} technicians.
            </p>
          </CardContent>
        </Card>
      </div>

      <TechnicianForm
        key={editing?.id ?? "new"}
        open={showForm}
        editing={editing}
        trades={trades}
        pending={isPending}
        onClose={closeForm}
        onSave={saveTechnician}
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number
  tone?: "default" | "success" | "muted"
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold",
            tone === "success" && "text-chart-4",
            tone === "muted" && "text-muted-foreground"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function TechnicianForm({
  open,
  editing,
  trades,
  pending,
  onClose,
  onSave,
}: {
  open: boolean
  editing: TechnicianRow | null
  trades: string[]
  pending: boolean
  onClose: () => void
  onSave: (formData: FormData) => void
}) {
  if (!open) {
    return (
      <Card className="hidden xl:block">
        <CardContent className="flex min-h-48 flex-col justify-center py-6 text-sm text-muted-foreground">
          Select a technician to edit, or add a new maintenance staff profile.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-base">
          {editing ? "Edit Technician" : "Add Technician"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Keep names, trades, contact numbers, and operating areas current for assignment.
        </p>
      </CardHeader>
      <CardContent>
        <form action={onSave} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trade">Trade</Label>
            <Select name="trade" defaultValue={editing?.trade ?? trades[0] ?? "Civil"}>
              <SelectTrigger id="trade" className="w-full">
                <SelectValue placeholder="Select trade" />
              </SelectTrigger>
              <SelectContent>
                {trades.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contact">Contact Number</Label>
            <Input
              id="contact"
              name="contact"
              defaultValue={editing?.contact ?? ""}
              placeholder="+91 ..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="area">Area of Operation</Label>
            <Input
              id="area"
              name="area"
              defaultValue={editing?.area ?? ""}
              placeholder="Hostel, Academic Block, Campus-wide..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={editing?.status ?? "Active"}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 flex gap-2">
            <Button type="submit" disabled={pending}>
              {editing ? "Save Changes" : "Add Technician"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
