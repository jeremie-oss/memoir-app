// Memoir — Client Archiviste
// Fonctions appelées côté client après chaque sauvegarde de session.
// Toutes les opérations sont fire-and-forget (non bloquantes pour l'UX).

import { buildBookState, serializeBookState, getRecentPassages } from './book-state'
import type { MemoirState } from '@/stores/memoir'

type ArchivisteUpdateResult = {
  characters: { name: string; relation: string; period: string }[]
  events: { date: string; title: string; description: string }[]
  contradictions: { type: string; description: string }[]
}

type ArchivisteGapsResult = {
  chapterId: string
  type: 'missing_chapter' | 'undefined_character' | 'timeline_gap' | 'style_drift'
  description: string
  priority: 'high' | 'medium' | 'low'
}[]

// Appelle archiviste_update après une session validée
// Retourne les données extraites (le store est mis à jour par l'appelant)
export async function runArchivisteUpdate(
  store: Pick<MemoirState,
    'userName' | 'lang' | 'profile' | 'chapters' | 'characters' |
    'timelineEvents' | 'sessions' | 'styleFingerprint' | 'bookGaps' | 'bookFoundations'
  >,
  newContent: string,
  lang: 'fr' | 'en' | 'es'
): Promise<ArchivisteUpdateResult | null> {
  try {
    const bookState = buildBookState(store)
    const bookStateText = serializeBookState(bookState)

    const res = await fetch('/api/memoir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'archiviste_update',
        userName: store.userName,
        lang,
        content: newContent,
        bookStateText,
        bookFoundations: store.bookFoundations,
      }),
    })

    if (!res.ok) return null

    const text = await res.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0]) as ArchivisteUpdateResult
  } catch {
    return null
  }
}

// Appelle archiviste_gaps pour détecter les lacunes du livre
export async function runArchivisteGaps(
  store: Pick<MemoirState,
    'userName' | 'lang' | 'profile' | 'chapters' | 'characters' |
    'timelineEvents' | 'sessions' | 'styleFingerprint' | 'bookGaps' | 'bookFoundations'
  >,
  lang: 'fr' | 'en' | 'es'
): Promise<ArchivisteGapsResult | null> {
  try {
    const bookState = buildBookState(store)
    const bookStateText = serializeBookState(bookState)

    const res = await fetch('/api/memoir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'archiviste_gaps',
        userName: store.userName,
        lang,
        bookStateText,
      }),
    })

    if (!res.ok) return null

    const text = await res.text()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0]) as ArchivisteGapsResult
  } catch {
    return null
  }
}

// Appelle archiviste_style pour extraire l'empreinte stylistique
// Déclenché après la 2e session validée
export async function runArchivisteStyle(
  store: Pick<MemoirState, 'userName' | 'lang' | 'sessions'>,
  lang: 'fr' | 'en' | 'es'
): Promise<string | null> {
  try {
    const passages = getRecentPassages(store, 5)
    if (passages.length < 2) return null // pas assez de matériau

    const allSessions = passages.join('\n\n---\n\n')

    const res = await fetch('/api/memoir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'archiviste_style',
        userName: store.userName,
        lang,
        allSessions,
      }),
    })

    if (!res.ok) return null

    // archiviste_style renvoie du texte plain (pas du JSON, pas du streaming)
    return await res.text()
  } catch {
    return null
  }
}

// Appelle relecteur_review après une session validée
// Retourne les suggestions (à ajouter au store par l'appelant)
export async function runRelecteurReview(
  store: Pick<MemoirState, 'userName' | 'lang' | 'sessions'>,
  newContent: string,
  chapterId: string,
  lang: 'fr' | 'en' | 'es'
): Promise<{ reviews: { type: string; passage: string; explication: string; suggestion: string }[] } | null> {
  try {
    const allSessions = store.sessions
      .filter(s => s.chapterId !== chapterId) // exclude the new one (sent separately as content)
      .map(s => s.content)
      .join('\n\n---\n\n')

    const res = await fetch('/api/memoir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'relecteur_review',
        userName: store.userName,
        lang,
        content: newContent,
        allSessions,
      }),
    })

    if (!res.ok) return null

    const text = await res.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}
