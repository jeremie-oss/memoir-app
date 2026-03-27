'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMemoirStore, type WritingModeId } from '@/stores/memoir'
import { getSessionMessage, getChapterDisplay } from '@/lib/mock/trame-data'
import { WRITING_MODES } from '@/lib/i18n'

type Phase = 'ritual' | 'writing' | 'end'
type GuidePhase = 'chat' | 'write'
type ConvoMsg = { role: 'user' | 'assistant'; content: string }
type Duration = 0 | 15 | 30 | 45

const GRAIN = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

const WL = {
  fr: {
    chapter: 'Chapitre',
    chooseMode: 'Choisissez votre rituel',
    chooseDuration: 'Durée',
    durationFree: 'Libre',
    beginSeance: 'Commencer ma Séance',
    backHome: "← Revenir à l'accueil",
    finish: 'Terminer →',
    finishSession: 'Terminer la Séance',
    placeholder: 'Commencez à écrire…',
    wordsUnit: (n: number) => `${n} mot${n > 1 ? 's' : ''}`,
    wordsToday: 'mots de votre Plume',
    chapterDone: 'Chapitre complété',
    saving: 'Sauvegarde…',
    save: "Sauvegarder et revenir à l'accueil",
    continueWriting: 'Continuer à écrire',
    micStart: '◎  Dicter',
    micStop: '◎  Arrêter',
    micUnsupported: 'Dictée non disponible sur ce navigateur',
    answerPlaceholder: 'Votre réponse…',
    sendAnswer: 'Envoyer →',
    createDraft: 'Créer mon premier jet →',
    thinking: 'Je réfléchis…',
    draftNote: 'Voici votre premier jet - modifiez-le librement',
    reformulate: '◎  Reformuler',
    reformTitle: 'Votre texte retravaillé',
    reformDesc: 'Cliquez sur "Utiliser" pour remplacer votre texte.',
    useThis: 'Utiliser ce texte',
    closePanel: 'Fermer',
    inspire: '✦  Inspiration',
    inspireTitle: 'Une amorce pour vous lancer',
    inspireUse: 'Ajouter au texte',
    minHint: '(répondez encore pour enrichir votre jet)',
    captureTitle: 'Recevez votre texte par email',
    capturePlaceholder: 'votre@email.com',
    captureSubmit: 'Envoyer',
    captureDone: 'Texte envoyé dans votre boîte ✦',
    captureSkip: 'Passer',
    autoSaved: '✓ Sauvegarde auto',
    draftRestoredMsg: 'Brouillon restauré',
    sessionRestoredMsg: 'Version précédente chargée',
    timeRemaining: 'restant',
    notesBtn: '✎ Notes',
    notesTitle: 'Notes de révision',
    notesPlaceholder: 'Remarques, pistes à explorer, passages à retravailler…',
  },
  en: {
    chapter: 'Chapter',
    chooseMode: 'Choose your ritual',
    chooseDuration: 'Duration',
    durationFree: 'Free',
    beginSeance: 'Begin my Séance',
    backHome: '← Back to home',
    finish: 'Finish →',
    finishSession: 'End Séance',
    placeholder: 'Start writing…',
    wordsUnit: (n: number) => `${n} word${n > 1 ? 's' : ''}`,
    wordsToday: 'words of your Plume',
    chapterDone: 'Chapter completed',
    saving: 'Saving…',
    save: 'Save and return home',
    continueWriting: 'Continue writing',
    micStart: '◎  Dictate',
    micStop: '◎  Stop',
    micUnsupported: 'Dictation not available in this browser',
    answerPlaceholder: 'Your answer…',
    sendAnswer: 'Send →',
    createDraft: 'Create my first draft →',
    thinking: 'Thinking…',
    draftNote: 'Here is your first draft - edit it freely',
    reformulate: '◎  Rewrite',
    reformTitle: 'Your rewritten text',
    reformDesc: 'Click "Use this" to replace your text.',
    useThis: 'Use this text',
    closePanel: 'Close',
    inspire: '✦  Inspire me',
    inspireTitle: 'An opening to get you started',
    inspireUse: 'Add to text',
    minHint: '(answer more to enrich your draft)',
    captureTitle: 'Receive your text by email',
    capturePlaceholder: 'your@email.com',
    captureSubmit: 'Send',
    captureDone: 'Text sent to your inbox ✦',
    captureSkip: 'Skip',
    autoSaved: '✓ Auto-saved',
    draftRestoredMsg: 'Draft restored',
    sessionRestoredMsg: 'Previous version loaded',
    timeRemaining: 'remaining',
    notesBtn: '✎ Notes',
    notesTitle: 'Revision notes',
    notesPlaceholder: 'Remarks, passages to develop, questions to check…',
  },
  es: {
    chapter: 'Capítulo',
    chooseMode: 'Elige tu ritual',
    chooseDuration: 'Duración',
    durationFree: 'Libre',
    beginSeance: 'Comenzar mi Séance',
    backHome: '← Volver al inicio',
    finish: 'Terminar →',
    finishSession: 'Terminar Séance',
    placeholder: 'Empieza a escribir…',
    wordsUnit: (n: number) => `${n} palabra${n > 1 ? 's' : ''}`,
    wordsToday: 'palabras de tu Pluma',
    chapterDone: 'Capítulo completado',
    saving: 'Guardando…',
    save: 'Guardar y volver al inicio',
    continueWriting: 'Continuar escribiendo',
    micStart: '◎  Dictar',
    micStop: '◎  Parar',
    micUnsupported: 'Dictado no disponible en este navegador',
    answerPlaceholder: 'Tu respuesta…',
    sendAnswer: 'Enviar →',
    createDraft: 'Crear mi primer borrador →',
    thinking: 'Pensando…',
    draftNote: 'Aquí está tu primer borrador - edítalo libremente',
    reformulate: '◎  Reformular',
    reformTitle: 'Tu texto reescrito',
    reformDesc: 'Haz clic en "Usar" para reemplazar tu texto.',
    useThis: 'Usar este texto',
    closePanel: 'Cerrar',
    inspire: '✦  Inspiración',
    inspireTitle: 'Un comienzo para lanzarte',
    inspireUse: 'Añadir al texto',
    minHint: '(responde más para enriquecer tu borrador)',
    captureTitle: 'Recibe tu texto por email',
    capturePlaceholder: 'tu@email.com',
    captureSubmit: 'Enviar',
    captureDone: 'Texto enviado a tu buzón ✦',
    captureSkip: 'Omitir',
    autoSaved: '✓ Guardado auto',
    draftRestoredMsg: 'Borrador restaurado',
    sessionRestoredMsg: 'Versión anterior cargada',
    timeRemaining: 'restante',
    notesBtn: '✎ Notas',
    notesTitle: 'Notas de revisión',
    notesPlaceholder: 'Observaciones, pasajes a desarrollar, preguntas…',
  },
}

