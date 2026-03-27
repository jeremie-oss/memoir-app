'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email. Connectez-vous.'
        : error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-6">
        <a href="/" className="font-display text-2xl font-bold tracking-wide text-[#1C1C2E] mb-16">
          M<span className="text-[#C4622A]">.</span>emoir
        </a>
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#F5EFE0] flex items-center justify-center mx-auto mb-6 text-2xl">
            ✉
          </div>
          <h2 className="font-display text-3xl font-bold text-[#1C1C2E] mb-3">
            Vérifiez vos emails.
          </h2>
          <p className="text-[#9C8E80] text-base leading-relaxed mb-2">
            Un lien de confirmation a été envoyé à
          </p>
          <p className="font-medium text-[#1C1C2E] mb-8">{email}</p>
          <Link
            href="/login"
            className="text-[#9C8E80] text-sm underline underline-offset-2"
          >
            Retour à la connexion
          </Link>
        </div>
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
          Créez votre<br />
          <em className="text-[#C4622A]">mémoire.</em>
        </h1>
        <p className="text-[#9C8E80] text-base mb-10 leading-relaxed">
          Un compte pour préserver votre histoire.
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
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe (8 caractères min.)"
            required
            className="w-full px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
          />

          {error && (
            <p className="text-red-500 text-sm text-center -mt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-[#C4622A] text-white font-medium text-base transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 shadow-lg shadow-[#C4622A]/25"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-[#9C8E80] text-sm mt-8">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[#C4622A] underline underline-offset-2 hover:opacity-80">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
