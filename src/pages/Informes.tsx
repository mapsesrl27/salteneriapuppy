import { useState } from 'react'
import { supabase } from '../supabase'
import { bs, csv, fin, hoy, ini } from '../lib'
export default function Informes() {
  const [tipo, setTipo] = useState('ventas'); const [desde, setDesde] = useState(hoy().slice(0, 8) + '01'); const [hasta, setHasta] = useState(hoy())
  const [filas, setFilas] = useState<any[]>([]); const [msg, setMsg] = useState('')
  async function ver() {
    setMsg(''); let r: any[] = []; let e: any = null
    if (tipo === 'ventas') { const q = await supabase.from('ventas').select('creado_en,medio_pago,total,estado').gte('creado_en', ini(desde)).lte('creado_en', fin(hasta)).order('creado_en'); e = q.error; r = (q.data || []).map((x: any) => ({ fecha: x.creado_en.slice(0, 16).replace('T', ' '), medio: x.medio_pago, total: x.total, estado: x.estado })) }
    if (tipo === 'por_producto') { const q = await supabase.from('venta_detalle').select('cantidad,subtotal,productos(nombre),ventas!inner(creado_en,estado)').eq('ventas.estado', 'valida').gte('ventas.creado_en', ini(desde)).lte('ventas.creado_en', fin(hasta)); e = q.error
      const m: any = {}; (q.data || []).forEach((x: any) => { const n = x.productos?.nombre; m[n] = m[n] || { producto: n, cantidad: 0, total: 0 }; m[n].cantidad += x.cantidad; m[n].total += Number(x.subtotal) }); r = Object.values(m) }
    if (tipo === 'gastos') { const q = await supabase.from('gastos').select('fecha,descripcion,monto,medio_pago,estado,categorias_gasto(nombre)').gte('fecha', desde).lte('fecha', hasta).order('fecha'); e = q.error; r = (q.data || []).map((x: any) => ({ fecha: x.fecha, categoria: x.categorias_gasto?.nombre, descripcion: x.descripcion, monto: x.monto, medio: x.medio_pago, estado: x.estado })) }
    if (tipo === 'compras') { const q = await supabase.from('compras').select('fecha,total,medio_pago,estado,proveedores(nombre)').gte('fecha', desde).lte('fecha', hasta).order('fecha'); e = q.error; r = (q.data || []).map((x: any) => ({ fecha: x.fecha, proveedor: x.proveedores?.nombre, total: x.total, medio: x.medio_pago, estado: x.estado })) }
    if (tipo === 'sueldos') { const q = await supabase.from('pagos_sueldo').select('creado_en,tipo,monto,medio_pago,estado,sueldo_periodos(anio,mes,empleados(nombre))').gte('creado_en', ini(desde)).lte('creado_en', fin(hasta)); e = q.error; r = (q.data || []).map((x: any) => ({ fecha: x.creado_en.slice(0, 10), empleado: x.sueldo_periodos?.empleados?.nombre, periodo: x.sueldo_periodos?.mes + '/' + x.sueldo_periodos?.anio, tipo: x.tipo, monto: x.monto, medio: x.medio_pago, estado: x.estado })) }
    if (e) setMsg(e.message); setFilas(r)
  }
  const tot = filas.filter(f => f.estado !== 'anulada' && f.estado !== 'anulado').reduce((s, f) => s + Number(f.total ?? f.monto ?? 0), 0)
  return <div><h2>Informes</h2>{msg && <p className="err">{msg}</p>}
    <div className="medios"><select value={tipo} onChange={e => setTipo(e.target.value)}><option value="ventas">Ventas</option><option value="por_producto">Ventas por producto</option><option value="gastos">Gastos</option><option value="compras">Compras</option><option value="sueldos">Pagos de sueldos</option></select>
      <input type="date" value={desde} onChange={e => setDesde(e.target.value)} /><input type="date" value={hasta} onChange={e => setHasta(e.target.value)} /><button onClick={ver}>Ver</button></div>
    {filas.length > 0 && <><p><b>Total (sin anulados): {bs(tot)}</b> · <button className="sec" onClick={() => csv('informe_' + tipo, filas)}>Exportar a Excel</button> <button className="sec" onClick={() => window.print()}>Guardar como PDF</button></p>
      <table><thead><tr>{Object.keys(filas[0]).map(k => <td key={k}><b>{k}</b></td>)}</tr></thead><tbody>{filas.map((f, i) => <tr key={i}>{Object.values(f).map((v: any, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table></>}</div>
}
