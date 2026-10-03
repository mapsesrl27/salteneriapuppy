import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { bs } from '../lib'
const vacia = { producto_id: '', concepto: '', cantidad: '1', costo: '' }
export default function Compras() {
  const { perfil } = useAuth()
  const [prods, setProds] = useState<any[]>([]); const [provs, setProvs] = useState<any[]>([]); const [lista, setLista] = useState<any[]>([])
  const [prov, setProv] = useState(''); const [medio, setMedio] = useState('efectivo'); const [lineas, setLineas] = useState<any[]>([{ ...vacia }]); const [msg, setMsg] = useState('')
  async function cargar() {
    const { data: p } = await supabase.from('productos').select('id,nombre').eq('controla_stock', true).eq('activo', true); setProds(p || [])
    const { data: v } = await supabase.from('proveedores').select('*').eq('activo', true); setProvs(v || [])
    const { data: c } = await supabase.from('compras').select('*, proveedores(nombre)').order('creado_en', { ascending: false }).limit(30); setLista(c || [])
  }
  useEffect(() => { cargar() }, [])
  const set = (i: number, k: string, v: string) => setLineas(l => l.map((x, j) => j === i ? { ...x, [k]: v } : x))
  const total = lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.costo || 0), 0)
  async function guardar() {
    const items = lineas.filter(l => Number(l.costo) >= 0 && l.costo !== '' && (l.producto_id || l.concepto))
    if (!items.length) { setMsg('Agrega al menos una línea con producto o concepto y costo.'); return }
    const { error } = await supabase.rpc('registrar_compra', { p_proveedor: prov || null, p_medio: medio, p_items: items.map(l => ({ producto_id: l.producto_id || null, concepto: l.concepto, cantidad: Number(l.cantidad), costo: Number(l.costo) })) })
    setMsg(error ? error.message : 'Compra registrada.'); if (!error) setLineas([{ ...vacia }]); cargar()
  }
  async function nuevoProv() { const n = prompt('Nombre del proveedor:'); if (!n) return; const { error } = await supabase.from('proveedores').insert({ nombre: n }); setMsg(error ? error.message : 'Proveedor creado.'); cargar() }
  async function anular(c: any) { if (!confirm('¿Anular compra? (el stock no se revierte solo, ajústalo en Productos)')) return; await supabase.from('compras').update({ estado: 'anulada' }).eq('id', c.id); cargar() }
  return <div><h2>Compras</h2>{msg && <p className="aviso">{msg}</p>}
    <div className="form"><div className="medios"><select value={prov} onChange={e => setProv(e.target.value)}><option value="">Proveedor (opcional)</option>{provs.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
      {perfil?.rol === 'admin' && <button className="sec" onClick={nuevoProv}>Nuevo</button>}</div>
      {lineas.map((l, i) => <div key={i} className="linea"><select value={l.producto_id} onChange={e => set(i, 'producto_id', e.target.value)}><option value="">Insumo / otro (sin stock)</option>{prods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
        {!l.producto_id && <input placeholder="Concepto" value={l.concepto} onChange={e => set(i, 'concepto', e.target.value)} />}
        <input type="number" placeholder="Cantidad" value={l.cantidad} onChange={e => set(i, 'cantidad', e.target.value)} />
        <input type="number" placeholder="Costo unitario" value={l.costo} onChange={e => set(i, 'costo', e.target.value)} /></div>)}
      <button className="sec" onClick={() => setLineas([...lineas, { ...vacia }])}>Agregar línea</button>
      <select value={medio} onChange={e => setMedio(e.target.value)}><option value="efectivo">Efectivo (de caja)</option><option value="qr">QR</option><option value="transferencia">Transferencia</option></select>
      <b>Total: {bs(total)}</b><button onClick={guardar}>Guardar compra</button></div>
    <table><tbody>{lista.map(c => <tr key={c.id} style={{ opacity: c.estado === 'anulada' ? .4 : 1 }}><td>{c.fecha}</td><td>{c.proveedores?.nombre || '-'}</td><td>{bs(c.total)}</td><td>{c.medio_pago}</td>
      <td>{perfil?.rol === 'admin' && c.estado === 'valida' && <button className="sec" onClick={() => anular(c)}>Anular</button>}</td></tr>)}</tbody></table></div>
}
