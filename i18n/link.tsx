"use client"

import NextLink from "next/link"
import { forwardRef } from "react"
import type { ComponentProps } from "react"
import { useDictionary } from "./context"
import { localePath } from "./paths"

type LinkProps = ComponentProps<typeof NextLink>

const LOCALE_RE = /^\/(es|pt)(\/|$)/

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function LocaleLink(
  { href, ...props },
  ref,
) {
  const { locale } = useDictionary()

  const prefixPath = (path: string) =>
    LOCALE_RE.test(path) ? path : localePath(path, locale)

  let resolved = href
  if (typeof href === "string" && href.startsWith("/")) {
    resolved = prefixPath(href)
  } else if (
    typeof href === "object" &&
    typeof href.pathname === "string" &&
    href.pathname.startsWith("/")
  ) {
    resolved = { ...href, pathname: prefixPath(href.pathname) }
  }

  return <NextLink ref={ref} href={resolved} {...props} />
})

export default Link
