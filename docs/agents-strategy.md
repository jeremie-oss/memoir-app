# Memoir — Stratégie Multi-Agents

> Dernière mise à jour : 2026-03-27
> Statut : Référence de conception — à implémenter dans l'ordre du § Plan

---

## Problème résolu

Une séance isolée produit un beau paragraphe. Un livre complet exige de la cohérence de style,
une mémoire des personnages, une logique narrative, et un regard extérieur sur l'ensemble.
Un seul modèle ne peut pas tenir tous ces rôles simultanément.

La solution : une équipe de 6 agents spécialisés, coordonnés par un état partagé.

---

## Principes fondateurs

### 1. Model-agnostic
Aucun agent n'est lié à un modèle spécifique. Chaque agent définit un **niveau de capacité requis**
et le routage est fait via OpenRouter (déjà en place). On peut swapper le modèle par agent
dans un fichier de configuration central sans toucher aux prompts.

```ts
// lib/ai/agent-config.ts
export const AGENT_MODELS = {
  interrogateur:  process.env.MODEL_INTERROGATEUR  || 'anthropic/claude-haiku-4-5',
  ecrivain:       process.env.MODEL_ECRIVAIN        || 'anthropic/claude-sonnet-4-5',
  relecteur:      process.env.MODEL_RELECTEUR       || 'anthropic/claude-sonnet-4-5',
  archiviste:     process.env.MODEL_ARCHIVISTE      || 'anthropic/claude-haiku-4-5',
  architecte:     process.env.MODEL_ARCHITECTE      || 'anthropic/claude-sonnet-4-5',
  historien:      process.env.MODEL_HISTORIEN       || 'google/gemini-2.0-flash',
} as const
```

Capacités requises par agent :
| Agent | Vitesse | Créativité | Analyse | Longueur output |
|---|---|---|---|---|
| Interrogateur | ★★★ | ★★ | ★ | courte (1 question) |
| Archiviste | ★★ | ★ | ★★★ | structurée (JSON) |
| Écrivain | ★ | ★★★ | ★★ | longue (prose) |
| Relecteur | ★★ | ★ | ★★★ | moyenne (bullets) |
| Architecte | ★ | ★★ | ★★★ | moyenne (plan) |
| Historien | ★★ | ★ | ★★ | variable |

### 2. Obéissance à l'utilisateur
**Tout output d'agent est une proposition, jamais une décision.**

Règles inviolables :
- Chaque suggestion est dismissable en un geste
- L'utilisateur peut éditer ou ignorer n'importe quel texte AI
- L'utilisateur peut modifier manuellement le Book State (personnages, chronologie, plan)
- L'utilisateur peut désactiver n'importe quel agent dans ses préférences
- Aucun agent ne progresse sans signal explicite de l'utilisateur (next, valider, ignorer)
- Le texte AI est visuellement distingué du texte validé jusqu'à acceptation

### 3. Dégradation gracieuse
Si le Book State est incomplet (première séance, données manquantes), chaque agent
fonctionne avec ce qu'il a. Aucun agent ne bloque le parcours utilisateur.

---

## Le Book State

État partagé entre tous les agents. Construit depuis le store Zustand et envoyé
en contexte à chaque appel. **La source de vérité reste côté client (Zustand).**

```ts
// lib/ai/book-state.ts

export type BookState = {
  // Identité du livre
  userName: string
  profile: OnboardingProfile          // intention, destinataire, ton, style
  lang: 'fr' | 'en' | 'es'

  // Plan éditorial
  chapters: {
    id: string
    title: string
    theme: string
    status: 'empty' | 'draft' | 'complete'
    wordCount: number
    summary?: string                  // résumé 1-2 phrases du contenu écrit
  }[]

  // Registre des personnages
  characters: Character[]             // déjà dans le store

  // Ligne temporelle
  timelineEvents: TimelineEvent[]     // déjà dans le store

  // Empreinte de style (extrait après 2+ séances)
  styleFingerprint?: string           // NEW — description du style de l'auteur

  // Lacunes détectées (alimenté par Archiviste)
  gaps: {
    chapterId: string
    type: 'missing_chapter' | 'undefined_character' | 'timeline_gap' | 'style_drift'
    description: string
    priority: 'high' | 'medium' | 'low'
  }[]

  // Passages écrits (résumés, pas le texte complet)
  sessionSummaries: {
    chapterId: string
    date: string
    excerpt: string                   // 150 premiers caractères
    wordCount: number
  }[]
}

// Fonction utilitaire : construit BookState depuis le store
export function buildBookState(store: MemoirState): BookState {
  return {
    userName: store.userName,
    profile: store.profile,
    lang: store.lang,
    chapters: store.chapters.map(ch => ({
      id: ch.id,
      title: ch.title,
      theme: ch.theme,
      status: ch.status ?? 'empty',
      wordCount: store.sessions
        .filter(s => s.chapterId === ch.id)
        .reduce((sum, s) => sum + s.wordCount, 0),
    })),
    characters: store.characters,
    timelineEvents: store.timelineEvents,
    styleFingerprint: store.styleFingerprint,
    gaps: store.bookGaps ?? [],
    sessionSummaries: store.sessions.map(s => ({
      chapterId: s.chapterId,
      date: s.date,
      excerpt: s.content.slice(0, 150),
      wordCount: s.wordCount,
    })),
  }
}
```

