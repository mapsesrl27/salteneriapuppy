import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Venta from './pages/Venta'
import Usuarios from './pages/Usuarios'
import Caja from './pages/Caja'
import Productos from './pages/Productos'
import Gastos from './pages/Gastos'
import Compras from './pages/Compras'
import Sueldos from './pages/Sueldos'
import Ventas from './pages/Ventas'
import Informes from './pages/Informes'
const MENU = [
  { to: '/', t: 'Inicio', p: '' },
  { to: '/venta', t: 'Vender', p: 'vender' },
  { to: '/ventas', t: 'Historial', p: 'ver_historial_completo' },
  { to: '/caja', t: 'Caja', p: 'caja' },
  { to: '/productos', t: 'Productos', p: 'ver_inventario' },
  { to: '/compras', t: 'Compras', p: 'registrar_compras' },
  { to: '/gastos', t: 'Gastos', p: 'registrar_gastos' },
  { to: '/sueldos', t: 'Sueldos', p: 'ver_sueldos' },
  { to: '/informes', t: 'Informes', p: 'ver_informes' },
  { to: '/usuarios', t: 'Usuarios', p: 'ADMIN' },
]
function Layout() {
  const { listo, perfil, can, salir } = useAuth()
  if (!listo) return <p className="centro">Cargando…</p>
  if (!perfil) return <Navigate to="/login" />
  return <div className="app">
    <nav className="menu">
      <b className="marca">Salteñería</b>
      {MENU.filter(m => m.p === '' || (m.p === 'ADMIN' ? perfil.rol === 'admin' : can(m.p))).map(m =>
        <NavLink key={m.to} to={m.to} end={m.to === '/'}>{m.t}</NavLink>)}
      <button className="sec" onClick={salir}>Salir ({perfil.nombre})</button>
    </nav>
    <main><Outlet /></main>
  </div>
}
export default function App() {
  return <AuthProvider><Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<Layout />}>
      <Route path="/" element={<Inicio />} />
      <Route path="/venta" element={<Venta />} />
      <Route path="/usuarios" element={<Usuarios />} />
      <Route path="/caja" element={<Caja />} /><Route path="/productos" element={<Productos />} /><Route path="/gastos" element={<Gastos />} />
      <Route path="/compras" element={<Compras />} /><Route path="/sueldos" element={<Sueldos />} /><Route path="/ventas" element={<Ventas />} /><Route path="/informes" element={<Informes />} />
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes></AuthProvider>
}
