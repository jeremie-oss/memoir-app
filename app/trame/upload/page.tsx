'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore, type MemorySeed } from '@/stores/memoir'
import UploadDropZone from '@/components/UploadDropZone'

const GRAIN = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

const ANALYZE_MSGS = [
  'Je lis vos notes...',
  'Je cherche les fils de votre histoire...',
  "J'identifie les thèmes et personnages...",
  'Je prépare vos graines mémorielles...',
]

type Phase = 'select' | 'analyzing' | 'seeds'
type Seed = { content: string; tags: string[]; theme: string }

export default function UploadPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const [phase, setPhase] = useState<Phase>('select')
  const [fileName, setFileName] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [seeds, setSeeds] = useState<Seed[]>([])
  const [analyzeMsg, setAnalyzeMsg] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file')
  const [pastedText, setPastedText] = useState('')

  async function analyzeText(text: string, sourceName: string) {
    setPhase('analyzing')
    setFileName(sourceName)
    setError(null)

    const wc = text.trim().split(/\s+/).filter(Boolean).length
    setWordCount(wc)

    const interval = setInterval(() => {
      setAnalyzeMsg((prev) => (prev + 1) % ANALYZE_MSGS.length)
    }, 1500)

    try {
      const analyzeRes = await fetch('/api/memoir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_analyze',
          content: text.slice(0, 8000),
          userName: store.userName,
          lang: store.lang,
        }),
      })
      if (!analyzeRes.ok || !analyzeRes.body) {
        const errText = await analyzeRes.text().catch(() => '')
        throw new Error(errText || 'Analysis failed')
      }

      const reader = analyzeRes.body.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
      }

      // Strip markdown code fences and parse JSON robustly
      const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        let jsonStr = jsonMatch[0]
        try {
          const parsed = JSON.parse(jsonStr) as Seed[]
          setSeeds(parsed)
        } catch {
          // AI sometimes produces malformed JSON — try to fix common issues
          jsonStr = jsonStr
            .replace(/,\s*}/g, '}')      // trailing comma before }
            .replace(/,\s*\]/g, ']')     // trailing comma before ]
            .replace(/[\x00-\x1F]/g, ' ') // control chars
            .replace(/\t/g, ' ')
          try {
            const parsed = JSON.parse(jsonStr) as Seed[]
            setSeeds(parsed)
          } catch (e2) {
            console.error('[upload] JSON parse failed after cleanup:', (e2 as Error).message, jsonStr.slice(0, 300))
            throw new Error('Format de réponse invalide. Réessayez.')
          }
        }
      } else {
        console.error('[upload] No JSON array found in:', result.slice(0, 300))
        throw new Error('Analyse impossible. Réessayez.')
      }

      setPhase('seeds')
    } catch (err: any) {
      console.error('[upload] Error:', err)
      setError(err.message || 'Erreur lors de l\'analyse')
      setPhase('select')
    } finally {
      clearInterval(interval)
    }
  }

  async function handlePaste() {
    if (!pastedText.trim()) return
    await analyzeText(pastedText, 'Texte collé')
  }

  async function handleFile(file: File) {
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const extractRes = await fetch('/api/upload-notes', { method: 'POST', body: formData })
      const extractData = await extractRes.json()
      if (!extractRes.ok) throw new Error(extractData.error || 'Extraction failed')
      await analyzeText(extractData.text, file.name)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'extraction')
      setPhase('select')
    }
  }

  function handleRemoveSeed(index: number) {
    setSeeds((prev) => prev.filter((_, i) => i !== index))
  }

  function handleContinue() {
    // Save seeds to store
    store.addMemories(seeds.map((s) => ({ ...s, source: 'upload' as const })))

    // Save to DB (fire-and-forget)
    fetch('/api/save-memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: store.userId,
        userName: store.userName,
        seeds,
      }),
    }).catch(() => {})

    router.push('/trame/brainstorm')
  }

  return (
    <main className="min-h-screen bg-[#1C1C2E] text-[#FAF8F4] relative">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={GRAIN} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <button onClick={() => router.push('/trame')} className="text-[#9C8E80] text-sm mb-10 hover:text-[#FAF8F4] transition-colors">
          ← Retour à la trame
        </button>

        <h1 className="font-display text-4xl font-bold italic mb-3">
          Importez vos notes
        </h1>
        <p className="text-[#9C8E80] text-lg mb-10">
          Textes déjà écrits, brouillons, journaux... Je vais y trouver les fils de votre histoire.
        </p>

        {/* Phase: Select */}
        {phase === 'select' && (
          <>
            {/* Toggle file / paste */}
            <div className="flex gap-1 mb-6">
              <button
                onClick={() => setInputMode('file')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  inputMode === 'file' ? 'bg-[#C4622A] text-white' : 'bg-white/10 text-[#9C8E80] hover:text-[#FAF8F4]'
                }`}
              >
                Fichier
              </button>
              <button
                onClick={() => setInputMode('paste')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  inputMode === 'paste' ? 'bg-[#C4622A] text-white' : 'bg-white/10 text-[#9C8E80] hover:text-[#FAF8F4]'
                }`}
              >
                Coller du texte
              </button>
            </div>

            {inputMode === 'file' ? (
              <UploadDropZone onFileSelect={handleFile} />
            ) : (
              <div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Collez vos notes, brouillons ou textes ici..."
                  rows={10}
                  className="w-full bg-white/5 border border-white/20 rounded-2xl p-5 text-sm text-[#FAF8F4] placeholder:text-[#9C8E80]/50 outline-none focus:border-[#C4622A] resize-none transition-colors leading-relaxed"
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[#9C8E80] text-xs">
                    {pastedText.trim().split(/\s+/).filter(Boolean).length} mots
                  </p>
                  <button
                    onClick={handlePaste}
                    disabled={!pastedText.trim()}
                    className="px-6 py-2.5 rounded-full bg-[#C4622A] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
                  >
                    Analyser
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
          </>
        )}

        {/* Phase: Analyzing */}
        {phase === 'analyzing' && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-2 border-[#C4622A] border-t-transparent rounded-full animate-spin mx-auto mb-8" />
            <p className="font-display text-xl italic text-[#FAF8F4] animate-pulse">
              {ANALYZE_MSGS[analyzeMsg]}
            </p>
            <p className="text-[#9C8E80] text-sm mt-3">{fileName}</p>
          </div>
        )}

        {/* Phase: Seeds */}
        {phase === 'seeds' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[#9C8E80] text-sm">
                {seeds.length} graines trouvées · {wordCount} mots analysés
              </p>
              <button
                onClick={() => { setPhase('select'); setSeeds([]); setError(null) }}
                className="text-[#C4622A] text-sm hover:opacity-80"
              >
                + Ajouter un document
              </button>
            </div>

            <div className="space-y-3 mb-10">
              {seeds.map((seed, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-[#FAF8F4] text-sm leading-relaxed">{seed.content}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#C4622A]/20 text-[#C4622A]">
                          {seed.theme}
                        </span>
                        {seed.tags.map((tag, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[#9C8E80]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSeed(i)}
                      className="text-[#9C8E80] hover:text-red-400 ml-3 text-lg"
                    >
                      x
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleContinue}
              className="w-full py-4 rounded-full bg-[#C4622A] text-white font-medium text-base transition-all hover:opacity-90 shadow-lg"
            >
              Continuer vers le brainstorm →
            </button>

            <button
              onClick={() => router.push('/trame/brainstorm')}
              className="w-full py-3 text-[#9C8E80] text-sm mt-3 hover:text-[#FAF8F4] transition-colors"
            >
              Passer directement au brainstorm
            </button>
          </>
        )}
      </div>
    </main>
  )
}
