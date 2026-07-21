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
  imagenes: [],
  colores: [],
}

export default function ProductManager() {
  const { lang, t } = useLanguage()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(estadoInicial)
  const [editandoId, setEditandoId] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [archivosGaleria, setArchivosGaleria] = useState([])
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
      imagenes: producto.imagenes ?? [],
      colores: producto.colores ?? [],
    })
    setArchivo(null)
    setArchivosGaleria([])
    setError('')
  }

  function handleCancelar() {
    setEditandoId(null)
    setForm(estadoInicial)
    setArchivo(null)
    setArchivosGaleria([])
    setError('')
  }

  function handleAgregarColor() {
    setForm({ ...form, colores: [...form.colores, { nombre: '', hex: '#8B5A2B' }] })
  }

  function handleColorChange(index, campo, valor) {
    const colores = form.colores.map((c, i) => (i === index ? { ...c, [campo]: valor } : c))
    setForm({ ...form, colores })
  }

  function handleQuitarColor(index) {
    setForm({ ...form, colores: form.colores.filter((_, i) => i !== index) })
  }

  function handleQuitarFotoGaleria(index) {
    setForm({ ...form, imagenes: form.imagenes.filter((_, i) => i !== index) })
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

    let imagenesGaleria = form.imagenes

    if (archivosGaleria.length > 0) {
      const urlsNuevas = []
      for (const archivoGaleria of archivosGaleria) {
        const ruta = `${Date.now()}-${archivoGaleria.name}`
        const { error: uploadError } = await supabase.storage
          .from('productos-imagenes')
          .upload(ruta, archivoGaleria)

        if (uploadError) {
          setError('No se pudo subir una foto de la galería: ' + uploadError.message)
          setGuardando(false)
          return
        }

        const { data: publicUrlData } = supabase.storage.from('productos-imagenes').getPublicUrl(ruta)
        urlsNuevas.push(publicUrlData.publicUrl)
      }
      imagenesGaleria = [...form.imagenes, ...urlsNuevas]
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
      imagenes: imagenesGaleria,
      colores: form.colores.filter((c) => c.nombre.trim()),
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

          <label className="block">
            <span className="font-mono text-[11px] tracking-widest text-muted uppercase">
              {t('productManager.galeria')}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setArchivosGaleria(Array.from(e.target.files ?? []))}
              className="mt-2 w-full text-sm text-parchment file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-brass file:text-ink file:font-medium"
            />
            {form.imagenes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.imagenes.map((url, i) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="h-16 w-16 object-cover rounded-sm border border-line" />
                    <button
                      type="button"
                      onClick={() => handleQuitarFotoGaleria(i)}
                      className="absolute -top-2 -right-2 bg-ink border border-line rounded-full w-5 h-5 text-xs text-red-400 leading-none"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </label>

          <div>
            <span className="font-mono text-[11px] tracking-widest text-muted uppercase">
              {t('productManager.colores')}
            </span>
            <div className="mt-2 grid gap-3">
              {form.colores.map((color, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => handleColorChange(i, 'hex', e.target.value)}
                    className="w-10 h-10 rounded-sm border border-line bg-surface"
                  />
                  <input
                    type="text"
                    value={color.nombre}
                    onChange={(e) => handleColorChange(i, 'nombre', e.target.value)}
                    placeholder={t('productManager.colorNombrePlaceholder')}
                    className="flex-1 bg-surface border border-line rounded-sm px-4 py-2 text-sm text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuitarColor(i)}
                    className="font-mono text-xs uppercase tracking-widest text-red-400 hover:underline shrink-0"
                  >
                    {t('productManager.eliminar')}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAgregarColor}
              className="mt-3 font-mono text-xs uppercase tracking-widest text-brass hover:underline"
            >
              {t('productManager.agregarColor')}
            </button>
          </div>

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
