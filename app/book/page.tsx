'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { useMemoirStore, getCompletedCount } from '@/stores/memoir'
import { BookArchitect } from '@/components/BookArchitect'

const PREFACE = {
  fr: {
    '0': "Votre préface naîtra au fil de vos chapitres. Elle sera le reflet de votre chemin, l'entrée en matière de votre livre. Elle s'écrit avec vous, pas avant vous.",
    '1-2': "Vous avez commencé. Ce n'est pas rien. Les premiers mots sont les plus courageux : ils font exister ce qui n'existait pas encore. Ce livre est en train de devenir réel.",
    '3-4': "À mi-chemin, quelque chose de rare se passe : une histoire prend corps. Les thèmes émergent, les voix se précisent. Ce qui était épars devient cohérent. Vous êtes en train d'écrire quelque chose qui durera.",
    '5-6': "Votre livre existe, désormais. Ce que vous avez mis des décennies à vivre, vous l'avez distillé en quelques mois d'écriture. Ce qui suit n'est plus qu'un dernier souffle avant la forme finale.",
    '7': "Ce livre est complet. Il porte en lui tout ce que vous avez vécu, aimé, traversé, construit. Il est prêt à être imprimé, relié, transmis. Votre histoire a maintenant un corps.",
  },
  en: {
    '0': "Your preface will grow with your chapters. It will reflect your path, the opening of your book. It writes itself with you, not before you.",
    '1-2': "You've started. That's no small thing. The first words are the bravest — they bring into existence what didn't exist before. This book is becoming real.",
    '3-4': "Halfway there, something rare is happening: a story is taking shape. Themes emerge, voices sharpen. What was scattered becomes coherent. You are writing something that will last.",
    '5-6': "Your book now exists. What took decades to live, you've distilled into months of writing. What remains is just one last breath before the final form.",
    '7': "This book is complete. It holds everything you've lived, loved, endured, built. It's ready to be printed, bound, passed on. Your story now has a body.",
  },
  es: {
    '0': "Tu prefacio nacerá a lo largo de tus capítulos. Será el reflejo de tu camino, la entrada de tu libro. Se escribe contigo, no antes que tú.",
    '1-2': "Has empezado. Y no es poca cosa. Las primeras palabras son las más valientes: hacen existir lo que no existía. Este libro está volviéndose real.",
    '3-4': "A mitad del camino, algo raro ocurre: una historia cobra forma. Los temas emergen, las voces se afinan. Lo que estaba disperso se vuelve coherente. Estás escribiendo algo que durará.",
    '5-6': "Tu libro existe ya. Lo que tardaste décadas en vivir, lo has destilado en meses de escritura. Lo que sigue es solo un último aliento antes de la forma final.",
    '7': "Este libro está completo. Lleva en él todo lo que has vivido, amado, atravesado, construido. Está listo para imprimirse, encuadernarse, transmitirse. Tu historia tiene ahora un cuerpo.",
  },
  tr: {
    '0': "Önsözünüz bölümlerinizle birlikte doğacak. Yolculuğunuzun yansıması, kitabınızın girişi olacak. Sizinle birlikte yazılır, sizden önce değil.",
    '1-2': "Başladınız. Bu küçük bir şey değil. İlk kelimeler en cesur olanlardır — daha önce var olmayan bir şeyi var ederler. Bu kitap gerçek olmaya başlıyor.",
    '3-4': "Yarı yolda, nadir bir şey oluyor: bir hikaye şekilleniyor. Temalar beliriyor, sesler netleşiyor. Dağınık olan tutarlı hale geliyor. Kalıcı bir şey yazıyorsunuz.",
    '5-6': "Kitabınız artık var. Yaşamak için onlarca yıl harcadığınız şeyi, aylarca yazarak damıttınız. Geriye kalan son forma giden son bir nefes.",
    '7': "Bu kitap tamamlandı. İçinde yaşadığınız, sevdiğiniz, atlattığınız, inşa ettiğiniz her şeyi taşıyor. Basılmaya, ciltlenmeye, aktarılmaya hazır. Hikayenizin artık bir bedeni var.",
  },
}

