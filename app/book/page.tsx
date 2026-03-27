'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { useMemoirStore, getCompletedCount } from '@/stores/memoir'

const PREFACE_BY_PROGRESS: Record<string, string> = {
  '0': "Votre préface naîtra au fil de vos chapitres. Elle sera le reflet de votre chemin, l'entrée en matière de votre livre. Elle s'écrit avec vous, pas avant vous.",
  '1-2': "Vous avez commencé. Ce n'est pas rien. Les premiers mots sont les plus courageux — ils font exister ce qui n'existait pas encore. Ce livre est en train de devenir réel.",
  '3-4': "À mi-chemin, quelque chose de rare se passe : une histoire prend corps. Les thèmes émergent, les voix se précisent. Ce qui était épars devient cohérent. Vous êtes en train d'écrire quelque chose qui durera.",
  '5-6': "Votre livre existe, désormais. Ce que vous avez mis des décennies à vivre, vous l'avez distillé en quelques mois d'écriture. Ce qui suit n'est plus qu'un dernier souffle avant la forme finale.",
  '7': "Ce livre est complet. Il porte en lui tout ce que vous avez vécu, aimé, traversé, construit. Il est prêt à être imprimé, relié, transmis. Votre histoire a maintenant un corps.",
}

function getPrefaceText(completed: number): string {
  if (completed === 0) return PREFACE_BY_PROGRESS['0']
  if (completed <= 2) return PREFACE_BY_PROGRESS['1-2']
  if (completed <= 4) return PREFACE_BY_PROGRESS['3-4']
  if (completed <= 6) return PREFACE_BY_PROGRESS['5-6']
  return PREFACE_BY_PROGRESS['7']
}

export default function BookPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const [mounted, setMounted] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('Mon livre')
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    if (store.userName) {
      setTitle(`L'histoire de ${store.userName}`)
    }
  }, [store.userName])

  if (!mounted) return null

  const completed = getCompletedCount(store.chapters)
  const year = new Date().getFullYear()

  // Index mock basé sur les réponses onboarding
  const indexItems = [
    ...(store.userName ? [{ type: 'Auteur', value: store.userName }] : []),
    { type: 'Période', value: `Années ${Math.floor((new Date().getFullYear() - 30) / 10) * 10} — aujourd'hui` },
    { type: 'Genre', value: 'Mémoires' },
    { type: 'Langue', value: 'Français' },
  ]

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="max-w-2xl mx-auto px-6 py-10">

          {/* ── COUVERTURE ──────────────────────────────── */}
          <div className="mb-12 pb-10 border-b border-[#EDE4D8] text-center">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-8">Couverture</p>

            {/* Titre éditable */}
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
                className="font-display text-3xl md:text-4xl italic text-[#1C1C2E] text-center bg-transparent border-b-2 border-[#C4622A] outline-none w-full leading-tight pb-1"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="group relative"
                title="Cliquer pour modifier"
              >
                <h1 className="font-display text-3xl md:text-4xl font-light italic text-[#1C1C2E] leading-tight">
                  {title}
                </h1>
                <span className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#9C8E80]">
                  ✎
                </span>
              </button>
            )}

            <p className="font-display text-lg text-[#7A4F32] mt-3">
              par {store.userName || 'Vous'}
            </p>
            <p className="text-sm text-[#9C8E80] mt-1">{year}</p>

            {/* Mini progression */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {store.chapters.map(ch => (
                <div
                  key={ch.id}
                  className={`w-2 h-2 rounded-full transition-all ${
                    ch.status === 'done' ? 'bg-[#C4622A]' : 'bg-[#EDE4D8]'
                  }`}
                  title={ch.title}
                />
              ))}
            </div>
            <p className="text-xs text-[#9C8E80] mt-2">
              {completed}/{store.chapters.length} chapitres écrits
            </p>
          </div>

          {/* ── PRÉFACE ─────────────────────────────────── */}
          <div className="mb-12 pb-10 border-b border-[#EDE4D8]">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-4">Préface</p>
            <p className="font-display text-lg italic text-[#7A4F32] leading-relaxed">
              {getPrefaceText(completed)}
            </p>
            {completed === 0 && (
              <button
                onClick={() => {
                  const next = store.chapters.find(c => c.status !== 'done')
                  if (next) router.push(`/write/${next.id}`)
                }}
                className="mt-6 text-xs text-[#C4622A] hover:underline tracking-wide"
              >
                Écrire le premier chapitre →
              </button>
            )}
          </div>

          {/* ── SOMMAIRE ────────────────────────────────── */}
          <div className="mb-12 pb-10 border-b border-[#EDE4D8]">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-5">Sommaire</p>
            <div className="space-y-1">
              {store.chapters.map((ch) => {
                const session = store.sessions.find(s => s.chapterId === ch.id)
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      if (ch.status === 'done') {
                        setExpandedChapter(expandedChapter === ch.id ? null : ch.id)
                      } else {
                        router.push(`/write/${ch.id}`)
                      }
                    }}
                    className="w-full flex items-center justify-between py-3 border-b border-[#EDE4D8]/50 group hover:border-[#EDE4D8] transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-display text-sm italic text-[#C4B9A8] w-6">
                        {String(ch.number).padStart(2, '0')}
                      </span>
                      <span className={`font-display text-lg italic ${
                        ch.status === 'done' ? 'text-[#1C1C2E]' : 'text-[#9C8E80]'
                      }`}>
                        {ch.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {session && (
                        <span className="text-xs text-[#9C8E80]">{session.wordCount} mots</span>
                      )}
                      {ch.status === 'done' ? (
                        <span className="text-[#C4622A] text-xs">✓</span>
                      ) : (
                        <span className="text-[#EDE4D8] text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── PASSAGES ÉCRITS ─────────────────────────── */}
          {store.sessions.length > 0 && (
            <div className="mb-12 pb-10 border-b border-[#EDE4D8]">
              <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-5">Extraits</p>
              <div className="space-y-6">
                {store.sessions.map((session) => {
                  const ch = store.chapters.find(c => c.id === session.chapterId)
                  const isExpanded = expandedChapter === session.chapterId
                  const preview = session.content.slice(0, 200)

                  return (
                    <div key={session.chapterId} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display text-sm italic text-[#C4622A]">
                          {ch?.title}
                        </span>
                        <span className="text-xs text-[#9C8E80]">{session.wordCount} mots</span>
                      </div>
                      <p className="text-sm text-[#7A4F32] leading-relaxed">
                        {isExpanded ? session.content : preview}
                        {!isExpanded && session.content.length > 200 && '…'}
                      </p>
                      {session.content.length > 200 && (
                        <button
                          onClick={() => setExpandedChapter(isExpanded ? null : session.chapterId)}
                          className="text-xs text-[#C4622A] hover:underline mt-2 block"
                        >
                          {isExpanded ? 'Réduire' : 'Lire la suite'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── INDEX ───────────────────────────────────── */}
          <div className="mb-10">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-4">Index</p>
            <div className="grid grid-cols-2 gap-3">
              {indexItems.map(item => (
                <div key={item.type} className="bg-white rounded-xl border border-[#EDE4D8] px-4 py-3">
                  <p className="text-xs text-[#9C8E80] mb-0.5">{item.type}</p>
                  <p className="text-sm font-medium text-[#1C1C2E]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
