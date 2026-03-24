'use server'

import { revalidatePath } from 'next/cache'
import { leagueFormSchema, uuidSchema } from '@/lib/validations'
import { getPlatformAdminContext } from '@/lib/auth'
import type { z } from 'zod'

type LeagueFormInput = z.infer<typeof leagueFormSchema>

export async function createLeague(data: LeagueFormInput) {
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  const parsed = leagueFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }

  const { error: insertError } = await admin.from('leagues').insert({
    name: parsed.data.name,
    name_ka: parsed.data.name_ka,
    age_group: parsed.data.age_group,
    season: parsed.data.season,
    starlive_url: parsed.data.starlive_url,
    description: parsed.data.description || null,
    description_ka: parsed.data.description_ka || null,
    logo_url: parsed.data.logo_url || null,
    is_active: parsed.data.is_active ?? true,
    display_order: parsed.data.display_order ?? 0,
  })

  if (insertError) {
    console.error('[platform-leagues] Create error:', insertError.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/platform/leagues')
  revalidatePath('/leagues')
  return { success: true }
}

export async function updateLeague(leagueId: string, data: LeagueFormInput) {
  if (!uuidSchema.safeParse(leagueId).success) return { error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  const parsed = leagueFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }

  const { error: updateError } = await admin
    .from('leagues')
    .update({
      name: parsed.data.name,
      name_ka: parsed.data.name_ka,
      age_group: parsed.data.age_group,
      season: parsed.data.season,
      starlive_url: parsed.data.starlive_url,
      description: parsed.data.description || null,
      description_ka: parsed.data.description_ka || null,
      logo_url: parsed.data.logo_url || null,
      is_active: parsed.data.is_active ?? true,
      display_order: parsed.data.display_order ?? 0,
    })
    .eq('id', leagueId)

  if (updateError) {
    console.error('[platform-leagues] Update error:', updateError.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/platform/leagues')
  revalidatePath('/leagues')
  return { success: true }
}

export async function deleteLeague(leagueId: string) {
  if (!uuidSchema.safeParse(leagueId).success) return { error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  const { error: deleteError } = await admin.from('leagues').delete().eq('id', leagueId)

  if (deleteError) {
    console.error('[platform-leagues] Delete error:', deleteError.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/platform/leagues')
  revalidatePath('/leagues')
  return { success: true }
}

export async function toggleLeagueActive(leagueId: string, isActive: boolean) {
  if (!uuidSchema.safeParse(leagueId).success) return { error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  const { error: updateError } = await admin
    .from('leagues')
    .update({ is_active: isActive })
    .eq('id', leagueId)

  if (updateError) {
    console.error('[platform-leagues] Toggle error:', updateError.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/platform/leagues')
  revalidatePath('/leagues')
  return { success: true }
}
