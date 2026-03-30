'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore } from '@/stores/memoir'

// ── Constants ─────────────────────────────────────────────────

const TOTAL_STEPS = 5

const GRAIN_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

const INTENTIONS = [
  { id: 'trace',      label: 'Laisser une trace à mes proches' },
  { id: 'valeurs',    label: 'Transmettre des valeurs' },
  { id: 'comprendre', label: 'Comprendre mon histoire' },
  { id: 'honorer',    label: 'Honorer quelqu\u2019un' },
]

const DESTINATAIRES = [
  { id: 'enfants',   label: 'Mes enfants & petits-enfants' },
  { id: 'famille',   label: 'Ma famille' },
  { id: 'moi',       label: 'Moi-même' },
  { id: 'posterite', label: 'La postérité' },
  { id: 'quelquun',  label: 'Quelqu\u2019un en particulier' },
]

const FREQUENCES = [
  { id: 'quotidien', label: 'Quotidien',               sub: '5 à 7 jours / semaine' },
  { id: 'hebdo',     label: 'Régulier',                sub: '2 à 3 séances / semaine' },
  { id: 'libre',     label: 'À mon rythme',            sub: 'Quand l\u2019inspiration vient' },
]

const DUREES = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 0,  label: 'Je ne sais pas' },
]

const STYLE_INFO = [
  { key: 'romance',       label: 'Romancé',        sub: 'Poétique · sensoriel · émotionnel' },
  { key: 'biographique',  label: 'Biographique',   sub: 'Précis · chronologique · factuel' },
  { key: 'documentaire',  label: 'Documentaire',   sub: 'Témoin · contextuel · historique' },
] as const

const STEP_LABELS = [
  'Première rencontre',
  'Votre intention',
  'Pour qui',
  'Votre style',
  'Votre cadence',
]

