"use client"

import Link from "@/i18n/link"
import Image from "next/image"
import type { Category } from "@/types/category"
import { useDictionary } from "@/i18n/context"
import { CategoryIcon } from "./category-icon"

export function CategoryCard({ category }: { category: Category }) {
  const { locale } = useDictionary()
  const name = category.name?.[locale] || category.name?.es || "Categoría"
  
  return (
    <Link 
      href={`/productos/${category.slug}`}
      className="group flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border border-border bg-card hover:border-brand-500 hover:shadow-md hover:shadow-brand-500/10 transition-all duration-300 text-center"
    >
      <div className="relative w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-500/15 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:bg-brand-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
        {category.image ? (
          <Image 
            src={category.image} 
            alt={name} 
            width={32} 
            height={32} 
            className="object-contain filter-primary" 
          />
        ) : (
          <CategoryIcon svgIcon={category.svgIcon} size={32} />
        )}
      </div>
      <h3 className="font-semibold text-sm text-foreground transition-colors">{name}</h3>
    </Link>
  )
}
