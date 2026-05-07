'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { IdeaCategory } from '@/lib/types/database.types'

export async function submitIdea(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const session_id = formData.get('session_id') as string
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string) || null
  const category = (formData.get('category') as IdeaCategory) || 'activity'
  const url = (formData.get('url') as string) || null
  const estimated_cost = (formData.get('estimated_cost') as string) || null

  if (!title) throw new Error('Title is required')

  const { error } = await supabase.from('ideas').insert({
    session_id,
    submitted_by: user.id,
    title,
    description,
    category,
    url,
    estimated_cost,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/sessions/${session_id}/ideas`)
}

export async function deleteIdea(ideaId: string, sessionId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', ideaId)
    .eq('submitted_by', user.id) // RLS double-check

  if (error) throw new Error(error.message)

  revalidatePath(`/sessions/${sessionId}/ideas`)
}
