'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore } from '@/stores/memoir'
import { TRAME_CHAPTERS } from '@/lib/mock/trame-data'
import AppLayout from '@/components/AppLayout'

export default function TramePage() {
  const router = useRouter()
  const store = useMemoirStore()
  const [visibleCount, setVisibleCount] = useState(0)
  const [showCTA, setShowCTA] = useState(false)

  const chapters = store.chapters

  useEffect(() => {
    // Révélation progressive : 1 chapitre toutes les 350ms
    const timers: NodeJS.Timeout[] = []

    chapters.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleCount(i + 1)
        }, 600 + i * 380)
      )
    })

    // CTA après tous les chapitres
    timers.push(
      setTimeout(() => {
        setShowCTA(true)
      }, 600 + chapters.length * 380 + 400)
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  // Après onboarding : sidebar. Sinon : révélation plein écran
  const Wrapper = store.onboardingComplete
    ? ({ children }: { children: React.ReactNode }) => <AppLayout>{children}</AppLayout>
    : ({ children }: { children: React.ReactNode }) => <>{children}</>

  return (
    <Wrapper>
    <main className="min-h-screen bg-[#F5EFE0] relative">
      {/* Grain */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px',
        }}
      />

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-4">
            Votre histoire
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-light italic text-[#1C1C2E] leading-tight">
            {store.userName
              ? `${store.userName}, voici votre trame`
              : 'Votre trame narrative'}
          </h1>
          <p className="mt-4 text-[#7A4F32] text-sm leading-relaxed max-w-md mx-auto">
            {store.trameCustom
              ? 'Votre trame personnalisée. Chaque chapitre vous attend.'
              : "Sept chapitres. Sept portes vers votre histoire. Chacun d'eux vous attend, à votre rythme."}
          </p>

          {/* Entry points for customization */}
          {!store.trameCustom && (
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => router.push('/trame/upload')}
                className="px-5 py-2.5 rounded-full bg-[#1C1C2E] text-[#FAF8F4] text-sm font-medium hover:opacity-90 transition-all"
              >
                Importer mes notes
              </button>
              <button
                onClick={() => router.push('/trame/brainstorm')}
                className="px-5 py-2.5 rounded-full border-2 border-[#C4622A] text-[#C4622A] text-sm font-medium hover:bg-[#C4622A] hover:text-white transition-all"
              >
                Esquisser ma trame
              </button>
            </div>
          )}
        </div>

        {/* Chapitres */}
        <div className="flex flex-col gap-3">
          {chapters.map((chapter, i) => (
            <div
              key={chapter.id}
              className="transition-all duration-700"
              style={{
                opacity: i < visibleCount ? 1 : 0,
                transform: i < visibleCount ? 'translateY(0)' : 'translateY(16px)',
              }}
            >
              <div className="flex items-start gap-5 p-5 rounded-2xl bg-white/60 border border-[#EDE4D8] hover:border-[#C4622A]/30 hover:bg-white/80 transition-all group">
                {/* Numéro */}
                <span className="font-display text-4xl font-light text-[#EDE4D8] group-hover:text-[#C4622A]/20 transition-colors leading-none mt-1 select-none w-10 flex-shrink-0">
                  {String(chapter.number).padStart(2, '0')}
                </span>

                {/* Contenu */}
                <div className="flex-1">
                  <h2 className="font-display text-xl font-semibold text-[#1C1C2E] italic">
                    {chapter.title}
                  </h2>
                  <p className="text-sm text-[#7A4F32] mt-0.5">{chapter.subtitle}</p>
                  <p className="text-xs text-[#9C8E80] mt-2 tracking-wide">{chapter.theme}</p>
                </div>

                {/* État */}
                <span className="flex-shrink-0 w-6 h-6 rounded-full border border-[#EDE4D8] flex items-center justify-center mt-1">
                  {chapter.status === 'done'
                    ? <span className="text-[#C4622A] text-xs">✓</span>
                    : <span className="w-2 h-2 rounded-full bg-[#EDE4D8]" />
                  }
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-12 text-center transition-all duration-700"
          style={{
            opacity: showCTA ? 1 : 0,
            transform: showCTA ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          <p className="font-display text-lg italic text-[#7A4F32] mb-6">
            Par où voulez-vous commencer ?
          </p>
          <button
            onClick={() => router.push('/home')}
            className="inline-flex items-center gap-3 bg-[#1C1C2E] text-[#FAF8F4] font-medium text-sm px-8 py-4 rounded-full hover:bg-[#2d2d44] transition-all shadow-lg shadow-[#1C1C2E]/20 hover:scale-105"
          >
            <span className="font-display italic text-base">Entrer dans mon espace</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <p className="mt-4 text-xs text-[#9C8E80]">
            Vous pouvez choisir votre ordre d'écriture depuis votre espace
          </p>
        </div>
      </div>
    </main>
    </Wrapper>
  )
}
