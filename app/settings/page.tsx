'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMemoirStore } from '@/stores/memoir'
import { useNotifications } from '@/hooks/useNotifications'

const GRAIN = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px',
}

const STYLE_SAMPLES: Record<'fr' | 'en' | 'es', Record<'romance' | 'biographique' | 'documentaire', string>> = {
  fr: {
    romance: `Ce matin-là, la lumière entrait oblique par les volets - dorée comme du miel. Je sus que ce jour serait différent. Quelque chose dans l'air tremblait d'une promesse que j'aurais voulu pouvoir nommer.`,
    biographique: `J'avais trente-deux ans quand j'ai compris que la vie que je menais n'était pas la mienne. Trois enfants, une maison, et ce vide sourd au creux de la poitrine que je confondais avec de la fatigue.`,
    documentaire: `Né en 1951 à Lyon, j'ai grandi dans une famille ouvrière de quatre enfants. Mon père travaillait en usine ; ma mère faisait des ménages le matin avant de s'occuper de nous.`,
  },
  en: {
    romance: `That morning, light came slanting through the shutters - golden as honey. I knew the day would be different. Something in the air trembled with a promise I couldn't name.`,
    biographique: `I was thirty-two when I understood that the life I was living wasn't mine. Three children, a house, and that hollow ache in my chest I kept mistaking for tiredness.`,
    documentaire: `Born in 1951 in Lyon, I grew up in a working-class family of four. My father worked at the factory; my mother cleaned houses in the mornings before looking after us.`,
  },
  es: {
    romance: `Aquella mañana, la luz entraba oblicua por las persianas - dorada como la miel. Supe que ese día sería distinto. Algo en el aire temblaba con una promesa que no supe nombrar.`,
    biographique: `Tenía treinta y dos años cuando comprendí que la vida que llevaba no era la mía. Tres hijos, una casa, y ese vacío sordo en el pecho que confundía con cansancio.`,
    documentaire: `Nacido en 1951 en Lyon, crecí en una familia obrera de cuatro hijos. Mi padre trabajaba en la fábrica; mi madre limpiaba casas por las mañanas antes de cuidarnos.`,
  },
}

