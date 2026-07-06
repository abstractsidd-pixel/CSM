import { db } from "@/lib/db"
import { buildings, categories, complaints } from "@/lib/db/schema"
import { eq, and, sql, type SQL } from "drizzle-orm"

function pad(n: number, len = 4) {
  return String(n).padStart(len, "0")
}

export async function generateDocket(
  buildingId: number,
  categoryId: number | null,
  extraConditions?: SQL[]
) {
  const year = new Date().getFullYear()

  const buildingRows = await db
    .select({ code: buildings.code })
    .from(buildings)
    .where(eq(buildings.id, buildingId))
    .limit(1)
  const buildingCode = buildingRows[0]?.code ?? "UNK"

  let categoryCode = "GEN"
  if (categoryId) {
    const catRows = await db
      .select({ code: categories.code })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1)
    categoryCode = catRows[0]?.code ?? "GEN"
  }

  const conditions = [
    sql`EXTRACT(YEAR FROM ${complaints.createdAt}) = ${year}`,
    sql`${complaints.buildingId} = ${buildingId}`,
    sql`COALESCE(${complaints.categoryId}, 0) = COALESCE(${categoryId ?? 0}, 0)`,
    ...(extraConditions || []),
  ]

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(complaints)
    .where(and(...conditions))

  const seq = count + 1
  return `IITGoa/CMS/${buildingCode}/${categoryCode}/${year}/${pad(seq)}`
}
