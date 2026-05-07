import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { deleteIdea } from '@/lib/actions/ideas'
import { IdeaForm } from './idea-form'
import type { Idea, IdeaCategory, Session, SessionMember } from '@/lib/types/database.types'

const CATEGORY_EMOJI: Record<IdeaCategory, string> = {
  activity: '🎯',
  restaurant: '🍽️',
  event: '🎟️',
  accommodation: '🏠',
  transport: '🚗',
  other: '💡',
}

export default async function IdeasPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: session }, { data: ideas }, { data: members }] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, title, status, invite_code')
      .eq('id', params.id)
      .single(),
    supabase
      .from('ideas')
      .select('*')
      .eq('session_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('session_members')
      .select('user_id, display_name')
      .eq('session_id', params.id),
  ])

  if (!session) notFound()

  const typedSession = session as unknown as Session
  const typedMembers = (members ?? []) as unknown as Pick<SessionMember, 'user_id' | 'display_name'>[]

  const membership = typedMembers.find((m) => m.user_id === user.id)
  if (!membership) redirect(`/join/${typedSession.invite_code}`)

  const memberNames: Record<string, string> = Object.fromEntries(
    typedMembers.map((m) => [m.user_id, m.display_name])
  )

  const typedIdeas = (ideas ?? []) as unknown as Idea[]
  const isOpen = typedSession.status === 'collecting_ideas'

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/sessions/${params.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {typedSession.title}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Ideas</h1>
        <p className="text-sm text-gray-400 mt-0.5">{typedIdeas.length} submitted</p>
      </div>

      {isOpen ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Add your idea</h2>
          <IdeaForm sessionId={params.id} />
        </div>
      ) : (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-sm text-amber-700">
          Idea submission is closed — voting is now open.
        </div>
      )}

      <div className="space-y-3">
        {typedIdeas.map((idea) => {
          const isOwn = idea.submitted_by === user.id
          const submitterName = idea.submitted_by
            ? (memberNames[idea.submitted_by] ?? 'Someone')
            : 'Someone'

          return (
            <div
              key={idea.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3"
            >
              <div className="text-xl shrink-0 mt-0.5">
                {CATEGORY_EMOJI[idea.category]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{idea.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      by {submitterName}
                      {idea.estimated_cost && ` · ${idea.estimated_cost}`}
                    </p>
                  </div>
                  {isOwn && isOpen && (
                    <form action={deleteIdea.bind(null, idea.id, params.id)}>
                      <button
                        type="submit"
                        className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </div>
                {idea.description && (
                  <p className="text-sm text-gray-600 mt-1.5">{idea.description}</p>
                )}
                {idea.url && (
                  <a
                    href={idea.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-500 hover:underline mt-1 block truncate"
                  >
                    {idea.url}
                  </a>
                )}
              </div>
            </div>
          )
        })}
        {typedIdeas.length === 0 && (
          <p className="text-center text-gray-400 py-10">No ideas yet — be the first!</p>
        )}
      </div>
    </div>
  )
}
