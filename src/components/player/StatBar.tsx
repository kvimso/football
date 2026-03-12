interface StatBarProps {
  label: string
  value: number | null
  maxValue?: number
}

function getColor(pct: number): string {
  if (pct >= 70) return '#10b981' // emerald-500 — above average
  if (pct >= 40) return '#f59e0b' // amber-500 — average
  return '#ef4444' // red-500 — below average
}

export function StatBar({ label, value, maxValue = 100 }: StatBarProps) {
  const numValue = value ?? 0
  const pct = Math.min(Math.max((numValue / maxValue) * 100, 0), 100)
  const color = getColor(pct)

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-foreground-muted">{label}</span>
      <div className="relative flex-1 h-2 rounded-full bg-border/50 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-sm font-semibold" style={{ color }}>
        {value ?? '-'}
      </span>
    </div>
  )
}
