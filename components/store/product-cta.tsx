"use client"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/i18n/context"
import Link from "@/i18n/link"
import React from "react"

export function ProductCTA() {
  const { dict } = useDictionary()
  const t = dict.cta

  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-3 my-8 md:my-12 relative z-20 max-w-5xl mx-auto bg-linear-to-br from-brand-50 to-white dark:from-brand-950/60 dark:to-neutral-950">
      <GridLineHorizontal className="top-0" offset="120px" />
      <GridLineHorizontal className="bottom-0 top-auto" offset="120px" />
      <GridLineVertical className="left-0" offset="60px" />
      <GridLineVertical className="left-auto right-0" offset="60px" />

      <div className="md:col-span-2 p-6 md:p-10">
        <h2 className="text-left text-muted-foreground text-base md:text-xl tracking-tight font-medium">
          {t.title}{" "}
          <span className="font-bold text-foreground">
            {t.titleBold}
          </span>
        </h2>
        <p className="text-left text-muted-foreground mt-3 max-w-md text-base md:text-xl tracking-tight font-medium">
          {t.desc1}{" "}
          <span className="text-brand-600 dark:text-brand-400">{t.descHighlight1}</span>{" "}
          {t.desc2}{" "}
          <span className="text-brand-600 dark:text-brand-400">{t.descHighlight2}</span>.
        </p>

        <div className="flex items-start sm:items-center flex-col sm:flex-row sm:gap-3">
          <Link
            href="/soporte"
            className="mt-5 flex space-x-2 items-center group text-sm px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white font-medium shadow-[0px_2px_0px_0px_rgba(255,255,255,0.2)_inset] transition-colors"
          >
            <span>{t.button}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:translate-x-1 transition-transform duration-200"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/donde-estamos"
            className="mt-3 sm:mt-5 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            {t.storesLink}
          </Link>
        </div>
      </div>

      <div className="border-t md:border-t-0 md:border-l border-dashed border-brand-200 dark:border-brand-900 p-6 md:p-10 flex flex-col justify-center">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-foreground">{t.warrantyTitle}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t.warrantyDesc}
        </p>
        <div className="flex items-center gap-3 mt-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            {t.spareParts}
          </span>
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            {t.fastSupport}
          </span>
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            {t.securePayment}
          </span>
        </div>
      </div>
    </section>
  )
}

const GridLineHorizontal = ({
  className,
  offset,
}: {
  className?: string
  offset?: string
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(54, 165, 60, 0.15)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px",
          "--color-dark": "rgba(95, 201, 101, 0.15)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute w-[calc(100%+var(--offset))] h-(--height) left-[calc(var(--offset)/2*-1)]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "bg-size-[var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),linear-gradient(black,black)]",
        "mask-exclude",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className
      )}
    />
  )
}

const GridLineVertical = ({
  className,
  offset,
}: {
  className?: string
  offset?: string
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(54, 165, 60, 0.15)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px",
          "--color-dark": "rgba(95, 201, 101, 0.15)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute h-[calc(100%+var(--offset))] w-(--width) top-[calc(var(--offset)/2*-1)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "bg-size-[var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),linear-gradient(black,black)]",
        "mask-exclude",
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className
      )}
    />
  )
}
