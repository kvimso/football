import Anthropic from '@anthropic-ai/sdk'
import { AISearchFiltersSchema, type AISearchFilters } from './types'
import { AI_SEARCH_SYSTEM_PROMPT } from './prompt'

const anthropic = new Anthropic()

export async function parseSearchQuery(query: string): Promise<AISearchFilters> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: AI_SEARCH_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: query }],
    })

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Strip any markdown fencing Claude might add despite instructions
    const cleanJson = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()

    const parsed = JSON.parse(cleanJson)
    return AISearchFiltersSchema.parse(parsed)
  } catch (error) {
    console.error('[ai-search] Parse error:', error)
    return {}
  }
}
