'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore, getNextChapter, getCompletedCount } from '@/stores/memoir'
import { DAILY_QUOTES_BY_LANG, getChapterDisplay } from '@/lib/mock/trame-data'
import { T } from '@/lib/i18n'
import { BookArchitect } from '@/components/BookArchitect'
import ArchivisteScanner from '@/components/ArchivisteScanner'
import TrameDrawer from '@/components/TrameDrawer'

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

  // ExpandedResources state (lifted to avoid hooks-in-nested-function error)
  const [addingChar, setAddingChar] = useState(false)
  const [newCharName, setNewCharName] = useState('')
  const [newCharRelation, setNewCharRelation] = useState('')
  const [newCharPeriod, setNewCharPeriod] = useState('')
  const [expandedChar, setExpandedChar] = useState<string | null>(null)
  const [charView, setCharView] = useState<'list' | 'tree'>('list')
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteType, setNewNoteType] = useState<'research' | 'verify' | 'ask' | 'idea'>('research')
  const [addingEvent, setAddingEvent] = useState(false)
  const [newEvtDate, setNewEvtDate] = useState('')
  const [newEvtTitle, setNewEvtTitle] = useState('')
  const [newEvtDesc, setNewEvtDesc] = useState('')
  const [expandedEvt, setExpandedEvt] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState<'characters' | 'timeline' | null>(null)
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null)
  const [trameOpen, setTrameOpen] = useState(false)
  // Agenda / journal d'émotions state
  const [addingJournalEntry, setAddingJournalEntry] = useState(false)
  const [newJournalPlace, setNewJournalPlace] = useState('')
  const [newJournalMoods, setNewJournalMoods] = useState<string[]>([])
  const [newJournalNote, setNewJournalNote] = useState('')

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
  const lang4 = store.lang
  // ── Computed ───────────────────────────────────────────────
  const nextChapter = getNextChapter(store.chapters)
  const completedCount = getCompletedCount(store.chapters)
  const totalChapters = store.chapters.length
  const totalWords = store.sessions.reduce((s, sess) => s + sess.wordCount, 0)
  const dayIndex = new Date().getDay()
  const dailyQuotes = DAILY_QUOTES_BY_LANG[lang4] ?? DAILY_QUOTES_BY_LANG.fr
  const quote = dailyQuotes[dayIndex % dailyQuotes.length]

  // Translated chapter display helper
  const tc = (ch: ReturnType<typeof getNextChapter>) =>
    ch ? getChapterDisplay(ch, lang4) : null
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
  const sessionsThisWeek = store.sessions.filter(s => new Date(s.date) >= weekAgo).length


  const hour = new Date().getHours()
  const greetKey = hour < 18 ? 'morning' : 'evening'
  const greeting = `${t.greetings[greetKey]}, ${store.userName}.`
  const sub = t.subs[new Date().getDate() % t.subs.length]

  const rdvDesc = store.nextRdv
    ? (store.lang === 'fr'
        ? `Prochain entretien : ${new Date(store.nextRdv).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`
        : store.lang === 'tr'
          ? `Sonraki görüşme: ${new Date(store.nextRdv).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}`
          : `Next session: ${new Date(store.nextRdv).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`)
    : (store.lang === 'fr'
        ? 'Planifiez votre prochain entretien avec Memoir'
        : store.lang === 'es'
          ? 'Programe su próxima sesión con Memoir'
          : store.lang === 'tr'
            ? 'Bir sonraki Memoir görüşmenizi planlayın'
            : 'Schedule your next Memoir session')
  const rdvCta = store.nextRdv
    ? (store.lang === 'fr' ? 'Voir' : store.lang === 'es' ? 'Ver' : store.lang === 'tr' ? 'Gör' : 'View')
    : (store.lang === 'fr' ? 'Planifier' : store.lang === 'es' ? 'Planificar' : store.lang === 'tr' ? 'Planla' : 'Schedule')

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
    tr: ['Anamnez: geçmişe düşünsel dönüş', 'Anlatı yayı: hayatınızın yapısı', 'Yazar sesi: size özgü üslup', 'Kronoloji kırılması: zamanın düzeni dışına çıkmak', 'Epifani: aydınlanma anı'],
  }
  const TIPS_ITEMS = {
    fr: ["Commencez par un souvenir précis : une image, une odeur", "Écrivez vite lors d'une session - corrigez après", "Utilisez la règle des 5 sens pour ancrer le lecteur", "Le dialogue intérieur humanise votre récit", "Pas de perfection : l'authenticité prime sur le style"],
    en: ['Start with a precise memory: an image, a smell', 'Write fast during a session - edit later', 'Use the 5 senses rule to ground the reader', 'Inner dialogue humanizes your narrative', 'No perfection: authenticity beats style'],
    es: ['Empieza con un recuerdo preciso: una imagen, un olor', 'Escribe rápido en sesión - corrige después', 'Usa la regla de los 5 sentidos para anclar al lector', 'El diálogo interior humaniza tu relato', 'Sin perfección: la autenticidad prima sobre el estilo'],
    tr: ['Kesin bir anıyla başlayın: bir görüntü, bir koku', 'Seans sırasında hızlı yazın — sonra düzeltin', 'Okuyucuyu bağlamak için 5 duyuyu kullanın', 'İç diyalog anlatınızı insanileştirir', 'Mükemmellik değil: özgünlük üslubu geçer'],
  }
  const QUESTIONS_ITEMS = {
    fr: ["Qui étais-je vraiment à cette époque ?", "Qu'est-ce que j'aurais voulu dire à cette personne ?", "Quel était mon secret le mieux gardé ?", "Qu'est-ce que cette épreuve m'a appris sur moi ?", "Quelle scène je n'oublierai jamais ?"],
    en: ["Who was I really at that time?", "What did I wish I had said to that person?", "What was my best-kept secret?", "What did this trial teach me about myself?", "What scene will I never forget?"],
    es: ["¿Quién era yo realmente en esa época?", "¿Qué hubiera querido decirle a esa persona?", "¿Cuál era mi secreto mejor guardado?", "¿Qué me enseñó esa prueba sobre mí mismo/a?", "¿Qué escena nunca olvidaré?"],
    tr: ["O dönemde gerçekten kim bendim?", "O kişiye ne söylemiş olmayı isterdim?", "En iyi sakladığım sır neydi?", "Bu sınav bana kendim hakkında ne öğretti?", "Hiç unutamayacağım sahne hangisi?"],
  }

  const RESOURCES = [
    { id: 'glossary',   title: t.resources.glossary,  icon: '◈', desc: t.resources.glossaryDesc,  items: GLOSSARY_ITEMS[lang4] },
    { id: 'editorial',  title: t.resources.editorial, icon: '◎', desc: t.resources.editorialDesc, items: store.chapters.map((ch) => { const d = getChapterDisplay(ch, lang4); return `${ch.number}. ${d.title} - ${d.subtitle}` }) },
    { id: 'tips',       title: t.resources.tips,      icon: '✦', desc: t.resources.tipsDesc,       items: TIPS_ITEMS[lang4] },
    { id: 'questions',  title: t.resources.questions, icon: '?', desc: t.resources.questionsDesc,  items: QUESTIONS_ITEMS[lang4] },
    { id: 'characters', title: store.lang === 'fr' ? 'Personnages' : store.lang === 'es' ? 'Personajes' : store.lang === 'tr' ? 'Karakterler' : 'Characters', icon: '◎', desc: store.lang === 'fr' ? 'Les personnes de votre histoire' : store.lang === 'es' ? 'Las personas de tu historia' : store.lang === 'tr' ? 'Hikayenizdeki kişiler' : 'The people in your story', items: [] },
    { id: 'timeline', title: store.lang === 'fr' ? 'Chronologie' : store.lang === 'es' ? 'Cronología' : store.lang === 'tr' ? 'Kronoloji' : 'Timeline', icon: '◷', desc: store.lang === 'fr' ? 'Les dates et événements de votre vie' : store.lang === 'es' ? 'Las fechas y eventos de tu vida' : store.lang === 'tr' ? 'Hayatınızın tarihleri ve olayları' : 'The dates and events of your life', items: [] },
    { id: 'notes', title: store.lang === 'fr' ? 'À faire' : store.lang === 'es' ? 'Por hacer' : store.lang === 'tr' ? 'Yapılacaklar' : 'To-do', icon: '✎', desc: store.lang === 'fr' ? 'Recherches, vérifications, questions' : store.lang === 'es' ? 'Investigaciones, verificaciones, preguntas' : store.lang === 'tr' ? 'Araştırmalar, kontroller, sorular' : 'Research, checks, questions', items: [] },
    { id: 'agenda', title: store.lang === 'fr' ? 'Journal' : store.lang === 'es' ? 'Diario' : store.lang === 'tr' ? 'Günlük' : 'Journal', icon: '◷', desc: store.lang === 'fr' ? 'Vos séances et émotions d\'écriture' : store.lang === 'es' ? 'Sus sesiones y emociones de escritura' : store.lang === 'tr' ? 'Yazma seanslarınız ve duygularınız' : 'Your writing sessions and emotions', items: [] },
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
    // ── Bilan stats ──
    const totalWordsEstimated = store.sessions.reduce((s, sess) => s + sess.wordCount, 0)

    // Most frequent writing day
    const dayCounts: Record<number, number> = {}
    store.sessions.forEach(s => {
      const dow = new Date(s.date).getDay()
      dayCounts[dow] = (dayCounts[dow] || 0) + 1
    })
    const bestDow = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]
    const DAY_NAMES = store.lang === 'fr' ? ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'] :
                     store.lang === 'es' ? ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'] :
                     store.lang === 'tr' ? ['pazar','pazartesi','salı','çarşamba','perşembe','cuma','cumartesi'] :
                     ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    const bestDayName = bestDow ? DAY_NAMES[parseInt(bestDow[0])] : null

    return (
      <div className={`flex flex-col h-full gap-3 transition-opacity duration-500 ${isNew ? 'opacity-40' : 'opacity-100'}`}>
        {/* 4 stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#FAF8F4] rounded-xl px-3 py-2.5 border border-[#EDE4D8]">
            <p className="text-[9px] text-[#9C8E80] mb-0.5 uppercase tracking-wide">
              {store.lang === 'fr' ? 'Séances' : store.lang === 'es' ? 'Sesiones' : store.lang === 'tr' ? 'Seanslar' : 'Sessions'}
            </p>
            <p className="font-display text-xl font-light italic text-[#C4622A]">{store.sessions.length}</p>
          </div>
          <div className="bg-[#FAF8F4] rounded-xl px-3 py-2.5 border border-[#EDE4D8]">
            <p className="text-[9px] text-[#9C8E80] mb-0.5 uppercase tracking-wide">
              {store.lang === 'fr' ? 'Mots écrits' : store.lang === 'es' ? 'Palabras' : store.lang === 'tr' ? 'Kelimeler' : 'Words'}
            </p>
            <p className="font-display text-xl font-light italic text-[#1C1C2E]">{totalWordsEstimated.toLocaleString()}</p>
          </div>
          <div className="bg-[#FAF8F4] rounded-xl px-3 py-2.5 border border-[#EDE4D8]">
            <p className="text-[9px] text-[#9C8E80] mb-0.5 uppercase tracking-wide">
              {store.lang === 'fr' ? 'Chapitres' : store.lang === 'es' ? 'Capítulos' : store.lang === 'tr' ? 'Bölümler' : 'Chapters'}
            </p>
            <p className="font-display text-xl font-light italic text-[#1C1C2E]">{completedCount}/{totalChapters}</p>
          </div>
          <div className="bg-[#FAF8F4] rounded-xl px-3 py-2.5 border border-[#EDE4D8]">
            <p className="text-[9px] text-[#9C8E80] mb-0.5 uppercase tracking-wide">
              {store.lang === 'fr' ? 'Série' : store.lang === 'es' ? 'Racha' : store.lang === 'tr' ? 'Seri' : 'Streak'}
            </p>
            <p className="font-display text-xl font-light italic text-[#C4622A]">
              {store.currentStreak}{store.lang === 'fr' ? 'j' : store.lang === 'tr' ? 'g' : 'd'}
            </p>
          </div>
        </div>

        {/* Bienveillant message */}
        {bestDayName && store.sessions.length > 0 && (
          <p className="text-[9px] text-[#9C8E80] italic leading-snug">
            {store.lang === 'fr' ? `Tu écris habituellement le ${bestDayName}.` :
             store.lang === 'es' ? `Sueles escribir el ${bestDayName}.` :
             store.lang === 'tr' ? `Genellikle ${bestDayName} yazıyorsunuz.` :
             `You usually write on ${bestDayName}s.`}
          </p>
        )}

        {/* Planifier CTA */}
        <button
          onClick={() => { const next = store.chapters.find(c => c.status !== 'done'); if (next) router.push(`/write/${next.id}`) }}
          className="w-full text-xs py-2 rounded-xl bg-[#C4622A]/10 text-[#C4622A] font-medium hover:bg-[#C4622A]/20 transition-all"
        >
          {store.lang === 'fr' ? '+ Écrire maintenant' : store.lang === 'es' ? '+ Escribir ahora' : store.lang === 'tr' ? '+ Şimdi Yaz' : '+ Write now'}
        </button>
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
            {new Date().getFullYear()} · {completedCount}/{totalChapters} {store.lang === 'fr' ? 'chapitres' : store.lang === 'tr' ? 'bölümler' : 'chapters'}
          </p>
        </div>
        <div className="flex-1 space-y-0.5 overflow-hidden">
          {store.chapters.slice(0, 6).map(ch => {
            const d = getChapterDisplay(ch, lang4)
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
        <button
          onClick={() => setTrameOpen(true)}
          className="w-full text-xs py-2 mt-2 rounded-lg bg-[#C4622A]/10 text-[#C4622A] font-medium hover:bg-[#C4622A]/20 transition-all"
        >
          {store.lang === 'fr' ? 'Ouvrir l\'Atelier →' : store.lang === 'es' ? 'Abrir el Taller →' : store.lang === 'tr' ? 'Atölyeyi aç →' : 'Open Workshop →'}
        </button>
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
          onClick={() => setTrameOpen(true)}
          className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#F5EFE0] transition-all text-left border border-dashed border-[#C4B9A8]"
        >
          <span className="text-[#C4622A] text-sm flex-shrink-0 mt-0.5">+</span>
          <div>
            <p className="text-xs font-medium text-[#1C1C2E]">
              {store.lang === 'fr' ? 'Importer mes notes' : store.lang === 'es' ? 'Importar mis notas' : store.lang === 'tr' ? 'Notlarımı içe aktar' : 'Import my notes'}
            </p>
            <p className="text-[10px] text-[#9C8E80] leading-tight">
              {store.lang === 'fr' ? 'Textes, brouillons, journaux' : store.lang === 'es' ? 'Textos, borradores, diarios' : store.lang === 'tr' ? 'Metinler, taslaklar, günlükler' : 'Texts, drafts, journals'}
            </p>
          </div>
        </button>
        {RESOURCES.map((r, i) => {
          const isLocked = (r as { locked?: boolean }).locked
          return (
            <button
              key={i}
              onClick={() => { if (!isLocked) { setActiveResource(i); expand('resources') } }}
              className={`flex items-start gap-2 p-2 rounded-lg transition-all text-left ${isLocked ? 'opacity-40 cursor-default' : 'hover:bg-[#F5EFE0]'}`}
            >
              <span className="text-[#C4622A] text-sm flex-shrink-0 mt-0.5">{isLocked ? '🔒' : r.icon}</span>
              <div>
                <p className="text-xs font-medium text-[#1C1C2E]">{r.title}</p>
                <p className="text-[10px] text-[#9C8E80] leading-tight">{isLocked ? (store.lang === 'fr' ? 'Disponible à partir de Plum' : 'Available from Plum') : r.desc}</p>
              </div>
            </button>
          )
        })}
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
            { label: store.lang === 'fr' ? 'Séances écrites' : store.lang === 'es' ? 'Sesiones' : store.lang === 'tr' ? 'Seanslar' : 'Sessions', value: store.sessions.length.toString() },
            { label: store.lang === 'fr' ? 'Chapitres' : store.lang === 'tr' ? 'Bölümler' : 'Chapters', value: `${completedCount}/${totalChapters}` },
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

        {/* ── Objectifs de séance ── */}
        <div className="bg-white rounded-2xl border border-[#EDE4D8] p-5">
          <p className="text-sm font-medium text-[#1C1C2E] mb-4">
            {store.lang === 'fr' ? 'Objectifs de régularité' : store.lang === 'es' ? 'Objetivos de regularidad' : 'Consistency goals'}
          </p>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-[#9C8E80] mb-2">
                {store.lang === 'fr' ? 'Séances / semaine' : store.lang === 'es' ? 'Sesiones / semana' : 'Sessions / week'}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 7].map(n => (
                  <button
                    key={n}
                    onClick={() => store.setSessionGoals({ sessionsPerWeek: store.sessionGoals?.sessionsPerWeek === n ? 0 : n })}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${store.sessionGoals?.sessionsPerWeek === n ? 'bg-[#C4622A] text-white' : 'bg-[#FAF8F4] border border-[#EDE4D8] text-[#7A4F32] hover:border-[#C4622A]/40'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-[#9C8E80] mb-2">
                {store.lang === 'fr' ? 'Mots / séance' : store.lang === 'es' ? 'Palabras / sesión' : 'Words / session'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[100, 200, 300, 500].map(n => (
                  <button
                    key={n}
                    onClick={() => store.setSessionGoals({ wordsPerSession: store.sessionGoals?.wordsPerSession === n ? 0 : n })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${store.sessionGoals?.wordsPerSession === n ? 'bg-[#C4622A] text-white' : 'bg-[#FAF8F4] border border-[#EDE4D8] text-[#7A4F32] hover:border-[#C4622A]/40'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Progress bars */}
          {((store.sessionGoals?.sessionsPerWeek ?? 0) > 0 || (store.sessionGoals?.wordsPerSession ?? 0) > 0) && (
            <div className="mt-4 pt-4 border-t border-[#EDE4D8] space-y-3">
              {(store.sessionGoals?.sessionsPerWeek ?? 0) > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-[#7A4F32]">
                      {store.lang === 'fr' ? 'Cette semaine' : store.lang === 'es' ? 'Esta semana' : 'This week'}
                    </p>
                    <p className="text-xs text-[#9C8E80]">
                      {sessionsThisWeek} / {store.sessionGoals!.sessionsPerWeek} {store.lang === 'fr' ? 'séances' : store.lang === 'es' ? 'sesiones' : 'sessions'}
                    </p>
                  </div>
                  <div className="h-1.5 bg-[#EDE4D8] rounded-full overflow-hidden">
                    <div className="h-full bg-[#C4622A] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (sessionsThisWeek / store.sessionGoals!.sessionsPerWeek) * 100)}%` }} />
                  </div>
                  {sessionsThisWeek >= (store.sessionGoals?.sessionsPerWeek ?? 0) && (
                    <p className="text-[10px] text-[#C4622A] mt-1">
                      {store.lang === 'fr' ? 'Objectif atteint !' : store.lang === 'es' ? '¡Objetivo logrado!' : 'Goal reached!'}
                    </p>
                  )}
                </div>
              )}
              {(store.sessionGoals?.wordsPerSession ?? 0) > 0 && store.sessions.length > 0 && (() => {
                const lastSession = [...store.sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                const pct = Math.min(100, (lastSession.wordCount / store.sessionGoals!.wordsPerSession) * 100)
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-[#7A4F32]">
                        {store.lang === 'fr' ? 'Dernière séance' : store.lang === 'es' ? 'Última sesión' : 'Last session'}
                      </p>
                      <p className="text-xs text-[#9C8E80]">
                        {lastSession.wordCount} / {store.sessionGoals!.wordsPerSession} {store.lang === 'fr' ? 'mots' : store.lang === 'es' ? 'pal.' : 'words'}
                      </p>
                    </div>
                    <div className="h-1.5 bg-[#EDE4D8] rounded-full overflow-hidden">
                      <div className="h-full bg-[#7A4F32] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
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
              {store.lang === 'fr' ? "Esquisser ma trame avec l'IA" : store.lang === 'es' ? 'Esbozar mi trama con la IA' : store.lang === 'tr' ? 'YZ ile hikayemi taslakla' : 'Outline my story with AI'}
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
              const d = getChapterDisplay(ch, lang4)
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
                const d = getChapterDisplay(ch, lang4)
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

    const RELATION_OPTS = lang === 'fr'
      ? ['Parent', 'Ami(e)', 'Amour', 'Mentor', 'Enfant', 'Frère/Sœur', 'Collègue', 'Autre']
      : lang === 'es'
        ? ['Padre/Madre', 'Amigo/a', 'Amor', 'Mentor/a', 'Hijo/a', 'Hermano/a', 'Colega', 'Otro']
        : lang === 'tr'
          ? ['Ebeveyn', 'Arkadaş', 'Sevgili', 'Mentor', 'Çocuk', 'Kardeş', 'İş arkadaşı', 'Diğer']
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
          {RESOURCES.map((r, i) => {
            const isLocked = (r as { locked?: boolean }).locked
            return (
              <button key={i} onClick={() => { if (!isLocked) setActiveResource(i) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                  activeResource === i ? 'bg-[#1C1C2E] text-white' :
                  isLocked ? 'bg-[#F5EFE0] border border-[#EDE4D8] text-[#C4B9A8] opacity-50 cursor-default' :
                  'bg-white border border-[#EDE4D8] text-[#7A4F32] hover:bg-[#F5EFE0]'
                }`}>
                <span>{isLocked ? '🔒' : r.icon}</span>{r.title}
              </button>
            )
          })}
        </div>

        {/* ── Characters tab ── */}
        {active.id === 'characters' ? (
          <div className="space-y-4">
            {/* Archiviste scan button — Plume & Gutenberg only */}
            {(store.plan === 'plum' || store.plan === 'gutenberg') ? (
              store.sessions.length > 0 ? (
                <button
                  onClick={() => setScannerOpen('characters')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#1C1C2E] text-white rounded-2xl hover:bg-[#2e2e45] transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#C4622A] text-sm">✦</span>
                    <span className="text-sm">
                      {lang === 'fr' ? 'Analyser mes textes' : 'Analyze my texts'}
                    </span>
                    {store.plan === 'gutenberg' && (
                      <span className="text-[9px] uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                        Gutenberg
                      </span>
                    )}
                  </div>
                  <span className="text-[#9C8E80] text-xs group-hover:text-white transition-colors">
                    {store.sessions.length} {lang === 'fr' ? 'séances' : 'sessions'}
                  </span>
                </button>
              ) : (
                <p className="text-xs text-[#9C8E80] italic text-center py-2">
                  {lang === 'fr' ? 'Quelques séances sont requises pour activer cette fonction.' : 'Write a few sessions to enable analysis.'}
                </p>
              )
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-[#F5EFE0] rounded-2xl border border-[#EDE4D8]">
                <span className="text-[#9C8E80] text-sm">🔒</span>
                <p className="text-xs text-[#9C8E80]">
                  {lang === 'fr' ? 'Analyse automatique disponible à partir de Plum.' : 'Auto-analysis available from Plum.'}
                </p>
              </div>
            )}
            {/* View toggle */}
            {store.characters.length > 0 && (
              <div className="flex gap-2 mb-2">
                <button onClick={() => setCharView('list')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${charView === 'list' ? 'bg-[#1C1C2E] text-white border-[#1C1C2E]' : 'border-[#EDE4D8] text-[#7A4F32] hover:bg-[#F5EFE0]'}`}>
                  {lang === 'fr' ? '≡ Liste' : lang === 'es' ? '≡ Lista' : lang === 'tr' ? '≡ Liste' : '≡ List'}
                </button>
                <button onClick={() => setCharView('tree')}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${charView === 'tree' ? 'bg-[#1C1C2E] text-white border-[#1C1C2E]' : 'border-[#EDE4D8] text-[#7A4F32] hover:bg-[#F5EFE0]'}`}>
                  {lang === 'fr' ? '⬡ Arbre' : lang === 'es' ? '⬡ Árbol' : lang === 'tr' ? '⬡ Ağaç' : '⬡ Tree'}
                </button>
              </div>
            )}

            {/* Tree view */}
            {charView === 'tree' && store.characters.length > 0 && (() => {
              const ANCESTORS = lang === 'fr' ? ['Parent', 'Frère/Sœur'] : lang === 'es' ? ['Padre/Madre', 'Hermano/a'] : lang === 'tr' ? ['Ebeveyn', 'Kardeş'] : ['Parent', 'Sibling']
              const PEERS = lang === 'fr' ? ['Ami(e)', 'Amour', 'Mentor', 'Collègue'] : lang === 'es' ? ['Amigo/a', 'Amor', 'Mentor/a', 'Colega'] : lang === 'tr' ? ['Arkadaş', 'Sevgili', 'Mentor', 'İş arkadaşı'] : ['Friend', 'Love', 'Mentor', 'Colleague']
              const DESCENDANTS = lang === 'fr' ? ['Enfant'] : lang === 'es' ? ['Hijo/a'] : lang === 'tr' ? ['Çocuk'] : ['Child']
              const ancestors = store.characters.filter(c => ANCESTORS.includes(c.relation))
              const peers = store.characters.filter(c => PEERS.includes(c.relation))
              const descendants = store.characters.filter(c => DESCENDANTS.includes(c.relation))
              const others = store.characters.filter(c => !ANCESTORS.includes(c.relation) && !PEERS.includes(c.relation) && !DESCENDANTS.includes(c.relation))

              function TreeNode({ ch }: { ch: typeof store.characters[0] }) {
                return (
                  <button
                    onClick={() => router.push(`/write/${writeTarget}?inspiration=${encodeURIComponent(lang === 'fr' ? `Parlez-moi de  - comment cette personne est-elle entrée dans votre vie ?` : lang === 'es' ? `Háblame de  - ¿cómo entró esta persona en tu vida?` : lang === 'tr' ? ` hakkında anlatın - bu kişi hayatınıza nasıl girdi?` : `Tell me about  - how did this person enter your life?`)}`)}
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
                  <p className="text-[10px] text-[#9C8E80] text-center mt-4">{lang === 'fr' ? 'Cliquez sur un personnage pour écrire à son sujet' : lang === 'es' ? 'Haz clic en un personaje para escribir sobre él' : lang === 'tr' ? 'Bir karakter hakkında yazmak için tıklayın' : 'Click a character to write about them'}</p>
                </div>
              )
            })()}

            {/* Existing characters */}
            {store.characters.length === 0 && !addingChar && (
              <div className="bg-white rounded-2xl border border-[#EDE4D8] p-8 text-center">
                <p className="text-[#9C8E80] text-sm mb-1">
                  {lang === 'fr' ? 'Aucun personnage encore.' : lang === 'es' ? 'Ningún personaje todavía.' : lang === 'tr' ? 'Henüz karakter yok.' : 'No characters yet.'}
                </p>
                <p className="text-[#C4B9A8] text-xs">
                  {lang === 'fr' ? 'Ajoutez les personnes importantes de votre récit.' : lang === 'es' ? 'Añade las personas importantes de tu relato.' : lang === 'tr' ? 'Hikayenizdeki önemli kişileri ekleyin.' : 'Add the important people in your story.'}
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
                    {ch.aliases && ch.aliases.length > 0 && (
                      <p className="text-[10px] text-[#9C8E80] mt-0.5">
                        {lang === 'fr' ? 'aussi appelé·e' : 'also known as'}{' '}
                        <span className="italic">{ch.aliases.join(', ')}</span>
                      </p>
                    )}
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
                      onClick={() => router.push(`/write/${writeTarget}?inspiration=${encodeURIComponent(lang === 'fr' ? `Parlez-moi de  - comment cette personne est-elle entrée dans votre vie ?` : lang === 'es' ? `Háblame de  - ¿cómo entró esta persona en tu vida?` : lang === 'tr' ? ` hakkında anlatın - bu kişi hayatınıza nasıl girdi?` : `Tell me about  - how did this person enter your life?`)}`)}
                      className="text-xs text-[#C4622A] bg-[#C4622A]/10 hover:bg-[#C4622A]/20 px-3 py-1.5 rounded-xl transition-all"
                    >
                      {lang === 'fr' ? 'Écrire →' : lang === 'es' ? 'Escribir →' : lang === 'tr' ? 'Yaz →' : 'Write →'}
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
                      {lang === 'fr' ? 'Période' : lang === 'es' ? 'Período' : lang === 'tr' ? 'Dönem' : 'Period'}
                    </p>
                    <input
                      type="text"
                      value={ch.period ?? ''}
                      onChange={e => store.updateCharacter(ch.id, { period: e.target.value })}
                      placeholder={lang === 'fr' ? 'ex : Actuel, 1975-1985, Amour de jeunesse, Décédé 2010…' : lang === 'es' ? 'ej: Actual, 1975-1985, Fallecido 2010…' : lang === 'tr' ? 'ör: Şimdiki, 1975-1985, Gençlik aşkı, Vefat 2010…' : 'e.g. Current, 1975-1985, Childhood, Deceased 2010…'}
                      className="w-full text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-3 py-2 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 transition-colors mb-3"
                    />
                    <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase mb-1">
                      {lang === 'fr' ? 'Notes' : lang === 'es' ? 'Notas' : lang === 'tr' ? 'Notlar' : 'Notes'}
                    </p>
                    <textarea
                      value={ch.notes}
                      onChange={e => store.updateCharacter(ch.id, { notes: e.target.value })}
                      placeholder={lang === 'fr' ? 'Notes sur ce personnage…' : lang === 'es' ? 'Notas sobre este personaje…' : lang === 'tr' ? 'Bu karakter hakkında notlar…' : 'Notes about this character…'}
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
                      <div className="flex gap-2 items-center ml-2">
                        {store.characters.length > 1 && (
                          <button
                            onClick={() => { setMergeSourceId(ch.id); setMergeTargetId(null) }}
                            className="text-xs text-[#9C8E80] hover:text-[#C4622A] transition-colors"
                          >
                            {lang === 'fr' ? 'Fusionner' : 'Merge'}
                          </button>
                        )}
                        <button onClick={() => store.removeCharacter(ch.id)}
                          className="text-xs text-red-300 hover:text-red-500 transition-colors">
                          {lang === 'fr' ? 'Suppr.' : lang === 'tr' ? 'Sil' : 'Del.'}
                        </button>
                      </div>
                    </div>
                    {/* Merge picker — inline, appears only for this card */}
                    {mergeSourceId === ch.id && (
                      <div className="mt-3 p-3 bg-[#FDF9F4] rounded-xl border border-[#C4622A]/20">
                        <p className="text-xs text-[#7A4F32] mb-2">
                          {lang === 'fr' ? `Fusionner « ${ch.name} » avec :` : `Merge "${ch.name}" with:`}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {store.characters.filter(c => c.id !== ch.id).map(other => (
                            <button
                              key={other.id}
                              onClick={() => setMergeTargetId(other.id)}
                              className={`text-left text-xs px-3 py-2 rounded-lg border transition-all ${mergeTargetId === other.id ? 'bg-[#C4622A] text-white border-[#C4622A]' : 'border-[#EDE4D8] text-[#1C1C2E] hover:border-[#C4622A]/40'}`}
                            >
                              {other.name} <span className="opacity-60">· {other.relation}</span>
                            </button>
                          ))}
                        </div>
                        {mergeTargetId && (() => {
                          const other = store.characters.find(c => c.id === mergeTargetId)!
                          return (
                            <div className="mt-3 border-t border-[#EDE4D8] pt-3">
                              <p className="text-xs text-[#7A4F32] mb-2">
                                {lang === 'fr' ? 'Quel nom garder ?' : 'Which name to keep?'}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { store.mergeCharacters(ch.id, mergeTargetId, ch.name); setMergeSourceId(null); setMergeTargetId(null); setExpandedChar(null) }}
                                  className="flex-1 text-xs py-2 rounded-lg bg-[#1C1C2E] text-white hover:bg-[#2a2a40] transition-colors"
                                >
                                  {ch.name}
                                </button>
                                <button
                                  onClick={() => { store.mergeCharacters(mergeTargetId, ch.id, other.name); setMergeSourceId(null); setMergeTargetId(null); setExpandedChar(null) }}
                                  className="flex-1 text-xs py-2 rounded-lg bg-[#1C1C2E] text-white hover:bg-[#2a2a40] transition-colors"
                                >
                                  {other.name}
                                </button>
                              </div>
                              <button
                                onClick={() => { setMergeSourceId(null); setMergeTargetId(null) }}
                                className="w-full text-xs text-[#9C8E80] mt-2 hover:text-[#1C1C2E] transition-colors"
                              >
                                {lang === 'fr' ? 'Annuler' : 'Cancel'}
                              </button>
                            </div>
                          )
                        })()}
                        {!mergeTargetId && (
                          <button
                            onClick={() => { setMergeSourceId(null); setMergeTargetId(null) }}
                            className="w-full text-xs text-[#9C8E80] mt-2 hover:text-[#1C1C2E] transition-colors"
                          >
                            {lang === 'fr' ? 'Annuler' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    )}
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
                  placeholder={lang === 'fr' ? 'Prénom ou nom…' : lang === 'es' ? 'Nombre…' : lang === 'tr' ? 'Ad veya soyad…' : 'Name…'}
                  className="w-full text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 mb-2"
                />
                <input
                  type="text"
                  value={newCharPeriod}
                  onChange={e => setNewCharPeriod(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChar(e)}
                  placeholder={lang === 'fr' ? 'Période (ex : Actuel, 1975-1985, Amour de jeunesse)…' : lang === 'es' ? 'Período (ej: Actual, 1975-1985)…' : lang === 'tr' ? 'Dönem (ör: Şimdiki, 1975-1985, Çocukluk arkadaşı)…' : 'Period (e.g. Current, 1975–1985, Childhood friend)…'}
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
                    {lang === 'fr' ? 'Ajouter' : lang === 'es' ? 'Añadir' : lang === 'tr' ? 'Ekle' : 'Add'}
                  </button>
                  <button onClick={() => { setAddingChar(false); setNewCharName(''); setNewCharRelation(''); setNewCharPeriod('') }}
                    className="text-sm text-[#9C8E80] px-4 hover:text-[#1C1C2E] transition-colors">
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : lang === 'tr' ? 'İptal' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingChar(true)}
                className="w-full bg-white border-2 border-dashed border-[#EDE4D8] rounded-2xl py-4 text-sm text-[#9C8E80] hover:border-[#C4622A]/40 hover:text-[#C4622A] transition-all">
                + {lang === 'fr' ? 'Ajouter un personnage' : lang === 'es' ? 'Añadir un personaje' : lang === 'tr' ? 'Karakter ekle' : 'Add a character'}
              </button>
            )}
          </div>
        ) : active.id === 'timeline' ? (

          /* ── Timeline tab ── */
          <div className="space-y-4">
            {/* Archiviste scan button — Plume & Gutenberg only */}
            {(store.plan === 'plum' || store.plan === 'gutenberg') ? (
              store.sessions.length > 0 ? (
                <button
                  onClick={() => setScannerOpen('timeline')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#1C1C2E] text-white rounded-2xl hover:bg-[#2e2e45] transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#C4622A] text-sm">✦</span>
                    <span className="text-sm">
                      {lang === 'fr' ? 'Analyser mes textes' : 'Analyze my texts'}
                    </span>
                  </div>
                  <span className="text-[#9C8E80] text-xs group-hover:text-white transition-colors">
                    {store.sessions.length} {lang === 'fr' ? 'séances' : 'sessions'}
                  </span>
                </button>
              ) : (
                <p className="text-xs text-[#9C8E80] italic text-center py-2">
                  {lang === 'fr' ? 'Quelques séances sont requises pour activer cette fonction.' : 'Write a few sessions to enable analysis.'}
                </p>
              )
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-[#F5EFE0] rounded-2xl border border-[#EDE4D8]">
                <span className="text-[#9C8E80] text-sm">🔒</span>
                <p className="text-xs text-[#9C8E80]">
                  {lang === 'fr' ? 'Analyse automatique disponible à partir de Plum.' : 'Auto-analysis available from Plum.'}
                </p>
              </div>
            )}
            {/* Sorted events */}
            {store.timelineEvents.length === 0 && !addingEvent && (
              <div className="bg-white rounded-2xl border border-[#EDE4D8] p-8 text-center mb-4">
                <p className="text-[#9C8E80] text-sm mb-1">
                  {lang === 'fr' ? 'Aucun événement encore.' : lang === 'es' ? 'Ningún evento todavía.' : lang === 'tr' ? 'Henüz olay yok.' : 'No events yet.'}
                </p>
                <p className="text-[#C4B9A8] text-xs">
                  {lang === 'fr' ? 'Ajoutez les grandes étapes de votre vie.' : lang === 'es' ? 'Añade los grandes momentos de tu vida.' : lang === 'tr' ? 'Hayatınızın büyük dönüm noktalarını ekleyin.' : 'Add the major milestones of your life.'}
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
                              onClick={(e) => { e.stopPropagation(); router.push(`/write/${writeTarget}?inspiration=${encodeURIComponent(lang === 'fr' ? `Racontez-moi ce moment :  ()` : lang === 'es' ? `Cuéntame sobre este momento:  ()` : lang === 'tr' ? `Bu anı anlatın:  ()` : `Tell me about this moment:  ()`)}`) }}
                              className="text-xs text-[#C4622A] bg-[#C4622A]/10 hover:bg-[#C4622A]/20 px-2.5 py-1 rounded-lg transition-all"
                            >
                              {lang === 'fr' ? 'Écrire →' : lang === 'es' ? 'Escribir →' : lang === 'tr' ? 'Yaz →' : 'Write →'}
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
                                placeholder={lang === 'fr' ? 'Titre…' : lang === 'es' ? 'Título…' : lang === 'tr' ? 'Başlık…' : 'Title…'}
                                className="flex-1 text-xs text-[#1C1C2E] bg-[#FAF8F4] rounded-lg px-3 py-2 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                              />
                            </div>
                            <textarea
                              value={ev.description}
                              onChange={e => store.updateTimelineEvent(ev.id, { description: e.target.value })}
                              placeholder={lang === 'fr' ? 'Notes sur cet événement…' : lang === 'es' ? 'Notas sobre este evento…' : lang === 'tr' ? 'Bu olay hakkında notlar…' : 'Notes about this event…'}
                              className="w-full mt-2 text-xs text-[#1C1C2E] bg-[#FAF8F4] rounded-lg px-3 py-2 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 resize-none"
                              rows={2}
                            />
                            <div className="flex justify-end mt-2">
                              <button onClick={() => store.removeTimelineEvent(ev.id)}
                                className="text-xs text-red-300 hover:text-red-500 transition-colors">
                                {lang === 'fr' ? 'Supprimer' : lang === 'es' ? 'Eliminar' : lang === 'tr' ? 'Sil' : 'Delete'}
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
                    placeholder={lang === 'fr' ? 'Date (ex: 1975, Été 82…)' : lang === 'es' ? 'Fecha (ej: 1975, Verano 82…)' : lang === 'tr' ? 'Tarih (ör: 1975, Yaz 82…)' : 'Date (e.g. 1975, Summer 82…)'}
                    className="w-40 text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                  />
                  <input
                    type="text"
                    value={newEvtTitle}
                    onChange={e => setNewEvtTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && newEvtTitle.trim() && (store.addTimelineEvent({ date: newEvtDate, title: newEvtTitle.trim(), description: newEvtDesc }), setNewEvtDate(''), setNewEvtTitle(''), setNewEvtDesc(''), setAddingEvent(false))}
                    placeholder={lang === 'fr' ? 'Événement…' : lang === 'es' ? 'Evento…' : lang === 'tr' ? 'Olay…' : 'Event…'}
                    className="flex-1 text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                  />
                </div>
                <textarea
                  value={newEvtDesc}
                  onChange={e => setNewEvtDesc(e.target.value)}
                  placeholder={lang === 'fr' ? 'Description (optionnel)…' : lang === 'es' ? 'Descripción (opcional)…' : lang === 'tr' ? 'Açıklama (isteğe bağlı)…' : 'Description (optional)…'}
                  className="w-full text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 resize-none mb-3"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (!newEvtTitle.trim()) return; store.addTimelineEvent({ date: newEvtDate, title: newEvtTitle.trim(), description: newEvtDesc }); setNewEvtDate(''); setNewEvtTitle(''); setNewEvtDesc(''); setAddingEvent(false) }}
                    className="flex-1 bg-[#C4622A] text-white text-sm font-medium py-2 rounded-xl hover:opacity-90 transition-all disabled:opacity-40"
                    disabled={!newEvtTitle.trim()}
                  >
                    {lang === 'fr' ? 'Ajouter' : lang === 'es' ? 'Añadir' : lang === 'tr' ? 'Ekle' : 'Add'}
                  </button>
                  <button onClick={() => { setAddingEvent(false); setNewEvtDate(''); setNewEvtTitle(''); setNewEvtDesc('') }}
                    className="text-sm text-[#9C8E80] px-4 hover:text-[#1C1C2E] transition-colors">
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : lang === 'tr' ? 'İptal' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingEvent(true)}
                className="w-full bg-white border-2 border-dashed border-[#EDE4D8] rounded-2xl py-4 text-sm text-[#9C8E80] hover:border-[#C4622A]/40 hover:text-[#C4622A] transition-all">
                + {lang === 'fr' ? 'Ajouter un événement' : lang === 'es' ? 'Añadir un evento' : lang === 'tr' ? 'Olay ekle' : 'Add an event'}
              </button>
            )}
          </div>

        ) : active.id === 'notes' ? (

          /* ── Notes/Research tab ── */
          <div className="space-y-3">
            {/* Note type labels */}
            {(() => {
              const NOTE_TYPES: { id: 'research' | 'verify' | 'ask' | 'idea'; icon: string; label: string }[] = [
                { id: 'research', icon: '🔍', label: lang === 'fr' ? 'Rechercher' : lang === 'es' ? 'Investigar' : lang === 'tr' ? 'Araştır' : 'Research' },
                { id: 'verify', icon: '✓', label: lang === 'fr' ? 'Vérifier' : lang === 'es' ? 'Verificar' : lang === 'tr' ? 'Doğrula' : 'Verify' },
                { id: 'ask', icon: '↗', label: lang === 'fr' ? 'Demander' : lang === 'es' ? 'Preguntar' : lang === 'tr' ? 'Sor' : 'Ask' },
                { id: 'idea', icon: '✦', label: lang === 'fr' ? 'Idée' : lang === 'es' ? 'Idea' : lang === 'tr' ? 'Fikir' : 'Idea' },
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
                          newNoteType === 'research' ? (lang === 'fr' ? 'Rechercher...' : lang === 'tr' ? 'Araştır...' : 'Research...') :
                          newNoteType === 'verify' ? (lang === 'fr' ? 'Vérifier que...' : lang === 'tr' ? 'Şunu doğrula...' : 'Verify that...') :
                          newNoteType === 'ask' ? (lang === 'fr' ? 'Demander à... au sujet de...' : lang === 'tr' ? '... hakkında sor...' : 'Ask... about...') :
                          (lang === 'fr' ? 'Une idée...' : lang === 'tr' ? 'Bir fikir...' : 'An idea...')
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
                      <p className="text-[#9C8E80] text-sm">{lang === 'fr' ? 'Aucune note encore.' : lang === 'es' ? 'Sin notas todavía.' : lang === 'tr' ? 'Henüz not yok.' : 'No notes yet.'}</p>
                      <p className="text-[#C4B9A8] text-xs mt-1">{lang === 'fr' ? 'Ajoutez vos recherches et vérifications.' : lang === 'es' ? 'Añade tus investigaciones y verificaciones.' : lang === 'tr' ? 'Araştırmalarınızı ve kontrollerinizi ekleyin.' : 'Add your research and checks.'}</p>
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
                      <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase mb-2 px-1">{lang === 'fr' ? 'Terminé' : lang === 'es' ? 'Hecho' : lang === 'tr' ? 'Tamamlandı' : 'Done'}</p>
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

        ) : active.id === 'agenda' ? (

          /* ── Agenda / Journal tab ── */
          <div className="space-y-5">

            {/* Journal d'activité */}
            <div className="bg-white rounded-2xl border border-[#EDE4D8] p-5">
              <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-4">
                {lang === 'fr' ? 'Journal d\'activité' : lang === 'es' ? 'Diario de actividad' : lang === 'tr' ? 'Aktivite günlüğü' : 'Activity journal'}
              </p>
              {store.sessions.length === 0 ? (
                <p className="text-sm text-[#9C8E80] text-center py-4">
                  {lang === 'fr' ? 'Aucune séance encore.' : lang === 'es' ? 'Ninguna sesión todavía.' : lang === 'tr' ? 'Henüz seans yok.' : 'No sessions yet.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {[...store.sessions].reverse().slice(0, 10).map((s, idx) => {
                    const d = new Date(s.date)
                    const dateStr = d.toLocaleDateString(
                      lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : lang === 'tr' ? 'tr-TR' : 'en-GB',
                      { weekday: 'short', day: 'numeric', month: 'short' }
                    )
                    const MODES: Record<string, string> = {
                      libre: lang === 'fr' ? 'Libre' : 'Free',
                      guide: lang === 'fr' ? 'Guidé' : 'Guided',
                      dicte: lang === 'fr' ? 'Dictée' : 'Dictation',
                    }
                    return (
                      <div key={`${s.chapterId}-${s.date}-${idx}`} className="flex items-center justify-between px-3 py-2.5 bg-[#FAF8F4] rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-[#C4622A] text-xs">✦</span>
                          <div>
                            <p className="text-xs font-medium text-[#1C1C2E]">{dateStr}</p>
                            <p className="text-[10px] text-[#9C8E80]">{store.chapters.find(c => c.id === s.chapterId)?.number ? `Ch. ${store.chapters.find(c => c.id === s.chapterId)?.number}` : ''}</p>
                          </div>
                        </div>
                        <p className="text-xs text-[#7A4F32] font-medium">{s.wordCount} {lang === 'fr' ? 'mots' : lang === 'es' ? 'palabras' : lang === 'tr' ? 'kelime' : 'words'}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Journal d'émotions — Plume & Gutenberg */}
            {(store.plan === 'plum' || store.plan === 'gutenberg') ? (
              <div className="bg-white rounded-2xl border border-[#EDE4D8] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-[#9C8E80] tracking-widest uppercase">
                    {lang === 'fr' ? 'Journal d\'émotions' : lang === 'es' ? 'Diario emocional' : lang === 'tr' ? 'Duygu günlüğü' : 'Emotion journal'}
                  </p>
                  {!addingJournalEntry && (
                    <button onClick={() => setAddingJournalEntry(true)}
                      className="text-xs text-[#C4622A] hover:opacity-70 transition-opacity">
                      + {lang === 'fr' ? 'Ajouter' : lang === 'es' ? 'Añadir' : lang === 'tr' ? 'Ekle' : 'Add'}
                    </button>
                  )}
                </div>

                {addingJournalEntry && (
                  <div className="mb-4 space-y-3 p-4 bg-[#FAF8F4] rounded-xl border border-[#EDE4D8]">
                    <input
                      type="text"
                      value={newJournalPlace}
                      onChange={e => setNewJournalPlace(e.target.value)}
                      placeholder={lang === 'fr' ? 'Lieu (optionnel)...' : lang === 'es' ? 'Lugar (opcional)...' : lang === 'tr' ? 'Yer (isteğe bağlı)...' : 'Place (optional)...'}
                      className="w-full text-sm text-[#1C1C2E] bg-white rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                    />
                    <div className="flex flex-wrap gap-2">
                      {(lang === 'fr'
                        ? ['Serein', 'Nostalgique', 'Joyeux', 'Mélancolique', 'Inspiré', 'Fatigué', 'Ému', 'Incertain']
                        : lang === 'es'
                          ? ['Sereno', 'Nostálgico', 'Alegre', 'Melancólico', 'Inspirado', 'Cansado', 'Conmovido', 'Incierto']
                          : lang === 'tr'
                            ? ['Sakin', 'Nostaljik', 'Neşeli', 'Melankolik', 'İlhamlı', 'Yorgun', 'Duygulanmış', 'Belirsiz']
                            : ['Serene', 'Nostalgic', 'Joyful', 'Melancholic', 'Inspired', 'Tired', 'Moved', 'Uncertain']
                      ).map(mood => (
                        <button key={mood}
                          onClick={() => setNewJournalMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood])}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            newJournalMoods.includes(mood)
                              ? 'bg-[#1C1C2E] text-white border-[#1C1C2E]'
                              : 'border-[#EDE4D8] text-[#7A4F32] hover:bg-[#F5EFE0]'
                          }`}>
                          {mood}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={newJournalNote}
                      onChange={e => setNewJournalNote(e.target.value)}
                      placeholder={lang === 'fr' ? 'Note libre (optionnel)...' : lang === 'es' ? 'Nota libre (opcional)...' : lang === 'tr' ? 'Serbest not (isteğe bağlı)...' : 'Free note (optional)...'}
                      className="w-full text-sm text-[#1C1C2E] bg-white rounded-xl px-4 py-2.5 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setAddingJournalEntry(false); setNewJournalPlace(''); setNewJournalMoods([]); setNewJournalNote('') }}
                        className="text-xs text-[#9C8E80] px-4 py-2 rounded-xl hover:bg-[#F5EFE0] transition-all">
                        {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : lang === 'tr' ? 'İptal' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => {
                          if (newJournalMoods.length === 0) return
                          store.addWritingJournalEntry({ date: new Date().toISOString(), place: newJournalPlace.trim() || undefined, mood: newJournalMoods, note: newJournalNote.trim() || undefined })
                          setAddingJournalEntry(false); setNewJournalPlace(''); setNewJournalMoods([]); setNewJournalNote('')
                        }}
                        disabled={newJournalMoods.length === 0}
                        className="text-xs bg-[#C4622A] text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all disabled:opacity-30">
                        {lang === 'fr' ? 'Enregistrer' : lang === 'es' ? 'Guardar' : lang === 'tr' ? 'Kaydet' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}

                {store.writingJournal.length === 0 && !addingJournalEntry ? (
                  <p className="text-sm text-[#9C8E80] text-center py-4">
                    {lang === 'fr' ? 'Notez vos humeurs après chaque séance.' : lang === 'es' ? 'Anota tus estados de ánimo después de cada sesión.' : lang === 'tr' ? 'Her seanstan sonra ruh halinizi not edin.' : 'Note your moods after each session.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {[...store.writingJournal].reverse().map(entry => {
                      const d = new Date(entry.date)
                      const dateStr = d.toLocaleDateString(
                        lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : lang === 'tr' ? 'tr-TR' : 'en-GB',
                        { day: 'numeric', month: 'short' }
                      )
                      return (
                        <div key={entry.id} className="flex items-start gap-3 px-3 py-3 bg-[#FAF8F4] rounded-xl">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-[#9C8E80]">{dateStr}</span>
                              {entry.place && <span className="text-[10px] text-[#C4B9A8]">· {entry.place}</span>}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {entry.mood.map(m => (
                                <span key={m} className="text-[10px] bg-[#EDE4D8] text-[#7A4F32] px-2 py-0.5 rounded-full">{m}</span>
                              ))}
                            </div>
                            {entry.note && <p className="text-xs text-[#9C8E80] mt-1 italic">{entry.note}</p>}
                          </div>
                          <button onClick={() => store.removeWritingJournalEntry(entry.id)}
                            className="text-xs text-[#C4B9A8] hover:text-red-400 transition-colors flex-shrink-0">×</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#EDE4D8] p-5 opacity-50">
                <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-2">
                  {lang === 'fr' ? 'Journal d\'émotions' : 'Emotion journal'}
                </p>
                <p className="text-sm text-[#9C8E80]">
                  {lang === 'fr' ? 'Disponible avec Plum et Gutenberg.' : 'Available with Plum and Gutenberg.'}
                </p>
              </div>
            )}
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
        {(['fr', 'en', 'es', 'tr'] as const).map(l => (
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
              className="w-11 h-11 rounded-full bg-[#1C1C2E] flex items-center justify-center flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <span className="text-[#FAF8F4] text-xs font-display font-bold">
                {store.userName[0].toUpperCase()}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* ── Fondations nudge banner ───────────────────────────── */}
      {!store.foundationsComplete && !store.recipient && (
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-2.5 bg-[#C4622A]/10 border-b border-[#C4622A]/20">
          <p className="text-xs text-[#7A4F32] leading-snug">
            {store.lang === 'fr'
              ? '✦ Posez les fondations de votre livre pour des séances plus riches'
              : store.lang === 'es'
              ? '✦ Establece las bases de tu libro para sesiones más ricas'
              : store.lang === 'tr'
              ? '✦ Daha zengin yazı seansları için kitabınızın temellerini atın'
              : '✦ Set your book foundations to enrich your writing sessions'}
          </p>
          <button
            onClick={() => router.push('/setup')}
            className="flex-shrink-0 text-xs font-medium text-[#C4622A] hover:underline"
          >
            {store.lang === 'fr' ? 'Compléter →' : store.lang === 'es' ? 'Completar →' : store.lang === 'tr' ? 'Tamamla →' : 'Complete →'}
          </button>
        </div>
      )}

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
                      {store.lang === 'fr' ? 'Prochaine séance' : store.lang === 'es' ? 'Próxima sesión' : store.lang === 'tr' ? 'Sonraki seans' : 'Next session'}
                    </p>
                    <p className="font-display text-base italic text-[#FAF8F4]">
                      {store.lang === 'fr' ? `Chapitre ${next.number} · ${next.title}` : store.lang === 'tr' ? `Bölüm ${next.number} · ${next.title}` : `Chapter ${next.number} · ${next.title}`}
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


            </div>

            {/* Daily quote — discrete */}
            {(() => {
              const quotes = DAILY_QUOTES_BY_LANG[lang4] ?? DAILY_QUOTES_BY_LANG.fr
              const footerQuote = quotes[(new Date().getDate() + 3) % quotes.length]
              return (
                <div className="text-center px-6 py-4 opacity-50 hover:opacity-80 transition-opacity">
                  <p className="font-display text-sm italic text-[#7A4F32] leading-relaxed">
                    &ldquo;{footerQuote.text}&rdquo;
                  </p>
                  <p className="text-[10px] text-[#9C8E80] mt-1">— {footerQuote.author}</p>
                </div>
              )
            })()}

            {/* Footer links */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 pb-2">
              <button
                onClick={() => router.push('/quotes')}
                className="text-[10px] text-[#C4B9A8]/50 hover:text-[#7A4F32] transition-colors tracking-wide flex items-center gap-1.5"
              >
                <span className="text-[#C4622A]/40">✦</span>
                {store.lang === 'fr' ? 'Citations' : store.lang === 'es' ? 'Citas' : store.lang === 'tr' ? 'Alıntılar' : 'Quotes'}
                {store.savedQuotes?.length > 0 && (
                  <span className="text-[#C4622A]/60">{store.savedQuotes.length}</span>
                )}
              </button>
              <span className="text-[#C4B9A8]/20 text-[10px]">·</span>
              <button
                onClick={() => router.push('/mentions-legales')}
                className="text-[10px] text-[#C4B9A8]/50 hover:text-[#7A4F32] transition-colors tracking-wide"
              >
                {store.lang === 'fr' ? 'Mentions légales' : store.lang === 'es' ? 'Aviso legal' : store.lang === 'tr' ? 'Yasal Uyarı' : 'Legal Notice'}
              </button>
              <span className="text-[#C4B9A8]/20 text-[10px]">·</span>
              <button
                onClick={() => router.push('/privacy')}
                className="text-[10px] text-[#C4B9A8]/50 hover:text-[#7A4F32] transition-colors tracking-wide"
              >
                {store.lang === 'fr' ? 'Confidentialité' : store.lang === 'es' ? 'Privacidad' : store.lang === 'tr' ? 'Gizlilik' : 'Privacy'}
              </button>
              <span className="text-[#C4B9A8]/20 text-[10px]">·</span>
              <button
                onClick={() => router.push('/contact')}
                className="text-[10px] text-[#C4B9A8]/50 hover:text-[#7A4F32] transition-colors tracking-wide"
              >
                {store.lang === 'fr' ? 'Contact' : store.lang === 'es' ? 'Contacto' : store.lang === 'tr' ? 'İletişim' : 'Contact'}
              </button>
            </div>

          </div>
        )}
      </main>

      {/* BookArchitect modal */}
      {showArchitect && <BookArchitect onClose={() => setShowArchitect(false)} />}

      {/* TrameDrawer */}
      <TrameDrawer isOpen={trameOpen} onClose={() => setTrameOpen(false)} />

      {/* ArchivisteScanner — personnages */}
      {scannerOpen === 'characters' && (
        <ArchivisteScanner
          type="characters"
          plan={store.plan}
          onClose={() => setScannerOpen(null)}
        />
      )}

      {/* ArchivisteScanner — chronologie */}
      {scannerOpen === 'timeline' && (
        <ArchivisteScanner
          type="timeline"
          plan={store.plan}
          onClose={() => setScannerOpen(null)}
        />
      )}
    </div>
  )
}
