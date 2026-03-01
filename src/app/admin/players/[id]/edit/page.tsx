import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import type { Position } from '@/lib/types'
import { PlayerForm } from '@/components/admin/PlayerForm'

interface EditPlayerPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditPlayerPage({ params }: EditPlayerPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { t } = await getServerT()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  if (profileError) console.error('Failed to fetch profile:', profileError.message)
  if (!profile?.club_id) {
    return (
      <div className="p-8 text-center text-foreground-muted">
        <p>{t('admin.noClub')}</p>
      </div>
    )
  }

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, name, name_ka, date_of_birth, position, preferred_foot, height_cm, weight_kg, parent_guardian_contact, club_id')
    .eq('id', id)
    .single()

  if (playerError) console.error('Failed to fetch player:', playerError.message)
  if (!player || player.club_id !== profile.club_id) return notFound()

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/players" className="text-sm text-foreground-muted hover:text-foreground">
          &larr; {t('admin.common.backToList')}
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t('admin.players.editPlayer')}</h1>
      <PlayerForm player={{ ...player, position: player.position as Position }} />
    </div>
  )
}
