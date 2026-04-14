import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
import { orderFlows } from "./order-flows"
import { orderStatuses } from "./order-statuses"

export const orderFlowSteps = pgTable("order_flow_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  flowId: uuid("flow_id").notNull().references(() => orderFlows.id, { onDelete: "cascade" }),
  statusSlug: varchar("status_slug", { length: 50 }).notNull().references(() => orderStatuses.slug),
  stepOrder: integer("step_order").notNull(),
  autoTransition: boolean("auto_transition").notNull().default(false),
  notifyCustomer: boolean("notify_customer").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("order_flow_steps_flow_order_unique").on(t.flowId, t.stepOrder),
  unique("order_flow_steps_flow_status_unique").on(t.flowId, t.statusSlug),
])
