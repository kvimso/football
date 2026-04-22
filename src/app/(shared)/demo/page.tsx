import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DemoRequestForm } from '@/components/demo/DemoRequestForm'
import type { DemoStatus } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Request Demo',
  description: 'Talk to the team behind Binocly. 24-hour response, no obligation.',
}

export default async function DemoPage() {
  let userEmail: string | undefined
  let existingStatus: DemoStatus | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    userEmail = user?.email ?? undefined

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

  const steps = [
    {
      n: '01',
      title: 'Tell us about you',
      desc: "Role, organisation, what you're looking for.",
    },
    { n: '02', title: 'We call within 24h', desc: 'Quick intro. No pitch deck.' },
    { n: '03', title: 'Access + pricing', desc: 'Tailored to your team size and use case.' },
  ] as const

  return (
    <section
      className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12"
      style={{ minHeight: 'calc(100vh - 77px)' }}
    >
      {/* Left column — pitch */}
      <div className="flex flex-col justify-start px-8 pt-16 pb-16 lg:col-span-7 lg:px-20 lg:pt-20 lg:pb-20">
        <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
          Request a demo
        </div>
        <h1
          className="mb-6 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground lg:text-5xl"
          style={{ fontFamily: 'var(--font-noto-serif, Georgia, serif)' }}
        >
          Talk to the team behind Binocly.
        </h1>
        <p className="mb-10 max-w-md text-[15px] leading-relaxed text-foreground-secondary">
          Tell us a little about you and we&apos;ll be in touch within 24 hours.
        </p>

        {/* 3-step strip */}
        <div className="mb-10 max-w-2xl border-t border-border pt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n}>
                <div
                  className="mb-2 text-3xl font-normal text-primary"
                  style={{ fontFamily: 'var(--font-noto-serif, Georgia, serif)' }}
                >
                  {s.n}
                </div>
                <div className="mb-1 text-sm font-semibold text-foreground">{s.title}</div>
                <div className="text-[12px] leading-relaxed text-foreground-secondary">
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Founder pull-quote */}
        <div className="mt-12 max-w-xl border-l-2 border-primary py-3 pl-6 lg:mt-40">
          <p
            className="mb-4 text-xl italic leading-relaxed text-foreground"
            style={{ fontFamily: 'var(--font-noto-serif, Georgia, serif)' }}
          >
            &ldquo;We built Binocly because the Georgian pipeline was invisible. You shouldn&apos;t
            need three phone calls to find a player.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <span
              className="text-base italic text-foreground"
              style={{ fontFamily: 'var(--font-noto-serif, Georgia, serif)' }}
            >
              Levani Talakhadze
            </span>
            <span
              aria-hidden="true"
              className="inline-block h-1 w-1 rounded-full bg-primary opacity-50"
            />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-faint">
              Founder · Binocly
            </span>
          </div>
        </div>
      </div>

      {/* Right column — form card */}
      <div className="flex items-center bg-surface px-8 py-16 lg:col-span-5 lg:px-16 lg:py-24">
        <div className="mx-auto w-full max-w-md">
          <DemoRequestForm defaultEmail={userEmail} existingStatus={existingStatus} />
        </div>
      </div>
    </section>
  )
}
