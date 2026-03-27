'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SLIDES = [
  {
    bg: '#FAF8F4',
    content: 'slide-0',
  },
  {
    bg: '#FAF8F4',
    content: 'slide-1',
  },
  {
    bg: '#FAF8F4',
    content: 'slide-2',
  },
  {
    bg: '#1C1C2E',
    content: 'slide-3',
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  function goTo(index: number) {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(index)
      setAnimating(false)
    }, 350)
  }

  function next() {
    if (current < SLIDES.length - 1) goTo(current + 1)
    else router.push('/onboarding')
  }

  function prev() {
    if (current > 0) goTo(current - 1)
  }

  const isDark = current === 3

  return (
    <main
      className="min-h-screen flex flex-col transition-colors duration-700"
      style={{ backgroundColor: SLIDES[current].bg }}
    >
      {/* Grain */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px',
        }}
      />

      {/* Skip */}
      {current < 3 && (
        <div className="absolute top-5 right-6 z-10">
          <button
            onClick={() => router.push('/onboarding')}
            className="text-xs text-[#9C8E80] hover:text-[#1C1C2E] transition-colors tracking-wide"
          >
            Passer →
          </button>
        </div>
      )}

      {/* Slide content */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-8 transition-opacity duration-350 ${animating ? 'opacity-0' : 'opacity-100'}`}
        style={{ transitionDuration: '350ms' }}
      >
        {current === 0 && <Slide0 />}
        {current === 1 && <Slide1 />}
        {current === 2 && <Slide2 />}
        {current === 3 && <Slide3 onStart={() => router.push('/onboarding')} />}
      </div>

      {/* Navigation */}
      {current < 3 && (
        <div className="pb-10 px-8 flex items-center justify-between max-w-lg mx-auto w-full">
          {/* Back */}
          <button
            onClick={prev}
            className={`text-sm text-[#9C8E80] hover:text-[#1C1C2E] transition-colors w-16 text-left ${current === 0 ? 'invisible' : ''}`}
          >
            ← Retour
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-6 h-2 bg-[#C4622A]'
                    : 'w-2 h-2 bg-[#EDE4D8] hover:bg-[#C4B9A8]'
                }`}
              />
            ))}
          </div>

          {/* Next */}
          <button
            onClick={next}
            className="text-sm font-medium text-[#1C1C2E] hover:text-[#C4622A] transition-colors w-16 text-right"
          >
            {current === 2 ? 'Débuter' : 'Suivant →'}
          </button>
        </div>
      )}
    </main>
  )
}

/* ─── SLIDE 0 : BIENVENUE ─────────────────────────────────── */
function Slide0() {
  return (
    <div className="text-center max-w-sm">
      <div className="font-display text-5xl font-bold text-[#1C1C2E] mb-2">
        M<span className="text-[#C4622A]">.</span>emoir
      </div>
      <div className="w-8 h-px bg-[#C4622A] mx-auto my-8" />
      <h1 className="font-display text-3xl md:text-4xl font-light italic text-[#1C1C2E] leading-snug mb-6">
        Votre histoire mérite d&apos;exister.
      </h1>
      <p className="text-[#7A4F32] text-base leading-relaxed">
        Memoir vous accompagne pour l&apos;écrire, chapitre par chapitre, à votre rythme.
      </p>
    </div>
  )
}

/* ─── SLIDE 1 : CE QUE MEMOIR FAIT ───────────────────────── */
function Slide1() {
  const items = [
    {
      icon: '✦',
      title: 'Un compagnon bienveillant',
      desc: "Je pose les questions, vous racontez. Pas besoin d'être écrivain — juste d'avoir vécu.",
    },
    {
      icon: '◻',
      title: 'Un livre qui se construit',
      desc: 'Chapitre après chapitre, votre histoire prend forme. Vous voyez votre livre grandir.',
    },
    {
      icon: '◈',
      title: 'Un objet transmis',
      desc: 'À la fin : un livre imprimé, relié, livré. Un héritage pour ceux que vous aimez.',
    },
  ]

  return (
    <div className="max-w-md w-full">
      <p className="text-xs text-[#9C8E80] tracking-widest uppercase text-center mb-8">Ce que Memoir fait pour vous</p>
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.title} className="flex gap-5 items-start">
            <span className="text-[#C4622A] text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
            <div>
              <p className="font-display text-lg italic text-[#1C1C2E] mb-1">{item.title}</p>
              <p className="text-sm text-[#7A4F32] leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── SLIDE 2 : COMMENT ÇA MARCHE ────────────────────────── */
function Slide2() {
  const steps = [
    {
      n: '01',
      title: 'On se parle',
      desc: "Je vous pose quelques questions douces. Je trace la trame de votre vie — les chapitres de votre histoire.",
    },
    {
      n: '02',
      title: 'Vous écrivez',
      desc: "À votre rythme, un chapitre à la fois. Je vous guide avec une question, une invitation, une citation.",
    },
    {
      n: '03',
      title: 'Votre livre arrive',
      desc: "Quand vous êtes prêt·e, votre livre est imprimé et livré chez vous. Un objet réel, pour toujours.",
    },
  ]

  return (
    <div className="max-w-md w-full">
      <p className="text-xs text-[#9C8E80] tracking-widest uppercase text-center mb-8">Comment ça marche</p>
      <div className="space-y-7">
        {steps.map((step, i) => (
          <div key={step.n} className="flex gap-5 items-start">
            <div className="flex-shrink-0 flex flex-col items-center">
              <span className="font-display text-2xl font-light text-[#C4622A] italic leading-none">
                {step.n}
              </span>
              {i < steps.length - 1 && (
                <div className="w-px h-8 bg-[#EDE4D8] mt-2" />
              )}
            </div>
            <div className="pb-2">
              <p className="font-display text-lg italic text-[#1C1C2E] mb-1">{step.title}</p>
              <p className="text-sm text-[#7A4F32] leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── SLIDE 3 : ON COMMENCE ──────────────────────────────── */
function Slide3({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center max-w-sm">
      <span className="text-[#C4622A] text-2xl block mb-8">✦</span>
      <h2 className="font-display text-3xl md:text-4xl font-light italic text-[#FAF8F4] leading-snug mb-6">
        Votre histoire vous attend.
      </h2>
      <p className="text-[#9C8E80] text-base leading-relaxed mb-12">
        Je vais vous poser quelques questions. Pas de bonne réponse.
        Pas de mauvaise réponse. Juste votre vérité.
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-3 bg-[#C4622A] text-white font-medium text-sm px-10 py-4 rounded-full hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-[#C4622A]/30"
      >
        <span className="font-display italic text-base">Je suis prêt·e</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      <p className="text-[#7A4F32]/60 text-xs mt-6">
        Environ 5 minutes · Vous pouvez vous arrêter à tout moment
      </p>
    </div>
  )
}
