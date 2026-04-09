import { getUserProfile } from "@/services/user"
import { User, ShieldCheck } from "lucide-react"

export default async function AccountProfilePage() {
  const profile = await getUserProfile()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Administra tu información personal y parámetros de seguridad.</p>
      </div>
      
      {/* Información Personal */}
      <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/20 px-6 sm:px-8 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold">Información Personal</h2>
        </div>
        
        <form className="p-6 sm:p-8 space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Completo</label>
              <input type="text" className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" defaultValue={profile.name} />
            </div>
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</label>
              <input type="text" className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" defaultValue={profile.phone || ""} />
            </div>
          </div>
          
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo electrónico</label>
            <input type="email" className="w-full h-11 rounded-xl border border-input bg-muted/40 px-4 text-sm text-muted-foreground cursor-not-allowed outline-none" defaultValue={profile.email} disabled />
            <p className="text-[11px] text-muted-foreground/80 mt-1 font-medium pl-1">Para cambiar tu correo debes contactar a soporte por motivos de seguridad.</p>
          </div>

          <div className="pt-4 flex justify-end">
             <button type="button" className="px-8 h-11 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-xs hover:shadow-md hover:scale-[1.02] duration-200">
               Guardar Cambios
             </button>
          </div>
        </form>
      </div>

      {/* Seguridad */}
      <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/20 px-6 sm:px-8 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold">Seguridad y Contraseña</h2>
        </div>
        
        <form className="p-6 sm:p-8 space-y-6 max-w-2xl">
           <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contraseña Actual</label>
              <input type="password" placeholder="••••••••" className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
            </div>
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nueva Contraseña</label>
              <input type="password" placeholder="Mínimo 8 caracteres" className="w-full h-11 rounded-xl border border-input bg-background/50 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
            </div>
            <div className="pt-4">
               <button type="button" className="px-8 h-11 border border-input font-bold rounded-xl hover:bg-muted transition-colors shadow-xs hover:shadow-xs hover:scale-[1.01] duration-200">
                 Actualizar Contraseña
               </button>
            </div>
        </form>
      </div>
    </div>
  )
}
