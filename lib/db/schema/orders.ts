import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  jsonb,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core"
import { users } from "./users"

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
])

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  // "card",
  // "transfer",
])

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
  shippingMethod: varchar("shipping_method", { length: 50 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 5 }).notNull().default("USD"),
  customerName: varchar("customer_name", { length: 200 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }),
  customerDocument: varchar("customer_document", { length: 30 }),
  shippingAddress: jsonb("shipping_address").$type<{
    street: string
    city: string
    state: string
    zipCode?: string
    country: string
  }>(),
  notes: text("notes"),
  trackingCode: varchar("tracking_code", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdateFn(() => new Date()),
}, (t) => [
  index("orders_user_id_idx").on(t.userId),
  index("orders_status_idx").on(t.status),
  index("orders_created_at_idx").on(t.createdAt),
])