const WLBook = {
  fr: {
    cover: 'Couverture',
    titleOf: (name: string) => `L'histoire de ${name}`,
    by: 'par',
    chaptersWritten: (done: number, total: number) => `${done}/${total} chapitres écrits`,
    editTitle: 'Cliquer pour modifier',
    volume: 'Volume',
    words: 'mots',
    aboutPages: (n: number) => `environ ${n} page${n > 1 ? 's' : ''} imprimées`,
    wordsMore: (words: number, tier: string) => `encore ${words.toLocaleString('fr-FR')} mots pour ${tier}`,
    preface: 'Préface',
    writeFirst: 'Écrire le premier chapitre →',
    toc: 'Sommaire',
    excerpts: 'Extraits',
    wordCount: 'mots',
    readMore: 'Lire la suite',
    reduce: 'Réduire',
    readFull: 'Lire et réviser le chapitre complet →',
    index: 'Index',
    indexAuthor: 'Auteur',
    indexPeriod: 'Période',
    indexGenre: 'Genre',
    indexLang: 'Langue',
    exportPdf: 'Exporter en PDF',
    exportSoon: '· bientôt',
    exportComing: '· à venir',
    exportAvailable: 'Disponible une fois votre premier chapitre écrit',
    pdfToast: 'Export PDF · à venir dans la prochaine version',
    yearSuffix: "aujourd'hui",
    memoirsGenre: 'Mémoires',
    langName: 'Français',
  },
  en: {
    cover: 'Cover',
    titleOf: (name: string) => `${name}'s Story`,
    by: 'by',
    chaptersWritten: (done: number, total: number) => `${done}/${total} chapters written`,
    editTitle: 'Click to edit',
    volume: 'Volume',
    words: 'words',
    aboutPages: (n: number) => `about ${n} printed page${n > 1 ? 's' : ''}`,
    wordsMore: (words: number, tier: string) => `${words.toLocaleString('en-US')} more words for ${tier}`,
    preface: 'Preface',
    writeFirst: 'Write the first chapter →',
    toc: 'Table of contents',
    excerpts: 'Excerpts',
    wordCount: 'words',
    readMore: 'Read more',
    reduce: 'Show less',
    readFull: 'Read and revise the full chapter →',
    index: 'Index',
    indexAuthor: 'Author',
    indexPeriod: 'Period',
    indexGenre: 'Genre',
    indexLang: 'Language',
    exportPdf: 'Export as PDF',
    exportSoon: '· soon',
    exportComing: '· coming soon',
    exportAvailable: 'Available once your first chapter is written',
    pdfToast: 'PDF export · coming in the next version',
    yearSuffix: 'today',
    memoirsGenre: 'Memoirs',
    langName: 'English',
  },
  es: {
    cover: 'Portada',
    titleOf: (name: string) => `La historia de ${name}`,
    by: 'por',
    chaptersWritten: (done: number, total: number) => `${done}/${total} capítulos escritos`,
    editTitle: 'Haz clic para editar',
    volume: 'Volumen',
    words: 'palabras',
    aboutPages: (n: number) => `unas ${n} página${n > 1 ? 's' : ''} impresas`,
    wordsMore: (words: number, tier: string) => `${words.toLocaleString('es-ES')} palabras más para ${tier}`,
    preface: 'Prefacio',
    writeFirst: 'Escribir el primer capítulo →',
    toc: 'Índice',
    excerpts: 'Destellos',
    wordCount: 'palabras',
    readMore: 'Leer más',
    reduce: 'Reducir',
    readFull: 'Leer y revisar el capítulo completo →',
    index: 'Índice',
    indexAuthor: 'Autor',
    indexPeriod: 'Período',
    indexGenre: 'Género',
    indexLang: 'Idioma',
    exportPdf: 'Exportar en PDF',
    exportSoon: '· pronto',
    exportComing: '· próximamente',
    exportAvailable: 'Disponible una vez escrito tu primer capítulo',
    pdfToast: 'Exportar PDF · próximamente',
    yearSuffix: 'hoy',
    memoirsGenre: 'Memorias',
    langName: 'Español',
  },
  tr: {
    cover: 'Kapak',
    titleOf: (name: string) => `${name}'in Hikayesi`,
    by: 'yazan',
    chaptersWritten: (done: number, total: number) => `${done}/${total} bölüm yazıldı`,
    editTitle: 'Düzenlemek için tıklayın',
    volume: 'Hacim',
    words: 'kelime',
    aboutPages: (n: number) => `yaklaşık ${n} basılı sayfa`,
    wordsMore: (words: number, tier: string) => `${tier} için ${words.toLocaleString('tr-TR')} kelime daha`,
    preface: 'Önsöz',
    writeFirst: 'İlk bölümü yaz →',
    toc: 'İçindekiler',
    excerpts: 'Parçalar',
    wordCount: 'kelime',
    readMore: 'Devamını oku',
    reduce: 'Küçült',
    readFull: 'Tam bölümü oku ve gözden geçir →',
    index: 'Dizin',
    indexAuthor: 'Yazar',
    indexPeriod: 'Dönem',
    indexGenre: 'Tür',
    indexLang: 'Dil',
    exportPdf: 'PDF olarak dışa aktar',
    exportSoon: '· yakında',
    exportComing: '· yakında',
    exportAvailable: 'İlk bölümünüz yazıldıktan sonra kullanılabilir',
    pdfToast: 'PDF dışa aktarma · sonraki sürümde',
    yearSuffix: 'bugün',
    memoirsGenre: 'Anılar',
    langName: 'Türkçe',
  },
}

