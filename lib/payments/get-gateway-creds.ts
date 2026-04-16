import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { gatewayConfig } from "@/lib/db/schema"
import { decrypt } from "@/lib/crypto"

/**
 * Internal helper — fetches a gateway instance with decrypted credentials.
 * NOT a server action. Only import from server-side code (webhook handlers, createPayment).
 */
export async function getGatewayInstanceBySlugInternal(slug: string) {
  const config = await db.query.gatewayConfig.findFirst({
    where: eq(gatewayConfig.slug, slug),
  })
  if (!config) return null
  return {
    ...config,
    decryptedCredentials: decrypt(config.credentials),
  }
}
