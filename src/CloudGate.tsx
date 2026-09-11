import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { getSession, loadCloudState, saveCloudState, signIn, signOut, supabaseEnabled } from './supabase'
import { disableCloudSync, enableCloudSync, loadMatches, loadRivals, loadTeams, replaceLocalState } from './storage'

type Props = {
  children: ReactNode
}

export default function CloudGate({ children }: Props) {
  const [ready, setReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const autoEntered = useRef(false)

  async function bootstrap(userEmail: string) {
    disableCloudSync()
    const remote = await loadCloudState()
    if (remote) {
      replaceLocalState(remote)
    } else {
      await saveCloudState({
        teams: loadTeams(),
        matches: loadMatches(),
        rivals: loadRivals(),
      })
    }
    enableCloudSync()
    setEmail(userEmail)
    setAuthenticated(true)
    setReady(true)
  }

  useEffect(() => {
    if (!supabaseEnabled) {
      setBusy(false)
      return
    }
    void getSession()
      .then(session => session ? bootstrap(session.user.email ?? '') : undefined)
      .catch(err => setError(err instanceof Error ? err.message : 'No se pudo recuperar la sesión'))
      .finally(() => setBusy(false))
  }, [])

  useEffect(() => {
    if (!authenticated || !ready || autoEntered.current) return
    const timer = window.setTimeout(() => {
      const form = document.querySelector<HTMLFormElement>('.login-card')
      if (!form) return
      const emailInput = form.querySelector<HTMLInputElement>('input[type="email"]')
      if (emailInput && email) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        setter?.call(emailInput, email)
        emailInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      autoEntered.current = true
      form.requestSubmit()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [authenticated, ready, email])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const session = await signIn(email, password)
      await bootstrap(session.user.email ?? email)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setBusy(false)
    }
  }

  async function closeCloudSession() {
    disableCloudSync()
    await signOut()
    setAuthenticated(false)
    setReady(false)
    setPassword('')
    autoEntered.current = false
  }

  if (!supabaseEnabled) {
    return <section className="login-wrap"><div className="login-card"><div className="eyebrow">Configuración pendiente</div><h1>BarakAPP servidor</h1><p>Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY del despliegue.</p></div></section>
  }

  if (busy && !authenticated) {
    return <section className="login-wrap"><div className="login-card"><div className="eyebrow">BarakAPP</div><h1>Conectando…</h1></div></section>
  }

  if (!authenticated) {
    return <section className="login-wrap">
      <form className="login-card cloud-login" onSubmit={submit}>
        <div className="eyebrow">Datos centralizados · Supabase</div>
        <h1>Accede a BarakAPP</h1>
        <p>La misma información estará disponible desde móvil, tablet y PC.</p>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" required /></label>
        <label>Contraseña<input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required /></label>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-btn" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </section>
  }

  return <div data-cloud-ready={ready ? 'true' : 'false'}>
    <div style={{ opacity: autoEntered.current ? 1 : 0 }}>{children}</div>
    <button type="button" onClick={() => void closeCloudSession()} style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 50 }} className="ghost-btn">Cerrar sesión servidor</button>
  </div>
}
