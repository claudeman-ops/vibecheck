'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function JoinCodeForm() {
  const [code, setCode] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed) router.push(`/join/${trimmed}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter code"
        maxLength={6}
        className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm w-32 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-400"
      />
      <button
        type="submit"
        disabled={code.trim().length === 0}
        className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Join
      </button>
    </form>
  )
}
