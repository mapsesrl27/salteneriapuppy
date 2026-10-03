import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { bs } from '../lib'
export default function Sueldos() {
  const { perfil } = useAuth(); const admin = perfil?.rol === 'admin'
  const d = new Date(); const [anio, setAnio] = useState(d.getFullYear()); const [mes, setMes] = useState(d.getMonth() + 1)
  const [filas, setFilas] = useState<any[]>([]); const [msg, setMsg] = useState(''); const [emp, setEmp] = useState({ nombre: '', cargo: '', sueldo: '' })
  async function cargar() {
    const { data: p } = await supabase.from('sueldo_periodos').select('*, empleados(nombre)').eq('anio', anio).eq('mes', mes)
    const ids = (p || []).map((x: any) => x.id)
    const { data: g } = ids.length ? await supabase.from('pagos_sueldo').select('periodo_id,monto').eq('estado', 'valido').in('periodo_id', ids) : { data: [] as any[] }
    setFilas((p || []).map((x: any) => ({ ...x, pagado: (g || []).filter((y: any) => y.periodo_id === x.id).reduce((s: number, y: any) => s + Number(y.monto), 0) })))
  }
  useEffect(() => { cargar() }, [anio, mes])
  async function generar() { const { error } = await supabase.rpc('generar_periodos', { p_anio: anio, p_mes: mes }); setMsg(error ? error.message : 'Sueldos del mes generados.'); cargar() }
  async function pagar(f: any) {
    const tipo = prompt('Tipo: anticipo, parcial o completo', 'anticipo'); if (!tipo) return
    const monto = Number(prompt('Monto (Bs). Saldo: ' + (f.sueldo_acordado - f.pagado))); const medio = prompt('Medio: efectivo, qr o transferencia', 'efectivo') || 'efectivo'
    const { error } = await supabase.rpc('pagar_sueldo', { p_periodo: f.id, p_tipo: tipo, p_monto: monto, p_medio: medio }); setMsg(error ? error.message : 'Pago registrado.'); cargar()
  }
  async function crearEmp() {
    if (!emp.nombre || emp.sueldo === '') { setMsg('Escribe nombre y sueldo.'); return }
    const { error } = await supabase.from('empleados').insert({ nombre: emp.nombre, cargo: emp.cargo, sueldo_mensual: Number(emp.sueldo) })
    setMsg(error ? error.message : 'Empleado creado.'); setEmp({ nombre: '', cargo: '', sueldo: '' })
  }
  return <div><h2>Empleados y sueldos</h2>{msg && <p className="aviso">{msg}</p>}
    {admin && <div className="form"><input placeholder="Nombre del empleado" value={emp.nombre} onChange={e => setEmp({ ...emp, nombre: e.target.value })} /><input placeholder="Cargo" value={emp.cargo} onChange={e => setEmp({ ...emp, cargo: e.target.value })} />
      <input placeholder="Sueldo mensual (Bs)" type="number" value={emp.sueldo} onChange={e => setEmp({ ...emp, sueldo: e.target.value })} /><button onClick={crearEmp}>Crear empleado</button></div>}
    <div className="medios"><input type="number" value={mes} min={1} max={12} onChange={e => setMes(Number(e.target.value))} /><input type="number" value={anio} onChange={e => setAnio(Number(e.target.value))} /><button onClick={generar}>Generar sueldos del mes</button></div>
    <table><thead><tr><td>Empleado</td><td>Sueldo</td><td>Pagado</td><td>Saldo</td><td></td></tr></thead><tbody>{filas.map(f => <tr key={f.id}><td>{f.empleados?.nombre}</td><td>{bs(f.sueldo_acordado)}</td><td>{bs(f.pagado)}</td><td>{bs(f.sueldo_acordado - f.pagado)}</td>
      <td><button className="sec" onClick={() => pagar(f)}>Registrar pago</button></td></tr>)}</tbody></table></div>
}