---

## Les 6 Agents

### Agent 0 — Archiviste *(backbone)*

**Rôle** : Maintenir la cohérence du Book State. Déclenché automatiquement après chaque
séance validée. L'utilisateur ne l'interagit jamais directement.

**Actions API** :
- `archiviste_update` — extrait nouveaux personnages, événements, faits d'un passage validé
- `archiviste_gaps` — analyse le livre entier et liste les lacunes
- `archiviste_style` — extrait l'empreinte de style après 2+ séances

**Prompt (archiviste_update)** :
```
Tu es l'archiviste d'un projet de mémoires. Analyse ce nouveau passage et extrais :
1. Personnages mentionnés (nom, relation à l'auteur, indices d'âge/période)
2. Événements datables (date approximative, titre court)
3. Lieux importants
4. Faits qui contredisent les données déjà enregistrées

Réponds en JSON strict :
{
  "characters": [{ "name": string, "relation": string, "period": string }],
  "events": [{ "date": string, "title": string, "description": string }],
  "contradictions": [{ "type": string, "description": string }]
}

Données déjà enregistrées : {bookState}
Nouveau passage : {content}
```

**Résultat** : Zustand mis à jour en silence. L'utilisateur voit seulement un badge
"Archiviste a mis à jour vos données" dismissable.

---

### Agent 1 — Interrogateur

**Rôle** : Déclencher et approfondir l'écriture via des questions concrètes et sensorielles.
Sait ce qui a déjà été couvert (via Book State) et cible les lacunes.

**Changement vs existant** :
- Reçoit `bookState` → cible les chapitres `empty` en priorité
- Reçoit `sessionSummaries` → ne repose pas une question déjà posée
- Reçoit `gaps` → peut cibler un personnage non défini, une période manquante

**Prompt (addition au prompt existant)** :
```
Données déjà écrites (ne pas reposer ces sujets) :
{sessionSummaries}

Chapitres encore vides : {emptyChapters}
Lacunes identifiées : {gaps}

Cible en priorité un angle pas encore exploré.
```

**Règle d'obéissance** : l'utilisateur peut dire "pas ce sujet maintenant" →
l'Interrogateur ne revient pas sur ce sujet pour le reste de la séance.

---

### Agent 2 — Écrivain

**Rôle** : Transformer le matériau brut (réponses utilisateur) en prose mémorielle
cohérente avec le reste du livre. C'est l'agent le plus exigeant en qualité de modèle.

**Changement vs existant** :
- Reçoit `styleFingerprint` → reproduit le ton et le rythme de l'auteur
- Reçoit `previousPassages` (3 derniers) → assure continuité stylistique
- Reçoit `characters` → utilise les bons noms, relations, périodes

**Prompt (addition)** :
```
Empreinte de style de l'auteur : {styleFingerprint}

Extraits des derniers passages validés (pour cohérence stylistique) :
{previousPassages}

Personnages connus :
{characters}

RÈGLE ABSOLUE : ta proposition doit sonner comme l'auteur, pas comme un écrivain professionnel
générique. Adapte-toi à son niveau de langue et à son ton naturel.
```

**Résultat** : toujours présenté comme "Premier jet proposé" — l'utilisateur édite
dans le textarea avant de valider.

---

### Agent 3 — Relecteur

