'use client'

import { createContext, useContext, ReactNode } from 'react'

export type Lang = 'fr' | 'en' | 'es'

// ── Translations ──────────────────────────────────────────────
export const T = {
  fr: {
    // Greetings
    greetings: {
      morning: 'Bonjour',
      afternoon: 'Bon après-midi',
      evening: 'Bonsoir',
      night: 'Bonne nuit',
    },
    subs: [
      "Votre histoire n'attend que vous.",
      'Chaque mot est un souvenir sauvé.',
      "Écrire, c'est vivre deux fois.",
      'Votre futur lecteur vous attend.',
      "Aujourd'hui, un chapitre de plus.",
    ],

    // Onboarding progressif
    onboarding: {
      headline: "Votre histoire mérite d\u2019exister.",
      sub: 'Commençons par votre prénom.',
      namePlaceholder: 'Votre prénom...',
      nameConfirm: 'Commencer →',
      welcome: (name: string) => `Bienvenue, ${name}.`,
      firstChapter: 'Votre premier chapitre vous attend - cliquez sur Écriture pour commencer.',
    },

    // Panneaux
    panels: {
      writing: 'Écriture',
      dashboard: 'Bilan',
      book: 'Mon Oeuvre',
      resources: 'Ressources',
    },

    // Écriture
    writing: {
      nextChapter: 'Prochain chapitre',
      start: 'Par où commencer',
      chapter: 'Chapitre',
      writeNow: 'Écrire maintenant →',
      startSession: "Commencer la session d'écriture →",
      complete: 'Votre livre est complet. ✦',
      inspiredBy: 'Citation inspirante',
      writingPrompt: "Prompt d'écriture",
    },

    // Bilan
    dashboard: {
      progress: 'Avancement',
      streak: 'Série',
      days: (n: number) => `${n} jour${n > 1 ? 's' : ''}`,
      wordsWritten: 'Mots écrits',
      sessions: 'Sessions',
      weeklyGoal: 'Objectif semaine',
      goalReached: '✦ Objectif atteint cette semaine !',
      bookProgress: 'Progression du livre',
      rewards: 'Récompenses',
      unlocked: 'débloquées',
      encouragements: [
        "Votre livre n'attend que vous.",
        'Beau départ. Chaque session compte.',
        "Vous êtes à mi-chemin. L'élan est là.",
        'Votre livre est presque complet.',
      ],
      badges: {
        firstWord: 'Premier mot',
        words100: '100 mots',
        streak3: '3 jours',
        halfBook: 'Mi-livre',
        words500: '500 mots',
        fullBook: 'Livre complet',
      },
    },

    // Mon Oeuvre
    book: {
      yourBook: 'Votre livre',
      memoirs: 'Mes Mémoires',
      preface: 'Préface',
      toc: 'Sommaire',
      excerpts: 'Extraits',
      export: '↓ Exporter (.txt)',
      share: '↗ Partager',
      words: 'mots',
      notStarted: "Ce livre n'a pas encore commencé à s'écrire. Mais il vous attend.",
      prefaceEarly: (name: string) =>
        `${name} commence à tracer les contours de son histoire. Chaque mot pose une première pierre.`,
      prefaceMid: (name: string) =>
        `À mi-chemin, l'histoire de ${name} prend forme et révèle sa profondeur.`,
      prefaceLate: (name: string) =>
        `L'histoire de ${name} est là, presque entière. Un témoignage rare et précieux.`,
      noContent: '(Contenu non sauvegardé)',
    },

    // Ressources
    resources: {
      glossary: 'Glossaire',
      glossaryDesc: 'Les termes clés du récit de vie',
      editorial: 'Plan éditorial',
      editorialDesc: 'Votre feuille de route sur 7 chapitres',
      tips: 'Conseils',
      tipsDesc: "Méthodes pour bien écrire",
      questions: 'Questions',
      questionsDesc: "Pour débloquer l'inspiration",
      quoteOfDay: 'Citation du jour',
    },

    // Actions
    actions: {
      expand: 'Agrandir',
      back: '← Retour',
      export: '↓ Export',
      share: '↗ Partage',
      save: 'Sauvegarder',
    },

    // Nav
    nav: {
      home: 'Accueil',
      book: 'Mon Livre',
      trame: 'Ma Trame',
      write: 'Écrire',
      calendar: 'Calendrier',
      dashboard: 'Tableau de bord',
    },

    // Semaine
    weekly: {
      wordsThisWeek: (n: number, goal: number) => `${n}/${goal} mots`,
    },
  },

  en: {
    greetings: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night',
    },
    subs: [
      'Your story is waiting for you.',
      'Every word is a memory saved.',
      'Writing is living twice.',
      'Your future reader is waiting.',
      'One more chapter today.',
    ],

    onboarding: {
      headline: 'Your story deserves to exist.',
      sub: 'Let\u2019s start with your first name.',
      namePlaceholder: 'Your first name...',
      nameConfirm: 'Get started →',
      welcome: (name: string) => `Welcome, ${name}.`,
      firstChapter: 'Your first chapter is waiting - click on Writing to begin.',
    },

    panels: {
      writing: 'Writing',
      dashboard: 'Progress',
      book: 'My Book',
      resources: 'Resources',
    },

    writing: {
      nextChapter: 'Next chapter',
      start: 'Where to begin',
      chapter: 'Chapter',
      writeNow: 'Write now →',
      startSession: 'Start writing session →',
      complete: 'Your book is complete. ✦',
      inspiredBy: 'Inspiring quote',
      writingPrompt: 'Writing prompt',
    },

    dashboard: {
      progress: 'Progress',
      streak: 'Streak',
      days: (n: number) => `${n} day${n > 1 ? 's' : ''}`,
      wordsWritten: 'Words written',
      sessions: 'Sessions',
      weeklyGoal: 'Weekly goal',
      goalReached: '✦ Weekly goal reached!',
      bookProgress: 'Book progress',
      rewards: 'Rewards',
      unlocked: 'unlocked',
      encouragements: [
        'Your book is waiting for you.',
        'Great start. Every session counts.',
        'You\u2019re halfway. Keep going.',
        'Your book is almost complete.',
      ],
      badges: {
        firstWord: 'First word',
        words100: '100 words',
        streak3: '3 days',
        halfBook: 'Half book',
        words500: '500 words',
        fullBook: 'Full book',
      },
    },

    book: {
      yourBook: 'Your book',
      memoirs: 'My Memoirs',
      preface: 'Preface',
      toc: 'Table of contents',
      excerpts: 'Excerpts',
      export: '↓ Export (.txt)',
      share: '↗ Share',
      words: 'words',
      notStarted: 'This book hasn\u2019t been written yet. But it\u2019s waiting for you.',
      prefaceEarly: (name: string) =>
        `${name} is beginning to trace the outlines of their story. Each word lays a first stone.`,
      prefaceMid: (name: string) =>
        `Halfway there, ${name}'s story is taking shape and revealing its depth.`,
      prefaceLate: (name: string) =>
        `${name}'s story is almost complete. A rare and precious testimony.`,
      noContent: '(Content not saved)',
    },

    resources: {
      glossary: 'Glossary',
      glossaryDesc: 'Key terms for memoir writing',
      editorial: 'Editorial plan',
      editorialDesc: 'Your roadmap across 7 chapters',
      tips: 'Tips',
      tipsDesc: 'Methods for writing well',
      questions: 'Questions',
      questionsDesc: 'To unlock inspiration',
      quoteOfDay: 'Quote of the day',
    },

    actions: {
      expand: 'Expand',
      back: '← Back',
      export: '↓ Export',
      share: '↗ Share',
      save: 'Save',
    },

    nav: {
      home: 'Home',
      book: 'My Book',
      trame: 'My Story',
      write: 'Write',
      calendar: 'Calendar',
      dashboard: 'Dashboard',
    },

    weekly: {
      wordsThisWeek: (n: number, goal: number) => `${n}/${goal} words`,
    },
  },

  es: {
    greetings: {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas noches',
      night: 'Buenas noches',
    },
    subs: [
      'Tu historia merece existir.',
      'Cada palabra es un recuerdo salvado.',
      'Escribir es vivir dos veces.',
      'Tu futuro lector te espera.',
      'Hoy, un capítulo más.',
    ],
    onboarding: {
      headline: 'Tu historia merece existir.',
      sub: 'Empecemos por tu nombre.',
      namePlaceholder: 'Tu nombre...',
      nameConfirm: 'Empezar →',
      welcome: (name: string) => `Bienvenido/a, ${name}.`,
      firstChapter: 'Tu primer capítulo te espera - haz clic en Escritura para comenzar.',
    },
    panels: {
      writing: 'Escritura',
      dashboard: 'Progreso',
      book: 'Mi Obra',
      resources: 'Recursos',
    },
    writing: {
      nextChapter: 'Próximo capítulo',
      start: 'Por dónde empezar',
      chapter: 'Capítulo',
      writeNow: 'Escribir ahora →',
      startSession: 'Comenzar la séance →',
      complete: 'Tu libro está completo. ✦',
      inspiredBy: 'Cita inspiradora',
      writingPrompt: 'Punto de partida',
    },
    dashboard: {
      progress: 'Progreso',
      streak: 'Racha',
      days: (n: number) => `${n} día${n > 1 ? 's' : ''}`,
      wordsWritten: 'Palabras escritas',
      sessions: 'Séances',
      weeklyGoal: 'Objetivo semanal',
      goalReached: '✦ ¡Objetivo semanal alcanzado!',
      bookProgress: 'Progreso del libro',
      rewards: 'Recompensas',
      unlocked: 'desbloqueadas',
      encouragements: [
        'Tu libro te espera.',
        'Buen comienzo. Cada séance cuenta.',
        'Estás a mitad del camino. Sigue adelante.',
        'Tu libro está casi completo.',
      ],
      badges: {
        firstWord: 'Primera palabra',
        words100: '100 palabras',
        streak3: '3 días',
        halfBook: 'Medio libro',
        words500: '500 palabras',
        fullBook: 'Libro completo',
      },
    },
    book: {
      yourBook: 'Tu libro',
      memoirs: 'Mis Memorias',
      preface: 'Prefacio',
      toc: 'Índice',
      excerpts: 'Éclats',
      export: '↓ Exportar (.txt)',
      share: '↗ Compartir',
      words: 'palabras',
      notStarted: 'Este libro aún no ha comenzado a escribirse. Pero te espera.',
      prefaceEarly: (name: string) => `${name} comienza a trazar los contornos de su historia.`,
      prefaceMid: (name: string) => `A mitad del camino, la historia de ${name} toma forma.`,
      prefaceLate: (name: string) => `La historia de ${name} está casi completa. Un testimonio único.`,
      noContent: '(Contenido no guardado)',
    },
    resources: {
      glossary: 'Glosario',
      glossaryDesc: 'Términos clave del relato de vida',
      editorial: 'Plan editorial',
      editorialDesc: 'Tu hoja de ruta en 7 capítulos',
      tips: 'Consejos',
      tipsDesc: 'Métodos para escribir bien',
      questions: 'Preguntas',
      questionsDesc: 'Para desbloquear la inspiración',
      quoteOfDay: 'Cita del día',
    },
    actions: {
      expand: 'Ampliar',
      back: '← Volver',
      export: '↓ Exportar',
      share: '↗ Compartir',
      save: 'Guardar',
    },
    nav: {
      home: 'Inicio',
      book: 'Mi Libro',
      trame: 'Mi Trama',
      write: 'Escribir',
      calendar: 'Calendario',
      dashboard: 'Panel',
    },
    weekly: {
      wordsThisWeek: (n: number, goal: number) => `${n}/${goal} palabras`,
    },
  },
}

