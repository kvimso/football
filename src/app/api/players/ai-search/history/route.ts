import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { authenticateRequest, apiSuccess, apiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient(request)
    const { user, error: authResponse } = await authenticateRequest(supabase)
    if (authResponse) return authResponse

    const { data: history, error } = await supabase
      .from('ai_search_history')
      .select('id, query_text, result_count, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(4)

    if (error) {
      console.error('[ai-search/history] Fetch error:', error.message)
      return apiError('errors.serverError', 500)
    }

    return apiSuccess({ history: history ?? [] })
  } catch (error) {
    console.error('[ai-search/history] Unexpected error:', error)
    return apiError('errors.serverError', 500)
  }
}
