'use client'

import { useRef, useState, useTransition } from 'react'
import { submitIdea } from '@/lib/actions/ideas'
import type { IdeaCategory } from '@/lib/types/database.types'

const CATEGORIES: { value: IdeaCategory; label: string; emoji: string }[] = [
  { value: 'activity', label: 'Activity', emoji: '🎯' },
  { value: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { value: 'event', label: 'Event', emoji: '🎟️' },
  { value: 'accommodation', label: 'Stay', emoji: '🏠' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'other', label: 'Other', emoji: '💡' },
]

export function IdeaForm({ sessionId }: { sessionId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleAction(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        await submitIdea(formData)
        formRef.current?.reset()
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit idea')
      }
    })
  }

  return (
    <form ref={formRef} action={handleAction} className="space-y-4">
      <input type="hidden" name="session_id" value={sessionId} />

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <input
            name="title"
            required
            placeholder="Idea name *"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        <div className="col-span-2">
          <textarea
            name="description"
            placeholder="Why it would be great..."
            rows={2}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
          />
        </div>
        <div>
          <select
            name="category"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <input
            name="estimated_cost"
            placeholder="Est. cost (optional)"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        <div className="col-span-2">
          <input
            name="url"
            type="text"
            placeholder="Link (optional)"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Submitting…' : success ? 'Added!' : 'Submit idea'}
      </button>
    </form>
  )
}
