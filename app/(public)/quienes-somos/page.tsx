import Link from "@/i18n/link"
import { getDictionary } from "@/i18n/get-dictionary"
import { Breadcrumbs } from "@/components/store/breadcrumbs"

export default async function AboutPage() {
  const dict = await getDictionary()
  const t = dict.about

  return (
    <div className="flex flex-col">
      {/* ── Hero — editorial split ── */}
      <section className="relative w-full overflow-hidden border-b border-border/50">
        {/* Subtle background tint */}
        <div className="absolute inset-0 bg-linear-to-br from-brand-50/60 via-background to-brand-50/30 dark:from-brand-950/40 dark:via-background dark:to-brand-950/20" />

        {/* Accent glow — right side */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-brand-400/8 to-transparent dark:from-brand-500/5" />

        <div className="relative container py-8 md:py-12">
          <Breadcrumbs items={[{ label: dict.nav.aboutUs }]} />

          <div className="grid md:grid-cols-[1fr,auto] gap-6 md:gap-12 items-end mt-4 md:mt-6">
            {/* Left — main text */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[11px] font-bold uppercase tracking-widest mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                {t.badge}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1] mb-4">
                {t.heroTitle}
              </h1>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
                {t.heroSubtitle}
              </p>
            </div>

            {/* Right — large year stamp */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[80px] lg:text-[100px] font-black leading-none text-brand-500/10 dark:text-brand-400/8 select-none">
                &apos;15
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats — overlapping cards ── */}
      <section className="relative -mt-8 z-10">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {[
              { value: "+10", label: t.statYears, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { value: "+100", label: t.statProducts, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
              { value: "17", label: t.statCategories, icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
              { value: "100%", label: t.statWarranty, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group relative rounded-2xl border bg-card/90 backdrop-blur-sm p-5 md:p-7 text-center hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300"
              >
                <div className="mx-auto mb-2 w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={stat.icon} /></svg>
                </div>
                <div className="text-2xl md:text-3xl font-black text-foreground mb-0.5">{stat.value}</div>
                <div className="text-[11px] md:text-xs text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="container py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">{t.storyTag}</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6 leading-tight">{t.storyTitle}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t.storyP1}</p>
              <p>{t.storyP2}</p>
            </div>
          </div>

          {/* Visual timeline */}
          <div className="relative pl-8 border-l-2 border-brand-200 dark:border-brand-800/50 space-y-8">
            {[
              { year: "2015", text: t.timeline2015 },
              { year: "2018", text: t.timeline2018 },
              { year: "2021", text: t.timeline2021 },
              { year: "2025", text: t.timeline2025 },
            ].map((item) => (
              <div key={item.year} className="relative">
                <div className="absolute -left-[calc(1rem+5px)] top-0.5 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-background" />
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{item.year}</span>
                <p className="text-sm text-muted-foreground mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission / Vision ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-brand-50/50 to-transparent dark:from-brand-950/30 dark:to-transparent" />
        <div className="relative container py-20 md:py-28">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">{t.purposeTag}</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{t.purposeTitle}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Mission */}
            <div className="group relative rounded-3xl border bg-card/60 backdrop-blur-sm p-8 md:p-10 hover:border-brand-500/30 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-400/10 dark:bg-brand-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-500" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{t.missionTitle}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.missionText}</p>
              </div>
            </div>

            {/* Vision */}
            <div className="group relative rounded-3xl border bg-card/60 backdrop-blur-sm p-8 md:p-10 hover:border-brand-500/30 transition-all duration-300 overflow-hidden">
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand-300/10 dark:bg-brand-600/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 group-hover:scale-125 transition-transform duration-500" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{t.visionTitle}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.visionText}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="container py-20 md:py-28">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">{t.valuesTag}</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{t.valuesTitle}</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", title: t.value1Title, desc: t.value1Desc },
            { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: t.value2Title, desc: t.value2Desc },
            { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: t.value3Title, desc: t.value3Desc },
            { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", title: t.value4Title, desc: t.value4Desc },
            { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z", title: t.value5Title, desc: t.value5Desc },
            { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", title: t.value6Title, desc: t.value6Desc },
          ].map((v) => (
            <div
              key={v.title}
              className="group flex flex-col p-7 rounded-2xl border bg-card hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={v.icon} /></svg>
              </div>
              <h3 className="font-bold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container pb-24 md:pb-32">
        <div className="relative rounded-3xl overflow-hidden border border-brand-800/50 bg-linear-to-br from-brand-950 via-brand-900 to-brand-950 p-10 md:p-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(54,165,60,0.15),transparent)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-brand-500/30 to-transparent" />

          <div className="relative max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t.ctaTitle}</h2>
            <p className="text-white/60 mb-8">{t.ctaSubtitle}</p>
            <Link
              href="/productos"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-500 px-8 text-sm font-bold text-white transition-all hover:bg-brand-400 shadow-lg shadow-brand-500/25 hover:shadow-brand-400/35 hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.ctaButton}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
