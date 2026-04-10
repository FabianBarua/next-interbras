import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core"
import { orders } from "./orders"

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refunded",
])

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  gateway: varchar("gateway", { length: 50 }).notNull(),
  externalId: varchar("external_id", { length: 255 }),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amount: integer("amount").notNull(), // cents
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const gatewayConfig = pgTable("gateway_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull().default(""),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  credentials: text("credentials").notNull(), // AES-256-GCM encrypted JSON
  domains: jsonb("domains").notNull().$type<string[]>().default([]),
  sandbox: boolean("sandbox").notNull().default(true),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const adminAlerts = pgTable("admin_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  read: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
