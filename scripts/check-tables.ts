import dotenv from "dotenv"
dotenv.config({ path: ".env.local", override: true })

import postgres from "postgres"
const sql = postgres(process.env.DATABASE_URL!)

const [r1] = await sql`SELECT count(*)::int as cnt FROM order_statuses`
console.log("order_statuses count:", r1.cnt)

const [r2] = await sql`SELECT count(*)::int as cnt FROM order_flows`
console.log("order_flows count:", r2.cnt)

await sql.end()
