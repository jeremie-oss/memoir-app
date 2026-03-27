// Memoir — Configuration des modèles par agent
// Chaque agent utilise le modèle configuré via variable d'environnement.
// Swap de modèle sans toucher aux prompts.

export type AgentId =
  | 'interrogateur'
  | 'ecrivain'
  | 'relecteur'
  | 'archiviste'
  | 'architecte'
  | 'historien'

// Modèles par défaut (overridables via env vars)
// Niveaux : haiku = rapide/léger, sonnet = équilibré, opus/gemini = analytique
export const AGENT_MODELS: Record<AgentId, string> = {
  interrogateur: process.env.MODEL_INTERROGATEUR || 'anthropic/claude-haiku-4-5',
  ecrivain:      process.env.MODEL_ECRIVAIN       || 'anthropic/claude-sonnet-4-5',
  relecteur:     process.env.MODEL_RELECTEUR      || 'anthropic/claude-sonnet-4-5',
  archiviste:    process.env.MODEL_ARCHIVISTE      || 'anthropic/claude-haiku-4-5',
  architecte:    process.env.MODEL_ARCHITECTE     || 'anthropic/claude-sonnet-4-5',
  historien:     process.env.MODEL_HISTORIEN       || 'google/gemini-2.0-flash-001',
}

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export function getAgentModel(agent: AgentId): string {
  return AGENT_MODELS[agent]
}
