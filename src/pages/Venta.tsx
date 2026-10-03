import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
type P = { id: string; nombre: string; precio_venta: number }
type Item = { producto_id: string; cantidad: number }
type Venta = { id: string; medio: string; items: Item[]; fecha: string }
const K = 'cola_ventas', C = 'catalogo'
const cola = (): Venta[] => JSON.parse(localStorage.getItem(K) || '[]')
let sincronizando = false
export async function sincronizar(): Promise<string> {
  if (sincronizando) return ''
  sincronizando = true
  let msg = ''
  try {
    for (const v of cola()) {
      const { error } = await supabase.rpc('registrar_venta', { p_id: v.id, p_medio: v.medio, p_items: v.items, p_fecha: v.fecha })
      if (error) { msg = /fetch|network/i.test(error.message) ? '' : error.message; break }
      localStorage.setItem(K, JSON.stringify(cola().filter(x => x.id !== v.id)))
    }
  } catch { /* sin conexión: queda en cola */ }
  sincronizando = false
  return msg
}
export default function Venta() {
  const [prods, setProds] = useState<P[]>(JSON.parse(localStorage.getItem(C) || '[]'))
  const [carro, setCarro] = useState<Record<string, number>>({})
  const [medio, setMedio] = useState<'efectivo' | 'qr'>('efectivo')
  const [pend, setPend] = useState(cola().length)
  const [msg, setMsg] = useState('')
  async function refrescar() {
    const m = await sincronizar(); setMsg(m); setPend(cola().length)
    const { data } = await supabase.from('productos').select('id,nombre,precio_venta').eq('activo', true).order('nombre')
    if (data) { setProds(data); localStorage.setItem(C, JSON.stringify(data)) }
  }
  useEffect(() => { refrescar(); window.addEventListener('online', refrescar); return () => window.removeEventListener('online', refrescar) }, [])
  const total = prods.reduce((s, p) => s + (carro[p.id] || 0) * p.precio_venta, 0)
  const cambiar = (id: string, d: number) => setCarro(c => ({ ...c, [id]: Math.max(0, (c[id] || 0) + d) }))
  async function confirmar() {
    const items = Object.entries(carro).filter(([, n]) => n > 0).map(([producto_id, cantidad]) => ({ producto_id, cantidad }))
    if (!items.length) return
    localStorage.setItem(K, JSON.stringify([...cola(), { id: crypto.randomUUID(), medio, items, fecha: new Date().toISOString() }]))
    setCarro({}); setPend(cola().length)
    setMsg(await sincronizar()); setPend(cola().length)
  }
  return <div><h2>Vender</h2>
    {pend > 0 && <p className="aviso">{pend} venta(s) pendiente(s) de enviar. Se enviarán solas al volver el internet.</p>}
    {msg && <p className="err">{msg}</p>}
    {!prods.length && <p>No hay productos cargados. Entra con internet al menos una vez, o pide al administrador que cree los productos.</p>}
    <div className="grid">{prods.map(p => <div key={p.id} className="prod">
      <b>{p.nombre}</b><span>Bs {p.precio_venta.toFixed(2)}</span>
      <div className="cant"><button onClick={() => cambiar(p.id, -1)}>−</button><b>{carro[p.id] || 0}</b><button onClick={() => cambiar(p.id, 1)}>+</button></div>
    </div>)}</div>
    <div className="barra">
      <div className="medios"><button className={medio === 'efectivo' ? 'on' : 'sec'} onClick={() => setMedio('efectivo')}>Efectivo</button>
        <button className={medio === 'qr' ? 'on' : 'sec'} onClick={() => setMedio('qr')}>QR</button></div>
      <b className="total">Bs {total.toFixed(2)}</b>
      <button disabled={total === 0} onClick={confirmar}>Confirmar venta</button>
    </div></div>
}
