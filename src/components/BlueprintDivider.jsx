export default function BlueprintDivider({ label }) {
  return (
    <div className="flex items-center gap-4 py-2" aria-hidden="true">
      <svg width="100%" height="16" viewBox="0 0 100 16" preserveAspectRatio="none" className="flex-1 h-4">
        <line x1="0" y1="8" x2="4" y2="2" className="dim-tick" />
        <line x1="0" y1="8" x2="100" y2="8" className="dim-tick" strokeDasharray="1 3" />
        <line x1="100" y1="8" x2="96" y2="2" className="dim-tick" />
      </svg>
      {label && (
        <span className="font-mono text-[11px] tracking-widest text-brass whitespace-nowrap uppercase">
          {label}
        </span>
      )}
      <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true">
        <line x1="0" y1="8" x2="24" y2="8" className="dim-tick" strokeDasharray="1 3" />
      </svg>
    </div>
  )
}