const WL = {
  fr: {
    title: 'Mon profil',
    back: '← Retour',
    saved: 'Sauvegardé',
    sections: {
      histoire: 'Mon histoire',
      rythme: 'Mon rythme',
      voix: 'Ma voix',
      notifs: 'Rappels',
      app: "L'application",
    },
    fields: {
      prenom: 'Mon prénom',
      pourquoi: 'Pourquoi j\'écris',
      pourquoi_opts: [
        { id: 'trace', label: 'Laisser une trace' },
        { id: 'valeurs', label: 'Transmettre mes valeurs' },
        { id: 'comprendre', label: 'Mieux me comprendre' },
        { id: 'honorer', label: 'Honorer mes proches' },
      ],
      pourqui: 'Pour qui j\'écris',
      pourqui_opts: [
        { id: 'enfants', label: 'Mes enfants' },
        { id: 'famille', label: 'Ma famille' },
        { id: 'moi', label: 'Pour moi' },
        { id: 'posterite', label: 'La postérité' },
        { id: 'quelquun', label: 'Quelqu\'un en particulier' },
      ],
      prenom_destinataire: 'Leur(s) prénom(s)',
      frequence: 'Fréquence',
      frequence_opts: [
        { id: 'quotidien', label: 'Quotidienne' },
        { id: 'hebdo', label: 'Hebdomadaire' },
        { id: 'libre', label: 'Libre' },
      ],
      duree: 'Durée de séance',
      duree_opts: [
        { id: '0', label: 'Sans limite' },
        { id: '15', label: '15 min' },
        { id: '30', label: '30 min' },
        { id: '45', label: '45 min' },
      ],
      mode: 'Mode favori',
      mode_opts: [
        { id: 'libre', label: '✦  Séance Libre' },
        { id: 'guide', label: '◈  Voix Guidée' },
        { id: 'dicte', label: '◎  Dictée' },
      ],
      ton: 'Style d\'écriture',
      ton_opts: [
        { id: 'romance', label: 'Romancé' },
        { id: 'biographique', label: 'Biographique' },
        { id: 'documentaire', label: 'Documentaire' },
      ],
      notifs_toggle: 'Recevoir des rappels',
      notifs_hour: 'Heure du rappel',
      notifs_nudge: 'Rappel adaptatif si silence',
      lang: 'Langue',
    },
    reset: 'Réinitialiser le profil',
    resetConfirm: 'Confirmer la réinitialisation ?',
    notifDenied: 'Notifications refusées par le navigateur. Autorisez-les dans les réglages.',
    notifOn: 'Actif',
    notifOff: 'Désactivé',
  },
  en: {
    title: 'My profile',
    back: '← Back',
    saved: 'Saved',
    sections: {
      histoire: 'My story',
      rythme: 'My rhythm',
      voix: 'My voice',
      notifs: 'Reminders',
      app: 'Application',
    },
    fields: {
      prenom: 'My name',
      pourquoi: 'Why I write',
      pourquoi_opts: [
        { id: 'trace', label: 'Leave a trace' },
        { id: 'valeurs', label: 'Pass on my values' },
        { id: 'comprendre', label: 'Understand myself better' },
        { id: 'honorer', label: 'Honor my loved ones' },
      ],
      pourqui: 'Who I\'m writing for',
      pourqui_opts: [
        { id: 'enfants', label: 'My children' },
        { id: 'famille', label: 'My family' },
        { id: 'moi', label: 'For myself' },
        { id: 'posterite', label: 'Posterity' },
        { id: 'quelquun', label: 'Someone in particular' },
      ],
      prenom_destinataire: 'Their name(s)',
      frequence: 'Frequency',
      frequence_opts: [
        { id: 'quotidien', label: 'Daily' },
        { id: 'hebdo', label: 'Weekly' },
        { id: 'libre', label: 'Freeform' },
      ],
      duree: 'Session duration',
      duree_opts: [
        { id: '0', label: 'No limit' },
        { id: '15', label: '15 min' },
        { id: '30', label: '30 min' },
        { id: '45', label: '45 min' },
      ],
      mode: 'Preferred mode',
      mode_opts: [
        { id: 'libre', label: '✦  Free Séance' },
        { id: 'guide', label: '◈  Guided Voice' },
        { id: 'dicte', label: '◎  Dictation' },
      ],
      ton: 'Writing style',
      ton_opts: [
        { id: 'romance', label: 'Romanticized' },
        { id: 'biographique', label: 'Biographical' },
        { id: 'documentaire', label: 'Documentary' },
      ],
      notifs_toggle: 'Receive reminders',
      notifs_hour: 'Reminder time',
      notifs_nudge: 'Adaptive reminder if silent',
      lang: 'Language',
    },
    reset: 'Reset profile',
    resetConfirm: 'Confirm reset?',
    notifDenied: 'Notifications blocked by browser. Allow them in settings.',
    notifOn: 'Active',
    notifOff: 'Off',
  },
  es: {
    title: 'Mi perfil',
    back: '← Volver',
    saved: 'Guardado',
    sections: {
      histoire: 'Mi historia',
      rythme: 'Mi ritmo',
      voix: 'Mi voz',
      notifs: 'Recordatorios',
      app: 'Aplicación',
    },
    fields: {
      prenom: 'Mi nombre',
      pourquoi: 'Por qué escribo',
      pourquoi_opts: [
        { id: 'trace', label: 'Dejar una huella' },
        { id: 'valeurs', label: 'Transmitir mis valores' },
        { id: 'comprendre', label: 'Entenderme mejor' },
        { id: 'honorer', label: 'Honrar a mis seres queridos' },
      ],
      pourqui: 'Para quién escribo',
      pourqui_opts: [
        { id: 'enfants', label: 'Mis hijos' },
        { id: 'famille', label: 'Mi familia' },
        { id: 'moi', label: 'Para mí' },
        { id: 'posterite', label: 'La posteridad' },
        { id: 'quelquun', label: 'Alguien en particular' },
      ],
      prenom_destinataire: 'Su(s) nombre(s)',
      frequence: 'Frecuencia',
      frequence_opts: [
        { id: 'quotidien', label: 'Diaria' },
        { id: 'hebdo', label: 'Semanal' },
        { id: 'libre', label: 'Libre' },
      ],
      duree: 'Duración de sesión',
      duree_opts: [
        { id: '0', label: 'Sin límite' },
        { id: '15', label: '15 min' },
        { id: '30', label: '30 min' },
        { id: '45', label: '45 min' },
      ],
      mode: 'Modo favorito',
      mode_opts: [
        { id: 'libre', label: '✦  Sesión Libre' },
        { id: 'guide', label: '◈  Voz Guiada' },
        { id: 'dicte', label: '◎  Dictado' },
      ],
      ton: 'Estilo de escritura',
      ton_opts: [
        { id: 'romance', label: 'Romántico' },
        { id: 'biographique', label: 'Biográfico' },
        { id: 'documentaire', label: 'Documental' },
      ],
      notifs_toggle: 'Recibir recordatorios',
      notifs_hour: 'Hora del recordatorio',
      notifs_nudge: 'Recordatorio adaptativo si silencio',
      lang: 'Idioma',
    },
    reset: 'Restablecer perfil',
    resetConfirm: '¿Confirmar restablecimiento?',
    notifDenied: 'Notificaciones bloqueadas por el navegador.',
    notifOn: 'Activo',
    notifOff: 'Desactivado',
  },
}

