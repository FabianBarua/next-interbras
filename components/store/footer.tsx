import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 px-4 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <h3 className="font-bold tracking-tight text-xl text-primary">Interbras</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu tienda de electrónica de confianza. Ofrecemos los mejores productos con garantía.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Categorías</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/productos/tvs" className="hover:text-primary transition-colors">Televisores</Link></li>
              <li><Link href="/productos/scooters" className="hover:text-primary transition-colors">Scooters</Link></li>
              <li><Link href="/productos/airfryer" className="hover:text-primary transition-colors">Electro Hogar</Link></li>
              <li><Link href="/productos" className="hover:text-primary transition-colors">Ver todas</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Institucional</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/quienes-somos" className="hover:text-primary transition-colors">Quiénes Somos</Link></li>
              <li><Link href="/donde-estamos" className="hover:text-primary transition-colors">Dónde Estamos</Link></li>
              <li><Link href="/downloads" className="hover:text-primary transition-colors">Descargas y Manuales</Link></li>
              <li><Link href="/contacto" className="hover:text-primary transition-colors">Contacto</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Atención al Cliente</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/cuenta/pedidos" className="hover:text-primary transition-colors">Mis Pedidos</Link></li>
              <li><Link href="/terminos" className="hover:text-primary transition-colors">Términos y Condiciones</Link></li>
              <li><Link href="/garantia" className="hover:text-primary transition-colors">Políticas de Garantía</Link></li>
              <li><a href="mailto:contacto@interbras.com" className="hover:text-primary transition-colors">contacto@interbras.com</a></li>
            </ul>
          </div>
          
        </div>
        
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Interbras. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span>Desarrollado con ♥ por el equipo de tecnología</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
