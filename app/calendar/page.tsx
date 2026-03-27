'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { useMemoirStore } from '@/stores/memoir'

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function CalendarPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const [mounted, setMounted] = useState(false)
  const [tooltip, setTooltip] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Premier jour du mois (lundi = 0)
  const firstDay = new Date(year, month, 1)
  const startDow = (firstDay.getDay() + 6) % 7 // 0=lundi
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Sessions indexées par date YYYY-MM-DD
  const sessionsByDate: Record<string, number> = {}
  store.sessions.forEach(s => {
    const d = s.date.split('T')[0]
    sessionsByDate[d] = (sessionsByDate[d] || 0) + s.wordCount
  })

  // Objectif mensuel
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const wordsThisMonth = Object.entries(sessionsByDate)
    .filter(([d]) => d.startsWith(monthKey))
    .reduce((sum, [, w]) => sum + w, 0)
  const monthGoal = 1200
  const monthProgress = Math.min(1, wordsThisMonth / monthGoal)

  // Jours du calendrier (avec padding)
  const days: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const todayNum = now.getDate()

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="max-w-2xl mx-auto px-6 py-10">

          <div className="mb-10">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-2">Calendrier</p>
            <h1 className="font-display text-3xl font-light italic text-[#1C1C2E]">
              {MONTHS_FR[month]} {year}
            </h1>
          </div>

          {/* Objectif mensuel */}
          <div className="mb-6 bg-white rounded-2xl border border-[#EDE4D8] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[#1C1C2E]">Objectif du mois</p>
              <p className="text-sm text-[#9C8E80]">
                <span className="text-[#C4622A] font-medium">{wordsThisMonth}</span> / {monthGoal} mots
              </p>
            </div>
            <div className="h-2 bg-[#EDE4D8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C4622A] rounded-full transition-all duration-700"
                style={{ width: `${monthProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Grille calendrier */}
          <div className="bg-white rounded-2xl border border-[#EDE4D8] p-5 mb-6">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_FR.map(d => (
                <div key={d} className="text-center text-[10px] text-[#9C8E80] tracking-wide py-1 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Jours */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />

                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const words = sessionsByDate[dateStr]
                const isToday = day === todayNum
                const isFuture = day > todayNum
                const hasSession = !!words

                return (
                  <div
                    key={day}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all cursor-default ${
                      isToday
                        ? 'border-2 border-[#C4622A] bg-[#C4622A]/5 font-medium text-[#C4622A]'
                        : hasSession
                          ? 'bg-[#F5EFE0] text-[#1C1C2E] hover:bg-[#EDE4D8] cursor-pointer'
                          : isFuture
                            ? 'text-[#C4B9A8]'
                            : 'text-[#9C8E80] hover:bg-[#F5EFE0]'
                    }`}
                    onMouseEnter={() => hasSession ? setTooltip(`${day}: ${words} mots`) : null}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <span className="text-xs">{day}</span>
                    {hasSession && (
                      <span className="w-1 h-1 rounded-full bg-[#C4622A] absolute bottom-1" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div className="mb-4 text-center text-sm text-[#7A4F32] font-medium">
              {tooltip}
            </div>
          )}

          {/* Légende */}
          <div className="flex items-center gap-6 mb-8 px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#C4622A]" />
              <span className="text-xs text-[#9C8E80]">Jour d&apos;écriture</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-[#C4622A]" />
              <span className="text-xs text-[#9C8E80]">Aujourd&apos;hui</span>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-[#1C1C2E] rounded-2xl p-6 text-center">
            <p className="font-display text-lg italic text-[#FAF8F4] mb-1">
              Prêt·e à écrire aujourd&apos;hui ?
            </p>
            <p className="text-[#9C8E80] text-sm mb-5">
              Même 10 minutes suffisent pour avancer.
            </p>
            <button
              onClick={() => {
                const next = store.chapters.find(c => c.status !== 'done')
                if (next) router.push(`/write/${next.id}`)
              }}
              className="inline-flex items-center gap-3 bg-[#C4622A] text-white text-sm font-medium px-8 py-3 rounded-full hover:opacity-90 transition-all"
            >
              Écrire maintenant
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
