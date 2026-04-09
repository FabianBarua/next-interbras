import { getDownloads } from "@/services/downloads"
import { Breadcrumbs } from "@/components/store/breadcrumbs"

export default async function DownloadsPage() {
  const downloads = await getDownloads()

  return (
    <div className="container px-4 py-4 asd">
      <Breadcrumbs items={[{ label: "Downloads" }]} />
      
      <div className="max-w-3xl mx-auto mt-8 mb-16">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Descargas y Manuales</h1>
        <p className="text-muted-foreground mb-8">
          Encuentra toda la documentación técnica, manuales de usuario y actualizaciones de tus productos Interbras.
        </p>

        <div className="flex gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Buscar por código u nombre del producto..." 
            className="flex-1 rounded-md border h-10 px-4 focus-visible:outline-none focus:ring-2 focus:ring-primary"
          />
          <button className="px-6 h-10 bg-primary text-primary-foreground font-medium rounded-md">Buscar</button>
        </div>

        <div className="border rounded-xl divide-y">
          {downloads.map(download => (
            <div key={download.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <h3 className="font-semibold">{download.title.es}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="bg-accent px-2 py-0.5 rounded text-foreground">{download.type}</span>
                    <span>{download.fileSize || "1.0 MB"}</span>
                    <span>v{download.version || "1.0"}</span>
                  </div>
                </div>
              </div>
              
              <a 
                href={download.fileUrl} 
                className="p-2 border rounded-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-primary"
                download
                title="Descargar archivo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
