import Link from "@/i18n/link"
import { Breadcrumbs } from "@/components/store/breadcrumbs"
import { getDictionary } from "@/i18n/get-dictionary"

export default async function SoportePage() {
  const dict = await getDictionary()

  const options = [
    {
      title: dict.support.downloadsTitle,
      desc: dict.support.downloadsDesc,
      href: "/downloads",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      ),
    },
    {
      title: dict.support.faqTitle,
      desc: dict.support.faqDesc,
      href: "/soporte",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
      ),
    },
    {
      title: dict.support.storesTitle,
      desc: dict.support.storesDesc,
      href: "/contacto",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      ),
    },
    {
      title: dict.support.contactTitle,
      desc: dict.support.contactDesc,
      href: "/contacto",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      ),
    },
  ]

  return (
    <div className="container px-4 py-4">
      <Breadcrumbs items={[{ label: dict.nav.support }]} />

      <div className="max-w-3xl mx-auto mt-8 mb-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{dict.nav.support}</h1>
        <p className="text-muted-foreground mb-10">
          {dict.support.subtitle}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {options.map((opt) => (
            <Link
              key={opt.title}
              href={opt.href}
              className="group flex gap-4 rounded-xl border p-5 transition-colors hover:bg-muted/50 hover:border-primary/30"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                {opt.icon}
              </div>
              <div>
                <h2 className="font-semibold mb-1">{opt.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{opt.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
