import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { bs } from '../lib'
export default function Caja() {
  const [s, setS] = useState<any>(null); const [esp, setEsp] = useState(0); const [hist, setHist] = useState<any[]>([]); const [msg, setMsg] = useState('')
  async function cargar() {
    const { data } = await supabase.from('sesiones_caja').select('*').order('fecha', { ascending: false }).limit(15)
    setHist(data || []); const a = (data || []).find((x: any) => x.estado === 'abierta') || null; setS(a)
    if (a) { const { data: e } = await supabase.rpc('efectivo_esperado', { p_sesion: a.id }); setEsp(Number(e)) }
  }
  useEffect(() => { cargar() }, [])
  async function run(fn: string, args: any) { const { error } = await supabase.rpc(fn, args); setMsg(error ? error.message : 'Listo.'); cargar() }
  const num = (t: string) => { const v = Number(prompt(t)); return isNaN(v) ? 0 : v }
  return <div><h2>Caja</h2>{msg && <p className="aviso">{msg}</p>}
    {!s ? <button onClick={() => run('abrir_caja', { p_apertura: num('Efectivo con el que abres la caja (Bs):') })}>Abrir caja de hoy</button> :
      <div className="form"><p>Caja abierta con {bs(s.apertura_efectivo)}. <b>Efectivo esperado ahora: {bs(esp)}</b> (los cobros por QR no se cuentan aquí).</p>
        <div className="medios">
          <button className="sec" onClick={() => run('mover_caja', { p_tipo: 'aporte', p_monto: num('Monto del aporte (Bs):'), p_motivo: prompt('Motivo:') || '' })}>Aporte</button>
          <button className="sec" onClick={() => run('mover_caja', { p_tipo: 'retiro', p_monto: num('Monto del retiro (Bs):'), p_motivo: prompt('Motivo:') || '' })}>Retiro</button>
          <button onClick={() => { if (confirm('¿Cerrar la caja de hoy?')) run('cerrar_caja', { p_contado: num('Efectivo contado (Bs):'), p_obs: prompt('Observación (obligatoria si hay diferencia):') || null }) }}>Cerrar caja</button>
        </div></div>}
    <h3>Cierres anteriores</h3><table><thead><tr><td>Fecha</td><td>Estado</td><td>Esperado</td><td>Contado</td><td>Diferencia</td></tr></thead>
      <tbody>{hist.map(h => <tr key={h.id}><td>{h.fecha}</td><td>{h.estado}</td><td>{h.efectivo_esperado != null ? bs(h.efectivo_esperado) : '-'}</td><td>{h.efectivo_contado != null ? bs(h.efectivo_contado) : '-'}</td><td>{h.diferencia != null ? bs(h.diferencia) : '-'}</td></tr>)}</tbody></table></div>
}
