'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SessionStatus } from '@/lib/types/database.types'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function createSession(formData: FormData) {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log('[createSession] user:', user, 'userError:', userError)

  if (!user) redirect('/login')

  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const destination = (formData.get('destination') as string) || null
  const date_start = (formData.get('date_start') as string) || null
  const date_end = (formData.get('date_end') as string) || null
  const display_name = (formData.get('display_name') as string) || user.email?.split('@')[0] || 'Host'

  if (!title?.trim()) throw new Error('Title is required')

  // Pre-generate the ID so we never need .select() after INSERT.
  // The SELECT RLS policy requires is_session_member(), but the member row
  // doesn't exist yet — chaining .select().single() would always return 0 rows.
  const sessionId = crypto.randomUUID()

  const { error: sessionError } = await supabase
    .from('sessions')
    .insert({
      id: sessionId,
      created_by: user.id,
      title: title.trim(),
      description,
      destination,
      date_start,
      date_end,
      invite_code: generateInviteCode(),
      status: 'collecting_ideas',
    })

  console.log('[createSession] sessionError:', sessionError)
  if (sessionError) throw new Error(sessionError.message)

  const { error: memberError } = await supabase.from('session_members').insert({
    session_id: sessionId,
    user_id: user.id,
    display_name,
    is_host: true,
  })

  console.log('[createSession] memberError:', memberError)
  if (memberError) throw new Error(memberError.message)

  redirect(`/sessions/${sessionId}`)
}

export async function joinSession(sessionId: string, displayName: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/join`)

  const name = displayName.trim() || user.email?.split('@')[0] || 'Member'

  const { data: existing } = await supabase
    .from('session_members')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error } = await supabase.from('session_members').insert({
      session_id: sessionId,
      user_id: user.id,
      display_name: name,
      is_host: false,
    })
    if (error) throw new Error(error.message)
  }

  redirect(`/sessions/${sessionId}`)
}

export async function advanceSessionStatus(sessionId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session, error } = await supabase
    .from('sessions')
    .select('status, created_by')
    .eq('id', sessionId)
    .single()

  if (error || !session) throw new Error('Session not found')
  if (session.created_by !== user.id) throw new Error('Only the host can advance the session')

  const transitions: Partial<Record<SessionStatus, SessionStatus>> = {
    collecting_ideas: 'voting',
    voting: 'completed',
  }

  const nextStatus = transitions[session.status as SessionStatus]
  if (!nextStatus) throw new Error('Session is already completed')

  const { error: updateError } = await supabase
    .from('sessions')
    .update({ status: nextStatus })
    .eq('id', sessionId)

  if (updateError) throw new Error(updateError.message)

  revalidatePath(`/sessions/${sessionId}`)
}
