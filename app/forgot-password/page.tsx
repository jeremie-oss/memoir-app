'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const origin = window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?type=recovery`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-6 text-center">
        <p className="text-[#C4622A] text-sm tracking-[0.15em] uppercase mb-6">✦ Memoir</p>
        <h1 className="font-display text-3xl font-bold text-[#1C1C2E] mb-4">Email envoyé.</h1>
        <p className="text-[#7A4F32] text-base leading-relaxed max-w-sm">
          Vérifiez votre boîte mail. Le lien de réinitialisation est valable 1 heure.
        </p>
        <Link href="/login" className="mt-10 text-[#9C8E80] text-sm hover:text-[#1C1C2E] transition-colors">
          ← Retour à la connexion
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-6">
      <a href="/" className="font-display text-2xl font-bold tracking-wide text-[#1C1C2E] mb-16">
        M<span className="text-[#C4622A]">.</span>emoir
      </a>

      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl font-bold text-[#1C1C2E] mb-3 leading-tight">
          Mot de passe<br />
          <em className="text-[#C4622A]">oublié ?</em>
        </h1>
        <p className="text-[#9C8E80] text-base mb-10 leading-relaxed">
          Entrez votre email et nous vous enverrons un lien pour le réinitialiser.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            className="w-full px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-4 rounded-full bg-[#C4622A] text-white font-medium text-base transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 shadow-lg shadow-[#C4622A]/25"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="text-center text-[#9C8E80] text-sm mt-8">
          <Link href="/login" className="text-[#C4622A] underline underline-offset-2 hover:opacity-80">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  )
}
