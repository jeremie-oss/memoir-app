import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TRAME_CHAPTERS, type TrameChapter } from '@/lib/mock/trame-data'
import type { BookGap, AgentSuggestion } from '@/lib/ai/book-state'

export type WritingSession = {
  chapterId: string
  wordCount: number
  content: string
  date: string // ISO date
  notes?: string // revision notes / comments on the draft
}

export type Character = {
  id: string
  name: string
  relation: string // e.g. 'parent', 'ami', 'amour', 'mentor', 'enfant', 'frère/sœur', etc.
  period?: string  // free text: "Actuel", "1975-1985", "Amour de jeunesse", "Décédé 2010"
  notes: string
}

export type ResearchNote = {
  id: string
  type: 'research' | 'verify' | 'ask' | 'idea'
  text: string
  done: boolean
}

export type TimelineEvent = {
  id: string
  date: string   // free text: "1975", "Été 1982", "Mars 2001", etc.
  title: string
  description: string
}

export type MemorySeed = {
  id: string
  content: string
  tags: string[]
  theme: string
  source: 'upload' | 'brainstorm' | 'entretien'
}

export type ConvoMsg = { role: 'user' | 'assistant'; content: string }

export type WritingModeId = 'libre' | 'guide' | 'dicte' | 'entretien'

export type OnboardingProfile = {
  intention: string          // id choisi ou texte libre
  destinataire: string       // id choisi
  destinatairePrenom: string // prénom optionnel
  ton: '' | 'romance' | 'biographique' | 'documentaire'
  styleExtrait: string       // extrait IA choisi
  frequence: '' | 'quotidien' | 'hebdo' | 'libre'
  duree: 0 | 15 | 30 | 45
  role: '' | 'auteur' | 'accompagnateur'  // auteur = j'écris / accompagnateur = j'aide quelqu'un
  subjectName: string                      // prénom du sujet (mode accompagnateur)
}

export type MemoirState = {
  // Langue
  lang: 'fr' | 'en' | 'es' | 'tr'

  // Rituel d'écriture
  writingMode: WritingModeId
  manifestoSeen: boolean

  // Infos utilisateur
  userId: string // persistent UUID for DB operations
  userName: string
  profile: OnboardingProfile
  onboardingComplete: boolean

  // (legacy - kept for compat)
  onboardingAnswers: {
    why: string
    for_whom: string
    memory: string
    unsaid: string
  }

  // Trame narrative
  chapters: TrameChapter[]
  trameCustom: boolean

  // Memories (seeds from uploads/brainstorm)
  memories: MemorySeed[]
  brainstormConversation: ConvoMsg[]

  // Sessions d'écriture
  sessions: WritingSession[]

  // Streak
  currentStreak: number
  lastWrittenDate: string | null

  // Notifications
  notifications: {
    enabled: boolean
    hour: number        // 0-23 - heure préférée
    nudgeEnabled: boolean  // adaptive nudge si silence > cadence
  }

  // RDV Memoir
  nextRdv: string | null  // ISO datetime

  // Personnages
  characters: Character[]

  // Chronologie
  timelineEvents: TimelineEvent[]

  // Notes de recherche
  researchNotes: ResearchNote[]

  // Citations sauvegardées (7.2)
  savedQuotes: string[]

  // Agents — Book State enrichi
  styleFingerprint?: string           // empreinte stylistique extraite par l'Archiviste
  bookGaps: BookGap[]                 // lacunes détectées (chapitres, personnages, chronologie)
  agentSuggestions: AgentSuggestion[] // suggestions Relecteur / Architecte en attente

  // Fondations du livre (co-construites avant la première séance)
  bookFoundations: {
    period: string          // ex. "Mon enfance à Lyon, 1960–1980"
    keyPeople: string       // ex. "Ma mère Suzanne, mon ami Pierre"
    theme: string           // ex. "La transmission familiale"
    ambition: string        // ex. "Que mes petits-enfants comprennent d'où ils viennent"
  } | null
  foundationsComplete: boolean

  // Profil temporel (pour détection anachronismes)
  bornYear: number | null             // année de naissance de l'auteur (ou du sujet en mode accompagnateur)

  // Actions
  setLang: (lang: 'fr' | 'en' | 'es' | 'tr') => void
  setWritingMode: (mode: WritingModeId) => void
  setManifestoSeen: () => void
  setUserId: (id: string) => void
  setUserName: (name: string) => void
  setProfile: (updates: Partial<OnboardingProfile>) => void
  setOnboardingAnswer: (key: keyof MemoirState['onboardingAnswers'], value: string) => void
  completeOnboarding: () => void
  saveSession: (session: WritingSession) => void
  updateChapterStatus: (id: string, status: TrameChapter['status']) => void
  setChapters: (chapters: TrameChapter[]) => void
  addMemories: (seeds: Omit<MemorySeed, 'id'>[]) => void
  removeMemory: (id: string) => void
  setBrainstormConversation: (convo: ConvoMsg[]) => void
  clearBrainstormConversation: () => void
  setNotifications: (updates: Partial<MemoirState['notifications']>) => void
  setNextRdv: (dt: string | null) => void
  addCharacter: (c: Omit<Character, 'id'>) => void
  updateCharacter: (id: string, updates: Partial<Omit<Character, 'id'>>) => void
  removeCharacter: (id: string) => void
  addResearchNote: (n: Omit<ResearchNote, 'id'>) => void
  updateResearchNote: (id: string, updates: Partial<Omit<ResearchNote, 'id'>>) => void
  removeResearchNote: (id: string) => void
  addTimelineEvent: (e: Omit<TimelineEvent, 'id'>) => void
  updateTimelineEvent: (id: string, updates: Partial<Omit<TimelineEvent, 'id'>>) => void
  removeTimelineEvent: (id: string) => void
  toggleSavedQuote: (text: string) => void
  setBookFoundations: (f: NonNullable<MemoirState['bookFoundations']>) => void
  setBornYear: (year: number | null) => void
  // Agent actions
  setStyleFingerprint: (fingerprint: string) => void
  setBookGaps: (gaps: BookGap[]) => void
  addAgentSuggestion: (s: Omit<AgentSuggestion, 'id' | 'dismissed' | 'date'>) => void
  dismissSuggestion: (id: string) => void
  clearDismissedSuggestions: () => void
  loadDemoState: (name?: string) => void
  resetAll: () => void
}

