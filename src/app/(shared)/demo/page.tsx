import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DemoRequestForm } from '@/components/demo/DemoRequestForm'
import { getServerT } from '@/lib/server-translations'
import type { DemoStatus } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Request Demo',
  description: 'Schedule a demo of the Georgian Football Talent Platform.',
}

export default async function DemoPage() {
  const { t } = await getServerT()

  let userEmail: string | undefined
  let existingStatus: DemoStatus | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userEmail = user?.email ?? undefined

    // Check if logged-in user already has a demo request
    if (user) {
      const admin = createAdminClient()
      const { data: existing } = await admin
        .from('demo_requests')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()
      if (existing) {
        existingStatus = existing.status as DemoStatus
      }
    }
  } catch {
    // Auth check failed — show default form
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-20">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Left panel — value prop + pricing */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t('demo.headline')}</h1>
          <p className="mt-3 text-foreground-muted">{t('demo.pageSubtitle')}</p>

          <ul className="mt-8 space-y-4">
            {(['benefit1', 'benefit2', 'benefit3', 'benefit4'] as const).map((key) => (
              <li key={key} className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-sm text-foreground-secondary">{t(`demo.${key}`)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-foreground">{t('demo.pricingTitle')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground-secondary">
              <li>{t('demo.pricingClub')}</li>
              <li>{t('demo.pricingScout')}</li>
              <li>{t('demo.pricingAcademy')}</li>
            </ul>
            <p className="mt-3 text-xs text-foreground-muted">{t('demo.pricingNote')}</p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-foreground">{t('demo.title')}</h2>
          </div>
          <DemoRequestForm defaultEmail={userEmail} existingStatus={existingStatus} />
        </div>
      </div>
    </div>
  )
}
