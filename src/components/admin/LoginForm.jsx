import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setEnviando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos.')
      setEnviando(false)
    }
  }

  return (
    <section className="max-w-sm mx-auto px-6 py-24">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">Acceso restringido</p>
      <h1 className="font-display text-3xl text-parchment mb-8">Panel de administración</h1>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="block">
          <span className="font-mono text-[11px] tracking-widest text-muted uppercase">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] tracking-widest text-muted uppercase">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-50 w-fit"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}
