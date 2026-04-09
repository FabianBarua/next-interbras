import Image from "next/image"
import Link from "next/link"
import { getFeaturedProducts, getNewProducts } from "@/services/products"
import { getCategories } from "@/services/categories"
import { ProductCarousel } from "@/components/store/product-carousel"
import { ProductCard } from "@/components/store/product-card"
import { CategoryCard } from "@/components/store/category-card"
import { SectionHeader } from "@/components/store/section-header"
import { NewsletterSection } from "@/components/store/newsletter-section"

export default async function HomePage() {
  const [featuredProducts, newProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getNewProducts(),
    getCategories(),
  ])

  return (
    <div className="flex flex-col gap-10 md:gap-16 mb-20">
      {/* 1. Hero Section — Brand General */}
      <section className="relative w-full overflow-hidden bg-[#0a0a0a]">
        {/* Gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.25),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        <div className="container relative z-10 flex flex-col items-center text-center py-20 md:py-28 lg:py-32 px-4">
          <Image
            src="/logo.svg"
            alt="Interbras"
            width={180}
            height={50}
            className="mb-8 opacity-90"
            priority
          />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-3xl leading-[1.1]">
            Tecnología que transforma tu hogar
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white/60 max-w-xl leading-relaxed">
            Electrónica, electrodomésticos y movilidad eléctrica con garantía oficial en Paraguay.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              href="/productos"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              Ver Catálogo
            </Link>
            <Link
              href="/donde-estamos"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 px-8 text-sm font-medium text-white/80 transition-all hover:bg-white/5 hover:text-white"
            >
              Nuestras Sucursales
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              Garantía Oficial
            </span>
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
              Envíos a Todo el País
            </span>
            <span className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              3 Sucursales Físicas
            </span>
          </div>
        </div>
      </section>

      {/* 2. Categorías Destacadas */}
      <section className="container">
        <SectionHeader 
          title="Nuevas Categorías" 
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
          title="Productos Destacados" 
          subtitle="Nuestra selección de los mejores productos"
          viewAllLink="/productos"
        />
        <ProductCarousel products={featuredProducts} />
      </section>

      {/* 4. Promotional Banner */}
      <section className="container">
        <div className="relative w-full rounded-2xl md:rounded-[2rem] overflow-hidden border shadow-sm bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_80%_50%,hsl(var(--primary)/0.15),transparent)]" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 px-8 md:px-14 py-12 md:py-14">
            <div className="max-w-lg space-y-3 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Movilidad Eléctrica</h3>
              <p className="text-base text-white/60">Scooters, hoverboards y patinetas: la forma más divertida de moverse por la ciudad.</p>
            </div>
            <Link
              href="/productos/scooters"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-black transition-colors hover:bg-white/90 shrink-0"
            >
              Ver Scooters
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Nuevos Productos */}
      <section className="container">
        <SectionHeader 
          title="Llegadas Recientes" 
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
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
            <div className="w-14 h-14 rounded-full bg-brand-50 text-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Garantía Asegurada</h3>
              <p className="text-muted-foreground text-sm">Todos nuestros productos cuentan con garantía oficial de fábrica para tu tranquilidad.</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
            <div className="w-14 h-14 rounded-full bg-brand-50 text-primary flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Tiendas Físicas</h3>
              <p className="text-muted-foreground text-sm">Visítanos y vive la experiencia Interbras en nuestras modernas sucursales.</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
            <div className="w-14 h-14 rounded-full bg-brand-50 text-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Envíos Rápidos</h3>
              <p className="text-muted-foreground text-sm">Enviamos tus compras de forma exprés y segura a todo el país.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Newsletter */}
      <NewsletterSection />
    </div>
  )
}
