'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore } from '@/stores/memoir'
import type { TrameChapter } from '@/lib/mock/trame-data'

const GRAIN = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

type ConvoMsg = { role: 'user' | 'assistant'; content: string }
type Phase = 'chat' | 'generating' | 'done'

const GEN_MSGS = [
  'Je compose votre trame...',
  'Je structure les chapitres...',
  'Je choisis les prompts d\'ecriture...',
  'Votre plan editorial prend forme...',
]

export default function BrainstormPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const [phase, setPhase] = useState<Phase>('chat')
  const [convo, setConvo] = useState<ConvoMsg[]>(store.brainstormConversation || [])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStreaming, setAiStreaming] = useState('')
  const [genMsg, setGenMsg] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const convoRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const userMsgCount = convo.filter((m) => m.role === 'user').length
  const canGenerate = userMsgCount >= 4

  // Auto-scroll
  useEffect(() => {
    convoRef.current?.scrollTo({ top: convoRef.current.scrollHeight, behavior: 'smooth' })
  }, [convo, aiStreaming])

  // Start conversation
  useEffect(() => {
    if (convo.length === 0) askQuestion([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist conversation
  useEffect(() => {
    store.setBrainstormConversation(convo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convo])

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
      clearTimeout(timeout)
      setAiLoading(false)
      setAiStreaming('')
      return ''
    }
  }

  async function askQuestion(conversation: ConvoMsg[]) {
    const question = await streamAI({
      action: 'brainstorm_question',
      userName: store.userName,
      lang: store.lang,
      conversation,
      profile: store.profile,
      memories: store.memories.map((m) => m.content),
    })
    if (question) {
      setConvo([...conversation, { role: 'assistant', content: question }])
    }
  }

  async function handleSend() {
    if (!input.trim() || aiLoading) return
    const answer = input.trim()
    setInput('')
    const newConvo: ConvoMsg[] = [...convo, { role: 'user', content: answer }]
    setConvo(newConvo)
    await askQuestion(newConvo)
  }

  async function handleGenerate() {
    setPhase('generating')
    setError(null)

    const interval = setInterval(() => {
      setGenMsg((prev) => (prev + 1) % GEN_MSGS.length)
    }, 1500)

    try {
      const result = await streamAI({
        action: 'brainstorm_generate',
        userName: store.userName,
        lang: store.lang,
        conversation: convo,
        profile: store.profile,
        memories: store.memories.map((m) => m.content),
      })

      // Parse JSON trame from AI (strip markdown fences if present)
      const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error('[brainstorm] Could not parse trame from:', result.slice(0, 200))
        throw new Error('Could not parse trame')
      }

      const parsed = JSON.parse(jsonMatch[0]) as Partial<TrameChapter>[]
      const chapters: TrameChapter[] = parsed.map((ch, i) => ({
        id: `ch-${i + 1}`,
        number: i + 1,
        title: ch.title || `Chapitre ${i + 1}`,
        subtitle: ch.subtitle || '',
        theme: ch.theme || '',
        prompt: ch.prompt || '',
        quote: ch.quote || '',
        quoteAuthor: ch.quoteAuthor || '',
        status: 'unwritten' as const,
      }))

      store.setChapters(chapters)
      store.clearBrainstormConversation()

      // Save to DB (fire-and-forget)
      fetch('/api/save-trame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: store.userId,
          userName: store.userName,
          chapters,
        }),
      }).catch(() => {})

      setPhase('done')
      setTimeout(() => router.push('/trame'), 1500)
    } catch (err: any) {
      setError(err.message || 'Erreur de generation')
      setPhase('chat')
    } finally {
      clearInterval(interval)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Bouncing dots
  const Dots = () => (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#C4622A] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  )

  if (phase === 'generating') {
    return (
      <main className="min-h-screen bg-[#1C1C2E] text-[#FAF8F4] relative flex items-center justify-center">
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={GRAIN} />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-2 border-[#C4622A] border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          <p className="font-display text-xl italic animate-pulse">{GEN_MSGS[genMsg]}</p>
        </div>
      </main>
    )
  }

  if (phase === 'done') {
    return (
      <main className="min-h-screen bg-[#1C1C2E] text-[#FAF8F4] relative flex items-center justify-center">
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={GRAIN} />
        <div className="relative z-10 text-center">
          <p className="font-display text-3xl font-bold italic mb-3">Votre trame est prete.</p>
          <p className="text-[#9C8E80]">Redirection...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#1C1C2E] text-[#FAF8F4] relative flex flex-col">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={GRAIN} />

      {/* Header */}
      <div className="relative z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <button onClick={() => router.push('/trame')} className="text-[#9C8E80] text-sm hover:text-[#FAF8F4] transition-colors">
          ← Retour
        </button>
        <div className="text-center">
          <p className="font-display text-sm font-semibold">Esquisse de votre trame</p>
          <p className="text-[#9C8E80] text-xs">{userMsgCount}/4 echanges min.</p>
        </div>
        {canGenerate ? (
          <button
            onClick={handleGenerate}
            disabled={aiLoading}
            className="px-4 py-2 rounded-full bg-[#C4622A] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Composer ma trame
          </button>
        ) : (
          <div className="w-[160px]" />
        )}
      </div>

      {/* Conversation */}
      <div ref={convoRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 relative z-10">
        {convo.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#C4622A] text-white rounded-br-md'
                : 'bg-white/10 text-[#FAF8F4] rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {aiLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md"><Dots /></div>
          </div>
        )}
        {aiStreaming && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md text-sm leading-relaxed max-w-[80%]">
              {aiStreaming}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center px-6 relative z-10">{error}</p>
      )}

      {/* Input */}
      <div className="relative z-10 px-6 py-4 border-t border-white/10">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre reponse..."
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#FAF8F4] placeholder:text-[#9C8E80] outline-none focus:border-[#C4622A] resize-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || aiLoading}
            className="px-5 py-3 rounded-xl bg-[#C4622A] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          >
            Envoyer
          </button>
        </div>
      </div>
    </main>
  )
}
