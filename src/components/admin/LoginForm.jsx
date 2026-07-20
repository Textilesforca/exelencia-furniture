import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useLanguage } from '../../i18n/LanguageContext'

export default function LoginForm() {
  const { t } = useLanguage()
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
      setError(t('loginForm.errorCredenciales'))
      setEnviando(false)
    }
  }

  return (
    <section className="max-w-sm mx-auto px-6 py-24">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">{t('loginForm.titulo')}</p>
      <h1 className="font-display text-3xl text-parchment mb-8">{t('loginForm.subtitulo')}</h1>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <label className="block">
          <span className="font-mono text-[11px] tracking-widest text-muted uppercase">{t('loginForm.correo')}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] tracking-widest text-muted uppercase">{t('loginForm.contrasena')}</span>
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
          {enviando ? t('loginForm.entrando') : t('loginForm.entrar')}
        </button>
      </form>
    </section>
  )
}
