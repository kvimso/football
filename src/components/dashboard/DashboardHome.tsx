'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'

interface DashboardHomeProps {
  fullName: string
  shortlistCount: number
  requestCount: number
}

export function DashboardHome({ fullName, shortlistCount, requestCount }: DashboardHomeProps) {
  const { t } = useLang()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        {t('dashboard.welcome')}, {fullName}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/dashboard/shortlist" className="card group">
          <div className="text-3xl font-bold text-accent">{shortlistCount}</div>
          <div className="mt-1 text-sm font-medium text-foreground">{t('dashboard.shortlist')}</div>
          <div className="mt-0.5 text-xs text-foreground-muted">{t('dashboard.shortlistDesc')}</div>
        </Link>

        <Link href="/dashboard/requests" className="card group">
          <div className="text-3xl font-bold text-accent">{requestCount}</div>
          <div className="mt-1 text-sm font-medium text-foreground">{t('dashboard.requests')}</div>
          <div className="mt-0.5 text-xs text-foreground-muted">{t('dashboard.requestsDesc')}</div>
        </Link>

        <Link href="/players/compare" className="card group">
          <div className="text-3xl font-bold text-accent/50">&#8644;</div>
          <div className="mt-1 text-sm font-medium text-foreground">{t('dashboard.compare')}</div>
          <div className="mt-0.5 text-xs text-foreground-muted">{t('dashboard.compareDesc')}</div>
        </Link>
      </div>

      {/* Quick links */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">{t('dashboard.quickActions')}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/players" className="btn-primary text-sm">
            {t('home.browsePlayers')}
          </Link>
          <Link href="/matches" className="btn-secondary text-sm">
            {t('nav.matches')}
          </Link>
          <Link href="/clubs" className="btn-secondary text-sm">
            {t('nav.clubs')}
          </Link>
        </div>
      </div>
    </div>
  )
}
