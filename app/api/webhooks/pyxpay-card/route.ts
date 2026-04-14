import { NextRequest } from "next/server"
import { handleGatewayWebhook } from "@/lib/payments/handle-gateway-webhook"

export const POST = (req: NextRequest) => handleGatewayWebhook(req, "pyxpay-card")
