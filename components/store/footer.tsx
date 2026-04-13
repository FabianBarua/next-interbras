import Link from "@/i18n/link"
import { getDictionary } from "@/i18n/get-dictionary"
import { LanguageSwitcherInline } from "./language-switcher"

export async function Footer({ ecommerceEnabled = false }: { ecommerceEnabled?: boolean }) {
  const dict = await getDictionary()
  const t = dict.footer

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 px-4 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <h3 className="font-bold tracking-tight text-xl text-primary">Interbras</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.description}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">{t.categories}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/productos/tvs" className="hover:text-primary transition-colors">{t.tvs}</Link></li>
              <li><Link href="/productos/scooters" className="hover:text-primary transition-colors">{t.scooters}</Link></li>
              <li><Link href="/productos/airfryer" className="hover:text-primary transition-colors">{t.electroHome}</Link></li>
              <li><Link href="/productos" className="hover:text-primary transition-colors">{t.viewAll}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">{t.institutional}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/quienes-somos" className="hover:text-primary transition-colors">{t.aboutUs}</Link></li>

              <li><Link href="/downloads" className="hover:text-primary transition-colors">{t.downloads}</Link></li>
              <li><Link href="/contacto" className="hover:text-primary transition-colors">{t.contact}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">{t.customerService}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {ecommerceEnabled && (
                <li><Link href="/cuenta/pedidos" className="hover:text-primary transition-colors">{t.myOrders}</Link></li>
              )}
              <li><Link href="/terminos" className="hover:text-primary transition-colors">{t.terms}</Link></li>
              <li><Link href="/garantia" className="hover:text-primary transition-colors">{t.warranty}</Link></li>
              <li><a href="mailto:contacto@interbras.com" className="hover:text-primary transition-colors">contacto@interbras.com</a></li>
            </ul>
          </div>
          
        </div>
        
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>{t.copyright.replace("{year}", new Date().getFullYear().toString())}</p>
          <div className="flex items-center gap-6">
            <LanguageSwitcherInline />
            <span>{t.madeWith}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
