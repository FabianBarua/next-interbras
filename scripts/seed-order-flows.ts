import { config } from "dotenv"
config({ path: ".env.local", override: true })

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { eq } from "drizzle-orm"
import {
  orderStatuses,
  orderFlows,
  orderFlowSteps,
  shippingMethods,
} from "../drizzle/schema"

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// ─── 10 Order Statuses ───────────────────────────────────────

const statuses = [
  {
    slug: "pending",
    name: { es: "Pendiente", pt: "Pendente" },
    description: {
      es: "Pedido recibido, pendiente de confirmación",
      pt: "Pedido recebido, pendente de confirmação",
    },
    color: "yellow",
    icon: "Clock",
    isFinal: false,
    sortOrder: 0,
  },
  {
    slug: "awaiting-payment",
    name: { es: "Esperando Pago", pt: "Aguardando Pagamento" },
    description: {
      es: "Esperando comprobante o confirmación de pago",
      pt: "Aguardando comprovante ou confirmação de pagamento",
    },
    color: "orange",
    icon: "CreditCard",
    isFinal: false,
    sortOrder: 1,
  },
  {
    slug: "confirmed",
    name: { es: "Confirmado", pt: "Confirmado" },
    description: {
      es: "Pago verificado, pedido confirmado",
      pt: "Pagamento verificado, pedido confirmado",
    },
    color: "blue",
    icon: "CheckCircle",
    isFinal: false,
    sortOrder: 2,
  },
  {
    slug: "preparing",
    name: { es: "En Preparación", pt: "Em Preparação" },
    description: {
      es: "Pedido siendo preparado para envío o retiro",
      pt: "Pedido sendo preparado para envio ou retirada",
    },
    color: "indigo",
    icon: "Package",
    isFinal: false,
    sortOrder: 3,
  },
  {
    slug: "ready-for-pickup",
    name: { es: "Listo para Retiro", pt: "Pronto para Retirada" },
    description: {
      es: "Pedido listo, puede pasar a retirar",
      pt: "Pedido pronto, pode passar para retirar",
    },
    color: "teal",
    icon: "MapPin",
    isFinal: false,
    sortOrder: 4,
  },
  {
    slug: "shipped",
    name: { es: "Enviado", pt: "Enviado" },
    description: {
      es: "Pedido entregado al transportista",
      pt: "Pedido entregue à transportadora",
    },
    color: "purple",
    icon: "Truck",
    isFinal: false,
    sortOrder: 5,
  },
  {
    slug: "in-transit",
    name: { es: "En Tránsito", pt: "Em Trânsito" },
    description: {
      es: "Pedido en camino al destino",
      pt: "Pedido a caminho do destino",
    },
    color: "cyan",
    icon: "Navigation",
    isFinal: false,
    sortOrder: 6,
  },
  {
    slug: "delivered",
    name: { es: "Entregado", pt: "Entregue" },
    description: {
      es: "Pedido entregado al cliente",
      pt: "Pedido entregue ao cliente",
    },
    color: "green",
    icon: "CheckCircle2",
    isFinal: true,
    sortOrder: 7,
  },
  {
    slug: "cancelled",
    name: { es: "Cancelado", pt: "Cancelado" },
    description: {
      es: "Pedido cancelado",
      pt: "Pedido cancelado",
    },
    color: "red",
    icon: "XCircle",
    isFinal: true,
    sortOrder: 8,
  },
  {
    slug: "refunded",
    name: { es: "Reembolsado", pt: "Reembolsado" },
    description: {
      es: "Pedido reembolsado",
      pt: "Pedido reembolsado",
    },
    color: "gray",
    icon: "RotateCcw",
    isFinal: true,
    sortOrder: 9,
  },
]

// ─── 6 Order Flows ─────────────────────────────────────────

type FlowDef = {
  name: { es: string; pt: string }
  description: { es: string; pt: string }
  shippingSlug: string | null // null = default flow
  gatewayType: string | null
  isDefault: boolean
  steps: { statusSlug: string; autoTransition: boolean; notifyCustomer: boolean }[]
}

