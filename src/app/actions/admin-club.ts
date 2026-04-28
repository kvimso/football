'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getAdminContext } from '@/lib/auth'
import type { Database } from '@/lib/database.types'
import { ok, err, type Result } from '@/lib/result'

type ClubUpdate = Database['public']['Tables']['clubs']['Update']

// Allow any URL that points at the club-assets bucket on this Supabase project.
// Cache-busting query strings (?v=...) are allowed.
const clubAssetUrl = z
  .string()
  .url()
  .refine(
    (u) => u.includes('/storage/v1/object/public/club-assets/'),
    'Must be a club-assets storage URL'
  )

const ClubProfileSchema = z.object({
  logo_url: clubAssetUrl.nullable().optional(),
  hero_photo_url: clubAssetUrl.nullable().optional(),
  history_text: z
    .string()
    .max(4000, 'History must be 4000 characters or fewer.')
    .nullable()
    .optional()
    .transform((v) => (typeof v === 'string' ? v.trim() || null : v)),
  gallery_urls: z.array(clubAssetUrl).max(12, 'Gallery is limited to 12 photos.').optional(),
}) satisfies z.ZodType<Partial<ClubUpdate>>

export type ClubProfileInput = z.input<typeof ClubProfileSchema>

export async function updateMyClub(
  _prev: Result<{ slug: string }> | null,
  formData: FormData
): Promise<Result<{ slug: string }>> {
  const galleryRaw = formData.get('gallery_urls')
  let galleryParsed: unknown
  try {
    galleryParsed = typeof galleryRaw === 'string' && galleryRaw ? JSON.parse(galleryRaw) : []
  } catch {
    return err('Invalid gallery payload.')
  }

  const input: ClubProfileInput = {
    logo_url: (formData.get('logo_url') as string) || null,
    hero_photo_url: (formData.get('hero_photo_url') as string) || null,
    history_text: (formData.get('history_text') as string) ?? null,
    gallery_urls: Array.isArray(galleryParsed) ? (galleryParsed as string[]) : [],
  }

  const parsed = ClubProfileSchema.safeParse(input)
  if (!parsed.success) {
    return err('Invalid input.', parsed.error.flatten().fieldErrors)
  }

  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) {
    return err(authErr ?? 'Unauthorized')
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('clubs')
    .select('slug')
    .eq('id', clubId)
    .single()
  if (fetchErr || !existing) return err('Club not found.')

  const { error: updateErr } = await supabase.from('clubs').update(parsed.data).eq('id', clubId)

  if (updateErr) {
    console.error('updateMyClub failed:', updateErr.message)
    return err('Save failed. Please try again.')
  }

  revalidatePath('/admin/club/edit')
  revalidatePath(`/clubs/${existing.slug}`)
  revalidatePath('/clubs')

  return ok({ slug: existing.slug })
}
