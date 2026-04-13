import { Header } from "@/components/store/header"
import { Footer } from "@/components/store/footer"
import { EcommerceProvider } from "@/components/store/ecommerce-context"
import { isEcommerceEnabled } from "@/lib/settings"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const ecommerce = await isEcommerceEnabled()

  return (
    <EcommerceProvider enabled={ecommerce}>
      <div className="flex min-h-screen flex-col">
        <Header ecommerceEnabled={ecommerce} />
        <main className="flex-1">{children}</main>
        <Footer ecommerceEnabled={ecommerce} />
      </div>
    </EcommerceProvider>
  )
}
