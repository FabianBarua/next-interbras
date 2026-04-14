import { NextRequest, NextResponse } from "next/server"
import { getPaymentOptionsForMethod } from "@/services/countries"

export async function GET(req: NextRequest) {
  const shippingMethodId = req.nextUrl.searchParams.get("shippingMethodId")
  if (!shippingMethodId) {
    return NextResponse.json([], { status: 400 })
  }

  const options = await getPaymentOptionsForMethod(shippingMethodId)
  return NextResponse.json(options)
}
