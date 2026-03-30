'use client'

import { useReducer, useState } from 'react'
import { useMemoirStore } from '@/stores/memoir'
import {
  runScanCharacters,
  runScanTimeline,
  type CharacterProposal,
  type TimelineProposal,
  type DuplicateWarning,
  type ScanResult,
} from '@/lib/ai/archiviste'
import type { Plan } from '@/stores/memoir'

type ScanType = 'characters' | 'timeline'

type Props = {
  type: ScanType
  plan: Plan
  onClose: () => void
}

// ─── State machine ────────────────────────────────────────────────────────────

type ScanState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | {
      phase: 'preview'
      result: ScanResult<CharacterProposal> | ScanResult<TimelineProposal>
      selected: Set<number>
      resolutions: Map<string, 'merge' | 'keep'>  // key = proposedName
      mergeNames: Map<string, string>              // key = proposedName → canonical name chosen
    }
  | {
      phase: 'merge-modal'
      dup: DuplicateWarning
      // Save previous preview state to restore after modal
      prevState: Extract<ScanState, { phase: 'preview' }>
    }
  | { phase: 'applying' }
  | { phase: 'done'; added: number }

type Action =
  | { type: 'START_SCAN' }
  | { type: 'SCAN_SUCCESS'; result: ScanResult<CharacterProposal> | ScanResult<TimelineProposal> }
  | { type: 'SCAN_ERROR'; message: string }
  | { type: 'TOGGLE_SELECT'; index: number }
  | { type: 'SELECT_ALL' }
  | { type: 'DESELECT_ALL' }
  | { type: 'RESOLVE_DUPLICATE'; proposedName: string; resolution: 'merge' | 'keep' }
  | { type: 'RESET_DUPLICATE'; proposedName: string }
  | { type: 'OPEN_MERGE_MODAL'; dup: DuplicateWarning }
  | { type: 'CONFIRM_MERGE'; proposedName: string; canonicalName: string }
  | { type: 'CLOSE_MERGE_MODAL' }
  | { type: 'START_APPLY' }
  | { type: 'APPLY_DONE'; added: number }