**Rôle** : Lire l'ensemble du livre au fur et à mesure et signaler ce qu'un lecteur
extérieur ne comprendrait pas. Déclenché après chaque session validée.

**Actions API** : `relecteur_review`

**Ce qu'il détecte** (par priorité) :
1. **Références opaques** — "lui", "mon ami", "à cette époque" sans contexte suffisant
2. **Contradictions** — âge incohérent, date impossible, relation qui change
3. **Ellipses narratives** — saut temporel non expliqué, chapitre supposé connu
4. **Répétitions** — même anecdote racontée deux fois sous des angles différents
5. **Opportunités** — passage trop factuel qui mériterait un détail sensoriel

**Prompt** :
```
Tu es un lecteur bienveillant et attentif qui lit ce livre de mémoires pour la première fois.
Tu n'es pas l'auteur : tu ne connais rien de sa vie en dehors de ce qui est écrit.

Lis ce nouveau passage dans le contexte de tout ce qui a déjà été écrit.

Signale uniquement des problèmes concrets — pas de conseils génériques sur le style.
Pour chaque problème, indique :
- type: 'reference_opaque' | 'contradiction' | 'ellipse' | 'repetition' | 'opportunite'
- passage: citation courte du texte concerné
- explication: pourquoi c'est un problème pour le lecteur
- suggestion: une piste concrète (pas une réécriture)

Maximum 3 signalements par séance. Seulement ce qui gêne vraiment la compréhension.

Réponds en JSON : { "reviews": [{ "type", "passage", "explication", "suggestion" }] }

Tout le livre jusqu'ici : {allSessions}
Nouveau passage : {newContent}
```

**Résultat** : affiché dans un panneau latéral "Œil du lecteur" — chaque item
est accepté ou ignoré par l'utilisateur. Rien n'est modifié automatiquement.

---

### Agent 4 — Architecte Narratif

**Rôle** : Vision macro du livre. Compare ce qui est écrit au plan éditorial,
détecte les déséquilibres, propose des ajustements de structure.

**Déclenché** : à la demande (bouton "Vue architecte") ou après 5 séances.

**Actions API** : `architecte_review`

