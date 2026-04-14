import { config } from "dotenv"
config({ path: ".env.local", override: true })

import { db } from "../lib/db"
import { gatewayConfig } from "../drizzle/schema"
import { encrypt } from "../lib/crypto"

const gateways = [
  {
    type: "manual-cash",
    slug: "efectivo",
    name: "Efectivo",
    displayName: "Efectivo",
    credentials: encrypt(
      JSON.stringify({
        storeAddress: "Av. Ejemplo 123, Asunción",
        storePhone: "+595 21 000-0000",
        storeHours: "Lun–Vie 8:00–18:00",
        pickupMessage:
          "Diríjase a nuestra tienda para abonar y retirar su pedido.",
      }),
    ),
    sandbox: false,
    active: true,
    domains: [],
  },
  {
    type: "manual-transfer",
    slug: "transferencia",
    name: "Transferencia Bancaria",
    displayName: "Transferencia",
    credentials: encrypt(
      JSON.stringify({
        bankName: "Banco Ejemplo",
        accountNumber: "000-000000-0",
        accountType: "Cuenta Corriente",
        holder: "Empresa S.A.",
        message: "Envíe el comprobante y procesaremos su pedido.",
      }),
    ),
    sandbox: false,
    active: true,
    domains: [],
  },
  {
    type: "manual-card",
    slug: "tarjeta",
    name: "Tarjeta (placeholder)",
    displayName: "Tarjeta",
    credentials: encrypt(
      JSON.stringify({
        message: "Pago con tarjeta al retirar el pedido.",
      }),
    ),
    sandbox: false,
    active: true,
    domains: [],
  },
  {
    type: "pyxpay-pix",
    slug: "pyxpay-pix-principal",
    name: "PyxPay PIX",
    displayName: "PIX (PyxPay)",
    credentials: encrypt(JSON.stringify({ apiKey: "demo-key", taxa: 2.5 })),
    sandbox: true,
    active: true,
    domains: [],
  },
  {
    type: "pyxpay-card",
    slug: "pyxpay-card-principal",
    name: "PyxPay Card",
    displayName: "Tarjeta (PyxPay)",
    credentials: encrypt(JSON.stringify({ apiKey: "demo-key", taxa: 3.5 })),
    sandbox: true,
    active: true,
    domains: [],
  },
  {
    type: "commpix-pix",
    slug: "commpix-principal",
    name: "CommPix PIX",
    displayName: "PIX (CommPix)",
    credentials: encrypt(
      JSON.stringify({
        email: "demo@test.com",
        password: "demo",
        webhookSecret: "secret",
        apiUrl: "https://api.commpix.com",
        currency: "BRL",
        nature: "SERVICES_AND_OTHERS",
      }),
    ),
    sandbox: true,
    active: true,
    domains: [],
  },
]

async function main() {
  for (const gw of gateways) {
    try {
      await db
        .insert(gatewayConfig)
        .values(gw)
        .onConflictDoNothing({ target: gatewayConfig.slug })
      console.log("OK:", gw.slug)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.log("ERR:", gw.slug, msg.slice(0, 120))
    }
  }
  process.exit(0)
}

main()
