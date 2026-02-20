import { createAdminClient } from '@/lib/supabase/admin'

interface TrackPageViewParams {
  pageType: 'player' | 'club' | 'match'
  entityId: string
  entitySlug: string
}

export async function trackPageView({ pageType, entityId, entitySlug }: TrackPageViewParams): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('page_views')
      .insert({ page_type: pageType, entity_id: entityId, entity_slug: entitySlug })
    if (error) console.error('Failed to track page view:', error.message)
  } catch {
    // Silently fail — analytics should never crash the app
  }
}
