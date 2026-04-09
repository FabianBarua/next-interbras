import { getDictionary } from "@/i18n/get-dictionary"

export async function NewsletterSection() {
  const dict = await getDictionary()
  const t = dict.newsletter

  return (
    <section className="bg-brand-50 dark:bg-brand-950/30 py-16 md:py-24 border-y border-brand-100 dark:border-brand-900/50">
      <div className="container px-4 max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-brand-900 dark:text-brand-100">{t.title}</h2>
        <p className="mt-4 text-brand-700/70 dark:text-brand-300/60 text-lg">
          {t.description}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input 
            type="email" 
            placeholder={t.placeholder}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
          <button className="h-10 px-6 py-2 bg-brand-600 text-white font-medium rounded-md hover:bg-brand-700 transition-colors whitespace-nowrap shadow-sm">
            {t.subscribe}
          </button>
        </div>
      </div>
    </section>
  )
}
