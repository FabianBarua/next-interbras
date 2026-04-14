import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL!)

async function main() {
  // Remove standard and express from BR (keep only pickup)
  const deleted = await sql`
    DELETE FROM shipping_method_countries 
    WHERE country_id = (SELECT id FROM countries WHERE code = 'BR')
    AND shipping_method_id IN (
      SELECT id FROM shipping_methods WHERE slug IN ('standard', 'express')
    )
    RETURNING shipping_method_id`
  console.log(`Removed ${deleted.length} delivery methods from BR`)

  // Verify final state
  const rows = await sql`
    SELECT sm.slug, sm.active, sm.requires_address, sm.price, c.code 
    FROM shipping_method_countries smc 
    JOIN shipping_methods sm ON smc.shipping_method_id = sm.id 
    JOIN countries c ON smc.country_id = c.id
    ORDER BY c.code, sm.sort_order`
  console.log("\nFinal shipping methods per country:")
  console.table(rows)

  await sql.end()
}
main().catch(async (e) => { console.error(e); await sql.end(); process.exit(1) })
