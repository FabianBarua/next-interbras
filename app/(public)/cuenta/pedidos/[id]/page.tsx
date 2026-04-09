import { getOrderById } from "@/services/orders"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function OrderDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const order = await getOrderById(id)

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cuenta/pedidos" className="p-2 border rounded-md hover:bg-muted transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          <span className="sr-only">Volver</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Pedido #{order.id.split('-')[1]}</h1>
        {order.status === "DELIVERED" && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Entregado</span>}
        {order.status === "PROCESSING" && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">En proceso</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 border rounded-2xl bg-card">
            <h2 className="font-bold mb-4">Artículos del Pedido</h2>
            <div className="space-y-4 divide-y">
              {order.items.map(item => (
                <div key={item.id} className="pt-4 first:pt-0 flex justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-muted rounded shrink-0 flex items-center justify-center text-xs">IMG</div>
                    <div>
                      <p className="font-medium line-clamp-1 text-sm">{item.productName.es}</p>
                      <p className="text-xs text-muted-foreground mt-1">Cant: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    US$ {(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border rounded-2xl bg-card">
            <h2 className="font-bold mb-4">Seguimiento</h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-primary text-primary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-card">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-sm">Pedido Recibido</div>
                    <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 border rounded-2xl bg-card">
             <h2 className="font-bold mb-4">Resumen</h2>
             <div className="space-y-2 text-sm text-muted-foreground mb-4 border-b pb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>US$ {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>US$ 0.00</span>
                </div>
             </div>
             <div className="flex justify-between items-center font-bold text-lg">
               <span>Total</span>
               <span>US$ {order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
          </div>

          <div className="p-6 border rounded-2xl bg-card text-sm">
            <h2 className="font-bold mb-4">Datos del Cliente</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Dirección de Envío</p>
                <p className="text-muted-foreground mt-1">Av. San Blas 123<br/>Ciudad del Este, Paraguay</p>
              </div>
              <div>
                <p className="font-medium">Método de Pago</p>
                <p className="text-muted-foreground mt-1">Tarjeta de Crédito terminada en 4242</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
