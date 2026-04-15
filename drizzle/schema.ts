import { pgTable, foreignKey, text, uuid, timestamp, unique, varchar, jsonb, boolean, index, integer, uniqueIndex, numeric, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const affiliateCommissionStatus = pgEnum("affiliate_commission_status", ['pending', 'approved', 'rejected', 'paid'])
export const affiliatePayoutStatus = pgEnum("affiliate_payout_status", ['pending', 'completed', 'cancelled'])
export const affiliateStatus = pgEnum("affiliate_status", ['pending', 'approved', 'rejected'])
export const catalogPageType = pgEnum("catalog_page_type", ['category', 'product', 'banner', 'photo', 'custom'])
export const couponType = pgEnum("coupon_type", ['percent', 'fixed'])
export const documentType = pgEnum("document_type", ['CI', 'CPF', 'RG', 'OTRO'])
export const emailLogStatus = pgEnum("email_log_status", ['sent', 'failed'])
export const paymentMethod = pgEnum("payment_method", ['cash', 'card', 'transfer', 'pix'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'processing', 'succeeded', 'failed', 'refunded'])
export const promotionType = pgEnum("promotion_type", ['percentage', 'fixed'])
export const userRole = pgEnum("user_role", ['user', 'admin', 'support'])


export const sessions = pgTable("sessions", {
	sessionToken: text().primaryKey().notNull(),
	userId: uuid().notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tokenHash: varchar("token_hash", { length: 64 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("password_reset_tokens_token_hash_unique").on(table.tokenHash),
]);

export const emailTemplates = pgTable("email_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	bodyHtml: text("body_html").notNull(),
	variables: jsonb().default([]),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("email_templates_slug_unique").on(table.slug),
]);

export const settings = pgTable("settings", {
	key: varchar({ length: 255 }).primaryKey().notNull(),
	value: text().notNull(),
	encrypted: boolean().default(false).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const eventLogs = pgTable("event_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	category: varchar({ length: 50 }).default('sistema').notNull(),
	level: varchar({ length: 10 }).default('info').notNull(),
	action: varchar({ length: 100 }).notNull(),
	message: text(),
	userId: uuid("user_id"),
	entity: varchar({ length: 100 }),
	entityId: varchar("entity_id", { length: 100 }),
	meta: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("event_logs_category_created_idx").using("btree", table.category.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("event_logs_level_idx").using("btree", table.level.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "event_logs_user_id_users_id_fk"
		}),
]);

export const locales = pgTable("locales", {
	code: varchar({ length: 5 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	active: boolean().default(true).notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerified: timestamp({ withTimezone: true, mode: 'string' }),
	image: text(),
	passwordHash: text("password_hash"),
	name: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	documentNumber: varchar("document_number", { length: 30 }),
	role: userRole().default('user').notNull(),
	passwordChangedAt: timestamp("password_changed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	nationality: varchar({ length: 100 }),
	documentType: documentType("document_type"),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const emailLogs = pgTable("email_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	templateId: uuid("template_id"),
	to: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	bodyHtml: text("body_html"),
	status: emailLogStatus().notNull(),
	error: text(),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [emailTemplates.id],
			name: "email_logs_template_id_email_templates_id_fk"
		}),
]);

export const promotions = pgTable("promotions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	name: jsonb().notNull(),
	description: jsonb(),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'string' }).notNull(),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: 'string' }),
	active: boolean().default(true).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("promotions_slug_unique").on(table.slug),
]);

export const catalogPresets = pgTable("catalog_presets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	name: jsonb().notNull(),
	preferredLocale: varchar("preferred_locale", { length: 5 }).notNull(),
	promotionId: uuid("promotion_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.preferredLocale],
			foreignColumns: [locales.code],
			name: "catalog_presets_preferred_locale_locales_code_fk"
		}),
	foreignKey({
			columns: [table.promotionId],
			foreignColumns: [promotions.id],
			name: "catalog_presets_promotion_id_promotions_id_fk"
		}),
	unique("catalog_presets_slug_unique").on(table.slug),
]);

export const catalogPages = pgTable("catalog_pages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	presetId: uuid("preset_id").notNull(),
	pageType: catalogPageType("page_type").notNull(),
	referenceId: uuid("reference_id"),
	title: jsonb(),
	content: jsonb(),
	sortOrder: integer("sort_order").notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.presetId],
			foreignColumns: [catalogPresets.id],
			name: "catalog_pages_preset_id_catalog_presets_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	slug: varchar({ length: 150 }).notNull(),
	name: jsonb().notNull(),
	description: jsonb(),
	specs: jsonb(),
	review: jsonb(),
	included: jsonb(),
	sortOrder: integer("sort_order").default(0).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("products_category_id_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}),
	unique("products_slug_unique").on(table.slug),
]);

