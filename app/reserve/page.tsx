'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const SOURCES = [
  { value: 'bouche-a-oreille', label: 'Bouche à oreille' },
  { value: 'reseaux-sociaux', label: 'Réseaux sociaux' },
  { value: 'presse', label: 'Presse / média' },
  { value: 'ami-famille', label: 'Ami ou famille' },
  { value: 'autre', label: 'Autre' },
]

export default function ReservePage() {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    if (emailParam) setEmail(emailParam)
  }, [])
  const [ville, setVille] = useState('')
  const [source, setSource] = useState('')
  const [pourQui, setPourQui] = useState<'soi' | 'proche' | ''>('')
  const [quoiEcrire, setQuoiEcrire] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: `${prenom} ${nom}`.trim(),
        prenom,
        ville,
        source: source || 'unknown',
        pour_qui: pourQui || null,
        quoi_ecrire: quoiEcrire || null,
        lang: 'fr',
      }),
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
          Votre place est<br /><em className="text-[#C4622A]">réservée.</em>
        </h1>
        <p className="text-[#7A4F32] text-base leading-relaxed max-w-sm">
          Merci {prenom || 'à vous'}. Nous vous écrirons dès que Memoir sera prêt pour vous accueillir.
        </p>
        <Link href="/" className="mt-10 text-[#9C8E80] text-sm hover:text-[#1C1C2E] transition-colors">
          ← Retour
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-4 sm:px-6 py-12">
      <a href="/" className="font-display text-2xl font-bold tracking-wide text-[#1C1C2E] mb-10 sm:mb-12">
        M<span className="text-[#C4622A]">.</span>emoir
      </a>

      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1C1C2E] mb-3 leading-tight">
          Réservez<br />
          <em className="text-[#C4622A]">votre place.</em>
        </h1>
        <p className="text-[#9C8E80] text-sm sm:text-base mb-8 sm:mb-10 leading-relaxed">
          Memoir n&apos;est pas encore ouvert au public. Inscrivez-vous et nous vous préviendrons en priorité au lancement.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
              placeholder="Prénom"
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

          <input
            type="text"
            value={ville}
            onChange={e => setVille(e.target.value)}
            placeholder="Votre ville"
            className="w-full px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
          />

          <div className="relative">
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              className="w-full px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors font-sans appearance-none cursor-pointer"
            >
              <option value="" disabled>Comment avez-vous connu Memoir ?</option>
              {SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#9C8E80]">▾</span>
          </div>

          <div className="px-1">
            <p className="text-[#9C8E80] text-sm mb-3">Vous écrivez pour...</p>
            <div className="flex gap-3">
              {([
                { value: 'soi', label: 'Moi-même' },
                { value: 'proche', label: 'Un proche' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPourQui(pourQui === opt.value ? '' : opt.value)}
                  className={`flex-1 py-3 rounded-full border-2 text-sm font-medium transition-all ${
                    pourQui === opt.value
                      ? 'border-[#C4622A] bg-[#C4622A] text-white'
                      : 'border-[#EDE4D8] text-[#7A4F32] hover:border-[#C4622A]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={quoiEcrire}
            onChange={e => setQuoiEcrire(e.target.value)}
            placeholder="Qu'avez-vous envie d'écrire ? (optionnel)"
            rows={3}
            className="w-full px-5 py-4 rounded-2xl border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans resize-none"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-4 rounded-full bg-[#C4622A] text-white font-medium text-base transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 shadow-lg shadow-[#C4622A]/25 mt-2"
          >
            {loading ? 'Envoi...' : 'Réserver ma place ✦'}
          </button>
        </form>

        <p className="text-center text-[#9C8E80] text-sm mt-8">
          Vous souhaitez tester maintenant ?{' '}
          <Link href="/beta" className="text-[#C4622A] underline underline-offset-2 hover:opacity-80">
            Demander l&apos;accès anticipé
          </Link>
        </p>
      </div>
    </main>
  )
}
