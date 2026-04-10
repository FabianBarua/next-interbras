import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core"

export const couponTypeEnum = pgEnum("coupon_type", ["percent", "fixed"])

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: couponTypeEnum("type").notNull(),
  value: integer("value").notNull(),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  minAmount: integer("min_amount"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
