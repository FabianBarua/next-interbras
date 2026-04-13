import { relations } from "drizzle-orm/relations";
import { users, sessions, passwordResetTokens, eventLogs, emailTemplates, emailLogs, locales, catalogPresets, promotions, catalogPages, categories, products, variants, externalCodes, orders, orderItems, productImages, addresses, wishlists, promotionItems, attributes, attributeValues, payments, orderPaymentDetails, affiliates, supportActivityLogs, adminAlerts, affiliatesPayouts, affiliatesCommissions, orderNotes, accounts } from "./schema";

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
	passwordResetTokens: many(passwordResetTokens),
	eventLogs: many(eventLogs),
	orders: many(orders),
	addresses: many(addresses),
	wishlists: many(wishlists),
	affiliates: many(affiliates),
	supportActivityLogs: many(supportActivityLogs),
	affiliatesPayouts: many(affiliatesPayouts),
	orderNotes: many(orderNotes),
	accounts: many(accounts),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const eventLogsRelations = relations(eventLogs, ({one}) => ({
	user: one(users, {
		fields: [eventLogs.userId],
		references: [users.id]
	}),
}));

export const emailLogsRelations = relations(emailLogs, ({one}) => ({
	emailTemplate: one(emailTemplates, {
		fields: [emailLogs.templateId],
		references: [emailTemplates.id]
	}),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({many}) => ({
	emailLogs: many(emailLogs),
}));

export const catalogPresetsRelations = relations(catalogPresets, ({one, many}) => ({
	locale: one(locales, {
		fields: [catalogPresets.preferredLocale],
		references: [locales.code]
	}),
	promotion: one(promotions, {
		fields: [catalogPresets.promotionId],
		references: [promotions.id]
	}),
	catalogPages: many(catalogPages),
}));

export const localesRelations = relations(locales, ({many}) => ({
	catalogPresets: many(catalogPresets),
}));

export const promotionsRelations = relations(promotions, ({many}) => ({
	catalogPresets: many(catalogPresets),
	promotionItems: many(promotionItems),
}));

export const catalogPagesRelations = relations(catalogPages, ({one}) => ({
	catalogPreset: one(catalogPresets, {
		fields: [catalogPages.presetId],
		references: [catalogPresets.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	variants: many(variants),
	productImages: many(productImages),
	wishlists: many(wishlists),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	products: many(products),
}));

export const externalCodesRelations = relations(externalCodes, ({one, many}) => ({
	variant: one(variants, {
		fields: [externalCodes.variantId],
		references: [variants.id]
	}),
	promotionItems: many(promotionItems),
}));

export const variantsRelations = relations(variants, ({one, many}) => ({
	externalCodes: many(externalCodes),
	orderItems: many(orderItems),
	product: one(products, {
		fields: [variants.productId],
		references: [products.id]
	}),
	productImages: many(productImages),
	wishlists: many(wishlists),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	variant: one(variants, {
		fields: [orderItems.variantId],
		references: [variants.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderItems: many(orderItems),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	payments: many(payments),
	orderPaymentDetails: many(orderPaymentDetails),
	adminAlerts: many(adminAlerts),
	affiliatesCommissions: many(affiliatesCommissions),
	orderNotes: many(orderNotes),
}));

export const productImagesRelations = relations(productImages, ({one}) => ({
	product: one(products, {
		fields: [productImages.productId],
		references: [products.id]
	}),
	variant: one(variants, {
		fields: [productImages.variantId],
		references: [variants.id]
	}),
}));

export const addressesRelations = relations(addresses, ({one}) => ({
	user: one(users, {
		fields: [addresses.userId],
		references: [users.id]
	}),
}));

export const wishlistsRelations = relations(wishlists, ({one}) => ({
	user: one(users, {
		fields: [wishlists.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [wishlists.productId],
		references: [products.id]
	}),
	variant: one(variants, {
		fields: [wishlists.variantId],
		references: [variants.id]
	}),
}));

export const promotionItemsRelations = relations(promotionItems, ({one}) => ({
	promotion: one(promotions, {
		fields: [promotionItems.promotionId],
		references: [promotions.id]
	}),
	externalCode: one(externalCodes, {
		fields: [promotionItems.externalCodeId],
		references: [externalCodes.id]
	}),
}));

export const attributeValuesRelations = relations(attributeValues, ({one}) => ({
	attribute: one(attributes, {
		fields: [attributeValues.attributeId],
		references: [attributes.id]
	}),
}));

export const attributesRelations = relations(attributes, ({many}) => ({
	attributeValues: many(attributeValues),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id]
	}),
}));

export const orderPaymentDetailsRelations = relations(orderPaymentDetails, ({one}) => ({
	order: one(orders, {
		fields: [orderPaymentDetails.orderId],
		references: [orders.id]
	}),
}));

export const affiliatesRelations = relations(affiliates, ({one, many}) => ({
	user: one(users, {
		fields: [affiliates.userId],
		references: [users.id]
	}),
	affiliatesCommissions: many(affiliatesCommissions),
}));

export const supportActivityLogsRelations = relations(supportActivityLogs, ({one}) => ({
	user: one(users, {
		fields: [supportActivityLogs.agentId],
		references: [users.id]
	}),
}));

export const adminAlertsRelations = relations(adminAlerts, ({one}) => ({
	order: one(orders, {
		fields: [adminAlerts.orderId],
		references: [orders.id]
	}),
}));

export const affiliatesPayoutsRelations = relations(affiliatesPayouts, ({one}) => ({
	user: one(users, {
		fields: [affiliatesPayouts.createdBy],
		references: [users.id]
	}),
}));

export const affiliatesCommissionsRelations = relations(affiliatesCommissions, ({one}) => ({
	affiliate: one(affiliates, {
		fields: [affiliatesCommissions.affiliateId],
		references: [affiliates.id]
	}),
	order: one(orders, {
		fields: [affiliatesCommissions.orderId],
		references: [orders.id]
	}),
}));

export const orderNotesRelations = relations(orderNotes, ({one}) => ({
	order: one(orders, {
		fields: [orderNotes.orderId],
		references: [orders.id]
	}),
	user: one(users, {
		fields: [orderNotes.createdBy],
		references: [users.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));