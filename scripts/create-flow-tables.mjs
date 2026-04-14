import dotenv from "dotenv"
import postgres from "postgres"

dotenv.config({ path: ".env.local" })

const sql = postgres(process.env.DATABASE_URL)

async function main() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS order_statuses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      slug varchar(50) NOT NULL UNIQUE,
      name jsonb NOT NULL,
      description jsonb,
      color varchar(30) DEFAULT 'gray' NOT NULL,
      icon varchar(50) DEFAULT 'Circle' NOT NULL,
      is_final boolean DEFAULT false NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL,
      active boolean DEFAULT true NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL
    )
  `)
  console.log("✓ order_statuses")

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS order_flows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      name jsonb NOT NULL,
      description jsonb,
      shipping_method_id uuid REFERENCES shipping_methods(id) ON DELETE SET NULL,
      gateway_type varchar(50),
      is_default boolean DEFAULT false NOT NULL,
      active boolean DEFAULT true NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL,
      UNIQUE(shipping_method_id, gateway_type)
    )
  `)
  console.log("✓ order_flows")

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS order_flow_steps (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      flow_id uuid NOT NULL REFERENCES order_flows(id) ON DELETE CASCADE,
      status_slug varchar(50) NOT NULL REFERENCES order_statuses(slug),
      step_order integer NOT NULL,
      auto_transition boolean DEFAULT false NOT NULL,
      notify_customer boolean DEFAULT false NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      UNIQUE(flow_id, step_order),
      UNIQUE(flow_id, status_slug)
    )
  `)
  console.log("✓ order_flow_steps")

  // Add flow_id to orders if not exists
  await sql.unsafe(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS flow_id uuid REFERENCES order_flows(id) ON DELETE SET NULL`
  )
  console.log("✓ orders.flow_id column")

  // Change orders.status from enum to varchar if needed
  try {
    await sql.unsafe(
      `ALTER TABLE orders ALTER COLUMN status SET DATA TYPE varchar(50)`
    )
    console.log("✓ orders.status → varchar(50)")
  } catch (e) {
    if (e.message?.includes("already")) {
      console.log("· orders.status already varchar")
    } else {
      console.log("· orders.status type change:", e.message)
    }
  }

  try {
    await sql.unsafe(
      `ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'`
    )
    console.log("✓ orders.status default → 'pending'")
  } catch (e) {
    console.log("· default change:", e.message)
  }

  await sql.end()
  console.log("\nDone! All flow tables created.")
}

main().catch((e) => {
  console.error(e)
  sql.end({ timeout: 1 })
  process.exit(1)
})
