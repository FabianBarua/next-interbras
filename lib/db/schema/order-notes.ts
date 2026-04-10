import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { orders } from "./orders"
import { users } from "./users"

export const orderNotes = pgTable("order_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
