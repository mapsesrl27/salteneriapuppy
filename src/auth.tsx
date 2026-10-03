import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
type Perfil = { id: string; nombre: string; rol: 'admin' | 'empleado'; activo: boolean }
type Ctx = { listo: boolean; perfil: Perfil | null; can: (p: string) => boolean; salir: () => void; recargar: () => void }
const A = createContext<Ctx>(null as unknown as Ctx)
export const useAuth = () => useContext(A)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [perm, setPerm] = useState<Set<string>>(new Set())
  const [listo, setListo] = useState(false)
  async function cargar() {
    try {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session) { setPerfil(null); localStorage.removeItem('perfil_cache') }
      else {
        const uid = s.session.user.id
        const { data: p } = await supabase.from('perfiles').select('*').eq('id', uid).maybeSingle()
        const { data: pe } = await supabase.from('permisos_usuario').select('permiso').eq('usuario_id', uid).eq('concedido', true)
        if (p) { localStorage.setItem('perfil_cache', JSON.stringify({ p, pe })); aplicar(p, pe) }
      }
    } catch { // sin internet: usar el último perfil guardado
      const c = localStorage.getItem('perfil_cache')
      if (c) { const { p, pe } = JSON.parse(c); aplicar(p, pe) }
    }
    setListo(true)
  }
  function aplicar(p: Perfil, pe: { permiso: string }[] | null) { setPerfil(p.activo ? p : null); setPerm(new Set((pe || []).map(x => x.permiso))) }
  useEffect(() => { cargar(); const { data } = supabase.auth.onAuthStateChange(() => { cargar() }); return () => data.subscription.unsubscribe() }, [])
  const can = (p: string) => !!perfil && (perfil.rol === 'admin' || perm.has(p))
  return <A.Provider value={{ listo, perfil, can, recargar: cargar, salir: () => { supabase.auth.signOut(); setPerfil(null) } }}>{children}</A.Provider>
}
