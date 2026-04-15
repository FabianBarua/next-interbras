import { config } from "dotenv"
config({ path: ".env.local", override: true })

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "csv-parse/sync"
import { drizzle } from "drizzle-orm/postgres-js"
import { sql } from "drizzle-orm"
import postgres from "postgres"
import { externalCodes } from "../drizzle/schema"

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

interface CsvRow {
  CODIGO: string
  FOTO: string
  "DESCRIPCION DEL PRODUCTO": string
  REFERENCIA: string
  "REFERENCIA 2": string
  LOCALIZACION: string
  "CODIGO BARRA": string
  "CODIGO F.": string
  ACTIVO: string
  "DEP 1": string
  "DEP 2": string
  "DEP 3": string
  "DEP 4": string
  "DEP 5": string
  "DEP 6": string
  "DEP 7": string
  STOCK: string
  "a Retirar": string
}

async function main() {
  const csvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "cec.csv")
  const raw = fs.readFileSync(csvPath, "utf-8").replace(/^\uFEFF/, "")

  const rows: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  })

  console.log(`Parsed ${rows.length} rows from CSV`)

  // Run migration: truncate + make variant_id nullable
  console.log("Running migration: TRUNCATE external_codes CASCADE + ALTER variant_id DROP NOT NULL")
  await db.execute(sql`TRUNCATE TABLE external_codes CASCADE`)
  await db.execute(sql`ALTER TABLE external_codes ALTER COLUMN variant_id DROP NOT NULL`)
  console.log("Migration applied.")

  // Debug: show first row keys
  if (rows.length > 0) {
    console.log("CSV columns:", Object.keys(rows[0]))
  }

  const records = rows
    .filter((r) => r.CODIGO)
    .map((r) => ({
    system: "cec" as const,
    code: r.CODIGO.trim(),
    externalName: r["DESCRIPCION DEL PRODUCTO"]?.trim() || null,
    variantId: null,
    metadata: {
      foto: r.FOTO || null,
      referencia: r.REFERENCIA || null,
      referencia2: r["REFERENCIA 2"] || null,
      localizacion: r.LOCALIZACION || null,
      codigoBarra: r["CODIGO BARRA"] || null,
      codigoF: r["CODIGO F."] || null,
      activo: r.ACTIVO || null,
      depositos: {
        dep1: r["DEP 1"] || null,
        dep2: r["DEP 2"] || null,
        dep3: r["DEP 3"] || null,
        dep4: r["DEP 4"] || null,
        dep5: r["DEP 5"] || null,
        dep6: r["DEP 6"] || null,
        dep7: r["DEP 7"] || null,
      },
      stock: r.STOCK || null,
      aRetirar: r["a Retirar"] || null,
    },
  }))

  // Insert in batches of 50
  const batchSize = 50
  let inserted = 0
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    await db.insert(externalCodes).values(batch)
    inserted += batch.length
    console.log(`  Inserted ${inserted}/${records.length}`)
  }

  console.log(`Done. ${inserted} external codes seeded.`)
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
