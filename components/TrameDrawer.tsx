'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore } from '@/stores/memoir'
import type { TrameChapter } from '@/lib/mock/trame-data'
import { PLANS, getNextPlan } from '@/lib/plans'
import type { PlanId } from '@/lib/plans'

const GRAIN = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

// Which "build mode" the user picked (persisted until trame is generated)
type BuildMode = null | 'libre' | 'ia' | 'ecrire'

type Props = {
  isOpen: boolean
  onClose: () => void
  inline?: boolean
}

export default function TrameDrawer({ isOpen, onClose, inline }: Props) {
  const router = useRouter()
  const store = useMemoirStore()
  const lang = store.lang
  const plan = PLANS[store.plan as PlanId] ?? PLANS.stilo
  const nextPlan = getNextPlan(store.plan as PlanId)

  const [buildMode, setBuildMode] = useState<BuildMode>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubtitle, setEditSubtitle] = useState('')
  const [showPlanPicker, setShowPlanPicker] = useState(false)

  const chaptersMax = plan.chaptersMax
  const wordsLimit = plan.wordsPerChapterSoft
  const chaptersCount = store.chapters.length
  const atLimit = chaptersMax !== null && chaptersCount >= chaptersMax

  // Reset build mode when trame becomes custom
  useEffect(() => {
    if (store.trameCustom) setBuildMode(null)
  }, [store.trameCustom])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  async function handleGenerate(prompt?: string) {
    setGenerating(true)
    setGenerateError(false)
    try {
      const res = await fetch('/api/memoir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trame_generate',
          userName: store.userName,
          lang,
          userPrompt: (prompt ?? userPrompt).trim(),
          profile: store.profile,
          bookFoundations: store.bookFoundations,
          memories: store.memories.map(m => m.content),
          chaptersMax: chaptersMax ?? 15,
        }),
      })
      if (!res.ok || !res.body) throw new Error()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
      }
      const start = text.indexOf('[')
      const end = text.lastIndexOf(']')
      if (start === -1 || end === -1) throw new Error('no json')
      const raw: Partial<TrameChapter>[] = JSON.parse(text.slice(start, end + 1))
      const chapters: TrameChapter[] = raw.map((ch, i) => ({
        id: `ch-${i + 1}`,
        number: i + 1,
        title: ch.title ?? '',
        subtitle: ch.subtitle ?? '',
        theme: ch.theme ?? '',
        prompt: ch.prompt ?? '',
        quote: ch.quote ?? '',
        quoteAuthor: ch.quoteAuthor ?? '',
        status: store.chapters[i]?.status ?? 'unwritten' as const,
      }))
      store.setChapters(chapters)
      setUserPrompt('')
      setBuildMode(null)
    } catch {
      setGenerateError(true)
      // 'ia' mode fires with empty prompt — no error UI in that branch, reset to options
      if ((prompt ?? '') === '') setBuildMode(null)
    } finally {
      setGenerating(false)
    }
  }

  function startEdit(ch: TrameChapter) {
    setEditingId(ch.id)
    setEditTitle(ch.title)
    setEditSubtitle(ch.subtitle ?? '')
  }

  function saveEdit(id: string) {
    store.updateChapter(id, { title: editTitle, subtitle: editSubtitle })
    setEditingId(null)
  }

  function moveChapter(id: string, dir: -1 | 1) {
    const idx = store.chapters.findIndex(c => c.id === id)
    if (idx < 0) return
    const swap = idx + dir
    if (swap < 0 || swap >= store.chapters.length) return
    const next = [...store.chapters]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    store.setChapters(next.map((c, i) => ({ ...c, number: i + 1 })))
  }

  function removeChapter(id: string) {
    if (store.chapters.length <= 1) return
    store.setChapters(
      store.chapters.filter(c => c.id !== id).map((c, i) => ({ ...c, number: i + 1 }))
    )
  }

  function addChapter() {
    if (atLimit) return
    const newId = `ch-${Date.now()}`
    const newNum = store.chapters.length + 1
    store.setChapters([
      ...store.chapters,
      { id: newId, number: newNum, title: '', subtitle: '', theme: '', prompt: '', quote: '', quoteAuthor: '', status: 'unwritten' },
    ])
    setTimeout(() => { setEditingId(newId); setEditTitle(''); setEditSubtitle('') }, 30)
  }

  if (!isOpen && !inline) return null

  const isFr = lang === 'fr'
  const isEn = lang === 'en'

  const L = {
    title: isFr ? 'Plan éditorial' : isEn ? 'Editorial Plan' : 'Plan editorial',
    chaptersLabel: isFr ? 'chapitres' : isEn ? 'chapters' : 'capítulos',
    changePlan: isFr ? 'Changer de plan' : 'Change plan',
    wordsOf: (n: number, max: number | null) =>
      max ? `${n.toLocaleString()} / ${max.toLocaleString()} mots` : `${n.toLocaleString()} mots`,
    done: isFr ? 'Terminé' : 'Done',
    inProgress: isFr ? 'En cours' : 'In progress',
    toWrite: isFr ? 'À écrire' : 'To write',
    cancel: isFr ? 'Annuler' : 'Cancel',
    save: isFr ? 'Valider' : 'Save',
    titlePlaceholder: isFr ? 'Titre du chapitre' : 'Chapter title',
    subtitlePlaceholder: isFr ? 'Sous-titre (optionnel)' : 'Subtitle (optional)',
    addChapter: isFr ? 'Ajouter un chapitre' : 'Add a chapter',
    limitReached: (n: number) => isFr ? `Limite de ${n} chapitres atteinte` : `${n} chapter limit reached`,
    upgradeTo: (label: string, max: number | null) =>
      isFr ? `Passer à ${label} pour ${max ?? '∞'} chapitres →` : `Upgrade to ${label} for ${max ?? '∞'} chapters →`,
    // Build options
    howToBuild: isFr ? 'Comment construire votre plan ?' : 'How do you want to build your outline?',
    optionLibreTitle: isFr ? 'Description libre' : 'Free description',
    optionLibreDesc: isFr ? 'Décrivez votre livre, l\'IA génère la trame' : 'Describe your book, AI generates the outline',
    optionIaTitle: isFr ? 'Proposition de l\'IA' : 'AI suggestion',
    optionIaDesc: isFr ? 'L\'IA propose une trame à partir de votre profil' : 'AI proposes an outline from your profile',
    optionEcrireTitle: isFr ? 'Écrire d\'abord' : 'Write first',
    optionEcrireDesc: isFr ? 'Commencez à écrire, la trame se révèle ensuite' : 'Start writing, the outline emerges later',
    promptPlaceholder: isFr
      ? 'Ex : mon enfance à Marseille, ma relation avec mon père, les années 80…'
      : 'E.g. my childhood, my relationship with my father, the 80s…',
    generating: isFr ? 'Génération en cours…' : 'Generating…',
    generate: isFr ? '✦ Générer ma trame' : '✦ Generate my outline',
    regenerate: isFr ? '↺ Regénérer' : '↺ Regenerate',
    regenerateWarning: isFr ? 'Cela remplacera les chapitres actuels' : 'This will replace current chapters',
    error: isFr ? 'Erreur — ' : 'Error — ',
    retry: isFr ? 'réessayer' : 'retry',
    writtenNoDelete: isFr ? 'Chapitre écrit, non supprimable' : 'Written chapter, cannot delete',
    chapterN: (n: number) => isFr ? `Chapitre ${n}` : `Chapter ${n}`,
    noTitle: isFr ? 'À nommer' : 'Untitled',
    backToOptions: isFr ? '← Changer de méthode' : '← Change method',
  }

  // Words written per chapter
  const wordsPerChapter: Record<string, number> = {}
  for (const s of store.sessions) {
    wordsPerChapter[s.chapterId] = (wordsPerChapter[s.chapterId] ?? 0) + (s.wordCount ?? 0)
  }

  // Whether trame has real titles (trameCustom OR any chapter has a non-empty title that's not the default)
  const hasTitles = store.trameCustom

  const inner = (
    <div className={inline ? 'flex flex-col' : 'relative w-full max-w-2xl h-full bg-[#F5EFE0] shadow-2xl flex flex-col overflow-hidden'}>
      {!inline && <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={GRAIN} />}

      {/* ── Header ── */}
      <div className={`flex items-center justify-between ${inline ? 'mb-4' : 'px-6 py-4 border-b border-[#EDE4D8] flex-shrink-0 relative z-10'}`}>
        <div>
          {!inline && <h2 className="font-display text-xl italic text-[#1C1C2E]">{L.title}</h2>}
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={() => setShowPlanPicker(p => !p)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDE4D8] text-[#7A4F32] hover:bg-[#E0D4C4] transition-colors font-medium"
            >
              {plan.label}
            </button>
            <span className="text-[10px] text-[#9C8E80]">
              {chaptersMax !== null
                ? `${chaptersCount}/${chaptersMax} ${L.chaptersLabel}`
                : `${chaptersCount} ${L.chaptersLabel}`}
            </span>
          </div>
        </div>
        {!inline && <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#9C8E80] hover:text-[#1C1C2E] transition-colors text-xl">×</button>}
      </div>

      {/* ── Plan picker ── */}
      {showPlanPicker && (
        <div className={`${inline ? '' : 'relative z-10 border-b border-[#EDE4D8] flex-shrink-0'} bg-white px-6 py-4 mb-4 rounded-2xl border border-[#EDE4D8]`}>
            <p className="text-[10px] text-[#9C8E80] uppercase tracking-wider mb-3">{L.changePlan}</p>
            <div className="grid grid-cols-4 gap-2">
              {(['crayon', 'stilo', 'plum', 'gutenberg'] as PlanId[]).map(pid => {
                const p = PLANS[pid]
                const isCurrent = store.plan === pid
                return (
                  <button
                    key={pid}
                    onClick={() => { store.setPlan(pid); setShowPlanPicker(false) }}
                    className={`rounded-xl p-3 text-left border transition-all ${
                      isCurrent ? 'border-[#C4622A] bg-[#C4622A]/5' : 'border-[#EDE4D8] hover:border-[#C4B9A8] bg-white'
                    }`}
                  >
                    <p className="text-xs font-semibold text-[#1C1C2E]">{p.label}</p>
                    <p className="text-[9px] text-[#9C8E80] mt-0.5">{p.chaptersMax ? `${p.chaptersMax} chap.` : '∞ chap.'}</p>
                    <p className={`text-[9px] mt-1 font-medium ${isCurrent ? 'text-[#C4622A]' : 'text-[#9C8E80]'}`}>
                      {p.price[lang === 'en' ? 'en' : 'fr']}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      {/* ── Content ── */}
      <div className={`${inline ? '' : 'flex-1 overflow-y-auto relative z-10 px-6 py-5'} space-y-3`}>

          {/* ── BUILD OPTIONS (when no custom trame yet) ── */}
          {!hasTitles && !buildMode && (
            <div className="rounded-2xl border border-[#EDE4D8] bg-white overflow-hidden mb-2">
              {generateError && (
                <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                  <p className="text-xs text-red-600">{L.error}</p>
                  <button
                    onClick={() => { setGenerateError(false); setBuildMode('ia'); handleGenerate('') }}
                    className="text-xs text-red-600 underline"
                  >{L.retry}</button>
                </div>
              )}
              <div className="px-5 py-4 border-b border-[#EDE4D8]">
                <p className="text-sm font-medium text-[#1C1C2E]">{L.howToBuild}</p>
              </div>
              <div className="divide-y divide-[#EDE4D8]">
                {/* Option A — Description libre */}
                <button
                  onClick={() => setBuildMode('libre')}
                  className="w-full flex items-start gap-4 px-5 py-4 hover:bg-[#FAF8F4] transition-colors text-left"
                >
                  <span className="text-[#C4622A] text-lg mt-0.5 flex-shrink-0">✦</span>
                  <div>
                    <p className="text-sm font-medium text-[#1C1C2E]">{L.optionLibreTitle}</p>
                    <p className="text-xs text-[#9C8E80] mt-0.5">{L.optionLibreDesc}</p>
                  </div>
                </button>

                {/* Option B — Proposition IA */}
                <button
                  onClick={() => { setBuildMode('ia'); handleGenerate('') }}
                  className="w-full flex items-start gap-4 px-5 py-4 hover:bg-[#FAF8F4] transition-colors text-left"
                >
                  <span className="text-[#7A4F32] text-lg mt-0.5 flex-shrink-0">◈</span>
                  <div>
                    <p className="text-sm font-medium text-[#1C1C2E]">{L.optionIaTitle}</p>
                    <p className="text-xs text-[#9C8E80] mt-0.5">{L.optionIaDesc}</p>
                  </div>
                </button>

                {/* Option C — Écrire d'abord */}
                <button
                  onClick={() => setBuildMode('ecrire')}
                  className="w-full flex items-start gap-4 px-5 py-4 hover:bg-[#FAF8F4] transition-colors text-left"
                >
                  <span className="text-[#9C8E80] text-lg mt-0.5 flex-shrink-0">◎</span>
                  <div>
                    <p className="text-sm font-medium text-[#1C1C2E]">{L.optionEcrireTitle}</p>
                    <p className="text-xs text-[#9C8E80] mt-0.5">{L.optionEcrireDesc}</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── LIBRE — textarea + generate ── */}
          {!hasTitles && buildMode === 'libre' && (
            <div className="rounded-2xl border border-[#EDE4D8] bg-white p-5 space-y-3 mb-2">
              <button onClick={() => setBuildMode(null)} className="text-[10px] text-[#9C8E80] hover:text-[#7A4F32] transition-colors">
                {L.backToOptions}
              </button>
              <textarea
                autoFocus
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
                placeholder={L.promptPlaceholder}
                rows={3}
                disabled={generating}
                className="w-full text-sm text-[#1C1C2E] bg-[#FAF8F4] rounded-xl px-4 py-3 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 resize-none disabled:opacity-60"
              />
              {generateError && (
                <p className="text-xs text-red-500">
                  {L.error}<button onClick={() => handleGenerate()} className="underline">{L.retry}</button>
                </p>
              )}
              <button
                onClick={() => handleGenerate()}
                disabled={generating || !userPrompt.trim()}
                className="w-full bg-[#1C1C2E] text-white text-sm font-medium py-3 rounded-full hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {generating ? L.generating : L.generate}
              </button>
            </div>
          )}

          {/* ── IA — generating spinner ── */}
          {!hasTitles && buildMode === 'ia' && generating && (
            <div className="rounded-2xl border border-[#EDE4D8] bg-white px-5 py-6 flex flex-col items-center gap-3 mb-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#C4622A] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-sm text-[#9C8E80]">{L.generating}</p>
            </div>
          )}

          {/* ── Chapter list ── */}
          {store.chapters.map((ch, idx) => {
            const written = wordsPerChapter[ch.id] ?? 0
            const displayTitle = hasTitles ? ch.title : ''
            const isEditing = editingId === ch.id

            return (
              <div key={ch.id} className="bg-white rounded-2xl border border-[#EDE4D8] overflow-hidden">
                {isEditing ? (
                  <div className="px-4 py-3 space-y-2">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(ch.id)}
                      className="w-full text-sm font-medium text-[#1C1C2E] bg-[#FAF8F4] rounded-lg px-3 py-2 outline-none border border-[#C4622A]/30 focus:border-[#C4622A]/60"
                      placeholder={L.titlePlaceholder}
                    />
                    <input
                      value={editSubtitle}
                      onChange={e => setEditSubtitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(ch.id)}
                      className="w-full text-xs text-[#7A4F32] bg-[#FAF8F4] rounded-lg px-3 py-2 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40"
                      placeholder={L.subtitlePlaceholder}
                    />
                    <div className="flex gap-2 justify-end pt-1">
                      <button onClick={() => setEditingId(null)} className="text-xs text-[#9C8E80] px-3 py-1.5 rounded-lg hover:bg-[#EDE4D8] transition-colors">{L.cancel}</button>
                      <button onClick={() => saveEdit(ch.id)} className="text-xs text-white bg-[#1C1C2E] px-3 py-1.5 rounded-lg hover:opacity-90 transition-colors">{L.save}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Number / check */}
                    <span className={`text-sm font-mono w-5 text-center flex-shrink-0 ${
                      ch.status === 'done' ? 'text-[#C4622A]' :
                      ch.status === 'in_progress' ? 'text-[#7A4F32]' : 'text-[#C4B9A8]'
                    }`}>
                      {ch.status === 'done' ? '✓' : ch.number}
                    </span>

                    {/* Title area — click to edit */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer group"
                      onClick={() => startEdit(ch)}
                    >
                      <p className={`text-sm font-medium leading-tight truncate group-hover:text-[#C4622A] transition-colors ${
                        displayTitle ? (ch.status === 'done' ? 'text-[#1C1C2E]' : 'text-[#7A4F32]') : 'text-[#C4B9A8] italic'
                      }`}>
                        {displayTitle || L.chapterN(ch.number)}
                      </p>

                      {/* Word count */}
                      <p className={`text-[10px] mt-0.5 ${written > 0 ? 'text-[#C4622A]/70' : 'text-[#C4B9A8]'}`}>
                        {L.wordsOf(written, wordsLimit)}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`text-[9px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                      ch.status === 'done' ? 'bg-[#C4622A]/10 text-[#C4622A]' :
                      ch.status === 'in_progress' ? 'bg-[#7A4F32]/10 text-[#7A4F32]' :
                      'bg-[#EDE4D8] text-[#9C8E80]'
                    }`}>
                      {ch.status === 'done' ? L.done : ch.status === 'in_progress' ? L.inProgress : L.toWrite}
                    </span>

                    {/* Controls */}
                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                      <button onClick={() => moveChapter(ch.id, -1)} disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center text-[#C4B9A8] hover:text-[#7A4F32] disabled:opacity-20 transition-colors text-xs">↑</button>
                      <button onClick={() => moveChapter(ch.id, 1)} disabled={idx === store.chapters.length - 1}
                        className="w-6 h-6 flex items-center justify-center text-[#C4B9A8] hover:text-[#7A4F32] disabled:opacity-20 transition-colors text-xs">↓</button>
                      <button onClick={() => removeChapter(ch.id)} disabled={ch.status === 'done' || store.chapters.length <= 1}
                        title={ch.status === 'done' ? L.writtenNoDelete : ''}
                        className="w-6 h-6 flex items-center justify-center text-[#C4B9A8] hover:text-red-400 disabled:opacity-20 transition-colors text-xs">×</button>
                      <button onClick={() => { if (!inline) onClose(); router.push(`/write/${ch.id}`) }}
                        className="w-6 h-6 flex items-center justify-center text-[#C4622A] hover:text-[#7A4F32] transition-colors text-xs ml-0.5">→</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Add / upsell */}
          {atLimit ? (
            nextPlan && (
              <div className="rounded-2xl border border-dashed border-[#C4622A]/30 px-4 py-3 text-center space-y-1">
                <p className="text-xs text-[#9C8E80]">{L.limitReached(chaptersMax!)}</p>
                <button onClick={() => setShowPlanPicker(true)} className="text-xs text-[#C4622A] hover:underline font-medium">
                  {L.upgradeTo(PLANS[nextPlan].label, PLANS[nextPlan].chaptersMax)}
                </button>
              </div>
            )
          ) : (
            <button onClick={addChapter}
              className="w-full rounded-2xl border border-dashed border-[#EDE4D8] hover:border-[#C4B9A8] py-3 text-xs text-[#9C8E80] hover:text-[#7A4F32] transition-all">
              + {L.addChapter}
            </button>
          )}

          {/* ── Regenerate section (when trame already exists) ── */}
          {hasTitles && (
            <div className="border-t border-[#EDE4D8] pt-5 space-y-3">
              <p className="text-[10px] text-[#9C8E80] uppercase tracking-wider">
                {lang === 'fr' ? "Affiner avec l'IA" : 'Refine with AI'}
              </p>
              <textarea
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
                placeholder={L.promptPlaceholder}
                rows={2}
                disabled={generating}
                className="w-full text-sm text-[#1C1C2E] bg-white rounded-2xl px-4 py-3 outline-none border border-[#EDE4D8] focus:border-[#C4622A]/40 resize-none disabled:opacity-60"
              />
              {generateError && (
                <p className="text-xs text-red-500">
                  {L.error}<button onClick={() => handleGenerate()} className="underline">{L.retry}</button>
                </p>
              )}
              <button onClick={() => handleGenerate()} disabled={generating}
                className="w-full bg-[#1C1C2E] text-white text-sm font-medium py-3 rounded-full hover:opacity-90 disabled:opacity-50 transition-all">
                {generating ? L.generating : L.regenerate}
              </button>
              {!generating && (
                <p className="text-[10px] text-[#9C8E80] text-center">{L.regenerateWarning}</p>
              )}
            </div>
          )}

      </div>
    </div>
  )

  if (inline) return inner

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#1C1C2E]/40 backdrop-blur-sm" onClick={onClose} />
      {inner}
    </div>
  )
}
