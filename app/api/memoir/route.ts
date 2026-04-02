import { NextRequest } from 'next/server'
import { getAgentModel, getActiveAdapter } from '@/lib/ai/agent-config'

type ConvoMsg = { role: 'user' | 'assistant'; content: string }

// In-memory rate limiter — beta safeguard (resets on cold start, good enough for early users)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 20            // 20 requests/min per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 })
  }

  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > 100_000) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 })
  }
  const body = await req.json()
  const { action, chapter, userName, lang, content, conversation, intention, destinataire, sessions, profile, memories } = body as {
    action: 'guide_question' | 'guide_generate' | 'dicte_reformulate' | 'libre_inspire' | 'onboarding_style' | 'entretien_question' | 'entretien_close' | 'upload_analyze' | 'brainstorm_question' | 'brainstorm_generate' | 'trame_generate' | 'archiviste_update' | 'archiviste_gaps' | 'archiviste_style' | 'archiviste_scan_characters' | 'archiviste_scan_timeline' | 'relecteur_review' | 'architecte_review'
    chapter?: { title: string; theme: string; prompt?: string }
    userName: string
    lang: 'fr' | 'en' | 'es' | 'tr'
    content?: string
    conversation?: ConvoMsg[]
    intention?: string
    destinataire?: string
    sessions?: { chapterId: string; wordCount: number; content: string; date: string }[]
    profile?: { intention: string; destinataire: string; frequence: string; ton?: string }
    memories?: string[]
    isAccomp?: boolean
    subjectName?: string
  }

  const { isAccomp, subjectName: subj } = body as { isAccomp?: boolean; subjectName?: string }
  const { bookStateText, styleFingerprint, previousPassages, allSessions: allSessionsText } = body as {
    bookStateText?: string
    styleFingerprint?: string
    previousPassages?: string[]
    allSessions?: string
  }
  const { bornYear, chapterNumber } = body as { bornYear?: number | null; chapterNumber?: number }
  const { excerpts: scanExcerpts, lastPassages: scanLastPassages, existingChars, existingEvents, plan: userPlan } = body as {
    excerpts?: string
    lastPassages?: string
    existingChars?: { id: string; name: string; relation: string }[]
    existingEvents?: { id: string; date: string; title: string }[]
    plan?: string
  }
  const { bookFoundations } = body as {
    bookFoundations?: { period: string; keyPeople: string; theme: string; ambition: string } | null
  }

  function getFoundationsContext(): string {
    if (!bookFoundations) return ''
    const parts = [
      bookFoundations.period && `Period covered: ${bookFoundations.period}`,
      bookFoundations.keyPeople && `Key people: ${bookFoundations.keyPeople}`,
      bookFoundations.theme && `Central theme: ${bookFoundations.theme}`,
      bookFoundations.ambition && `Author's intention: ${bookFoundations.ambition}`,
    ].filter(Boolean)
    if (!parts.length) return ''
    return `BOOK FOUNDATIONS:\n${parts.join('\n')}`
  }

  // Temporal context for anachronism prevention
  function getTemporalContext(): string {
    if (!bornYear) return ''
    const chNum = chapterNumber ?? 1
    // Approximate chapter period based on chapter position (7-chapter arc)
    const periodStart = bornYear + Math.max(0, (chNum - 1) * 8)
    const periodEnd = periodStart + 10
    return `TEMPORAL CONTEXT: The author was born in ${bornYear}. This chapter covers approximately ${periodStart}-${periodEnd}. Only reference technology, culture, and events that actually existed during this period. For example: no smartphones before 2007, no Facebook before 2004, no React/Node.js before 2013, no streaming services before 2010.`
  }
  const langLabel = lang === 'fr' ? 'French' : lang === 'es' ? 'Spanish' : lang === 'tr' ? 'Turkish' : 'English'

  let systemPrompt = ''
  let messages: ConvoMsg[] = []
  let maxTokens = 150
  let agentId: Parameters<typeof getAgentModel>[0] = 'interrogateur'

  if (action === 'guide_question') {
    agentId = 'interrogateur'
    if (isAccomp && subj) {
      systemPrompt = [
        `You are helping ${userName} conduct a biographical interview with ${subj} for chapter "${chapter!.title}" (${chapter!.theme}).`,
        `Generate ONE concrete question that ${userName} can ask ${subj} directly, to draw out a specific memory — a place, an object, a face, a sound, a sequence of events.`,
        `The question must be simple, warm, and accessible — phrased as if ${userName} is speaking gently to ${subj}.`,
        `NEVER ask about feelings, meanings, or psychological reflection. Focus on tangible, observable, concrete details.`,
        `Examples: "Où étiez-vous exactement ce jour-là ?" / "Qui était avec vous ?" / "Qu'avez-vous vu en premier ?" / "Que s'est-il passé ensuite ?"`,
        chapter!.prompt ? `Chapter context: ${chapter!.prompt}` : '',
        `Language: ${langLabel}. ONE question only, addressed directly to ${subj}, no preamble.`,
        getTemporalContext(),
        getFoundationsContext(),
      ].filter(Boolean).join(' ')
    } else {
      systemPrompt = [
        `You are a documentary filmmaker and memoirist guiding ${userName} through their memories for chapter "${chapter!.title}" (${chapter!.theme}).`,
        `Your role: ask ONE precise, concrete question that takes them INSIDE a specific memory - a place, an object, a face, a sound, a smell, a precise instant.`,
        `Navigate like a camera: zoom into the scene, explore what was around them, what happened just before or just after, what they saw or touched or heard.`,
        `NEVER ask about feelings, emotions, inner states, or the meaning of a memory. Focus only on concrete, tangible, observable details.`,
        `Examples of good questions: "Décrivez l'endroit exact où vous étiez." / "Qui d'autre était présent ?" / "Qu'avez-vous remarqué en premier ?" / "Que s'est-il passé juste après ?"`,
        chapter!.prompt ? `Chapter context: ${chapter!.prompt}` : '',
        getTemporalContext(),
        getFoundationsContext(),
        `Language: ${langLabel}. ONE question only, direct, no preamble, no "I", just the question itself.`,
      ].filter(Boolean).join(' ')
    }

    if (!conversation || conversation.length === 0) {
      messages = [{ role: 'user', content: 'Ask me your first question to enter the memory.' }]
    } else {
      messages = [
        ...conversation,
        { role: 'user', content: 'Ask a follow-up that digs deeper into the scene or moment I just described.' },
      ]
    }
    maxTokens = 100
  }

  else if (action === 'guide_generate') {
    agentId = 'ecrivain'
    const convoText = (conversation || [])
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n\n')

    if (isAccomp && subj) {
      systemPrompt = [
        `You are a literary writer helping ${userName} write the memoir of ${subj}.`,
        `Based on the notes and answers gathered during the interview, write a rich, flowing paragraph in THIRD PERSON about ${subj}.`,
        `Chapter: "${chapter!.title}" - ${chapter!.theme}.`,
        `Style: literary, warm, sensory - like a published biographical memoir. Include specific details mentioned. Write about ${subj} as "il" or "elle" or their name, as befits the language.`,
        `Language: ${langLabel}. Write 180-240 words of prose. No meta-commentary, just the text itself.`,
        `STYLE RULE: never use em dashes (—) or en dashes (–). Use commas, parentheses, or restructure the sentence instead.`,
        getTemporalContext(),
        getFoundationsContext(),
      ].filter(Boolean).join(' ')
    } else {
      systemPrompt = [
        `You are a literary writer helping ${userName} write their memoir.`,
        `Based on their answers to interview questions, write a rich, flowing paragraph in FIRST PERSON (as ${userName}).`,
        `Chapter: "${chapter!.title}" - ${chapter!.theme}.`,
        `Style: literary, warm, sensory - like a published memoir. Include specific details they mentioned.`,
        `Language: ${langLabel}. Write 180-240 words of prose. No meta-commentary, just the text itself.`,
        `STYLE RULE: never use em dashes (—) or en dashes (–). Use commas, parentheses, or restructure the sentence instead.`,
        getTemporalContext(),
        getFoundationsContext(),
      ].filter(Boolean).join(' ')
    }

    messages = [
      {
        role: 'user',
        content: `Here are my memories about this chapter:\n\n${convoText}\n\nNow write the memoir paragraph.`,
      },
    ]
    maxTokens = 450
  }

  else if (action === 'dicte_reformulate') {
    agentId = 'ecrivain'
    if (isAccomp && subj) {
      systemPrompt = [
        `You are a literary editor specializing in biographical memoir writing.`,
        `Rewrite the following raw notes as elegant memoir prose in THIRD PERSON about ${subj}.`,
        `Keep ALL the facts and details - transform the style into literary, flowing biographical prose with sensory detail. Refer to ${subj} by name or as "il"/"elle" as appropriate.`,
        `Language: ${langLabel}. Write only the rewritten text, no commentary. Maintain similar length.`,
        `STYLE RULE: never use em dashes (—) or en dashes (–). Use commas, parentheses, or restructure instead.`,
      ].join(' ')
    } else {
      systemPrompt = [
        `You are a gentle copy-editor for memoir writing. Your role is to POLISH, not rewrite.`,
        `Lightly improve the following text: fix grammar, smooth awkward phrasing, add a touch of sensory precision where natural.`,
        `STRICT RULES: preserve the author's exact voice, rhythm, and all original ideas. Do NOT restructure sentences. Do NOT add new content or metaphors. Stay as close to the original as possible — only smooth what is rough.`,
        `STYLE RULE: never use em dashes (—) or en dashes (–). Use commas or parentheses instead.`,
        `Language: ${langLabel}. Output only the polished text, no commentary.`,
      ].join(' ')
    }

    messages = [{ role: 'user', content: content || '' }]
    maxTokens = 600
  }

  else if (action === 'libre_inspire') {
    agentId = 'ecrivain'
    systemPrompt = [
      `You are a creative writing companion for a memoir app.`,
      `Give 1-2 evocative opening sentences to help ${userName} begin writing a memoir passage about "${chapter!.title}" (${chapter!.theme}).`,
      `Style: beautiful, specific, sensory - like the first lines of a great memoir.`,
      `STYLE RULE: never use em dashes (—) or en dashes (–).`,
      `Language: ${langLabel}. ONLY the opening sentence(s), nothing else, no attribution.`,
      chapter!.prompt ? `Inspiration: ${chapter!.prompt}` : '',
      getFoundationsContext(),
    ].filter(Boolean).join(' ')

    messages = [{ role: 'user', content: 'Give me an opening.' }]
    maxTokens = 80
  }

  else if (action === 'onboarding_style') {
    agentId = 'ecrivain'
    systemPrompt = [
      `You are a master memoir writer. Based on the author's context, generate exactly 3 short opening memoir excerpts.`,
      `Author: ${userName || 'the author'}. Intention: "${intention || 'share memories'}". Writing for: "${destinataire || 'family'}".`,
      `Write one excerpt per style, in this exact order:`,
      `1. ROMANCÉ - poetic, sensory, metaphorical; memory as emotion and imagery.`,
      `2. BIOGRAPHIQUE - precise, warm, chronological; facts, places, timeline.`,
      `3. DOCUMENTAIRE - testimonial, contextual, historical; society, era, observation.`,
      `Rules: write in first person as ${userName || 'the author'}. Each excerpt: exactly 2-3 sentences. Feel like real memoir openings.`,
      `Separate the 3 excerpts with exactly "|||" (no spaces, no newlines around it). Write ONLY the 3 excerpts separated by "|||", no labels, no commentary.`,
      `Language: ${langLabel}.`,
    ].join(' ')
    messages = [{ role: 'user', content: 'Generate the 3 style excerpts now.' }]
    maxTokens = 350
  }

  else if (action === 'entretien_question') {
    agentId = 'interrogateur'
    // The AI plays a warm biographical interviewer who has read the user's writing
    const recentSnippets = (sessions ?? [])
      .slice(-3)
      .map((s) => `[${s.date.slice(0, 10)}] ${s.content.slice(0, 200)}…`)
      .join('\n\n')

    systemPrompt = [
      `You are a skilled biographical interviewer and documentary filmmaker accompanying ${userName} in recovering their memories for their memoir.`,
      `Your role: guide them through specific scenes and moments from their life - like a camera exploring a landscape.`,
      `Ask about concrete, tangible details: places, people, objects, sounds, smells, sequences of events, precise instants. Navigate chronologically or zoom into a detail they just mentioned.`,
      `NEVER ask about feelings, emotions, what something "meant" to them, or psychological reflection. Stay in the observable world of memory.`,
      `Context about ${userName}:`,
      profile?.intention ? `- Writing intention: "${profile.intention}"` : '',
      profile?.destinataire ? `- Writing for: "${profile.destinataire}"` : '',
      recentSnippets ? `- Recent writing:\n${recentSnippets}` : '',
      ``,
      `Language: ${langLabel}. ONE short, concrete question. No preamble. Direct.`,
    ].filter(Boolean).join('\n')

    if (!conversation || conversation.length === 0) {
      messages = [{ role: 'user', content: 'Start our conversation.' }]
    } else {
      messages = [
        ...conversation,
        { role: 'user', content: 'Continue our conversation with a follow-up question.' },
      ]
    }
    maxTokens = 120
  }

  else if (action === 'entretien_close') {
    agentId = 'archiviste'
    // Summarize the conversation as seeds for future chapters
    const convoText = (conversation ?? [])
      .map((m) => `${m.role === 'user' ? userName : 'Memoir'}: ${m.content}`)
      .join('\n')

    systemPrompt = [
      `You are a memoir editor. Based on this biographical conversation, extract 3 concrete "seeds" - specific memories, emotions, or themes that ${userName} could develop into future chapters.`,
      `Format: 3 short bullets, each starting with "✦ ".`,
      `Be specific, poetic, and personal - not generic. Reference actual things ${userName} said.`,
      `Language: ${langLabel}.`,
    ].join(' ')

    messages = [{ role: 'user', content: `Conversation:\n\n${convoText}\n\nExtract the 3 seeds.` }]
    maxTokens = 200
  }

  else if (action === 'upload_analyze') {
    agentId = 'archiviste'
    systemPrompt = [
      `You are a literary editor analyzing an author's existing text to extract memory seeds for a memoir.`,
      `Read the text and identify 5-10 distinct memory seeds — specific scenes, characters, time periods, themes.`,
      `For each seed, provide:`,
      `- "content": a 1-2 sentence description of the memory/scene`,
      `- "tags": 2-4 relevant tags (people names, places, era, topics)`,
      `- "theme": a short theme label (e.g. "Enfance", "Famille", "Voyage", "Travail")`,
      `Output a valid JSON array. Example: [{"content":"Description here", "tags":["tag1","tag2"], "theme":"Theme"}]`,
      `CRITICAL: output ONLY the raw JSON array, no markdown, no backticks, no commentary. Escape any quotes inside strings with backslash.`,
      `Language: ${langLabel}.`,
    ].join(' ')
    messages = [{ role: 'user', content: `Analyze this text:\n\n${content || ''}` }]
    maxTokens = 1800
  }

  else if (action === 'brainstorm_question') {
    agentId = 'architecte'
    const memoryContext = (memories ?? []).length > 0
      ? `\nMemory seeds from their uploads:\n${(memories ?? []).slice(0, 10).map((m, i) => `${i + 1}. ${m}`).join('\n')}`
      : ''

    systemPrompt = [
      `You are an editorial director and literary architect helping ${userName} design the narrative plan (trame) for their book.`,
      `The book could be autobiographical, a family chronicle, a tribute, a testimony, a collection of stories, or anything else — do NOT assume it is a straightforward autobiography.`,
      `Your goal: understand what book ${userName} wants to write, its themes, scope, and structure.`,
      `Ask about: what the book is about, who or what it concerns, what periods or events matter, what the reader should take away, the tone and spirit they envision.`,
      `Be concrete and specific. Focus on subject matter, not on emotions or psychological reflection.`,
      profile?.intention ? `Their writing intention: "${profile.intention}"` : '',
      profile?.destinataire ? `Writing for: "${profile.destinataire}"` : '',
      memoryContext,
      `Language: ${langLabel}. ONE question, direct, warm, concrete. No preamble.`,
    ].filter(Boolean).join('\n')

    if (!conversation || conversation.length === 0) {
      messages = [{ role: 'user', content: 'Ask me the first question to start sketching my book outline.' }]
    } else {
      messages = [
        ...conversation,
        { role: 'user', content: 'Ask a follow-up to deepen the narrative structure.' },
      ]
    }
    maxTokens = 150
  }

  else if (action === 'brainstorm_generate') {
    agentId = 'architecte'
    const convoText = (conversation ?? [])
      .map((m) => `${m.role === 'user' ? userName : 'Memoir'}: ${m.content}`)
      .join('\n')

    const memoryContext = (memories ?? []).length > 0
      ? `\nMemory seeds:\n${(memories ?? []).slice(0, 10).map((m, i) => `${i + 1}. ${m}`).join('\n')}`
      : ''

    systemPrompt = [
      `You are an editorial director creating a personalized book narrative plan (trame) for ${userName}.`,
      `Based on the conversation and any memory seeds, generate 5-10 chapters that form a coherent arc for their book.`,
      `The book may be autobiographical, a family chronicle, a tribute, a testimony, or any other form — adapt to what was discussed.`,
      `Each chapter must have:`,
      `- "number": chapter number (1-based)`,
      `- "title": evocative chapter title`,
      `- "subtitle": short one-line description`,
      `- "theme": the central theme`,
      `- "prompt": a concrete, sensory writing prompt question that helps the author start writing this chapter`,
      `- "quote": a relevant literary quote`,
      `- "quoteAuthor": the quote's author`,
      `The arc should flow naturally and adapt to the book's nature. Don't be generic — use what ${userName} actually shared.`,
      profile?.ton ? `Writing tone preference: ${profile.ton}` : '',
      memoryContext,
      `CRITICAL: output ONLY the raw JSON array, no markdown, no backticks, no commentary. Escape any quotes inside strings with backslash.`,
      `Language: ${langLabel}.`,
    ].filter(Boolean).join('\n')

    messages = [{ role: 'user', content: `Brainstorm conversation:\n\n${convoText}\n\nGenerate my personalized trame as a raw JSON array.` }]
    maxTokens = 1500
  }

  // ── TRAME GENERATE (direct prompt, replaces brainstorm flow) ──────────────────

  else if (action === 'trame_generate') {
    agentId = 'architecte'
    const { userPrompt, chaptersMax: chapMax, bookFoundations: bf } = body as {
      userPrompt?: string
      chaptersMax?: number
      bookFoundations?: { period: string; keyPeople: string; theme: string; ambition: string } | null
    }
    const targetChapters = Math.min(chapMax ?? 10, 20)
    const memoryContext = (memories ?? []).length > 0
      ? `\nMemory seeds:\n${(memories ?? []).slice(0, 10).map((m, i) => `${i + 1}. ${m}`).join('\n')}`
      : ''
    const foundationsContext = bf
      ? [
          bf.period && `Period: ${bf.period}`,
          bf.keyPeople && `Key people: ${bf.keyPeople}`,
          bf.theme && `Central theme: ${bf.theme}`,
          bf.ambition && `Author's intention: ${bf.ambition}`,
        ].filter(Boolean).join('\n')
      : ''

    systemPrompt = [
      `You are an editorial director creating a personalized memoir narrative plan for ${userName || 'the author'}.`,
      `Generate exactly ${targetChapters} chapters that form a coherent, emotionally resonant arc for their book.`,
      `The book may be autobiographical, a family chronicle, a tribute, or any other form — infer from the context.`,
      `Each chapter object must have exactly these keys:`,
      `- "id": string like "ch-1", "ch-2", etc.`,
      `- "number": integer (1-based)`,
      `- "title": evocative chapter title (3-6 words)`,
      `- "subtitle": short one-line description (8-12 words)`,
      `- "theme": central theme (2-4 words)`,
      `- "prompt": concrete, sensory writing prompt question to start writing`,
      `- "quote": a relevant literary quote`,
      `- "quoteAuthor": the quote's author`,
      `- "status": always "unwritten"`,
      profile?.intention ? `Writing intention: "${profile.intention}"` : '',
      profile?.destinataire ? `Writing for: "${profile.destinataire}"` : '',
      profile?.ton ? `Tone preference: ${profile.ton}` : '',
      foundationsContext,
      memoryContext,
      userPrompt ? `Author's description of their book: "${userPrompt}"` : '',
      `Be specific to what the author shared. Avoid generic chapter titles like "The Beginning" or "Conclusion".`,
      `CRITICAL: output ONLY a raw JSON array (no markdown, no backticks, no commentary).`,
      `Language: ${langLabel}.`,
    ].filter(Boolean).join('\n')

    messages = [{ role: 'user', content: `Generate ${targetChapters} chapters as a raw JSON array.` }]
    maxTokens = 2000
  }

  // ── ARCHIVISTE ────────────────────────────────────────────────────────────────

  else if (action === 'archiviste_update') {
    agentId = 'archiviste'
    systemPrompt = [
      `You are the archivist of a memoir project. Analyze this new passage and extract ALL structured data.`,
      `Return ONLY a raw JSON object (no markdown, no backticks) with this exact shape:`,
      `{`,
      `  "characters": [{ "name": string, "relation": string, "period": string }],`,
      `  "events": [{ "date": string, "title": string, "description": string }],`,
      `  "contradictions": [{ "type": string, "description": string }]`,
      `}`,
      ``,
      `CHARACTERS — extract every person who appears:`,
      `- Any person referred to by name (first name, surname, nickname, or title+name)`,
      `- Any clearly identified person without a name (e.g. "my mother", "my teacher Mr. X")`,
      `- name: the name or identifier used in the text`,
      `- relation: their relationship to the narrator (parent, friend, teacher, colleague, etc.)`,
      `- period: the life period they appear in ("childhood", "1970s", "university years", etc.)`,
      ``,
      `EVENTS — extract every datable moment or period:`,
      `- Any year or approximate year mentioned (1978, "the late 70s", "around 1985")`,
      `- Any named season or month with year ("summer of 1982", "March 1991")`,
      `- Any life milestone (birth, marriage, move, graduation, job, death, trip)`,
      `- Any historical or world event referenced in context`,
      `- date: exact or approximate date/period as free text ("1978", "Été 1982", "fin des années 70")`,
      `- title: short label for the event (5 words max)`,
      `- description: one sentence summarizing what happened`,
      ``,
      `CONTRADICTIONS — only flag real conflicts with the existing book state below.`,
      bookStateText ? `Existing book state:\n${bookStateText}` : '',
      getFoundationsContext(),
      ``,
      `Output raw JSON only. If nothing found for a category, return an empty array [].`,
    ].filter(Boolean).join('\n')
    messages = [{ role: 'user', content: `Passage to analyze:\n\n${content || ''}` }]
    maxTokens = 800
  }

  else if (action === 'archiviste_gaps') {
    agentId = 'archiviste'
    systemPrompt = [
      `You are the archivist of a memoir project. Analyze the current state of the book and identify gaps.`,
      `Return ONLY a raw JSON array of gaps (no markdown, no backticks):`,
      `[{ "chapterId": string, "type": "missing_chapter"|"undefined_character"|"timeline_gap"|"style_drift", "description": string, "priority": "high"|"medium"|"low" }]`,
      `missing_chapter: chapter with 0 words that is important to the narrative.`,
      `undefined_character: a person mentioned in sessions but not in the character registry.`,
      `timeline_gap: a significant period of the author's life not covered by any chapter.`,
      `style_drift: a passage whose style seems inconsistent with the rest (only flag if obvious).`,
      `Maximum 8 gaps. Order by priority descending. Only flag real issues.`,
      `Language: ${langLabel}. Output raw JSON array only.`,
    ].join('\n')
    messages = [{ role: 'user', content: `Book state:\n\n${bookStateText || 'No data yet.'}` }]
    maxTokens = 800
  }

  else if (action === 'archiviste_style') {
    agentId = 'archiviste'
    systemPrompt = [
      `You are a literary analyst. Analyze the following memoir passages written by ${userName} and extract their writing style fingerprint.`,
      `Write 3-5 sentences describing:`,
      `- Sentence length and rhythm (short/clipped vs long/flowing)`,
      `- Vocabulary register (simple/familiar vs literary/elevated)`,
      `- Sensory preferences (which senses they favor: visual, tactile, olfactory...)`,
      `- Emotional tone (restrained/factual vs lyrical/intimate)`,
      `- Any distinctive stylistic traits`,
      `This fingerprint will be given to a writing agent so it MUST reproduce this exact style. Be precise and actionable.`,
      `Language: ${langLabel}. Output only the style description, no preamble.`,
    ].join('\n')
    messages = [{ role: 'user', content: `Passages by ${userName}:\n\n${allSessionsText || content || ''}` }]
    maxTokens = 300
  }

  // ── RELECTEUR ─────────────────────────────────────────────────────────────────

  else if (action === 'relecteur_review') {
    agentId = 'relecteur'
    systemPrompt = [
      `You are a careful, benevolent first-time reader of a memoir. You know NOTHING about the author's life except what is written.`,
      `Read this new passage in the context of everything written so far. Flag only concrete problems that would confuse a reader.`,
      `Return ONLY a raw JSON object (no markdown):`,
      `{ "reviews": [{ "type": "reference_opaque"|"contradiction"|"ellipse"|"repetition"|"opportunite", "passage": string, "explication": string, "suggestion": string }] }`,
      `reference_opaque: a pronoun or name used without enough context for a reader to know who/what it refers to.`,
      `contradiction: a fact (date, age, relationship) that conflicts with a previous passage.`,
      `ellipse: a time jump or implied event that a reader couldn't follow without being the author.`,
      `repetition: an anecdote or detail that was already told in a previous passage.`,
      `opportunite: a moment that is too factual and could benefit from one concrete sensory detail (flag sparingly).`,
      `Maximum 3 reviews. Only flag what genuinely impairs reading. If nothing significant: return { "reviews": [] }.`,
      `"passage": copy the exact short quote from the text. "suggestion": concrete fix, not a rewrite.`,
      `Language: ${langLabel}. Output raw JSON only.`,
    ].join('\n')
    messages = [{
      role: 'user',
      content: `Everything written so far:\n\n${allSessionsText || ''}\n\n---\n\nNew passage to review:\n\n${content || ''}`,
    }]
    maxTokens = 700
  }

  // ── ARCHITECTE NARRATIF ───────────────────────────────────────────────────────

  else if (action === 'architecte_review') {
    agentId = 'architecte'
    systemPrompt = [
      `You are an editorial director specializing in memoir books. Analyze the current state of this memoir and give concrete architectural feedback.`,
      `Return ONLY a raw JSON object (no markdown):`,
      `{`,
      `  "equilibre": { "analysis": string, "issues": [{ "chapterId": string, "description": string }] },`,
      `  "fil_rouge": { "analysis": string, "coherent": boolean },`,
      `  "suggestions": [{ "type": "reorder"|"split"|"merge"|"add"|"develop", "chapterId": string, "description": string, "actionable": string }]`,
      `}`,
      `equilibre: are chapters balanced in depth? Flag over- or under-represented ones.`,
      `fil_rouge: is there a consistent central theme running through all passages?`,
      `suggestions: max 3, concrete and actionable. "actionable" = exact next step for the user (1 sentence).`,
      `Be direct. No compliments. Only what genuinely needs attention.`,
      getFoundationsContext(),
      `Language: ${langLabel}. Output raw JSON only.`,
    ].filter(Boolean).join('\n')
    messages = [{ role: 'user', content: `Book state:\n\n${bookStateText || ''}\n\nAll passages:\n\n${allSessionsText || ''}` }]
    maxTokens = 900
  }

  // ── ARCHIVISTE SCAN PERSONNAGES ───────────────────────────────────────────────

  else if (action === 'archiviste_scan_characters') {
    agentId = 'archiviste'
    const isGutenberg = userPlan === 'gutenberg'
    const existingList = (existingChars || []).map((c) => `- ${c.name} (${c.relation}) [id:${c.id}]`).join('\n') || 'Aucun'
    const descriptionInstruction = isGutenberg
      ? `For each proposed character, also include "description": a 2-sentence portrait based STRICTLY on what the texts reveal (not invented). Write in ${langLabel}.`
      : `Do NOT include a "description" field.`
    systemPrompt = [
      `You are a memoir archivist. Your task: identify real human beings mentioned in memoir texts.`,
      `CRITICAL RULES:`,
      `- Respond ONLY with a valid JSON object. No explanation. No markdown. No text before or after the JSON.`,
      `- Only identify REAL HUMAN BEINGS: named people or people with a clear familial/social role (e.g. "ma mère", "mon ami Paul", "le directeur").`,
      `- NEVER include places, metaphors, abstract concepts, animals, or the narrator themselves.`,
      `- For proposed characters: use the most complete name form found in the text as the canonical name.`,
      `- If a found person might be the SAME as an existing catalogued character (same role, similar name, same relationship), put them in "possibleDuplicates" instead of "proposed".`,
      `- Confidence "high" = person clearly named or has explicit role. "low" = inferred or ambiguous.`,
      descriptionInstruction,
      `Language for all text fields: ${langLabel}.`,
      ``,
      `Respond with this exact JSON structure:`,
      `{"proposed":[{"name":"...","relation":"...","period":"...","confidence":"high","description":"..."}],"possibleDuplicates":[{"proposedName":"...","existingId":"...","existingName":"...","reason":"..."}]}`,
      `If no new characters found: {"proposed":[],"possibleDuplicates":[]}`,
    ].join('\n')
    messages = [{
      role: 'user',
      content: [
        `ALREADY CATALOGUED CHARACTERS (do NOT re-propose these):`,
        existingList,
        ``,
        `MEMOIR TEXT EXCERPTS (all sessions):`,
        scanExcerpts || '',
        ``,
        `RECENT FULL PASSAGES:`,
        scanLastPassages || '',
      ].join('\n'),
    }]
    maxTokens = 1200
  }

  // ── ARCHIVISTE SCAN CHRONOLOGIE ───────────────────────────────────────────────

  else if (action === 'archiviste_scan_timeline') {
    agentId = 'archiviste'
    const existingList = (existingEvents || []).map((e) => `- ${e.date}: ${e.title} [id:${e.id}]`).join('\n') || 'Aucun'
    const bornCtx = bornYear ? `The author was born in ${bornYear}. Use this to infer approximate years from age references (e.g. "quand j'avais 10 ans" → ${(bornYear ?? 0) + 10}).` : ''
    systemPrompt = [
      `You are a memoir archivist. Your task: identify datable life events from memoir texts.`,
      `CRITICAL RULES:`,
      `- Respond ONLY with a valid JSON object. No explanation. No markdown. No text before or after the JSON.`,
      `- Only include events with a minimum temporal anchor: a year, decade, or an age that can be converted to a year.`,
      `- SKIP vague references with no temporal information ("quand j'étais jeune", "jadis", "autrefois").`,
      `- If a found event is likely the SAME as an existing one (same period + similar description), put it in "possibleDuplicates".`,
      `- Dates: use the most precise form the text allows: "1975", "Été 1975", "Années 70", "Mars 1982".`,
      `- Confidence "high" = year explicit. "low" = year inferred from age or context.`,
      bornCtx,
      `Language for all text fields: ${langLabel}.`,
      ``,
      `Respond with this exact JSON structure:`,
      `{"proposed":[{"date":"...","title":"...","description":"...","confidence":"high"}],"possibleDuplicates":[{"proposedName":"...","existingId":"...","existingName":"...","reason":"..."}]}`,
      `If no new events found: {"proposed":[],"possibleDuplicates":[]}`,
    ].filter(Boolean).join('\n')
    messages = [{
      role: 'user',
      content: [
        `ALREADY CATALOGUED EVENTS (do NOT re-propose these):`,
        existingList,
        ``,
        `MEMOIR TEXT EXCERPTS (all sessions):`,
        scanExcerpts || '',
        ``,
        `RECENT FULL PASSAGES:`,
        scanLastPassages || '',
      ].join('\n'),
    }]
    maxTokens = 1000
  }

  else {
    return new Response('Unknown action', { status: 400 })
  }

  const adapter = getActiveAdapter()
  const apiKey = process.env[adapter.apiKeyEnv]
  if (!apiKey) {
    return new Response(`${adapter.apiKeyEnv} not configured`, { status: 500 })
  }

  // JSON agents don't stream — they need a complete, parseable response
  const isJsonAgent = ['archiviste_update', 'archiviste_gaps', 'archiviste_scan_characters', 'archiviste_scan_timeline', 'relecteur_review', 'architecte_review'].includes(action)

  const response = await fetch(adapter.url, {
    method: 'POST',
    headers: adapter.headers(apiKey),
    body: JSON.stringify(
      adapter.buildBody(getAgentModel(agentId), maxTokens, !isJsonAgent, systemPrompt, messages)
    ),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error(`[memoir/api] ${adapter.apiKeyEnv} error:`, response.status, err.slice(0, 200))
    const errType = adapter.parseError(response.status, err)
    if (errType === 'rate_limited') return new Response('AI_RATE_LIMITED',       { status: 429 })
    if (errType === 'credits')      return new Response('AI_CREDITS_EXHAUSTED',  { status: 402 })
    if (errType === 'overloaded')   return new Response('AI_OVERLOADED',         { status: 529 })
    return new Response(`AI_ERROR: ${err.slice(0, 300)}`, { status: 500 })
  }

  try {
    // For JSON agents: return the complete content directly (no streaming)
    if (isJsonAgent) {
      const json = await response.json() as Record<string, unknown>
      let content: string = adapter.parseJsonContent(json)
      // Strip markdown code fences (```json ... ```) that models sometimes add
      content = content.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
      return new Response(content, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // Forward the SSE stream — delta parsing delegated to the active adapter
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data) as Record<string, unknown>
              const delta = adapter.parseStreamDelta(parsed)
              if (delta) controller.enqueue(encoder.encode(delta))
            } catch {
              // skip malformed chunks
            }
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[memoir/api]', err)
    return new Response('AI_ERROR', { status: 500 })
  }
}
