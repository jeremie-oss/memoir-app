'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BetaPage() {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motivation, setMotivation] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/access-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, prenom, nom, motivation }),
    })

    const result = await res.json()
    if (result.ok) {
      setDone(true)
    } else {
      setError(result.error || 'Une erreur est survenue.')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-6 text-center">
        <p className="text-[#C4622A] text-sm tracking-[0.15em] uppercase mb-6">✦ Memoir</p>
        <h1 className="font-display text-4xl font-bold text-[#1C1C2E] mb-4 leading-tight">
          Votre demande<br /><em className="text-[#C4622A]">est reçue.</em>
        </h1>
        <p className="text-[#7A4F32] text-base leading-relaxed max-w-sm">
          Merci {prenom}. Nous examinons votre demande et vous répondrons très prochainement par email.
        </p>
        <Link href="/" className="mt-10 text-[#9C8E80] text-sm hover:text-[#1C1C2E] transition-colors">
          ← Retour
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-6 py-12">
      <a href="/" className="font-display text-2xl font-bold tracking-wide text-[#1C1C2E] mb-2">
        M<span className="text-[#C4622A]">.</span>emoir
      </a>
      <a href="/login" className="text-xs text-[#9C8E80] hover:text-[#C4622A] transition-colors mb-10">
        ← Retour à la connexion
      </a>

      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl font-bold text-[#1C1C2E] mb-3 leading-tight">
          Accès<br />
          <em className="text-[#C4622A]">anticipé.</em>
        </h1>
        <p className="text-[#9C8E80] text-base mb-10 leading-relaxed">
          Vous souhaitez tester Memoir dès maintenant ? Partagez votre motivation — nous sélectionnons les premiers testeurs à la main.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
              placeholder="Prénom"
              required
              className="flex-1 px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
            />
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Nom"
              className="flex-1 px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
            />
          </div>

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            className="w-full px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
          />

          <textarea
            value={motivation}
            onChange={e => setMotivation(e.target.value)}
            placeholder="Pourquoi souhaitez-vous tester Memoir maintenant ?"
            rows={4}
            className="w-full px-5 py-4 rounded-2xl border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans resize-none"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !prenom}
            className="w-full py-4 rounded-full bg-[#1C1C2E] text-[#FAF8F4] font-medium text-base transition-all hover:bg-[#2A2A3E] hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 shadow-lg mt-2"
          >
            {loading ? 'Envoi...' : 'Soumettre ma demande'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3 mt-8">
          <Link
            href="/login"
            className="w-full py-3 rounded-full border-2 border-[#EDE4D8] text-[#7A4F32] font-medium text-base text-center transition-all hover:border-[#C4622A] hover:text-[#C4622A]"
          >
            J&apos;ai déjà un compte — Me connecter
          </Link>
          <p className="text-[#9C8E80] text-sm">
            Vous préférez être notifié au lancement ?{' '}
            <Link href="/reserve" className="text-[#C4622A] underline underline-offset-2 hover:opacity-80">
              Réserver ma place
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
