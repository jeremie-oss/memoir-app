// Memoir — Configuration des offres
// Orthographe définitive : Crayon · Stilo · Plum · Gutenberg

export type PlanId = 'crayon' | 'stilo' | 'plum' | 'gutenberg'

export type PlanConfig = {
  id: PlanId
  label: string
  chaptersMax: number | null       // null = illimité
  wordsPerChapterSoft: number | null // limite douce affichée (non bloquante)
  totalWordsMax: number | null     // null = illimité
  tagline: { fr: string; en: string }
  price: { fr: string; en: string }
}

export const PLANS: Record<PlanId, PlanConfig> = {
  crayon: {
    id: 'crayon',
    label: 'Crayon',
    chaptersMax: 5,
    wordsPerChapterSoft: 1500,
    totalWordsMax: 7500,
    tagline: { fr: "L'essentiel de votre vie", en: 'The essentials of your life' },
    price: { fr: 'Gratuit', en: 'Free' },
  },
  stilo: {
    id: 'stilo',
    label: 'Stilo',
    chaptersMax: 10,
    wordsPerChapterSoft: 3000,
    totalWordsMax: 30000,
    tagline: { fr: 'Un vrai livre', en: 'A real book' },
    price: { fr: '9 € / mois', en: '€9 / month' },
  },
  plum: {
    id: 'plum',
    label: 'Plum',
    chaptersMax: 15,
    wordsPerChapterSoft: 5000,
    totalWordsMax: 75000,
    tagline: { fr: 'Votre œuvre complète', en: 'Your complete work' },
    price: { fr: '19 € / mois', en: '€19 / month' },
  },
  gutenberg: {
    id: 'gutenberg',
    label: 'Gutenberg',
    chaptersMax: null,
    wordsPerChapterSoft: null,
    totalWordsMax: null,
    tagline: { fr: "L'édition définitive", en: 'The definitive edition' },
    price: { fr: '39 € / mois', en: '€39 / month' },
  },
}

const PLAN_ORDER: PlanId[] = ['crayon', 'stilo', 'plum', 'gutenberg']

export function getNextPlan(plan: PlanId): PlanId | null {
  const idx = PLAN_ORDER.indexOf(plan)
  return idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1] : null
}
