export default function EnvioOpcion({ seleccionado, onClick, titulo, monto }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-4 border rounded-sm px-4 py-3 text-left transition-colors ${
        seleccionado ? 'border-brass bg-brass/10' : 'border-line hover:border-brass/60'
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`w-4 h-4 rounded-full border-2 shrink-0 ${
            seleccionado ? 'border-brass bg-brass' : 'border-line'
          }`}
        />
        <span className="text-sm text-parchment">{titulo}</span>
      </span>
      <span className="font-mono text-sm text-walnut2 shrink-0">{monto}</span>
    </button>
  )
}