const flowDefs: FlowDef[] = [
  // ─── Pickup flows ─────────────────────────────────────────
  {
    name: { es: "Retiro + Efectivo", pt: "Retirada + Dinheiro" },
    description: {
      es: "Pago en efectivo en local, retiro en tienda",
      pt: "Pagamento em dinheiro no local, retirada na loja",
    },
    shippingSlug: "pickup",
    gatewayType: "manual-cash",
    isDefault: false,
    steps: [
      { statusSlug: "pending", autoTransition: true, notifyCustomer: false },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "ready-for-pickup", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
  {
    name: { es: "Retiro + Tarjeta local", pt: "Retirada + Cartão local" },
    description: {
      es: "Pago con tarjeta en local, retiro en tienda",
      pt: "Pagamento com cartão no local, retirada na loja",
    },
    shippingSlug: "pickup",
    gatewayType: "manual-card",
    isDefault: false,
    steps: [
      { statusSlug: "pending", autoTransition: true, notifyCustomer: false },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "ready-for-pickup", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
  {
    name: { es: "Retiro + Transferencia", pt: "Retirada + Transferência" },
    description: {
      es: "Pago por transferencia, retiro en tienda",
      pt: "Pagamento por transferência, retirada na loja",
    },
    shippingSlug: "pickup",
    gatewayType: "manual-transfer",
    isDefault: false,
    steps: [
      { statusSlug: "pending", autoTransition: false, notifyCustomer: false },
      { statusSlug: "awaiting-payment", autoTransition: false, notifyCustomer: true },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "ready-for-pickup", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
  {
    name: { es: "Retiro + PIX (PyxPay)", pt: "Retirada + PIX (PyxPay)" },
    description: {
      es: "Pago por PIX online, retiro en tienda",
      pt: "Pagamento por PIX online, retirada na loja",
    },
    shippingSlug: "pickup",
    gatewayType: "pyxpay-pix",
    isDefault: false,
    steps: [
      { statusSlug: "pending", autoTransition: true, notifyCustomer: false },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "ready-for-pickup", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
  {
    name: { es: "Retiro + Tarjeta online (PyxPay)", pt: "Retirada + Cartão online (PyxPay)" },
    description: {
      es: "Pago con tarjeta online, retiro en tienda",
      pt: "Pagamento com cartão online, retirada na loja",
    },
    shippingSlug: "pickup",
    gatewayType: "pyxpay-card",
    isDefault: false,
    steps: [
      { statusSlug: "pending", autoTransition: true, notifyCustomer: false },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "ready-for-pickup", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
  {
    name: { es: "Retiro + PIX (CommPix)", pt: "Retirada + PIX (CommPix)" },
    description: {
      es: "Pago por PIX CommPix, retiro en tienda",
      pt: "Pagamento por PIX CommPix, retirada na loja",
    },
    shippingSlug: "pickup",
    gatewayType: "commpix-pix",
    isDefault: false,
    steps: [
      { statusSlug: "pending", autoTransition: true, notifyCustomer: false },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "ready-for-pickup", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
  // ─── Standard shipping flows ───────────────────────────────
  {
    name: { es: "Envío + Transferencia", pt: "Envio + Transferência" },
    description: {
      es: "Pago por transferencia, envío al domicilio",
      pt: "Pagamento por transferência, envio ao domicílio",
    },
    shippingSlug: "standard",
    gatewayType: "manual-transfer",
    isDefault: false,
    steps: [
      { statusSlug: "pending", autoTransition: false, notifyCustomer: false },
      { statusSlug: "awaiting-payment", autoTransition: false, notifyCustomer: true },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "shipped", autoTransition: false, notifyCustomer: true },
      { statusSlug: "in-transit", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
  {
    name: { es: "Envío + PIX (PyxPay)", pt: "Envio + PIX (PyxPay)" },
    description: {
      es: "Pago por PIX online, envío al domicilio",
      pt: "Pagamento por PIX online, envio ao domicílio",
    },
    shippingSlug: "standard",
    gatewayType: "pyxpay-pix",
    isDefault: false,
    steps: [
      { statusSlug: "pending", autoTransition: true, notifyCustomer: false },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "shipped", autoTransition: false, notifyCustomer: true },
      { statusSlug: "in-transit", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
  {
    name: { es: "Envío + Tarjeta online (PyxPay)", pt: "Envio + Cartão online (PyxPay)" },
    description: {
      es: "Pago con tarjeta online, envío al domicilio",
      pt: "Pagamento com cartão online, envio ao domicílio",
    },
    shippingSlug: "standard",
    gatewayType: "pyxpay-card",
    isDefault: false,
    steps: [
      { statusSlug: "pending", autoTransition: true, notifyCustomer: false },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "shipped", autoTransition: false, notifyCustomer: true },
      { statusSlug: "in-transit", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
  {
    name: { es: "Envío + PIX (CommPix)", pt: "Envio + PIX (CommPix)" },
    description: {
      es: "Pago por PIX CommPix, envío al domicilio",
      pt: "Pagamento por PIX CommPix, envio ao domicílio",
    },
    shippingSlug: "standard",
    gatewayType: "commpix-pix",
    isDefault: false,
    steps: [
      { statusSlug: "pending", autoTransition: true, notifyCustomer: false },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "shipped", autoTransition: false, notifyCustomer: true },
      { statusSlug: "in-transit", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
  // ─── Default flow ──────────────────────────────────────────
  {
    name: { es: "Flujo por defecto", pt: "Fluxo padrão" },
    description: {
      es: "Flujo genérico cuando no hay combinación específica",
      pt: "Fluxo genérico quando não há combinação específica",
    },
    shippingSlug: null,
    gatewayType: null,
    isDefault: true,
    steps: [
      { statusSlug: "pending", autoTransition: false, notifyCustomer: false },
      { statusSlug: "confirmed", autoTransition: false, notifyCustomer: true },
      { statusSlug: "preparing", autoTransition: false, notifyCustomer: false },
      { statusSlug: "shipped", autoTransition: false, notifyCustomer: true },
      { statusSlug: "delivered", autoTransition: false, notifyCustomer: true },
    ],
  },
]

async function main() {
  console.log("── Seeding order statuses ──")
  for (const s of statuses) {
    try {
      await db
        .insert(orderStatuses)
        .values(s)
        .onConflictDoNothing({ target: orderStatuses.slug })
      console.log("  OK:", s.slug)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.log("  ERR:", s.slug, msg.slice(0, 120))
    }
  }

  console.log("\n── Seeding order flows ──")

  // Look up shipping methods by slug
  const allShipping = await db.select().from(shippingMethods)
  const shippingBySlug = new Map(allShipping.map((sm) => [sm.slug, sm]))

  for (const fd of flowDefs) {
    try {
      const shippingMethodId = fd.shippingSlug
        ? shippingBySlug.get(fd.shippingSlug)?.id ?? null
        : null

      if (fd.shippingSlug && !shippingMethodId) {
        console.log(`  SKIP: ${fd.name.es} — shipping method "${fd.shippingSlug}" not found`)
        continue
      }

      // Upsert flow
      const [flow] = await db
        .insert(orderFlows)
        .values({
          name: fd.name,
          description: fd.description,
          shippingMethodId,
          gatewayType: fd.gatewayType,
          isDefault: fd.isDefault,
        })
        .onConflictDoNothing()
        .returning()

      if (!flow) {
        // Already exists — fetch it
        const existing = fd.isDefault
          ? await db.select().from(orderFlows).where(eq(orderFlows.isDefault, true)).then(r => r[0])
          : await db.select().from(orderFlows)
              .where(eq(orderFlows.gatewayType, fd.gatewayType!))
              .then(rows => rows.find(r => r.shippingMethodId === shippingMethodId))

        if (!existing) {
          console.log(`  SKIP: ${fd.name.es} — could not find or create`)
          continue
        }
        console.log(`  EXISTS: ${fd.name.es} (${existing.id})`)

        // Seed steps anyway (in case they're missing)
        for (let i = 0; i < fd.steps.length; i++) {
          const step = fd.steps[i]
          await db
            .insert(orderFlowSteps)
            .values({
              flowId: existing.id,
              statusSlug: step.statusSlug,
              stepOrder: i,
              autoTransition: step.autoTransition,
              notifyCustomer: step.notifyCustomer,
            })
            .onConflictDoNothing()
        }
        continue
      }

      console.log(`  OK: ${fd.name.es} (${flow.id})`)

      // Insert steps
      for (let i = 0; i < fd.steps.length; i++) {
        const step = fd.steps[i]
        await db
          .insert(orderFlowSteps)
          .values({
            flowId: flow.id,
            statusSlug: step.statusSlug,
            stepOrder: i,
            autoTransition: step.autoTransition,
            notifyCustomer: step.notifyCustomer,
          })
          .onConflictDoNothing()
        console.log(`    step ${i}: ${step.statusSlug}${step.autoTransition ? " (auto)" : ""}`)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.log(`  ERR: ${fd.name.es} — ${msg.slice(0, 120)}`)
    }
  }

  console.log("\n── Done ──")
  await client.end()
  process.exit(0)
}

main()
