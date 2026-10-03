import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { bs } from '../lib'
export default function Ventas() {
  const { can } = useAuth(); const [l, setL] = useState<any[]>([]); const [msg, setMsg] = useState('')
  async function cargar() { const { data } = await supabase.from('ventas').select('*, perfiles(nombre)').order('creado_en', { ascending: false }).limit(60); setL(data || []) }
  useEffect(() => { cargar() }, [])
  async function anular(v: any) { const m = prompt('Motivo de la anulación (obligatorio):'); if (!m) return; const { error } = await supabase.rpc('anular_venta', { p_id: v.id, p_motivo: m }); setMsg(error ? error.message : 'Venta anulada.'); cargar() }
  return <div><h2>Historial de ventas</h2>{msg && <p className="aviso">{msg}</p>}
    <table><tbody>{l.map(v => <tr key={v.id} style={{ opacity: v.estado === 'anulada' ? .4 : 1 }}><td>{new Date(v.creado_en).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}</td><td>{v.perfiles?.nombre}</td><td>{bs(v.total)}</td><td>{v.medio_pago}</td>
      <td>{v.estado === 'valida' && can('anular_ventas') && <button className="sec" onClick={() => anular(v)}>Anular</button>}</td></tr>)}</tbody></table></div>
}
