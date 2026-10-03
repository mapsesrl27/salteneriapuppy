import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { bs, hoy, ini } from '../lib'
const suma = (a: any[] | null, k: string) => (a || []).reduce((s, x) => s + Number(x[k]), 0)
export default function Inicio() {
  const { perfil, can } = useAuth(); const [d, setD] = useState<any>(null)
  useEffect(() => { (async () => {
    const h = hoy(); const m = h.slice(0, 8) + '01'
    const [v, st, caja] = await Promise.all([
      supabase.from('ventas').select('total,medio_pago').eq('estado', 'valida').gte('creado_en', ini(h)),
      supabase.from('productos').select('nombre,stock_actual,stock_minimo').eq('controla_stock', true),
      supabase.from('sesiones_caja').select('id').eq('estado', 'abierta').maybeSingle()])
    const r: any = { vh: v.data || [], bajo: (st.data || []).filter((p: any) => p.stock_actual <= p.stock_minimo), caja: !!caja.data }
    if (can('ver_informes')) {
      const [vm, g, c, s] = await Promise.all([
        supabase.from('ventas').select('total').eq('estado', 'valida').gte('creado_en', ini(m)),
        supabase.from('gastos').select('monto').eq('estado', 'valido').gte('fecha', m),
        supabase.from('compras').select('total').eq('estado', 'valida').gte('fecha', m),
        supabase.from('pagos_sueldo').select('monto').eq('estado', 'valido').gte('creado_en', ini(m))])
      r.mes = { v: suma(vm.data, 'total'), g: suma(g.data, 'monto'), c: suma(c.data, 'total'), s: suma(s.data, 'monto') }
    }
    setD(r) })() }, [])
  if (!d) return <p>Cargando…</p>
  const tot = suma(d.vh, 'total'); const ef = suma(d.vh.filter((x: any) => x.medio_pago === 'efectivo'), 'total')
  return <div><h2>Hola, {perfil?.nombre}</h2>
    <div className="grid"><div className="prod"><span>Ventas de hoy</span><b className="total">{bs(tot)}</b><span>{d.vh.length} ventas · ticket {bs(d.vh.length ? tot / d.vh.length : 0)}</span></div>
      <div className="prod"><span>Cobrado en efectivo</span><b className="total">{bs(ef)}</b></div><div className="prod"><span>Cobrado por QR</span><b className="total">{bs(tot - ef)}</b></div>
      <div className="prod"><span>Caja</span><b className="total">{d.caja ? 'Abierta' : 'Cerrada'}</b></div></div>
    {d.bajo.length > 0 && <p className="aviso">Bebidas con stock bajo o agotado: {d.bajo.map((p: any) => `${p.nombre} (${p.stock_actual})`).join(', ')}</p>}
    {d.mes && <><h3>Este mes</h3><div className="grid"><div className="prod"><span>Ventas</span><b>{bs(d.mes.v)}</b></div><div className="prod"><span>Gastos</span><b>{bs(d.mes.g)}</b></div>
      <div className="prod"><span>Compras</span><b>{bs(d.mes.c)}</b></div><div className="prod"><span>Sueldos pagados</span><b>{bs(d.mes.s)}</b></div>
      <div className="prod"><span>Resultado simplificado</span><b className="total">{bs(d.mes.v - d.mes.g - d.mes.c - d.mes.s)}</b></div></div>
      <p>Resultado simplificado: no es ganancia contable. No incluye sueldos pendientes ni existencias.</p></>}</div>
}