// ── Memoir Lexicon (brand vocabulary, language-agnostic) ───────
export const MEMOIR_LEXICON = {
  seance:    { fr: 'Séance',    en: 'Séance',    es: 'Séance'    }, // writing session
  plume:     { fr: 'Plume',     en: 'Plume',     es: 'Pluma'     }, // completed session reward
  eclat:     { fr: 'Éclat',     en: 'Éclat',     es: 'Éclat'     }, // excerpt/highlight
  trame:     { fr: 'Trame',     en: 'Trame',     es: 'Trama'     }, // narrative arc
  voix:      { fr: 'Voix',      en: 'Voix',      es: 'Voz'       }, // writing voice
  rituel:    { fr: 'Rituel',    en: 'Rituel',    es: 'Ritual'    }, // pre-writing moment
  memorial:  { fr: 'Mémorial',  en: 'Mémorial',  es: 'Memorial'  }, // the complete book
  empreinte: { fr: 'Empreinte', en: 'Empreinte', es: 'Huella'    }, // legacy/footprint
} as const

// Writing modes
export const WRITING_MODES = {
  libre: {
    id: 'libre' as const,
    icon: '✦',
    fr: { label: 'Séance Libre',   desc: 'Écrivez comme ça vient - je suggère en silence' },
    en: { label: 'Free Séance',    desc: 'Write as it comes - I suggest in silence' },
    es: { label: 'Séance Libre',   desc: 'Escribe como te salga - sugiero en silencio' },
  },
  guide: {
    id: 'guide' as const,
    icon: '◈',
    fr: { label: 'Voix Guidée',    desc: 'Je vous pose des questions, vous répondez' },
    en: { label: 'Guided Voice',   desc: 'I ask questions, you answer' },
    es: { label: 'Voz Guiada',     desc: 'Te hago preguntas, tú respondes' },
  },
  dicte: {
    id: 'dicte' as const,
    icon: '◎',
    fr: { label: 'Dictée',         desc: 'Parlez ou écrivez librement - je reformule' },
    en: { label: 'Dictation',      desc: 'Speak or write freely - I rewrite' },
    es: { label: 'Dictado',        desc: 'Habla o escribe libremente - yo reformulo' },
  },
} as const

