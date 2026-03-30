export type TrameChapter = {
  id: string
  number: number
  title: string
  subtitle: string
  theme: string
  prompt: string
  quote: string
  quoteAuthor: string
  status: 'unwritten' | 'in_progress' | 'done'
}

export const TRAME_CHAPTERS: TrameChapter[] = [
  {
    id: 'ch-1',
    number: 1,
    title: 'Les Racines',
    subtitle: "D'où venez-vous, vraiment",
    theme: 'Origines · Famille · Terre natale',
    prompt: "Racontez-moi votre premier chez-vous. Les odeurs, les sons, ce que vous voyiez depuis la fenêtre. Qui était là ?",
    quote: "On ne sait pas qui l'on est avant d'avoir regardé d'où l'on vient.",
    quoteAuthor: 'Toni Morrison',
    status: 'unwritten',
  },
  {
    id: 'ch-2',
    number: 2,
    title: "L'Éveil",
    subtitle: 'Le moment où le monde s\'est ouvert',
    theme: 'Enfance · Découverte · Premier émerveillement',
    prompt: "Quel est le premier souvenir où vous avez eu l'impression de vraiment voir le monde - sa beauté, sa complexité, ou son injustice ?",
    quote: "L'enfance, c'est ce qui reste quand on a tout oublié.",
    quoteAuthor: 'Jean-Paul Dubois',
    status: 'unwritten',
  },
  {
    id: 'ch-3',
    number: 3,
    title: 'Les Premières Audaces',
    subtitle: 'Quand vous avez osé',
    theme: 'Jeunesse · Choix · Premiers pas dans la vie',
    prompt: "Racontez-moi un moment où vous avez fait quelque chose pour la première fois et où tout a changé. Quel âge aviez-vous ? Qu'avez-vous ressenti en franchissant ce seuil ?",
    quote: "Le courage, c'est d'avoir peur et d'y aller quand même.",
    quoteAuthor: 'Amelia Earhart',
    status: 'unwritten',
  },
  {
    id: 'ch-4',
    number: 4,
    title: 'Les Amours',
    subtitle: 'Ceux qui ont compté',
    theme: 'Amour · Amitié · Liens profonds',
    prompt: "Pensez à quelqu'un qui a profondément changé qui vous êtes - un amour, un ami, un mentor. Comment cette personne est-elle entrée dans votre vie ?",
    quote: "Les gens ne font que passer, mais certains laissent des empreintes profondes dans votre âme.",
    quoteAuthor: 'Franz Kafka',
    status: 'unwritten',
  },
  {
    id: 'ch-5',
    number: 5,
    title: 'Les Épreuves',
    subtitle: 'Ce qui vous a forgé',
    theme: 'Difficultés · Résilience · Transformation',
    prompt: "Il y a eu une période difficile - une perte, une rupture, un échec, une maladie. Racontez-moi non pas ce qui s'est passé, mais comment vous l'avez traversé.",
    quote: "Ce qui ne me tue pas me rend plus fort. Mais ce qui m'a presque tué m'a rendu plus doux.",
    quoteAuthor: 'Rainer Maria Rilke',
    status: 'unwritten',
  },
  {
    id: 'ch-6',
    number: 6,
    title: "Ce Que J'ai Construit",
    subtitle: "Vos chefs-d'oeuvre ordinaires",
    theme: 'Réalisations · Famille · Oeuvre de vie',
    prompt: "De quoi êtes-vous le plus fier, non pas en termes de succès, mais en termes de ce que vous avez construit avec vos mains, votre coeur, votre temps ?",
    quote: "La vie n'est pas mesurée par le nombre de respirations que l'on prend, mais par les moments qui vous coupent le souffle.",
    quoteAuthor: 'Maya Angelou',
    status: 'unwritten',
  },
  {
    id: 'ch-7',
    number: 7,
    title: "L'Héritage",
    subtitle: 'Ce que vous laissez derrière vous',
    theme: 'Transmission · Sagesse · Message aux générations futures',
    prompt: "Si vous n'aviez qu'une seule chose à transmettre - une vérité que vous avez mis du temps à comprendre - quelle serait-elle ? À qui l'adressez-vous ?",
    quote: "Nous ne possédons pas la terre, nous l'empruntons à nos enfants.",
    quoteAuthor: 'Antoine de Saint-Exupéry',
    status: 'unwritten',
  },
]

