"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { Button } from "@/components/ui/button"
import { StatusBadge, PriorityBadge, formatDate, slaStatus } from "@/components/shared-ui"
import { STATUSES, PRIORITIES } from "@/lib/constants"
import { Search } from "lucide-react"
import type { ComplaintRow, BuildingRow, TechnicianRow } from "@/lib/queries"

export function ComplaintsTable({
  complaints,
  buildings,
  technicians,
}: {
  complaints: ComplaintRow[]
  buildings: BuildingRow[]
  technicians: TechnicianRow[]
}) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const [priority, setPriority] = useState("all")
  const [building, setBuilding] = useState("all")

  const buildingName = (id: number) => buildings.find((b) => b.id === id)?.name ?? "—"
  const techName = (id: number | null) =>
    id ? technicians.find((t) => t.id === id)?.name ?? "—" : "Unassigned"

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (status !== "all" && c.status !== status) return false
      if (priority !== "all" && c.priority !== priority) return false
      if (building !== "all" && String(c.buildingId) !== building) return false
      if (q) {
        const hay = `${c.docketNumber} ${c.categoryLabel ?? ""} ${c.complainantEmail} ${
          c.complainantName ?? ""
        }`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
  }, [complaints, status, priority, building, q])

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search docket, email..."
              className="pl-9"
            />
          </div>
          <FilterSelect value={status} onChange={setStatus} placeholder="All statuses" options={STATUSES} />
          <FilterSelect value={priority} onChange={setPriority} placeholder="All priorities" options={PRIORITIES} />
          <Select
            value={building}
            onValueChange={(v) => setBuilding(v ?? "all")}
            items={[
              { value: "all", label: "All buildings" },
              ...buildings.map((b) => ({ value: String(b.id), label: b.name })),
            ]}
          >
            <SelectTrigger>
              <SelectValue placeholder="All buildings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buildings</SelectItem>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Docket</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const sla = slaStatus(c.dueAt, c.closedAt)
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {c.docketNumber}
                      <div className="text-[11px] font-sans text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{buildingName(c.buildingId)}</TableCell>
                    <TableCell className="text-sm">{c.categoryLabel || "—"}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={c.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-sm">{techName(c.assignedTechnicianId)}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${sla.className}`}>{sla.label}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/complaints/${c.id}`}>
                        <Button size="sm" variant="outline">
                          Open
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No complaints match the filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {complaints.length} complaints.
        </p>
      </CardContent>
    </Card>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: readonly string[]
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v ?? "all")}
      items={[
        { value: "all", label: placeholder },
        ...options.map((o) => ({ value: o, label: o })),
      ]}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