export type WritingModeId = keyof typeof WRITING_MODES

// Manifesto slides (brand intro for new users)
export const MANIFESTO = {
  fr: [
    { headline: "Votre histoire mérite d'exister.", sub: "Pas dans un tiroir. Dans un livre." },
    { headline: "Memoir n'est pas un logiciel.", sub: "C'est un compagnon. Une voix bienveillante qui vous guide pour mettre vos souvenirs en mots - sans pression, à votre rythme." },
    { headline: "Trois façons d'écrire.", sub: "Libre, guidé·e, ou dicté. Votre voix, vos mots, votre histoire - peu importe comment ça vient." },
    { headline: "Commençons.", sub: "Comment vous appelez-vous ?" },
  ],
  en: [
    { headline: 'Your story deserves to exist.', sub: 'Not in a drawer. In a book.' },
    { headline: 'Memoir is not software.', sub: "It's a companion. A gentle voice that guides you to put your memories into words - no pressure, at your own pace." },
    { headline: 'Three ways to write.', sub: 'Free, guided, or dictated. Your voice, your words, your story - however it comes.' },
    { headline: "Let's begin.", sub: 'What is your name?' },
  ],
  es: [
    { headline: 'Tu historia merece existir.', sub: 'No en un cajón. En un libro.' },
    { headline: 'Memoir no es un software.', sub: 'Es un compañero. Una voz amable que te guía para poner tus recuerdos en palabras - sin presión, a tu ritmo.' },
    { headline: 'Tres formas de escribir.', sub: 'Libre, guiado o dictado. Tu voz, tus palabras, tu historia - como sea que venga.' },
    { headline: 'Empecemos.', sub: '¿Cómo te llamas?' },
  ],
}

export type Translations = typeof T['fr']

// ── Context ───────────────────────────────────────────────────
const LangContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}>({ lang: 'fr', setLang: () => {}, t: T.fr })

export function LangProvider({ children, initial = 'fr' }: { children: ReactNode; initial?: Lang }) {
  // Language is stored in Zustand store, we just bridge it here
  return (
    <LangContext.Provider value={{ lang: initial, setLang: () => {}, t: T[initial] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLangContext() {
  return useContext(LangContext)
}