// ── Translations (EN / ES) ─────────────────────────────────────
type ChapterTranslation = Pick<TrameChapter, 'title' | 'subtitle' | 'theme' | 'prompt' | 'quote' | 'quoteAuthor'>

const TRAME_TRANSLATIONS: Record<'en' | 'es', ChapterTranslation[]> = {
  en: [
    {
      title: 'The Roots',
      subtitle: 'Where you truly come from',
      theme: 'Origins · Family · Homeland',
      prompt: 'Tell me about your first home. The smells, the sounds, what you saw from the window. Who was there?',
      quote: "We don't know who we are until we look back at where we came from.",
      quoteAuthor: 'Toni Morrison',
    },
    {
      title: 'The Awakening',
      subtitle: 'The moment the world opened up',
      theme: 'Childhood · Discovery · First wonder',
      prompt: 'What is the first memory where you truly felt you were seeing the world - its beauty, its complexity, or its injustice?',
      quote: "Childhood is what remains when you've forgotten everything.",
      quoteAuthor: 'Jean-Paul Dubois',
    },
    {
      title: 'First Daring',
      subtitle: 'When you took the leap',
      theme: 'Youth · Choices · First steps in life',
      prompt: 'Tell me about a moment when you did something for the first time and everything changed. How old were you? What did you feel crossing that threshold?',
      quote: "Courage is being scared and going anyway.",
      quoteAuthor: 'Amelia Earhart',
    },
    {
      title: 'Loves',
      subtitle: 'Those who mattered',
      theme: 'Love · Friendship · Deep bonds',
      prompt: 'Think of someone who profoundly changed who you are - a love, a friend, a mentor. How did this person enter your life?',
      quote: "People pass through, but some leave deep footprints in your soul.",
      quoteAuthor: 'Franz Kafka',
    },
    {
      title: 'The Trials',
      subtitle: 'What forged you',
      theme: 'Difficulty · Resilience · Transformation',
      prompt: 'There was a hard time - a loss, a break, a failure, an illness. Tell me not what happened, but how you got through it.',
      quote: "What doesn't kill me makes me stronger. But what almost killed me made me gentler.",
      quoteAuthor: 'Rainer Maria Rilke',
    },
    {
      title: 'What I Built',
      subtitle: 'Your everyday masterpieces',
      theme: "Achievements · Family · Life's work",
      prompt: "What are you most proud of - not in terms of success, but in terms of what you built with your hands, your heart, your time?",
      quote: "Life is not measured by the number of breaths we take, but by the moments that take our breath away.",
      quoteAuthor: 'Maya Angelou',
    },
    {
      title: 'The Legacy',
      subtitle: 'What you leave behind',
      theme: 'Transmission · Wisdom · Message to future generations',
      prompt: "If you had only one thing to pass on - a truth that took you time to understand - what would it be? Who are you addressing it to?",
      quote: "We do not inherit the earth from our ancestors, we borrow it from our children.",
      quoteAuthor: 'Antoine de Saint-Exupéry',
    },
  ],
  es: [
    {
      title: 'Las Raíces',
      subtitle: 'De dónde vienes de verdad',
      theme: 'Orígenes · Familia · Tierra natal',
      prompt: 'Cuéntame sobre tu primer hogar. Los olores, los sonidos, lo que veías desde la ventana. ¿Quién estaba allí?',
      quote: "No sabemos quiénes somos hasta que miramos de dónde venimos.",
      quoteAuthor: 'Toni Morrison',
    },
    {
      title: 'El Despertar',
      subtitle: 'El momento en que el mundo se abrió',
      theme: 'Infancia · Descubrimiento · Primera maravilla',
      prompt: '¿Cuál es el primer recuerdo en que sentiste que realmente veías el mundo - su belleza, su complejidad, o su injusticia?',
      quote: "La infancia es lo que queda cuando ya lo has olvidado todo.",
      quoteAuthor: 'Jean-Paul Dubois',
    },
    {
      title: 'Las Primeras Audacias',
      subtitle: 'Cuando te atreviste',
      theme: 'Juventud · Decisiones · Primeros pasos en la vida',
      prompt: 'Cuéntame un momento en que hiciste algo por primera vez y todo cambió. ¿Qué edad tenías? ¿Qué sentiste al cruzar ese umbral?',
      quote: "El coraje es tener miedo y seguir adelante de todos modos.",
      quoteAuthor: 'Amelia Earhart',
    },
    {
      title: 'Los Amores',
      subtitle: 'Quienes importaron',
      theme: 'Amor · Amistad · Vínculos profundos',
      prompt: 'Piensa en alguien que cambió profundamente quién eres - un amor, un amigo, un mentor. ¿Cómo entró esa persona en tu vida?',
      quote: "Las personas solo pasan, pero algunas dejan huellas profundas en tu alma.",
      quoteAuthor: 'Franz Kafka',
    },
    {
      title: 'Las Pruebas',
      subtitle: 'Lo que te forjó',
      theme: 'Dificultades · Resiliencia · Transformación',
      prompt: 'Hubo un momento difícil - una pérdida, una ruptura, un fracaso, una enfermedad. Cuéntame no lo que pasó, sino cómo lo atravesaste.',
      quote: "Lo que no me mata me hace más fuerte. Pero lo que casi me mató me volvió más compasivo.",
      quoteAuthor: 'Rainer Maria Rilke',
    },
    {
      title: 'Lo Que He Construido',
      subtitle: 'Tus obras maestras cotidianas',
      theme: 'Logros · Familia · Obra de vida',
      prompt: "¿De qué estás más orgulloso/a - no en términos de éxito, sino de lo que construiste con tus manos, tu corazón, tu tiempo?",
      quote: "La vida no se mide por el número de respiraciones que tomamos, sino por los momentos que nos quitan el aliento.",
      quoteAuthor: 'Maya Angelou',
    },
    {
      title: 'El Legado',
      subtitle: 'Lo que dejas atrás',
      theme: 'Transmisión · Sabiduría · Mensaje a las generaciones futuras',
      prompt: "Si solo tuvieras una cosa que transmitir - una verdad que te costó tiempo entender - ¿cuál sería? ¿A quién se la diriges?",
      quote: "No heredamos la tierra de nuestros antepasados, la tomamos prestada de nuestros hijos.",
      quoteAuthor: 'Antoine de Saint-Exupéry',
    },
  ],
}

