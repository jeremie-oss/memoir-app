import { create } from 'zustand'

export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
}

interface OnboardingState {
  messages: Message[]
  isLoading: boolean
  isComplete: boolean
  projectData: Record<string, string> | null
  addMessage: (msg: Omit<Message, 'id'>) => void
  appendToLast: (text: string) => void
  setLoading: (v: boolean) => void
  setComplete: (data: Record<string, string>) => void
}

export const useOnboarding = create<OnboardingState>((set) => ({
  messages: [],
  isLoading: false,
  isComplete: false,
  projectData: null,

  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: crypto.randomUUID() }],
    })),

  appendToLast: (text) =>
    set((s) => {
      const msgs = [...s.messages]
      if (msgs.length === 0) return s
      msgs[msgs.length - 1] = {
        ...msgs[msgs.length - 1],
        content: msgs[msgs.length - 1].content + text,
      }
      return { messages: msgs }
    }),

  setLoading: (v) => set({ isLoading: v }),

  setComplete: (data) => set({ isComplete: true, projectData: data }),
}))
