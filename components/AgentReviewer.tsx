'use client'

// AgentReviewer — Panneau latéral "Œil du lecteur" (Agent Relecteur)
// Affiché après chaque session validée, dismissable, non bloquant.

import { useState } from 'react'
import { useMemoirStore } from '@/stores/memoir'
import type { AgentSuggestion } from '@/lib/ai/book-state'

type RelecteurReviewType = 'reference_opaque' | 'contradiction' | 'ellipse' | 'repetition' | 'opportunite'

const TYPE_LABELS: Record<RelecteurReviewType, { label: string; color: string }> = {
  reference_opaque: { label: 'Référence floue', color: 'text-amber-400' },
  contradiction:    { label: 'Contradiction',   color: 'text-red-400' },
  ellipse:          { label: 'Ellipse',          color: 'text-blue-400' },
  repetition:       { label: 'Répétition',       color: 'text-purple-400' },
  opportunite:      { label: 'Opportunité',       color: 'text-emerald-400' },
}

function isRelecteurType(t: string): t is RelecteurReviewType {
  return t in TYPE_LABELS
}

export function AgentReviewer() {
  const { agentSuggestions, dismissSuggestion } = useMemoirStore()
  const [expanded, setExpanded] = useState(true)

  // Only show relecteur suggestions that are not dismissed
  const reviews = agentSuggestions.filter(
    s => s.agentId === 'relecteur' && !s.dismissed
  )

  if (reviews.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-xl border border-white/10 bg-[#1C1C2E]/95 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tracking-widest text-[#C4622A] uppercase">
            Œil du lecteur
          </span>
          <span className="rounded-full bg-[#C4622A]/20 px-2 py-0.5 text-xs text-[#C4622A]">
            {reviews.length}
          </span>
        </div>
        <button className="text-white/40 hover:text-white/70 transition-colors">
          {expanded ? '−' : '+'}
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="divide-y divide-white/5 border-t border-white/10">
          {reviews.map(review => {
            return (
              <div key={review.id} className="px-4 py-3 space-y-2">
                {/* Type badge */}
                {isRelecteurType(review.type) && (
                  <span className={`text-xs font-semibold uppercase tracking-wider ${TYPE_LABELS[review.type].color}`}>
                    {TYPE_LABELS[review.type].label}
                  </span>
                )}

                {/* Passage cité */}
                {review.passage && (
                  <blockquote className="border-l-2 border-white/20 pl-3 text-xs italic text-white/50 line-clamp-2">
                    «&nbsp;{review.passage}&nbsp;»
                  </blockquote>
                )}

                {/* Explication */}
                <p className="text-xs text-white/70">{review.explication}</p>

                {/* Suggestion */}
                <p className="text-xs text-white/50">
                  <span className="text-white/30">Piste — </span>
                  {review.suggestion}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => dismissSuggestion(review.id)}
                    className="rounded px-3 py-1 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            )
          })}

          {/* Dismiss all */}
          <div className="px-4 py-2">
            <button
              onClick={() => reviews.forEach(r => dismissSuggestion(r.id))}
              className="text-xs text-white/25 hover:text-white/40 transition-colors"
            >
              Tout ignorer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
