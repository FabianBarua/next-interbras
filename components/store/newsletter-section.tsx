export function NewsletterSection() {
  return (
    <section className="bg-primary/5 py-16 md:py-24 border-y">
      <div className="container px-4 max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Únete a nuestro Newsletter</h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Recibe las mejores ofertas y novedades exclusivas de Interbras antes que nadie.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input 
            type="email" 
            placeholder="Tu correo electrónico" 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
          <button className="h-10 px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap">
            Suscribirme
          </button>
        </div>
      </div>
    </section>
  )
}
