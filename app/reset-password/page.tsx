'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/home')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-6">
      <a href="/" className="font-display text-2xl font-bold tracking-wide text-[#1C1C2E] mb-16">
        M<span className="text-[#C4622A]">.</span>emoir
      </a>

      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl font-bold text-[#1C1C2E] mb-3 leading-tight">
          Nouveau<br />
          <em className="text-[#C4622A]">mot de passe.</em>
        </h1>
        <p className="text-[#9C8E80] text-base mb-10 leading-relaxed">
          Choisissez un mot de passe pour accéder à votre Memoir.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              required
              minLength={8}
              className="w-full px-5 py-4 pr-14 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9C8E80] hover:text-[#1C1C2E] text-sm transition-colors"
            >
              {showPwd ? 'Masquer' : 'Voir'}
            </button>
          </div>

          <input
            type={showPwd ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirmer le mot de passe"
            required
            className="w-full px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full py-4 rounded-full bg-[#C4622A] text-white font-medium text-base transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 shadow-lg shadow-[#C4622A]/25"
          >
            {loading ? 'Enregistrement...' : 'Définir mon mot de passe'}
          </button>
        </form>
      </div>
    </main>
  )
}
