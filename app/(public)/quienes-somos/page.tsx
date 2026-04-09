import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="relative w-full h-[400px] bg-primary/10 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          {/* Abstract pattern mock */}
          <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/5 -top-[300px] -right-[200px]" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 -bottom-[200px] -left-[100px]" />
        </div>
        <div className="z-10 text-center max-w-2xl px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Nuestra Historia</h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Llevando la mejor tecnología a miles de hogares desde 2010. Descubre cómo empezamos y nuestra visión hacia el futuro.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container px-4 py-16 max-w-4xl">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Más de 15 años de innovación</h2>
          <p>
            Fundada en el corazón de Ciudad del Este, Interbras nació con la convicción de que el acceso a la tecnología de calidad y con respaldo oficial no debía ser un lujo. 
            Nos convertimos en pioneros en la distribución de productos electrónicos, trabajando directamente con las marcas líderes mundiales.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 my-12 not-prose">
            <div className="p-6 rounded-2xl bg-card border text-center">
              <div className="text-4xl font-bold text-primary mb-2">+15</div>
              <div className="text-sm text-muted-foreground font-medium">Años de experiencia</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border text-center">
              <div className="text-4xl font-bold text-primary mb-2">+800</div>
              <div className="text-sm text-muted-foreground font-medium">Productos disponibles</div>
            </div>
            <div className="p-6 rounded-2xl bg-card border text-center">
              <div className="text-4xl font-bold text-primary mb-2">+500k</div>
              <div className="text-sm text-muted-foreground font-medium">Clientes satisfechos</div>
            </div>
          </div>

          <h2>Visión y Valores</h2>
          <p>
            Nuestra visión es seguir siendo el referente número uno en confianza, calidad y garantía dentro del mercado de electrónica de consumo en la región.
          </p>
          <ul>
            <li><strong>Relaciones a largo plazo:</strong> Cuidamos a nuestros clientes desde la preventa hasta la posventa.</li>
            <li><strong>Calidad asegurada:</strong> Solo trabajamos con productos oficiales.</li>
            <li><strong>Innovación:</strong> Siempre a la vanguardia de las nuevas tecnologías.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
