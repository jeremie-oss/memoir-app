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
  prenom: string | null
  ville: string | null
  source: string
  pour_qui: string | null
  quoi_ecrire: string | null
  lang: string
  created_at: string
}

type AccessRequest = {
  id: string
  email: string
  prenom: string | null
  nom: string | null
  motivation: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

type FeedbackEntry = {
  id: string
  user_email: string | null
  page_url: string | null
  page_context: Record<string, string> | null
  message: string
  rating: 'positive' | 'neutral' | 'negative' | null
  status: 'new' | 'seen' | 'done'
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
  accessRequests: AccessRequest[]
  feedbacks: FeedbackEntry[]
  projects: ProjectInfo[]
  streaks: StreakInfo[]
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400',
  approved: 'bg-green-900/30 text-green-400',
  rejected: 'bg-red-900/30 text-red-400',
  new: 'bg-[#C4622A]/20 text-[#C4622A]',
  seen: 'bg-[#2A2A3E] text-[#9C8E80]',
  done: 'bg-green-900/30 text-green-400',
}

const RATING_EMOJI: Record<string, string> = {
  positive: '👍',
  neutral: '🤔',
  negative: '😕',
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'users' | 'waitlist' | 'requests' | 'feedbacks' | 'create'>('users')

  // Create beta user form
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)

  // Request action state
  const [actionId, setActionId] = useState<string | null>(null)

  // URL param feedback (from approve link redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'approved') {
      const email = params.get('email') || ''
      setCreateMsg(`✓ Invitation envoyée à ${email}`)
      setTab('requests')
      window.history.replaceState({}, '', '/admin')
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/data')
      if (r.status === 401) throw new Error('Non autorisé. Connectez-vous avec un compte admin.')
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setData(d)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

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
      setCreateMsg(`Compte créé pour ${newEmail}`)
      setNewEmail('')
      setNewPassword('')
      setNewName('')
      fetchData()
    } else {
      setCreateMsg(`Erreur: ${result.error}`)
    }
    setCreating(false)
  }

  async function handleApprove(id: string) {
    setActionId(id)
    const res = await fetch('/api/admin/approve-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const result = await res.json()
    setActionId(null)
    if (result.ok) {
      fetchData()
    } else {
      alert(`Erreur: ${result.error}`)
    }
  }

  async function handleReject(id: string) {
    if (!confirm('Rejeter cette demande ?')) return
    setActionId(id)
    await fetch('/api/admin/reject-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setActionId(null)
    fetchData()
  }

  function getUserProject(userId: string) {
    return data?.projects.find(p => p.user_id === userId)
  }

  function getUserStreak(userId: string) {
    return data?.streaks.find(s => s.user_id === userId)
  }

  const pendingCount = data?.accessRequests.filter(r => r.status === 'pending').length ?? 0
  const newFeedbacks = data?.feedbacks.filter(f => f.status === 'new').length ?? 0

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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold">
              M<span className="text-[#C4622A]">.</span>emoir — Admin
            </h1>
            <p className="text-[#9C8E80] text-sm mt-1">
              {data?.users.length ?? 0} utilisateurs · {data?.waitlist.length ?? 0} waitlist · {pendingCount} demandes en attente
            </p>
          </div>
          <a href="/home" className="text-[#9C8E80] hover:text-[#F5EFE0] text-sm transition-colors">
            ← Retour à l&apos;app
          </a>
        </div>

        {createMsg && (
          <div className={`mb-6 px-5 py-3 rounded-xl text-sm ${
            createMsg.startsWith('Erreur') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
          }`}>
            {createMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          {([
            { key: 'users', label: 'Beta testeurs' },
            { key: 'waitlist', label: 'Waitlist' },
            { key: 'requests', label: `Demandes${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { key: 'feedbacks', label: `Feedbacks${newFeedbacks > 0 ? ` (${newFeedbacks})` : ''}` },
            { key: 'create', label: '+ Créer un compte' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-[#C4622A] text-white'
                  : 'bg-[#2A2A3E] text-[#9C8E80] hover:text-[#F5EFE0]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="space-y-3">
            {data?.users.map(u => {
              const proj = getUserProject(u.id)
              const streak = getUserStreak(u.id)
              return (
                <div key={u.id} className="bg-[#2A2A3E] rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg font-semibold">{u.name || '(sans nom)'}</p>
                    <p className="text-[#9C8E80] text-sm">{u.email}</p>
                    <p className="text-[#9C8E80] text-xs mt-1">
                      Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      {u.last_sign_in_at && ` · Dernière connexion: ${new Date(u.last_sign_in_at).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {proj ? (
                      <>
                        <p className="text-[#C4622A] font-display text-xl font-bold">
                          {proj.word_count} <span className="text-sm font-normal text-[#9C8E80]">mots</span>
                        </p>
                        <p className="text-[#9C8E80] text-xs">{proj.passage_count} passage{proj.passage_count > 1 ? 's' : ''}</p>
                        {streak && (
                          <p className="text-[#9C8E80] text-xs">
                            Série: {streak.current_streak}j · Record: {streak.longest_streak}j
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[#9C8E80] text-sm italic">Pas encore écrit</p>
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

        {/* ── WAITLIST ── */}
        {tab === 'waitlist' && (
          <div className="space-y-3">
            {data?.waitlist.map(w => (
              <div key={w.id} className="bg-[#2A2A3E] rounded-2xl p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg font-semibold">
                    {w.prenom || w.name || w.email}
                    {w.prenom && w.name && w.name !== w.prenom && ` ${w.name.split(' ').slice(1).join(' ')}`}
                  </p>
                  <p className="text-[#9C8E80] text-sm">{w.email}</p>
                  <p className="text-[#9C8E80] text-xs mt-1">
                    {[w.ville, w.source, new Date(w.created_at).toLocaleDateString('fr-FR')].filter(Boolean).join(' · ')}
                  </p>
                  {w.pour_qui && (
                    <p className="text-[#9C8E80] text-xs">Pour : {w.pour_qui === 'soi' ? 'moi-même' : 'un proche'}</p>
                  )}
                  {w.quoi_ecrire && (
                    <p className="text-[#9C8E80] text-xs mt-1 italic truncate max-w-xs">&ldquo;{w.quoi_ecrire}&rdquo;</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setNewEmail(w.email)
                    setNewName(w.prenom || w.name || '')
                    setNewPassword(`Memoir${Math.random().toString(36).slice(2, 6)}!${Math.floor(Math.random() * 90 + 10)}`)
                    setTab('create')
                  }}
                  className="shrink-0 px-4 py-2 rounded-full bg-[#C4622A]/20 text-[#C4622A] text-sm font-medium hover:bg-[#C4622A]/30 transition-colors"
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

        {/* ── ACCESS REQUESTS ── */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {data?.accessRequests.map(r => (
              <div key={r.id} className="bg-[#2A2A3E] rounded-2xl p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-display text-lg font-semibold">
                      {r.prenom || ''}{r.nom ? ` ${r.nom}` : ''}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status]}`}>
                      {r.status === 'pending' ? 'en attente' : r.status === 'approved' ? 'approuvé' : 'rejeté'}
                    </span>
                  </div>
                  <p className="text-[#9C8E80] text-sm">{r.email}</p>
                  <p className="text-[#9C8E80] text-xs mt-1">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                  {r.motivation && (
                    <p className="text-[#9C8E80] text-sm mt-2 italic leading-relaxed">
                      &ldquo;{r.motivation}&rdquo;
                    </p>
                  )}
                </div>
                {r.status === 'pending' && (
                  <div className="shrink-0 flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={actionId === r.id}
                      className="px-4 py-2 rounded-full bg-[#C4622A] text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60"
                    >
                      {actionId === r.id ? '...' : 'Approuver'}
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      disabled={actionId === r.id}
                      className="px-4 py-2 rounded-full bg-[#2A2A3E] border border-[#3A3A4E] text-[#9C8E80] text-sm hover:text-[#F5EFE0] transition-all disabled:opacity-60"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
            {data?.accessRequests.length === 0 && (
              <p className="text-[#9C8E80] text-center py-10">Aucune demande pour l&apos;instant</p>
            )}
          </div>
        )}

        {/* ── FEEDBACKS ── */}
        {tab === 'feedbacks' && (
          <div className="space-y-3">
            {data?.feedbacks.map(f => (
              <div key={f.id} className="bg-[#2A2A3E] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    {f.rating && <span className="text-xl">{RATING_EMOJI[f.rating]}</span>}
                    <div>
                      <p className="text-[#9C8E80] text-sm">{f.user_email || 'Anonyme'}</p>
                      <p className="text-[#9C8E80] text-xs font-mono">{f.page_url || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[f.status]}`}>
                      {f.status}
                    </span>
                    <p className="text-[#9C8E80] text-xs">{new Date(f.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <p className="text-[#F5EFE0] text-sm leading-relaxed italic">
                  &ldquo;{f.message}&rdquo;
                </p>
                {f.page_context && Object.keys(f.page_context).length > 0 && (
                  <p className="text-[#9C8E80] text-xs font-mono mt-2">{JSON.stringify(f.page_context)}</p>
                )}
              </div>
            ))}
            {data?.feedbacks.length === 0 && (
              <p className="text-[#9C8E80] text-center py-10">Aucun feedback pour l&apos;instant</p>
            )}
          </div>
        )}

        {/* ── CREATE USER ── */}
        {tab === 'create' && (
          <div className="max-w-md">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-[#9C8E80] text-sm block mb-1">Prénom / Nom</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
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
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="marie@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#2A2A3E] border border-[#3A3A4E] text-[#F5EFE0] outline-none focus:border-[#C4622A] transition-colors"
                />
              </div>
              <div>
                <label className="text-[#9C8E80] text-sm block mb-1">Mot de passe initial</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
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
                {creating ? 'Création...' : 'Créer le compte beta'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
