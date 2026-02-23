'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { StarIcon, MessageIcon, ArrowsIcon } from '@/components/ui/Icons'

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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <StarIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-accent">{shortlistCount}</div>
              <div className="text-sm font-medium text-foreground">{t('dashboard.shortlist')}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-foreground-muted">{t('dashboard.shortlistDesc')}</div>
        </Link>

        <Link href="/dashboard/requests" className="card group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <MessageIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-accent">{requestCount}</div>
              <div className="text-sm font-medium text-foreground">{t('dashboard.requests')}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-foreground-muted">{t('dashboard.requestsDesc')}</div>
        </Link>

        <Link href="/players/compare" className="card group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <ArrowsIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-accent/50">&#8644;</div>
              <div className="text-sm font-medium text-foreground">{t('dashboard.compare')}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-foreground-muted">{t('dashboard.compareDesc')}</div>
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
