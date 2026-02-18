'use client'

interface RadarChartProps {
  skills: {
    pace: number
    shooting: number
    passing: number
    dribbling: number
    defending: number
    physical: number
  }
}

const LABELS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']
const SIZE = 240
const CENTER = SIZE / 2
const RADIUS = 90
const LEVELS = 5

function getPoint(index: number, value: number, maxRadius: number): [number, number] {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
  const r = (value / 100) * maxRadius
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]
}

export function RadarChart({ skills }: RadarChartProps) {
  const values = [skills.pace, skills.shooting, skills.passing, skills.dribbling, skills.defending, skills.physical]

  // Build polygon for player stats
  const points = values.map((v, i) => getPoint(i, v, RADIUS))
  const polygonPoints = points.map(([x, y]) => `${x},${y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[240px]">
      {/* Grid levels */}
      {Array.from({ length: LEVELS }, (_, level) => {
        const gridPoints = Array.from({ length: 6 }, (_, i) => {
          const [x, y] = getPoint(i, ((level + 1) / LEVELS) * 100, RADIUS)
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
        const [x, y] = getPoint(i, 100, RADIUS)
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
        fill="var(--accent)"
        fillOpacity={0.2}
        stroke="var(--accent)"
        strokeWidth={2}
      />

      {/* Data points */}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="var(--accent)" />
      ))}

      {/* Labels */}
      {LABELS.map((label, i) => {
        const [x, y] = getPoint(i, 100, RADIUS + 18)
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
        const [x, y] = getPoint(i, 100, RADIUS + 32)
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