export const externalCodes = pgTable("external_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	system: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 100 }).notNull(),
	externalName: varchar("external_name", { length: 255 }),
	variantId: uuid("variant_id"),
	priceUsd: numeric("price_usd", { precision: 10, scale:  2 }),
	priceGs: numeric("price_gs", { precision: 12, scale:  0 }),
	priceBrl: numeric("price_brl", { precision: 10, scale:  2 }),
	stock: integer(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("external_codes_system_code_idx").using("btree", table.system.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	uniqueIndex("external_codes_variant_id_unique").on(table.variantId),
	index("external_codes_variant_id_idx").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "external_codes_variant_id_variants_id_fk"
		}).onDelete("cascade"),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	variantId: uuid("variant_id"),
	productName: jsonb("product_name").notNull(),
	sku: varchar({ length: 100 }),
	quantity: integer().notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 5 }).default('USD').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "order_items_variant_id_variants_id_fk"
		}).onDelete("set null"),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	status: varchar({ length: 50 }).default('pending').notNull(),
	flowId: uuid("flow_id"),
	paymentMethod: paymentMethod("payment_method").default('cash').notNull(),
	shippingMethod: varchar("shipping_method", { length: 50 }),
	shippingCost: numeric("shipping_cost", { precision: 10, scale:  2 }).default('0').notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 5 }).default('USD').notNull(),
	customerName: varchar("customer_name", { length: 200 }).notNull(),
	customerEmail: varchar("customer_email", { length: 255 }).notNull(),
	customerPhone: varchar("customer_phone", { length: 50 }),
	customerDocument: varchar("customer_document", { length: 30 }),
	shippingAddress: jsonb("shipping_address"),
	notes: text(),
	trackingCode: varchar("tracking_code", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	discount: integer().default(0).notNull(),
	couponId: uuid("coupon_id"),
	affiliateId: uuid("affiliate_id"),
	sourceDomain: varchar("source_domain", { length: 255 }),
}, (table) => [
	index("orders_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("orders_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("orders_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.flowId],
			foreignColumns: [orderFlows.id],
			name: "orders_flow_id_order_flows_id_fk"
		}).onDelete("set null"),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	name: jsonb().notNull(),
	description: jsonb(),
	shortDescription: jsonb("short_description"),
	image: text(),
	sortOrder: integer("sort_order").default(0).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	svgIcon: text("svg_icon"),
	svgIconMeta: jsonb("svg_icon_meta"),
}, (table) => [
	unique("categories_slug_unique").on(table.slug),
]);

export const variants = pgTable("variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	sku: varchar({ length: 100 }).notNull(),
	options: jsonb().notNull(),
	unitsPerBox: integer("units_per_box"),
	sortOrder: integer("sort_order").default(0).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("variants_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "variants_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("variants_sku_unique").on(table.sku),
]);

export const productImages = pgTable("product_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id").notNull(),
	url: text().notNull(),
	alt: jsonb(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_images_product_id_idx").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_images_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "product_images_variant_id_variants_id_fk"
		}).onDelete("cascade"),
]);

export const addresses = pgTable("addresses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	label: varchar({ length: 100 }),
	street: varchar({ length: 300 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	state: varchar({ length: 100 }).notNull(),
	zipCode: varchar("zip_code", { length: 20 }),
	countryCode: varchar("country_code", { length: 5 }).notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("addresses_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "addresses_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const wishlists = pgTable("wishlists", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	productId: uuid("product_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	variantId: uuid("variant_id").notNull(),
}, (table) => [
	uniqueIndex("wishlists_user_variant_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wishlists_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "wishlists_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "wishlists_variant_id_variants_id_fk"
		}).onDelete("cascade"),
]);

export const shippingMethods = pgTable("shipping_methods", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: varchar({ length: 50 }).notNull(),
	name: jsonb().notNull(),
	description: jsonb(),
	price: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	active: boolean().default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	requiresAddress: boolean("requires_address").default(true).notNull(),
	pickupConfig: jsonb("pickup_config"),
}, (table) => [
	unique("shipping_methods_slug_unique").on(table.slug),
]);

export const promotionItems = pgTable("promotion_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	promotionId: uuid("promotion_id").notNull(),
	externalCodeId: uuid("external_code_id").notNull(),
	type: promotionType().notNull(),
	value: numeric({ precision: 10, scale:  2 }).notNull(),
}, (table) => [
	uniqueIndex("promotion_items_promo_ext_idx").using("btree", table.promotionId.asc().nullsLast().op("uuid_ops"), table.externalCodeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.promotionId],
			foreignColumns: [promotions.id],
			name: "promotion_items_promotion_id_promotions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.externalCodeId],
			foreignColumns: [externalCodes.id],
			name: "promotion_items_external_code_id_external_codes_id_fk"
		}).onDelete("cascade"),
]);

