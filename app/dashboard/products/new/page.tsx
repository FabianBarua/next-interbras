import { requireAdmin } from "@/lib/auth/get-session"
import { getAllCategoriesAdmin } from "@/services/admin/categories"
import { getAttributesWithValues } from "@/services/admin/attributes"
import { ProductCreateClient } from "./client"

export default async function ProductCreatePage() {
  await requireAdmin()
  const [categories, attributeDefs] = await Promise.all([
    getAllCategoriesAdmin(),
    getAttributesWithValues(),
  ])
  return <ProductCreateClient categories={categories} attributeDefs={attributeDefs} />
}