/**
 * Returns a chapter with display fields (title, subtitle, prompt, quote, etc.)
 * translated to the given language. The id, number, and status are unchanged.
 */
export function getChapterDisplay(ch: TrameChapter, lang: 'fr' | 'en' | 'es'): TrameChapter {
  if (lang === 'fr') return ch
  const t = TRAME_TRANSLATIONS[lang]?.[ch.number - 1]
  if (!t) return ch
  return { ...ch, ...t }
}

// ── Session messages ───────────────────────────────────────────
export function getSessionMessage(wordCount: number, name: string, lang: 'fr' | 'en' | 'es' = 'fr'): string {
  if (lang === 'en') {
    if (wordCount < 50) return `Every word counts, ${name}. You've started.`
    if (wordCount < 150) return `${wordCount} words - a beautiful page of life. Come back tomorrow.`
    if (wordCount < 300) return `${wordCount} words. You entered the story, ${name}. We're in it.`
    return `${wordCount} words. A real writing session. Your future reader will thank you.`
  }
  if (lang === 'es') {
    if (wordCount < 50) return `Cada palabra cuenta, ${name}. Has empezado.`
    if (wordCount < 150) return `${wordCount} palabras - una bella página de vida. Nos vemos mañana.`
    if (wordCount < 300) return `${wordCount} palabras. Entraste en el relato, ${name}. Vamos juntos.`
    return `${wordCount} palabras. Una verdadera sesión de escritura. Tu futuro lector te lo agradecerá.`
  }
  if (wordCount < 50) return `Chaque mot compte, ${name}. Vous avez commencé.`
  if (wordCount < 150) return `${wordCount} mots - une belle page de vie. Revenez demain.`
  if (wordCount < 300) return `${wordCount} mots. Vous êtes entré dans le récit, ${name}. On y est.`
  return `${wordCount} mots. Une vraie séance d'écriture. Votre futur lecteur vous remerciera.`
}

