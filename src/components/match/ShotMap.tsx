interface ShotMapProps {
  zones: Record<string, number> | null
  onTargetZones: Record<string, number> | null
  teamName: string
  t: (key: string) => string
}

/** Zone center coordinates for viewBox="0 0 360 240" (4x3 grid on attacking half) */
const ZONE_CENTERS: Record<string, [number, number]> = {
  '0': [90, 30],
  '1': [180, 30],
  '2': [270, 30],
  '3': [90, 82],
  '4': [180, 82],
  '5': [270, 82],
  '6': [90, 140],
  '7': [180, 140],
  '8': [270, 140],
  '9': [90, 200],
  '10': [180, 200],
  '11': [270, 200],
}

/** Max circle radius — scales with shot count */
const MAX_RADIUS = 28
const MIN_RADIUS = 10

export function ShotMap({ zones, onTargetZones, teamName, t }: ShotMapProps) {
  if (!zones) return null

  const entries = Object.entries(ZONE_CENTERS)
    .map(([zoneId, [cx, cy]]) => {
      const total = zones[zoneId] ?? 0
      const onTarget = onTargetZones?.[zoneId] ?? 0
      return { zoneId, cx, cy, total, onTarget }
    })
    .filter((z) => z.total > 0)

  const maxShots = Math.max(...entries.map((z) => z.total), 1)
  const totalShots = entries.reduce((sum, z) => sum + z.total, 0)
  const totalOnTarget = entries.reduce((sum, z) => sum + z.onTarget, 0)

  const titleId = `shotmap-title-${teamName.replace(/\s+/g, '-').toLowerCase()}`
  const descId = `shotmap-desc-${teamName.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <svg
      viewBox="0 0 360 240"
      className="w-full"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>
        {t('matches.shotMap')} — {teamName}
      </title>
      <desc id={descId}>
        {totalShots} {t('matches.shots')}, {totalOnTarget} {t('stats.shotsOnTarget')}
      </desc>

      {/* Pitch outline */}
      <rect
        x="10"
        y="5"
        width="340"
        height="230"
        rx="2"
        fill="none"
        stroke="var(--border)"
        strokeWidth="1.5"
        role="presentation"
      />
      {/* Penalty area */}
      <rect
        x="80"
        y="5"
        width="200"
        height="100"
        fill="none"
        stroke="var(--border)"
        strokeWidth="1"
        role="presentation"
      />
      {/* Goal area (6-yard box) */}
      <rect
        x="130"
        y="5"
        width="100"
        height="40"
        fill="none"
        stroke="var(--border)"
        strokeWidth="1"
        role="presentation"
      />
      {/* Penalty spot */}
      <circle cx="180" cy="80" r="2.5" fill="var(--border)" role="presentation" />
      {/* Penalty arc (only the part outside the box) */}
      <path
        d="M 130 100 A 50 50 0 0 0 230 100"
        fill="none"
        stroke="var(--border)"
        strokeWidth="1"
        role="presentation"
      />

      {/* Shot zones */}
      {entries.map(({ zoneId, cx, cy, total, onTarget }) => {
        const ratio = total / maxShots
        const r = MIN_RADIUS + ratio * (MAX_RADIUS - MIN_RADIUS)
        const hasOnTarget = onTarget > 0

        return (
          <g key={zoneId} role="presentation">
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={hasOnTarget ? 'var(--primary)' : 'var(--foreground-faint)'}
              opacity={hasOnTarget ? 0.7 : 0.4}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--foreground)"
              fontSize="12"
              fontWeight="600"
              role="presentation"
            >
              {total}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
