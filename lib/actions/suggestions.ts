'use server'

import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { IdeaCategory } from '@/lib/types/database.types'

export type Suggestion = {
  title: string
  category: IdeaCategory
  description: string
  estimated_cost: string | null
}

export async function getSuggestions(sessionId: string): Promise<Suggestion[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('title, description, destination, date_start, date_end')
    .eq('id', sessionId)
    .single()

  if (!session) throw new Error('Session not found')

  const contextParts: string[] = []
  if (session.destination) contextParts.push(`Destination: ${session.destination}`)
  if (session.date_start) {
    const dateStr = session.date_end
      ? `${session.date_start} to ${session.date_end}`
      : `starting ${session.date_start}`
    contextParts.push(`Dates: ${dateStr}`)
  }
  if (session.description) contextParts.push(`Vibe / notes: ${session.description}`)
  if (!contextParts.length) contextParts.push(`Trip: ${session.title}`)

  const client = new Anthropic()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a travel planning assistant. Suggest 8 ideas for a group trip.

${contextParts.join('\n')}

Return ONLY a JSON array with exactly 8 objects. Each object must have:
- "title": string (concise, max 60 chars)
- "category": one of "activity" | "restaurant" | "event" | "accommodation" | "transport" | "other"
- "description": string (1–2 sentences, specific and compelling)
- "estimated_cost": string or null (e.g. "~$25/person", "Free", null)

Mix categories thoughtfully. Be specific to the destination. Return only the JSON array, no other text.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  // Strip markdown code fences if the model wraps them
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(clean) as Suggestion[]
}

export async function addSuggestion(sessionId: string, suggestion: Suggestion) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('ideas').insert({
    session_id: sessionId,
    submitted_by: user.id,
    title: suggestion.title,
    description: suggestion.description,
    category: suggestion.category,
    estimated_cost: suggestion.estimated_cost,
    url: null,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/sessions/${sessionId}/ideas`)
}
