'use server'

import { revalidatePath } from 'next/cache'
import { clubFormSchema, uuidSchema } from '@/lib/validations'
import { getPlatformAdminContext } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'
import { getServerT } from '@/lib/server-translations'
import type { z } from 'zod'

type ClubFormInput = z.infer<typeof clubFormSchema>

export async function createClub(data: ClubFormInput) {
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  const parsed = clubFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }

  const slug = generateSlug(parsed.data.name)

  // Check for duplicate slug
  const { data: existing } = await admin
    .from('clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug

  const { error: insertError } = await admin
    .from('clubs')
    .insert({
      name: parsed.data.name,
      name_ka: parsed.data.name_ka,
      slug: finalSlug,
      city: parsed.data.city || null,
      region: parsed.data.region || null,
      description: parsed.data.description || null,
      description_ka: parsed.data.description_ka || null,
      website: parsed.data.website || null,
    })

  if (insertError) return { error: insertError.message }

  revalidatePath('/platform/clubs')
  revalidatePath('/clubs')
  return { success: true }
}

export async function updateClub(clubId: string, data: ClubFormInput) {
  if (!uuidSchema.safeParse(clubId).success) return { error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  const parsed = clubFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }

  const { error: updateError } = await admin
    .from('clubs')
    .update({
      name: parsed.data.name,
      name_ka: parsed.data.name_ka,
      city: parsed.data.city || null,
      region: parsed.data.region || null,
      description: parsed.data.description || null,
      description_ka: parsed.data.description_ka || null,
      website: parsed.data.website || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clubId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/platform/clubs')
  revalidatePath('/clubs')
  return { success: true }
}

export async function deleteClub(clubId: string) {
  if (!uuidSchema.safeParse(clubId).success) return { error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  // Check for active players
  const { count } = await admin
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', clubId)

  if (count && count > 0) {
    const { t } = await getServerT()
    return { error: t('platform.clubs.cannotDeleteWithPlayers') }
  }

  const { error: deleteError } = await admin
    .from('clubs')
    .delete()
    .eq('id', clubId)

  if (deleteError) return { error: deleteError.message }

  revalidatePath('/platform/clubs')
  revalidatePath('/clubs')
  return { success: true }
}
