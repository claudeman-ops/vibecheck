import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { JoinForm } from './join-form'
import type { SessionPreview } from '@/lib/types/database.types'

const STATUS_LABELS: Record<string, string> = {
  collecting_ideas: 'Collecting ideas',
  voting: 'Voting',
  completed: 'Completed',
}

export default async function JoinPage({ params }: { params: { code: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows, error } = await supabase.rpc('preview_session_by_code', {
    p_invite_code: params.code.toUpperCase(),
  })

  if (error || !rows || rows.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-4xl mb-4">🤔</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Session not found</h1>
        <p className="text-gray-500 text-sm mb-6">
          The invite code <span className="font-mono font-semibold">{params.code}</span> doesn&apos;t match any session.
        </p>
        <Link href="/" className="text-violet-600 hover:underline text-sm">
          Back to home
        </Link>
      </div>
    )
  }

  const session = rows[0] as SessionPreview

  if (user && session.is_member) {
    redirect(`/sessions/${session.id}`)
  }

  const defaultName = (user?.user_metadata?.display_name as string) ?? ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Link href="/" className="text-xl font-bold text-violet-600 mb-8">
        Vibe Check
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <p className="text-xs font-bold text-violet-400 tracking-widest mb-1">
            YOU&apos;RE INVITED
          </p>
          <h1 className="text-xl font-bold text-gray-900">{session.title}</h1>
          {session.destination && (
            <p className="text-gray-500 text-sm mt-0.5">📍 {session.destination}</p>
          )}
          {session.date_start && (
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date(session.date_start).toLocaleDateString()}
              {session.date_end ? ` — ${new Date(session.date_end).toLocaleDateString()}` : ''}
            </p>
          )}
          {session.description && (
            <p className="text-sm text-gray-600 mt-2">{session.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-sm text-gray-400">
            <span>{session.member_count} member{session.member_count !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{STATUS_LABELS[session.status] ?? session.status}</span>
          </div>
        </div>

        <JoinForm
          sessionId={session.id}
          defaultName={defaultName}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  )
}
