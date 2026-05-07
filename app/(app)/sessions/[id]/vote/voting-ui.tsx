'use client'

import { useState, useTransition } from 'react'
import { castVote } from '@/lib/actions/votes'
import type { Idea, IdeaCategory } from '@/lib/types/database.types'

const CATEGORY_EMOJI: Record<IdeaCategory, string> = {
  activity: '🎯',
  restaurant: '🍽️',
  event: '🎟️',
  accommodation: '🏠',
  transport: '🚗',
  other: '💡',
}

const VOTE_OPTIONS = [
  { value: 1, label: 'Pass', emoji: '😐' },
  { value: 2, label: 'Like', emoji: '👍' },
  { value: 3, label: 'Love', emoji: '🔥' },
] as const

type IdeaWithSubmitter = Idea & { session_members?: { display_name: string } }

type Props = {
  ideas: IdeaWithSubmitter[]
  sessionId: string
  initialVotes: Record<string, number>
}

export function VotingUI({ ideas, sessionId, initialVotes }: Props) {
  const [votes, setVotes] = useState<Record<string, number>>(initialVotes)
  const [, startTransition] = useTransition()

  function handleVote(ideaId: string, value: 1 | 2 | 3) {
    setVotes((prev) => ({ ...prev, [ideaId]: value }))
    startTransition(() => {
      castVote(ideaId, sessionId, value)
    })
  }

  const votedCount = Object.keys(votes).length
  const pct = ideas.length > 0 ? Math.round((votedCount / ideas.length) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">Your progress</span>
          <span className="text-gray-400">{votedCount} / {ideas.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2 bg-violet-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {votedCount === ideas.length && ideas.length > 0 && (
          <p className="text-sm text-green-600 font-medium mt-2">All done! Waiting for others.</p>
        )}
      </div>

      {/* Idea cards */}
      {ideas.map((idea) => {
        const currentVote = votes[idea.id]
        return (
          <div key={idea.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex gap-3 mb-4">
              <span className="text-2xl shrink-0">{CATEGORY_EMOJI[idea.category]}</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">{idea.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  by {idea.session_members?.display_name ?? 'Someone'}
                  {idea.estimated_cost && ` · ${idea.estimated_cost}`}
                </p>
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

            <div className="flex gap-2">
              {VOTE_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => handleVote(idea.id, value)}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                    currentVote === value
                      ? 'border-violet-400 bg-violet-50 text-violet-700 shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {ideas.length === 0 && (
        <p className="text-center text-gray-400 py-10">No ideas to vote on yet.</p>
      )}
    </div>
  )
}
