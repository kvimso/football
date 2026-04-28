import { createClient } from '@/lib/supabase/client'
import { ok, err, type Result } from '@/lib/result'

export const CLUB_ASSET_KINDS = ['logo', 'hero', 'gallery'] as const
export type ClubAssetKind = (typeof CLUB_ASSET_KINDS)[number]

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

const MAX_SIZE_BY_KIND: Record<ClubAssetKind, number> = {
  logo: 2 * 1024 * 1024,
  hero: 5 * 1024 * 1024,
  gallery: 5 * 1024 * 1024,
}

const extOf = (filename: string) => (filename.split('.').pop() ?? '').toLowerCase()

export async function uploadClubAsset(
  file: File,
  clubSlug: string,
  kind: ClubAssetKind
): Promise<Result<{ url: string }>> {
  const ext = extOf(file.name)
  if (!ALLOWED_EXT.has(ext)) {
    return err(`Unsupported file extension: .${ext || 'unknown'}`)
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return err(`Unsupported file type: ${file.type || 'unknown'}`)
  }
  if (file.size > MAX_SIZE_BY_KIND[kind]) {
    const mb = (MAX_SIZE_BY_KIND[kind] / (1024 * 1024)).toFixed(0)
    return err(`File too large. Max ${mb}MB.`)
  }

  const path =
    kind === 'gallery'
      ? `${clubSlug}/gallery/${crypto.randomUUID()}.${ext}`
      : `${clubSlug}/${kind}.${ext}`

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('club-assets')
    .upload(path, file, { upsert: kind !== 'gallery', contentType: file.type })

  if (error) return err(error.message)

  const { data } = supabase.storage.from('club-assets').getPublicUrl(path)
  // Cache-bust logo/hero overwrites — same path, new bytes, browsers cache.
  // Gallery items use unique UUID paths and don't need this.
  const url = kind === 'gallery' ? data.publicUrl : `${data.publicUrl}?v=${Date.now()}`

  return ok({ url })
}
