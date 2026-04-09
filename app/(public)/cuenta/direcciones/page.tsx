import { getAddresses } from "@/services/user"

export default async function AddressesPage() {
  const addresses = await getAddresses()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mis Direcciones</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors">
          Nueva Dirección
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {addresses.map(addr => (
          <div key={addr.id} className={`p-6 sm:p-8 rounded-3xl border bg-card relative shadow-xs hover:shadow-sm ring-1 ring-black/5 dark:ring-white/5 transition-all ${addr.isDefault ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}>
            {addr.isDefault && (
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded">
                Principal
              </span>
            )}
            
            <h3 className="font-bold mb-2">{addr.name}</h3>
            
            <div className="space-y-1 text-sm text-muted-foreground mb-6">
              <p>{addr.street}</p>
              <p>{addr.city}, {addr.state}</p>
              <p>{addr.country} - {addr.zipCode}</p>
            </div>
            
            <div className="flex gap-3">
              <button className="text-sm font-medium text-primary hover:underline">Editar</button>
              <button className="text-sm font-medium text-destructive hover:underline">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
