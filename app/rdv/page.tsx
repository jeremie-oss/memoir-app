'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore } from '@/stores/memoir'
import { useNotifications } from '@/hooks/useNotifications'

type ConvoMsg = { role: 'user' | 'assistant'; content: string }

const GRAIN = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

type Phase = 'schedule' | 'entretien' | 'close'

export default function RdvPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const notifs = useNotifications()

  const [phase, setPhase] = useState<Phase>('schedule')
  const [rdvDate, setRdvDate] = useState('')
  const [rdvTime, setRdvTime] = useState('20:00')
  const [convo, setConvo] = useState<ConvoMsg[]>([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStreaming, setAiStreaming] = useState('')
  const [seeds, setSeeds] = useState('')
  const convoRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Default date = today
  useEffect(() => {
    const today = new Date()
    setRdvDate(today.toISOString().slice(0, 10))
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (convoRef.current) convoRef.current.scrollTop = convoRef.current.scrollHeight
  }, [convo, aiStreaming])

  const lang = store.lang

  async function streamAI(payload: object): Promise<string> {
    setAiLoading(true)
    setAiStreaming('')
    try {
      const res = await fetch('/api/memoir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok || !res.body) { setAiLoading(false); return '' }
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
      return result
    } catch {
      setAiLoading(false)
      setAiStreaming('')
      return ''
    }
  }

  async function startEntretien() {
    // Save RDV in store
    const dt = `${rdvDate}T${rdvTime}:00`
    store.setNextRdv(dt)

    // Schedule notification at RDV time
    if (notifs.enabled) {
      // Already scheduled via hook — just confirm
    }

    setPhase('entretien')

    const question = await streamAI({
      action: 'entretien_question',
      userName: store.userName,
      lang,
      conversation: [],
      sessions: store.sessions,
      profile: store.profile,
    })
    if (question) setConvo([{ role: 'assistant', content: question }])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function sendAnswer() {
    if (!input.trim() || aiLoading) return
    const answer = input.trim()
    setInput('')
    const newConvo: ConvoMsg[] = [...convo, { role: 'user', content: answer }]
    setConvo(newConvo)

    const question = await streamAI({
      action: 'entretien_question',
      userName: store.userName,
      lang,
      conversation: newConvo,
      sessions: store.sessions,
      profile: store.profile,
    })
    if (question) setConvo([...newConvo, { role: 'assistant', content: question }])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function closeEntretien() {
    if (aiLoading) return
    const result = await streamAI({
      action: 'entretien_close',
      userName: store.userName,
      lang,
      conversation: convo,
    })
    setSeeds(result)
    setPhase('close')
  }

  function downloadIcs() {
    const dt = `${rdvDate}T${rdvTime}:00`
    const start = dt.replace(/[-:]/g, '').slice(0, 15) + '00'
    const end = new Date(new Date(dt).getTime() + 60 * 60 * 1000)
      .toISOString().replace(/[-:]/g, '').slice(0, 15) + '00'

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Memoir//RDV//FR',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:RDV Memoir — Entretien biographique`,
      `DESCRIPTION:Votre rendez-vous d'écriture avec Memoir.`,
      `URL:http://localhost:3000/rdv`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rdv-memoir.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  const userAnswerCount = convo.filter((m) => m.role === 'user').length
  const greetingByLang = {
    fr: { title: 'Votre RDV Memoir', sub: 'Un entretien avec votre biographe personnel', start: 'Commencer l\'entretien →', schedule: 'Planifier', addCal: '+ Ajouter à mon agenda', close: 'Clore l\'entretien', closeHint: 'min. 3 échanges recommandés', closing: 'Je synthétise…', seedsTitle: 'Graines pour votre prochain chapitre', seedsDesc: 'Ces thèmes ont émergé de notre conversation.', goWrite: 'Écrire maintenant →', goHome: '← Revenir à l\'accueil', answerPh: 'Votre réponse…', send: 'Envoyer →' },
    en: { title: 'Your Memoir Appointment', sub: 'A conversation with your personal biographer', start: 'Begin the interview →', schedule: 'Schedule', addCal: '+ Add to calendar', close: 'Close the interview', closeHint: 'min. 3 exchanges recommended', closing: 'Synthesizing…', seedsTitle: 'Seeds for your next chapter', seedsDesc: 'These themes emerged from our conversation.', goWrite: 'Write now →', goHome: '← Back to home', answerPh: 'Your answer…', send: 'Send →' },
    es: { title: 'Tu Cita Memoir', sub: 'Una conversación con tu biógrafo personal', start: 'Comenzar la entrevista →', schedule: 'Programar', addCal: '+ Añadir al calendario', close: 'Cerrar la entrevista', closeHint: 'mín. 3 intercambios recomendados', closing: 'Sintetizando…', seedsTitle: 'Semillas para tu próximo capítulo', seedsDesc: 'Estos temas surgieron de nuestra conversación.', goWrite: 'Escribir ahora →', goHome: '← Volver al inicio', answerPh: 'Tu respuesta…', send: 'Enviar →' },
  }
  const wl = greetingByLang[lang]

  return (
    <div className="min-h-screen bg-[#1C1C2E] flex flex-col">
      <div className="pointer-events-none fixed inset-0 opacity-[0.04] z-50" style={GRAIN} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
        <span className="font-display text-sm italic text-[#9C8E80]">
          {phase === 'schedule' ? wl.title : phase === 'entretien' ? store.userName : wl.seedsTitle}
        </span>
        <button
          onClick={() => router.push('/home')}
          className="text-xs text-[#9C8E80] hover:text-[#FAF8F4] transition-colors"
        >
          {wl.goHome}
        </button>
      </header>

      {/* ── PHASE 1 : SCHEDULE ── */}
      {phase === 'schedule' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="max-w-sm w-full text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full border border-[#C4622A]/30 flex items-center justify-center mx-auto mb-8">
              <span className="text-[#C4622A] text-2xl font-display">◈</span>
            </div>

            <h1 className="font-display text-3xl italic text-[#FAF8F4] mb-3">{wl.title}</h1>
            <p className="text-[#9C8E80] text-sm mb-10 leading-relaxed">{wl.sub}</p>

            {/* Date + time pickers */}
            <div className="flex gap-3 mb-8">
              <div className="flex-1">
                <label className="text-[10px] text-[#9C8E80]/50 tracking-widest uppercase block mb-2">Date</label>
                <input
                  type="date"
                  value={rdvDate}
                  onChange={e => setRdvDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#FAF8F4] text-sm outline-none focus:border-[#C4622A]/40 transition-colors [color-scheme:dark]"
                />
              </div>
              <div className="w-32">
                <label className="text-[10px] text-[#9C8E80]/50 tracking-widest uppercase block mb-2">Heure</label>
                <input
                  type="time"
                  value={rdvTime}
                  onChange={e => setRdvTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#FAF8F4] text-sm outline-none focus:border-[#C4622A]/40 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Add to calendar */}
            <button
              onClick={downloadIcs}
              className="w-full text-xs text-[#9C8E80] border border-white/10 py-3 rounded-full hover:border-white/20 hover:text-[#FAF8F4]/70 transition-all mb-4"
            >
              {wl.addCal}
            </button>

            {/* Start now */}
            <button
              onClick={startEntretien}
              className="w-full bg-[#C4622A] text-white text-sm py-4 rounded-full hover:opacity-90 transition-all shadow-lg shadow-[#C4622A]/25"
            >
              {wl.start}
            </button>
          </div>
        </main>
      )}

      {/* ── PHASE 2 : ENTRETIEN ── */}
      {phase === 'entretien' && (
        <main className="flex-1 flex flex-col">
          {/* Conversation */}
          <div
            ref={convoRef}
            className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5 max-w-2xl mx-auto w-full"
          >
            {convo.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-[#FAF8F4]/8 text-[#FAF8F4] rounded-tl-sm font-display italic text-base'
                    : 'bg-[#C4622A]/20 text-[#EDE4D8] rounded-tr-sm border border-[#C4622A]/20'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

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

          {/* Close CTA */}
          {userAnswerCount >= 2 && !aiLoading && (
            <div className="px-5 pb-2 max-w-2xl mx-auto w-full">
              <button
                onClick={closeEntretien}
                className="w-full text-xs text-[#C4622A] border border-[#C4622A]/30 py-3 rounded-full hover:bg-[#C4622A]/10 transition-all"
              >
                {wl.close}
              </button>
            </div>
          )}

          {/* Input */}
          <div className="px-5 pb-5 pt-3 border-t border-white/5 max-w-2xl mx-auto w-full">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer() }
                }}
                placeholder={wl.answerPh}
                rows={2}
                disabled={aiLoading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#FAF8F4] text-sm placeholder:text-[#9C8E80]/40 resize-none outline-none focus:border-[#C4622A]/40 transition-colors disabled:opacity-50"
              />
              <button
                onClick={sendAnswer}
                disabled={!input.trim() || aiLoading}
                className="text-xs bg-[#C4622A] text-white px-5 py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-30 shrink-0 h-[54px]"
              >
                {wl.send}
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ── PHASE 3 : CLOSE / SEEDS ── */}
      {phase === 'close' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="max-w-md w-full">
            <div className="w-12 h-12 rounded-full border border-[#C4622A]/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-[#C4622A]">✦</span>
            </div>
            <h2 className="font-display text-2xl italic text-[#FAF8F4] text-center mb-2">{wl.seedsTitle}</h2>
            <p className="text-[#9C8E80] text-xs text-center mb-8">{wl.seedsDesc}</p>

            <div className="bg-[#FAF8F4]/5 border border-white/10 rounded-2xl px-6 py-5 mb-8">
              {seeds ? (
                <p className="text-[#FAF8F4] text-sm leading-relaxed font-display italic whitespace-pre-line">
                  {seeds}
                </p>
              ) : (
                <div className="flex gap-1 items-center py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9C8E80] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/home')}
              className="w-full bg-[#C4622A] text-white text-sm py-4 rounded-full hover:opacity-90 transition-all shadow-lg shadow-[#C4622A]/25 mb-3"
            >
              {wl.goWrite}
            </button>
            <button
              onClick={() => router.push('/home')}
              className="w-full border border-white/10 text-[#9C8E80] text-sm py-4 rounded-full hover:border-white/20 transition-all"
            >
              {wl.goHome}
            </button>
          </div>
        </main>
      )}
    </div>
  )
}
