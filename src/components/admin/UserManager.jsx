import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useLanguage } from '../../i18n/LanguageContext'

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
  const { t } = useLanguage()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(estadoInicial)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')
  const [guardandoId, setGuardandoId] = useState(null)
  const [mostrarPassword, setMostrarPassword] = useState(false)

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
    if (!window.confirm(t('userManager.confirmarEliminar'))) return
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
        <h2 className="font-display text-2xl text-parchment mb-6">{t('userManager.nuevoUsuario')}</h2>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <Field
            label={t('userManager.correo')}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="off"
            required
          />
          <PasswordField
            label={t('userManager.contrasena')}
            name="password"
            value={form.password}
            onChange={handleChange}
            visible={mostrarPassword}
            onToggleVisible={() => setMostrarPassword((v) => !v)}
            mostrarLabel={t('userManager.mostrarPassword')}
            ocultarLabel={t('userManager.ocultarPassword')}
            required
          />

          <label className="block">
            <span className="font-mono text-[11px] tracking-widest text-muted uppercase">{t('userManager.rol')}</span>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment focus:border-brass outline-none transition-colors"
            >
              <option value="usuario">{t('userManager.usuarioEstandar')}</option>
              <option value="admin">{t('userManager.adminRol')}</option>
            </select>
          </label>

          {form.role === 'usuario' && (
            <div>
              <span className="font-mono text-[11px] tracking-widest text-muted uppercase">
                {t('userManager.accesoSecciones')}
              </span>
              <div className="mt-2 flex gap-6">
                <PermisoCheckbox
                  label={t('userManager.productos')}
                  checked={form.permisos.productos}
                  onChange={(checked) => handlePermisoChange('productos', checked)}
                />
                <PermisoCheckbox
                  label={t('userManager.cotizaciones')}
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
            {creando ? t('userManager.creando') : t('userManager.crearUsuario')}
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-2xl text-parchment mb-6">{t('userManager.usuariosExistentes')}</h2>
        {cargando ? (
          <p className="font-mono text-sm text-muted">{t('userManager.cargando')}</p>
        ) : usuarios.length === 0 ? (
          <p className="font-mono text-sm text-muted">{t('userManager.vacio')}</p>
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
                    <option value="usuario">{t('userManager.usuarioEstandar')}</option>
                    <option value="admin">{t('userManager.adminRol')}</option>
                  </select>

                  {u.role === 'usuario' && (
                    <>
                      <PermisoCheckbox
                        label={t('userManager.productos')}
                        checked={!!u.permisos?.productos}
                        onChange={(checked) => handleRowPermisoChange(u.id, 'productos', checked)}
                      />
                      <PermisoCheckbox
                        label={t('userManager.cotizaciones')}
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
                    {guardandoId === u.id ? t('userManager.guardando') : t('userManager.guardar')}
                  </button>
                  <button
                    onClick={() => handleEliminar(u.id)}
                    className="font-mono text-xs uppercase tracking-widest text-red-400 hover:underline"
                  >
                    {t('userManager.eliminar')}
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

function Field({ label, name, value, onChange, type = 'text', required, autoComplete = 'off' }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] tracking-widest text-muted uppercase">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
      />
    </label>
  )
}

function PasswordField({ label, name, value, onChange, required, visible, onToggleVisible, mostrarLabel, ocultarLabel }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] tracking-widest text-muted uppercase">{label}</span>
      <div className="relative mt-2">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete="new-password"
          className="w-full bg-surface border border-line rounded-sm px-4 py-3 pr-11 text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? ocultarLabel : mostrarLabel}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brass transition-colors"
        >
          {visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
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
