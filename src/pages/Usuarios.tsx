import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase, SUPABASE_URL, SUPABASE_KEY } from '../supabase'
import { useAuth } from '../auth'
const PERMISOS: [string, string][] = [['vender', 'Vender'], ['ver_historial_completo', 'Ver historial completo'], ['caja', 'Abrir y cerrar caja'],
  ['anular_ventas', 'Anular ventas'], ['registrar_gastos', 'Gastos'], ['registrar_compras', 'Compras'], ['ver_inventario', 'Ver inventario'],
  ['ajustar_inventario', 'Ajustar inventario'], ['ver_sueldos', 'Ver sueldos'], ['ver_informes', 'Ver informes']]
export default function Usuarios() {
  const { perfil } = useAuth()
  const [lista, setLista] = useState<any[]>([])
  const [nombre, setNombre] = useState(''); const [email, setEmail] = useState(''); const [pass, setPass] = useState('')
  const [sel, setSel] = useState<string[]>(['vender']); const [msg, setMsg] = useState('')
  const cargar = async () => { const { data } = await supabase.from('perfiles').select('*').order('creado_en'); setLista(data || []) }
  useEffect(() => { cargar() }, [])
  if (perfil?.rol !== 'admin') return <p>Solo el administrador puede ver esta pantalla.</p>
  async function crear() {
    setMsg('')
    if (!nombre || !email || pass.length < 6) { setMsg('Completa nombre y correo, y usa una contraseña de al menos 6 caracteres.'); return }
    const temp = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await temp.auth.signUp({ email, password: pass })
    if (error || !data.user) { setMsg('No se pudo crear la cuenta: ' + (error?.message || 'intenta con otro correo')); return }
    const { error: e2 } = await supabase.rpc('crear_perfil', { p_id: data.user.id, p_nombre: nombre, p_permisos: sel })
    if (e2) { setMsg(e2.message); return }
    setMsg('Usuario creado.'); setNombre(''); setEmail(''); setPass(''); cargar()
  }
  async function alternar(u: any) { await supabase.from('perfiles').update({ activo: !u.activo }).eq('id', u.id); cargar() }
  return <div><h2>Usuarios</h2>
    <div className="form"><input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
      <input placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Contraseña" type="password" value={pass} onChange={e => setPass(e.target.value)} />
      <div className="checks">{PERMISOS.map(([k, t]) => <label key={k}><input type="checkbox" checked={sel.includes(k)}
        onChange={e => setSel(e.target.checked ? [...sel, k] : sel.filter(x => x !== k))} /> {t}</label>)}</div>
      <button onClick={crear}>Crear usuario</button>{msg && <p className="aviso">{msg}</p>}</div>
    <table><tbody>{lista.map(u => <tr key={u.id}><td>{u.nombre}</td><td>{u.rol}</td><td>{u.activo ? 'Activo' : 'Inactivo'}</td>
      <td>{u.id !== perfil.id && <button className="sec" onClick={() => alternar(u)}>{u.activo ? 'Desactivar' : 'Activar'}</button>}</td></tr>)}</tbody></table></div>
}
