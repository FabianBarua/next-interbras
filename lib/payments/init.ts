// Register all gateway strategies here.
// Import this file once at app startup to populate the registry.

import { registerGateway } from "./registry"
import { pyxpayPix } from "./gateways/pyxpay-pix"
import { pyxpayCard } from "./gateways/pyxpay-card"
import { commpixPix } from "./gateways/commpix-pix"
import { manualCash } from "./gateways/manual-cash"
import { manualTransfer } from "./gateways/manual-transfer"
import { manualCard } from "./gateways/manual-card"
import { PixBlock } from "@/components/payment-blocks/pix-block"
import { CardBlock } from "@/components/payment-blocks/card-block"
import { CashBlock } from "@/components/payment-blocks/cash-block"
import { TransferBlock } from "@/components/payment-blocks/transfer-block"
import { CardPlaceholderBlock } from "@/components/payment-blocks/card-placeholder-block"

// External payment gateways
registerGateway(pyxpayPix, PixBlock)
registerGateway(pyxpayCard, CardBlock)
registerGateway(commpixPix, PixBlock)

// Manual / in-person payment methods
registerGateway(manualCash, CashBlock)
registerGateway(manualTransfer, TransferBlock)
registerGateway(manualCard, CardPlaceholderBlock)
