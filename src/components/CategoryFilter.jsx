export default function CategoryFilter({ categorias, activa, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por categoría">
      {categorias.map((cat) => (
        <button
          key={cat}
          role="tab"
          aria-selected={activa === cat}
          onClick={() => onChange(cat)}
          className={`font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-sm border transition-colors ${
            activa === cat
              ? 'bg-brass text-ink border-brass'
              : 'border-line text-parchment/70 hover:border-brass hover:text-brass'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
