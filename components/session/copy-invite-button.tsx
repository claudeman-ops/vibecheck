'use client'

import { useState } from 'react'

export function CopyInviteButton({ url }: { code: string; url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}
