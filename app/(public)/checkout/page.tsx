import { getActivePaymentTypes } from "@/services/payment-types"
import { getActiveShippingMethods } from "@/services/shipping-methods"
import { CheckoutForm } from "./checkout-form"

export default async function CheckoutPage() {
  const [paymentTypes, shippingMethods] = await Promise.all([
    getActivePaymentTypes(),
    getActiveShippingMethods(),
  ])

  return <CheckoutForm paymentTypes={paymentTypes} shippingMethods={shippingMethods} />
}
