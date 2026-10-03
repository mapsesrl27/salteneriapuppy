import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { bs } from '../lib'
export default function Productos() {
  const { perfil, can } = useAuth(); const admin = perfil?.rol === 'admin'
  const [lista, setLista] = useState<any[]>([]); const [cats, setCats] = useState<any[]>([]); const [msg, setMsg] = useState('')
  const [f, setF] = useState({ nombre: '', categoria_id: '', precio: '', stock: false, minimo: '0' })
  async function cargar() {
    const { data } = await supabase.from('productos').select('*, categorias_producto(nombre)').order('nombre'); setLista(data || [])
    const { data: c } = await supabase.from('categorias_producto').select('*'); setCats(c || [])
  }
  useEffect(() => { cargar() }, [])
  async function crear() {
    if (!f.nombre || !f.categoria_id || f.precio === '') { setMsg('Completa nombre, categoría y precio.'); return }
    const { error } = await supabase.from('productos').insert({ nombre: f.nombre, categoria_id: f.categoria_id, precio_venta: Number(f.precio), controla_stock: f.stock, stock_minimo: Number(f.minimo) })
    setMsg(error ? error.message : 'Producto creado.'); setF({ ...f, nombre: '', precio: '' }); cargar()
  }
  async function precio(p: any) { const v = prompt('Nuevo precio de ' + p.nombre, p.precio_venta); if (v === null) return; await supabase.from('productos').update({ precio_venta: Number(v) }).eq('id', p.id); cargar() }
  async function activar(p: any) { await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id); cargar() }
  async function ajustar(p: any) {
    const tipo = prompt('Tipo: ajuste, merma o consumo_interno', 'ajuste'); if (!tipo) return
    const q = Number(prompt('Cantidad (use negativo para restar, ej. -3):')); const motivo = prompt('Motivo (obligatorio):') || ''
    const { error } = await supabase.rpc('ajustar_stock', { p_producto: p.id, p_cantidad: tipo === 'ajuste' ? q : -Math.abs(q), p_tipo: tipo, p_motivo: motivo })
    setMsg(error ? error.message : 'Stock actualizado.'); cargar()
  }
  return <div><h2>Productos e inventario</h2>{msg && <p className="aviso">{msg}</p>}
    {admin && <div className="form"><input placeholder="Nombre (ej. Salteña de pollo)" value={f.nombre} onChange={e => setF({ ...f, nombre: e.target.value })} />
      <select value={f.categoria_id} onChange={e => setF({ ...f, categoria_id: e.target.value })}><option value="">Categoría…</option>{cats.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
      <input placeholder="Precio (Bs)" type="number" value={f.precio} onChange={e => setF({ ...f, precio: e.target.value })} />
      <label><input type="checkbox" checked={f.stock} onChange={e => setF({ ...f, stock: e.target.checked })} style={{ width: 'auto' }} /> Controlar stock (para bebidas)</label>
      {f.stock && <input placeholder="Stock mínimo" type="number" value={f.minimo} onChange={e => setF({ ...f, minimo: e.target.value })} />}
      <button onClick={crear}>Crear producto</button></div>}
    <table><thead><tr><td>Producto</td><td>Categoría</td><td>Precio</td><td>Stock</td><td></td></tr></thead><tbody>{lista.map(p => <tr key={p.id} style={{ opacity: p.activo ? 1 : .5 }}>
      <td>{p.nombre}</td><td>{p.categorias_producto?.nombre}</td><td>{bs(p.precio_venta)}</td>
      <td>{p.controla_stock ? <span className={p.stock_actual <= p.stock_minimo ? 'err' : ''}>{p.stock_actual}{p.stock_actual <= p.stock_minimo ? ' (bajo)' : ''}</span> : '-'}</td>
      <td>{admin && <><button className="sec" onClick={() => precio(p)}>Precio</button> <button className="sec" onClick={() => activar(p)}>{p.activo ? 'Desactivar' : 'Activar'}</button> </>}
        {p.controla_stock && can('ajustar_inventario') && <button className="sec" onClick={() => ajustar(p)}>Ajustar stock</button>}</td></tr>)}</tbody></table></div>
}
