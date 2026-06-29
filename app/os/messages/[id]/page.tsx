'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Message {
  id: string
  fromName: string
  body: string
  isRead: boolean
  sentAt: string
  createdAt: string
}

interface MessageThread {
  id: string
  subject: string
  participantNames: string[]
  lastMessageAt: string
  unreadCount: number
  isPinned: boolean
  linkedWorkItemId: string | null
  createdAt: string
}

export default function MessageThreadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const threadId = params.id as string

  const [thread, setThread] = useState<MessageThread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchThreadAndMessages()
  }, [threadId])

  async function fetchThreadAndMessages() {
    try {
      setLoading(true)
      const threadRes = await fetch(`/api/os/messages/${threadId}`)
      if (threadRes.ok) {
        const threadData = await threadRes.json()
        setThread(threadData)
      } else {
        setError('Thread not found')
        return
      }

      const messagesRes = await fetch(`/api/os/messages/${threadId}/messages`)
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json()
        setMessages(Array.isArray(messagesData) ? messagesData : [])
      }
    } catch (err) {
      setError('Failed to load thread')
    } finally {
      setLoading(false)
    }
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const isYesterday = new Date(today.getTime() - 86400000).toDateString() === d.toDateString()

    if (isToday) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    if (isYesterday) return `Yesterday ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <div className="text-center py-8">Loading thread…</div>
  }

  if (!thread) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="mb-4 text-sm font-medium hover:opacity-75">
          ← Back
        </button>
        <div className="text-center py-8 text-red-600">Thread not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <button onClick={() => router.back()} className="mb-3 text-sm font-medium hover:opacity-75">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{thread.subject}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {thread.participantNames.length} participant{thread.participantNames.length !== 1 ? 's' : ''} · {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>
        {thread.isPinned && (
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            Pinned
          </div>
        )}
      </div>

      {/* Thread info card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Participants</p>
            <p className="text-sm text-slate-900">{thread.participantNames.join(', ') || 'No participants'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Created</p>
            <p className="text-sm text-slate-900">{new Date(thread.createdAt).toLocaleString('en-GB')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Last Activity</p>
            <p className="text-sm text-slate-900">{new Date(thread.lastMessageAt).toLocaleString('en-GB')}</p>
          </div>
          {thread.linkedWorkItemId && (
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Linked Work Item</p>
              <Link href={`/os/work-items/${thread.linkedWorkItemId}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                {thread.linkedWorkItemId} →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Messages ({messages.length})</p>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
            No messages in this thread
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={msg.id} className={`rounded-xl p-4 ${i % 2 === 0 ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-200'}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{msg.fromName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatTime(msg.sentAt)}</p>
                  </div>
                  {msg.isRead && (
                    <span className="text-xs text-slate-500">Read</span>
                  )}
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metadata footer */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500">
        <p>Unread: {thread.unreadCount} message{thread.unreadCount !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}
