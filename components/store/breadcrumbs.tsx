"use client"

import Link from "@/i18n/link"
import React from "react"
import { useDictionary } from "@/i18n/context"

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const { dict } = useDictionary()

  return (
    <nav aria-label="Breadcrumb" className="my-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="hover:text-primary transition-colors">{dict.nav.home}</Link>
        </li>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li className="select-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </li>
            <li aria-current={index === items.length - 1 ? "page" : undefined}>
              {item.href ? (
                <Link href={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{item.label}</span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  )
}
