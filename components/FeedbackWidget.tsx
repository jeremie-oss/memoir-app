'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

type Rating = 'positive' | 'neutral' | 'negative'

export default function FeedbackWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<Rating | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  // Listen for global trigger (from AppLayout header button)
  const openModal = useCallback(() => setOpen(true), [])
  useEffect(() => {
    window.addEventListener('memoir:open-feedback', openModal)
    return () => window.removeEventListener('memoir:open-feedback', openModal)
  }, [openModal])

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)

    // Extract context from URL
    const segments = pathname.split('/').filter(Boolean)
    const pageContext: Record<string, string> = { page: segments[0] || 'home' }
    if (segments[0] === 'write' && segments[1]) {
      pageContext.chapter_id = segments[1]
    }
    if (segments[0] === 'trame' && segments[1]) {
      pageContext.section = segments[1]
    }

    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        rating,
        page_url: pathname,
        page_context: pageContext,
      }),
    })

    setSending(false)
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setOpen(false)
      setMessage('')
      setRating(null)
    }, 2200)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title="Donner mon avis"
        aria-label="Donner mon avis"
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full bg-[#C4622A]/85 text-white shadow-lg hover:bg-[#C4622A] transition-all hover:scale-105 flex items-center justify-center"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div
            className="absolute inset-0 bg-[#1C1C2E]/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#FAF8F4] rounded-2xl shadow-2xl p-6">
            {done ? (
              <div className="text-center py-6">
                <p className="font-display text-2xl text-[#1C1C2E] mb-2">Merci ✦</p>
                <p className="text-[#9C8E80] text-sm">Votre retour a bien été transmis.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold text-[#1C1C2E]">Votre retour</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-[#9C8E80] hover:text-[#1C1C2E] transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>

                <p className="text-[#9C8E80] text-xs mb-4 font-mono bg-[#F5EFE0] rounded-lg px-3 py-1.5">
                  {pathname}
                </p>

                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Décrivez ce que vous observez, ressentez, ou suggérez..."
                  rows={4}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-sm outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans resize-none mb-4"
                />

                <div className="flex items-center gap-2 mb-5">
                  <p className="text-[#9C8E80] text-xs mr-1">Ressenti :</p>
                  {([
                    { value: 'positive' as const, emoji: '👍' },
                    { value: 'neutral' as const, emoji: '🤔' },
                    { value: 'negative' as const, emoji: '😕' },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRating(rating === opt.value ? null : opt.value)}
                      className={`w-10 h-10 rounded-full text-lg transition-all ${
                        rating === opt.value
                          ? 'bg-[#C4622A]/15 ring-2 ring-[#C4622A] scale-110'
                          : 'bg-[#EDE4D8] hover:bg-[#E0D4C4]'
                      }`}
                    >
                      {opt.emoji}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim()}
                  className="w-full py-3 rounded-full bg-[#C4622A] text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {sending ? 'Envoi...' : 'Envoyer'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
