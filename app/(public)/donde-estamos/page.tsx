import { getStores } from "@/services/stores"
import { Breadcrumbs } from "@/components/store/breadcrumbs"

export default async function StoresPage() {
  const stores = await getStores()

  return (
    <div className="container px-4 py-8">
      <Breadcrumbs items={[{ label: "Dónde Estamos" }]} />
      
      <div className="mt-8 mb-16">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Nuestras Sucursales</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {stores.map(store => (
              <div key={store.id} className="p-6 rounded-2xl border bg-card hover:border-primary transition-colors cursor-pointer">
                <h3 className="text-xl font-bold text-primary mb-4">{store.name}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{store.address}, {store.city}, {store.country}</span>
                  </div>
                  
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span>{store.phone}</span>
                  </div>
                  
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>{store.businessHours.es}</span>
                  </div>
                </div>
                
                <button className="mt-6 w-full px-4 text-sm py-2 font-semibold text-primary border border-primary rounded-md hover:bg-primary/5 transition-colors">
                  Ver en Google Maps
                </button>
              </div>
            ))}
          </div>
          
          <div className="w-full h-[500px] lg:h-auto rounded-2xl bg-muted relative overflow-hidden flex items-center justify-center border">
            {/* Map Placeholder */}
            <div className="text-center p-6 space-y-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-primary opacity-50"><map name="map-1"/><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
              <p className="text-lg font-medium text-muted-foreground">Mapa Interactivo no disponible en preview mock</p>
            </div>
            
            {/* FAKE MAP DOTS */}
            <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-primary rounded-full animate-pulse border-2 border-white shadow-lg" title="CDE" />
            <div className="absolute bottom-1/4 left-1/4 w-4 h-4 bg-primary rounded-full animate-pulse border-2 border-white shadow-lg" title="ASU" />
          </div>
        </div>
      </div>
    </div>
  )
}
