'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore } from '@/stores/memoir'

const GRAIN = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

type Step = 'period' | 'people' | 'theme' | 'ambition' | 'done'

const STEPS: Step[] = ['period', 'people', 'theme', 'ambition']

const CONTENT = {
  fr: {
    header: 'Les fondations de votre livre',
    sub: 'Avant d\'écrire, posons ensemble les bases de votre histoire.',
    steps: {
      period: {
        label: '01 — La période',
        question: 'Quelle période de votre vie voulez-vous raconter ?',
        hint: 'ex. Mon enfance à Lyon dans les années 60, mes années à Paris, toute ma vie…',
        placeholder: 'Décrivez la période et le lieu…',
      },
      people: {
        label: '02 — Les personnages',
        question: 'Qui sont les personnes importantes dans cette histoire ?',
        hint: 'Nommez-les — on les retrouvera à chaque séance d\'écriture.',
        placeholder: 'Ma mère Suzanne, mon ami Pierre, mon père…',
      },
      theme: {
        label: '03 — Le fil rouge',
        question: 'Quel est le thème central de votre livre ?',
        hint: 'Ce qui relie toutes vos histoires. Pas besoin d\'être précis — une impression suffit.',
        placeholder: 'La famille, le courage, les racines, l\'amour, la liberté…',
      },
      ambition: {
        label: '04 — L\'intention profonde',
        question: 'Qu\'est-ce que vous voulez transmettre à ceux qui liront ce livre ?',
        hint: 'Ce que vous voulez que le lecteur emporte avec lui.',
        placeholder: 'Que mes petits-enfants sachent d\'où ils viennent…',
      },
    },
    next: 'Continuer →',
    back: '← Retour',
    finish: 'Poser les fondations',
    skip: 'Passer pour l\'instant',
    done: {
      title: 'Les fondations sont posées.',
      sub: 'Vos agents connaissent maintenant votre livre. Ils sauront quoi chercher, quoi retenir.',
      cta: 'Commencer à écrire →',
    },
  },
  en: {
    header: 'Your book foundations',
    sub: 'Before writing, let\'s lay the groundwork for your story.',
    steps: {
      period: {
        label: '01 — The period',
        question: 'What period of your life do you want to write about?',
        hint: 'e.g. My childhood in Lyon in the 60s, my years in Paris, my whole life…',
        placeholder: 'Describe the period and place…',
      },
      people: {
        label: '02 — The characters',
        question: 'Who are the important people in this story?',
        hint: 'Name them — they\'ll guide every writing session.',
        placeholder: 'My mother Suzanne, my friend Pierre, my father…',
      },
      theme: {
        label: '03 — The through-line',
        question: 'What is the central theme of your book?',
        hint: 'What connects all your stories. No need to be precise — an impression is enough.',
        placeholder: 'Family, courage, roots, love, freedom…',
      },
      ambition: {
        label: '04 — The deeper intention',
        question: 'What do you want to give to those who will read this book?',
        hint: 'What you want the reader to take away.',
        placeholder: 'That my grandchildren know where they come from…',
      },
    },
    next: 'Continue →',
    back: '← Back',
    finish: 'Set the foundations',
    skip: 'Skip for now',
    done: {
      title: 'Foundations are set.',
      sub: 'Your agents now know your book. They\'ll know what to look for, what to keep.',
      cta: 'Start writing →',
    },
  },
  es: {
    header: 'Los cimientos de tu libro',
    sub: 'Antes de escribir, establecemos las bases de tu historia.',
    steps: {
      period: {
        label: '01 — El período',
        question: '¿Qué período de tu vida quieres contar?',
        hint: 'ej. Mi infancia en Lyon en los años 60, mis años en París, toda mi vida…',
        placeholder: 'Describe el período y el lugar…',
      },
      people: {
        label: '02 — Los personajes',
        question: '¿Quiénes son las personas importantes en esta historia?',
        hint: 'Nómbralos — aparecerán en cada sesión de escritura.',
        placeholder: 'Mi madre Susana, mi amigo Pedro, mi padre…',
      },
      theme: {
        label: '03 — El hilo conductor',
        question: '¿Cuál es el tema central de tu libro?',
        hint: 'Lo que conecta todas tus historias. No hace falta ser preciso.',
        placeholder: 'La familia, el coraje, las raíces, el amor, la libertad…',
      },
      ambition: {
        label: '04 — La intención profunda',
        question: '¿Qué quieres transmitir a quienes lean este libro?',
        hint: 'Lo que quieres que el lector se lleve.',
        placeholder: 'Que mis nietos sepan de dónde vienen…',
      },
    },
    next: 'Continuar →',
    back: '← Atrás',
    finish: 'Establecer los cimientos',
    skip: 'Omitir por ahora',
    done: {
      title: 'Los cimientos están puestos.',
      sub: 'Tus agentes ahora conocen tu libro. Sabrán qué buscar, qué conservar.',
      cta: 'Empezar a escribir →',
    },
  },
  tr: {
    header: 'Kitabınızın temelleri',
    sub: 'Yazmadan önce hikayenizin temellerini birlikte atalım.',
    steps: {
      period: {
        label: '01 — Dönem',
        question: 'Hayatınızın hangi dönemini anlatmak istiyorsunuz?',
        hint: 'ör. 60\'larda Lyon\'daki çocukluğum, Paris\'teki yıllarım, tüm hayatım…',
        placeholder: 'Dönemi ve yeri anlatın…',
      },
      people: {
        label: '02 — Karakterler',
        question: 'Bu hikayede önemli olan kişiler kimler?',
        hint: 'Onları adlandırın — her yazma seansında karşımıza çıkacaklar.',
        placeholder: 'Annem Suzan, arkadaşım Ahmet, babam…',
      },
      theme: {
        label: '03 — Ana tema',
        question: 'Kitabınızın merkezi teması nedir?',
        hint: 'Tüm hikayelerinizi birbirine bağlayan şey. Kesin olmak zorunda değilsiniz.',
        placeholder: 'Aile, cesaret, kökler, aşk, özgürlük…',
      },
      ambition: {
        label: '04 — Derin niyet',
        question: 'Bu kitabı okuyanlar size ne götürsün istiyorsunuz?',
        hint: 'Okuyucunun yanında götürmesini istediğiniz şey.',
        placeholder: 'Torunlarım nereden geldiklerini bilsinler…',
      },
    },
    next: 'Devam →',
    back: '← Geri',
    finish: 'Temelleri koy',
    skip: 'Şimdilik geç',
    done: {
      title: 'Temeller atıldı.',
      sub: 'Ajanlarınız artık kitabınızı tanıyor. Neye bakacaklarını, neyi saklayacaklarını biliyorlar.',
      cta: 'Yazmaya başla →',
    },
  },
}

