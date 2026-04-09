import { Inter, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { StoreProviders } from "@/store/providers"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { getDictionary, getLocale } from "@/i18n/get-dictionary"
import { DictionaryProvider } from "@/i18n/context"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const dictionary = await getDictionary()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn("antialiased", fontSans.variable, fontMono.variable, "font-sans")}  
    >
      <body>
        <ThemeProvider>
          <StoreProviders>
            <DictionaryProvider dictionary={dictionary} locale={locale}>
              {children}
              <Toaster />
            </DictionaryProvider>
          </StoreProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
