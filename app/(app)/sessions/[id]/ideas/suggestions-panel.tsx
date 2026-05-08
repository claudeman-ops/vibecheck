'use client'

import { useState } from 'react'
import { getSuggestions, addSuggestion } from '@/lib/actions/suggestions'
import type { Suggestion } from '@/lib/actions/suggestions'

const CATEGORY_EMOJI: Record<string, string> = {
  activity: '🎯',
  restaurant: '🍽️',
  event: '🎟️',
  accommodation: '🏠',
  transport: '🚗',
  other: '💡',
}

export function SuggestionsPanel({ sessionId }: { sessionId: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState<Set<number>>(new Set())

  async function handleGetSuggestions() {
    setLoading(true)
    setError(null)
    setSuggestions(null)
    setAdded(new Set())
    try {
      const results = await getSuggestions(sessionId)
      setSuggestions(results)
    } catch {
      setError('Failed to get suggestions. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(index: number, suggestion: Suggestion) {
    setAdding(prev => new Set(prev).add(index))
    try {
      await addSuggestion(sessionId, suggestion)
      setAdded(prev => new Set(prev).add(index))
    } finally {
      setAdding(prev => { const s = new Set(prev); s.delete(index); return s })
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">AI suggestions</h2>
          <p className="text-xs text-gray-400 mt-0.5">Ideas tailored to your destination and vibe</p>
        </div>
        <button
          onClick={handleGetSuggestions}
          disabled={loading}
          className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {loading ? 'Thinking…' : suggestions ? '↺ Refresh' : '✨ Suggest ideas'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      {loading && (
        <div className="space-y-2 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {suggestions && !loading && (
        <div className="space-y-2 mt-4">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                added.has(i) ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
              }`}
            >
              <span className="text-base shrink-0 mt-0.5">{CATEGORY_EMOJI[s.category] ?? '💡'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900">{s.title}</p>
                    {s.estimated_cost && (
                      <p className="text-xs text-gray-400">{s.estimated_cost}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAdd(i, s)}
                    disabled={added.has(i) || adding.has(i)}
                    className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
                      added.has(i)
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-50'
                    }`}
                  >
                    {added.has(i) ? 'Added ✓' : adding.has(i) ? '…' : 'Add'}
                  </button>
                </div>
                {s.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