export const attributes = pgTable("attributes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	name: jsonb().notNull(),
	description: jsonb(),
	sortOrder: integer("sort_order").default(0).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("attributes_slug_unique").on(table.slug),
]);

export const attributeValues = pgTable("attribute_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	attributeId: uuid("attribute_id").notNull(),
	slug: varchar({ length: 100 }).notNull(),
	name: jsonb().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("attribute_values_attribute_id_idx").using("btree", table.attributeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.attributeId],
			foreignColumns: [attributes.id],
			name: "attribute_values_attribute_id_attributes_id_fk"
		}).onDelete("cascade"),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	gateway: varchar({ length: 50 }).notNull(),
	externalId: varchar("external_id", { length: 255 }),
	status: paymentStatus().default('pending').notNull(),
	amount: integer().notNull(),
	metadata: jsonb(),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payments_order_id_orders_id_fk"
		}),
]);

export const gatewayConfig = pgTable("gateway_config", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: varchar({ length: 50 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 100 }).default('').notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	credentials: text().notNull(),
	domains: jsonb().default([]).notNull(),
	sandbox: boolean().default(true).notNull(),
	active: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("gateway_config_slug_unique").on(table.slug),
]);

export const orderPaymentDetails = pgTable("order_payment_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	gateway: varchar({ length: 50 }).notNull(),
	transactionEndToEndId: varchar("transaction_end_to_end_id", { length: 100 }),
	externalId: varchar("external_id", { length: 255 }),
	payerName: varchar("payer_name", { length: 255 }),
	payerDocument: varchar("payer_document", { length: 30 }),
	payerBankName: varchar("payer_bank_name", { length: 100 }),
	payerBankNumber: varchar("payer_bank_number", { length: 20 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_payment_details_order_id_orders_id_fk"
		}).onDelete("cascade"),
	unique("order_payment_details_order_id_unique").on(table.orderId),
]);

export const affiliates = pgTable("affiliates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	refCode: varchar("ref_code", { length: 50 }).notNull(),
	status: affiliateStatus().default('pending').notNull(),
	commissionRate: integer("commission_rate").default(10).notNull(),
	pixKey: varchar("pix_key", { length: 255 }),
	pixType: varchar("pix_type", { length: 20 }),
	totalEarned: integer("total_earned").default(0).notNull(),
	totalPaid: integer("total_paid").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "affiliates_user_id_users_id_fk"
		}),
	unique("affiliates_user_id_unique").on(table.userId),
	unique("affiliates_ref_code_unique").on(table.refCode),
]);

export const seoPages = pgTable("seo_pages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	path: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 120 }),
	description: varchar({ length: 320 }),
	ogTitle: varchar("og_title", { length: 120 }),
	ogDescription: varchar("og_description", { length: 320 }),
	ogImage: text("og_image"),
	canonical: varchar({ length: 500 }),
	noIndex: boolean("no_index").default(false).notNull(),
	noFollow: boolean("no_follow").default(false).notNull(),
	keywords: text(),
	structuredData: text("structured_data"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("seo_pages_path_unique").on(table.path),
]);

export const supportActivityLogs = pgTable("support_activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agentId: uuid("agent_id").notNull(),
	action: varchar({ length: 100 }).notNull(),
	entity: varchar({ length: 100 }),
	entityId: varchar("entity_id", { length: 100 }),
	details: jsonb(),
	ipAddress: varchar("ip_address", { length: 45 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("support_activity_logs_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("support_activity_logs_agent_created_idx").using("btree", table.agentId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [users.id],
			name: "support_activity_logs_agent_id_users_id_fk"
		}),
]);

export const coupons = pgTable("coupons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	type: couponType().notNull(),
	value: integer().notNull(),
	maxUses: integer("max_uses"),
	uses: integer().default(0).notNull(),
	minAmount: integer("min_amount"),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("coupons_code_unique").on(table.code),
]);

export const adminAlerts = pgTable("admin_alerts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: varchar({ length: 50 }).notNull(),
	message: text().notNull(),
	orderId: uuid("order_id"),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "admin_alerts_order_id_orders_id_fk"
		}),
]);

