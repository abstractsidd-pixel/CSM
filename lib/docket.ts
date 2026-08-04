import { db } from "@/lib/db"
import { buildings, categories, complaints } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

function pad(n: number, len = 4) {
  return String(n).padStart(len, "0")
}

export async function generateDocket(
  buildingId: number,
  categoryId: number | null,
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

  const prefix = `IITGoa/CMS/${buildingCode}/${categoryCode}/${year}/`
  const [{ maxSeq }] = await db
    .select({ maxSeq: sql<number>`COALESCE(MAX(CAST(SUBSTRING(${complaints.docketNumber} FROM ${prefix.length + 1} FOR 4) AS int)), 0)` })
    .from(complaints)
    .where(sql`${complaints.docketNumber} LIKE ${prefix + '%'}`)

  const seq = maxSeq + 1
  return `${prefix}${pad(seq)}`
}
