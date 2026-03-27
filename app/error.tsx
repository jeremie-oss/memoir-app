'use client'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F4] px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-[#F5EFE0] flex items-center justify-center mx-auto mb-6 text-2xl">
          !
        </div>
        <h2 className="font-display text-3xl font-bold text-[#1C1C2E] mb-3">
          Quelque chose s&apos;est mal passe.
        </h2>
        <p className="text-[#9C8E80] text-base leading-relaxed mb-8">
          {error.message || 'Une erreur inattendue est survenue.'}
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 rounded-full bg-[#C4622A] text-white font-medium transition-all hover:opacity-90"
        >
          Reessayer
        </button>
        <a
          href="/home"
          className="block mt-4 text-[#9C8E80] text-sm underline underline-offset-2"
        >
          Retour a l&apos;accueil
        </a>
      </div>
    </main>
  )
}
