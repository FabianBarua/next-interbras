import { getUserProfile } from "@/services/user"

export default async function AccountProfilePage() {
  const profile = await getUserProfile()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
      
      <div className="p-6 border rounded-2xl bg-card border-l-4 border-l-primary shadow-sm">
        <form className="space-y-6 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre Completo</label>
              <input type="text" className="w-full h-10 rounded-md border px-3 text-sm" defaultValue={profile.name} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <input type="text" className="w-full h-10 rounded-md border px-3 text-sm" defaultValue={profile.phone || ""} />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Correo electrónico</label>
            <input type="email" className="w-full h-10 rounded-md border px-3 text-sm bg-muted text-muted-foreground" defaultValue={profile.email} disabled />
            <p className="text-xs text-muted-foreground">Para cambiar tu correo debes contactar a soporte.</p>
          </div>

          <div className="pt-4 border-t flex justify-end">
             <button type="button" className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-md">
               Guardar Cambios
             </button>
          </div>
        </form>
      </div>

      <div className="p-6 border rounded-2xl bg-card">
        <h2 className="text-lg font-bold mb-4">Cambiar Contraseña</h2>
        <form className="space-y-4 max-w-xl">
           <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña Actual</label>
              <input type="password" className="w-full h-10 rounded-md border px-3 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nueva Contraseña</label>
              <input type="password" className="w-full h-10 rounded-md border px-3 text-sm" />
            </div>
            <div className="pt-2">
               <button type="button" className="px-6 py-2 border font-medium rounded-md hover:bg-muted transition-colors">
                 Actualizar Contraseña
               </button>
            </div>
        </form>
      </div>
    </div>
  )
}