// ── Daily quotes by language ───────────────────────────────────
export const DAILY_QUOTES_BY_LANG = {
  fr: [
    { text: 'Toute vie mérite un roman.', author: 'Simone de Beauvoir' },
    { text: "Écrire, c'est aussi une façon de ne pas mourir.", author: 'Marguerite Duras' },
    { text: 'Nos histoires sont nos racines. Sans elles, nous flottons.', author: 'Isabel Allende' },
    { text: "Le passé n'est jamais mort. Il n'est même pas passé.", author: 'William Faulkner' },
    { text: "Raconter sa vie, c'est la vivre deux fois.", author: 'Gabriel García Márquez' },
    { text: "Il faut du courage pour se raconter honnêtement.", author: 'James Baldwin' },
    { text: 'Chaque famille est un roman.', author: 'Elena Ferrante' },
    { text: "On n'écrit pas ce qu'on veut, et de cette façon-là on commence à être libéré.", author: 'Marguerite Yourcenar' },
    { text: "Je me souviens. Je me souviens de tout.", author: 'Georges Perec' },
    { text: "Écrire, c'est aussi une façon d'aimer sans être aimé en retour.", author: 'Patrick Modiano' },
    { text: "L'écriture est le voyage le plus long, celui qui vous conduit à vous-même.", author: 'Annie Ernaux' },
    { text: "Longtemps, je me suis couché de bonne heure.", author: 'Marcel Proust' },
  ],
  en: [
    { text: 'Every life deserves a novel.', author: 'Simone de Beauvoir' },
    { text: 'Writing is also a way of not dying.', author: 'Marguerite Duras' },
    { text: 'Our stories are our roots. Without them, we drift.', author: 'Isabel Allende' },
    { text: "The past is never dead. It's not even past.", author: 'William Faulkner' },
    { text: 'To tell your life is to live it twice.', author: 'Gabriel García Márquez' },
    { text: 'It takes courage to tell your story honestly.', author: 'James Baldwin' },
    { text: 'Every family is a novel.', author: 'Elena Ferrante' },
    { text: "One does not write what one wants, and in this way one begins to be freed.", author: 'Marguerite Yourcenar' },
    { text: "I remember. I remember everything.", author: 'Georges Perec' },
    { text: "Writing is the longest journey, the one that leads you to yourself.", author: 'Annie Ernaux' },
    { text: "For a long time I would go to bed early.", author: 'Marcel Proust' },
  ],
  es: [
    { text: 'Toda vida merece una novela.', author: 'Simone de Beauvoir' },
    { text: 'Escribir es también una forma de no morir.', author: 'Marguerite Duras' },
    { text: 'Nuestras historias son nuestras raíces. Sin ellas, flotamos.', author: 'Isabel Allende' },
    { text: 'El pasado nunca está muerto. Ni siquiera es pasado.', author: 'William Faulkner' },
    { text: 'Contar tu vida es vivirla dos veces.', author: 'Gabriel García Márquez' },
    { text: 'Hace falta coraje para contarse con honestidad.', author: 'James Baldwin' },
    { text: 'Cada familia es una novela.', author: 'Elena Ferrante' },
    { text: "No se escribe lo que se quiere, y de esa manera uno comienza a liberarse.", author: 'Marguerite Yourcenar' },
    { text: "Me acuerdo. Me acuerdo de todo.", author: 'Georges Perec' },
    { text: "La escritura es el viaje más largo, el que te conduce a ti mismo.", author: 'Annie Ernaux' },
    { text: "Durante mucho tiempo me acosté temprano.", author: 'Marcel Proust' },
  ],
}

// Keep legacy export for any direct imports
export const DAILY_QUOTES = DAILY_QUOTES_BY_LANG.fr
