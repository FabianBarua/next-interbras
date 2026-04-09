import { Inter, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { StoreProviders } from "@/store/providers"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontSans.variable, fontMono.variable, "font-sans")}  
    >
      <body>
        <ThemeProvider>
          <StoreProviders>
            {children}
            <Toaster />
          </StoreProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
