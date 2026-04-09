import Link from "next/link"
import Image from "next/image"
import type { Category } from "@/types/category"

export function CategoryCard({ category }: { category: Category }) {
  const name = category.name?.es || category.name?.pt || "Categoría"
  
  return (
    <Link 
      href={`/productos/${category.slug}`}
      className="group flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md transition-all duration-300 text-center"
    >
      <div className="relative w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
        {category.image ? (
          <Image 
            src={category.image} 
            alt={name} 
            width={32} 
            height={32} 
            className="object-contain filter-primary" 
          />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
        )}
      </div>
      <h3 className="font-semibold text-sm text-foreground transition-colors">{name}</h3>
    </Link>
  )
}
