'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMemoirStore } from '@/stores/memoir'

type Lang = 'fr' | 'en' | 'es'

const i18n: Record<Lang, Record<string, string>> = {
  fr: {
    'login.h1a': 'Votre histoire',
    'login.h1b': 'commence ici.',
    'login.sub': 'Connectez-vous pour retrouver votre mémoire.',
    'login.email': 'votre@email.com',
    'login.password': 'Mot de passe',
    'login.show': 'Voir',
    'login.hide': 'Masquer',
    'login.submit': 'Se connecter',
    'login.loading': 'Connexion...',
    'login.no_account': 'Pas encore de compte ?',
    'login.request_access': "Demander l'accès anticipé",
    'login.forgot': 'Mot de passe oublié ?',
    'login.bad_creds': 'Email ou mot de passe incorrect.',
  },
  en: {
    'login.h1a': 'Your story',
    'login.h1b': 'starts here.',
    'login.sub': 'Sign in to find your memory.',
    'login.email': 'your@email.com',
    'login.password': 'Password',
    'login.show': 'Show',
    'login.hide': 'Hide',
    'login.submit': 'Sign in',
    'login.loading': 'Signing in...',
    'login.no_account': "Don't have an account?",
    'login.request_access': 'Request early access',
    'login.forgot': 'Forgot password?',
    'login.bad_creds': 'Incorrect email or password.',
  },
  es: {
    'login.h1a': 'Tu historia',
    'login.h1b': 'comienza aquí.',
    'login.sub': 'Inicia sesión para recuperar tu memoria.',
    'login.email': 'tu@email.com',
    'login.password': 'Contraseña',
    'login.show': 'Ver',
    'login.hide': 'Ocultar',
    'login.submit': 'Iniciar sesión',
    'login.loading': 'Conectando...',
    'login.no_account': '¿Aún no tienes cuenta?',
    'login.request_access': 'Solicitar acceso anticipado',
    'login.forgot': '¿Olvidaste tu contraseña?',
    'login.bad_creds': 'Email o contraseña incorrectos.',
  },
}

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'fr'
  const raw = (navigator.language || 'fr').slice(0, 2)
  if (raw === 'en') return 'en'
  if (raw === 'es') return 'es'
  return 'fr'
}

export default function LoginPage() {
  const lang = useMemo(detectLang, [])
  const t = i18n[lang]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const store = useMemoirStore()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? t['login.bad_creds']
        : error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      store.setUserId(data.user.id)
      const meta = data.user.user_metadata
      if (meta?.name && !store.userName) {
        store.setUserName(meta.name)
      }
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
          {t['login.h1a']}<br />
          <em className="text-[#C4622A]">{t['login.h1b']}</em>
        </h1>
        <p className="text-[#9C8E80] text-base mb-10 leading-relaxed">
          {t['login.sub']}
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t['login.email']}
            required
            className="w-full px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
          />
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t['login.password']}
              required
              className="w-full px-5 py-4 pr-14 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9C8E80] hover:text-[#1C1C2E] text-sm transition-colors"
            >
              {showPwd ? t['login.hide'] : t['login.show']}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center -mt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-[#C4622A] text-white font-medium text-base transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 shadow-lg shadow-[#C4622A]/25"
          >
            {loading ? t['login.loading'] : t['login.submit']}
          </button>
        </form>

        <p className="text-center text-[#9C8E80] text-sm mt-6">
          <a href="/forgot-password" className="text-[#9C8E80] hover:text-[#C4622A] transition-colors">
            {t['login.forgot']}
          </a>
        </p>

        <p className="text-center text-[#9C8E80] text-sm mt-3">
          {t['login.no_account']}{' '}
          <a href="/beta" className="text-[#C4622A] underline underline-offset-2 hover:opacity-80">
            {t['login.request_access']}
          </a>
        </p>
      </div>

      {/* Lien admin discret */}
      <p className="absolute bottom-6 text-[#C4B9A8]/50 text-xs hover:text-[#9C8E80] transition-colors">
        <a href="/admin">admin</a>
      </p>
    </main>
  )
}
