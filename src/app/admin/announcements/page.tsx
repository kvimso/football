import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { AnnouncementForm } from '@/components/admin/AnnouncementForm'
import { AnnouncementList } from '@/components/admin/AnnouncementList'

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()
  const { t } = await getServerT()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  if (!profile?.club_id) {
    return (
      <div className="p-8 text-center text-foreground-muted">
        <p>{t('admin.noClub')}</p>
      </div>
    )
  }

  const { data: announcements } = await supabase
    .from('academy_announcements')
    .select('id, content, created_at')
    .eq('club_id', profile.club_id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('admin.announcements.title')}</h1>
      <p className="mt-1 text-sm text-foreground-muted">{t('admin.announcements.subtitle')}</p>

      <div className="mt-6">
        <AnnouncementForm
          labels={{
            placeholder: t('admin.announcements.placeholder'),
            publish: t('admin.announcements.publish'),
            publishing: t('admin.announcements.publishing'),
            charsRemaining: t('admin.announcements.charsRemaining'),
            rateLimitReached: t('admin.announcements.rateLimitReached'),
            published: t('admin.announcements.published'),
            error: t('admin.announcements.error'),
          }}
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
        {t('admin.announcements.pastAnnouncements')}
      </h2>
      <div className="mt-3">
        <AnnouncementList
          announcements={announcements ?? []}
          labels={{
            delete: t('admin.announcements.delete'),
            confirmDelete: t('admin.announcements.confirmDelete'),
            deleting: t('admin.announcements.deleting'),
            noAnnouncements: t('admin.announcements.noAnnouncements'),
          }}
        />
      </div>
    </div>
  )
}