// ── Main component ─────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)

  // Step 0 - rôle + prénom
  const [role, setRole] = useState<'auteur' | 'accompagnateur' | ''>('')
  const [prenom, setPrenom] = useState('')
  const [subjectName, setSubjectName] = useState('')

  // Step 1 - intention (multi)
  const [intentions, setIntentions] = useState<string[]>([])
  const [intentionCustom, setIntentionCustom] = useState('')

  // Step 2 - destinataire (multi)
  const [destinataires, setDestinataires] = useState<string[]>([])
  const [destinatairePrenom, setDestinatairePrenom] = useState('')

  // Step 3 - style (AI)
  const [styleExtraits, setStyleExtraits] = useState<string[]>([])
  const [styleLoading, setStyleLoading] = useState(false)
  const [styleSelected, setStyleSelected] = useState(-1)
  const styleFetched = useRef(false)

  // Step 4 - routine
  const [frequence, setFrequence] = useState('hebdo')
  const [duree, setDuree] = useState(30)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && store.onboardingComplete) router.push('/home')
  }, [mounted, store.onboardingComplete, router])

  // Lancer la génération des extraits quand on arrive à l'étape 3
  useEffect(() => {
    if (step !== 3 || styleFetched.current || styleLoading) return
    styleFetched.current = true
    generateStyleExtraits()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  async function generateStyleExtraits() {
    setStyleLoading(true)
    try {
      const res = await fetch('/api/memoir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboarding_style',
          userName: prenom,
          lang: store.lang,
          intention: intentions.length > 0 ? intentions.join(', ') : intentionCustom,
          destinataire,
          chapter: { title: '', theme: '' },
        }),
      })
      const reader = res.body?.getReader()
      if (!reader) throw new Error('no reader')
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }
      const parts = full.split('|||').map(s => s.trim()).filter(Boolean)
      setStyleExtraits(parts.length >= 3 ? parts.slice(0, 3) : FALLBACK_EXTRAITS)
    } catch {
      setStyleExtraits(FALLBACK_EXTRAITS)
    } finally {
      setStyleLoading(false)
    }
  }

  function goTo(next: number) {
    setVisible(false)
    setTimeout(() => { setStep(next); setVisible(true) }, 180)
  }

  function handleFinish() {
    store.setUserName(prenom)
    store.setProfile({
      intention: intentions.length > 0 ? intentions.join(', ') : intentionCustom,
      destinataire: destinataires.join(', '),
      destinatairePrenom,
      ton: styleSelected >= 0 ? STYLE_INFO[styleSelected].key : 'biographique',
      styleExtrait: styleSelected >= 0 ? (styleExtraits[styleSelected] ?? '') : '',
      frequence: frequence as 'quotidien' | 'hebdo' | 'libre',
      duree: duree as 15 | 30 | 45 | 0,
      role: role || 'auteur',
      subjectName: role === 'accompagnateur' ? subjectName : '',
    })
    store.completeOnboarding()
    router.push('/home')
  }

  if (!mounted) return null

  const canContinue = [
    role !== '' && prenom.trim().length > 0,
    intentions.length > 0 || intentionCustom.trim().length > 0,
    destinataires.length > 0,
    styleSelected >= 0,
    true,
  ][step]

  const isLast = step === TOTAL_STEPS - 1

  return (
    <main className="min-h-screen bg-[#F5EFE0] flex flex-col select-none">
      {/* Grain */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-10" style={GRAIN_STYLE} />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#EDE4D8] relative z-20">
        <span className="font-display text-xl font-bold text-[#1C1C2E]">
          M<span className="text-[#C4622A]">.</span>emoir
        </span>
        <span className="text-[11px] text-[#9C8E80] tracking-widest uppercase">
          {STEP_LABELS[step]}
        </span>
      </header>

      {/* Progress bar */}
      <div className="w-full h-0.5 bg-[#EDE4D8] relative z-20">
        <div
          className="h-full bg-[#C4622A] transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 pt-4 pb-1 relative z-20">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i < step
                ? 'w-4 h-1.5 bg-[#C4622A]'
                : i === step
                ? 'w-4 h-1.5 bg-[#C4622A] opacity-60'
                : 'w-1.5 h-1.5 bg-[#EDE4D8]'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div
        className={`flex-1 flex flex-col px-6 pt-8 pb-4 max-w-lg mx-auto w-full relative z-20 transition-opacity duration-180 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {step === 0 && (
          <StepPrenom
            prenom={prenom} setPrenom={setPrenom}
            role={role} setRole={setRole}
            subjectName={subjectName} setSubjectName={setSubjectName}
          />
        )}
        {step === 1 && (
          <StepIntention
            intentions={intentions}
            toggleIntention={(v) => {
              setIntentions(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
              setIntentionCustom('')
            }}
            custom={intentionCustom}
            setCustom={(v) => { setIntentionCustom(v); setIntentions([]) }}
          />
        )}
        {step === 2 && (
          <StepDestinataire
            selected={destinataires}
            toggle={(v) => setDestinataires(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
            prenomDest={destinatairePrenom} setPrenomDest={setDestinatairePrenom}
          />
        )}
        {step === 3 && (
          <StepStyle
            loading={styleLoading}
            extraits={styleExtraits}
            selected={styleSelected}
            setSelected={setStyleSelected}
          />
        )}
        {step === 4 && (
          <StepRoutine
            prenom={prenom}
            frequence={frequence} setFrequence={setFrequence}
            duree={duree} setDuree={setDuree}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 max-w-lg mx-auto w-full relative z-20 flex flex-col gap-2">
        <button
          onClick={isLast ? handleFinish : () => goTo(step + 1)}
          disabled={!canContinue && step !== 3}
          className={`w-full py-4 rounded-full font-medium text-sm transition-all duration-200 ${
            canContinue || step === 3
              ? 'bg-[#1C1C2E] text-[#FAF8F4] hover:bg-[#C4622A] shadow-md shadow-[#1C1C2E]/10'
              : 'bg-[#EDE4D8] text-[#9C8E80] cursor-not-allowed'
          }`}
        >
          {isLast ? 'Commencer mon livre' : 'Continuer'}
        </button>

        {/* Skip style step */}
        {step === 3 && styleSelected < 0 && !styleLoading && (
          <button
            onClick={() => goTo(step + 1)}
            className="text-center text-xs text-[#9C8E80] py-2 hover:text-[#7A4F32] transition-colors"
          >
            Choisir mon style plus tard
          </button>
        )}

        {/* Skip onboarding entirely (step 0 only) */}
        {step === 0 && (
          <button
            onClick={() => {
              if (prenom.trim()) {
                store.setUserName(prenom.trim())
              }
              store.completeOnboarding()
              router.push('/home')
            }}
            className="text-center text-xs text-[#9C8E80] py-2 hover:text-[#7A4F32] transition-colors"
          >
            Passer la personnalisation →
          </button>
        )}

        {/* Back */}
        {step > 0 && (
          <button
            onClick={() => goTo(step - 1)}
            className="text-center text-xs text-[#9C8E80] py-1.5 hover:text-[#7A4F32] transition-colors"
          >
            ← Retour
          </button>
        )}
      </div>
    </main>
  )
}

// ── Step: Prénom ───────────────────────────────────────────────

function StepPrenom({
  prenom, setPrenom,
  role, setRole,
  subjectName, setSubjectName,
}: {
  prenom: string; setPrenom: (v: string) => void
  role: 'auteur' | 'accompagnateur' | ''; setRole: (v: 'auteur' | 'accompagnateur') => void
  subjectName: string; setSubjectName: (v: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 300) }, [role])

  const isAccomp = role === 'accompagnateur'

  return (
    <div className="flex flex-col flex-1 justify-center gap-6">
      {/* Choix de rôle */}
      <div>
        <p className="text-[11px] text-[#C4622A] tracking-widest uppercase mb-4">Bienvenue sur Memoir</p>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <button
            onClick={() => setRole('auteur')}
            className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all text-left ${
              role === 'auteur'
                ? 'border-[#C4622A] bg-[#C4622A]/5'
                : 'border-[#EDE4D8] bg-white/60 hover:border-[#C4622A]/40'
            }`}
          >
            <span className="text-2xl">✦</span>
            <div>
              <p className={`text-sm font-medium ${role === 'auteur' ? 'text-[#1C1C2E]' : 'text-[#7A4F32]'}`}>
                J'écris mon histoire
              </p>
              <p className="text-[10px] text-[#9C8E80] mt-0.5 leading-snug">Je suis l'auteur</p>
            </div>
          </button>
          <button
            onClick={() => setRole('accompagnateur')}
            className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all text-left ${
              role === 'accompagnateur'
                ? 'border-[#C4622A] bg-[#C4622A]/5'
                : 'border-[#EDE4D8] bg-white/60 hover:border-[#C4622A]/40'
            }`}
          >
            <span className="text-2xl">◎</span>
            <div>
              <p className={`text-sm font-medium ${role === 'accompagnateur' ? 'text-[#1C1C2E]' : 'text-[#7A4F32]'}`}>
                J'aide quelqu'un à écrire
              </p>
              <p className="text-[10px] text-[#9C8E80] mt-0.5 leading-snug">Je suis le guide</p>
            </div>
          </button>
        </div>
      </div>

      {/* Lettre de Jérémie — auteur uniquement */}
      {role === 'auteur' && (
        <div className="bg-[#F5EFE0] border border-[#EDE4D8] rounded-2xl px-5 py-4">
          <p className="text-[10px] text-[#C4622A] tracking-widest uppercase mb-2">Pourquoi Memoir existe</p>
          <p className="font-display text-sm italic text-[#7A4F32] leading-relaxed">
            "J'ai créé Memoir parce que ma grand-mère a 100 ans et que je refuse que ses mots disparaissent avec elle.
            Si vous me confiez votre histoire, je vous promets de la traiter avec le même soin."
          </p>
          <p className="text-[10px] text-[#9C8E80] mt-2">— Jérémie, fondateur</p>
        </div>
      )}

      {/* Message accompagnateur */}
      {isAccomp && (
        <div className="bg-[#1C1C2E] rounded-2xl px-5 py-4">
          <p className="text-[10px] text-[#C4622A] tracking-widest uppercase mb-2">Mode accompagnateur</p>
          <p className="font-display text-sm italic text-[#FAF8F4]/80 leading-relaxed">
            "Memoir vous guide pour recueillir et mettre en mots l'histoire de quelqu'un que vous aimez."
          </p>
        </div>
      )}

      {/* Prénom du guide */}
      {role !== '' && (
        <div>
          <p className="text-[#9C8E80] text-xs mb-2">
            {isAccomp ? 'Votre prénom (le guide)' : 'Comment vous appelle-t-on ?'}
          </p>
          <input
            ref={ref}
            type="text"
            value={prenom}
            onChange={e => setPrenom(e.target.value)}
            placeholder="Votre prénom"
            className="text-2xl font-display bg-transparent border-b-2 border-[#EDE4D8] focus:border-[#C4622A] outline-none py-2 text-[#1C1C2E] placeholder:text-[#C4B9A8] transition-colors w-full"
          />
        </div>
      )}

      {/* Prénom du sujet (accompagnateur) */}
      {isAccomp && prenom.trim() && (
        <div>
          <p className="text-[#9C8E80] text-xs mb-2">Le prénom de la personne dont vous recueillez l'histoire</p>
          <input
            type="text"
            value={subjectName}
            onChange={e => setSubjectName(e.target.value)}
            placeholder="Son prénom"
            className="text-2xl font-display bg-transparent border-b-2 border-[#EDE4D8] focus:border-[#C4622A] outline-none py-2 text-[#1C1C2E] placeholder:text-[#C4B9A8] transition-colors w-full"
          />
        </div>
      )}
    </div>
  )
}

// ── Step: Intention ────────────────────────────────────────────

function StepIntention({
  intentions, toggleIntention, custom, setCustom
}: {
  intentions: string[]; toggleIntention: (v: string) => void
  custom: string; setCustom: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] text-[#C4622A] tracking-widest uppercase mb-3">Étape 1</p>
        <h1 className="font-display text-4xl font-bold text-[#1C1C2E] leading-tight mb-3">
          Pourquoi écrire<br />
          <em className="text-[#C4622A]">ce livre ?</em>
        </h1>
        <p className="text-[#9C8E80] text-sm">Plusieurs réponses possibles — elles guideront vos séances.</p>
      </div>
      <div className="flex flex-col gap-3">
        {INTENTIONS.map(opt => {
          const checked = intentions.includes(opt.id)
          return (
            <button
              key={opt.id}
              onClick={() => toggleIntention(opt.id)}
              className={`text-left px-5 py-4 rounded-2xl border-2 transition-all text-sm flex items-center gap-3 ${
                checked
                  ? 'border-[#C4622A] bg-[#C4622A]/5 text-[#1C1C2E] font-medium'
                  : 'border-[#EDE4D8] text-[#7A4F32] hover:border-[#C4622A]/40 bg-white/60'
              }`}
            >
              <span className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                checked ? 'border-[#C4622A] bg-[#C4622A]' : 'border-[#C4B9A8]'
              }`}>
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              {opt.label}
            </button>
          )
        })}
        <input
          type="text"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Ou écrivez votre propre intention…"
          className={`px-5 py-4 rounded-2xl border-2 text-sm outline-none transition-all bg-white text-[#1C1C2E] placeholder:text-[#C4B9A8] ${
            custom ? 'border-[#C4622A]' : 'border-[#EDE4D8] focus:border-[#C4622A]/60'
          }`}
        />
      </div>
    </div>
  )
}

