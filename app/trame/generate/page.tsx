'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore } from '@/stores/memoir'

const STEPS = [
  'Je lis entre les lignes de ce que vous m\'avez confié...',
  'Je cherche les fils qui relient vos souvenirs...',
  'Je dessine l\'arc de votre vie...',
  'Je nomme les chapitres de votre histoire...',
  'Votre trame prend forme...',
]

export default function GeneratePage() {
  const router = useRouter()
  const store = useMemoirStore()
  const [stepIndex, setStepIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Cycle through messages
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setStepIndex((i) => {
          const next = i + 1
          if (next >= STEPS.length) {
            clearInterval(interval)
            return i
          }
          return next
        })
        setVisible(true)
      }, 400)
    }, 1800)

    // Redirect after 3.5 seconds
    const timeout = setTimeout(() => {
      router.push('/trame')
    }, 3800)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [router])

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-[#1C1C2E] relative overflow-hidden"
    >
      {/* Grain */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.04] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px',
        }}
      />

      {/* Ambient glow */}
      <div className="absolute w-64 h-64 rounded-full bg-[#C4622A] opacity-5 blur-3xl top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />

      {/* Logo */}
      <div className="mb-16 font-display text-2xl font-bold text-[#FAF8F4]">
        M<span className="text-[#C4622A]">.</span>emoir
      </div>

      {/* Spinner animé — cercle littéraire */}
      <div className="relative mb-12">
        <svg width="72" height="72" viewBox="0 0 72 72" className="animate-spin" style={{ animationDuration: '3s' }}>
          <circle
            cx="36" cy="36" r="30"
            fill="none"
            stroke="#C4622A"
            strokeWidth="1.5"
            strokeDasharray="100 88"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#C4622A] text-xl">✦</span>
        </div>
      </div>

      {/* Message animé */}
      <p
        className="font-display text-xl italic text-[#FAF8F4] text-center max-w-sm px-8 transition-opacity duration-400"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {STEPS[stepIndex]}
      </p>

      {/* Nom de l'utilisateur */}
      {store.userName && (
        <p className="mt-6 text-[#7A4F32] text-sm tracking-widest uppercase">
          {store.userName}
        </p>
      )}
    </main>
  )
}
