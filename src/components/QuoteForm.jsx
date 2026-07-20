import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../i18n/LanguageContext'

const estadoInicial = {
  nombre: '',
  telefono: '',
  email: '',
  tipo_mueble: '',
  descripcion: '',
  presupuesto: '',
}

export default function QuoteForm() {
  const { t } = useLanguage()
  const [form, setForm] = useState(estadoInicial)
  const [estado, setEstado] = useState('idle') // idle | enviando | ok | error

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setEstado('enviando')
    const { error } = await supabase.from('cotizaciones').insert([form])
    if (error) {
      console.error(error)
      setEstado('error')
      return
    }
    setEstado('ok')
    setForm(estadoInicial)
  }

  if (estado === 'ok') {
    return (
      <div className="border border-brass/50 rounded-sm p-6">
        <p className="font-mono text-xs tracking-widest text-brass uppercase mb-2">{t('quoteForm.exitoTitulo')}</p>
        <p className="text-parchment/80">{t('quoteForm.exitoTexto', { nombre: form.nombre || '' })}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label={t('quoteForm.nombre')} name="nombre" value={form.nombre} onChange={handleChange} required />
        <Field label={t('quoteForm.telefono')} name="telefono" value={form.telefono} onChange={handleChange} required />
      </div>
      <Field label={t('quoteForm.correo')} name="email" type="email" value={form.email} onChange={handleChange} />
      <Field
        label={t('quoteForm.tipoMueble')}
        name="tipo_mueble"
        value={form.tipo_mueble}
        onChange={handleChange}
        placeholder={t('quoteForm.tipoMueblePlaceholder')}
      />
      <Field
        as="textarea"
        label={t('quoteForm.descripcion')}
        name="descripcion"
        value={form.descripcion}
        onChange={handleChange}
        placeholder={t('quoteForm.descripcionPlaceholder')}
      />
      <Field
        label={t('quoteForm.presupuesto')}
        name="presupuesto"
        value={form.presupuesto}
        onChange={handleChange}
        placeholder={t('quoteForm.presupuestoPlaceholder')}
      />

      {estado === 'error' && <p className="text-sm text-red-400">{t('quoteForm.errorEnvio')}</p>}

      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-50 w-fit"
      >
        {estado === 'enviando' ? t('quoteForm.enviando') : t('quoteForm.solicitar')}
      </button>
    </form>
  )
}

function Field({ label, name, value, onChange, type = 'text', as = 'input', required, placeholder }) {
  const Tag = as
  return (
    <label className="block">
      <span className="font-mono text-[11px] tracking-widest text-muted uppercase">{label}</span>
      <Tag
        name={name}
        type={as === 'input' ? type : undefined}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={as === 'textarea' ? 4 : undefined}
        className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
      />
    </label>
  )
}
