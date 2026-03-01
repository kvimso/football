interface SkillSet {
  pace: number | null
  shooting: number | null
  passing: number | null
  dribbling: number | null
  defending: number | null
  physical: number | null
}

interface CompareRadarChartProps {
  skills1: SkillSet
  skills2: SkillSet
  labels: string[]
  player1Name: string
  player2Name: string
}

const SIZE = 240
const CENTER = SIZE / 2
const RADIUS = 90
const LEVELS = 5

function getPoint(index: number, value: number, maxRadius: number): [number, number] {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
  const r = (value / 100) * maxRadius
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]
}

function toPolygon(skills: SkillSet, maxRadius: number): string {
  const values = [skills.pace ?? 0, skills.shooting ?? 0, skills.passing ?? 0, skills.dribbling ?? 0, skills.defending ?? 0, skills.physical ?? 0]
  return values.map((v, i) => {
    const [x, y] = getPoint(i, v, maxRadius)
    return `${x},${y}`
  }).join(' ')
}

function getDataPoints(skills: SkillSet, maxRadius: number): [number, number][] {
  const values = [skills.pace ?? 0, skills.shooting ?? 0, skills.passing ?? 0, skills.dribbling ?? 0, skills.defending ?? 0, skills.physical ?? 0]
  return values.map((v, i) => getPoint(i, v, maxRadius))
}

export function CompareRadarChart({ skills1, skills2, labels, player1Name, player2Name }: CompareRadarChartProps) {
  const p1Points = getDataPoints(skills1, RADIUS)
  const p2Points = getDataPoints(skills2, RADIUS)

  return (
    <div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[280px]">
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

        {/* Player 1 polygon (emerald/accent) */}
        <polygon
          points={toPolygon(skills1, RADIUS)}
          fill="var(--accent)"
          fillOpacity={0.15}
          stroke="var(--accent)"
          strokeWidth={2}
        />

        {/* Player 2 polygon (blue) */}
        <polygon
          points={toPolygon(skills2, RADIUS)}
          fill="var(--pos-def)"
          fillOpacity={0.15}
          stroke="var(--pos-def)"
          strokeWidth={2}
        />

        {/* Player 1 data points */}
        {p1Points.map(([x, y], i) => (
          <circle key={`p1-${i}`} cx={x} cy={y} r={3} fill="var(--accent)" />
        ))}

        {/* Player 2 data points */}
        {p2Points.map(([x, y], i) => (
          <circle key={`p2-${i}`} cx={x} cy={y} r={3} fill="var(--pos-def)" />
        ))}

        {/* Labels */}
        {labels.map((label, i) => {
          const [x, y] = getPoint(i, 100, RADIUS + 22)
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
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-foreground-muted">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          <span>{player1Name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--pos-def)]" />
          <span>{player2Name}</span>
        </div>
      </div>
    </div>
  )
}