function getPrefaceText(completed: number, lang: 'fr' | 'en' | 'es' | 'tr'): string {
  const p = PREFACE[lang]
  if (completed === 0) return p['0']
  if (completed <= 2) return p['1-2']
  if (completed <= 4) return p['3-4']
  if (completed <= 6) return p['5-6']
  return p['7']
}

// Pricing tiers (new pricing from landing page)
// Crayon ~10k words / Stilo ~40k / Plum ~80k / Gutenberg illimité
function getPlanTier(totalWords: number): { name: string; max: number | null; next: string | null; nextWords: number | null } {
  if (totalWords < 10000) return { name: 'Crayon', max: 10000, next: 'Stilo', nextWords: 10000 - totalWords }
  if (totalWords < 40000) return { name: 'Stilo', max: 40000, next: 'Plum', nextWords: 40000 - totalWords }
  if (totalWords < 80000) return { name: 'Plum', max: 80000, next: 'Gutenberg', nextWords: 80000 - totalWords }
  return { name: 'Gutenberg', max: null, next: null, nextWords: null }
}

export default function BookPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const [mounted, setMounted] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('Mon livre')
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [showPdfToast, setShowPdfToast] = useState(false)
  const [showArchitect, setShowArchitect] = useState(false)

  const wl = WLBook[store.lang] ?? WLBook.en

  useEffect(() => {
    if (store.userName) {
      setTitle((WLBook[store.lang] ?? WLBook.en).titleOf(store.userName))
    }
    setMounted(true)
  }, [store.userName, store.lang])

  if (!mounted) return null

  const completed = getCompletedCount(store.chapters)
  const year = new Date().getFullYear()

  // Total word count across all sessions
  const totalWords = store.sessions.reduce((sum, s) => sum + (s.wordCount ?? 0), 0)
  // Estimated pages (250 words per page, standard)
  const estimatedPages = Math.max(1, Math.round(totalWords / 250))

  const planTier = getPlanTier(totalWords)
  const tierFillPct = planTier.max ? Math.min(100, (totalWords / planTier.max) * 100) : 100

  // Index mock basé sur les réponses onboarding
  const indexItems = [
    ...(store.userName ? [{ type: wl.indexAuthor, value: store.userName }] : []),
    { type: wl.indexPeriod, value: `${Math.floor((new Date().getFullYear() - 30) / 10) * 10}s · ${wl.yearSuffix}` },
    { type: wl.indexGenre, value: wl.memoirsGenre },
    { type: wl.indexLang, value: wl.langName },
  ]

  function handleExportPdf() {
    setShowPdfToast(true)
    setTimeout(() => setShowPdfToast(false), 3500)
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#FAF8F4]">
        <div className="max-w-2xl mx-auto px-6 py-10">

          {/* ── PDF toast ───────────────────────────────── */}
          {showPdfToast && (
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C2E] text-[#EDE4D8] text-xs px-5 py-3 rounded-full shadow-xl flex items-center gap-2">
              <span className="text-[#C4622A]">✦</span>
              {wl.pdfToast}
            </div>
          )}

          {/* ── COUVERTURE ──────────────────────────────── */}
          <div className="mb-12 pb-10 border-b border-[#EDE4D8] text-center">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-8">{wl.cover}</p>

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
                <span className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#9C8E80]" title={wl.editTitle}>
                  ✎
                </span>
              </button>
            )}

            <p className="font-display text-lg text-[#7A4F32] mt-3">
              {wl.by} {store.userName || '—'}
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
              {wl.chaptersWritten(completed, store.chapters.length)}
            </p>
          </div>

          {/* ── VOLUME DU LIVRE ──────────────────────────── */}
          {totalWords > 0 && (
            <div className="mb-12 pb-10 border-b border-[#EDE4D8]">
              <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-5">{wl.volume}</p>

              {/* Stats row */}
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="font-display text-3xl italic text-[#1C1C2E] leading-none">
                    {totalWords.toLocaleString()}
                    <span className="text-base text-[#9C8E80] font-sans font-normal ml-2 not-italic">{wl.words}</span>
                  </p>
                  <p className="text-xs text-[#9C8E80] mt-1.5">
                    {wl.aboutPages(estimatedPages)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#C4622A] font-medium tracking-wide">{planTier.name}</p>
                  {planTier.next && (
                    <p className="text-[10px] text-[#9C8E80] mt-0.5">
                      {wl.wordsMore(planTier.nextWords!, planTier.next)}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bar toward tier limit */}
              <div className="h-1 bg-[#EDE4D8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C4622A]/60 rounded-full transition-all duration-700"
                  style={{ width: `${tierFillPct}%` }}
                />
              </div>

              {/* Export button */}
              <div className="mt-5">
                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-2 text-xs text-[#7A4F32] border border-[#EDE4D8] rounded-full px-5 py-2.5 hover:border-[#C4622A]/40 hover:text-[#C4622A] transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {wl.exportPdf}
                  <span className="text-[#9C8E80]/70 text-[10px] ml-1">{wl.exportSoon}</span>
                </button>
              </div>
            </div>
          )}

          {/* ── PRÉFACE ─────────────────────────────────── */}
          <div className="mb-12 pb-10 border-b border-[#EDE4D8]">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-4">{wl.preface}</p>
            <p className="font-display text-lg italic text-[#7A4F32] leading-relaxed">
              {getPrefaceText(completed, store.lang)}
            </p>
            {completed === 0 && (
              <button
                onClick={() => {
                  const next = store.chapters.find(c => c.status !== 'done')
                  if (next) router.push(`/write/${next.id}`)
                }}
                className="mt-6 text-xs text-[#C4622A] hover:underline tracking-wide"
              >
                {wl.writeFirst}
              </button>
            )}
          </div>

          {/* ── SOMMAIRE ────────────────────────────────── */}
          <div className="mb-12 pb-10 border-b border-[#EDE4D8]">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-[#9C8E80] tracking-widest uppercase">{wl.toc}</p>
              {completed >= 2 && (
                <button
                  onClick={() => setShowArchitect(true)}
                  className="flex items-center gap-1.5 text-xs text-[#7A4F32] border border-[#EDE4D8] rounded-full px-3 py-1.5 hover:border-[#C4622A]/40 hover:text-[#C4622A] transition-all"
                >
                  <span className="font-mono text-[10px]">◈</span>
                  {store.lang === 'fr' ? 'Analyser la structure' : store.lang === 'es' ? 'Analizar estructura' : 'Analyse structure'}
                </button>
              )}
            </div>
            <div className="space-y-1">
              {store.chapters.map((ch) => {
                const session = [...store.sessions].reverse().find(s => s.chapterId === ch.id)
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
                        <span className="text-xs text-[#9C8E80]">{session.wordCount} {wl.wordCount}</span>
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
              <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-5">{wl.excerpts}</p>
              <div className="space-y-6">
                {store.sessions.map((session) => {
                  const ch = store.chapters.find(c => c.id === session.chapterId)
                  const isExpanded = expandedChapter === session.chapterId
                  const PREVIEW_LEN = 200
                  const EXPANDED_LEN = 3000
                  const displayText = isExpanded
                    ? session.content.slice(0, EXPANDED_LEN)
                    : session.content.slice(0, PREVIEW_LEN)
                  const hasMore = session.content.length > PREVIEW_LEN
                  const truncatedWhenExpanded = session.content.length > EXPANDED_LEN

                  return (
                    <div key={`${session.chapterId}-${session.date}`} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display text-sm italic text-[#C4622A]">
                          {ch?.title}
                        </span>
                        <span className="text-xs text-[#9C8E80]">{session.wordCount} {wl.wordCount}</span>
                      </div>
                      <p className="text-sm text-[#7A4F32] leading-relaxed">
                        {displayText}
                        {(!isExpanded && hasMore) || (isExpanded && truncatedWhenExpanded) ? '…' : ''}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        {hasMore && (
                          <button
                            onClick={() => setExpandedChapter(isExpanded ? null : session.chapterId)}
                            className="text-xs text-[#C4622A] hover:underline"
                          >
                            {isExpanded ? wl.reduce : wl.readMore}
                          </button>
                        )}
                        {isExpanded && truncatedWhenExpanded && ch && (
                          <button
                            onClick={() => router.push(`/write/${ch.id}`)}
                            className="text-xs text-[#9C8E80] hover:text-[#7A4F32] transition-colors"
                          >
                            {wl.readFull}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── INDEX ───────────────────────────────────── */}
          <div className="mb-10">
            <p className="text-xs text-[#9C8E80] tracking-widest uppercase mb-4">{wl.index}</p>
            <div className="grid grid-cols-2 gap-3">
              {indexItems.map(item => (
                <div key={item.type} className="bg-white rounded-xl border border-[#EDE4D8] px-4 py-3">
                  <p className="text-xs text-[#9C8E80] mb-0.5">{item.type}</p>
                  <p className="text-sm font-medium text-[#1C1C2E]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── EXPORT (if no sessions yet) ─────────────── */}
          {totalWords === 0 && (
            <div className="mb-10 text-center">
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 text-xs text-[#C4B9A8] border border-[#EDE4D8] rounded-full px-5 py-2.5 opacity-50 cursor-default"
                disabled
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {wl.exportPdf}
                <span className="text-[10px] ml-1">{wl.exportComing}</span>
              </button>
              <p className="text-[10px] text-[#C4B9A8] mt-2">{wl.exportAvailable}</p>
            </div>
          )}

        </div>
      </div>

      {showArchitect && <BookArchitect onClose={() => setShowArchitect(false)} />}
    </AppLayout>
  )
}
