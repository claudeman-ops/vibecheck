import { createSession } from '@/lib/actions/sessions'
import Link from 'next/link'

export default function NewSessionPage() {
  return (
    <div className="max-w-lg mx-auto">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a session</h1>

      <form action={createSession} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Session name <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="e.g. NYC Weekend, Jake's Birthday Trip"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="What's the vibe? Any constraints?"
            rows={3}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
          />
        </div>

        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
            Destination
          </label>
          <input
            id="destination"
            name="destination"
            placeholder="e.g. New York City, SF Bay Area"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date_start" className="block text-sm font-medium text-gray-700 mb-1">
              Start date
            </label>
            <input
              id="date_start"
              name="date_start"
              type="date"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label htmlFor="date_end" className="block text-sm font-medium text-gray-700 mb-1">
              End date
            </label>
            <input
              id="date_end"
              name="date_end"
              type="date"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
            Your name in this session
          </label>
          <input
            id="display_name"
            name="display_name"
            placeholder="e.g. Alex"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          Create session
        </button>
      </form>
    </div>
  )
}
