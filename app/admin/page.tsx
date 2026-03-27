'use client'

import { useEffect, useState } from 'react'

type AuthUser = {
  id: string
  email: string
  name: string
  created_at: string
  last_sign_in_at: string | null
}

type WaitlistEntry = {
  id: string
  email: string
  name: string | null
  source: string
  lang: string
  created_at: string
}

type ProjectInfo = {
  user_id: string
  title: string
  word_count: number
  passage_count: number
  status: string
}

type StreakInfo = {
  user_id: string
  current_streak: number
  longest_streak: number
  total_days: number
  last_written_at: string | null
}

type AdminData = {
  users: AuthUser[]
  waitlist: WaitlistEntry[]
  projects: ProjectInfo[]
  streaks: StreakInfo[]
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'users' | 'waitlist' | 'create'>('users')

  // Create beta user form
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/data')
      .then((r) => {
        if (r.status === 401) throw new Error('Non autorise. Connectez-vous avec un compte admin.')
        return r.json()
      })
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
        setLoading(false)
      })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [])

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateMsg(null)

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword, name: newName }),
    })
    const result = await res.json()

    if (result.ok) {
      setCreateMsg(`Compte cree pour ${newEmail} (ID: ${result.userId})`)
      setNewEmail('')
      setNewPassword('')
      setNewName('')
      // Refresh data
      const refreshed = await fetch('/api/admin/data').then((r) => r.json())
      setData(refreshed)
    } else {
      setCreateMsg(`Erreur: ${result.error}`)
    }
    setCreating(false)
  }

  function getUserProject(userId: string) {
    return data?.projects.find((p) => p.user_id === userId)
  }

  function getUserStreak(userId: string) {
    return data?.streaks.find((s) => s.user_id === userId)
  }

  if (loading) return (
    <main className="min-h-screen bg-[#1C1C2E] text-[#F5EFE0] flex items-center justify-center">
      <p className="font-display text-xl animate-pulse">Chargement...</p>
    </main>
  )

  if (error) return (
    <main className="min-h-screen bg-[#1C1C2E] text-red-400 flex items-center justify-center">
      <p>Erreur: {error}</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#1C1C2E] text-[#F5EFE0] p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold">
              M<span className="text-[#C4622A]">.</span>emoir — Admin
            </h1>
            <p className="text-[#9C8E80] text-sm mt-1">
              {data?.users?.length ?? 0} utilisateurs · {data?.waitlist?.length ?? 0} en waitlist
            </p>
          </div>
          <a href="/home" className="text-[#9C8E80] hover:text-[#F5EFE0] text-sm transition-colors">
            ← Retour a l&apos;app
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8">
          {(['users', 'waitlist', 'create'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-[#C4622A] text-white'
                  : 'bg-[#2A2A3E] text-[#9C8E80] hover:text-[#F5EFE0]'
              }`}
            >
              {t === 'users' ? 'Beta testeurs' : t === 'waitlist' ? 'Waitlist' : '+ Creer un compte'}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div className="space-y-3">
            {data?.users.map((u) => {
              const proj = getUserProject(u.id)
              const streak = getUserStreak(u.id)
              return (
                <div
                  key={u.id}
                  className="bg-[#2A2A3E] rounded-2xl p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-display text-lg font-semibold">
                      {u.name || '(sans nom)'}
                    </p>
                    <p className="text-[#9C8E80] text-sm">{u.email}</p>
                    <p className="text-[#9C8E80] text-xs mt-1">
                      Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      {u.last_sign_in_at && ` · Derniere connexion: ${new Date(u.last_sign_in_at).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {proj ? (
                      <>
                        <p className="text-[#C4622A] font-display text-xl font-bold">
                          {proj.word_count} <span className="text-sm font-normal text-[#9C8E80]">mots</span>
                        </p>
                        <p className="text-[#9C8E80] text-xs">
                          {proj.passage_count} passage{proj.passage_count > 1 ? 's' : ''}
                        </p>
                        {streak && (
                          <p className="text-[#9C8E80] text-xs">
                            Serie: {streak.current_streak}j · Record: {streak.longest_streak}j
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[#9C8E80] text-sm italic">Pas encore ecrit</p>
                    )}
                  </div>
                </div>
              )
            })}
            {data?.users.length === 0 && (
              <p className="text-[#9C8E80] text-center py-10">Aucun utilisateur pour l&apos;instant</p>
            )}
          </div>
        )}

        {/* Waitlist tab */}
        {tab === 'waitlist' && (
          <div className="space-y-3">
            {data?.waitlist.map((w) => (
              <div
                key={w.id}
                className="bg-[#2A2A3E] rounded-2xl p-5 flex items-center justify-between"
              >
                <div>
                  <p className="font-display text-lg font-semibold">
                    {w.name || w.email}
                  </p>
                  <p className="text-[#9C8E80] text-sm">{w.email}</p>
                  <p className="text-[#9C8E80] text-xs mt-1">
                    Source: {w.source} · {new Date(w.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewEmail(w.email)
                    setNewName(w.name || '')
                    setNewPassword(`Memoir${Math.random().toString(36).slice(2, 6)}!${Math.floor(Math.random() * 90 + 10)}`)
                    setTab('create')
                  }}
                  className="px-4 py-2 rounded-full bg-[#C4622A]/20 text-[#C4622A] text-sm font-medium hover:bg-[#C4622A]/30 transition-colors"
                >
                  Accepter en beta
                </button>
              </div>
            ))}
            {data?.waitlist.length === 0 && (
              <p className="text-[#9C8E80] text-center py-10">Waitlist vide</p>
            )}
          </div>
        )}

        {/* Create user tab */}
        {tab === 'create' && (
          <div className="max-w-md">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-[#9C8E80] text-sm block mb-1">Prenom</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Marie"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#2A2A3E] border border-[#3A3A4E] text-[#F5EFE0] outline-none focus:border-[#C4622A] transition-colors"
                />
              </div>
              <div>
                <label className="text-[#9C8E80] text-sm block mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="marie@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#2A2A3E] border border-[#3A3A4E] text-[#F5EFE0] outline-none focus:border-[#C4622A] transition-colors"
                />
              </div>
              <div>
                <label className="text-[#9C8E80] text-sm block mb-1">Mot de passe</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Memoir2026!"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-[#2A2A3E] border border-[#3A3A4E] text-[#F5EFE0] outline-none focus:border-[#C4622A] transition-colors"
                />
              </div>
              {createMsg && (
                <p className={`text-sm ${createMsg.startsWith('Erreur') ? 'text-red-400' : 'text-green-400'}`}>
                  {createMsg}
                </p>
              )}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 rounded-xl bg-[#C4622A] text-white font-medium transition-all hover:opacity-90 disabled:opacity-60"
              >
                {creating ? 'Creation...' : 'Creer le compte beta'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
