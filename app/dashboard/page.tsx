'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { useMemoirStore, getCompletedCount } from '@/stores/memoir'
import { BookArchitect } from '@/components/BookArchitect'

type Badge = {
  id: string
  icon: string
  title: string
  desc: string
  unlocked: boolean
}

const WEEKLY_GOAL = 300

export default function DashboardPage() {
  const store = useMemoirStore()
  const [mounted, setMounted] = useState(false)
  const [showArchitect, setShowArchitect] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const totalWords = store.sessions.reduce((s, sess) => s + sess.wordCount, 0)
  const completedCount = getCompletedCount(store.chapters)
  const totalChapters = store.chapters.length
  const longestSession = Math.max(0, ...store.sessions.map(s => s.wordCount))
  const estimatedPages = totalWords > 0 ? Math.max(1, Math.round(totalWords / 250)) : 0

  // Plan tier thresholds (Crayon/Stilo/Plum/Gutenberg)
  const TIERS = [
    { name: 'Crayon', limit: 10000 },
    { name: 'Stilo', limit: 40000 },
    { name: 'Plum', limit: 80000 },
    { name: 'Gutenberg', limit: null },
  ]
  const currentTierIdx = TIERS.findIndex(t => t.limit === null || totalWords < t.limit)
  const currentTier = TIERS[Math.max(0, currentTierIdx)]
  const nextTier = TIERS[currentTierIdx + 1]
  const tierFillPct = currentTier.limit ? Math.min(100, (totalWords / currentTier.limit) * 100) : 100

  // Mots cette semaine
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const wordsThisWeek = store.sessions
    .filter(s => new Date(s.date) >= weekAgo)
    .reduce((sum, s) => sum + s.wordCount, 0)
  const weeklyProgress = Math.min(1, wordsThisWeek / WEEKLY_GOAL)

  // Badges
  const badges: Badge[] = [
    {
      id: 'first-word',
      icon: '🖊',
      title: 'Premier mot',
      desc: 'Vous avez commencé à écrire',
      unlocked: store.sessions.length > 0,
    },
    {
      id: '100-words',
      icon: '📄',
      title: '100 mots',
      desc: 'Cent mots de vie écrits',
      unlocked: totalWords >= 100,
    },
    {
      id: '3-streak',
      icon: '✦',
      title: '3 jours de suite',
      desc: 'La régularité, clé de tout',
      unlocked: store.currentStreak >= 3,
    },
    {
      id: 'half-book',
      icon: '📖',
      title: 'Mi-livre',
      desc: '4 chapitres sur 7 écrits',
      unlocked: completedCount >= 4,
    },
    {
      id: '500-words',
      icon: '✍',
      title: '500 mots',
      desc: 'Un vrai chapitre de vie',
      unlocked: totalWords >= 500,
    },
    {
      id: 'full-book',
      icon: '🏆',
      title: 'Livre complet',
      desc: 'Tous les chapitres écrits',
      unlocked: completedCount === totalChapters,
    },
  ]

  const unlockedCount = badges.filter(b => b.unlocked).length

  // Message d'encouragement
  function getEncouragement(): string {
    if (completedCount === 0) return "Votre livre n'attend que vous. Le premier chapitre est le plus courageux."
    if (completedCount < 3) return `Beau départ, ${store.userName}. Chaque session compte.`
    if (completedCount < 6) return `Vous êtes à mi-chemin. L'élan est là — continuez.`
    if (completedCount < 7) return `Presque terminé. Un dernier chapitre, et votre livre existera.`
    return `Votre livre est complet, ${store.userName}. Quelle aventure.`
  }

  return (
    <>
    <AppLayout>
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="max-w-2xl mx-auto px-6 py-10">

          <div className="mb-10">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-2">Tableau de bord</p>
            <h1 className="font-display text-3xl font-light italic text-[#1C1C2E]">
              Votre progression
            </h1>
          </div>

          {/* Message d'encouragement */}
          <div className="mb-8 bg-[#1C1C2E] rounded-2xl px-6 py-5">
            <p className="font-display text-lg italic text-[#FAF8F4] leading-relaxed">
              &ldquo;{getEncouragement()}&rdquo;
            </p>
          </div>

          {/* Volume du livre */}
          {totalWords > 0 && (
            <div className="mb-6 bg-white rounded-2xl border border-[#EDE4D8] p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-[#1C1C2E]">Volume du livre</p>
                  <p className="text-xs text-[#9C8E80] mt-0.5">
                    {totalWords.toLocaleString('fr-FR')} mots · environ {estimatedPages} page{estimatedPages > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-[#C4622A]">{currentTier.name}</p>
                  {nextTier && currentTier.limit && (
                    <p className="text-[10px] text-[#9C8E80] mt-0.5">
                      {(currentTier.limit - totalWords).toLocaleString('fr-FR')} mots pour {nextTier.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="h-1.5 bg-[#EDE4D8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C4622A]/60 rounded-full transition-all duration-700"
                  style={{ width: `${tierFillPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Objectif de la semaine */}
          <div className="mb-6 bg-white rounded-2xl border border-[#EDE4D8] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[#1C1C2E]">Objectif de la semaine</p>
              <p className="text-sm text-[#9C8E80]">
                <span className="text-[#C4622A] font-medium">{wordsThisWeek}</span> / {WEEKLY_GOAL} mots
              </p>
            </div>
            <div className="h-2 bg-[#EDE4D8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C4622A] rounded-full transition-all duration-1000"
                style={{ width: `${weeklyProgress * 100}%` }}
              />
            </div>
            {weeklyProgress >= 1 && (
              <p className="text-xs text-[#C4622A] mt-2">✦ Objectif atteint cette semaine !</p>
            )}
          </div>

          {/* Progression des chapitres */}
          <div className="mb-6 bg-white rounded-2xl border border-[#EDE4D8] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[#1C1C2E]">Progression du livre</p>
              {store.sessions.length >= 1 && (
                <button
                  onClick={() => setShowArchitect(true)}
                  className="flex items-center gap-1.5 text-xs text-[#9C8E80] hover:text-[#1C1C2E] transition-colors"
                >
                  <span className="text-[#C4622A]/60">◈</span>
                  Architecte
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {store.chapters.map((ch) => (
                <div
                  key={ch.id}
                  className={`flex-1 h-8 rounded-lg transition-all duration-500 flex items-center justify-center ${
                    ch.status === 'done' ? 'bg-[#C4622A]' : 'bg-[#EDE4D8]'
                  }`}
                  title={ch.title}
                >
                  {ch.status === 'done' && (
                    <span className="text-white text-[10px]">✓</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-[#9C8E80]">Chapitre 1</p>
              <p className="text-xs text-[#9C8E80]">{completedCount}/{totalChapters} écrits</p>
              <p className="text-xs text-[#9C8E80]">Chapitre 7</p>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-6 bg-white rounded-2xl border border-[#EDE4D8] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[#1C1C2E]">Récompenses</p>
              <p className="text-xs text-[#9C8E80]">{unlockedCount}/{badges.length} débloquées</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-xl p-3 text-center border transition-all ${
                    badge.unlocked
                      ? 'border-[#C4622A]/20 bg-[#C4622A]/5'
                      : 'border-[#EDE4D8] opacity-40 grayscale'
                  }`}
                >
                  <span className="text-2xl block mb-1">{badge.icon}</span>
                  <p className="text-xs font-medium text-[#1C1C2E] leading-tight">{badge.title}</p>
                  <p className="text-[10px] text-[#9C8E80] mt-0.5 leading-tight">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Mots écrits', value: totalWords.toLocaleString('fr-FR'), sub: estimatedPages > 0 ? `~${estimatedPages} pages` : undefined },
              { label: 'Sessions', value: store.sessions.length.toString(), sub: undefined },
              { label: 'Plus longue session', value: longestSession > 0 ? `${longestSession} mots` : '—', sub: undefined },
              { label: 'Série actuelle', value: store.currentStreak > 0 ? `${store.currentStreak} jour${store.currentStreak > 1 ? 's' : ''}` : '—', sub: undefined },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-[#EDE4D8] px-4 py-4">
                <p className="text-xs text-[#9C8E80] mb-1">{stat.label}</p>
                <p className="font-display text-2xl font-light italic text-[#1C1C2E]">{stat.value}</p>
                {stat.sub && <p className="text-[10px] text-[#9C8E80] mt-0.5">{stat.sub}</p>}
              </div>
            ))}
          </div>

        </div>
      </div>
    </AppLayout>

    {/* BookArchitect modal */}
    {showArchitect && <BookArchitect onClose={() => setShowArchitect(false)} />}
  </>
  )
}
