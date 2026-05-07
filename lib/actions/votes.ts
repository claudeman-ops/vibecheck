'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function castVote(ideaId: string, sessionId: string, value: 1 | 2 | 3) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('votes').upsert(
    {
      idea_id: ideaId,
      session_id: sessionId,
      user_id: user.id,
      value,
    },
    { onConflict: 'idea_id,user_id' }
  )

  if (error) throw new Error(error.message)

  revalidatePath(`/sessions/${sessionId}/vote`)
}
