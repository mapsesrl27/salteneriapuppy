import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { bs } from '../lib'
export default function Gastos() {
  const { perfil } = useAuth()
  const [lista, setLista] = useState<any[]>([]); const [cats, setCats] = useState<any[]>([]); const [msg, setMsg] = useState('')
  const [f, setF] = useState({ cat: '', desc: '', monto: '', medio: 'efectivo' })
  async function cargar() {
    const { data } = await supabase.from('gastos').select('*, categorias_gasto(nombre)').order('creado_en', { ascending: false }).limit(50); setLista(data || [])
    const { data: c } = await supabase.from('categorias_gasto').select('*').eq('activa', true); setCats(c || [])
  }
  useEffect(() => { cargar() }, [])
  async function guardar() {
    if (!f.cat || !f.desc || Number(f.monto) <= 0) { setMsg('Completa categoría, descripción e importe.'); return }
    const { error } = await supabase.rpc('registrar_gasto', { p_categoria: f.cat, p_desc: f.desc, p_monto: Number(f.monto), p_medio: f.medio })
    setMsg(error ? error.message : 'Gasto registrado.'); if (!error) setF({ ...f, desc: '', monto: '' }); cargar()
  }
  async function anular(g: any) { if (!confirm('¿Anular este gasto?')) return; await supabase.from('gastos').update({ estado: 'anulado' }).eq('id', g.id); cargar() }
  return <div><h2>Gastos</h2>{msg && <p className="aviso">{msg}</p>}
    <div className="form"><select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}><option value="">Categoría…</option>{cats.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
      <input placeholder="Descripción" value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} />
      <input placeholder="Importe (Bs)" type="number" value={f.monto} onChange={e => setF({ ...f, monto: e.target.value })} />
      <select value={f.medio} onChange={e => setF({ ...f, medio: e.target.value })}><option value="efectivo">Efectivo (de caja)</option><option value="qr">QR</option><option value="transferencia">Transferencia</option></select>
      <button onClick={guardar}>Guardar gasto</button></div>
    <table><tbody>{lista.map(g => <tr key={g.id} style={{ opacity: g.estado === 'anulado' ? .4 : 1 }}><td>{g.fecha}</td><td>{g.categorias_gasto?.nombre}</td><td>{g.descripcion}</td><td>{bs(g.monto)}</td><td>{g.medio_pago}</td>
      <td>{perfil?.rol === 'admin' && g.estado === 'valido' && <button className="sec" onClick={() => anular(g)}>Anular</button>}</td></tr>)}</tbody></table></div>
}
