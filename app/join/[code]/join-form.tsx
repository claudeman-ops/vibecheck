'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { joinSession } from '@/lib/actions/sessions'

interface Props {
  sessionId: string
  defaultName: string
  isLoggedIn: boolean
}

export function JoinForm({ sessionId, defaultName, isLoggedIn }: Props) {
  const [displayName, setDisplayName] = useState(defaultName)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const name = displayName.trim()
    if (!name) return

    startTransition(async () => {
      try {
        if (!isLoggedIn) {
          const supabase = createClient()
          const { error: signInError } = await supabase.auth.signInAnonymously()
          if (signInError) throw new Error(signInError.message)
          await supabase.auth.updateUser({ data: { display_name: name } })
        }
        await joinSession(sessionId, name)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <form onSubmit={handleJoin} className="space-y-4">
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
          Your name in this session
        </label>
        <input
          id="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Alex"
          required
          autoFocus
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isPending || !displayName.trim()}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Joining…' : 'Join session'}
      </button>
    </form>
  )
}