// ── Step: Destinataire ─────────────────────────────────────────

function StepDestinataire({
  selected, toggle, prenomDest, setPrenomDest
}: {
  selected: string[]; toggle: (v: string) => void
  prenomDest: string; setPrenomDest: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] text-[#C4622A] tracking-widest uppercase mb-3">Étape 2</p>
        <h1 className="font-display text-4xl font-bold text-[#1C1C2E] leading-tight mb-3">
          Pour qui<br />
          <em className="text-[#C4622A]">ces pages ?</em>
        </h1>
        <p className="text-[#9C8E80] text-sm">Ceux qui liront un jour votre histoire — cochez tout ce qui résonne.</p>
      </div>
      <div className="flex flex-col gap-3">
        {DESTINATAIRES.map(opt => {
          const checked = selected.includes(opt.id)
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`text-left px-5 py-4 rounded-2xl border-2 transition-all text-sm flex items-center gap-3 ${
                checked
                  ? 'border-[#C4622A] bg-[#C4622A]/5 text-[#1C1C2E] font-medium'
                  : 'border-[#EDE4D8] text-[#7A4F32] hover:border-[#C4622A]/40 bg-white/60'
              }`}
            >
              <span className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                checked ? 'border-[#C4622A] bg-[#C4622A]' : 'border-[#C4B9A8]'
              }`}>
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              {opt.label}
            </button>
          )
        })}
        {selected.length > 0 && (
          <input
            type="text"
            value={prenomDest}
            onChange={e => setPrenomDest(e.target.value)}
            placeholder="Son prénom ou leur prénom (optionnel)"
            className="px-5 py-3.5 rounded-2xl border-2 border-[#EDE4D8] text-sm outline-none transition-all bg-white text-[#1C1C2E] placeholder:text-[#C4B9A8] focus:border-[#C4622A]/60"
          />
        )}
      </div>
    </div>
  )
}

// ── Step: Style ────────────────────────────────────────────────

function StepStyle({
  loading, extraits, selected, setSelected
}: {
  loading: boolean
  extraits: string[]
  selected: number
  setSelected: (i: number) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] text-[#C4622A] tracking-widest uppercase mb-3">Étape 3</p>
        <h1 className="font-display text-4xl font-bold text-[#1C1C2E] leading-tight mb-3">
          Votre voix<br />
          <em className="text-[#C4622A]">d'auteur</em>
        </h1>
        <p className="text-[#9C8E80] text-sm leading-relaxed">
          L'IA a composé trois débuts d'histoire à votre intention.
          Choisissez celui qui vous ressemble.
        </p>
        <p className="text-[10px] text-[#C4B9A8] mt-2">
          ✦ Vos écrits ne servent jamais à entraîner des modèles d'IA.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-5 py-14">
          <div className="flex gap-1.5">
            {[0, 150, 300].map(d => (
              <span
                key={d}
                className="w-2.5 h-2.5 bg-[#C4622A] rounded-full animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
          <p className="text-sm text-[#9C8E80] italic font-display">
            L'IA compose vos premiers mots…
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {STYLE_INFO.map((style, i) => (
            <button
              key={style.key}
              onClick={() => setSelected(i)}
              className={`text-left p-5 rounded-2xl border-2 transition-all ${
                selected === i
                  ? 'border-[#C4622A] bg-[#C4622A]/5 shadow-sm shadow-[#C4622A]/10'
                  : 'border-[#EDE4D8] hover:border-[#C4622A]/40 bg-white/70'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold tracking-wide uppercase ${
                  selected === i ? 'text-[#C4622A]' : 'text-[#9C8E80]'
                }`}>
                  {style.label}
                </span>
                <span className="text-[10px] text-[#9C8E80]">{style.sub}</span>
              </div>
              <p className="font-display text-[15px] italic text-[#1C1C2E] leading-relaxed">
                {extraits[i] ?? '…'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step: Routine ──────────────────────────────────────────────

function StepRoutine({
  prenom, frequence, setFrequence, duree, setDuree
}: {
  prenom: string
  frequence: string; setFrequence: (v: string) => void
  duree: number; setDuree: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[11px] text-[#C4622A] tracking-widest uppercase mb-3">Étape 4</p>
        <h1 className="font-display text-4xl font-bold text-[#1C1C2E] leading-tight mb-3">
          {prenom ? `${prenom}, votre` : 'Votre'}<br />
          <em className="text-[#C4622A]">cadence d'écriture</em>
        </h1>
        <p className="text-[#9C8E80] text-sm">
          Votre livre avancera séance après séance, à votre rythme.
        </p>
      </div>

      <div>
        <p className="text-[11px] text-[#9C8E80] tracking-widest uppercase mb-3">Fréquence</p>
        <div className="flex flex-col gap-3">
          {FREQUENCES.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFrequence(opt.id)}
              className={`text-left px-5 py-4 rounded-2xl border-2 transition-all ${
                frequence === opt.id
                  ? 'border-[#C4622A] bg-[#C4622A]/5'
                  : 'border-[#EDE4D8] bg-white/60 hover:border-[#C4622A]/40'
              }`}
            >
              <span className="text-sm font-medium text-[#1C1C2E]">{opt.label}</span>
              <span className="text-xs text-[#9C8E80] ml-2">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] text-[#9C8E80] tracking-widest uppercase mb-3">Durée par séance</p>
        <div className="grid grid-cols-2 gap-3">
          {DUREES.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDuree(opt.value)}
              className={`py-4 rounded-2xl border-2 text-sm font-medium transition-all ${
                duree === opt.value
                  ? 'border-[#C4622A] bg-[#C4622A] text-white shadow-md shadow-[#C4622A]/20'
                  : 'border-[#EDE4D8] text-[#7A4F32] bg-white/60 hover:border-[#C4622A]/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Fallback extraits ─────────────────────────────────────────

const FALLBACK_EXTRAITS = [
  'Le jardin de mon enfance sentait la lavande et la pluie chaude sur la pierre. C\u2019est l\u00e0 que j\u2019ai compris, pour la premi\u00e8re fois, ce que voulait dire appartenir quelque part.',
  'Je suis n\u00e9 en 1958 dans une famille de cinq enfants. Mon p\u00e8re travaillait en usine, ma m\u00e8re \u00e9tait couturi\u00e8re \u00e0 domicile - et c\u2019est dans cet \u00e9quilibre fragile que s\u2019est construite mon enfance.',
  'Dans les ann\u00e9es soixante, les quartiers ouvriers vivaient encore au rythme des solidarit\u00e9s de voisinage. J\u2019ai grandi dans ce tissu serr\u00e9 de rues et de conversations de palier.',
]
