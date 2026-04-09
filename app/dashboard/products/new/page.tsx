import { requireAdmin } from "@/lib/auth/get-session"
import { getAllCategoriesAdmin } from "@/services/admin/categories"
import { ProductCreateClient } from "./client"

export default async function ProductCreatePage() {
  await requireAdmin()
  const categories = await getAllCategoriesAdmin()
  return <ProductCreateClient categories={categories} />
}
