'use client'

// BookArchitect — Modal "Architecture du livre" (Agent Architecte Narratif)
// Déclenché à la demande depuis le dashboard / book page.

import { useState, useEffect } from 'react'
import { useMemoirStore } from '@/stores/memoir'
import { buildBookState, serializeBookState } from '@/lib/ai/book-state'

type ArchitecteResult = {
  equilibre: {
    analysis: string
    issues: { chapterId: string; description: string }[]
  }
  fil_rouge: {
    analysis: string
    coherent: boolean
  }
  suggestions: {
    type: 'reorder' | 'split' | 'merge' | 'add' | 'develop'
    chapterId: string
    description: string
    actionable: string
  }[]
}

const ACTION_ICONS: Record<ArchitecteResult['suggestions'][number]['type'], string> = {
  reorder: '↕',
  split:   '⊕',
  merge:   '⊗',
  add:     '+',
  develop: '◈',
}

type Props = {
  onClose: () => void
}

export function BookArchitect({ onClose }: Props) {
  const store = useMemoirStore()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ArchitecteResult | null>(null)
  const [error, setError] = useState(false)

  async function runAnalysis() {
    setLoading(true)
    setError(false)
    try {
      const bs = buildBookState(store)
      const bookStateText = serializeBookState(bs)
      const allSessions = store.sessions.map(s => s.content).join('\n\n---\n\n')

      const res = await fetch('/api/memoir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'architecte_review',
          userName: store.userName,
          lang: store.lang,
          bookStateText,
          allSessions,
        }),
      })

      if (!res.ok) throw new Error('api error')
      const text = await res.text()
      setResult(JSON.parse(text) as ArchitecteResult)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // Run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { runAnalysis() }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1C1C2E] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg text-white/90 tracking-wide">
              Architecture du livre
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              Vue macro — Architecte Narratif
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">

          {loading && (
            <div className="flex flex-col items-center gap-3 py-12 text-white/40">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#C4622A] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-sm">Lecture de votre livre…</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Impossible d'analyser le livre pour l'instant.{' '}
              <button onClick={runAnalysis} className="underline hover:no-underline">
                Réessayer
              </button>
            </div>
          )}

          {result && (
            <>
              {/* Équilibre */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Équilibre
                </h3>
                <p className="text-sm text-white/75">{result.equilibre.analysis}</p>
                {result.equilibre.issues.length > 0 && (
                  <ul className="space-y-1">
                    {result.equilibre.issues.map((issue, i) => (
                      <li key={i} className="flex gap-2 text-sm text-amber-400/80">
                        <span className="text-amber-400/40">—</span>
                        {issue.description}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Fil rouge */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Fil rouge
                </h3>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 text-sm font-bold ${result.fil_rouge.coherent ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {result.fil_rouge.coherent ? '✓' : '!'}
                  </span>
                  <p className="text-sm text-white/75">{result.fil_rouge.analysis}</p>
                </div>
              </section>

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                    Suggestions
                  </h3>
                  {result.suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#C4622A] text-sm font-mono">
                          {ACTION_ICONS[s.type]}
                        </span>
                        <span className="text-xs text-white/40 uppercase tracking-wider">
                          {s.type}
                        </span>
                      </div>
                      <p className="text-sm text-white/80">{s.description}</p>
                      <p className="text-xs text-white/45">
                        <span className="text-white/25">Prochaine étape — </span>
                        {s.actionable}
                      </p>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex justify-between items-center">
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="text-xs text-white/30 hover:text-white/50 transition-colors disabled:opacity-30"
          >
            Relancer l'analyse
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-white/70 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
