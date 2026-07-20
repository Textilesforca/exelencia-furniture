import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const estadoInicial = {
  nombre: '',
  telefono: '',
  email: '',
  tipo_mueble: '',
  descripcion: '',
  presupuesto: '',
}

export default function QuoteForm() {
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
        <p className="font-mono text-xs tracking-widest text-brass uppercase mb-2">Solicitud recibida</p>
        <p className="text-parchment/80">
          Gracias, {form.nombre || ''}. Te contactaremos en menos de 24 horas para afinar medidas y materiales.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
        <Field label="Teléfono / WhatsApp" name="telefono" value={form.telefono} onChange={handleChange} required />
      </div>
      <Field label="Correo (opcional)" name="email" type="email" value={form.email} onChange={handleChange} />
      <Field label="Tipo de mueble" name="tipo_mueble" value={form.tipo_mueble} onChange={handleChange} placeholder="Ej. mesa de comedor, clóset, sala" />
      <Field
        as="textarea"
        label="Cuéntanos qué necesitas"
        name="descripcion"
        value={form.descripcion}
        onChange={handleChange}
        placeholder="Medidas del espacio, estilo, material preferido, fotos de referencia (puedes enviarlas luego por WhatsApp)"
      />
      <Field label="Presupuesto aproximado" name="presupuesto" value={form.presupuesto} onChange={handleChange} placeholder="Ej. $15,000 - $25,000 MXN" />

      {estado === 'error' && (
        <p className="text-sm text-red-400">
          No se pudo enviar tu solicitud. Verifica tu conexión e inténtalo de nuevo.
        </p>
      )}

      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-50 w-fit"
      >
        {estado === 'enviando' ? 'Enviando…' : 'Solicitar cotización'}
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
