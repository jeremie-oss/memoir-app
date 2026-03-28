'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useMemoirStore } from '@/stores/memoir'

type View = 'login' | 'request'
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
    'login.request_access': "Demander l'accès",
    'login.forgot': 'Mot de passe oublié ?',
    'login.bad_creds': 'Email ou mot de passe incorrect.',
    'req.h1a': 'Demander',
    'req.h1b': "l'accès",
    'req.sub': "Memoir est en accès anticipé. Laissez-nous vos coordonnées et nous vous ouvrirons l'accès très vite.",
    'req.name': 'Votre prénom',
    'req.email': 'votre@email.com',
    'req.submit': "Demander l'accès",
    'req.loading': 'Envoi...',
    'req.has_account': 'Déjà un compte ?',
    'req.sign_in': 'Se connecter',
    'req.error': 'Une erreur est survenue. Réessayez.',
    'done.title': 'Demande envoyée',
    'done.msg': 'Merci ! Nous examinons votre demande et vous recevrez vos identifiants par email très prochainement.',
    'done.back': 'Retour à la connexion',
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
    'login.request_access': 'Request access',
    'login.forgot': 'Forgot password?',
    'login.bad_creds': 'Incorrect email or password.',
    'req.h1a': 'Request',
    'req.h1b': 'access',
    'req.sub': 'Memoir is in early access. Leave your details and we\'ll open access for you very soon.',
    'req.name': 'Your first name',
    'req.email': 'your@email.com',
    'req.submit': 'Request access',
    'req.loading': 'Sending...',
    'req.has_account': 'Already have an account?',
    'req.sign_in': 'Sign in',
    'req.error': 'Something went wrong. Try again.',
    'done.title': 'Request sent',
    'done.msg': 'Thank you! We\'re reviewing your request and will send your credentials by email very soon.',
    'done.back': 'Back to sign in',
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
    'login.request_access': 'Solicitar acceso',
    'login.forgot': '¿Olvidaste tu contraseña?',
    'login.bad_creds': 'Email o contraseña incorrectos.',
    'req.h1a': 'Solicitar',
    'req.h1b': 'acceso',
    'req.sub': 'Memoir está en acceso anticipado. Déjanos tus datos y te abriremos el acceso muy pronto.',
    'req.name': 'Tu nombre',
    'req.email': 'tu@email.com',
    'req.submit': 'Solicitar acceso',
    'req.loading': 'Enviando...',
    'req.has_account': '¿Ya tienes cuenta?',
    'req.sign_in': 'Iniciar sesión',
    'req.error': 'Algo salió mal. Inténtalo de nuevo.',
    'done.title': 'Solicitud enviada',
    'done.msg': '¡Gracias! Estamos revisando tu solicitud y te enviaremos tus credenciales por email muy pronto.',
    'done.back': 'Volver al inicio de sesión',
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

  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const store = useMemoirStore()

  // Request access state
  const [reqName, setReqName] = useState('')
  const [reqEmail, setReqEmail] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [reqSent, setReqSent] = useState(false)

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

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault()
    setReqLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: reqEmail.trim().toLowerCase(),
          name: reqName.trim(),
          source: 'login-page',
          lang,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setReqSent(true)
      }
    } catch {
      setError(t['req.error'])
    }
    setReqLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-6">
      <a href="/" className="font-display text-2xl font-bold tracking-wide text-[#1C1C2E] mb-16">
        M<span className="text-[#C4622A]">.</span>emoir
      </a>

      <div className="w-full max-w-sm">
        {view === 'login' && (
          <>
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
              <button
                onClick={() => { setView('request'); setError(null) }}
                className="text-[#C4622A] underline underline-offset-2 hover:opacity-80"
              >
                {t['login.request_access']}
              </button>
            </p>
          </>
        )}

        {view === 'request' && !reqSent && (
          <>
            <button
              onClick={() => { setView('login'); setError(null) }}
              className="text-[#9C8E80] hover:text-[#1C1C2E] text-sm transition-colors mb-8 flex items-center gap-1"
            >
              ← {t['req.sign_in']}
            </button>
            <h1 className="font-display text-4xl font-bold text-[#1C1C2E] mb-3 leading-tight">
              {t['req.h1a']}<br />
              <em className="text-[#C4622A]">{t['req.h1b']}</em>
            </h1>
            <p className="text-[#9C8E80] text-base mb-10 leading-relaxed">
              {t['req.sub']}
            </p>

            <form onSubmit={handleRequestAccess} className="flex flex-col gap-4">
              <input
                type="text"
                value={reqName}
                onChange={e => setReqName(e.target.value)}
                placeholder={t['req.name']}
                required
                className="w-full px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
              />
              <input
                type="email"
                value={reqEmail}
                onChange={e => setReqEmail(e.target.value)}
                placeholder={t['req.email']}
                required
                className="w-full px-5 py-4 rounded-full border-2 border-[#EDE4D8] bg-white text-[#1C1C2E] text-base outline-none focus:border-[#C4622A] transition-colors placeholder:text-[#9C8E80] font-sans"
              />

              {error && (
                <p className="text-red-500 text-sm text-center -mt-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={reqLoading}
                className="w-full py-4 rounded-full bg-[#1C1C2E] text-[#FAF8F4] font-medium text-base transition-all hover:bg-[#C4622A] hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 shadow-lg shadow-[#1C1C2E]/15"
              >
                {reqLoading ? t['req.loading'] : t['req.submit']}
              </button>
            </form>

            <p className="text-center text-[#9C8E80] text-sm mt-8">
              {t['req.has_account']}{' '}
              <button
                onClick={() => { setView('login'); setError(null) }}
                className="text-[#C4622A] underline underline-offset-2 hover:opacity-80"
              >
                {t['req.sign_in']}
              </button>
            </p>
          </>
        )}

        {view === 'request' && reqSent && (
          <div className="text-center">
            <div className="text-4xl mb-6">✦</div>
            <h1 className="font-display text-3xl font-bold text-[#1C1C2E] mb-4 leading-tight">
              {t['done.title']}
            </h1>
            <p className="text-[#7A4F32] text-base mb-8 leading-relaxed">
              {t['done.msg']}
            </p>
            <button
              onClick={() => { setView('login'); setReqSent(false); setError(null) }}
              className="text-[#C4622A] underline underline-offset-2 hover:opacity-80 text-sm"
            >
              {t['done.back']}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
