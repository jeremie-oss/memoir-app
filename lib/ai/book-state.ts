// Memoir — Book State
// État partagé entre tous les agents. Construit depuis le store Zustand.
// Envoyé en contexte à chaque appel API agent.

import type { MemoirState, Character, TimelineEvent } from '@/stores/memoir'

export type BookGap = {
  chapterId: string
  type: 'missing_chapter' | 'undefined_character' | 'timeline_gap' | 'style_drift'
  description: string
  priority: 'high' | 'medium' | 'low'
}

export type AgentSuggestion = {
  id: string
  agentId: 'relecteur' | 'architecte' | 'archiviste'
  type: string
  passage?: string       // citation du texte concerné
  explication: string
  suggestion: string
  chapterId?: string
  dismissed: boolean
  date: string           // ISO
}

export type BookState = {
  // Identité
  userName: string
  lang: 'fr' | 'en' | 'es'
  intention: string
  destinataire: string
  ton: string

  // Plan éditorial
  chapters: {
    id: string
    title: string
    theme: string
    status: string
    wordCount: number
    summary?: string
  }[]

  // Registre des personnages
  characters: Character[]

  // Ligne temporelle
  timelineEvents: TimelineEvent[]

  // Empreinte de style
  styleFingerprint?: string

  // Lacunes
  gaps: BookGap[]

  // Résumés de sessions (pas le texte complet — pour garder le contexte léger)
  sessionSummaries: {
    chapterId: string
    chapterTitle: string
    date: string
    excerpt: string     // 200 premiers caractères
    wordCount: number
  }[]
}

// Construit le BookState depuis le store Zustand
export function buildBookState(store: Pick<
  MemoirState,
  'userName' | 'lang' | 'profile' | 'chapters' | 'characters' |
  'timelineEvents' | 'sessions' | 'styleFingerprint' | 'bookGaps'
>): BookState {
  const sessionSummaries = store.sessions.map(s => {
    const chapter = store.chapters.find(ch => ch.id === s.chapterId)
    return {
      chapterId: s.chapterId,
      chapterTitle: chapter?.title ?? s.chapterId,
      date: s.date,
      excerpt: s.content.slice(0, 200),
      wordCount: s.wordCount,
    }
  })

  const chapterWordCounts = store.sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.chapterId] = (acc[s.chapterId] ?? 0) + s.wordCount
    return acc
  }, {})

  return {
    userName: store.userName,
    lang: store.lang,
    intention: store.profile.intention,
    destinataire: store.profile.destinataire,
    ton: store.profile.ton,

    chapters: store.chapters.map(ch => ({
      id: ch.id,
      title: ch.title,
      theme: ch.theme,
      status: ch.status ?? 'unwritten',
      wordCount: chapterWordCounts[ch.id] ?? 0,
    })),

    characters: store.characters,
    timelineEvents: store.timelineEvents,
    styleFingerprint: store.styleFingerprint,
    gaps: store.bookGaps ?? [],
    sessionSummaries,
  }
}

// Sérialise le BookState en texte compact pour les prompts
export function serializeBookState(bs: BookState): string {
  const chapterProgress = bs.chapters.map(ch =>
    `- ${ch.title} [${ch.status}] ${ch.wordCount > 0 ? `~${ch.wordCount} mots` : 'vide'}`
  ).join('\n')

  const characterList = bs.characters.length > 0
    ? bs.characters.map(c => `- ${c.name} (${c.relation}${c.period ? `, ${c.period}` : ''})`).join('\n')
    : 'Aucun personnage enregistré.'

  const timeline = bs.timelineEvents.length > 0
    ? bs.timelineEvents.map(e => `- ${e.date} : ${e.title}`).join('\n')
    : 'Aucun événement enregistré.'

  const recentSessions = bs.sessionSummaries.slice(-5).map(s =>
    `[${s.chapterTitle} — ${s.date.slice(0, 10)}] ${s.excerpt}…`
  ).join('\n\n')

  const gaps = bs.gaps.filter(g => g.priority === 'high').map(g =>
    `- ${g.description}`
  ).join('\n') || 'Aucune lacune critique.'

  return [
    `AUTEUR : ${bs.userName} | Langue : ${bs.lang}`,
    `Intention : ${bs.intention} | Pour : ${bs.destinataire} | Ton : ${bs.ton}`,
    bs.styleFingerprint ? `\nSTYLE DE L'AUTEUR :\n${bs.styleFingerprint}` : '',
    `\nCHAPITRES :\n${chapterProgress}`,
    `\nPERSONNAGES :\n${characterList}`,
    `\nCHRONOLOGIE :\n${timeline}`,
    recentSessions ? `\nDERNIÈRS PASSAGES :\n${recentSessions}` : '',
    `\nLACUNES PRIORITAIRES :\n${gaps}`,
  ].filter(Boolean).join('\n')
}

// Retourne les chapitres vides (pas encore écrits)
export function getEmptyChapters(bs: BookState) {
  return bs.chapters.filter(ch => ch.wordCount === 0)
}

// Retourne les 3 derniers passages (pour cohérence stylistique Écrivain)
export function getRecentPassages(store: Pick<MemoirState, 'sessions'>, limit = 3): string[] {
  return store.sessions
    .slice(-limit)
    .map(s => s.content.slice(0, 500))
}
