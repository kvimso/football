interface DirectionSegment {
  num: number
  percent: number
}

interface DirectionData {
  left: DirectionSegment
  center: DirectionSegment
  right: DirectionSegment
}

interface AttackDirectionProps {
  homeAttack: DirectionData | null
  awayAttack: DirectionData | null
  homeTeamName: string
  awayTeamName: string
  t: (key: string) => string
}

function DirectionBar({
  data,
  teamName,
  variant,
  t,
}: {
  data: DirectionData
  teamName: string
  variant: 'home' | 'away'
  t: (key: string) => string
}) {
  const total = data.left.num + data.center.num + data.right.num
  if (total === 0) return null

  const pctLeft = Math.round(data.left.percent)
  const pctCenter = Math.round(data.center.percent)
  const pctRight = 100 - pctLeft - pctCenter // ensure they sum to 100

  const segments = [
    { label: t('matches.leftFlank'), pct: pctLeft },
    { label: t('matches.center'), pct: pctCenter },
    { label: t('matches.rightFlank'), pct: pctRight },
  ]

  const bgClass = variant === 'home' ? 'bg-primary' : 'bg-foreground-muted'
  const opacities = ['opacity-60', 'opacity-90', 'opacity-60']

  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-foreground-muted">{teamName}</div>
      <div className="flex h-8 overflow-hidden rounded-lg">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`${bgClass} ${opacities[i]} flex items-center justify-center text-xs font-semibold text-white transition-all`}
            style={{ width: `${Math.max(seg.pct, 1)}%` }}
          >
            {seg.pct >= 10 && `${seg.pct}%`}
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-foreground-faint">
        <span>{t('matches.leftFlank')}</span>
        <span>{t('matches.center')}</span>
        <span>{t('matches.rightFlank')}</span>
      </div>
    </div>
  )
}

export function AttackDirection({
  homeAttack,
  awayAttack,
  homeTeamName,
  awayTeamName,
  t,
}: AttackDirectionProps) {
  if (!homeAttack && !awayAttack) return null

  return (
    <div className="space-y-4">
      {homeAttack && (
        <DirectionBar data={homeAttack} teamName={homeTeamName} variant="home" t={t} />
      )}
      {awayAttack && (
        <DirectionBar data={awayAttack} teamName={awayTeamName} variant="away" t={t} />
      )}
    </div>
  )
}
