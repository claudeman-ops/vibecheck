import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { VotingUI } from './voting-ui'
import type { Idea, Session, Vote } from '@/lib/types/database.types'

export default async function VotePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: session }, { data: ideas }, { data: myVotes }, { data: membership }, { data: members }] = await Promise.all([
    supabase.from('sessions').select('id, title, status, invite_code').eq('id', params.id).single(),
    supabase
      .from('ideas')
      .select('*')
      .eq('session_id', params.id)
      .order('created_at', { ascending: true }),
    supabase.from('votes').select('*').eq('session_id', params.id).eq('user_id', user.id),
    supabase
      .from('session_members')
      .select('id')
      .eq('session_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('session_members').select('user_id, display_name').eq('session_id', params.id),
  ])

  if (!session) notFound()
  if (!membership) redirect(`/join/${(session as unknown as Session).invite_code}`)

  const typedSession = session as unknown as Session

  if (typedSession.status === 'collecting_ideas') {
    redirect(`/sessions/${params.id}/ideas`)
  }
  if (typedSession.status === 'completed') {
    redirect(`/sessions/${params.id}/schedule`)
  }

  const memberNames = Object.fromEntries(
    ((members ?? []) as { user_id: string; display_name: string }[]).map((m) => [m.user_id, m.display_name])
  )
  const typedIdeas = (ideas ?? []).map((idea) => ({
    ...(idea as unknown as Idea),
    session_members: idea.submitted_by ? { display_name: memberNames[idea.submitted_by] } : undefined,
  }))
  const initialVotes = (myVotes ?? []).reduce<Record<string, number>>((acc, v) => {
    const vote = v as unknown as Vote
    acc[vote.idea_id] = vote.value
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/sessions/${params.id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← {typedSession.title}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Vote on ideas</h1>
        <p className="text-sm text-gray-400 mt-0.5">{typedIdeas.length} ideas to rate</p>
      </div>

      <VotingUI ideas={typedIdeas} sessionId={params.id} initialVotes={initialVotes} />
    </div>
  )
}
