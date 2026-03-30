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
    title: 'Nous contacter',
    intro: 'Memoir est un projet humain. Derrière chaque message, il y a une vraie personne qui répond.',
    sections: [
      {
        heading: 'Support & questions générales',
        body: 'Pour toute question sur votre compte, votre abonnement ou l\'utilisation de Memoir :\ncontact@memoir.app\n\nNous répondons en général sous 24 à 48h (jours ouvrés). Nous lisons chaque message avec attention.',
      },
      {
        heading: 'Problème technique',
        body: 'Si quelque chose ne fonctionne pas comme prévu, décrivez-nous ce que vous avez observé et sur quel appareil/navigateur. Plus de détails = réponse plus rapide.\ncontact@memoir.app — objet : [Bug]',
      },
      {
        heading: 'Vos données personnelles',
        body: 'Pour exercer vos droits RGPD (accès, rectification, suppression, portabilité), écrivez-nous à :\ncontact@memoir.app — objet : [Données personnelles]\n\nNous traitons votre demande sous 72h maximum.',
      },
      {
        heading: 'Partenariats & presse',
        body: 'Pour toute demande de partenariat, collaboration éditoriale ou demande presse :\ncontact@memoir.app — objet : [Partenariat] ou [Presse]',
      },
      {
        heading: 'Retours & suggestions',
        body: 'Memoir se construit avec ses utilisateurs. Si vous avez une idée, une critique ou simplement envie de partager votre expérience, votre message sera lu et transmis à l\'équipe produit.\ncontact@memoir.app — objet : [Feedback]',
      },
    ],
    note: 'Memoir est actuellement en beta. Votre patience et vos retours nous aident à construire quelque chose de digne de vos histoires.',
  },
  en: {
    back: '← Back',
    title: 'Contact us',
    intro: 'Memoir is a human project. Behind every message, there is a real person who replies.',
    sections: [
      {
        heading: 'Support & general questions',
        body: 'For any questions about your account, subscription or how to use Memoir:\ncontact@memoir.app\n\nWe typically respond within 24 to 48 hours (business days). We read every message carefully.',
      },
      {
        heading: 'Technical issue',
        body: 'If something is not working as expected, describe what you observed and on which device/browser. More details = faster response.\ncontact@memoir.app — subject: [Bug]',
      },
      {
        heading: 'Your personal data',
        body: 'To exercise your GDPR rights (access, rectification, deletion, portability), write to us at:\ncontact@memoir.app — subject: [Personal data]\n\nWe process your request within 72 hours maximum.',
      },
      {
        heading: 'Partnerships & press',
        body: 'For partnership requests, editorial collaborations or press inquiries:\ncontact@memoir.app — subject: [Partnership] or [Press]',
      },
      {
        heading: 'Feedback & suggestions',
        body: 'Memoir is built with its users. If you have an idea, a criticism or simply want to share your experience, your message will be read and passed on to the product team.\ncontact@memoir.app — subject: [Feedback]',
      },
    ],
    note: 'Memoir is currently in beta. Your patience and feedback help us build something worthy of your stories.',
  },
  es: {
    back: '← Volver',
    title: 'Contáctenos',
    intro: 'Memoir es un proyecto humano. Detrás de cada mensaje hay una persona real que responde.',
    sections: [
      {
        heading: 'Soporte y preguntas generales',
        body: 'Para cualquier pregunta sobre su cuenta, suscripción o el uso de Memoir:\ncontact@memoir.app\n\nNormalmente respondemos en 24 a 48 horas (días hábiles). Leemos cada mensaje con atención.',
      },
      {
        heading: 'Problema técnico',
        body: 'Si algo no funciona como se esperaba, descríbanos lo que observó y en qué dispositivo/navegador. Más detalles = respuesta más rápida.\ncontact@memoir.app — asunto: [Bug]',
      },
      {
        heading: 'Sus datos personales',
        body: 'Para ejercer sus derechos RGPD (acceso, rectificación, supresión, portabilidad), escríbanos a:\ncontact@memoir.app — asunto: [Datos personales]\n\nTratamos su solicitud en un máximo de 72 horas.',
      },
      {
        heading: 'Colaboraciones y prensa',
        body: 'Para solicitudes de colaboración, partenariados editoriales o consultas de prensa:\ncontact@memoir.app — asunto: [Colaboración] o [Prensa]',
      },
      {
        heading: 'Sugerencias y comentarios',
        body: 'Memoir se construye con sus usuarios. Si tiene una idea, una crítica o simplemente quiere compartir su experiencia, su mensaje será leído y transmitido al equipo de producto.\ncontact@memoir.app — asunto: [Feedback]',
      },
    ],
    note: 'Memoir está actualmente en beta. Su paciencia y sus comentarios nos ayudan a construir algo digno de sus historias.',
  },
}

export default function ContactPage() {
  const router = useRouter()
  const lang = useMemoirStore((s) => s.lang)
  const c = CONTENT[lang as 'fr' | 'en' | 'es'] ?? CONTENT.en

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

        <div className="flex items-center gap-3 mb-4">
          <span className="text-[#C4622A] text-lg">◎</span>
          <h1 className="font-display text-3xl italic text-[#1C1C2E]">{c.title}</h1>
        </div>

        <p className="text-sm text-[#7A4F32]/70 italic mb-10 leading-relaxed">{c.intro}</p>

        <div className="space-y-8">
          {c.sections.map((s, i) => (
            <div key={i} className="border-l-2 border-[#C4622A]/20 pl-5">
              <h2 className="text-sm font-medium text-[#1C1C2E] mb-2 tracking-wide">{s.heading}</h2>
              <p className="text-sm text-[#7A4F32]/80 leading-relaxed whitespace-pre-line">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-4 bg-[#EDE4D8] rounded-lg border border-[#C4622A]/10">
          <p className="text-xs text-[#7A4F32]/70 italic leading-relaxed">{c.note}</p>
        </div>
      </div>
    </div>
  )
}
