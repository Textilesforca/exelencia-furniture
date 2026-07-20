import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const estadoInicial = {
  email: '',
  password: '',
  role: 'usuario',
  permisos: { productos: false, cotizaciones: false },
}

async function mensajeDeError(error) {
  if (!error) return ''
  try {
    const body = await error.context.json()
    if (body?.error) return body.error
  } catch {
    // el error no traía body JSON, usamos el mensaje genérico
  }
  return error.message
}

export default function UserManager() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(estadoInicial)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')
  const [guardandoId, setGuardandoId] = useState(null)

  async function cargarUsuarios() {
    setCargando(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, permisos, creado_en')
      .order('creado_en', { ascending: false })
    if (!error) setUsuarios(data ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handlePermisoChange(seccion, checked) {
    setForm({ ...form, permisos: { ...form.permisos, [seccion]: checked } })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setCreando(true)
    setError('')

    const { error } = await supabase.functions.invoke('manage-user', {
      body: {
        action: 'create',
        email: form.email,
        password: form.password,
        role: form.role,
        permisos: form.role === 'admin' ? { productos: true, cotizaciones: true } : form.permisos,
      },
    })

    if (error) {
      setError(await mensajeDeError(error))
      setCreando(false)
      return
    }

    setCreando(false)
    setForm(estadoInicial)
    cargarUsuarios()
  }

  function handleRoleChange(id, role) {
    setUsuarios(
      usuarios.map((u) =>
        u.id === id
          ? { ...u, role, permisos: role === 'admin' ? { productos: true, cotizaciones: true } : u.permisos }
          : u
      )
    )
  }

  function handleRowPermisoChange(id, seccion, checked) {
    setUsuarios(
      usuarios.map((u) => (u.id === id ? { ...u, permisos: { ...u.permisos, [seccion]: checked } } : u))
    )
  }

  async function handleGuardarFila(usuario) {
    setGuardandoId(usuario.id)
    setError('')
    const { error } = await supabase
      .from('profiles')
      .update({ role: usuario.role, permisos: usuario.permisos })
      .eq('id', usuario.id)

    if (error) {
      setError(error.message)
      setGuardandoId(null)
      return
    }

    setGuardandoId(null)
    cargarUsuarios()
  }

  async function handleEliminar(id) {
    if (!window.confirm('¿Eliminar este usuario? Perderá acceso de inmediato.')) return
    setError('')
    const { error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'delete', userId: id },
    })

    if (error) {
      setError(await mensajeDeError(error))
      return
    }

    cargarUsuarios()
  }

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <div>
        <h2 className="font-display text-2xl text-parchment mb-6">Nuevo usuario</h2>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <Field label="Correo" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Field
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <label className="block">
            <span className="font-mono text-[11px] tracking-widest text-muted uppercase">Rol</span>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment focus:border-brass outline-none transition-colors"
            >
              <option value="usuario">Usuario estándar</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {form.role === 'usuario' && (
            <div>
              <span className="font-mono text-[11px] tracking-widest text-muted uppercase">
                Acceso a secciones
              </span>
              <div className="mt-2 flex gap-6">
                <PermisoCheckbox
                  label="Productos"
                  checked={form.permisos.productos}
                  onChange={(checked) => handlePermisoChange('productos', checked)}
                />
                <PermisoCheckbox
                  label="Cotizaciones"
                  checked={form.permisos.cotizaciones}
                  onChange={(checked) => handlePermisoChange('cotizaciones', checked)}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={creando}
            className="bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-50 w-fit"
          >
            {creando ? 'Creando…' : 'Crear usuario'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-2xl text-parchment mb-6">Usuarios existentes</h2>
        {cargando ? (
          <p className="font-mono text-sm text-muted">Cargando…</p>
        ) : usuarios.length === 0 ? (
          <p className="font-mono text-sm text-muted">Aún no hay usuarios.</p>
        ) : (
          <ul className="grid gap-3">
            {usuarios.map((u) => (
              <li key={u.id} className="bg-surface border border-line rounded-sm p-4">
                <p className="text-parchment truncate mb-3">{u.email}</p>

                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-surface2 border border-line rounded-sm px-3 py-2 text-sm text-parchment focus:border-brass outline-none transition-colors"
                  >
                    <option value="usuario">Usuario estándar</option>
                    <option value="admin">Admin</option>
                  </select>

                  {u.role === 'usuario' && (
                    <>
                      <PermisoCheckbox
                        label="Productos"
                        checked={!!u.permisos?.productos}
                        onChange={(checked) => handleRowPermisoChange(u.id, 'productos', checked)}
                      />
                      <PermisoCheckbox
                        label="Cotizaciones"
                        checked={!!u.permisos?.cotizaciones}
                        onChange={(checked) => handleRowPermisoChange(u.id, 'cotizaciones', checked)}
                      />
                    </>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleGuardarFila(u)}
                    disabled={guardandoId === u.id}
                    className="font-mono text-xs uppercase tracking-widest text-brass hover:underline disabled:opacity-50"
                  >
                    {guardandoId === u.id ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => handleEliminar(u.id)}
                    className="font-mono text-xs uppercase tracking-widest text-red-400 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, type = 'text', required }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] tracking-widest text-muted uppercase">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
      />
    </label>
  )
}

function PermisoCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 font-mono text-xs text-parchment">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
