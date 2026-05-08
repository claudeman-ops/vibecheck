'use client'

import { useState, useTransition } from 'react'
import { deleteSession, leaveSession, archiveSession } from '@/lib/actions/sessions'

type ConfirmAction = 'archive' | 'delete' | 'leave'

interface Props {
  sessionId: string
  isHost: boolean
  isArchived: boolean
}

export function SessionActions({ sessionId, isHost, isArchived }: Props) {
  const [confirming, setConfirming] = useState<ConfirmAction | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      if (confirming === 'delete') await deleteSession(sessionId)
      else if (confirming === 'archive') await archiveSession(sessionId)
      else if (confirming === 'leave') await leaveSession(sessionId)
      setConfirming(null)
    })
  }

  if (confirming) {
    const label = confirming === 'archive' ? 'Archive?' : confirming === 'delete' ? 'Delete?' : 'Leave?'
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-500">{label}</span>
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {isPending ? '…' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(null)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 shrink-0">
      {isHost && !isArchived && (
        <button
          onClick={() => setConfirming('archive')}
          className="text-xs text-gray-400 hover:text-amber-500 transition-colors"
        >
          Archive
        </button>
      )}
      <button
        onClick={() => setConfirming(isHost ? 'delete' : 'leave')}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        {isHost ? 'Delete' : 'Leave'}
      </button>
    </div>
  )
}
