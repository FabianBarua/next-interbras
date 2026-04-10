import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core"
import { users } from "./users"
import { orders } from "./orders"

/* ── Enums ─────────────────────────────────── */

export const affiliateStatusEnum = pgEnum("affiliate_status", [
  "pending",
  "approved",
  "rejected",
])

export const affiliateCommissionStatusEnum = pgEnum("affiliate_commission_status", [
  "pending",
  "approved",
  "rejected",
  "paid",
])

export const affiliatePayoutStatusEnum = pgEnum("affiliate_payout_status", [
  "pending",
  "completed",
  "cancelled",
])

/* ── Affiliates ────────────────────────────── */

export const affiliates = pgTable("affiliates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  refCode: varchar("ref_code", { length: 50 }).notNull().unique(),
  status: affiliateStatusEnum("status").notNull().default("pending"),
  commissionRate: integer("commission_rate").notNull().default(10),
  pixKey: varchar("pix_key", { length: 255 }),
  pixType: varchar("pix_type", { length: 20 }),
  totalEarned: integer("total_earned").notNull().default(0),
  totalPaid: integer("total_paid").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/* ── Commissions ───────────────────────────── */

export const affiliateCommissions = pgTable("affiliates_commissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  affiliateId: uuid("affiliate_id")
    .notNull()
    .references(() => affiliates.id),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  orderTotal: integer("order_total").notNull(),
  commissionRate: integer("commission_rate").notNull(),
  commission: integer("commission").notNull(),
  status: affiliateCommissionStatusEnum("status").notNull().default("pending"),
  payoutId: uuid("payout_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/* ── Payouts ───────────────────────────────── */

export const affiliatePayouts = pgTable("affiliates_payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  totalAmount: integer("total_amount").notNull(),
  affiliatesCount: integer("affiliates_count").notNull(),
  commissionsCount: integer("commissions_count").notNull(),
  status: affiliatePayoutStatusEnum("status").notNull().default("completed"),
  notes: text("notes"),
  commissionIds: text("commission_ids").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
