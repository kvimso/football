import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ContactForm } from '@/components/contact/ContactForm'
import { getServerT } from '@/lib/server-translations'

export const metadata: Metadata = {
  title: 'Contact | Georgian Football Talent',
  description: 'Get in touch with the Georgian Football Talent Platform team.',
}

export default async function ContactPage() {
  const { t } = await getServerT()

  let userEmail: string | undefined
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userEmail = user?.email ?? undefined
  } catch {
    // Auth check failed — show default form
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">{t('contact.title')}</h1>
            <p className="mt-1 text-sm text-foreground-muted">{t('contact.subtitle')}</p>
          </div>
          <ContactForm defaultEmail={userEmail} />
        </div>
      </div>
    </div>
  )
}
