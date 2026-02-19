import { createAdminClient } from '@/lib/supabase/admin'

interface TrackPageViewParams {
  pageType: 'player' | 'club' | 'match'
  entityId: string
  entitySlug: string
}

export function trackPageView({ pageType, entityId, entitySlug }: TrackPageViewParams): void {
  try {
    const admin = createAdminClient()
    // Fire-and-forget — don't await, don't block rendering
    admin
      .from('page_views')
      .insert({ page_type: pageType, entity_id: entityId, entity_slug: entitySlug })
      .then(({ error }) => {
        if (error) console.error('Failed to track page view:', error.message)
      })
  } catch {
    // Silently fail — analytics should never crash the app
  }
}