const DURATIONS: Duration[] = [0, 15, 30, 45]

type WriteModeId = 'libre' | 'guide' | 'dicte'

function getModeText(id: WriteModeId, lang: 'fr' | 'en' | 'es') {
  if (lang === 'fr') return WRITING_MODES[id].fr
  if (lang === 'es') return WRITING_MODES[id].es
  return WRITING_MODES[id].en
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function WritePage() {
  const router = useRouter()
  const params = useParams()
  const chapterId = params.id as string
  const store = useMemoirStore()

  const [phase, setPhase] = useState<Phase>('ritual')
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [fadeIn, setFadeIn] = useState(true)
  const [mode, setMode] = useState<WriteModeId>(
    (store.writingMode === 'entretien' ? 'libre' : store.writingMode) as WriteModeId
  )

  // Ritual: duration
  const [sessionDuration, setSessionDuration] = useState<Duration>(0)

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionStartRef = useRef<number>(0)

  // Auto-save
  const [draftSaved, setDraftSaved] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const draftKey = `memoir-draft-${chapterId}`

  // Voice
  const [isListening, setIsListening] = useState(false)
  const [micError, setMicError] = useState(false)
  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Guide mode
  const [guideConvo, setGuideConvo] = useState<ConvoMsg[]>([])
  const [guideInput, setGuideInput] = useState('')
  const [guidePhase, setGuidePhase] = useState<GuidePhase>('chat')
  const convoRef = useRef<HTMLDivElement>(null)

  // AI shared state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStreaming, setAiStreaming] = useState('')

  // Dictée: reformulate panel
  const [showReform, setShowReform] = useState(false)
  const [reformText, setReformText] = useState('')

  // Libre: inspire panel
  const [showInspire, setShowInspire] = useState(false)
  const [inspireText, setInspireText] = useState('')

  // Revision notes panel
  const [showNotes, setShowNotes] = useState(false)
  const [chapterNotes, setChapterNotes] = useState('')

  // Save error feedback
  const [saveError, setSaveError] = useState(false)

  // End: email capture
  const [emailInput, setEmailInput] = useState('')
  const [emailCaptured, setEmailCaptured] = useState(false)
  const [emailCapturing, setEmailCapturing] = useState(false)

  // Inspiration from URL (e.g. question from Resources or character prompt)
  const [inspirationQ, setInspirationQ] = useState<string | null>(null)

  const rawChapter = store.chapters.find((c) => c.id === chapterId)
  const chapter = rawChapter ? getChapterDisplay(rawChapter, store.lang) : undefined
  const lang = store.lang
  const wl = WL[lang]
  const modes = Object.values(WRITING_MODES)

  // Redirect if chapter not found
  useEffect(() => {
    if (!chapter) router.push('/home')
  }, [chapter, router])

  // Word count
  useEffect(() => {
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length
    setWordCount(words)
  }, [content])

  // Restore draft on mount + read ?inspiration param
  useEffect(() => {
    let restoredFromDraft = false
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        const { content: savedContent } = JSON.parse(saved)
        if (savedContent && savedContent.trim()) {
          setContent(savedContent)
          setDraftRestored(true)
          setTimeout(() => setDraftRestored(false), 3000)
          restoredFromDraft = true
        }
      }
    } catch {}

    // If no localStorage draft, restore from last saved session (for revision)
    if (!restoredFromDraft) {
      const lastSession = [...store.sessions].reverse().find(s => s.chapterId === chapterId)
      if (lastSession?.content?.trim()) {
        setContent(lastSession.content)
        setChapterNotes(lastSession.notes ?? '')
        setDraftRestored(true)
        setTimeout(() => setDraftRestored(false), 3000)
      }
    }

    // If ?inspiration= param is set, skip ritual and go straight to libre writing
    const q = new URLSearchParams(window.location.search).get('inspiration')
    if (q) {
      setInspirationQ(decodeURIComponent(q))
      setMode('libre')
      setPhase('writing')
      startTimer()
      setTimeout(() => textareaRef.current?.focus(), 150)
    }

    return () => {
      recognitionRef.current?.stop()
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save every 30s when in writing phase
  useEffect(() => {
    if (phase !== 'writing') return
    autoSaveRef.current = setInterval(() => {
      if (content.trim()) {
        try {
          localStorage.setItem(draftKey, JSON.stringify({ content, savedAt: new Date().toISOString() }))
          setDraftSaved(true)
          setTimeout(() => setDraftSaved(false), 2000)
        } catch {}
      }
    }, 30_000)
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, content])

  // Auto-scroll guide conversation
  useEffect(() => {
    if (convoRef.current) {
      convoRef.current.scrollTop = convoRef.current.scrollHeight
    }
  }, [guideConvo, aiStreaming])

  // ── Timer helpers ────────────────────────────────────────────
  function startTimer() {
    sessionStartRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000))
    }, 1000)
  }

  function getRemainingSeconds(): number | null {
    if (sessionDuration === 0) return null
    return Math.max(0, sessionDuration * 60 - elapsedSeconds)
  }

  function getTimerDisplay(): string {
    const remaining = getRemainingSeconds()
    if (remaining === null) return formatTime(elapsedSeconds)
    return formatTime(remaining)
  }

  function isTimerWarning(): boolean {
    const remaining = getRemainingSeconds()
    if (remaining === null) return false
    return remaining <= 60 && remaining > 0
  }

  function isTimerDone(): boolean {
    const remaining = getRemainingSeconds()
    if (remaining === null) return false
    return remaining === 0
  }

  // ── Core streaming function ──────────────────────────────────
  async function streamAI(payload: object): Promise<string> {
    setAiLoading(true)
    setAiStreaming('')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch('/api/memoir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!res.ok || !res.body) {
        setAiLoading(false)
        return ''
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      setAiLoading(false)
      let result = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
        setAiStreaming(result)
      }
      setAiStreaming('')
      return result.replace(/—/g, '-')
    } catch {
      clearTimeout(timeout)
      setAiLoading(false)
      setAiStreaming('')
      return ''
    }
  }

  // ── Guide mode ───────────────────────────────────────────────
  async function startGuide() {
    const question = await streamAI({
      action: 'guide_question',
      chapter: { title: chapter!.title, theme: chapter!.theme, prompt: chapter!.prompt },
      userName: store.userName,
      lang,
      conversation: [],
    })
    if (question) setGuideConvo([{ role: 'assistant', content: question }])
  }

  async function sendGuideAnswer() {
    if (!guideInput.trim() || aiLoading) return
    const answer = guideInput.trim()
    setGuideInput('')
    const newConvo: ConvoMsg[] = [...guideConvo, { role: 'user', content: answer }]
    setGuideConvo(newConvo)
    const question = await streamAI({
      action: 'guide_question',
      chapter: { title: chapter!.title, theme: chapter!.theme, prompt: chapter!.prompt },
      userName: store.userName,
      lang,
      conversation: newConvo,
    })
    if (question) setGuideConvo([...newConvo, { role: 'assistant', content: question }])
  }

  async function generateGuideDraft() {
    if (aiLoading) return
    const draft = await streamAI({
      action: 'guide_generate',
      chapter: { title: chapter!.title, theme: chapter!.theme, prompt: chapter!.prompt },
      userName: store.userName,
      lang,
      conversation: guideConvo,
    })
    if (draft) {
      setContent(draft)
      setGuidePhase('write')
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }

  // ── Dictée: reformulate ──────────────────────────────────────
  async function reformulate() {
    if (!content.trim() || aiLoading) return
    setReformText('')
    setShowReform(true)
    const result = await streamAI({
      action: 'dicte_reformulate',
      chapter: { title: chapter!.title, theme: chapter!.theme },
      userName: store.userName,
      lang,
      content,
    })
    setReformText(result)
  }

  function useReformulated() {
    setContent(reformText)
    setShowReform(false)
    setReformText('')
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  // ── Libre: inspire ───────────────────────────────────────────
  async function inspire() {
    if (aiLoading) return
    setInspireText('')
    setShowInspire(true)
    const result = await streamAI({
      action: 'libre_inspire',
      chapter: { title: chapter!.title, theme: chapter!.theme, prompt: chapter!.prompt },
      userName: store.userName,
      lang,
    })
    setInspireText(result)
  }

  function useInspiration() {
    setContent((prev) => prev + (prev && !prev.endsWith('\n') ? '\n\n' : '') + inspireText)
    setShowInspire(false)
    setInspireText('')
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  // ── Email capture ────────────────────────────────────────────
  async function submitEmailCapture() {
    if (!emailInput.includes('@') || emailCapturing) return
    setEmailCapturing(true)
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput,
          name: store.userName,
          source: 'app_end_session',
          lang,
          snippet: content.slice(0, 200),
        }),
      })
    } finally {
      setEmailCapturing(false)
      setEmailCaptured(true)
    }
  }

  // ── Transitions ──────────────────────────────────────────────
  function beginWriting() {
    store.setWritingMode(mode)
    setGuideConvo([])
    setGuidePhase('chat')
    setGuideInput('')
    setFadeIn(false)
    setTimeout(() => {
      setPhase('writing')
      setFadeIn(true)
      startTimer()
      if (mode === 'guide') {
        startGuide()
      } else {
        setTimeout(() => textareaRef.current?.focus(), 100)
      }
    }, 450)
  }

  function handleFinish() {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false) }
    if (timerRef.current) clearInterval(timerRef.current)
    if (wordCount === 0) { router.push('/home'); return }
    setFadeIn(false)
    setTimeout(() => { setPhase('end'); setFadeIn(true) }, 450)
  }

  function handleSave() {
    setIsSaving(true)
    setSaveError(false)

    const durationSec = elapsedSeconds || 0

    // Save to Supabase then navigate
    fetch('/api/save-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: store.userId,
        userName: store.userName,
        chapterId,
        chapterTitle: chapter?.title,
        content,
        wordCount,
        mode,
        notes: chapterNotes || undefined,
        durationSec,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.authUserId && data.authUserId !== store.userId) {
          store.setUserId(data.authUserId)
        }
        if (data.error) {
          console.error('[save-session] API error:', data.error)
          setSaveError(true)
        }
      })
      .catch((err) => {
        console.error('[save-session] network error:', err)
        setSaveError(true)
      })
      .finally(() => {
        // Always save locally and navigate (local save is the safety net)
        try { localStorage.removeItem(draftKey) } catch {}
        store.saveSession({ chapterId, wordCount, content, notes: chapterNotes, date: new Date().toISOString() })
        setTimeout(() => router.push('/home'), 400)
      })
  }

  function toggleVoice() {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setMicError(true)
      setTimeout(() => setMicError(false), 3000)
      return
    }
    setMicError(false)
    const recognition = new SR()
    recognition.lang = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (e: any) => {
      const results = Array.from(e.results).slice(e.resultIndex)
      const transcript = (results as any[]).map((r: any) => r[0].transcript).join(' ')
      setContent((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      setMicError(true)
      setTimeout(() => setMicError(false), 3000)
    }
    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  if (!chapter) return null

  const sessionMsg = getSessionMessage(wordCount, store.userName, lang)
  const userAnswerCount = guideConvo.filter((m) => m.role === 'user').length
  const displayStreaming = aiStreaming && (mode !== 'dicte' || !showReform) && (mode !== 'libre' || !showInspire)
  const timerDisplay = getTimerDisplay()
  const timerWarning = isTimerWarning()
  const timerDone = isTimerDone()

  return (
    <div className={`min-h-screen flex flex-col transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>

      {/* ─── PHASE 1 : RITUEL ────────────────────────────────── */}
      {phase === 'ritual' && (
        <main className="min-h-screen bg-[#1C1C2E] flex flex-col items-center justify-center px-6 relative overflow-hidden">
          <div className="pointer-events-none fixed inset-0 opacity-[0.04] z-50" style={GRAIN} />
          <div className="absolute w-80 h-80 rounded-full bg-[#C4622A] opacity-[0.04] blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="max-w-xl w-full text-center relative z-10">
            <p className="text-xs text-[#7A4F32] tracking-widest uppercase mb-8">
              {wl.chapter} {chapter.number} · {chapter.title}
            </p>

            <blockquote className="font-display text-2xl md:text-3xl italic text-[#FAF8F4] leading-relaxed mb-4">
              &ldquo;{chapter.quote}&rdquo;
            </blockquote>
            <p className="text-xs text-[#7A4F32] tracking-wide mb-10">- {chapter.quoteAuthor}</p>

            <div className="flex items-center gap-4 mb-8 justify-center">
              <div className="h-px w-16 bg-[#C4622A]/20" />
              <span className="text-[#C4622A] text-xs">✦</span>
              <div className="h-px w-16 bg-[#C4622A]/20" />
            </div>

            <p className="text-[#9C8E80] text-sm leading-relaxed mb-10 max-w-sm mx-auto">
              {chapter.prompt}
            </p>

            {/* Mode selector */}
            <div className="mb-8">
              <p className="text-[10px] text-[#9C8E80]/50 tracking-widest uppercase mb-5">
                {wl.chooseMode}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {modes.map((m) => {
                  const ml = getModeText(m.id, lang)
                  const isSelected = mode === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`flex flex-col items-center gap-2 px-5 py-4 rounded-2xl border transition-all w-28 ${
                        isSelected
                          ? 'bg-[#C4622A] border-[#C4622A] text-white'
                          : 'bg-[#FAF8F4]/5 border-[#FAF8F4]/10 text-[#FAF8F4]/50 hover:border-[#FAF8F4]/30 hover:text-[#FAF8F4]/70'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <p className="text-xs font-medium leading-tight text-center">{ml.label}</p>
                    </button>
                  )
                })}
              </div>
              <p className="text-[#9C8E80]/50 text-xs mt-4 italic">
                {getModeText(mode, lang).desc}
              </p>
            </div>

            {/* Duration selector */}
            <div className="mb-10">
              <p className="text-[10px] text-[#9C8E80]/50 tracking-widest uppercase mb-4">
                {wl.chooseDuration}
              </p>
              <div className="flex gap-2 justify-center">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSessionDuration(d)}
                    className={`px-4 py-2 rounded-full text-xs border transition-all ${
                      sessionDuration === d
                        ? 'bg-[#FAF8F4]/15 border-[#FAF8F4]/40 text-[#FAF8F4]'
                        : 'bg-transparent border-[#FAF8F4]/10 text-[#9C8E80]/50 hover:border-[#FAF8F4]/20 hover:text-[#9C8E80]'
                    }`}
                  >
                    {d === 0 ? wl.durationFree : `${d} min`}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={beginWriting}
              className="inline-flex items-center gap-3 border border-[#FAF8F4]/20 text-[#FAF8F4] text-sm px-8 py-4 rounded-full hover:bg-white/5 hover:border-[#FAF8F4]/40 transition-all tracking-wide"
            >
              {wl.beginSeance}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push('/home')}
              className="block mt-6 mx-auto text-xs text-[#9C8E80]/40 hover:text-[#9C8E80] transition-colors"
            >
              {wl.backHome}
            </button>
          </div>
        </main>
      )}

      {/* ─── PHASE 2 : ÉCRITURE ──────────────────────────────── */}
      {phase === 'writing' && (
        <>
          {/* ── GUIDE MODE: conversation ── */}
          {mode === 'guide' && guidePhase === 'chat' && (
            <main className="min-h-screen bg-[#1C1C2E] flex flex-col">
              <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-50" style={GRAIN} />

              {/* Header */}
              <header className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                <span className="font-display text-sm italic text-[#9C8E80]">
                  {chapter.title}
                </span>
                {/* Timer */}
                <span className={`text-xs tabular-nums transition-colors ${
                  timerDone ? 'text-[#C4622A] animate-pulse' :
                  timerWarning ? 'text-[#C4622A]/70' :
                  'text-[#9C8E80]/40'
                }`}>
                  {timerDisplay}
                  {sessionDuration > 0 && (
                    <span className="ml-1 text-[#9C8E80]/30">{wl.timeRemaining}</span>
                  )}
                </span>
                <button
                  onClick={() => router.push('/home')}
                  className="text-xs text-[#9C8E80]/40 hover:text-[#9C8E80] transition-colors"
                >
                  {wl.backHome}
                </button>
              </header>

              {/* Conversation */}
              <div
                ref={convoRef}
                className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5 max-w-2xl mx-auto w-full"
              >
                {guideConvo.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                        msg.role === 'assistant'
                          ? 'bg-[#FAF8F4]/8 text-[#FAF8F4] rounded-tl-sm font-display italic text-base'
                          : 'bg-[#C4622A]/20 text-[#EDE4D8] rounded-tr-sm border border-[#C4622A]/20'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Streaming AI response */}
                {(aiLoading || aiStreaming) && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-[#FAF8F4]/8 text-[#FAF8F4] rounded-2xl rounded-tl-sm px-5 py-3.5 font-display italic text-base leading-relaxed">
                      {aiLoading && !aiStreaming ? (
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      ) : aiStreaming}
                    </div>
                  </div>
                )}
              </div>

              {/* Create draft CTA (after 1+ answers) */}
              {userAnswerCount >= 1 && !aiLoading && (
                <div className="px-5 pb-2 max-w-2xl mx-auto w-full">
                  <button
                    onClick={generateGuideDraft}
                    className="w-full text-xs text-[#C4622A] border border-[#C4622A]/30 py-3 rounded-full hover:bg-[#C4622A]/10 transition-all tracking-wide"
                  >
                    {wl.createDraft}
                    {userAnswerCount < 2 && (
                      <span className="ml-2 text-[#9C8E80]/50">{wl.minHint}</span>
                    )}
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="px-5 pb-5 pt-3 border-t border-white/5 max-w-2xl mx-auto w-full">
                <div className="flex gap-3 items-end">
                  <textarea
                    value={guideInput}
                    onChange={(e) => setGuideInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendGuideAnswer()
                      }
                    }}
                    placeholder={wl.answerPlaceholder}
                    rows={2}
                    disabled={aiLoading}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#FAF8F4] text-sm placeholder:text-[#9C8E80]/40 resize-none outline-none focus:border-[#C4622A]/40 transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={sendGuideAnswer}
                    disabled={!guideInput.trim() || aiLoading}
                    className="text-xs bg-[#C4622A] text-white px-5 py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-30 shrink-0 h-[54px]"
                  >
                    {wl.sendAnswer}
                  </button>
                </div>
              </div>
            </main>
          )}

          {/* ── WRITING AREA (libre / dicte / guide after draft) ── */}
          {(mode !== 'guide' || guidePhase === 'write') && (
            <main className="min-h-screen bg-[#F5EFE0] flex flex-col relative">
              <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-40" style={GRAIN} />

              {/* Draft restored toast */}
              {draftRestored && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C2E] text-[#EDE4D8] text-xs px-4 py-2 rounded-full shadow-lg transition-opacity">
                  {wl.draftRestoredMsg}
                </div>
              )}

              {/* Auto-saved toast */}
              {draftSaved && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C2E]/80 text-[#9C8E80] text-xs px-4 py-2 rounded-full shadow-lg transition-opacity">
                  {wl.autoSaved}
                </div>
              )}

              {/* Header */}
              <header className="flex items-center justify-between px-6 py-4 shrink-0">
                <span className="font-display text-sm italic text-[#7A4F32]">{chapter.title}</span>

                {/* Timer */}
                <span className={`text-xs tabular-nums transition-colors ${
                  timerDone ? 'text-[#C4622A] font-medium' :
                  timerWarning ? 'text-[#C4622A]/70' :
                  'text-[#9C8E80]/60'
                }`}>
                  {phase === 'writing' && timerDisplay}
                  {sessionDuration > 0 && !timerDone && (
                    <span className="ml-1 text-[#9C8E80]/50 text-[10px]">{wl.timeRemaining}</span>
                  )}
                </span>

                <button
                  onClick={handleFinish}
                  className="text-xs text-[#7A4F32] hover:text-[#C4622A] transition-colors tracking-widest uppercase font-medium"
                >
                  {wordCount === 0 ? wl.backHome : wl.finish}
                </button>
              </header>

              {/* Guide draft note */}
              {mode === 'guide' && guidePhase === 'write' && (
                <div className="px-6 pb-3 max-w-2xl mx-auto w-full">
                  <p className="text-xs text-[#7A4F32] italic tracking-wide border-l-2 border-[#C4622A]/30 pl-3">
                    {wl.draftNote}
                  </p>
                </div>
              )}

              {/* Inspiration question banner (from Resources or Characters) */}
              {inspirationQ && (
                <div className="px-6 pb-4 max-w-2xl mx-auto w-full">
                  <div className="bg-[#1C1C2E]/5 rounded-xl px-4 py-3 border-l-2 border-[#C4622A]/40">
                    <p className="text-[10px] text-[#9C8E80] tracking-widest uppercase mb-1">
                      {lang === 'fr' ? 'Question de départ' : lang === 'es' ? 'Pregunta inicial' : 'Starting question'}
                    </p>
                    <p className="text-sm text-[#7A4F32] italic leading-relaxed">{inspirationQ}</p>
                  </div>
                </div>
              )}

              {/* Writing area */}
              <div className="flex-1 flex flex-col px-6 py-2 max-w-2xl mx-auto w-full">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value.replace(/—/g, '-'))}
                  placeholder={wl.placeholder}
                  className="flex-1 w-full bg-transparent resize-none outline-none text-[#1C1C2E] text-lg leading-[1.9] font-['DM_Sans'] placeholder:text-[#C4B9A8] selection:bg-[#C4622A]/20"
                  style={{ minHeight: 'calc(100vh - 180px)' }}
                />
              </div>

              {/* Footer */}
              <footer className="px-6 py-4 flex items-center justify-between max-w-2xl mx-auto w-full shrink-0">
                {/* Word count + Notes button */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-3 transition-opacity duration-500 ${wordCount >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-xs text-[#9C8E80]">
                      {wl.wordsUnit(wordCount)}
                    </span>
                    {/* Progress bar for duration mode */}
                    {sessionDuration > 0 && (
                    <div className="w-16 h-0.5 bg-[#C4B9A8]/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${timerDone ? 'bg-[#C4622A]' : 'bg-[#C4622A]/50'}`}
                        style={{ width: `${Math.min(100, (elapsedSeconds / (sessionDuration * 60)) * 100)}%` }}
                      />
                    </div>
                  )}
                  </div>
                  {/* Notes button - always visible */}
                  <button
                    onClick={() => setShowNotes(true)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      chapterNotes.trim()
                        ? 'border-[#7A4F32]/40 text-[#7A4F32] bg-[#7A4F32]/8'
                        : 'border-[#EDE4D8] text-[#C4B9A8] hover:border-[#7A4F32]/40 hover:text-[#7A4F32]'
                    }`}
                  >
                    {wl.notesBtn}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Dictée: voice + reformulate */}
                  {mode === 'dicte' && (
                    <>
                      <button
                        onClick={toggleVoice}
                        title={micError ? wl.micUnsupported : isListening ? wl.micStop : wl.micStart}
                        className={`text-xs px-4 py-2 rounded-full border transition-all ${
                          isListening
                            ? 'bg-[#C4622A] border-[#C4622A] text-white animate-pulse'
                            : micError
                            ? 'border-red-300/50 text-red-400/70'
                            : 'border-[#C4B9A8] text-[#9C8E80] hover:border-[#C4622A] hover:text-[#C4622A]'
                        }`}
                      >
                        {isListening ? wl.micStop : wl.micStart}
                      </button>
                      {wordCount >= 5 && (
                        <button
                          onClick={reformulate}
                          disabled={aiLoading}
                          className="text-xs px-4 py-2 rounded-full border border-[#C4622A]/40 text-[#C4622A] hover:bg-[#C4622A]/10 transition-all disabled:opacity-40"
                        >
                          {aiLoading && !showReform ? wl.thinking : wl.reformulate}
                        </button>
                      )}
                    </>
                  )}

                  {/* Libre: inspire */}
                  {mode === 'libre' && (
                    <button
                      onClick={inspire}
                      disabled={aiLoading}
                      className="text-xs px-4 py-2 rounded-full border border-[#C4B9A8] text-[#9C8E80] hover:border-[#C4622A] hover:text-[#C4622A] transition-all disabled:opacity-40"
                    >
                      {aiLoading && !showInspire ? wl.thinking : wl.inspire}
                    </button>
                  )}

                  {wordCount >= 5 && (
                    <button
                      onClick={handleFinish}
                      className={`text-xs text-white px-5 py-2 rounded-full transition-all shadow-sm ${
                        timerDone
                          ? 'bg-[#C4622A] animate-pulse shadow-[#C4622A]/30'
                          : 'bg-[#C4622A] hover:opacity-90 shadow-[#C4622A]/20'
                      }`}
                    >
                      {wl.finishSession}
                    </button>
                  )}
                </div>
              </footer>

              {/* ── SLIDE PANEL: Dictée Reformulate ── */}
              {showReform && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                  <div
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={() => setShowReform(false)}
                  />
                  <div className="relative bg-[#1C1C2E] rounded-t-3xl px-6 pt-6 pb-8 max-h-[60vh] flex flex-col">
                    <div className="pointer-events-none absolute inset-0 opacity-[0.03] rounded-t-3xl" style={GRAIN} />
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-display italic text-[#FAF8F4]">{wl.reformTitle}</p>
                      <button
                        onClick={() => setShowReform(false)}
                        className="text-xs text-[#9C8E80]/50 hover:text-[#9C8E80]"
                      >
                        {wl.closePanel}
                      </button>
                    </div>
                    <p className="text-xs text-[#9C8E80]/50 mb-4">{wl.reformDesc}</p>
                    <div className="flex-1 overflow-y-auto mb-5 pr-1">
                      {(aiLoading && !reformText) ? (
                        <div className="flex gap-1 items-center py-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <p className="text-[#FAF8F4] text-sm leading-relaxed font-display italic">
                          {reformText || aiStreaming}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={useReformulated}
                      disabled={!reformText}
                      className="w-full bg-[#C4622A] text-white text-sm py-3.5 rounded-full hover:opacity-90 transition-all disabled:opacity-30"
                    >
                      {wl.useThis}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SLIDE PANEL: Libre Inspire ── */}
              {showInspire && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                  <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    onClick={() => setShowInspire(false)}
                  />
                  <div className="relative bg-[#FAF8F4] border-t border-[#EDE4D8] rounded-t-3xl px-6 pt-6 pb-8 max-h-[50vh] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-display italic text-[#7A4F32]">
                        <span className="text-[#C4622A] mr-2">✦</span>
                        {wl.inspireTitle}
                      </p>
                      <button
                        onClick={() => setShowInspire(false)}
                        className="text-xs text-[#9C8E80]/50 hover:text-[#9C8E80]"
                      >
                        {wl.closePanel}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto mb-5">
                      {(aiLoading && !inspireText) ? (
                        <div className="flex gap-1 items-center py-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <p className="font-display text-xl italic text-[#1C1C2E] leading-relaxed">
                          {inspireText || aiStreaming}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={useInspiration}
                      disabled={!inspireText}
                      className="w-full bg-[#C4622A] text-white text-sm py-3.5 rounded-full hover:opacity-90 transition-all disabled:opacity-30"
                    >
                      {wl.inspireUse}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SLIDE PANEL: Revision Notes ── */}
              {showNotes && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end">
                  <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    onClick={() => setShowNotes(false)}
                  />
                  <div className="relative bg-[#FAF8F4] border-t border-[#EDE4D8] rounded-t-3xl px-6 pt-6 pb-8 max-h-[60vh] flex flex-col">
                    <div className="pointer-events-none absolute inset-0 opacity-[0.025] rounded-t-3xl" style={GRAIN} />
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-display italic text-[#7A4F32]">
                        <span className="text-[#7A4F32]/60 mr-2">✎</span>
                        {wl.notesTitle}
                      </p>
                      <button
                        onClick={() => setShowNotes(false)}
                        className="text-xs text-[#9C8E80]/50 hover:text-[#9C8E80]"
                      >
                        {wl.closePanel}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#C4B9A8] mb-3 tracking-wide">
                      {lang === 'fr' ? 'Ces notes ne font pas partie du texte - elles vous appartiennent.' : lang === 'es' ? 'Estas notas no forman parte del texto.' : 'These notes are private - not part of your text.'}
                    </p>
                    <textarea
                      autoFocus
                      value={chapterNotes}
                      onChange={e => setChapterNotes(e.target.value)}
                      placeholder={wl.notesPlaceholder}
                      className="flex-1 w-full bg-white border border-[#EDE4D8] rounded-2xl px-4 py-3 text-sm text-[#1C1C2E] placeholder:text-[#C4B9A8] outline-none resize-none focus:border-[#7A4F32]/30 transition-colors leading-relaxed"
                      rows={6}
                    />
                  </div>
                </div>
              )}
            </main>
          )}

          {/* Streaming overlay for guide draft generation */}
          {mode === 'guide' && guidePhase === 'chat' && displayStreaming && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#FAF8F4]/10 backdrop-blur-sm border border-white/10 text-[#FAF8F4] text-xs px-4 py-2 rounded-full pointer-events-none">
              {wl.thinking}
            </div>
          )}
        </>
      )}

      {/* ─── PHASE 3 : FIN ───────────────────────────────────── */}
      {phase === 'end' && (
        <main className="min-h-screen bg-[#FAF8F4] flex flex-col items-center justify-center px-6">
          <div className="pointer-events-none fixed inset-0 opacity-[0.025] z-50" style={GRAIN} />

          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full border-2 border-[#C4622A]/30 flex items-center justify-center mx-auto mb-8">
              <span className="text-[#C4622A] text-2xl">✦</span>
            </div>

            <p className="font-display text-7xl font-light text-[#1C1C2E] italic mb-2">
              {wordCount}
            </p>
            <p className="text-[#9C8E80] text-sm mb-2 tracking-wide">{wl.wordsToday}</p>

            {/* Session duration recap */}
            {elapsedSeconds > 0 && (
              <p className="text-[#9C8E80]/50 text-xs mb-8 tabular-nums">
                {formatTime(elapsedSeconds)}
              </p>
            )}

            <p className="font-display text-xl italic text-[#7A4F32] leading-relaxed mb-12 px-4">
              {sessionMsg}
            </p>

            <div className="bg-white rounded-2xl border border-[#EDE4D8] px-5 py-4 mb-5 text-left">
              <p className="text-xs text-[#9C8E80] tracking-wide mb-1">{wl.chapterDone}</p>
              <p className="font-display text-lg italic text-[#1C1C2E]">{chapter.title}</p>
            </div>

            {/* Email capture */}
            <div className="mb-5">
              {!emailCaptured ? (
                <div className="bg-[#FAF8F4] border border-[#EDE4D8] rounded-2xl px-5 py-4">
                  <p className="text-xs text-[#9C8E80] tracking-wide mb-3">{wl.captureTitle}</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitEmailCapture()}
                      placeholder={wl.capturePlaceholder}
                      className="flex-1 text-sm bg-white border border-[#EDE4D8] rounded-full px-4 py-2.5 outline-none focus:border-[#C4622A]/40 transition-colors text-[#1C1C2E] placeholder:text-[#C4B9A8]"
                    />
                    <button
                      onClick={submitEmailCapture}
                      disabled={emailCapturing || !emailInput.includes('@')}
                      className="text-xs text-[#C4622A] px-4 py-2.5 rounded-full border border-[#C4622A]/30 hover:bg-[#C4622A]/10 transition-all disabled:opacity-30 shrink-0"
                    >
                      {emailCapturing ? '…' : wl.captureSubmit}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#7A4F32] text-center py-3 font-display italic">{wl.captureDone}</p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-[#C4622A] text-white font-medium text-sm py-4 rounded-full hover:opacity-90 transition-all shadow-lg shadow-[#C4622A]/25 disabled:opacity-60 mb-3"
            >
              {isSaving ? wl.saving : wl.save}
            </button>

            <button
              onClick={() => {
                setFadeIn(false)
                setTimeout(() => { setPhase('writing'); setFadeIn(true) }, 450)
              }}
              className="w-full border border-[#EDE4D8] text-[#1C1C2E] text-sm py-4 rounded-full hover:border-[#9C8E80] transition-all"
            >
              {wl.continueWriting}
            </button>
          </div>
        </main>
      )}
    </div>
  )
}
