interface RadarChartProps {
  skills: {
    attack?: number | null
    shooting?: number | null
    possession?: number | null
    dribbling?: number | null
    defence?: number | null
    fitness?: number | null
  }
  labels: string[]
}

const SIZE = 240
const CENTER = SIZE / 2
const RADIUS = 90
const LEVELS = 5
const MAX_SKILL = 10

function getPoint(index: number, value: number, maxRadius: number): [number, number] {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
  const r = (value / MAX_SKILL) * maxRadius
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]
}

export function RadarChart({ skills, labels }: RadarChartProps) {
  // 6 values for 6 axes: attack, shooting, possession, dribbling, defence, fitness
  const values = [
    skills.attack ?? 0,
    skills.shooting ?? 0,
    skills.possession ?? 0,
    skills.dribbling ?? 0,
    skills.defence ?? 0,
    skills.fitness ?? 0,
  ]

  // Build polygon for player stats
  const points = values.map((v, i) => getPoint(i, v, RADIUS))
  const polygonPoints = points.map(([x, y]) => `${x},${y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[240px]">
      {/* Background fill for chart area */}
      <polygon
        points={Array.from({ length: 6 }, (_, i) => {
          const [x, y] = getPoint(i, MAX_SKILL, RADIUS)
          return `${x},${y}`
        }).join(' ')}
        fill="var(--surface)"
        fillOpacity={0.5}
      />

      {/* Grid levels */}
      {Array.from({ length: LEVELS }, (_, level) => {
        const gridPoints = Array.from({ length: 6 }, (_, i) => {
          const [x, y] = getPoint(i, ((level + 1) / LEVELS) * MAX_SKILL, RADIUS)
          return `${x},${y}`
        }).join(' ')
        return (
          <polygon
            key={level}
            points={gridPoints}
            fill="none"
            stroke="var(--border)"
            strokeWidth={0.5}
          />
        )
      })}

      {/* Axis lines */}
      {Array.from({ length: 6 }, (_, i) => {
        const [x, y] = getPoint(i, MAX_SKILL, RADIUS)
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="var(--border)"
            strokeWidth={0.5}
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="var(--primary)"
        fillOpacity={0.2}
        stroke="var(--primary)"
        strokeWidth={2}
      />

      {/* Data points */}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="var(--primary)" />
      ))}

      {/* Labels */}
      {labels.map((label, i) => {
        const [x, y] = getPoint(i, MAX_SKILL, RADIUS + 18)
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[10px] fill-foreground-muted font-medium"
          >
            {label}
          </text>
        )
      })}

      {/* Values */}
      {values.map((val, i) => {
        const [x, y] = getPoint(i, MAX_SKILL, RADIUS + 32)
        return (
          <text
            key={`val-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[9px] fill-foreground font-bold"
          >
            {val}
          </text>
        )
      })}
    </svg>
  )
}
