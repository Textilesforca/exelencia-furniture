import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { categorias, subcategoriasPorCategoria } from '../../data/products'
import { useLanguage } from '../../i18n/LanguageContext'
import { traducirCategoria, traducirSubcategoria } from '../../i18n/translations'

const categoriasForm = categorias.filter((c) => c !== 'Todos')

const estadoInicial = {
  nombre: '',
  categoria: categoriasForm[0] ?? '',
  subcategoria: '',
  material: '',
  ancho: '',
  alto: '',
  profundidad: '',
  precio_desde: '',
  descripcion: '',
  imagen: '',
}

export default function ProductManager() {
  const { lang, t } = useLanguage()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(estadoInicial)
  const [editandoId, setEditandoId] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function cargarProductos() {
    setCargando(true)
    const { data, error } = await supabase.from('productos').select('*').order('creado_en', { ascending: false })
    if (!error) setProductos(data ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleEditar(producto) {
    setEditandoId(producto.id)
    setForm({
      nombre: producto.nombre ?? '',
      categoria: producto.categoria ?? categoriasForm[0] ?? '',
      subcategoria: producto.subcategoria ?? '',
      material: producto.material ?? '',
      ancho: producto.ancho ?? '',
      alto: producto.alto ?? '',
      profundidad: producto.profundidad ?? '',
      precio_desde: producto.precio_desde ?? '',
      descripcion: producto.descripcion ?? '',
      imagen: producto.imagen ?? '',
    })
    setArchivo(null)
    setError('')
  }

  function handleCancelar() {
    setEditandoId(null)
    setForm(estadoInicial)
    setArchivo(null)
    setError('')
  }

  async function handleEliminar(id) {
    if (!window.confirm(t('productManager.confirmarEliminar'))) return
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (!error) {
      if (editandoId === id) handleCancelar()
      cargarProductos()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    let imagenUrl = form.imagen

    if (archivo) {
      const ruta = `${Date.now()}-${archivo.name}`
      const { error: uploadError } = await supabase.storage
        .from('productos-imagenes')
        .upload(ruta, archivo)

      if (uploadError) {
        setError('No se pudo subir la imagen: ' + uploadError.message)
        setGuardando(false)
        return
      }

      const { data: publicUrlData } = supabase.storage.from('productos-imagenes').getPublicUrl(ruta)
      imagenUrl = publicUrlData.publicUrl
    }

    const payload = {
      nombre: form.nombre,
      categoria: form.categoria,
      subcategoria: subcategoriasPorCategoria[form.categoria] ? form.subcategoria || null : null,
      material: form.material,
      ancho: form.ancho ? Number(form.ancho) : null,
      alto: form.alto ? Number(form.alto) : null,
      profundidad: form.profundidad ? Number(form.profundidad) : null,
      precio_desde: form.precio_desde ? Number(form.precio_desde) : null,
      descripcion: form.descripcion,
      imagen: imagenUrl,
    }

    const { error: guardarError } = editandoId
      ? await supabase.from('productos').update(payload).eq('id', editandoId)
      : await supabase.from('productos').insert([payload])

    if (guardarError) {
      setError('No se pudo guardar: ' + guardarError.message)
      setGuardando(false)
      return
    }

    setGuardando(false)
    handleCancelar()
    cargarProductos()
  }

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <div>
        <h2 className="font-display text-2xl text-parchment mb-6">
          {editandoId ? t('productManager.editarPieza') : t('productManager.nuevaPieza')}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <Field label={t('productManager.nombre')} name="nombre" value={form.nombre} onChange={handleChange} required />

          <label className="block">
            <span className="font-mono text-[11px] tracking-widest text-muted uppercase">{t('productManager.categoria')}</span>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment focus:border-brass outline-none transition-colors"
            >
              {categoriasForm.map((c) => (
                <option key={c} value={c}>
                  {traducirCategoria(c, lang)}
                </option>
              ))}
            </select>
          </label>

          {subcategoriasPorCategoria[form.categoria] && (
            <label className="block">
              <span className="font-mono text-[11px] tracking-widest text-muted uppercase">
                {t('productManager.subcategoria')}
              </span>
              <select
                name="subcategoria"
                value={form.subcategoria}
                onChange={handleChange}
                className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment focus:border-brass outline-none transition-colors"
              >
                <option value="">{t('productManager.sinSubcategoria')}</option>
                {subcategoriasPorCategoria[form.categoria].slice(1).map((s) => (
                  <option key={s} value={s}>
                    {traducirSubcategoria(s, lang, form.categoria)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <Field label={t('productManager.material')} name="material" value={form.material} onChange={handleChange} />

          <div className="grid grid-cols-3 gap-4">
            <Field label={t('productManager.anchoCm')} name="ancho" type="number" value={form.ancho} onChange={handleChange} />
            <Field label={t('productManager.altoCm')} name="alto" type="number" value={form.alto} onChange={handleChange} />
            <Field label={t('productManager.fondoCm')} name="profundidad" type="number" value={form.profundidad} onChange={handleChange} />
          </div>

          <Field
            label={t('productManager.precioDesde')}
            name="precio_desde"
            type="number"
            value={form.precio_desde}
            onChange={handleChange}
          />

          <Field as="textarea" label={t('productManager.descripcion')} name="descripcion" value={form.descripcion} onChange={handleChange} />

          <label className="block">
            <span className="font-mono text-[11px] tracking-widest text-muted uppercase">{t('productManager.imagen')}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="mt-2 w-full text-sm text-parchment file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-brass file:text-ink file:font-medium"
            />
            {form.imagen && !archivo && (
              <img
                src={form.imagen}
                alt={t('productManager.imagenActualAlt')}
                className="mt-3 h-24 w-24 object-cover rounded-sm border border-line"
              />
            )}
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-50 w-fit"
            >
              {guardando
                ? t('productManager.guardando')
                : editandoId
                  ? t('productManager.guardarCambios')
                  : t('productManager.agregarPieza')}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={handleCancelar}
                className="border border-line text-parchment px-6 py-3 rounded-sm hover:border-brass/60 transition-colors w-fit"
              >
                {t('productManager.cancelar')}
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        <h2 className="font-display text-2xl text-parchment mb-6">{t('productManager.catalogoActual')}</h2>
        {cargando ? (
          <p className="font-mono text-sm text-muted">{t('productManager.cargando')}</p>
        ) : productos.length === 0 ? (
          <p className="font-mono text-sm text-muted">{t('productManager.vacio')}</p>
        ) : (
          <ul className="grid gap-3">
            {productos.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 bg-surface border border-line rounded-sm p-3"
              >
                <img src={p.imagen} alt={p.nombre} className="h-16 w-16 object-cover rounded-sm bg-surface2" />
                <div className="flex-1 min-w-0">
                  <p className="text-parchment truncate">{p.nombre}</p>
                  <p className="font-mono text-xs text-muted">{traducirCategoria(p.categoria, lang)}</p>
                </div>
                <button
                  onClick={() => handleEditar(p)}
                  className="font-mono text-xs uppercase tracking-widest text-brass hover:underline"
                >
                  {t('productManager.editar')}
                </button>
                <button
                  onClick={() => handleEliminar(p.id)}
                  className="font-mono text-xs uppercase tracking-widest text-red-400 hover:underline"
                >
                  {t('productManager.eliminar')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, type = 'text', as = 'input', required }) {
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
        rows={as === 'textarea' ? 4 : undefined}
        className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
      />
    </label>
  )
}
