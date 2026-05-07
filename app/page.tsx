import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
        <span className="text-xl font-bold text-violet-600">Vibe Check</span>
        <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Sign in
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 max-w-2xl">
          Plan your perfect weekend{' '}
          <span className="text-violet-600">together</span>
        </h1>
        <p className="mt-4 text-xl text-gray-500 max-w-lg">
          Collect ideas from the group, vote on the best ones, and get a schedule everyone is excited about.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-violet-600 px-8 py-3 text-base font-semibold text-white shadow hover:bg-violet-700 transition-colors"
          >
            Create a session
          </Link>
          <JoinForm />
        </div>

        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl text-left">
          {[
            { step: '01', title: 'Drop your ideas', body: 'Everyone submits activities, restaurants, or events they want to try.' },
            { step: '02', title: 'Vote together', body: 'Rate each idea: Pass, Like, or Love. Honest and fast.' },
            { step: '03', title: 'See the schedule', body: 'The top picks become your itinerary — no spreadsheets needed.' },
          ].map(({ step, title, body }) => (
            <div key={step} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-violet-400 tracking-widest mb-2">{step}</p>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function JoinForm() {
  async function handleJoin(formData: FormData) {
    'use server'
    const code = (formData.get('code') as string)?.trim().toUpperCase()
    if (code) redirect(`/join/${code}`)
  }

  return (
    <form action={handleJoin} className="flex gap-2">
      <input
        name="code"
        placeholder="Invite code"
        className="rounded-xl border border-gray-300 px-4 py-3 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-violet-400 uppercase"
        maxLength={6}
      />
      <button
        type="submit"
        className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Join
      </button>
    </form>
  )
}
