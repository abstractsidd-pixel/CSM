"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react"
import { createUsersBulk } from "@/app/actions/admin"
import { toast } from "sonner"

interface ParsedRow {
  name: string
  email: string
  password: string
}

export function ExcelImport() {
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setPreview([])

    try {
      const XLSX = await import("xlsx")
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

      const rows: ParsedRow[] = json
        .map((row) => {
          const name = row["Name"] || row["name"] || ""
          const email = row["Email"] || row["email"] || ""
          const password = row["Password"] || row["password"] || ""
          return { name: name.trim(), email: email.trim(), password: password.trim() }
        })
        .filter((r) => r.name && r.email && r.password)

      setPreview(rows)
    } catch {
      toast.error("Failed to parse Excel file. Please check the format.")
    }
  }

  const handleImport = async () => {
    if (preview.length === 0) return
    setImporting(true)
    try {
      const result = await createUsersBulk(preview)
      if ("count" in result && result.count && result.count > 0) {
        toast.success(`Successfully imported ${result.count} user(s).`)
        setPreview([])
        setFileName(null)
        if (fileRef.current) fileRef.current.value = ""
      } else {
        toast.error("Import failed.")
      }
    } catch {
      toast.error("An error occurred during import.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import from Excel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Upload an Excel file (.xlsx) with columns: <strong>Name</strong>, <strong>Email</strong>, <strong>Password</strong>. All imported accounts will be assigned the Student/Faculty role.
        </p>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
            id="excel-upload"
          />
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => fileRef.current?.click()}
          >
            <FileSpreadsheet className="size-3.5" />
            Choose File
          </Button>
          {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
        </div>

        {preview.length > 0 && (
          <>
            <div className="rounded-md border overflow-auto max-h-48">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-2 py-1 text-left font-medium">Name</th>
                    <th className="px-2 py-1 text-left font-medium">Email</th>
                    <th className="px-2 py-1 text-left font-medium">Password</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-2 py-1">{row.name}</td>
                      <td className="px-2 py-1">{row.email}</td>
                      <td className="px-2 py-1 text-muted-foreground">********</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <p className="text-xs text-muted-foreground px-2 py-1">
                  ...and {preview.length - 10} more rows
                </p>
              )}
            </div>
            <Button onClick={handleImport} disabled={importing} size="sm">
              {importing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              Import {preview.length} User{preview.length !== 1 ? "s" : ""}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
