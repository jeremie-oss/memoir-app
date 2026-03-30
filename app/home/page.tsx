'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore, getNextChapter, getCompletedCount } from '@/stores/memoir'
import { DAILY_QUOTES_BY_LANG, getChapterDisplay } from '@/lib/mock/trame-data'
import { T } from '@/lib/i18n'
import { BookArchitect } from '@/components/BookArchitect'

type PanelId = 'writing' | 'dashboard' | 'book' | 'resources'

const PANEL_ORDER: PanelId[] = ['writing', 'dashboard', 'book', 'resources']
const WEEKLY_GOAL = 300

// ── Grain overlay (shared) ─────────────────────────────────────
const GRAIN_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

export default function HomePage() {
  const router = useRouter()
  const store = useMemoirStore()
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState<PanelId | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [contentVisible, setContentVisible] = useState(true)
  const [activeResource, setActiveResource] = useState(0)
  const [showArchitect, setShowArchitect] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.has('demo')) {
        store.loadDemoState()
        window.history.replaceState({}, '', '/home')
      }
    }
  }, [])

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (mounted && !store.onboardingComplete) {
      router.push('/onboarding')
    }
  }, [mounted, store.onboardingComplete, router])

  if (!mounted) return null

  const t = T[store.lang]
  // ── Computed ───────────────────────────────────────────────
  const nextChapter = getNextChapter(store.chapters)
  const completedCount = getCompletedCount(store.chapters)
  const totalChapters = store.chapters.length
  const totalWords = store.sessions.reduce((s, sess) => s + sess.wordCount, 0)
  const dayIndex = new Date().getDay()
  const dailyQuotes = DAILY_QUOTES_BY_LANG[store.lang] ?? DAILY_QUOTES_BY_LANG.fr
  const quote = dailyQuotes[dayIndex % dailyQuotes.length]

  // Translated chapter display helper
  const tc = (ch: ReturnType<typeof getNextChapter>) =>
    ch ? getChapterDisplay(ch, store.lang) : null
  const nextChapterDisplay = tc(nextChapter)

  const progress = totalChapters > 0 ? completedCount / totalChapters : 0
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference * (1 - progress)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const wordsThisWeek = store.sessions
    .filter(s => new Date(s.date) >= weekAgo)
    .reduce((sum, s) => sum + s.wordCount, 0)
  const weeklyPct = Math.min(100, Math.round((wordsThisWeek / WEEKLY_GOAL) * 100))

  const hour = new Date().getHours()
  const greetKey = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : hour < 23 ? 'evening' : 'night'
  const greeting = `${t.greetings[greetKey]}, ${store.userName}.`
  const sub = t.subs[new Date().getDate() % t.subs.length]

  const rdvDesc = store.nextRdv
    ? (store.lang === 'fr'
        ? `Prochain entretien : ${new Date(store.nextRdv).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`
        : `Next session: ${new Date(store.nextRdv).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`)
    : (store.lang === 'fr'
        ? 'Planifiez votre prochain entretien avec Memoir'
        : store.lang === 'es'
          ? 'Programe su próxima sesión con Memoir'
          : 'Schedule your next Memoir session')
  const rdvCta = store.nextRdv
    ? (store.lang === 'fr' ? 'Voir' : store.lang === 'es' ? 'Ver' : 'View')
    : (store.lang === 'fr' ? 'Planifier' : store.lang === 'es' ? 'Planificar' : 'Schedule')

  const badges = [
    { icon: '🖊', label: t.dashboard.badges.firstWord,  unlocked: store.sessions.length > 0 },
    { icon: '📄', label: t.dashboard.badges.words100,   unlocked: totalWords >= 100 },
    { icon: '✦',  label: t.dashboard.badges.streak3,    unlocked: store.currentStreak >= 3 },
    { icon: '📖', label: t.dashboard.badges.halfBook,   unlocked: completedCount >= 4 },
    { icon: '✍',  label: t.dashboard.badges.words500,   unlocked: totalWords >= 500 },
    { icon: '🏆', label: t.dashboard.badges.fullBook,   unlocked: completedCount === totalChapters && totalChapters > 0 },
  ]
  const unlockedCount = badges.filter(b => b.unlocked).length

  const GLOSSARY_ITEMS = {
    fr: ['Anamnèse : retour réflexif sur le passé', 'Trame narrative : arc de votre vie', "Voix d'auteur : votre style singulier", 'Anachronie : rupture dans la chronologie', 'Épiphanie : moment de révélation'],
    en: ['Anamnesis: reflective return to the past', 'Narrative arc: your life structure', "Author's voice: your unique style", 'Anachrony: break in chronology', 'Epiphany: moment of revelation'],
    es: ['Anamnesis: retorno reflexivo al pasado', 'Trama narrativa: el arco de tu vida', 'Voz de autor: tu estilo singular', 'Anacronía: ruptura en la cronología', 'Epifanía: momento de revelación'],
  }
  const TIPS_ITEMS = {
    fr: ["Commencez par un souvenir précis : une image, une odeur", "Écrivez vite lors d'une session - corrigez après", "Utilisez la règle des 5 sens pour ancrer le lecteur", "Le dialogue intérieur humanise votre récit", "Pas de perfection : l'authenticité prime sur le style"],
    en: ['Start with a precise memory: an image, a smell', 'Write fast during a session - edit later', 'Use the 5 senses rule to ground the reader', 'Inner dialogue humanizes your narrative', 'No perfection: authenticity beats style'],
    es: ['Empieza con un recuerdo preciso: una imagen, un olor', 'Escribe rápido en sesión - corrige después', 'Usa la regla de los 5 sentidos para anclar al lector', 'El diálogo interior humaniza tu relato', 'Sin perfección: la autenticidad prima sobre el estilo'],
  }
  const QUESTIONS_ITEMS = {
    fr: ["Qui étais-je vraiment à cette époque ?", "Qu'est-ce que j'aurais voulu dire à cette personne ?", "Quel était mon secret le mieux gardé ?", "Qu'est-ce que cette épreuve m'a appris sur moi ?", "Quelle scène je n'oublierai jamais ?"],
    en: ["Who was I really at that time?", "What did I wish I had said to that person?", "What was my best-kept secret?", "What did this trial teach me about myself?", "What scene will I never forget?"],
    es: ["¿Quién era yo realmente en esa época?", "¿Qué hubiera querido decirle a esa persona?", "¿Cuál era mi secreto mejor guardado?", "¿Qué me enseñó esa prueba sobre mí mismo/a?", "¿Qué escena nunca olvidaré?"],
  }

  const RESOURCES = [
    { id: 'glossary',   title: t.resources.glossary,  icon: '◈', desc: t.resources.glossaryDesc,  items: GLOSSARY_ITEMS[store.lang] },
    { id: 'editorial',  title: t.resources.editorial, icon: '◎', desc: t.resources.editorialDesc, items: store.chapters.map((ch) => { const d = getChapterDisplay(ch, store.lang); return `${ch.number}. ${d.title} - ${d.subtitle}` }) },
    { id: 'tips',       title: t.resources.tips,      icon: '✦', desc: t.resources.tipsDesc,       items: TIPS_ITEMS[store.lang] },
    { id: 'questions',  title: t.resources.questions, icon: '?', desc: t.resources.questionsDesc,  items: QUESTIONS_ITEMS[store.lang] },
    { id: 'characters', title: store.lang === 'fr' ? 'Personnages' : store.lang === 'es' ? 'Personajes' : 'Characters', icon: '◎', desc: store.lang === 'fr' ? 'Les personnes de votre histoire' : store.lang === 'es' ? 'Las personas de tu historia' : 'The people in your story', items: [] },
    { id: 'timeline', title: store.lang === 'fr' ? 'Chronologie' : store.lang === 'es' ? 'Cronología' : 'Timeline', icon: '◷', desc: store.lang === 'fr' ? 'Les dates et événements de votre vie' : store.lang === 'es' ? 'Las fechas y eventos de tu vida' : 'The dates and events of your life', items: [] },
    { id: 'notes', title: store.lang === 'fr' ? 'À faire' : store.lang === 'es' ? 'Por hacer' : 'To-do', icon: '✎', desc: store.lang === 'fr' ? 'Recherches, vérifications, questions' : store.lang === 'es' ? 'Investigaciones, verificaciones, preguntas' : 'Research, checks, questions', items: [] },
  ]

  // ── Animation helpers ──────────────────────────────────────
  function fadeSwitch(fn: () => void) {
    setContentVisible(false)
    setTimeout(() => {
      fn()
      setContentVisible(true)
    }, 200)
  }

  function expand(id: PanelId) {
    fadeSwitch(() => setExpanded(id))
  }

  function collapse() {
    fadeSwitch(() => setExpanded(null))
  }

  // ── Export ─────────────────────────────────────────────────
  function handleExport() {
    const lines = [`# ${store.userName || t.book.memoirs}\n`]
    store.chapters
      .filter(c => c.status === 'done')
      .forEach(ch => {
        const session = store.sessions.find(s => s.chapterId === ch.id)
        lines.push(`## ${ch.title}\n\n${session?.content || t.book.noContent}`)
      })
    const blob = new Blob([lines.join('\n\n---\n\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mes-memoires.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Panel titles ───────────────────────────────────────────
  const panelLabel: Record<PanelId, string> = {
    writing:   t.panels.writing,
    dashboard: t.panels.dashboard,
    book:      t.panels.book,
    resources: t.panels.resources,
  }

  // ══════════════════════════════════════════════════════════
  // MINI PANEL CONTENT
  // ══════════════════════════════════════════════════════════

  function MiniWriting() {
    if (!nextChapter) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-display text-lg italic text-[#FAF8F4]">{t.writing.complete}</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full">
        <p className="text-[#9C8E80]/70 text-[10px] tracking-widest uppercase mb-2">
          {completedCount === 0 ? t.writing.start : t.writing.nextChapter}
        </p>
        <p className="text-[#FAF8F4]/40 text-xs mb-1">{t.writing.chapter} {nextChapter.number}</p>
        <h2 className="font-display text-xl font-light italic text-[#FAF8F4] leading-tight mb-2">
          {nextChapterDisplay?.title}
        </h2>
        <p className="text-[#7A4F32] text-xs leading-relaxed flex-1"
          style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {nextChapterDisplay?.subtitle}
        </p>
        <button
          onClick={() => router.push(`/write/${nextChapter.id}`)}
          className="mt-4 w-full bg-[#C4622A] text-white text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-all"
        >
          {t.writing.writeNow}
        </button>
      </div>
    )
  }

  function MiniDashboard() {
    const isNew = store.sessions.length === 0
    return (
      <div className={`flex flex-col h-full gap-3 transition-opacity duration-500 ${isNew ? 'opacity-40' : 'opacity-100'}`}>
        <div className="flex items-center gap-3">
          <svg width="50" height="50" viewBox="0 0 50 50" className="flex-shrink-0">
            <circle cx="25" cy="25" r={radius} fill="none" stroke="#EDE4D8" strokeWidth="3" />
            <circle cx="25" cy="25" r={radius} fill="none" stroke="#C4622A" strokeWidth="3"
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={progress === 0 ? circumference : strokeOffset}
              transform="rotate(-90 25 25)" className="transition-all duration-700" />
            <text x="25" y="30" textAnchor="middle" fontSize="11" fill="#1C1C2E" fontStyle="italic">
              {completedCount}/{totalChapters}
            </text>
          </svg>
          <div className="flex-1">
            <p className="text-xs text-[#9C8E80]">{t.dashboard.progress}</p>
            <p className="font-display text-lg font-light italic text-[#1C1C2E]">{Math.round(progress * 100)}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#9C8E80]">
              {store.lang === 'fr' ? 'Séances écrites' : store.lang === 'es' ? 'Sesiones escritas' : 'Sessions written'}
            </p>
            <p className="font-display text-xl font-light italic text-[#C4622A]">
              {store.sessions.length}
            </p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-[#9C8E80] mb-1">
            <span>{t.dashboard.weeklyGoal}</span>
            <span className="text-[#C4622A]">{t.weekly.wordsThisWeek(wordsThisWeek, WEEKLY_GOAL)}</span>
          </div>
          <div className="h-1.5 bg-[#EDE4D8] rounded-full overflow-hidden">
            <div className="h-full bg-[#C4622A] rounded-full transition-all" style={{ width: `${weeklyPct}%` }} />
          </div>
        </div>
        <div className="mt-auto">
          <div className="flex gap-1.5 flex-wrap">
            {badges.map((b, i) => (
              <span key={i} title={b.label} className={`text-lg ${b.unlocked ? '' : 'opacity-20 grayscale'}`}>{b.icon}</span>
            ))}
          </div>
          <p className="text-[10px] text-[#9C8E80] mt-1">{unlockedCount}/{badges.length} {t.dashboard.unlocked}</p>
        </div>
      </div>
    )
  }

  function MiniBook() {
    const isNew = completedCount === 0
    return (
      <div className={`flex flex-col h-full transition-opacity duration-500 ${isNew ? 'opacity-40' : 'opacity-100'}`}>
        <div className="bg-[#1C1C2E] rounded-xl p-3 mb-3">
          <p className="font-display text-sm font-light italic text-[#FAF8F4] leading-tight">
            {store.userName || t.book.memoirs}
          </p>
          <p className="text-[#9C8E80] text-[10px] mt-0.5">
            {new Date().getFullYear()} · {completedCount}/{totalChapters} {store.lang === 'fr' ? 'chapitres' : 'chapters'}
          </p>
        </div>
        <div className="flex-1 space-y-0.5 overflow-hidden">
          {store.chapters.slice(0, 6).map(ch => {
            const d = getChapterDisplay(ch, store.lang)
            return (
              <button
                key={ch.id}
                onClick={() => router.push(`/write/${ch.id}`)}
                className={`w-full flex items-center gap-2 rounded-lg px-1.5 py-1 -mx-1.5 transition-all hover:bg-[#1C1C2E]/5 text-left`}
              >
                <span className={`text-[10px] flex-shrink-0 font-mono w-4 ${ch.status === 'done' ? 'text-[#C4622A]' : 'text-[#D4C9BA]'}`}>
                  {ch.status === 'done' ? '✓' : ch.number}
                </span>
                <p className={`text-xs truncate flex-1 ${ch.status === 'done' ? 'text-[#1C1C2E] font-medium' : 'text-[#C4B9A8]'}`}>
                  {d.title}
                </p>
                <span className="text-[9px] text-[#C4B9A8]/40 shrink-0">→</span>
              </button>
            )
          })}
        </div>
        {!store.trameCustom && (
          <button
            onClick={() => router.push('/trame/brainstorm')}
            className="w-full text-xs py-2 mt-2 rounded-lg bg-[#C4622A]/10 text-[#C4622A] font-medium hover:bg-[#C4622A]/20 transition-all"
          >
            Esquisser ma trame
          </button>
        )}
        <div className="flex gap-2 mt-2">
          <button onClick={handleExport} className="flex-1 text-xs py-1.5 border border-[#C4B9A8] rounded-lg text-[#7A4F32] hover:bg-[#EDE4D8] transition-all">
            {t.actions.export}
          </button>
          <button className="flex-1 text-xs py-1.5 border border-[#C4B9A8] rounded-lg text-[#7A4F32] hover:bg-[#EDE4D8] transition-all">
            {t.actions.share}
          </button>
        </div>
      </div>
    )
  }

  function MiniResources() {
    return (
      <div className="flex flex-col gap-2 h-full">
        <button
          onClick={() => router.push('/trame/upload')}
          className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#F5EFE0] transition-all text-left border border-dashed border-[#C4B9A8]"
        >
          <span className="text-[#C4622A] text-sm flex-shrink-0 mt-0.5">+</span>
          <div>
            <p className="text-xs font-medium text-[#1C1C2E]">Importer mes notes</p>
            <p className="text-[10px] text-[#9C8E80] leading-tight">Textes, brouillons, journaux</p>
          </div>
        </button>
        {RESOURCES.map((r, i) => (
          <button
            key={i}
            onClick={() => { setActiveResource(i); expand('resources') }}
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#F5EFE0] transition-all text-left"
          >
            <span className="text-[#C4622A] text-sm flex-shrink-0 mt-0.5">{r.icon}</span>
            <div>
              <p className="text-xs font-medium text-[#1C1C2E]">{r.title}</p>
              <p className="text-[10px] text-[#9C8E80] leading-tight">{r.desc}</p>
            </div>
          </button>
        ))}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // EXPANDED PANEL CONTENT
  // ══════════════════════════════════════════════════════════

  function ExpandedWriting() {
    return (
      <div className="max-w-2xl mx-auto py-4">
        {nextChapterDisplay ? (
          <>
            <p className="text-[#9C8E80] text-xs tracking-widest uppercase mb-1">
              {t.writing.chapter} {nextChapterDisplay.number}
            </p>
            <h1 className="font-display text-4xl font-light italic text-[#FAF8F4] mb-2">{nextChapterDisplay.title}</h1>
            <p className="text-[#7A4F32] mb-6">{nextChapterDisplay.subtitle}</p>
            <div className="bg-[#FAF8F4]/5 rounded-2xl p-5 mb-4 border border-[#FAF8F4]/10">
              <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase mb-2">{t.writing.inspiredBy}</p>
              <p className="font-display text-lg italic text-[#FAF8F4]/80 leading-relaxed">
                &ldquo;{nextChapterDisplay.quote}&rdquo;
              </p>
              <p className="text-xs text-[#9C8E80] mt-2">- {nextChapterDisplay.quoteAuthor}</p>
            </div>
            <div className="bg-[#FAF8F4]/5 rounded-2xl p-5 mb-6 border border-[#FAF8F4]/10">
              <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase mb-2">{t.writing.writingPrompt}</p>
              <p className="text-[#FAF8F4]/70 leading-relaxed text-sm">{nextChapterDisplay.prompt}</p>
            </div>
            <button
              onClick={() => router.push(`/write/${nextChapterDisplay.id}`)}
              className="w-full bg-[#C4622A] text-white font-medium py-4 rounded-2xl hover:opacity-90 transition-all"
            >
              {t.writing.startSession}
            </button>
            <div className="mt-8 p-5 rounded-xl border border-[#FAF8F4]/10">
              <p className="font-display text-base italic text-[#FAF8F4]/40 leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
              <p className="text-xs text-[#9C8E80] mt-2">- {quote.author}</p>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-4xl italic text-[#FAF8F4] mb-4">{t.writing.complete}</p>
          </div>
        )}
      </div>
    )
  }

  function ExpandedDashboard() {
    const encIdx = Math.min(completedCount, t.dashboard.encouragements.length - 1)
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="bg-[#1C1C2E] rounded-2xl px-6 py-5 mb-6">
          <p className="font-display text-lg italic text-[#FAF8F4] leading-relaxed">
            &ldquo;{t.dashboard.encouragements[encIdx]}&rdquo;
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: t.dashboard.wordsWritten, value: totalWords.toLocaleString('fr-FR') },
            { label: t.dashboard.sessions,     value: store.sessions.length.toString() },
            { label: store.lang === 'fr' ? 'Séances écrites' : store.lang === 'es' ? 'Sesiones' : 'Sessions', value: store.sessions.length.toString() },
            { label: store.lang === 'fr' ? 'Chapitres' : 'Chapters', value: `${completedCount}/${totalChapters}` },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-[#EDE4D8] px-4 py-4">
              <p className="text-xs text-[#9C8E80] mb-1">{stat.label}</p>
              <p className="font-display text-2xl font-light italic text-[#1C1C2E]">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="mb-6 bg-white rounded-2xl border border-[#EDE4D8] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-[#1C1C2E]">{t.dashboard.weeklyGoal}</p>
            <p className="text-sm text-[#9C8E80]">
              <span className="text-[#C4622A] font-medium">{wordsThisWeek}</span> / {WEEKLY_GOAL} {t.book.words}
            </p>
          </div>
          <div className="h-2 bg-[#EDE4D8] rounded-full overflow-hidden">
            <div className="h-full bg-[#C4622A] rounded-full transition-all" style={{ width: `${weeklyPct}%` }} />
          </div>
          {weeklyPct >= 100 && <p className="text-xs text-[#C4622A] mt-2">{t.dashboard.goalReached}</p>}
        </div>
        <div className="mb-6 bg-white rounded-2xl border border-[#EDE4D8] p-5">
          <p className="text-sm font-medium text-[#1C1C2E] mb-4">{t.dashboard.bookProgress}</p>
          <div className="flex gap-2">
            {store.chapters.map(ch => (
              <div key={ch.id} title={ch.title}
                className={`flex-1 h-8 rounded-lg flex items-center justify-center transition-all ${ch.status === 'done' ? 'bg-[#C4622A]' : 'bg-[#EDE4D8]'}`}>
                {ch.status === 'done' && <span className="text-white text-[10px]">✓</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#EDE4D8] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#1C1C2E]">{t.dashboard.rewards}</p>
            <p className="text-xs text-[#9C8E80]">{unlockedCount}/{badges.length} {t.dashboard.unlocked}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b, i) => (
              <div key={i}
                className={`rounded-xl p-3 text-center border transition-all ${b.unlocked ? 'border-[#C4622A]/20 bg-[#C4622A]/5' : 'border-[#EDE4D8] opacity-40 grayscale'}`}>
                <span className="text-2xl block mb-1">{b.icon}</span>
                <p className="text-xs font-medium text-[#1C1C2E] leading-tight">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function ExpandedBook() {
    const written = store.chapters.filter(c => c.status === 'done')
    const prefaceFn = completedCount === 0 ? () => t.book.notStarted
      : completedCount < 3 ? t.book.prefaceEarly
      : completedCount < 6 ? t.book.prefaceMid
      : t.book.prefaceLate
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="bg-[#1C1C2E] rounded-2xl p-8 mb-6 text-center">
          <p className="text-[#9C8E80] text-xs tracking-widest uppercase mb-4">{t.book.yourBook}</p>
          <h1 className="font-display text-4xl font-light italic text-[#FAF8F4] mb-1">{store.userName || t.book.memoirs}</h1>
          <p className="font-display text-lg italic text-[#7A4F32]">{t.book.memoirs}</p>
          <p className="text-[#9C8E80]/60 text-sm mt-1">{new Date().getFullYear()}</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={handleExport}
              className="flex items-center gap-2 bg-[#C4622A] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-all">
              {t.book.export}
            </button>
            <button className="flex items-center gap-2 border border-[#FAF8F4]/20 text-[#FAF8F4] text-sm px-5 py-2.5 rounded-full hover:bg-[#FAF8F4]/10 transition-all">
              {t.book.share}
            </button>
          </div>
          {!store.trameCustom && (
            <button
              onClick={() => router.push('/trame/brainstorm')}
              className="mt-4 text-sm text-[#9C8E80] hover:text-[#FAF8F4] transition-colors underline underline-offset-2"
            >
              Esquisser ma trame avec l&apos;IA
            </button>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-[#EDE4D8] p-6 mb-6">
          <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-3">{t.book.preface}</p>
          <p className="font-display text-base italic text-[#1C1C2E] leading-relaxed">
            {completedCount === 0 ? t.book.notStarted : prefaceFn(store.userName)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#EDE4D8] p-6 mb-6">
          <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-4">{t.book.toc}</p>
          <div className="space-y-0.5">
            {store.chapters.map(ch => {
              const d = getChapterDisplay(ch, store.lang)
              return (
                <button
                  key={ch.id}
                  onClick={() => router.push(`/write/${ch.id}`)}
                  className="w-full flex items-center justify-between py-2.5 border-b border-[#F5EFE0] last:border-0 hover:bg-[#F5EFE0] -mx-2 px-2 rounded-lg transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm flex-shrink-0 ${ch.status === 'done' ? 'text-[#C4622A]' : 'text-[#D4C9BA]'}`}>
                      {ch.status === 'done' ? '✓' : ch.number}
                    </span>
                    <div>
                      <p className={`text-sm ${ch.status === 'done' ? 'text-[#1C1C2E] font-medium' : 'text-[#C4B9A8]'}`}>{d.title}</p>
                      <p className="text-xs text-[#9C8E80]">{d.subtitle}</p>
                    </div>
                  </div>
                  {ch.status === 'done' ? (
                    <span className="text-xs text-[#9C8E80] flex-shrink-0 ml-4">
                      {store.sessions.find(s => s.chapterId === ch.id)?.wordCount ?? 0} {t.book.words}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#C4B9A8]/60 shrink-0 ml-4">→ Écrire</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        {written.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#EDE4D8] p-6">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-4">{t.book.excerpts}</p>
            <div className="space-y-5">
              {written.map(ch => {
                const d = getChapterDisplay(ch, store.lang)
                const content = store.sessions.find(s => s.chapterId === ch.id)?.content || ''
                return (
                  <div key={ch.id} className="border-l-2 border-[#C4622A]/30 pl-4">
                    <p className="text-xs font-medium text-[#1C1C2E] mb-1.5">{d.title}</p>
                    <p className="text-sm text-[#7A4F32] italic leading-relaxed">
                      {content ? content.slice(0, 250) + (content.length > 250 ? '…' : '') : <span className="text-[#9C8E80] not-italic">{t.book.noContent}</span>}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  function ExpandedResources() {
    const active = RESOURCES[activeResource]
    const writeTarget = nextChapter?.id ?? store.chapters[0]?.id ?? 'ch-1'
    const lang = store.lang

    // Characters state (local for add form)
    const [addingChar, setAddingChar] = useState(false)
    const [newCharName, setNewCharName] = useState('')
    const [newCharRelation, setNewCharRelation] = useState('')
    const [newCharPeriod, setNewCharPeriod] = useState('')
    const [expandedChar, setExpandedChar] = useState<string | null>(null)
    const [charView, setCharView] = useState<'list' | 'tree'>('list')

    // Notes state
    const [newNoteText, setNewNoteText] = useState('')
    const [newNoteType, setNewNoteType] = useState<'research' | 'verify' | 'ask' | 'idea'>('research')

    // Timeline state
    const [addingEvent, setAddingEvent] = useState(false)
    const [newEvtDate, setNewEvtDate] = useState('')
    const [newEvtTitle, setNewEvtTitle] = useState('')
    const [newEvtDesc, setNewEvtDesc] = useState('')
    const [expandedEvt, setExpandedEvt] = useState<string | null>(null)

    const RELATION_OPTS = lang === 'fr'
      ? ['Parent', 'Ami(e)', 'Amour', 'Mentor', 'Enfant', 'Frère/Sœur', 'Collègue', 'Autre']
      : lang === 'es'
        ? ['Padre/Madre', 'Amigo/a', 'Amor', 'Mentor/a', 'Hijo/a', 'Hermano/a', 'Colega', 'Otro']
        : ['Parent', 'Friend', 'Love', 'Mentor', 'Child', 'Sibling', 'Colleague', 'Other']

    function addChar(e?: React.KeyboardEvent | React.MouseEvent) {
      e?.preventDefault()
      e?.stopPropagation()
      if (!newCharName.trim()) return
      store.addCharacter({ name: newCharName.trim(), relation: newCharRelation || RELATION_OPTS[7], period: newCharPeriod.trim(), notes: '' })
      setNewCharName('')
      setNewCharRelation('')
      setNewCharPeriod('')
      setAddingChar(false)
    }

    return (
      <div className="max-w-2xl mx-auto py-4">
        {/* Tab bar */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {RESOURCES.map((r, i) => (
            <button key={i} onClick={() => setActiveResource(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                activeResource === i ? 'bg-[#1C1C2E] text-white' : 'bg-white border border-[#EDE4D8] text-[#7A4F32] hover:bg-[#F5EFE0]'
              }`}>
              <span>{r.icon}</span>{r.title}
            </button>
          ))}
        </div>

        {/* ── Characters tab ── */}
        {active.id === 'characters' ? (
          <div className="space-y-4">
            {/* View toggle */}
            {store.characters.length > 0 && (
              <div className="flex gap-2 mb-2">
                <button onClick={() => setCharView('list')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${charView === 'list' ? 'bg-[#1C1C2E] text-white border-[#1C1C2E]' : 'border-[#EDE4D8] text-[#7A4F32] hover:bg-[#F5EFE0]'}`}>
                  {lang === 'fr' ? '≡ Liste' : lang === 'es' ? '≡ Lista' : '≡ List'}
                </button>
                <button onClick={() => setCharView('tree')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${charView === 'tree' ? 'bg-[#1C1C2E] text-white border-[#1C1C2E]' : 'border-[#EDE4D8] text-[#7A4F32] hover:bg-[#F5EFE0]'}`}>
                  {lang === 'fr' ? '⬡ Arbre' : lang === 'es' ? '⬡ Árbol' : '⬡ Tree'}
                </button>
              </div>
            )}

            {/* Tree view */}
            {charView === 'tree' && store.characters.length > 0 && (() => {
              const ANCESTORS = lang === 'fr' ? ['Parent', 'Frère/Sœur'] : lang === 'es' ? ['Padre/Madre', 'Hermano/a'] : ['Parent', 'Sibling']
              const PEERS = lang === 'fr' ? ['Ami(e)', 'Amour', 'Mentor', 'Collègue'] : lang === 'es' ? ['Amigo/a', 'Amor', 'Mentor/a', 'Colega'] : ['Friend', 'Love', 'Mentor', 'Colleague']
              const DESCENDANTS = lang === 'fr' ? ['Enfant'] : lang === 'es' ? ['Hijo/a'] : ['Child']
              const ancestors = store.characters.filter(c => ANCESTORS.includes(c.relation))
              const peers = store.characters.filter(c => PEERS.includes(c.relation))
              const descendants = store.characters.filter(c => DESCENDANTS.includes(c.relation))
              const others = store.characters.filter(c => !ANCESTORS.includes(c.relation) && !PEERS.includes(c.relation) && !DESCENDANTS.includes(c.relation))

              function TreeNode({ ch }: { ch: typeof store.characters[0] }) {
                return (
                  <button
                    onClick={() => router.push(`/write/${writeTarget}?inspiration=${encodeURIComponent(lang === 'fr' ? `Parlez-moi de ${ch.name} - comment cette personne est-elle entrée dans votre vie ?` : lang === 'es' ? `Háblame de ${ch.name} - ¿cómo entró esta persona en tu vida?` : `Tell me about ${ch.name} - how did this person enter your life?`)}`)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#EDE4D8] group-hover:bg-[#C4622A]/20 flex items-center justify-center transition-all">
                      <span className="font-display italic text-[#7A4F32] text-sm">{ch.name[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-[10px] text-[#1C1C2E] font-medium max-w-[56px] truncate">{ch.name}</span>
                    {ch.relation && <span className="text-[9px] text-[#C4622A]">{ch.relation}</span>}
                    {ch.period && <span className="text-[9px] text-[#9C8E80] italic max-w-[64px] truncate">{ch.period}</span>}
                  </button>
                )
              }

              return (
                <div className="bg-white rounded-2xl border border-[#EDE4D8] p-5 mb-2">
                  {/* Ancestors row */}
                  {ancestors.length > 0 && (
                    <div className="flex justify-center gap-4 mb-2">
                      {ancestors.map(ch => <TreeNode key={ch.id} ch={ch} />)}
                    </div>
                  )}
                  {/* Connector lines */}
                  {ancestors.length > 0 && (
                    <div className="flex justify-center mb-2">
                      <div className="h-5 w-px bg-[#EDE4D8]" />
                    </div>
                  )}
                  {/* Center row: peers + YOU + others */}
                  <div className="flex items-center justify-center gap-4 mb-2">
                    {peers.slice(0, Math.ceil(peers.length / 2)).map(ch => <TreeNode key={ch.id} ch={ch} />)}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-[#1C1C2E] flex items-center justify-center ring-2 ring-[#C4622A]/30">
                        <span className="font-display italic text-[#FAF8F4] text-base">{store.userName[0]?.toUpperCase() ?? 'V'}</span>
                      </div>
                      <span className="text-[10px] text-[#1C1C2E] font-medium">{store.userName || 'Vous'}</span>
                    </div>
                    {peers.slice(Math.ceil(peers.length / 2)).map(ch => <TreeNode key={ch.id} ch={ch} />)}
                    {others.map(ch => <TreeNode key={ch.id} ch={ch} />)}
                  </div>
                  {/* Connector lines down */}
                  {descendants.length > 0 && (
                    <div className="flex justify-center mb-2">
                      <div className="h-5 w-px bg-[#EDE4D8]" />
                    </div>
                  )}
                  {/* Descendants row */}
                  {descendants.length > 0 && (
                    <div className="flex justify-center gap-4">
                      {descendants.map(ch => <TreeNode key={ch.id} ch={ch} />)}
                    </div>
                  )}
                  <p className="text-[10px] text-[#9C8E80] text-center mt-4">{lang === 'fr' ? 'Cliquez sur un personnage pour écrire à son sujet' : lang === 'es' ? 'Haz clic en un personaje para escribir sobre él' : 'Click a character to write about them'}</p>
                </div>
              )
            })()}

            {/* Existing characters */}
            {store.characters.length === 0 && !addingChar && (
              <div className="bg-white rounded-2xl border border-[#EDE4D8] p-8 text-center">
                <p className="text-[#9C8E80] text-sm mb-1">
                  {lang === 'fr' ? 'Aucun personnage encore.' : lang === 'es' ? 'Ningún personaje todavía.' : 'No characters yet.'}
                </p>
                <p className="text-[#C4B9A8] text-xs">
                  {lang === 'fr' ? 'Ajoutez les personnes importantes de votre récit.' : lang === 'es' ? 'Añade las personas importantes de tu relato.' : 'Add the important people in your story.'}
                </p>
              </div>
            )}
            {charView === 'list' && store.characters.map(ch => (
              <div key={ch.id} className="bg-white rounded-2xl border border-[#EDE4D8] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-[#EDE4D8] flex items-center justify-center flex-shrink-0">
                    <span className="font-display italic text-[#7A4F32] text-sm">{ch.name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1C1C2E] text-sm">{ch.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {ch.relation && (
                        <span className="text-[10px] text-[#C4622A] bg-[#C4622A]/10 px-2 py-0.5 rounded-full">
                          {ch.relation}
                        </span>
                      )}
                      {ch.period && (
                        <span className="text-[10px] text-[#9C8E80] italic">{ch.period}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/write/${writeTarget}?inspiration=${encodeURIComponent(lang === 'fr' ? `Parlez-moi de ${ch.name} - comment cette personne est-elle entrée dans votre vie ?` : lang === 'es' ? `Háblame de ${ch.name} - ¿cómo entró esta persona en tu vida?` : `Tell me about ${ch.name} - how did this person enter your life?`)}`)}
                      className="text-xs text-[#C4622A] bg-[#C4622A]/10 hover:bg-[#C4622A]/20 px-3 py-1.5 rounded-xl transition-all"
                    >
                      {lang === 'fr' ? 'Écrire →' : lang === 'es' ? 'Escribir →' : 'Write →'}
                    </button>
                    <button
                      onClick={() => setExpandedChar(expandedChar === ch.id ? null : ch.id)}
                      className="text-xs text-[#9C8E80] hover:text-[#1C1C2E] px-2 py-1.5 transition-all"
                    >
                      {expandedChar === ch.id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>
                {expandedChar === ch.id && (
                  <div className="px-5 pb-4 border-t border-[#EDE4D8]">
                    <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase mt-3 mb-1">
                      {lang === 'fr' ? 'Période' : lang === 'es' ? 'Período' : 'Period'}
                    </p>
                    <input
                      type="text"
                      value={ch.period ?? ''}
                      onChange={e => store.updateCharacter(ch.id, { period: e.target.value })}
                      placeholder={lang === 'fr' ? 'ex : Actuel, 1975-1985, Amour de jeunesse, Décédé 2010…' : lang === 'es' ? 'ej: Actual, 1975-1985, Fallecido 2010…' : 'e.g. Current, 1975-1985, Childhood, Deceased 2010…'}
                      className="w-full text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-3 py-2 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 transition-colors mb-3"
                    />
                    <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase mb-1">
                      {lang === 'fr' ? 'Notes' : lang === 'es' ? 'Notas' : 'Notes'}
                    </p>
                    <textarea
                      value={ch.notes}
                      onChange={e => store.updateCharacter(ch.id, { notes: e.target.value })}
                      placeholder={lang === 'fr' ? 'Notes sur ce personnage…' : lang === 'es' ? 'Notas sobre este personaje…' : 'Notes about this character…'}
                      className="w-full text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl p-3 outline-none resize-none border border-[#EDE4D8] focus:border-[#C4622A]/40 transition-colors"
                      rows={3}
                    />
                    <div className="flex justify-between mt-2">
                      <div className="flex gap-2 flex-wrap">
                        {RELATION_OPTS.slice(0, 6).map(rel => (
                          <button key={rel} onClick={() => store.updateCharacter(ch.id, { relation: rel })}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${ch.relation === rel ? 'bg-[#C4622A] border-[#C4622A] text-white' : 'border-[#EDE4D8] text-[#9C8E80] hover:border-[#C4622A]/40'}`}>
                            {rel}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => store.removeCharacter(ch.id)}
                        className="text-xs text-red-300 hover:text-red-500 transition-colors ml-2">
                        {lang === 'fr' ? 'Suppr.' : 'Del.'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add character form */}
            {addingChar ? (
              <div className="bg-white rounded-2xl border border-[#C4622A]/30 p-5">
                <input
                  autoFocus
                  type="text"
                  value={newCharName}
                  onChange={e => setNewCharName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChar(e)}
                  placeholder={lang === 'fr' ? 'Prénom ou nom…' : lang === 'es' ? 'Nombre…' : 'Name…'}
                  className="w-full text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 mb-2"
                />
                <input
                  type="text"
                  value={newCharPeriod}
                  onChange={e => setNewCharPeriod(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChar(e)}
                  placeholder={lang === 'fr' ? 'Période (ex : Actuel, 1975-1985, Amour de jeunesse)…' : lang === 'es' ? 'Período (ej: Actual, 1975-1985)…' : 'Period (e.g. Current, 1975–1985, Childhood friend)…'}
                  className="w-full text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 mb-3"
                />
                <div className="flex gap-2 flex-wrap mb-3">
                  {RELATION_OPTS.map(rel => (
                    <button key={rel} onClick={() => setNewCharRelation(rel)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${newCharRelation === rel ? 'bg-[#C4622A] border-[#C4622A] text-white' : 'border-[#EDE4D8] text-[#9C8E80] hover:border-[#C4622A]/40'}`}>
                      {rel}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => addChar(e)}
                    className="flex-1 bg-[#C4622A] text-white text-sm font-medium py-2 rounded-xl hover:opacity-90 transition-all">
                    {lang === 'fr' ? 'Ajouter' : lang === 'es' ? 'Añadir' : 'Add'}
                  </button>
                  <button onClick={() => { setAddingChar(false); setNewCharName(''); setNewCharRelation(''); setNewCharPeriod('') }}
                    className="text-sm text-[#9C8E80] px-4 hover:text-[#1C1C2E] transition-colors">
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingChar(true)}
                className="w-full bg-white border-2 border-dashed border-[#EDE4D8] rounded-2xl py-4 text-sm text-[#9C8E80] hover:border-[#C4622A]/40 hover:text-[#C4622A] transition-all">
                + {lang === 'fr' ? 'Ajouter un personnage' : lang === 'es' ? 'Añadir un personaje' : 'Add a character'}
              </button>
            )}
          </div>
        ) : active.id === 'timeline' ? (

          /* ── Timeline tab ── */
          <div className="space-y-0">
            {/* Sorted events */}
            {store.timelineEvents.length === 0 && !addingEvent && (
              <div className="bg-white rounded-2xl border border-[#EDE4D8] p-8 text-center mb-4">
                <p className="text-[#9C8E80] text-sm mb-1">
                  {lang === 'fr' ? 'Aucun événement encore.' : lang === 'es' ? 'Ningún evento todavía.' : 'No events yet.'}
                </p>
                <p className="text-[#C4B9A8] text-xs">
                  {lang === 'fr' ? 'Ajoutez les grandes étapes de votre vie.' : lang === 'es' ? 'Añade los grandes momentos de tu vida.' : 'Add the major milestones of your life.'}
                </p>
              </div>
            )}

            {store.timelineEvents.length > 0 && (
              <div className="relative mb-4">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[#EDE4D8]" />
                <div className="space-y-3">
                  {[...store.timelineEvents].sort((a, b) => {
                    const ya = parseInt(a.date.match(/\d{4}/)?.[0] ?? a.date.match(/\d{2}/)?.[0] ?? '9999')
                    const yb = parseInt(b.date.match(/\d{4}/)?.[0] ?? b.date.match(/\d{2}/)?.[0] ?? '9999')
                    return ya - yb
                  }).map((ev) => (
                    <div key={ev.id} className="relative flex gap-4">
                      {/* Dot */}
                      <div className="relative z-10 w-10 flex-shrink-0 flex flex-col items-center pt-3.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#C4622A] ring-2 ring-[#F5EFE0]" />
                      </div>
                      {/* Card */}
                      <div className="flex-1 bg-white rounded-2xl border border-[#EDE4D8] overflow-hidden mb-0.5">
                        <div
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[#FAF8F4] transition-colors"
                          onClick={() => setExpandedEvt(expandedEvt === ev.id ? null : ev.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-medium text-[#C4622A] tracking-widest uppercase">{ev.date}</span>
                            <p className="text-sm font-medium text-[#1C1C2E] mt-0.5 leading-tight">{ev.title}</p>
                            {ev.description && expandedEvt !== ev.id && (
                              <p className="text-xs text-[#9C8E80] mt-0.5 truncate">{ev.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/write/${writeTarget}?inspiration=${encodeURIComponent(lang === 'fr' ? `Racontez-moi ce moment : ${ev.title} (${ev.date})` : lang === 'es' ? `Cuéntame sobre este momento: ${ev.title} (${ev.date})` : `Tell me about this moment: ${ev.title} (${ev.date})`)}`) }}
                              className="text-xs text-[#C4622A] bg-[#C4622A]/10 hover:bg-[#C4622A]/20 px-2.5 py-1 rounded-lg transition-all"
                            >
                              {lang === 'fr' ? 'Écrire →' : lang === 'es' ? 'Escribir →' : 'Write →'}
                            </button>
                            <span className="text-[#9C8E80] text-xs">{expandedEvt === ev.id ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        {expandedEvt === ev.id && (
                          <div className="px-4 pb-4 border-t border-[#EDE4D8]">
                            <div className="flex gap-2 mt-3">
                              <input
                                value={ev.date}
                                onChange={e => store.updateTimelineEvent(ev.id, { date: e.target.value })}
                                placeholder={lang === 'fr' ? 'Date…' : 'Date…'}
                                className="w-28 text-xs text-[#1C1C2E] bg-[#FAF8F4] rounded-lg px-3 py-2 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                              />
                              <input
                                value={ev.title}
                                onChange={e => store.updateTimelineEvent(ev.id, { title: e.target.value })}
                                placeholder={lang === 'fr' ? 'Titre…' : lang === 'es' ? 'Título…' : 'Title…'}
                                className="flex-1 text-xs text-[#1C1C2E] bg-[#FAF8F4] rounded-lg px-3 py-2 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                              />
                            </div>
                            <textarea
                              value={ev.description}
                              onChange={e => store.updateTimelineEvent(ev.id, { description: e.target.value })}
                              placeholder={lang === 'fr' ? 'Notes sur cet événement…' : lang === 'es' ? 'Notas sobre este evento…' : 'Notes about this event…'}
                              className="w-full mt-2 text-xs text-[#1C1C2E] bg-[#FAF8F4] rounded-lg px-3 py-2 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 resize-none"
                              rows={2}
                            />
                            <div className="flex justify-end mt-2">
                              <button onClick={() => store.removeTimelineEvent(ev.id)}
                                className="text-xs text-red-300 hover:text-red-500 transition-colors">
                                {lang === 'fr' ? 'Supprimer' : lang === 'es' ? 'Eliminar' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add event form */}
            {addingEvent ? (
              <div className="bg-white rounded-2xl border border-[#C4622A]/30 p-5">
                <div className="flex gap-2 mb-3">
                  <input
                    autoFocus
                    type="text"
                    value={newEvtDate}
                    onChange={e => setNewEvtDate(e.target.value)}
                    placeholder={lang === 'fr' ? 'Date (ex: 1975, Été 82…)' : lang === 'es' ? 'Fecha (ej: 1975, Verano 82…)' : 'Date (e.g. 1975, Summer 82…)'}
                    className="w-40 text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                  />
                  <input
                    type="text"
                    value={newEvtTitle}
                    onChange={e => setNewEvtTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && newEvtTitle.trim() && (store.addTimelineEvent({ date: newEvtDate, title: newEvtTitle.trim(), description: newEvtDesc }), setNewEvtDate(''), setNewEvtTitle(''), setNewEvtDesc(''), setAddingEvent(false))}
                    placeholder={lang === 'fr' ? 'Événement…' : lang === 'es' ? 'Evento…' : 'Event…'}
                    className="flex-1 text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                  />
                </div>
                <textarea
                  value={newEvtDesc}
                  onChange={e => setNewEvtDesc(e.target.value)}
                  placeholder={lang === 'fr' ? 'Description (optionnel)…' : lang === 'es' ? 'Descripción (opcional)…' : 'Description (optional)…'}
                  className="w-full text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 resize-none mb-3"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (!newEvtTitle.trim()) return; store.addTimelineEvent({ date: newEvtDate, title: newEvtTitle.trim(), description: newEvtDesc }); setNewEvtDate(''); setNewEvtTitle(''); setNewEvtDesc(''); setAddingEvent(false) }}
                    className="flex-1 bg-[#C4622A] text-white text-sm font-medium py-2 rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                    disabled={!newEvtTitle.trim()}
                  >
                    {lang === 'fr' ? 'Ajouter' : lang === 'es' ? 'Añadir' : 'Add'}
                  </button>
                  <button onClick={() => { setAddingEvent(false); setNewEvtDate(''); setNewEvtTitle(''); setNewEvtDesc('') }}
                    className="text-sm text-[#9C8E80] px-4 hover:text-[#1C1C2E] transition-colors">
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingEvent(true)}
                className="w-full bg-white border-2 border-dashed border-[#EDE4D8] rounded-2xl py-4 text-sm text-[#9C8E80] hover:border-[#C4622A]/40 hover:text-[#C4622A] transition-all">
                + {lang === 'fr' ? 'Ajouter un événement' : lang === 'es' ? 'Añadir un evento' : 'Add an event'}
              </button>
            )}
          </div>

        ) : active.id === 'notes' ? (

          /* ── Notes/Research tab ── */
          <div className="space-y-3">
            {/* Note type labels */}
            {(() => {
              const NOTE_TYPES: { id: 'research' | 'verify' | 'ask' | 'idea'; icon: string; label: string }[] = [
                { id: 'research', icon: '🔍', label: lang === 'fr' ? 'Rechercher' : lang === 'es' ? 'Investigar' : 'Research' },
                { id: 'verify', icon: '✓', label: lang === 'fr' ? 'Vérifier' : lang === 'es' ? 'Verificar' : 'Verify' },
                { id: 'ask', icon: '↗', label: lang === 'fr' ? 'Demander' : lang === 'es' ? 'Preguntar' : 'Ask' },
                { id: 'idea', icon: '✦', label: lang === 'fr' ? 'Idée' : lang === 'es' ? 'Idea' : 'Idea' },
              ]

              const pending = store.researchNotes.filter(n => !n.done)
              const done = store.researchNotes.filter(n => n.done)

              return (
                <>
                  {/* Add note input */}
                  <div className="bg-white rounded-2xl border border-[#EDE4D8] p-4">
                    <div className="flex gap-2 mb-3">
                      {NOTE_TYPES.map(t => (
                        <button key={t.id} onClick={() => setNewNoteType(t.id)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${newNoteType === t.id ? 'bg-[#1C1C2E] text-white border-[#1C1C2E]' : 'border-[#EDE4D8] text-[#7A4F32] hover:bg-[#F5EFE0]'}`}>
                          <span>{t.icon}</span>{t.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNoteText}
                        onChange={e => setNewNoteText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && newNoteText.trim()) { e.preventDefault(); store.addResearchNote({ type: newNoteType, text: newNoteText.trim(), done: false }); setNewNoteText('') } }}
                        placeholder={
                          newNoteType === 'research' ? (lang === 'fr' ? 'Rechercher...' : 'Research...') :
                          newNoteType === 'verify' ? (lang === 'fr' ? 'Vérifier que...' : 'Verify that...') :
                          newNoteType === 'ask' ? (lang === 'fr' ? 'Demander à... au sujet de...' : 'Ask... about...') :
                          (lang === 'fr' ? 'Une idée...' : 'An idea...')
                        }
                        className="flex-1 text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                      />
                      <button
                        onClick={() => { if (!newNoteText.trim()) return; store.addResearchNote({ type: newNoteType, text: newNoteText.trim(), done: false }); setNewNoteText('') }}
                        disabled={!newNoteText.trim()}
                        className="text-xs bg-[#C4622A] text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Pending notes */}
                  {pending.length === 0 && done.length === 0 && (
                    <div className="bg-white rounded-2xl border border-[#EDE4D8] p-8 text-center">
                      <p className="text-[#9C8E80] text-sm">{lang === 'fr' ? 'Aucune note encore.' : lang === 'es' ? 'Sin notas todavía.' : 'No notes yet.'}</p>
                      <p className="text-[#C4B9A8] text-xs mt-1">{lang === 'fr' ? 'Ajoutez vos recherches et vérifications.' : lang === 'es' ? 'Añade tus investigaciones y verificaciones.' : 'Add your research and checks.'}</p>
                    </div>
                  )}

                  {pending.map(note => {
                    const t = NOTE_TYPES.find(t => t.id === note.type)
                    return (
                      <div key={note.id} className="flex items-start gap-3 bg-white rounded-2xl border border-[#EDE4D8] px-4 py-3">
                        <button onClick={() => store.updateResearchNote(note.id, { done: true })}
                          className="w-4 h-4 rounded border-2 border-[#C4B9A8] hover:border-[#C4622A] flex-shrink-0 mt-0.5 transition-colors" />
                        <span className="text-sm flex-shrink-0">{t?.icon}</span>
                        <span className="text-sm text-[#1C1C2E] flex-1 leading-relaxed">{note.text}</span>
                        <button onClick={() => store.removeResearchNote(note.id)}
                          className="text-xs text-[#C4B9A8] hover:text-red-400 transition-colors flex-shrink-0">×</button>
                      </div>
                    )
                  })}

                  {/* Done notes */}
                  {done.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase mb-2 px-1">{lang === 'fr' ? 'Terminé' : lang === 'es' ? 'Hecho' : 'Done'}</p>
                      {done.map(note => {
                        const t = NOTE_TYPES.find(t => t.id === note.type)
                        return (
                          <div key={note.id} className="flex items-start gap-3 bg-[#FAF8F4] rounded-xl border border-[#EDE4D8] px-4 py-2.5 mb-2 opacity-60">
                            <button onClick={() => store.updateResearchNote(note.id, { done: false })}
                              className="w-4 h-4 rounded bg-[#C4622A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[8px] text-[#C4622A]">✓</span>
                            </button>
                            <span className="text-xs flex-shrink-0">{t?.icon}</span>
                            <span className="text-xs text-[#9C8E80] flex-1 line-through">{note.text}</span>
                            <button onClick={() => store.removeResearchNote(note.id)}
                              className="text-xs text-[#C4B9A8] hover:text-red-400 transition-colors flex-shrink-0">×</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}
          </div>

        ) : (
          /* ── Regular resource tabs ── */
          <div className="bg-white rounded-2xl border border-[#EDE4D8] p-6 mb-6">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-1">{active.title}</p>
            <p className="text-sm text-[#7A4F32] mb-5">{active.desc}</p>
            <div className="space-y-3">
              {active.items.map((item, i) => {
                const isQuestions = active.id === 'questions'
                if (isQuestions) {
                  return (
                    <button
                      key={i}
                      onClick={() => router.push(`/write/${writeTarget}?inspiration=${encodeURIComponent(item)}`)}
                      className="w-full flex items-start gap-3 p-3 bg-[#FAF8F4] rounded-xl hover:bg-[#EDE4D8] transition-all text-left group"
                    >
                      <span className="text-[#C4622A] text-xs mt-0.5 flex-shrink-0">✦</span>
                      <p className="text-sm text-[#1C1C2E] flex-1">{item}</p>
                      <span className="text-xs text-[#9C8E80] group-hover:text-[#C4622A] transition-colors flex-shrink-0 mt-0.5">→</span>
                    </button>
                  )
                }
                return (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#FAF8F4] rounded-xl">
                    <span className="text-[#C4622A] text-xs mt-0.5 flex-shrink-0">✦</span>
                    <p className="text-sm text-[#1C1C2E]">{item}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Daily quote */}
        {active.id !== 'characters' && active.id !== 'notes' && active.id !== 'timeline' && (
          <div className="bg-[#1C1C2E] rounded-2xl p-6">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-3">{t.resources.quoteOfDay}</p>
            <p className="font-display text-lg italic text-[#FAF8F4] leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
            <p className="text-xs text-[#9C8E80] mt-2">- {quote.author}</p>
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  // Panel card backgrounds
  const panelBg: Record<PanelId, string> = {
    writing:   'bg-[#1C1C2E]',
    dashboard: 'bg-white border border-[#EDE4D8]',
    book:      'bg-[#F5EFE0]',
    resources: 'bg-white border border-[#EDE4D8]',
  }

  // Lang toggle
  function LangToggle() {
    return (
      <div className="flex items-center gap-0.5 bg-[#EDE4D8] rounded-full p-0.5">
        {(['fr', 'en', 'es'] as const).map(l => (
          <button
            key={l}
            onClick={() => store.setLang(l)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              store.lang === l ? 'bg-[#1C1C2E] text-white' : 'text-[#7A4F32] hover:text-[#1C1C2E]'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col">
      {/* Grain */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.025] z-40" style={GRAIN_STYLE} />

      {/* ── Minimal header ────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#EDE4D8] bg-[#FAF8F4]/80 backdrop-blur-sm sticky top-0 z-30">
        <button
          onClick={expanded ? collapse : undefined}
          className="font-display text-xl font-bold text-[#1C1C2E] hover:opacity-70 transition-opacity"
        >
          M<span className="text-[#C4622A]">.</span>emoir
        </button>

        <div className="flex items-center gap-3">
          <LangToggle />
          {store.userName && (
            <button
              onClick={() => router.push('/settings')}
              title="Mon profil"
              className="w-7 h-7 rounded-full bg-[#1C1C2E] flex items-center justify-center flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <span className="text-[#FAF8F4] text-xs font-display font-bold">
                {store.userName[0].toUpperCase()}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────── */}
      <main
        className={`flex-1 flex flex-col transition-opacity duration-200 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {expanded ? (
          // ══ EXPANDED VIEW ══════════════════════════════════════
          <div className="flex-1 flex flex-col">
            {/* Back button + panel label */}
            <div className={`px-6 py-4 flex items-center gap-4 flex-shrink-0 ${expanded === 'writing' ? 'bg-[#1C1C2E]' : 'bg-[#FAF8F4]'}`}>
              <button
                onClick={collapse}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  expanded === 'writing'
                    ? 'bg-[#FAF8F4]/10 text-[#FAF8F4] hover:bg-[#FAF8F4]/20'
                    : 'bg-[#EDE4D8] text-[#1C1C2E] hover:bg-[#D4C9BA]'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t.actions.back}
              </button>
              <span className={`text-xs tracking-widest uppercase font-medium ${expanded === 'writing' ? 'text-[#9C8E80]' : 'text-[#9C8E80]'}`}>
                {panelLabel[expanded]}
              </span>
            </div>

            {/* Expanded content */}
            <div className={`flex-1 overflow-auto px-6 pb-8 ${expanded === 'writing' ? 'bg-[#1C1C2E]' : 'bg-[#FAF8F4]'}`}>
              {expanded === 'writing'   && <ExpandedWriting />}
              {expanded === 'dashboard' && <ExpandedDashboard />}
              {expanded === 'book'      && <ExpandedBook />}
              {expanded === 'resources' && <ExpandedResources />}
            </div>
          </div>

        ) : (
          // ══ BENTO GRID ══════════════════════════════════════════
          <div className="flex-1 flex flex-col p-6 gap-4">
            {/* Greeting */}
            <div className="flex-shrink-0">
              <h1 className="font-display text-3xl md:text-4xl font-light text-[#1C1C2E] italic">{greeting}</h1>
              <p className="text-[#7A4F32] mt-1 text-sm">{sub}</p>
            </div>

            {/* CTA dominant — toujours visible */}
            {(() => {
              const next = getNextChapter(store.chapters)
              if (!next) return null
              return (
                <button
                  onClick={() => router.push(`/write/${next.id}`)}
                  className="flex-shrink-0 w-full bg-[#1C1C2E] text-[#FAF8F4] rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-[#C4622A] transition-colors group"
                >
                  <div className="text-left">
                    <p className="text-[10px] text-[#FAF8F4]/40 tracking-widest uppercase mb-0.5">
                      {store.lang === 'fr' ? 'Prochaine séance' : store.lang === 'es' ? 'Próxima sesión' : 'Next session'}
                    </p>
                    <p className="font-display text-base italic text-[#FAF8F4]">
                      {store.lang === 'fr' ? `Chapitre ${next.number} · ${next.title}` : `Chapter ${next.number} · ${next.title}`}
                    </p>
                  </div>
                  <span className="text-[#C4622A] group-hover:text-[#FAF8F4] text-xl transition-colors">✦</span>
                </button>
              )
            })()}

            {/* 2×2 Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Writing - ink */}
              <div
                className={`${panelBg.writing} rounded-2xl p-5 flex flex-col min-h-56 relative group cursor-default
                  ${store.sessions.length === 0 ? 'ring-2 ring-[#C4622A]/40 ring-offset-2 ring-offset-[#FAF8F4]' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#C4622A] text-sm">✦</span>
                    <p className="text-[10px] text-[#FAF8F4]/40 tracking-widest uppercase font-medium">{t.panels.writing}</p>
                  </div>
                  {(
                    <button
                      onClick={() => expand('writing')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF8F4]/10 text-[#FAF8F4]/60 hover:bg-[#FAF8F4]/20 text-xs"
                      title={t.actions.expand}
                    >
                      {t.actions.expand} ↗
                    </button>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <MiniWriting />
                </div>
              </div>

              {/* Dashboard - white */}
              <div className={`${panelBg.dashboard} rounded-2xl p-5 flex flex-col min-h-56 relative group cursor-default`}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#9C8E80] text-sm">◎</span>
                    <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase font-medium">{t.panels.dashboard}</p>
                  </div>
                  <button
                    onClick={() => expand('dashboard')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EDE4D8] text-[#9C8E80] hover:bg-[#C4622A] hover:text-white text-xs"
                    title={t.actions.expand}
                  >
                    {t.actions.expand} ↗
                  </button>
                </div>
                <div className="flex-1 flex flex-col">
                  <MiniDashboard />
                </div>
              </div>

              {/* Book - cream */}
              <div className={`${panelBg.book} rounded-2xl p-5 flex flex-col min-h-56 relative group cursor-default`}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#9C8E80] text-sm">◻</span>
                    <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase font-medium">{t.panels.book}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {store.sessions.length >= 1 && (
                      <button
                        onClick={() => setShowArchitect(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EDE4D8] text-[#9C8E80] hover:bg-[#1C1C2E] hover:text-white text-xs"
                        title="Architecture du livre"
                      >
                        ◈ Architecte
                      </button>
                    )}
                    <button
                      onClick={() => expand('book')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EDE4D8] text-[#9C8E80] hover:bg-[#C4622A] hover:text-white text-xs"
                      title={t.actions.expand}
                    >
                      {t.actions.expand} ↗
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  <MiniBook />
                </div>
              </div>

              {/* Resources - white */}
              <div className={`${panelBg.resources} rounded-2xl p-5 flex flex-col min-h-56 relative group cursor-default`}>
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#9C8E80] text-sm">◈</span>
                    <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase font-medium">{t.panels.resources}</p>
                  </div>
                  <button
                    onClick={() => expand('resources')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EDE4D8] text-[#9C8E80] hover:bg-[#C4622A] hover:text-white text-xs"
                    title={t.actions.expand}
                  >
                    {t.actions.expand} ↗
                  </button>
                </div>
                <div className="flex-1 flex flex-col">
                  <MiniResources />
                </div>
              </div>

              {/* RDV Memoir - full-width coaching strip */}
              <div className="sm:col-span-2 bg-[#1C1C2E] rounded-2xl px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#C4622A]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#C4622A] text-base">◈</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase font-medium mb-0.5">
                    RDV Memoir
                  </p>
                  <p className="text-sm text-[#FAF8F4]/60 truncate">{rdvDesc}</p>
                </div>
                <button
                  onClick={() => router.push('/rdv')}
                  className="flex-shrink-0 bg-[#C4622A] text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-all"
                >
                  {rdvCta} →
                </button>
              </div>

            </div>

            {/* Footer links */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 pb-2">
              <button
                onClick={() => router.push('/quotes')}
                className="text-[10px] text-[#C4B9A8]/50 hover:text-[#7A4F32] transition-colors tracking-wide flex items-center gap-1.5"
              >
                <span className="text-[#C4622A]/40">✦</span>
                {store.lang === 'fr' ? 'Citations' : store.lang === 'es' ? 'Citas' : 'Quotes'}
                {store.savedQuotes?.length > 0 && (
                  <span className="text-[#C4622A]/60">{store.savedQuotes.length}</span>
                )}
              </button>
              <span className="text-[#C4B9A8]/20 text-[10px]">·</span>
              <button
                onClick={() => router.push('/mentions-legales')}
                className="text-[10px] text-[#C4B9A8]/50 hover:text-[#7A4F32] transition-colors tracking-wide"
              >
                {store.lang === 'fr' ? 'Mentions légales' : store.lang === 'es' ? 'Aviso legal' : 'Legal Notice'}
              </button>
              <span className="text-[#C4B9A8]/20 text-[10px]">·</span>
              <button
                onClick={() => router.push('/privacy')}
                className="text-[10px] text-[#C4B9A8]/50 hover:text-[#7A4F32] transition-colors tracking-wide"
              >
                {store.lang === 'fr' ? 'Confidentialité' : store.lang === 'es' ? 'Privacidad' : 'Privacy'}
              </button>
              <span className="text-[#C4B9A8]/20 text-[10px]">·</span>
              <button
                onClick={() => router.push('/contact')}
                className="text-[10px] text-[#C4B9A8]/50 hover:text-[#7A4F32] transition-colors tracking-wide"
              >
                {store.lang === 'fr' ? 'Contact' : store.lang === 'es' ? 'Contacto' : 'Contact'}
              </button>
            </div>

          </div>
        )}
      </main>

      {/* BookArchitect modal */}
      {showArchitect && <BookArchitect onClose={() => setShowArchitect(false)} />}
    </div>
  )
}
