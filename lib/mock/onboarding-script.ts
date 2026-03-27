// Conversation simulée — 6 échanges progressifs
// Chaque message s'adapte à la réponse précédente via des placeholders {name}

export type MockTurn = {
  // Délai de frappe simulé avant que le message apparaisse (ms)
  delay: number
  // La réponse de l'IA pour ce tour
  getMessage: (userAnswer: string, name: string) => string
  // Si true : c'est le dernier échange, déclenche la redirection
  isFinal?: boolean
  // Quelle donnée capturer depuis la réponse user
  captures?: 'name' | 'why' | 'for_whom' | 'memory' | 'unsaid'
}

export const ONBOARDING_SCRIPT: MockTurn[] = [
  // Tour 0 — Message d'ouverture (pas de réponse user avant)
  {
    delay: 1200,
    captures: 'name',
    getMessage: () =>
      `Bonjour. Je suis heureux que vous soyez là.\n\nAvant de commencer, j'aimerais vous connaître un peu. Comment vous appelez-vous ?`,
  },

  // Tour 1 — Pourquoi maintenant
  {
    delay: 1600,
    captures: 'why',
    getMessage: (_, name) =>
      `${name}... c'est un beau prénom.\n\nAlors, dites-moi — pourquoi maintenant ? Qu'est-ce qui vous a amené à vouloir écrire votre histoire, aujourd'hui, à ce moment précis de votre vie ?`,
  },

  // Tour 2 — Pour qui
  {
    delay: 1800,
    captures: 'for_whom',
    getMessage: () =>
      `Je vous entends. Ce que vous portez mérite d'être dit.\n\nEt pour qui écrivez-vous ? Quand vous imaginez ce livre entre des mains, ce sont les mains de qui ?`,
  },

  // Tour 3 — Le souvenir fondateur
  {
    delay: 2000,
    captures: 'memory',
    getMessage: (_, name) =>
      `C'est beau, ${name}. Écrire pour quelqu'un, ça change tout — ça donne une direction au courage.\n\nSi vous deviez choisir un seul souvenir qui vous définit — un moment, une image, une sensation — lequel serait-ce ?`,
  },

  // Tour 4 — Ce qu'on n'a jamais dit
  {
    delay: 1900,
    captures: 'unsaid',
    getMessage: () =>
      `Ce souvenir a quelque chose de précieux. Je le garde soigneusement.\n\nY a-t-il une période de votre vie — ou quelque chose que vous avez vécu — dont vous n'avez jamais vraiment parlé à quelqu'un ?`,
  },

  // Tour 5 — Synthèse émotionnelle + transition
  {
    delay: 2400,
    isFinal: true,
    getMessage: (_, name) =>
      `${name}, merci de m'avoir accordé cette confiance.\n\nCe que vous venez de partager — le pourquoi, le pour qui, ce souvenir ancré, ce que vous portez en silence — tout cela forme déjà la colonne vertébrale d'un livre vivant.\n\nJe vais maintenant tisser votre trame narrative. Un instant...`,
  },
]

// Message d'ouverture initial (avant tout input user)
export const OPENING_MESSAGE =
  `Bonjour. Je suis heureux que vous soyez là.\n\nAvant de commencer, j'aimerais vous connaître un peu. Comment vous appelez-vous ?`
