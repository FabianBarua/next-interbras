import { requireAdmin } from "@/lib/auth/get-session"
import { getAllVariantsGlobal } from "@/services/admin/variants-global"
import { getAllCategoriesAdmin } from "@/services/admin/categories"
import { VariantsGlobalClient } from "./client"

export default async function VariantesGlobalPage({ searchParams }: { searchParams: Promise<{ search?: string; categoryId?: string }> }) {
  await requireAdmin()
  const sp = await searchParams
  const [variants, categories] = await Promise.all([
    getAllVariantsGlobal({ search: sp.search, categoryId: sp.categoryId }),
    getAllCategoriesAdmin(),
  ])
  return <VariantsGlobalClient initialVariants={variants} categories={categories} search={sp.search ?? ""} categoryId={sp.categoryId ?? ""} />
}
