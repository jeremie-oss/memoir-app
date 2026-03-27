'use client'

import { useRouter } from 'next/navigation'
import { useMemoirStore } from '@/stores/memoir'
import { DAILY_QUOTES_BY_LANG, TRAME_CHAPTERS, getChapterDisplay } from '@/lib/mock/trame-data'

const GRAIN_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

const LABELS = {
  fr: { back: '← Retour', title: 'Citations', saved: 'Mes favoris', all: 'Toutes', chapter: 'Chapitre', empty: 'Aucune citation sauvegardée. Touchez ✦ pour en garder une.' },
  en: { back: '← Back', title: 'Quotes', saved: 'My favourites', all: 'All', chapter: 'Chapter', empty: 'No saved quotes yet. Tap ✦ to keep one.' },
  es: { back: '← Volver', title: 'Citas', saved: 'Mis favoritos', all: 'Todas', chapter: 'Capítulo', empty: 'Sin citas guardadas. Toca ✦ para guardar una.' },
}

export default function QuotesPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const lang = store.lang
  const L = LABELS[lang]

  const dailyQuotes = DAILY_QUOTES_BY_LANG[lang] ?? DAILY_QUOTES_BY_LANG.fr
  const chapterQuotes = TRAME_CHAPTERS.map((ch) => {
    const d = getChapterDisplay(ch, lang)
    return { text: d.quote, author: d.quoteAuthor, label: `${L.chapter} ${ch.number} · ${d.title}` }
  })

  const allQuotes = [
    ...dailyQuotes.map((q) => ({ text: q.text, author: q.author, label: null })),
    ...chapterQuotes,
  ]

  const saved = store.savedQuotes

  // Saved first, then rest
  const savedQuotes = allQuotes.filter((q) => saved.includes(q.text))
  const otherQuotes = allQuotes.filter((q) => !saved.includes(q.text))

  return (
    <div className="min-h-screen bg-[#1C1C2E] relative" style={{ background: '#1C1C2E' }}>
      <div className="pointer-events-none fixed inset-0 opacity-[0.04]" style={GRAIN_STYLE} />
      <div className="absolute w-72 h-72 rounded-full bg-[#C4622A] opacity-[0.04] blur-3xl top-1/3 left-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-2xl mx-auto px-6 py-12 relative z-10">
        <button
          onClick={() => router.back()}
          className="text-xs text-[#9C8E80]/60 hover:text-[#9C8E80] transition-colors mb-10 block"
        >
          {L.back}
        </button>

        <div className="flex items-center gap-3 mb-10">
          <span className="text-[#C4622A]">✦</span>
          <h1 className="font-display text-3xl italic text-[#FAF8F4]">{L.title}</h1>
          {saved.length > 0 && (
            <span className="ml-auto text-[9px] text-[#C4622A] tracking-widest uppercase font-medium">
              {saved.length} {L.saved.toLowerCase()}
            </span>
          )}
        </div>

        {/* Saved section */}
        {savedQuotes.length > 0 && (
          <div className="mb-10">
            <p className="text-[9px] text-[#C4622A] tracking-widest uppercase mb-4">{L.saved}</p>
            <div className="space-y-3">
              {savedQuotes.map((q, i) => (
                <QuoteCard
                  key={`saved-${i}`}
                  text={q.text}
                  author={q.author}
                  label={q.label}
                  saved
                  onToggle={() => store.toggleSavedQuote(q.text)}
                />
              ))}
            </div>
            <div className="mt-8 mb-2 h-px bg-[#FAF8F4]/5" />
          </div>
        )}

        {/* All quotes */}
        <div>
          {savedQuotes.length > 0 && (
            <p className="text-[9px] text-[#9C8E80]/50 tracking-widest uppercase mb-4">{L.all}</p>
          )}
          <div className="space-y-3">
            {otherQuotes.map((q, i) => (
              <QuoteCard
                key={`all-${i}`}
                text={q.text}
                author={q.author}
                label={q.label}
                saved={false}
                onToggle={() => store.toggleSavedQuote(q.text)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function QuoteCard({
  text,
  author,
  label,
  saved,
  onToggle,
}: {
  text: string
  author: string
  label: string | null
  saved: boolean
  onToggle: () => void
}) {
  return (
    <div className={`group flex gap-4 px-5 py-4 rounded-2xl border transition-all ${
      saved
        ? 'bg-[#C4622A]/10 border-[#C4622A]/30'
        : 'bg-[#FAF8F4]/4 border-[#FAF8F4]/6 hover:border-[#FAF8F4]/12'
    }`}>
      <div className="flex-1 min-w-0">
        {label && (
          <p className="text-[9px] text-[#7A4F32] tracking-widest uppercase mb-1.5">{label}</p>
        )}
        <blockquote className="font-display text-base italic text-[#FAF8F4]/80 leading-relaxed mb-2">
          &ldquo;{text}&rdquo;
        </blockquote>
        <p className="text-[10px] text-[#9C8E80]/60">— {author}</p>
      </div>
      <button
        onClick={onToggle}
        className={`shrink-0 self-start mt-1 text-base transition-all ${
          saved ? 'text-[#C4622A]' : 'text-[#FAF8F4]/20 hover:text-[#C4622A]/60'
        }`}
        aria-label={saved ? 'Retirer' : 'Sauvegarder'}
      >
        ✦
      </button>
    </div>
  )
}
