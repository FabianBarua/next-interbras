import Image from "next/image"
import Link from "@/i18n/link"
import { getFeaturedProducts, getNewProducts } from "@/services/products"
import { getCategories } from "@/services/categories"

export const dynamic = "force-dynamic"
import { ProductCarousel } from "@/components/store/product-carousel"
import { ProductCard } from "@/components/store/product-card"
import { CategoryCard } from "@/components/store/category-card"
import { SectionHeader } from "@/components/store/section-header"
import { NewsletterSection } from "@/components/store/newsletter-section"
import { getDictionary } from "@/i18n/get-dictionary"

export default async function HomePage() {
  const [featuredProducts, newProducts, categories, dict] = await Promise.all([
    getFeaturedProducts(),
    getNewProducts(),
    getCategories(),
    getDictionary(),
  ])

  const t = dict.home

  return (
    <div className="flex flex-col gap-10 md:gap-16 mb-20">
      {/* 1. Hero Section — Brand General */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-[#0a0a0a]">
        {/* Gradient overlays */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(54,165,60,0.3),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(36,113,41,0.15),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
        </div>

        <div className="container relative z-10 flex flex-col items-center text-center py-20 md:py-28 lg:py-32 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-medium mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            {t.heroTitle.split(' ').slice(0, 3).join(' ')}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-3xl leading-[1.1]">
            {t.heroTitle}
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/60 max-w-xl leading-relaxed">
            {t.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/productos"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-brand-500 px-8 text-sm font-bold text-white transition-all hover:bg-brand-600 shadow-lg shadow-brand-500/30"
            >
              {t.viewCatalog}
            </Link>
            <Link
              href="/donde-estamos"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-brand-500/25 px-8 text-sm font-medium text-white/80 transition-all hover:bg-brand-500/10 hover:text-white hover:border-brand-500/40"
            >
              {t.ourStores}
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-brand-300/60">
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              {t.officialWarranty}
            </span>
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
              {t.nationwideShipping}
            </span>
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              {t.physicalStores}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Categorías Destacadas */}
      <section className="container">
        <SectionHeader 
          title={t.newCategories} 
          viewAllLink="/productos"
        />
        <div className="grid grid-cols-2 lg:grid-cols-6 md:grid-cols-3 gap-4">
          {categories.slice(0, 6).map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* 3. Productos Destacados */}
      <section className="container">
        <SectionHeader 
          title={t.featuredProducts} 
          subtitle={t.featuredDesc}
          viewAllLink="/productos"
        />
        <ProductCarousel products={featuredProducts} />
      </section>

      {/* 4. Promotional Banner */}
      <section className="container">
        <div className="relative w-full rounded-2xl md:rounded-[2rem] overflow-hidden border border-brand-800/50 shadow-sm bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_50%,rgba(54,165,60,0.2),transparent)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 px-8 md:px-14 py-12 md:py-14">
            <div className="max-w-lg space-y-3 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{t.electricMobility}</h3>
              <p className="text-base text-white/60">{t.electricMobilityDesc}</p>
            </div>
            <Link
              href="/productos/scooters"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-8 text-sm font-semibold text-white transition-colors hover:bg-brand-600 shadow-lg shadow-brand-500/25 shrink-0"
            >
              {t.viewScooters}
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Nuevos Productos */}
      <section className="container">
        <SectionHeader 
          title={t.recentArrivals} 
          viewAllLink="/productos"
        />
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {newProducts.slice(0, 8).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. Why Choose Us */}
      <section className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border bg-card hover:border-brand-500/50 hover:shadow-md hover:shadow-brand-500/5 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">{t.warranty}</h3>
              <p className="text-muted-foreground text-sm">{t.warrantyDesc}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border bg-card hover:border-brand-500/50 hover:shadow-md hover:shadow-brand-500/5 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">{t.stores}</h3>
              <p className="text-muted-foreground text-sm">{t.storesDesc}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border bg-card hover:border-brand-500/50 hover:shadow-md hover:shadow-brand-500/5 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">{t.fastShipping}</h3>
              <p className="text-muted-foreground text-sm">{t.fastShippingDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Newsletter */}
      <NewsletterSection />
    </div>
  )
}
