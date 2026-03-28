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
    title: 'Mentions légales',
    sections: [
      {
        heading: 'Éditeur du service',
        body: 'Memoir est édité par The Tech Nation SL, société de droit espagnol.\nNIF : B19412451\nSiège social : Passeig de Gràcia 2, 08002 Barcelone, Espagne\nContact : contact@memoir.app',
      },
      {
        heading: 'Hébergement',
        body: 'L\'application Memoir est hébergée par Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA.\nLes données utilisateurs (textes, comptes) sont stockées via Supabase, dont les serveurs sont localisés en Europe (région eu-west).',
      },
      {
        heading: 'Propriété intellectuelle',
        body: 'Le contenu de ce site (interface, design, textes éditoriaux, prompts IA) est la propriété exclusive de l\'éditeur. Toute reproduction, même partielle, est interdite sans accord préalable.\n\nVos écrits personnels vous appartiennent intégralement. L\'éditeur ne revendique aucun droit sur vos mémoires, récits ou passages rédigés via Memoir.',
      },
      {
        heading: 'Responsabilité',
        body: 'Memoir est un outil d\'aide à l\'écriture mémorielle. Les textes générés par l\'IA sont des suggestions destinées à vous inspirer — vous restez l\'auteur et le seul responsable du contenu final de votre livre.',
      },
      {
        heading: 'Droit applicable',
        body: 'The Tech Nation SL est une société immatriculée en Espagne. Le présent service est soumis au droit espagnol. En cas de litige, les tribunaux compétents sont ceux de Barcelone, sauf disposition légale contraire applicable à l\'utilisateur.',
      },
      {
        heading: 'Mise à jour',
        body: 'Ces mentions légales peuvent être modifiées à tout moment. La version en vigueur est celle publiée sur cette page.\nDernière mise à jour : mars 2026.',
      },
    ],
  },
  en: {
    back: '← Back',
    title: 'Legal Notice',
    sections: [
      {
        heading: 'Publisher',
        body: 'Memoir is published by The Tech Nation SL, a company incorporated under Spanish law.\nNIF: B19412451\nRegistered office: Passeig de Gràcia 2, 08002 Barcelona, Spain\nContact: contact@memoir.app',
      },
      {
        heading: 'Hosting',
        body: 'The Memoir application is hosted by Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA.\nUser data (texts, accounts) is stored via Supabase, with servers located in Europe (eu-west region).',
      },
      {
        heading: 'Intellectual property',
        body: 'The content of this site (interface, design, editorial texts, AI prompts) is the exclusive property of the publisher. Any reproduction, even partial, is prohibited without prior agreement.\n\nYour personal writings belong entirely to you. The publisher claims no rights over your memories, stories or passages written via Memoir.',
      },
      {
        heading: 'Liability',
        body: 'Memoir is a memoir writing assistance tool. AI-generated texts are suggestions intended to inspire you — you remain the author and sole responsible party for the final content of your book.',
      },
      {
        heading: 'Applicable law',
        body: 'The Tech Nation SL is a company incorporated in Spain. This service is governed by Spanish law. In the event of a dispute, the competent courts are those of Barcelona, unless mandatory local law applies to the user.',
      },
      {
        heading: 'Updates',
        body: 'These legal notices may be modified at any time. The version in force is the one published on this page.\nLast updated: March 2026.',
      },
    ],
  },
  es: {
    back: '← Volver',
    title: 'Aviso legal',
    sections: [
      {
        heading: 'Editor del servicio',
        body: 'Memoir es publicado por The Tech Nation SL, sociedad mercantil española.\nNIF: B19412451\nDomicilio social: Passeig de Gràcia 2, 08002 Barcelona, España\nContacto: contact@memoir.app',
      },
      {
        heading: 'Alojamiento',
        body: 'La aplicación Memoir está alojada por Vercel Inc., 340 Pine Street, Suite 701, San Francisco, CA 94104, USA.\nLos datos de usuario (textos, cuentas) se almacenan en Supabase, con servidores ubicados en Europa (región eu-west).',
      },
      {
        heading: 'Propiedad intelectual',
        body: 'El contenido de este sitio (interfaz, diseño, textos editoriales, prompts IA) es propiedad exclusiva del editor. Queda prohibida su reproducción, incluso parcial, sin acuerdo previo.\n\nSus escritos personales le pertenecen íntegramente. El editor no reclama ningún derecho sobre sus memorias, relatos o pasajes redactados en Memoir.',
      },
      {
        heading: 'Responsabilidad',
        body: 'Memoir es una herramienta de ayuda a la escritura de memorias. Los textos generados por la IA son sugerencias destinadas a inspirarle — usted es el autor y el único responsable del contenido final de su libro.',
      },
      {
        heading: 'Ley aplicable',
        body: 'The Tech Nation SL es una sociedad inscrita en España. El presente servicio se rige por la legislación española. En caso de litigio, los tribunales competentes son los de Barcelona, salvo disposición legal imperativa aplicable al usuario.',
      },
      {
        heading: 'Actualización',
        body: 'Este aviso legal puede ser modificado en cualquier momento. La versión vigente es la publicada en esta página.\nÚltima actualización: marzo 2026.',
      },
    ],
  },
}

export default function MentionsLegalesPage() {
  const router = useRouter()
  const lang = useMemoirStore((s) => s.lang)
  const c = CONTENT[lang]

  return (
    <div className="min-h-screen bg-[#F5EFE0] relative">
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]" style={GRAIN_STYLE} />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => router.back()}
          className="text-xs text-[#9C8E80] hover:text-[#7A4F32] transition-colors mb-10 block"
        >
          {c.back}
        </button>

        <div className="flex items-center gap-3 mb-10">
          <span className="text-[#C4622A] text-lg">◈</span>
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
      </div>
    </div>
  )
}
