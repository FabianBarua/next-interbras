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
import { Heart } from "lucide-react"

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
      {/* 1. Hero Section — Brand + Product Grid */}
      {/* 1. Hero Section */}
      <section className="relative w-full overflow-hidden">
        {/* Gradient background — light & dark */}
        <div className="absolute inset-0 bg-linear-to-b from-brand-100 via-brand-50/80 to-background dark:from-brand-950 dark:via-brand-950/60 dark:to-background" />

        {/* Floating gradient orbs */}
        <div className="absolute top-[15%] left-[10%] w-72 h-72 md:w-md md:h-112 bg-brand-400/30 dark:bg-brand-500/10 rounded-full blur-3xl animate-[hero-float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] right-[8%] w-64 h-64 md:w-96 md:h-96 bg-brand-500/25 dark:bg-brand-400/8 rounded-full blur-3xl animate-[hero-float_10s_ease-in-out_infinite_-3s]" />
        <div className="absolute top-[40%] right-[25%] w-48 h-48 bg-brand-300/25 dark:bg-brand-600/8 rounded-full blur-2xl animate-[hero-float_7s_ease-in-out_infinite_-5s]" />

        {/* Dot grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.12)_1px,transparent_1px)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_80%_70%_at_50%_50%,black_30%,transparent_100%)]" />

        {/* Decorative rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 md:w-225 md:h-225 rounded-full border border-brand-500/15 dark:border-brand-400/6" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 md:w-162.5 md:h-162.5 rounded-full border border-brand-500/10 dark:border-brand-400/4" />

        {/* Content */}
        <div className="relative container flex flex-col items-center text-center py-24 md:py-36 lg:py-44">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-200 dark:border-brand-800/50 bg-brand-500 dark:bg-brand-950/60 text-white dark:text-brand-400 text-xs font-semibold mb-6 backdrop-blur-sm shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white dark:bg-brand-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white dark:bg-brand-500" />
            </span>
            Interbras - {t.warranty}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground max-w-3xl leading-[1.05]">
            {t.heroTitle}
          </h1>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/productos"
              className="group relative inline-flex h-12 items-center justify-center rounded-xl bg-brand-500 px-8 text-sm font-bold text-white overflow-hidden transition-all hover:bg-brand-400 shadow-lg shadow-brand-500/25 hover:shadow-brand-400/35 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent pointer-events-none" />
              <span className="relative">{t.viewCatalog}</span>
            </Link>
            <Link
              href="/quienes-somos"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background/60 backdrop-blur-sm px-8 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-brand-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.aboutUs}
            </Link>
          </div>
        </div>

        {/* Bottom separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-brand-500/20 to-transparent" />
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
        <div className="relative w-full rounded-2xl md:rounded-[2rem] overflow-hidden border border-brand-800/50 shadow-sm bg-linear-to-br from-brand-950 via-brand-900 to-brand-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_50%,rgba(54,165,60,0.2),transparent)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-brand-500/30 to-transparent" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {newProducts.slice(0, 10).map(product => (
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
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">{t.onlineStore}</h3>
              <p className="text-muted-foreground text-sm">{t.onlineStoreDesc}</p>
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
