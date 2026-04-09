import { categoriesMock } from "../mock/categories"
import type { Category } from "../types/category"

const DELAY = 500

export async function getCategories(): Promise<Category[]> {
  return new Promise((resolve) => setTimeout(() => resolve(categoriesMock), DELAY))
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return new Promise((resolve) => 
    setTimeout(() => {
      const category = categoriesMock.find(c => c.slug === slug)
      resolve(category || null)
    }, DELAY)
  )
}