**Ce qu'il analyse** :
- Proportion des chapitres (trop de childhood, rien sur la vie pro)
- Fil rouge thématique (est-ce qu'on le retrouve dans les passages ?)
- Pacing (trop de séances sur le même chapitre)
- Chapitres orphelins (écrits mais mal intégrés dans le plan)
- Opportunités structurelles (un souvenir évoqué en passant mériterait un chapitre entier)

**Prompt** :
```
Tu es un directeur éditorial de livres de mémoires. Tu lis l'état actuel du livre
et évalues l'architecture narrative.

Plan éditorial : {chapters}
Avancement par chapitre : {chapterProgress}
Résumés des passages : {sessionSummaries}

Produis une analyse en 3 sections :
1. ÉQUILIBRE : quels chapitres sont sur- ou sous-représentés ?
2. FIL ROUGE : est-ce que la thématique centrale est cohérente ?
3. SUGGESTIONS : 2-3 ajustements concrets (pas de généralités)

Sois direct. Pas de compliments. Seulement ce qui mérite attention.
```

**Résultat** : affiché dans un modal "Architecture du livre" — l'utilisateur
peut accepter une suggestion (modifie le plan), la rejeter, ou la mettre de côté.

---

### Agent 5 — Historien *(optionnel)*

**Rôle** : Enrichir les passages avec du contexte historique, culturel, géographique.
Déclenché à la demande sur une sélection de texte ou automatiquement sur des déclencheurs
temporels ("en 1968", "pendant la guerre", "quand De Gaulle...").

**Actions API** : `historien_contextualize`

**Prompt** :
```
Tu es un historien et géographe culturel. L'auteur mentionne {trigger} dans son mémoire.

Fournis un contexte historique/culturel précis et court (2-3 phrases max) qui pourrait
enrichir ce passage — non pas pour remplacer le vécu de l'auteur, mais pour situer
son histoire dans le grand récit.

Sois factuel, précis, accessible. Pas de cours magistral.
```

**Résultat** : affiché comme "Contexte historique (optionnel)" — l'utilisateur
décide de l'intégrer ou non dans son texte.

---

## Workflow complet par séance

```
┌─────────────────────────────────────────────────────┐
│  DÉBUT DE SÉANCE                                    │
│  Archiviste → résumé du livre + lacunes prioritaires│
│  (affiché comme "Votre livre en un coup d'œil")    │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│  INTERROGATOIRE                                     │
│  Interrogateur ← BookState (lacunes, déjà couvert)  │
│  → Question ciblée                                  │
│  ↔ Échanges utilisateur (3-7 questions)             │
│  Archiviste capture au fil de l'eau                 │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│  RÉDACTION                                          │
│  Écrivain ← matériau brut + styleFingerprint        │
│  → "Premier jet proposé"                            │
│  Utilisateur édite dans textarea                    │
│  Historien ← déclenché si trigger temporel détecté  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│  VALIDATION                                         │
│  Utilisateur valide le passage                      │
│  Archiviste → update BookState (async, silencieux)  │
│  Relecteur → analyse (async, panneau latéral)       │
│  Architecte → check si seuil déclenché (5e séance)  │
└─────────────────────────────────────────────────────┘
```

---

## Plan d'implémentation (dans l'ordre)

### Étape 1 — Book State & Archiviste *(fondation)*
Tout le reste en dépend.

- [ ] `lib/ai/agent-config.ts` — modèles par agent (env vars)
- [ ] `lib/ai/book-state.ts` — type `BookState` + `buildBookState()`
- [ ] Ajouter au store : `styleFingerprint`, `bookGaps`, `agentSuggestions`
- [ ] Ajouter actions : `setStyleFingerprint`, `setBookGaps`, `addAgentSuggestion`, `dismissSuggestion`
- [ ] API : actions `archiviste_update`, `archiviste_gaps`, `archiviste_style`
- [ ] Trigger `archiviste_update` après chaque `saveSession`

### Étape 2 — Relecteur
Valeur immédiate, impact visible, pas de refactoring majeur.

- [ ] API : action `relecteur_review`
- [ ] Composant `<AgentReviewer />` — panneau latéral "Œil du lecteur"
- [ ] Trigger après validation de chaque passage
- [ ] UI : chaque item accepté/ignoré, badge count, dismissable globalement

### Étape 3 — Écrivain v2
Refactoring de `guide_generate` pour intégrer le Book State.

- [ ] Passer `styleFingerprint` + `previousPassages` + `characters` à `guide_generate`
- [ ] Générer `styleFingerprint` après la 2e séance (appel `archiviste_style`)
- [ ] UI : label "Premier jet proposé" + diff visuel si l'utilisateur a édité

### Étape 4 — Interrogateur v2
Refactoring de `guide_question` pour cibler les lacunes.

- [ ] Passer `gaps` + `sessionSummaries` + `emptyChapters` à `guide_question`
- [ ] Ajouter mécanisme "pas ce sujet" (exclusion locale à la séance)
- [ ] Log des questions posées dans le Book State (éviter répétitions inter-séances)

### Étape 5 — Architecte Narratif
Nouveau agent, déclenché à la demande.

- [ ] API : action `architecte_review`
- [ ] Bouton "Architecture" dans le dashboard
- [ ] Modal `<BookArchitect />` — 3 sections, suggestions actionnables
- [ ] Trigger automatique après 5 séances (notification douce)

### Étape 6 — Historien *(optionnel)*
Dernier, sur versions avancées.

- [ ] Détection de triggers temporels dans les passages
- [ ] API : action `historien_contextualize`
- [ ] UI inline : chip "Contexte historique" sur les passages déclencheurs

---

## Ce qui ne change pas

- L'API endpoint reste `/api/memoir` (ajout de nouvelles actions, pas de refactoring de l'existant)
- OpenRouter reste le seul provider (swap de modèle via env var)
- Zustand reste la source de vérité côté client
- Aucune base de données agent-side : Book State = Zustand + Supabase existants

---

## Signaux de robustesse

| Risque | Mitigation |
|---|---|
| Book State vide (1re séance) | Chaque agent a un prompt de fallback sans contexte |
| Appel agent échoue | Séance continue sans le résultat de l'agent, notification douce |
| Contradiction détectée par Relecteur | Signalée, jamais auto-corrigée |
| Style fingerprint incohérent | Recalculé à la demande, pas bloquant |
| Utilisateur ignore toutes les suggestions | Système fonctionne normalement |
| Modèle trop lent pour Interrogateur | Swap vers modèle plus rapide via env var |