export default function FondationsPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const lang = store.lang
  const wl = CONTENT[lang as 'fr' | 'en' | 'es' | 'tr'] ?? CONTENT.fr
  const stepKeys = STEPS

  const [stepIdx, setStepIdx] = useState(0)
  const [answers, setAnswers] = useState({ period: '', people: '', theme: '', ambition: '' })
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const currentStep = stepKeys[stepIdx] as keyof typeof answers
  const stepContent = wl.steps[currentStep]
  const progress = ((stepIdx) / STEPS.length) * 100

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [stepIdx])

  // If already complete, redirect
  useEffect(() => {
    if (store.foundationsComplete) router.push('/home')
  }, [store.foundationsComplete, router])

  function handleNext() {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(i => i + 1)
    } else {
      // Save
      store.setBookFoundations({
        period: answers.period,
        keyPeople: answers.people,
        theme: answers.theme,
        ambition: answers.ambition,
      })
      setDone(true)
    }
  }

  function handleSkip() {
    // Mark complete with empty foundations so user isn't blocked
    store.setBookFoundations({ period: '', keyPeople: '', theme: '', ambition: '' })
    router.push('/home')
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#1C1C2E] flex flex-col items-center justify-center px-6">
        <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-50" style={GRAIN} />
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full border border-[#C4622A]/30 flex items-center justify-center mx-auto mb-8">
            <span className="text-[#C4622A] text-xl">◈</span>
          </div>
          <h1 className="font-display text-3xl font-light text-[#FAF8F4] italic mb-4">
            {wl.done.title}
          </h1>
          <p className="text-[#9C8E80] text-sm leading-relaxed mb-10 px-4">
            {wl.done.sub}
          </p>

          {/* Summary */}
          <div className="bg-[#FAF8F4]/5 rounded-2xl border border-[#FAF8F4]/10 p-5 mb-8 text-left space-y-3">
            {answers.period && (
              <div>
                <p className="text-[9px] text-[#9C8E80] tracking-widest uppercase mb-0.5">{wl.steps.period.label}</p>
                <p className="text-sm text-[#FAF8F4]/80 font-display italic">{answers.period}</p>
              </div>
            )}
            {answers.people && (
              <div>
                <p className="text-[9px] text-[#9C8E80] tracking-widest uppercase mb-0.5">{wl.steps.people.label}</p>
                <p className="text-sm text-[#FAF8F4]/80 font-display italic">{answers.people}</p>
              </div>
            )}
            {answers.theme && (
              <div>
                <p className="text-[9px] text-[#9C8E80] tracking-widest uppercase mb-0.5">{wl.steps.theme.label}</p>
                <p className="text-sm text-[#FAF8F4]/80 font-display italic">{answers.theme}</p>
              </div>
            )}
            {answers.ambition && (
              <div>
                <p className="text-[9px] text-[#9C8E80] tracking-widest uppercase mb-0.5">{wl.steps.ambition.label}</p>
                <p className="text-sm text-[#FAF8F4]/80 font-display italic">{answers.ambition}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/home')}
            className="w-full bg-[#C4622A] text-white font-medium text-sm py-4 rounded-full hover:opacity-90 transition-all"
          >
            {wl.done.cta}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1C1C2E] flex flex-col items-center justify-center px-6">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-50" style={GRAIN} />

      <div className="max-w-md w-full">
        {/* Back to home (only if user already has sessions) */}
        {store.sessions.length > 0 && (
          <button
            onClick={() => router.push('/home')}
            className="mb-6 text-[10px] text-[#9C8E80]/50 hover:text-[#9C8E80] transition-colors flex items-center gap-1"
          >
            ← {wl.skip}
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[9px] text-[#C4622A]/70 tracking-widest uppercase mb-3">
            {wl.header}
          </p>
          {/* Progress bar */}
          <div className="h-px bg-[#FAF8F4]/10 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-[#C4622A]/50 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step */}
        <div className="mb-8">
          <p className="text-[9px] text-[#9C8E80] tracking-widest uppercase mb-4">
            {stepContent.label}
          </p>
          <h2 className="font-display text-2xl font-light text-[#FAF8F4] italic leading-snug mb-3">
            {stepContent.question}
          </h2>
          <p className="text-xs text-[#9C8E80] mb-6 leading-relaxed">
            {stepContent.hint}
          </p>

          <textarea
            ref={inputRef}
            value={answers[currentStep]}
            onChange={e => setAnswers(prev => ({ ...prev, [currentStep]: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && answers[currentStep].trim()) handleNext()
            }}
            placeholder={stepContent.placeholder}
            rows={3}
            className="w-full bg-[#FAF8F4]/5 border border-[#FAF8F4]/15 rounded-2xl px-5 py-4 text-sm text-[#FAF8F4] placeholder:text-[#9C8E80]/50 outline-none focus:border-[#C4622A]/40 transition-colors resize-none leading-relaxed font-display italic"
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {stepIdx > 0 && (
            <button
              onClick={() => setStepIdx(i => i - 1)}
              className="px-5 py-3.5 rounded-full border border-[#FAF8F4]/15 text-[#9C8E80] text-sm hover:border-[#9C8E80]/40 transition-all"
            >
              {wl.back}
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!answers[currentStep].trim()}
            className="flex-1 bg-[#C4622A] text-white font-medium text-sm py-3.5 rounded-full hover:opacity-90 transition-all disabled:opacity-30"
          >
            {stepIdx === STEPS.length - 1 ? wl.finish : wl.next}
          </button>
        </div>

        <button
          onClick={handleSkip}
          className="w-full mt-4 text-[10px] text-[#9C8E80]/50 hover:text-[#9C8E80] transition-colors py-2"
        >
          {wl.skip}
        </button>
      </div>
    </div>
  )
}
