import { getOrderByIdPublic } from "@/services/orders"
import { notFound } from "next/navigation"
import { OrderTracker } from "@/components/store/order-tracker"
import Link from "next/link"
import Image from "next/image"

export default async function PublicTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const order = await getOrderByIdPublic(id)

  if (!order) return notFound()

  return (
    <div className="container max-w-3xl px-4 py-16 min-h-[60vh] flex flex-col items-center">
      <div className="w-full bg-card rounded-3xl border shadow-xl overflow-hidden">
        {/* Header Branding */}
        <div className="bg-primary/5 border-b p-6 md:p-8 flex flex-col items-center text-center gap-4">
           <Image src="/logo.svg" alt="Interbras" width={160} height={45} className="dark:invert" />
           <h1 className="text-xl md:text-2xl font-black tracking-tight">Seguimiento de Pedido</h1>
           <p className="text-sm text-foreground font-mono bg-background px-4 py-1.5 rounded-full border shadow-sm">
             ID: {order.id}
           </p>
        </div>

        {/* Payload */}
        <div className="p-6 md:p-12 space-y-12">
           <OrderTracker 
             status={order.status} 
             dateStr={new Date(order.updatedAt).toLocaleDateString("es-PY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} 
           />
           
           <div className="w-full bg-muted/30 rounded-2xl p-5 border text-sm text-center">
             <p className="text-muted-foreground font-medium">Este es un enlace seguro de seguimiento público. No contiene direcciones exactas ni información de facturación por motivos de privacidad.</p>
           </div>
        </div>
      </div>
      
      <Link href="/" className="mt-10 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
        &larr; Volver a la Tienda
      </Link>
    </div>
  )
}
