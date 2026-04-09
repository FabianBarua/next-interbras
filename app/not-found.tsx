import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-9xl font-black text-primary/10 tracking-tighter mb-4">404</div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Página no encontrada</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/"
          className="h-12 px-8 flex items-center justify-center bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors"
        >
          Volver al Inicio
        </Link>
        <Link 
          href="/productos"
          className="h-12 px-8 flex items-center justify-center border font-semibold rounded-md hover:bg-accent transition-colors"
        >
          Ver Productos
        </Link>
      </div>
    </div>
  )
}
