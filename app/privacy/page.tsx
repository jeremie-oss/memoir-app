'use client'

import { useRouter } from 'next/navigation'
import { useMemoirStore } from '@/stores/memoir'

const GRAIN_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

const CONTENT = {
  fr: {
    back: '← Retour',
    title: 'Confidentialité de vos écrits',
    sections: [
      {
        heading: 'Vos textes vous appartiennent',
        body: 'Tout ce que vous écrivez sur Memoir vous appartient intégralement. Nous ne lisons pas vos textes, ne les analysons pas à des fins commerciales, et ne les partageons jamais avec des tiers.',
      },
      {
        heading: "L'IA et vos mémoires",
        body: "Lorsque vous utilisez les modes Guidé ou Dictée, vos réponses sont transmises à notre IA (Claude, d'Anthropic) pour générer votre jet d'écriture. Ces échanges ne sont pas conservés entre les séances. L'IA ne se souvient de rien d'une session à l'autre.",
      },
      {
        heading: 'Stockage sécurisé — vos données restent en Europe',
        body: "Vos textes sont sauvegardés localement sur votre appareil (localStorage) et, si vous avez un compte, dans notre base de données sécurisée.\n\nNous utilisons Supabase, dont les serveurs sont hébergés en Irlande (région EU West) — au sein de l'Union Européenne, soumis au RGPD. Toutes les données sont chiffrées au repos (AES-256) et en transit (TLS 1.3). Aucune donnée ne transite vers les États-Unis.",
      },
      {
        heading: 'Aucune publicité. Jamais.',
        body: "Memoir est un espace d'écriture, pas une plateforme publicitaire. Nous ne vendons aucune donnée. Votre modèle économique est simple : vous payez un abonnement, nous vous offrons un outil digne de confiance.",
      },
      {
        heading: 'Vos droits',
        body: "Vous pouvez demander l'export, la modification ou la suppression de toutes vos données à tout moment en écrivant à contact@memoir.app. Nous répondons sous 72h.",
      },
    ],
    contact: 'Des questions ? contact@memoir.app',
  },
  en: {
    back: '← Back',
    title: 'Confidentiality of your writings',
    sections: [
      {
        heading: 'Your texts belong to you',
        body: 'Everything you write on Memoir belongs entirely to you. We do not read your texts, analyze them for commercial purposes, or share them with third parties.',
      },
      {
        heading: 'AI and your memories',
        body: "When you use Guided or Dictation modes, your responses are sent to our AI (Claude, by Anthropic) to generate your writing draft. These exchanges are not stored between sessions. The AI remembers nothing from one session to the next.",
      },
      {
        heading: 'Secure storage — your data stays in Europe',
        body: 'Your texts are saved locally on your device (localStorage) and, if you have an account, in our secure database.\n\nWe use Supabase, with servers hosted in Ireland (EU West region) — within the European Union, subject to GDPR. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). No data is transferred to the United States.',
      },
      {
        heading: 'No advertising. Ever.',
        body: 'Memoir is a writing space, not an advertising platform. We sell no data. Our business model is simple: you pay a subscription, we give you a trustworthy tool.',
      },
      {
        heading: 'Your rights',
        body: 'You can request the export, modification or deletion of all your data at any time by writing to contact@memoir.app. We respond within 72h.',
      },
    ],
    contact: 'Questions? contact@memoir.app',
  },
  es: {
    back: '← Volver',
    title: 'Confidencialidad de sus escritos',
    sections: [
      {
        heading: 'Sus textos le pertenecen',
        body: 'Todo lo que escribe en Memoir le pertenece íntegramente. No leemos sus textos, no los analizamos con fines comerciales y nunca los compartimos con terceros.',
      },
      {
        heading: 'La IA y sus memorias',
        body: 'Cuando usa los modos Guiado o Dictado, sus respuestas se envían a nuestra IA (Claude, de Anthropic) para generar su borrador. Estos intercambios no se conservan entre sesiones. La IA no recuerda nada de una sesión a otra.',
      },
      {
        heading: 'Almacenamiento seguro — sus datos permanecen en Europa',
        body: 'Sus textos se guardan localmente en su dispositivo (localStorage) y, si tiene una cuenta, en nuestra base de datos segura.\n\nUsamos Supabase, con servidores alojados en Irlanda (región EU West) — dentro de la Unión Europea, sujeto al RGPD. Todos los datos están cifrados en reposo (AES-256) y en tránsito (TLS 1.3). Ningún dato se transfiere a Estados Unidos.',
      },
      {
        heading: 'Sin publicidad. Nunca.',
        body: 'Memoir es un espacio de escritura, no una plataforma publicitaria. No vendemos ningún dato. Nuestro modelo es simple: paga una suscripción, le ofrecemos una herramienta de confianza.',
      },
      {
        heading: 'Sus derechos',
        body: 'Puede solicitar la exportación, modificación o eliminación de todos sus datos en cualquier momento escribiendo a contact@memoir.app. Respondemos en 72h.',
      },
    ],
    contact: '¿Preguntas? contact@memoir.app',
  },
}

export default function PrivacyPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const lang = store.lang
  const c = CONTENT[lang]

  return (
    <div className="min-h-screen bg-[#F5EFE0] relative">
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]" style={GRAIN_STYLE} />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <a
          href="/"
          className="text-xs text-[#9C8E80] hover:text-[#7A4F32] transition-colors mb-10 block"
        >
          {c.back}
        </a>

        <div className="flex items-center gap-3 mb-10">
          <span className="text-[#C4622A] text-lg">✦</span>
          <h1 className="font-display text-3xl italic text-[#1C1C2E]">{c.title}</h1>
        </div>

        <div className="space-y-8">
          {c.sections.map((s, i) => (
            <div key={i} className="border-l-2 border-[#C4622A]/20 pl-5">
              <h2 className="text-sm font-medium text-[#1C1C2E] mb-2 tracking-wide">{s.heading}</h2>
              <p className="text-sm text-[#7A4F32]/80 leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-[#9C8E80] italic">{c.contact}</p>
      </div>
    </div>
  )
}
