import { getActivePaymentTypes } from "@/services/payment-types"
import { getActiveShippingMethods } from "@/services/shipping-methods"
import { isEcommerceEnabled } from "@/lib/settings"
import { redirect } from "next/navigation"
import { CheckoutForm } from "./checkout-form"

export default async function CheckoutPage() {
  if (!(await isEcommerceEnabled())) redirect("/")

  const [paymentTypes, shippingMethods] = await Promise.all([
    getActivePaymentTypes(),
    getActiveShippingMethods(),
  ])

  return <CheckoutForm paymentTypes={paymentTypes} shippingMethods={shippingMethods} />
}
