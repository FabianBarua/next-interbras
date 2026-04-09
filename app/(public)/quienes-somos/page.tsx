import Image from "next/image"
import { getDictionary } from "@/i18n/get-dictionary"

export default async function AboutPage() {
  const dict = await getDictionary()

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="relative w-full h-[400px] bg-primary/10 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          {/* Abstract pattern mock */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/5 -top-[300px] -right-[200px]" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 -bottom-[200px] -left-[100px]" />
        </div>
        <div className="z-10 text-center max-w-2xl px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{dict.about.heroTitle}</h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            {dict.about.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container px-4 py-16 max-w-4xl">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>{dict.about.innovationTitle}</h2>
          <p>
            {dict.about.innovationText}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 my-12 not-prose">
            <div className="p-6 rounded-2xl bg-card border text-center">
              <div className="text-4xl font-bold text-primary mb-2">+15</div>
              <div className="text-sm text-muted-foreground font-medium">{dict.about.years}</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border text-center">
              <div className="text-4xl font-bold text-primary mb-2">+800</div>
              <div className="text-sm text-muted-foreground font-medium">{dict.about.productsCount}</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border text-center">
              <div className="text-4xl font-bold text-primary mb-2">+500k</div>
              <div className="text-sm text-muted-foreground font-medium">{dict.about.customers}</div>
            </div>
          </div>

          <h2>{dict.about.visionTitle}</h2>
          <p>
            {dict.about.visionText}
          </p>
          <ul>
            <li><strong>{dict.about.longTermRelationships}</strong> {dict.about.longTermRelationshipsDesc}</li>
            <li><strong>{dict.about.assuredQuality}</strong> {dict.about.assuredQualityDesc}</li>
            <li><strong>{dict.about.innovation}</strong> {dict.about.innovationDesc}</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