const defaultProfile: OnboardingProfile = {
  intention: '',
  destinataire: '',
  destinatairePrenom: '',
  ton: '',
  styleExtrait: '',
  frequence: '',
  duree: 0,
  role: '',
  subjectName: '',
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

const initialState = {
  lang: 'fr' as 'fr' | 'en' | 'es' | 'tr',
  writingMode: 'libre' as WritingModeId,
  manifestoSeen: false,
  userId: '',
  userName: '',
  profile: defaultProfile,
  onboardingComplete: false,
  onboardingAnswers: { why: '', for_whom: '', memory: '', unsaid: '' },
  chapters: TRAME_CHAPTERS,
  trameCustom: false,
  memories: [] as MemorySeed[],
  brainstormConversation: [] as ConvoMsg[],
  sessions: [] as WritingSession[],
  currentStreak: 0,
  lastWrittenDate: null as string | null,
  notifications: {
    enabled: false,
    hour: 20,
    nudgeEnabled: true,
  },
  nextRdv: null as string | null,
  characters: [] as Character[],
  timelineEvents: [] as TimelineEvent[],
  researchNotes: [] as ResearchNote[],
  savedQuotes: [] as string[],
  styleFingerprint: undefined as string | undefined,
  bookGaps: [] as BookGap[],
  agentSuggestions: [] as AgentSuggestion[],
  bookFoundations: null as MemoirState['bookFoundations'],
  foundationsComplete: false,
  bornYear: null as number | null,
}

export const useMemoirStore = create<MemoirState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLang: (lang) => set({ lang }),
      setWritingMode: (mode) => set({ writingMode: mode }),
      setManifestoSeen: () => set({ manifestoSeen: true }),

      setUserId: (id) => set({ userId: id }),
      setUserName: (name) => {
        const current = get()
        set({ userName: name, userId: current.userId || generateId() })
      },

      setProfile: (updates) =>
        set((s) => ({
          profile: { ...(s.profile ?? defaultProfile), ...updates },
        })),

      setOnboardingAnswer: (key, value) =>
        set((s) => ({
          onboardingAnswers: { ...s.onboardingAnswers, [key]: value },
        })),

      completeOnboarding: () => set({ onboardingComplete: true, manifestoSeen: true }),

      saveSession: (session) => {
        const today = new Date().toISOString().split('T')[0]
        const { sessions, lastWrittenDate, currentStreak, chapters } = get()

        const updatedChapters = chapters.map((ch) =>
          ch.id === session.chapterId
            ? { ...ch, status: 'done' as const }
            : ch
        )

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yStr = yesterday.toISOString().split('T')[0]

        let newStreak = currentStreak
        if (lastWrittenDate === today) {
          // already wrote today
        } else if (lastWrittenDate === yStr) {
          newStreak = currentStreak + 1
        } else {
          newStreak = 1
        }

        // Upsert: replace existing session for same chapter (revision), don't duplicate
        const existingIdx = sessions.findIndex(s => s.chapterId === session.chapterId)
        const updatedSessions = existingIdx >= 0
          ? sessions.map((s, i) => i === existingIdx ? session : s)
          : [...sessions, session]

        set({
          sessions: updatedSessions,
          chapters: updatedChapters,
          currentStreak: newStreak,
          lastWrittenDate: today,
        })
      },

      updateChapterStatus: (id, status) =>
        set((s) => ({
          chapters: s.chapters.map((ch) =>
            ch.id === id ? { ...ch, status } : ch
          ),
        })),

      setChapters: (chapters) => set({ chapters, trameCustom: true }),

      addMemories: (seeds) =>
        set((s) => ({
          memories: [
            ...s.memories,
            ...seeds.map((seed) => ({
              ...seed,
              id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            })),
          ],
        })),

      removeMemory: (id) =>
        set((s) => ({ memories: s.memories.filter((m) => m.id !== id) })),

      setBrainstormConversation: (convo) => set({ brainstormConversation: convo }),
      clearBrainstormConversation: () => set({ brainstormConversation: [] }),

      setNotifications: (updates) =>
        set((s) => ({ notifications: { ...s.notifications, ...updates } })),

      setNextRdv: (dt) => set({ nextRdv: dt }),

      addCharacter: (c) =>
        set((s) => ({
          characters: [...s.characters, { ...c, id: `char-${Date.now()}` }],
        })),

      updateCharacter: (id, updates) =>
        set((s) => ({
          characters: s.characters.map((ch) => ch.id === id ? { ...ch, ...updates } : ch),
        })),

      removeCharacter: (id) =>
        set((s) => ({ characters: s.characters.filter((ch) => ch.id !== id) })),

      addResearchNote: (n) =>
        set((s) => ({
          researchNotes: [...s.researchNotes, { ...n, id: `note-${Date.now()}` }],
        })),

      updateResearchNote: (id, updates) =>
        set((s) => ({
          researchNotes: s.researchNotes.map((n) => n.id === id ? { ...n, ...updates } : n),
        })),

      removeResearchNote: (id) =>
        set((s) => ({ researchNotes: s.researchNotes.filter((n) => n.id !== id) })),

      addTimelineEvent: (e) =>
        set((s) => ({
          timelineEvents: [...s.timelineEvents, { ...e, id: `evt-${Date.now()}` }],
        })),

      updateTimelineEvent: (id, updates) =>
        set((s) => ({
          timelineEvents: s.timelineEvents.map((ev) => ev.id === id ? { ...ev, ...updates } : ev),
        })),

      removeTimelineEvent: (id) =>
        set((s) => ({ timelineEvents: s.timelineEvents.filter((ev) => ev.id !== id) })),

      toggleSavedQuote: (text) =>
        set((s) => ({
          savedQuotes: s.savedQuotes.includes(text)
            ? s.savedQuotes.filter((q) => q !== text)
            : [...s.savedQuotes, text],
        })),

      setBookFoundations: (f) => set({ bookFoundations: f, foundationsComplete: true }),

      setBornYear: (year) => set({ bornYear: year }),

      // Agent actions
      setStyleFingerprint: (fingerprint) => set({ styleFingerprint: fingerprint }),

      setBookGaps: (gaps) => set({ bookGaps: gaps }),

      addAgentSuggestion: (s) =>
        set((state) => ({
          agentSuggestions: [
            ...state.agentSuggestions,
            {
              ...s,
              id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              dismissed: false,
              date: new Date().toISOString(),
            },
          ],
        })),

      dismissSuggestion: (id) =>
        set((s) => ({
          agentSuggestions: s.agentSuggestions.map((sg) =>
            sg.id === id ? { ...sg, dismissed: true } : sg
          ),
        })),

      clearDismissedSuggestions: () =>
        set((s) => ({
          agentSuggestions: s.agentSuggestions.filter((sg) => !sg.dismissed),
        })),

      loadDemoState: (name = 'Marie') => {
        const today = new Date().toISOString().split('T')[0]
        const d1 = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const d2 = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
        set({
          lang: 'fr',
          writingMode: 'libre',
          manifestoSeen: true,
          userId: get().userId || generateId(),
          userName: name,
          onboardingComplete: true,
          profile: {
            intention: 'trace',
            destinataire: 'enfants',
            destinatairePrenom: 'Emma et Lucas',
            ton: 'biographique',
            styleExtrait: 'Je suis né dans une maison qui sentait la cire et la lavande.',
            frequence: 'hebdo',
            duree: 30,
            role: 'auteur',
            subjectName: '',
          },
          onboardingAnswers: {
            why: 'Laisser une trace à mes proches',
            for_whom: 'Mes enfants et petits-enfants',
            memory: 'Le jardin de mon enfance',
            unsaid: 'Combien la vie est belle',
          },
          chapters: TRAME_CHAPTERS.map((ch, i) => ({
            ...ch,
            status: i < 2 ? 'done' as const : 'unwritten' as const,
          })),
          sessions: [
            {
              chapterId: 'ch-1',
              wordCount: 312,
              content: `Je suis né dans une maison qui sentait la cire et la lavande. Ma mère avait le don de rendre les espaces vivants - chaque pièce respirait à sa façon. La cuisine était le cœur de tout. Une grande table en bois marquée par les années, les repas, les conversations interminables. Mon père y lisait son journal le matin, café noir, silencieux mais présent. Le bois ciré de l'escalier, le carrelage froid sous les pieds nus, la fenêtre qui donnait sur le cerisier - ce sont les premières images que j'ai de moi-même dans ce monde.`,
              date: d2,
            },
            {
              chapterId: 'ch-2',
              wordCount: 245,
              content: `Il y a une image qui revient souvent : je dois avoir sept ou huit ans, je regarde par la fenêtre pendant une leçon de géographie. Le vent fait tournoyer les feuilles mortes dans la cour. Et soudain, sans pouvoir le nommer, j'ai compris quelque chose d'immense - que le monde était infini, et que j'en faisais partie. Ce n'est qu'un instant banal. Mais c'est lui qui m'a formé.`,
              date: d1,
            },
          ],
          currentStreak: 3,
          lastWrittenDate: today,
        })
      },

      resetAll: () => set({ ...initialState, chapters: TRAME_CHAPTERS, trameCustom: false, memories: [], brainstormConversation: [] }),
    }),
    {
      name: 'memoir-store',
    }
  )
)

// Helpers
export function getNextChapter(chapters: TrameChapter[]): TrameChapter | null {
  return chapters.find((ch) => ch.status !== 'done') ?? null
}

export function getCompletedCount(chapters: TrameChapter[]): number {
  return chapters.filter((ch) => ch.status === 'done').length
}

export function getGreeting(name: string): { greeting: string; sub: string } {
  const hour = new Date().getHours()
  const daily = [
    "Votre histoire n'attend que vous.",
    'Chaque mot est un souvenir sauvé.',
    "Écrire, c'est vivre deux fois.",
    'Votre futur lecteur vous attend.',
    "Aujourd'hui, un chapitre de plus.",
  ]
  const sub = daily[new Date().getDate() % daily.length]

  if (hour < 12) return { greeting: `Bonjour, ${name}`, sub }
  if (hour < 18) return { greeting: `Bon après-midi, ${name}`, sub }
  if (hour < 23) return { greeting: `Bonsoir, ${name}`, sub }
  return { greeting: `Bonne nuit, ${name}`, sub }
}
