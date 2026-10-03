import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
export default function Login() {
  const { perfil, recargar } = useAuth()
  const [email, setEmail] = useState(''); const [pass, setPass] = useState(''); const [err, setErr] = useState('')
  if (perfil) return <Navigate to="/" />
  async function entrar() {
    setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) setErr('Correo o contraseña incorrectos. Revisa los datos e intenta de nuevo.'); else recargar()
  }
  return <div className="login"><h1>Salteñería</h1>
    <input placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} />
    <input placeholder="Contraseña" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && entrar()} />
    {err && <p className="err">{err}</p>}
    <button onClick={entrar}>Entrar</button></div>
}