function reducer(state: ScanState, action: Action): ScanState {
  switch (action.type) {
    case 'START_SCAN':
      return { phase: 'loading' }

    case 'SCAN_SUCCESS': {
      const allSelected = new Set(action.result.proposed.map((_, i) => i))
      return {
        phase: 'preview',
        result: action.result,
        selected: allSelected,
        resolutions: new Map(),
        mergeNames: new Map(),
      }
    }

    case 'SCAN_ERROR':
      return { phase: 'error', message: action.message }

    case 'TOGGLE_SELECT': {
      if (state.phase !== 'preview') return state
      const next = new Set(state.selected)
      next.has(action.index) ? next.delete(action.index) : next.add(action.index)
      return { ...state, selected: next }
    }

    case 'SELECT_ALL': {
      if (state.phase !== 'preview') return state
      return { ...state, selected: new Set(state.result.proposed.map((_, i) => i)) }
    }

    case 'DESELECT_ALL': {
      if (state.phase !== 'preview') return state
      return { ...state, selected: new Set() }
    }

    case 'RESOLVE_DUPLICATE': {
      if (state.phase !== 'preview') return state
      const next = new Map(state.resolutions)
      next.set(action.proposedName, action.resolution)
      return { ...state, resolutions: next }
    }

    case 'RESET_DUPLICATE': {
      if (state.phase !== 'preview') return state
      const next = new Map(state.resolutions)
      const nextNames = new Map(state.mergeNames)
      next.delete(action.proposedName)
      nextNames.delete(action.proposedName)
      return { ...state, resolutions: next, mergeNames: nextNames }
    }

    case 'OPEN_MERGE_MODAL': {
      if (state.phase !== 'preview') return state
      return { phase: 'merge-modal', dup: action.dup, prevState: state }
    }

    case 'CONFIRM_MERGE': {
      if (state.phase !== 'merge-modal') return state
      const prev = state.prevState
      const nextResolutions = new Map(prev.resolutions)
      nextResolutions.set(action.proposedName, 'merge')
      const nextMergeNames = new Map(prev.mergeNames)
      nextMergeNames.set(action.proposedName, action.canonicalName)
      return { ...prev, resolutions: nextResolutions, mergeNames: nextMergeNames }
    }

    case 'CLOSE_MERGE_MODAL': {
      if (state.phase !== 'merge-modal') return state
      return state.prevState
    }

    case 'START_APPLY':
      return { phase: 'applying' }

    case 'APPLY_DONE':
      return { phase: 'done', added: action.added }

    default:
      return state
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ArchivisteScanner({ type, plan, onClose }: Props) {
  const store = useMemoirStore()
  const [scanState, dispatch] = useReducer(reducer, { phase: 'idle' })

  // For merge modal: track the canonical name input
  const [mergeNameInput, setMergeNameInput] = useState('')

  const lang = store.lang
  const isCharacters = type === 'characters'
  const isGutenberg = plan === 'gutenberg'

  const t = {
    title: isCharacters
      ? (lang === 'fr' ? 'Analyser les personnages' : 'Analyze characters')
      : (lang === 'fr' ? 'Analyser la chronologie' : 'Analyze timeline'),
    scanBtn: lang === 'fr' ? 'Analyser mes textes' : 'Analyze my texts',
    loading: lang === 'fr' ? 'Analyse en cours…' : 'Analyzing…',
    loadingSub: lang === 'fr' ? "L'Archiviste lit l'ensemble de vos séances." : 'The Archivist is reading all your sessions.',
    noSessions: lang === 'fr' ? 'Aucune séance à analyser.' : 'No sessions to analyze.',
    proposed: isCharacters
      ? (lang === 'fr' ? 'Personnages détectés' : 'Detected characters')
      : (lang === 'fr' ? 'Événements détectés' : 'Detected events'),
    duplicates: lang === 'fr' ? 'Doublons probables' : 'Possible duplicates',
    apply: lang === 'fr' ? 'Appliquer la sélection' : 'Apply selection',
    done: lang === 'fr' ? 'ajouté(s)' : 'added',
    merge: lang === 'fr' ? 'Fusionner' : 'Merge',
    keep: lang === 'fr' ? 'Garder séparé' : 'Keep separate',
    canonicalName: lang === 'fr' ? 'Nom canonique' : 'Canonical name',
    confirmMerge: lang === 'fr' ? 'Confirmer la fusion' : 'Confirm merge',
    cancel: lang === 'fr' ? 'Annuler' : 'Cancel',
    empty: isCharacters
      ? (lang === 'fr' ? 'Aucun nouveau personnage détecté.' : 'No new characters detected.')
      : (lang === 'fr' ? 'Aucun nouvel événement détecté.' : 'No new events detected.'),
    confidence_low: lang === 'fr' ? 'incertain' : 'uncertain',
    selectAll: lang === 'fr' ? 'Tout sélectionner' : 'Select all',
    deselectAll: lang === 'fr' ? 'Tout désélectionner' : 'Deselect all',
    description: lang === 'fr' ? 'Portrait' : 'Portrait',
    close: lang === 'fr' ? 'Fermer' : 'Close',
  }

  async function handleScan() {
    if (!store.sessions.length) return
    dispatch({ type: 'START_SCAN' })

    const result = isCharacters
      ? await runScanCharacters(store, plan)
      : await runScanTimeline(store)

    if (!result) {
      dispatch({ type: 'SCAN_ERROR', message: lang === 'fr' ? "L'analyse a échoué. Réessayez." : 'Analysis failed. Please try again.' })
      return
    }
    dispatch({ type: 'SCAN_SUCCESS', result })
  }

  async function handleApply() {
    if (scanState.phase !== 'preview') return
    dispatch({ type: 'START_APPLY' })

    const { result, selected, resolutions, mergeNames } = scanState
    let added = 0

    // 1. Process merges first
    for (const [proposedName, resolution] of resolutions) {
      if (resolution !== 'merge') continue
      const dup = result.possibleDuplicates.find((d) => d.proposedName === proposedName)
      if (!dup) continue
      const canonicalName = mergeNames.get(proposedName) || dup.existingName
      // The proposed character isn't in store yet — just update the existing one's name
      store.updateCharacter(dup.existingId, { name: canonicalName })
    }

    // 2. Add selected new items
    const selectedItems = result.proposed.filter((_, i) => selected.has(i))

    if (isCharacters) {
      const chars = selectedItems as CharacterProposal[]
      store.bulkAddCharacters(
        chars.map((c) => ({
          name: c.name,
          relation: c.relation,
          period: c.period,
          notes: '',
          description: c.description,
        }))
      )
      added = chars.length
    } else {
      const events = selectedItems as TimelineProposal[]
      store.bulkAddTimelineEvents(
        events.map((e) => ({
          date: e.date,
          title: e.title,
          description: e.description,
        }))
      )
      added = events.length
    }

    dispatch({ type: 'APPLY_DONE', added })
  }

  // ─── Merge modal ───────────────────────────────────────────────────────────

  if (scanState.phase === 'merge-modal') {
    const { dup } = scanState
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-[#FAF8F4] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 shadow-2xl">
          <h3 className="font-display text-[#1C1C2E] text-lg mb-1">{t.canonicalName}</h3>
          <p className="text-xs text-[#9C8E80] mb-5">
            {lang === 'fr'
              ? `"${dup.proposedName}" semble être la même personne que "${dup.existingName}". Choisissez le nom à garder.`
              : `"${dup.proposedName}" seems to be the same person as "${dup.existingName}". Choose the name to keep.`}
          </p>
          <p className="text-xs text-[#7A4F32] italic mb-4 bg-[#F5EFE0] rounded-xl px-3 py-2">
            {dup.reason}
          </p>

          {/* Quick-pick buttons */}
          <div className="flex gap-2 mb-4">
            {[dup.existingName, dup.proposedName].map((name) => (
              <button
                key={name}
                onClick={() => setMergeNameInput(name)}
                className={`flex-1 text-sm px-3 py-2 rounded-xl border transition-all ${
                  mergeNameInput === name
                    ? 'bg-[#1C1C2E] text-white border-[#1C1C2E]'
                    : 'border-[#EDE4D8] text-[#7A4F32] hover:bg-[#F5EFE0]'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Free input */}
          <input
            type="text"
            value={mergeNameInput}
            onChange={(e) => setMergeNameInput(e.target.value)}
            placeholder={lang === 'fr' ? 'Ou saisissez un autre nom…' : 'Or type another name…'}
            className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#EDE4D8] bg-white text-[#1C1C2E] placeholder:text-[#C0B5A8] focus:outline-none focus:border-[#C4622A] mb-5"
          />

          <div className="flex gap-3">
            <button
              onClick={() => { dispatch({ type: 'CLOSE_MERGE_MODAL' }); setMergeNameInput('') }}
              className="flex-1 py-2.5 rounded-xl border border-[#EDE4D8] text-sm text-[#7A4F32] hover:bg-[#F5EFE0] transition-all"
            >
              {t.cancel}
            </button>
            <button
              onClick={() => {
                if (!mergeNameInput.trim()) return
                dispatch({ type: 'CONFIRM_MERGE', proposedName: dup.proposedName, canonicalName: mergeNameInput.trim() })
                setMergeNameInput('')
              }}
              disabled={!mergeNameInput.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#1C1C2E] text-white text-sm disabled:opacity-40 hover:bg-[#2e2e45] transition-all"
            >
              {t.confirmMerge}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main drawer ──────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#FAF8F4] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDE4D8]">
          <div className="flex items-center gap-2">
            <span className="text-[#C4622A] text-base">✦</span>
            <h2 className="font-display text-[#1C1C2E] text-lg">{t.title}</h2>
            {isGutenberg && (
              <span className="text-[9px] uppercase tracking-widest text-white bg-[#1C1C2E] px-2 py-0.5 rounded-full">
                Gutenberg
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EDE4D8] text-[#9C8E80] transition-all text-lg">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* Idle */}
          {scanState.phase === 'idle' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[#EDE4D8] flex items-center justify-center">
                <span className="text-2xl">{isCharacters ? '👤' : '⏳'}</span>
              </div>
              <div>
                <p className="text-sm text-[#1C1C2E] font-medium mb-1">
                  {lang === 'fr'
                    ? `L'Archiviste va lire toutes vos séances (${store.sessions.length}) et détecter les ${isCharacters ? 'personnages' : 'événements'} nouveaux.`
                    : `The Archivist will read all your sessions (${store.sessions.length}) and detect new ${isCharacters ? 'characters' : 'events'}.`}
                </p>
                <p className="text-xs text-[#9C8E80] italic">
                  {lang === 'fr' ? 'Vous pourrez valider ou rejeter chaque suggestion.' : 'You can validate or reject each suggestion.'}
                </p>
              </div>
              {store.sessions.length === 0 ? (
                <p className="text-xs text-[#9C8E80]">{t.noSessions}</p>
              ) : (
                <button
                  onClick={handleScan}
                  className="px-6 py-3 bg-[#1C1C2E] text-white text-sm rounded-2xl hover:bg-[#2e2e45] transition-all"
                >
                  {t.scanBtn}
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {scanState.phase === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#C4622A] border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-[#1C1C2E]">{t.loading}</p>
              <p className="text-xs text-[#9C8E80] italic">{t.loadingSub}</p>
            </div>
          )}

          {/* Error */}
          {scanState.phase === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-sm text-red-600">{scanState.message}</p>
              <button
                onClick={handleScan}
                className="px-5 py-2.5 bg-[#1C1C2E] text-white text-sm rounded-2xl"
              >
                {lang === 'fr' ? 'Réessayer' : 'Retry'}
              </button>
            </div>
          )}

          {/* Preview */}
          {scanState.phase === 'preview' && (
            <div className="space-y-5">

              {/* Possible duplicates */}
              {scanState.result.possibleDuplicates.length > 0 && (
                <div className="bg-[#FDF6ED] border border-[#C4622A]/20 rounded-2xl p-4">
                  <p className="text-xs font-medium text-[#C4622A] uppercase tracking-wider mb-3">
                    {t.duplicates} ({scanState.result.possibleDuplicates.length})
                  </p>
                  <div className="space-y-3">
                    {scanState.result.possibleDuplicates.map((dup) => {
                      const resolution = scanState.resolutions.get(dup.proposedName)
                      const mergedName = scanState.mergeNames.get(dup.proposedName)
                      return (
                        <div key={dup.proposedName} className="bg-white rounded-xl p-3 border border-[#EDE4D8]">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-sm font-medium text-[#1C1C2E]">"{dup.proposedName}"</span>
                            <span className="text-[10px] text-[#9C8E80]">↔</span>
                            <span className="text-sm font-medium text-[#1C1C2E]">"{dup.existingName}"</span>
                            {resolution === 'merge' && mergedName && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                → {mergedName}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#7A4F32] italic mb-2">{dup.reason}</p>
                          {!resolution ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setMergeNameInput(dup.existingName)
                                  dispatch({ type: 'OPEN_MERGE_MODAL', dup })
                                }}
                                className="text-[11px] px-3 py-1.5 bg-[#1C1C2E] text-white rounded-lg hover:bg-[#2e2e45] transition-all"
                              >
                                {t.merge}
                              </button>
                              <button
                                onClick={() => dispatch({ type: 'RESOLVE_DUPLICATE', proposedName: dup.proposedName, resolution: 'keep' })}
                                className="text-[11px] px-3 py-1.5 border border-[#EDE4D8] text-[#7A4F32] rounded-lg hover:bg-[#F5EFE0] transition-all"
                              >
                                {t.keep}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full ${resolution === 'merge' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F5EFE0] text-[#7A4F32]'}`}>
                                {resolution === 'merge'
                                  ? (lang === 'fr' ? 'Fusion planifiée' : 'Merge planned')
                                  : (lang === 'fr' ? 'Séparé' : 'Kept separate')}
                              </span>
                              <button
                                onClick={() => dispatch({ type: 'RESET_DUPLICATE', proposedName: dup.proposedName })}
                                className="text-[10px] text-[#9C8E80] underline"
                              >
                                {lang === 'fr' ? 'Modifier' : 'Change'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Proposed new items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#7A4F32] uppercase tracking-wider">
                    {t.proposed} ({scanState.result.proposed.length})
                  </p>
                  {scanState.result.proposed.length > 0 && (
                    <div className="flex gap-2">
                      <button onClick={() => dispatch({ type: 'SELECT_ALL' })} className="text-[10px] text-[#C4622A] hover:underline">{t.selectAll}</button>
                      <span className="text-[10px] text-[#C0B5A8]">·</span>
                      <button onClick={() => dispatch({ type: 'DESELECT_ALL' })} className="text-[10px] text-[#9C8E80] hover:underline">{t.deselectAll}</button>
                    </div>
                  )}
                </div>

                {scanState.result.proposed.length === 0 ? (
                  <p className="text-sm text-[#9C8E80] italic text-center py-4">{t.empty}</p>
                ) : (
                  <div className="space-y-2">
                    {scanState.result.proposed.map((item, i) => {
                      const isSelected = scanState.selected.has(i)
                      const isChar = isCharacters
                      const char = item as CharacterProposal
                      const evt = item as TimelineProposal
                      return (
                        <button
                          key={i}
                          onClick={() => dispatch({ type: 'TOGGLE_SELECT', index: i })}
                          className={`w-full text-left rounded-2xl border px-4 py-3 transition-all ${
                            isSelected
                              ? 'border-[#1C1C2E] bg-white'
                              : 'border-[#EDE4D8] bg-white/50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                              isSelected ? 'bg-[#1C1C2E] border-[#1C1C2E]' : 'border-[#C0B5A8]'
                            }`}>
                              {isSelected && <span className="text-white text-[9px]">✓</span>}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-[#1C1C2E]">
                                  {isChar ? char.name : evt.title}
                                </span>
                                {isChar && char.relation && (
                                  <span className="text-[10px] text-[#C4622A] bg-[#C4622A]/10 px-2 py-0.5 rounded-full">{char.relation}</span>
                                )}
                                {!isChar && evt.date && (
                                  <span className="text-[10px] text-[#C4622A] uppercase tracking-wide">{evt.date}</span>
                                )}
                                {item.confidence === 'low' && (
                                  <span className="text-[9px] text-[#9C8E80] italic">{t.confidence_low}</span>
                                )}
                              </div>

                              {isChar && char.period && (
                                <p className="text-[11px] text-[#9C8E80] italic mt-0.5">{char.period}</p>
                              )}
                              {!isChar && evt.description && (
                                <p className="text-[11px] text-[#7A4F32] mt-0.5 line-clamp-2">{evt.description}</p>
                              )}

                              {/* Gutenberg: character description */}
                              {isChar && isGutenberg && char.description && (
                                <div className="mt-2 pt-2 border-t border-[#EDE4D8]">
                                  <p className="text-[10px] text-[#C4622A] uppercase tracking-wider mb-1">{t.description}</p>
                                  <p className="text-[11px] text-[#7A4F32] italic leading-relaxed">{char.description}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Applying */}
          {scanState.phase === 'applying' && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#C4622A] border-t-transparent animate-spin" />
              <p className="text-sm text-[#1C1C2E]">{lang === 'fr' ? 'Application…' : 'Applying…'}</p>
            </div>
          )}

          {/* Done */}
          {scanState.phase === 'done' && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="text-emerald-600 text-xl">✓</span>
              </div>
              <p className="text-sm font-medium text-[#1C1C2E]">
                {scanState.added} {t.done}
              </p>
              <button onClick={onClose} className="px-5 py-2.5 bg-[#1C1C2E] text-white text-sm rounded-2xl hover:bg-[#2e2e45] transition-all">
                {t.close}
              </button>
            </div>
          )}

        </div>

        {/* Footer — Apply button */}
        {scanState.phase === 'preview' && (
          <div className="px-6 py-4 border-t border-[#EDE4D8]">
            {(() => {
              const mergeCount = [...scanState.resolutions.values()].filter((r) => r === 'merge').length
              const addCount = scanState.selected.size
              const total = addCount + mergeCount
              return (
                <button
                  onClick={handleApply}
                  disabled={total === 0}
                  className="w-full py-3 bg-[#1C1C2E] text-white text-sm rounded-2xl disabled:opacity-40 hover:bg-[#2e2e45] transition-all"
                >
                  {total === 0
                    ? (lang === 'fr' ? 'Sélectionnez au moins un élément' : 'Select at least one item')
                    : `${t.apply} (${total})`}
                </button>
              )
            })()}
          </div>
        )}

      </div>
    </div>
  )
}