export const affiliatesPayouts = pgTable("affiliates_payouts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdBy: uuid("created_by").notNull(),
	totalAmount: integer("total_amount").notNull(),
	affiliatesCount: integer("affiliates_count").notNull(),
	commissionsCount: integer("commissions_count").notNull(),
	status: affiliatePayoutStatus().default('completed').notNull(),
	notes: text(),
	commissionIds: text("commission_ids").array(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "affiliates_payouts_created_by_users_id_fk"
		}),
]);

export const affiliatesCommissions = pgTable("affiliates_commissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	affiliateId: uuid("affiliate_id").notNull(),
	orderId: uuid("order_id").notNull(),
	orderTotal: integer("order_total").notNull(),
	commissionRate: integer("commission_rate").notNull(),
	commission: integer().notNull(),
	status: affiliateCommissionStatus().default('pending').notNull(),
	payoutId: uuid("payout_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.affiliateId],
			foreignColumns: [affiliates.id],
			name: "affiliates_commissions_affiliate_id_affiliates_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "affiliates_commissions_order_id_orders_id_fk"
		}),
]);

export const orderNotes = pgTable("order_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	content: text().notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_notes_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "order_notes_created_by_users_id_fk"
		}),
]);

export const shippingMethodCountries = pgTable("shipping_method_countries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shippingMethodId: uuid("shipping_method_id").notNull(),
	countryId: uuid("country_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.shippingMethodId],
			foreignColumns: [shippingMethods.id],
			name: "shipping_method_countries_shipping_method_id_shipping_methods_i"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.countryId],
			foreignColumns: [countries.id],
			name: "shipping_method_countries_country_id_countries_id_fk"
		}).onDelete("cascade"),
	unique("smc_method_country_unique").on(table.shippingMethodId, table.countryId),
]);

export const countries = pgTable("countries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: varchar({ length: 5 }).notNull(),
	name: jsonb().notNull(),
	flag: varchar({ length: 10 }).notNull(),
	currency: varchar({ length: 5 }).notNull(),
	active: boolean().default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("countries_code_unique").on(table.code),
]);

export const shippingPaymentRules = pgTable("shipping_payment_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shippingMethodId: uuid("shipping_method_id").notNull(),
	gatewayType: varchar("gateway_type", { length: 50 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.shippingMethodId],
			foreignColumns: [shippingMethods.id],
			name: "shipping_payment_rules_shipping_method_id_shipping_methods_id_f"
		}).onDelete("cascade"),
	unique("spr_method_gateway_unique").on(table.shippingMethodId, table.gatewayType),
]);

// ─── Order Flow System ───────────────────────────────────────────

export const orderStatuses = pgTable("order_statuses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: varchar({ length: 50 }).notNull(),
	name: jsonb().notNull(),
	description: jsonb(),
	color: varchar({ length: 30 }).default('gray').notNull(),
	icon: varchar({ length: 50 }).default('Circle').notNull(),
	isFinal: boolean("is_final").default(false).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("order_statuses_slug_unique").on(table.slug),
]);

export const orderFlows = pgTable("order_flows", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: jsonb().notNull(),
	description: jsonb(),
	shippingMethodId: uuid("shipping_method_id"),
	gatewayType: varchar("gateway_type", { length: 50 }),
	isDefault: boolean("is_default").default(false).notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("order_flows_shipping_gateway_unique").on(table.shippingMethodId, table.gatewayType),
	foreignKey({
			columns: [table.shippingMethodId],
			foreignColumns: [shippingMethods.id],
			name: "order_flows_shipping_method_id_shipping_methods_id_fk"
		}).onDelete("set null"),
]);

export const orderFlowSteps = pgTable("order_flow_steps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	flowId: uuid("flow_id").notNull(),
	statusSlug: varchar("status_slug", { length: 50 }).notNull(),
	stepOrder: integer("step_order").notNull(),
	autoTransition: boolean("auto_transition").default(false).notNull(),
	notifyCustomer: boolean("notify_customer").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("order_flow_steps_flow_order_unique").on(table.flowId, table.stepOrder),
	unique("order_flow_steps_flow_status_unique").on(table.flowId, table.statusSlug),
	foreignKey({
			columns: [table.flowId],
			foreignColumns: [orderFlows.id],
			name: "order_flow_steps_flow_id_order_flows_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.statusSlug],
			foreignColumns: [orderStatuses.slug],
			name: "order_flow_steps_status_slug_order_statuses_slug_fk"
		}),
]);

export const verificationTokens = pgTable("verificationTokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationTokens_identifier_token_pk"}),
]);

export const accounts = pgTable("accounts", {
	userId: uuid().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_userId_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "accounts_provider_providerAccountId_pk"}),
]);
