import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Idea, IdeaCategory, Session, Vote } from '@/lib/types/database.types'

const CATEGORY_EMOJI: Record<IdeaCategory, string> = {
  activity: '🎯',
  restaurant: '🍽️',
  event: '🎟️',
  accommodation: '🏠',
  transport: '🚗',
  other: '💡',
}

const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  activity: 'Activities',
  restaurant: 'Restaurants',
  event: 'Events',
  accommodation: 'Stays',
  transport: 'Transport',
  other: 'Other',
}

function scoreBadge(score: number, maxScore: number) {
  const pct = maxScore > 0 ? score / maxScore : 0
  if (pct >= 0.8) return { label: 'Must-do', className: 'bg-green-100 text-green-700' }
  if (pct >= 0.5) return { label: 'Popular', className: 'bg-amber-100 text-amber-700' }
  return { label: 'Maybe', className: 'bg-gray-100 text-gray-600' }
}

export default async function SchedulePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: session }, { data: ideas }, { data: votes }, { data: membership }] = await Promise.all([
    supabase.from('sessions').select('id, title, status, destination, date_start, date_end, invite_code').eq('id', params.id).single(),
    supabase
      .from('ideas')
      .select('*, session_members!ideas_submitted_by_fkey(display_name)')
      .eq('session_id', params.id),
    supabase.from('votes').select('*').eq('session_id', params.id),
    supabase
      .from('session_members')
      .select('id')
      .eq('session_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!session) notFound()
  if (!membership) redirect(`/join/${(session as unknown as Session).invite_code}`)

  const typedSession = session as unknown as Session
  if (typedSession.status !== 'completed') redirect(`/sessions/${params.id}`)

  const typedIdeas = (ideas ?? []) as unknown as (Idea & { session_members?: { display_name: string } })[]
  const typedVotes = (votes ?? []) as unknown as Vote[]

  // Compute scores
  const ideaScores = typedIdeas.map((idea) => {
    const ideaVotes = typedVotes.filter((v) => v.idea_id === idea.id)
    const score = ideaVotes.reduce((sum, v) => sum + v.value, 0)
    const loves = ideaVotes.filter((v) => v.value === 3).length
    const likes = ideaVotes.filter((v) => v.value === 2).length
    const passes = ideaVotes.filter((v) => v.value === 1).length
    return { ...idea, score, loves, likes, passes, voteCount: ideaVotes.length }
  })

  const maxScore = Math.max(...ideaScores.map((i) => i.score), 1)

  // Group by category, sorted by score descending
  const categories = (Object.keys(CATEGORY_LABELS) as IdeaCategory[]).filter((cat) =>
    ideaScores.some((i) => i.category === cat)
  )

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/sessions/${params.id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← {typedSession.title}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">The Schedule</h1>
        {typedSession.destination && (
          <p className="text-gray-500 mt-0.5">📍 {typedSession.destination}</p>
        )}
        {typedSession.date_start && (
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(typedSession.date_start).toLocaleDateString()} —{' '}
            {typedSession.date_end ? new Date(typedSession.date_end).toLocaleDateString() : '?'}
          </p>
        )}
      </div>

      {ideaScores.length === 0 && (
        <p className="text-center text-gray-400 py-10">No ideas were submitted.</p>
      )}

      {categories.map((cat) => {
        const catIdeas = ideaScores
          .filter((i) => i.category === cat)
          .sort((a, b) => b.score - a.score)

        return (
          <div key={cat}>
            <h2 className="text-base font-bold text-gray-700 mb-3">
              {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}
            </h2>
            <div className="space-y-3">
              {catIdeas.map((idea, idx) => {
                const badge = scoreBadge(idea.score, maxScore)
                return (
                  <div
                    key={idea.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start"
                  >
                    <div className="text-2xl font-black text-gray-200 w-7 shrink-0 text-right leading-none mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{idea.title}</h3>
                          {idea.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{idea.description}</p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {idea.loves > 0 && <span>🔥 {idea.loves}</span>}
                        {idea.likes > 0 && <span>👍 {idea.likes}</span>}
                        {idea.passes > 0 && <span>😐 {idea.passes}</span>}
                        {idea.voteCount === 0 && <span>No votes</span>}
                        {idea.estimated_cost && <span>· {idea.estimated_cost}</span>}
                        {idea.url && (
                          <a
                            href={idea.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-500 hover:underline"
                          >
                            Link →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
