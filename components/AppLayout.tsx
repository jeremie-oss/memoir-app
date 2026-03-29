'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useMemoirStore, getCompletedCount } from '@/stores/memoir'
import { T } from '@/lib/i18n'

function getNavItems(lang: 'fr' | 'en' | 'es') {
  const t = T[lang]
  return [
    {
      section: lang === 'fr' ? 'MON HISTOIRE' : 'MY STORY',
      links: [
        { href: '/home',      label: t.nav.home,      icon: '⌂' },
        { href: '/book',      label: t.nav.book,      icon: '◻' },
        { href: '/trame',     label: t.nav.trame,     icon: '◈' },
      ],
    },
    {
      section: lang === 'fr' ? 'ÉCRITURE' : 'WRITING',
      links: [
        { href: '/write-hub', label: t.nav.write,     icon: '✦', cta: true },
        { href: '/calendar',  label: t.nav.calendar,  icon: '⊞' },
      ],
    },
    {
      section: lang === 'fr' ? 'BILAN' : 'PROGRESS',
      links: [
        { href: '/dashboard', label: t.nav.dashboard, icon: '◎' },
      ],
    },
  ]
}

type AppLayoutProps = {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const store = useMemoirStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const NAV_ITEMS = getNavItems(store.lang || 'fr')
  const completedCount = mounted ? getCompletedCount(store.chapters) : 0
  const totalChapters = store.chapters.length
  const progress = totalChapters > 0 ? completedCount / totalChapters : 0

  const radius = 16
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference * (1 - progress)

  const nextChapter = mounted ? store.chapters.find(c => c.status !== 'done') : null
  const writeHref = nextChapter ? `/write/${nextChapter.id}` : '/write/ch-1'

  function handleNav(href: string) {
    const resolved = href === '/write-hub' ? writeHref : href
    setMobileOpen(false)
    router.push(resolved)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Logo */}
      <button
        onClick={() => handleNav('/home')}
        className="font-display text-2xl font-bold text-[#1C1C2E] mb-8 text-left hover:opacity-70 transition-opacity"
      >
        M<span className="text-[#C4622A]">.</span>emoir
      </button>

      {/* Progress */}
      {mounted && (
        <div className="flex items-center gap-3 mb-8 px-2">
          <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0">
            <circle cx="20" cy="20" r={radius} fill="none" stroke="#EDE4D8" strokeWidth="3" />
            <circle
              cx="20" cy="20" r={radius}
              fill="none" stroke="#C4622A" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progress === 0 ? circumference : strokeOffset}
              transform="rotate(-90 20 20)"
              className="transition-all duration-700"
            />
            <text x="20" y="25" textAnchor="middle" fontSize="10" fontWeight="300" fill="#1C1C2E" fontStyle="italic">
              {completedCount}/{totalChapters}
            </text>
          </svg>
          <div>
            <p className="text-xs font-medium text-[#1C1C2E]">{store.userName || 'Mon livre'}</p>
            <p className="text-xs text-[#9C8E80]">
              {completedCount === 0
                ? 'Pas encore commencé'
                : completedCount === totalChapters
                  ? 'Livre complet ✦'
                  : `${completedCount} chapitre${completedCount > 1 ? 's' : ''} écrit${completedCount > 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-6">
        {NAV_ITEMS.map((section: { section: string; links: { href: string; label: string; icon: string; cta?: boolean }[] }) => (
          <div key={section.section}>
            <p className="text-[10px] text-[#C4B9A8] tracking-widest uppercase px-2 mb-1.5">
              {section.section}
            </p>
            <div className="space-y-0.5">
              {section.links.map((link) => {
                const resolvedHref = link.href === '/write-hub' ? writeHref : link.href
                const isActive = pathname === resolvedHref ||
                  (link.href === '/write-hub' && pathname.startsWith('/write'))

                if (link.cta) {
                  return (
                    <button
                      key={link.href}
                      onClick={() => handleNav(link.href)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#C4622A] text-white text-sm font-medium hover:opacity-90 transition-all"
                    >
                      <span className="text-base leading-none">{link.icon}</span>
                      <span>{link.label}</span>
                    </button>
                  )
                }

                return (
                  <button
                    key={link.href}
                    onClick={() => handleNav(link.href)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left
                      ${isActive
                        ? 'bg-[#EDE4D8] text-[#1C1C2E] font-medium'
                        : 'text-[#7A4F32] hover:bg-[#F5EFE0] hover:text-[#1C1C2E]'
                      }
                    `}
                  >
                    <span className="text-base leading-none opacity-70">{link.icon}</span>
                    <span>{link.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-[#EDE4D8] space-y-3 px-2">
        {/* Lang toggle + feedback */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#EDE4D8] rounded-full p-0.5">
            {(['fr', 'en'] as const).map(l => (
              <button key={l} onClick={() => store.setLang(l)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  (store.lang || 'fr') === l ? 'bg-[#1C1C2E] text-white' : 'text-[#7A4F32] hover:text-[#1C1C2E]'
                }`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.dispatchEvent(new Event('memoir:open-feedback'))}
            title="Donner mon avis"
            className="w-7 h-7 rounded-full bg-[#EDE4D8] hover:bg-[#C4622A]/15 text-[#9C8E80] hover:text-[#C4622A] transition-all flex items-center justify-center"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

        {/* Admin */}
        <a
          href="/admin"
          className="text-[10px] text-[#C4B9A8]/60 hover:text-[#9C8E80] transition-colors tracking-widest uppercase px-1"
        >
          admin ↗
        </a>

        {/* User */}
        {mounted && store.userName && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1C1C2E] flex items-center justify-center flex-shrink-0">
              <span className="text-[#FAF8F4] text-xs font-display font-bold">
                {store.userName[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-[#1C1C2E]">{store.userName}</p>
              <p className="text-[10px] text-[#9C8E80]">
                {store.currentStreak > 0
                  ? `${store.currentStreak}${store.lang === 'en' ? 'd' : 'j'} ✦`
                  : store.lang === 'en' ? 'Start your streak' : 'Commencer sa série'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-[#FAF8F4] relative">
      {/* Grain */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025] z-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height%3D'100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px',
        }}
      />

      {/* ── SIDEBAR DESKTOP ──────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 border-r border-[#EDE4D8] bg-[#FAF8F4] fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* ── MOBILE HEADER ────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#FAF8F4] border-b border-[#EDE4D8] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push('/home')}
          className="font-display text-xl font-bold text-[#1C1C2E]"
        >
          M<span className="text-[#C4622A]">.</span>emoir
        </button>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-[#EDE4D8] transition-colors"
          aria-label="Menu"
        >
          <span className="w-5 h-px bg-[#1C1C2E] block" />
          <span className="w-5 h-px bg-[#1C1C2E] block" />
          <span className="w-3 h-px bg-[#1C1C2E] block self-start" />
        </button>
      </header>

      {/* ── MOBILE DRAWER ────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-[#1C1C2E]/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-64 bg-[#FAF8F4] h-full shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#9C8E80] hover:text-[#1C1C2E] transition-colors text-xl"
            >
              ×
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main className="flex-1 md:ml-56 pt-0 md:pt-0">
        <div className="md:hidden h-14" /> {/* spacer for mobile header */}
        {children}
      </main>
    </div>
  )
}