// ── Reusable components ───────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <p className="text-[10px] text-[#9C8E80]/50 tracking-widest uppercase mb-4">{title}</p>
      <div className="bg-white rounded-2xl border border-[#EDE4D8] divide-y divide-[#EDE4D8] overflow-hidden">
        {children}
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <span className="text-sm text-[#1C1C2E] shrink-0">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  )
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap justify-end">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            value === o.id
              ? 'bg-[#C4622A] border-[#C4622A] text-white'
              : 'bg-transparent border-[#EDE4D8] text-[#9C8E80] hover:border-[#C4622A]/40 hover:text-[#C4622A]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const store = useMemoirStore()
  const notifs = useNotifications()
  const lang = store.lang
  const lang3 = (lang === 'tr' ? 'en' : lang) as 'fr' | 'en' | 'es'
  const wl = WL[lang3]
  const f = wl.fields

  const [savedFlash, setSavedFlash] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [notifError, setNotifError] = useState(false)

  function flash() {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  function update(fn: () => void) {
    fn()
    flash()
  }

  async function toggleNotifs() {
    if (store.notifications.enabled) {
      notifs.disable()
      flash()
    } else {
      const ok = await notifs.enable()
      if (!ok) {
        setNotifError(true)
        setTimeout(() => setNotifError(false), 4000)
      } else {
        flash()
      }
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="min-h-screen bg-[#FAF8F4] relative">
      <div className="pointer-events-none fixed inset-0 opacity-[0.025] z-50" style={GRAIN} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F4]/90 backdrop-blur-sm border-b border-[#EDE4D8] px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/home')}
          className="text-sm text-[#9C8E80] hover:text-[#1C1C2E] transition-colors"
        >
          {wl.back}
        </button>
        <span className="font-display text-base italic text-[#1C1C2E]">{wl.title}</span>
        <span className={`text-xs text-[#7A4F32] transition-opacity duration-300 ${savedFlash ? 'opacity-100' : 'opacity-0'}`}>
          {wl.saved} ✓
        </span>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8 pb-20">

        {/* ── MON HISTOIRE ── */}
        <Section title={wl.sections.histoire}>
          {/* Prénom */}
          <Row label={f.prenom}>
            <input
              type="text"
              value={store.userName}
              onChange={e => update(() => store.setUserName(e.target.value))}
              className="text-sm text-right bg-transparent outline-none text-[#1C1C2E] w-36 placeholder:text-[#C4B9A8]"
              placeholder="Votre prénom"
            />
          </Row>

          {/* Pourquoi */}
          <div className="px-5 py-4">
            <p className="text-sm text-[#1C1C2E] mb-3">{f.pourquoi}</p>
            <ChipGroup
              options={f.pourquoi_opts}
              value={store.profile.intention}
              onChange={v => update(() => store.setProfile({ intention: v }))}
            />
          </div>

          {/* Pour qui */}
          <div className="px-5 py-4">
            <p className="text-sm text-[#1C1C2E] mb-3">{f.pourqui}</p>
            <ChipGroup
              options={f.pourqui_opts}
              value={store.profile.destinataire}
              onChange={v => update(() => store.setProfile({ destinataire: v }))}
            />
          </div>

          {/* Prénom destinataire */}
          {(store.profile.destinataire === 'quelquun' || store.profile.destinatairePrenom) && (
            <Row label={f.prenom_destinataire}>
              <input
                type="text"
                value={store.profile.destinatairePrenom}
                onChange={e => update(() => store.setProfile({ destinatairePrenom: e.target.value }))}
                className="text-sm text-right bg-transparent outline-none text-[#1C1C2E] w-36 placeholder:text-[#C4B9A8]"
                placeholder="Emma, Lucas…"
              />
            </Row>
          )}
        </Section>

        {/* ── MON RYTHME ── */}
        <Section title={wl.sections.rythme}>
          <div className="px-5 py-4">
            <p className="text-sm text-[#1C1C2E] mb-3">{f.frequence}</p>
            <ChipGroup
              options={f.frequence_opts}
              value={store.profile.frequence}
              onChange={v => update(() => store.setProfile({ frequence: v as any }))}
            />
          </div>

          <div className="px-5 py-4">
            <p className="text-sm text-[#1C1C2E] mb-3">{f.duree}</p>
            <ChipGroup
              options={f.duree_opts}
              value={String(store.profile.duree)}
              onChange={v => update(() => store.setProfile({ duree: Number(v) as any }))}
            />
          </div>
        </Section>

        {/* ── MA VOIX ── */}
        <Section title={wl.sections.voix}>
          <div className="px-5 py-4">
            <p className="text-sm text-[#1C1C2E] mb-3">{f.mode}</p>
            <ChipGroup
              options={f.mode_opts}
              value={store.writingMode === 'entretien' ? 'libre' : store.writingMode}
              onChange={v => update(() => store.setWritingMode(v as any))}
            />
          </div>

          <div className="px-5 py-4">
            <p className="text-sm text-[#1C1C2E] mb-3">{f.ton}</p>
            <ChipGroup
              options={f.ton_opts}
              value={store.profile.ton}
              onChange={v => update(() => store.setProfile({ ton: v as any }))}
            />
          </div>

          {/* Style preview - updates reactively with selected ton */}
          {store.profile.ton && (
            <div className="px-5 py-4 bg-[#F5EFE0]/50 border-t border-[#EDE4D8]">
              <p className="text-[10px] text-[#9C8E80]/50 tracking-widest uppercase mb-2">
                {lang === 'fr' ? 'Exemple de style' : lang === 'es' ? 'Ejemplo de estilo' : 'Style example'}
              </p>
              <p className="font-display italic text-sm text-[#7A4F32] leading-relaxed">
                "{STYLE_SAMPLES[lang3][store.profile.ton as 'romance' | 'biographique' | 'documentaire']}"
              </p>
            </div>
          )}
        </Section>

        {/* ── RAPPELS ── */}
        <Section title={wl.sections.notifs}>
          {/* Toggle */}
          <Row label={f.notifs_toggle}>
            <button
              onClick={toggleNotifs}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                store.notifications.enabled ? 'bg-[#C4622A]' : 'bg-[#EDE4D8]'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                store.notifications.enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </Row>

          {notifError && (
            <div className="px-5 py-3 bg-red-50 border-t border-red-100">
              <p className="text-xs text-red-500">{wl.notifDenied}</p>
            </div>
          )}

          {store.notifications.enabled && (
            <>
              {/* Heure */}
              <Row label={f.notifs_hour}>
                <select
                  value={store.notifications.hour}
                  onChange={e => update(() => store.setNotifications({ hour: Number(e.target.value) }))}
                  className="text-sm text-[#1C1C2E] bg-transparent outline-none text-right cursor-pointer"
                >
                  {hours.map(h => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </Row>

              {/* Adaptive nudge */}
              <Row label={f.notifs_nudge}>
                <button
                  onClick={() => update(() => store.setNotifications({ nudgeEnabled: !store.notifications.nudgeEnabled }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    store.notifications.nudgeEnabled ? 'bg-[#C4622A]' : 'bg-[#EDE4D8]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    store.notifications.nudgeEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </Row>
            </>
          )}
        </Section>

        {/* ── L'APPLICATION ── */}
        <Section title={wl.sections.app}>
          <Row label={f.lang}>
            <div className="flex gap-2">
              {(['fr', 'en', 'es'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => update(() => store.setLang(l))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all uppercase tracking-wide ${
                    store.lang === l
                      ? 'bg-[#C4622A] border-[#C4622A] text-white'
                      : 'border-[#EDE4D8] text-[#9C8E80] hover:border-[#C4622A]/40'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* Reset */}
        <div className="text-center mt-4">
          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="text-xs text-[#9C8E80]/50 hover:text-red-400 transition-colors"
            >
              {wl.reset}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <span className="text-xs text-[#9C8E80]">{wl.resetConfirm}</span>
              <button
                onClick={() => { store.resetAll(); router.push('/') }}
                className="text-xs text-red-500 underline"
              >
                Oui
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="text-xs text-[#9C8E80]"
              >
                Non
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
