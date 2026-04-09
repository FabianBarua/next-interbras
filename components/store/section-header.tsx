import Link from "@/i18n/link"
import { getDictionary } from "@/i18n/get-dictionary"

export async function SectionHeader({ title, subtitle, viewAllLink }: { title: string; subtitle?: string; viewAllLink?: string }) {
  const dict = await getDictionary()

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}<span className="inline-block w-12 h-1 bg-brand-500 rounded-full ml-3 align-middle" /></h2>
        {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
      </div>
      {viewAllLink && (
        <Link href={viewAllLink} className="text-sm font-medium text-primary hover:underline group flex items-center gap-1">
          {dict.common.viewAll}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </Link>
      )}
    </div>
  )
}
