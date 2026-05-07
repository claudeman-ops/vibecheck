import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Session } from '@/lib/types/database.types'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  collecting_ideas: { label: 'Collecting ideas', className: 'bg-blue-100 text-blue-700' },
  voting: { label: 'Voting open', className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
}

const STATUS_HREF: Record<string, string> = {
  collecting_ideas: 'ideas',
  voting: 'vote',
  completed: 'schedule',
}

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: memberships } = await supabase
    .from('session_members')
    .select('session_id, is_host, sessions(*)')
    .order('joined_at', { ascending: false })

  const sessions = (memberships ?? []).map((m) => ({
    ...(m.sessions as unknown as Session),
    is_host: m.is_host,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your sessions</h1>
        <Link
          href="/sessions/new"
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          + New session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">🗓️</p>
          <p className="font-medium">No sessions yet</p>
          <p className="text-sm mt-1">Create one or join with an invite code</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const badge = STATUS_LABELS[session.status]
            const actionPath = STATUS_HREF[session.status]
            return (
              <div
                key={session.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                    {session.is_host && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        Host
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 truncate">{session.title}</h2>
                  {session.destination && (
                    <p className="text-sm text-gray-400 mt-0.5">📍 {session.destination}</p>
                  )}
                </div>
                <Link
                  href={`/sessions/${session.id}/${actionPath}`}
                  className="shrink-0 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Open
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
