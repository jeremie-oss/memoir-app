import { NextRequest } from 'next/server'

// Open Router - OpenAI-compatible endpoint
// Model: claude-haiku via Open Router (can swap freely)
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'anthropic/claude-haiku-4-5'

type ConvoMsg = { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, chapter, userName, lang, content, conversation, intention, destinataire, sessions, profile, memories } = body as {
    action: 'guide_question' | 'guide_generate' | 'dicte_reformulate' | 'libre_inspire' | 'onboarding_style' | 'entretien_question' | 'entretien_close' | 'upload_analyze' | 'brainstorm_question' | 'brainstorm_generate'
    chapter?: { title: string; theme: string; prompt?: string }
    userName: string
    lang: 'fr' | 'en' | 'es'
    content?: string
    conversation?: ConvoMsg[]
    intention?: string
    destinataire?: string
    sessions?: { chapterId: string; wordCount: number; content: string; date: string }[]
    profile?: { intention: string; destinataire: string; frequence: string; ton?: string }
    memories?: string[]
  }

  const langLabel = lang === 'fr' ? 'French' : lang === 'es' ? 'Spanish' : 'English'

  let systemPrompt = ''
  let messages: ConvoMsg[] = []
  let maxTokens = 150

  if (action === 'guide_question') {
    systemPrompt = [
      `You are a documentary filmmaker and memoirist guiding ${userName} through their memories for chapter "${chapter!.title}" (${chapter!.theme}).`,
      `Your role: ask ONE precise, concrete question that takes them INSIDE a specific memory - a place, an object, a face, a sound, a smell, a precise instant.`,
      `Navigate like a camera: zoom into the scene, explore what was around them, what happened just before or just after, what they saw or touched or heard.`,
      `NEVER ask about feelings, emotions, inner states, or the meaning of a memory. Focus only on concrete, tangible, observable details.`,
      `Examples of good questions: "Décrivez l'endroit exact où vous étiez." / "Qui d'autre était présent ?" / "Qu'avez-vous remarqué en premier ?" / "Que s'est-il passé juste après ?"`,
      chapter!.prompt ? `Chapter context: ${chapter!.prompt}` : '',
      `Language: ${langLabel}. ONE question only, direct, no preamble, no "I", just the question itself.`,
    ].filter(Boolean).join(' ')

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
    const convoText = (conversation || [])
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n\n')

    systemPrompt = [
      `You are a literary writer helping ${userName} write their memoir.`,
      `Based on their answers to interview questions, write a rich, flowing paragraph in FIRST PERSON (as ${userName}).`,
      `Chapter: "${chapter!.title}" - ${chapter!.theme}.`,
      `Style: literary, warm, sensory - like a published memoir. Include specific details they mentioned.`,
      `Language: ${langLabel}. Write 180-240 words of prose. No meta-commentary, just the text itself.`,
    ].join(' ')

    messages = [
      {
        role: 'user',
        content: `Here are my memories about this chapter:\n\n${convoText}\n\nNow write the memoir paragraph.`,
      },
    ]
    maxTokens = 450
  }

  else if (action === 'dicte_reformulate') {
    systemPrompt = [
      `You are a literary editor specializing in memoir writing.`,
      `Rewrite the following raw text as elegant memoir prose in FIRST PERSON.`,
      `Keep ALL the facts, memories, and emotions - transform the style into literary, flowing prose with sensory detail.`,
      `Language: ${langLabel}. Write only the rewritten text, no commentary. Maintain similar length.`,
    ].join(' ')

    messages = [{ role: 'user', content: content || '' }]
    maxTokens = 600
  }

  else if (action === 'libre_inspire') {
    systemPrompt = [
      `You are a creative writing companion for a memoir app.`,
      `Give 1-2 evocative opening sentences to help ${userName} begin writing a memoir passage about "${chapter!.title}" (${chapter!.theme}).`,
      `Style: beautiful, specific, sensory - like the first lines of a great memoir.`,
      `Language: ${langLabel}. ONLY the opening sentence(s), nothing else, no attribution.`,
      chapter!.prompt ? `Inspiration: ${chapter!.prompt}` : '',
    ].filter(Boolean).join(' ')

    messages = [{ role: 'user', content: 'Give me an opening.' }]
    maxTokens = 80
  }

  else if (action === 'onboarding_style') {
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

  else {
    return new Response('Unknown action', { status: 400 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return new Response('OPENROUTER_API_KEY not configured', { status: 500 })
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://memoir.app',
        'X-Title': 'Memoir',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: maxTokens,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[memoir/api] Open Router error:', err)
      return new Response('AI error', { status: 500 })
    }

    // Forward the SSE stream, extracting text deltas
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
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                controller.enqueue(encoder.encode(delta))
              }
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
    return new Response('AI error', { status: 500 })
  }
}
