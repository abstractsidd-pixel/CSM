import {
  createBuilding,
  createCategory,
  createStaff,
  deleteBuilding,
  deleteCategory,
  updateSla,
  updateTemplate,
} from "@/app/actions/admin"
import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROLES, TRADES } from "@/lib/constants"
import {
  getBuildings,
  getCategories,
  getNotificationTemplates,
  getSlaRules,
  getStaff,
} from "@/lib/queries"
import { Bell, Building2, Clock, Layers3, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react"
import { getSession } from "@/lib/session"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const session = await getSession()

  if (session?.role !== "EE" && session?.role !== "Dean") {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="text-xl font-semibold">Access Restricted</h1>
        <p className="text-sm text-muted-foreground">
          System settings are available to EE and Dean only.
        </p>
        <Button variant="outline">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const [buildings, categories, staff, slaRules, templates] = await Promise.all([
    getBuildings(),
    getCategories(),
    getStaff(),
    getSlaRules(),
    getNotificationTemplates(),
  ])

  const staffName = (id: number | null) => staff.find((s) => s.id === id)?.name ?? "-"
  const categoryName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? "-"
  const createBuildingAction = async (formData: FormData) => {
    "use server"
    await createBuilding(formData)
  }
  const createCategoryAction = async (formData: FormData) => {
    "use server"
    await createCategory(formData)
  }
  const createStaffAction = async (formData: FormData) => {
    "use server"
    await createStaff(formData)
  }
  const updateSlaAction = async (formData: FormData) => {
    "use server"
    await updateSla(formData)
  }
  const updateTemplateAction = async (formData: FormData) => {
    "use server"
    await updateTemplate(formData)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure CMS master data, SLA limits, staff access, and notification content.
        </p>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" />
              Buildings Master
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Floors</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>JE Assigned</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buildings.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell className="font-medium">{building.name}</TableCell>
                    <TableCell className="font-mono text-xs">{building.code}</TableCell>
                    <TableCell>{building.floors}</TableCell>
                    <TableCell>{building.area || "-"}</TableCell>
                    <TableCell>{staffName(building.jeId)}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteBuilding.bind(null, building.id)}>
                        <Button variant="ghost" size="sm" type="submit">
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Building</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createBuildingAction} className="flex flex-col gap-3">
              <Field name="name" label="Building Name" placeholder="Academic Block I" required />
              <Field name="code" label="Building Code" placeholder="ACAD-I" required />
              <Field name="floors" label="Floors" type="number" defaultValue="1" min="1" />
              <Field name="area" label="Area" placeholder="North campus" />
              <FormSelect name="jeId" label="JE Assigned" defaultValue="">
                <option value="">Unassigned</option>
                {staff
                  .filter((member) => member.role === "JE")
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
              </FormSelect>
              <Button type="submit">Add Building</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="size-4 text-primary" />
              Complaint Category Master
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.level}</TableCell>
                    <TableCell>{categoryName(category.parentId)}</TableCell>
                    <TableCell>{category.trade || "-"}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteCategory.bind(null, category.id)}>
                        <Button variant="ghost" size="sm" type="submit">
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Category / Sub-Type</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCategoryAction} className="flex flex-col gap-3">
              <Field name="name" label="Name" placeholder="Door Lock" required />
              <FormSelect name="level" label="Level" defaultValue="1">
                <option value="1">Category</option>
                <option value="2">Sub-category</option>
                <option value="3">Complaint Type</option>
              </FormSelect>
              <FormSelect name="parentId" label="Parent" defaultValue="">
                <option value="">No parent</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </FormSelect>
              <FormSelect name="trade" label="Relevant Trade" defaultValue="">
                <option value="">Not mapped</option>
                {TRADES.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </FormSelect>
              <Button type="submit">Add Category</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" />
              IWD Staff & Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Subdivision</TableHead>
                  <TableHead>Building</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>{member.subdivision || "-"}</TableCell>
                    <TableCell>
                      {buildings.find((building) => building.id === member.buildingId)?.name ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add IWD Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createStaffAction} className="flex flex-col gap-3">
              <Field name="name" label="Name" required />
              <Field name="email" label="IIT Goa Email" type="email" placeholder="name@iitgoa.ac.in" required />
              <FormSelect name="role" label="Role" defaultValue="JE">
                {ROLES.filter((role) => role !== "User").map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </FormSelect>
              <Field name="subdivision" label="Subdivision" placeholder="Civil / Electrical / I&S" />
              <FormSelect name="buildingId" label="Assigned Building" defaultValue="">
                <option value="">Campus-wide / not assigned</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </FormSelect>
              <Button type="submit">Add Staff</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-primary" />
              SLA Time Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {slaRules.map((rule) => (
              <form
                key={rule.id}
                action={updateSlaAction}
                className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_120px_auto]"
              >
                <input type="hidden" name="priority" value={rule.priority} />
                <div>
                  <p className="font-medium">{rule.priority}</p>
                  <p className="text-xs text-muted-foreground">{rule.label}</p>
                </div>
                <Input name="hours" type="number" min="1" defaultValue={rule.hours} />
                <Button type="submit">Save</Button>
              </form>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" />
              Notification Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {templates.map((template) => (
              <form key={template.id} action={updateTemplateAction} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <input type="hidden" name="id" value={template.id} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{template.event}</p>
                  <FormSelect name="channel" label="Channel" defaultValue={template.channel}>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="Email + SMS">Email + SMS</option>
                  </FormSelect>
                </div>
                <Field name="subject" label="Subject" defaultValue={template.subject ?? ""} />
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`body-${template.id}`}>Body</Label>
                  <Textarea id={`body-${template.id}`} name="body" defaultValue={template.body} rows={3} required />
                </div>
                <Button type="submit">Save Template</Button>
              </form>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function Field({
  label,
  name,
  ...props
}: ComponentProps<typeof Input> & {
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

function FormSelect({
  label,
  name,
  children,
  ...props
}: ComponentProps<"select"> & {
  label: string
  name: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
