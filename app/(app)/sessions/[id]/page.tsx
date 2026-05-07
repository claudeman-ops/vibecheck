import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { advanceSessionStatus } from '@/lib/actions/sessions'
import type { SessionWithMembers } from '@/lib/types/database.types'
import { CopyInviteButton } from '@/components/session/copy-invite-button'

const STATUS_CONFIG = {
  collecting_ideas: {
    label: 'Collecting ideas',
    badgeClass: 'bg-blue-100 text-blue-700',
    description: 'Share the invite link so friends can join and submit ideas.',
    actionHref: 'ideas',
    actionLabel: 'Submit ideas',
    hostAdvance: {
      buttonLabel: 'Close idea submissions → Start voting',
      warning: 'This locks idea submissions for everyone. Members can then vote.',
    },
  },
  voting: {
    label: 'Voting open',
    badgeClass: 'bg-amber-100 text-amber-700',
    description: 'Everyone can now rate the submitted ideas.',
    actionHref: 'vote',
    actionLabel: 'Vote now',
    hostAdvance: {
      buttonLabel: 'Close voting → View schedule',
      warning: 'This ends voting and reveals the ranked schedule for the group.',
    },
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-green-100 text-green-700',
    description: 'Voting is closed. The schedule is ready.',
    actionHref: 'schedule',
    actionLabel: 'View schedule',
    hostAdvance: null,
  },
}

export default async function SessionPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('*, session_members(*)')
    .eq('id', params.id)
    .single()

  if (!session) notFound()

  const typedSession = session as unknown as SessionWithMembers

  const membership = typedSession.session_members.find((m) => m.user_id === user.id)
  if (!membership) redirect(`/join/${typedSession.invite_code}`)

  const isHost = membership.is_host
  const config = STATUS_CONFIG[typedSession.status]
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/join/${typedSession.invite_code}`

  async function advance() {
    'use server'
    await advanceSessionStatus(params.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{typedSession.title}</h1>
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
        <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      {typedSession.description && (
        <p className="text-gray-600">{typedSession.description}</p>
      )}

      {/* Primary action — visible to all members */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm text-gray-500 mb-3">{config.description}</p>
        <Link
          href={`/sessions/${params.id}/${config.actionHref}`}
          className="inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          {config.actionLabel}
        </Link>
      </div>

      {/* Host controls — phase advancement */}
      {isHost && config.hostAdvance && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-lg shrink-0">🎛️</span>
            <div>
              <p className="text-sm font-semibold text-amber-900">Host controls</p>
              <p className="text-sm text-amber-700 mt-0.5">{config.hostAdvance.warning}</p>
            </div>
          </div>
          <form action={advance}>
            <button
              type="submit"
              className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              {config.hostAdvance.buttonLabel}
            </button>
          </form>
        </div>
      )}

      {/* Invite link */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Invite friends</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 font-mono text-sm text-gray-700 border border-gray-200">
            {typedSession.invite_code}
          </div>
          <CopyInviteButton code={typedSession.invite_code} url={inviteUrl} />
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Members ({typedSession.session_members.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {typedSession.session_members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1 text-sm"
            >
              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">
                {m.display_name[0].toUpperCase()}
              </span>
              <span className="text-gray-700">{m.display_name}</span>
              {m.is_host && <span className="text-xs text-violet-500 font-medium">host</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
