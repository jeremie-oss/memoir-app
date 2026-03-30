'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMemoirStore } from '@/stores/memoir'

// Notification messages by language and context
const MESSAGES = {
  fr: {
    titles: ['Memoir'],
    bodies: [
      (name: string) => `${name}, votre plume vous attend.`,
      (name: string) => `Un souvenir vous attend, ${name}.`,
      (_: string) => `Chaque mot est un souvenir sauvé.`,
      (name: string) => `${name}, votre histoire continue ce soir.`,
    ],
    nudge: (days: number, name: string) =>
      days === 1
        ? `${name}, hier vous n'avez pas écrit — aujourd'hui peut tout changer.`
        : `${name}, ${days} jours sans écrire. Votre histoire vous attend.`,
  },
  en: {
    titles: ['Memoir'],
    bodies: [
      (name: string) => `${name}, your pen is waiting.`,
      (_: string) => `Every word is a memory saved.`,
      (name: string) => `${name}, your story continues tonight.`,
    ],
    nudge: (days: number, name: string) =>
      `${name}, ${days} day${days > 1 ? 's' : ''} without writing. Your story is waiting.`,
  },
  es: {
    titles: ['Memoir'],
    bodies: [
      (name: string) => `${name}, tu pluma te espera.`,
      (_: string) => `Cada palabra es un recuerdo salvado.`,
    ],
    nudge: (days: number, name: string) =>
      `${name}, ${days} día${days > 1 ? 's' : ''} sin escribir. Tu historia te espera.`,
  },
}

function getDaysSinceLastWrite(lastWrittenDate: string | null): number {
  if (!lastWrittenDate) return 999
  const last = new Date(lastWrittenDate)
  const now = new Date()
  return Math.floor((now.getTime() - last.getTime()) / 86_400_000)
}

function getAdaptiveDelay(
  preferredHour: number,
  frequence: string,
  daysSince: number,
  nudgeEnabled: boolean
): number {
  const now = new Date()
  const target = new Date()
  target.setHours(preferredHour, 0, 0, 0)

  // Adaptive nudge: if overdue, fire sooner
  if (nudgeEnabled) {
    const cadenceDays = frequence === 'quotidien' ? 1 : frequence === 'hebdo' ? 7 : 3
    if (daysSince > cadenceDays) {
      // Already overdue → notify in 30 min if past preferred hour, else at preferred hour
      if (target <= now) {
        return 30 * 60 * 1000 // 30 minutes
      }
    }
  }

  // Normal schedule: next occurrence of preferredHour
  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }
  return target.getTime() - now.getTime()
}

export function useNotifications() {
  const store = useMemoirStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSupported = typeof window !== 'undefined' && 'Notification' in window

  async function requestPermission(): Promise<boolean> {
    if (!isSupported) return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async function registerSW(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      return reg
    } catch {
      return null
    }
  }

  async function showNotification(isNudge = false) {
    const { userName, lang, notifications, profile, lastWrittenDate } = store
    const msgs = MESSAGES[(lang === 'tr' ? 'en' : lang) as 'fr' | 'en' | 'es'] ?? MESSAGES.fr
    const daysSince = getDaysSinceLastWrite(lastWrittenDate)

    const body = isNudge && notifications.nudgeEnabled && daysSince > 0
      ? msgs.nudge(daysSince, userName || 'Vous')
      : msgs.bodies[Math.floor(Math.random() * msgs.bodies.length)](userName || 'Vous')

    const reg = await registerSW()
    if (reg && Notification.permission === 'granted') {
      await reg.showNotification('Memoir', {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { url: '/home' },
        tag: 'memoir-reminder',
        
      })
    } else if (Notification.permission === 'granted') {
      new Notification('Memoir', { body, icon: '/favicon.ico' })
    }
  }

  const scheduleNext = useCallback(() => {
    const { notifications, profile, lastWrittenDate } = store
    if (!notifications.enabled || Notification.permission !== 'granted') return

    const daysSince = getDaysSinceLastWrite(lastWrittenDate)
    const delay = getAdaptiveDelay(
      notifications.hour,
      profile.frequence || 'libre',
      daysSince,
      notifications.nudgeEnabled
    )

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      await showNotification(daysSince > 0)
      scheduleNext() // reschedule for next day
    }, delay)
  }, [store])

  // Auto-schedule when notifications are enabled
  useEffect(() => {
    if (store.notifications.enabled) {
      scheduleNext()
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [store.notifications.enabled, store.notifications.hour, scheduleNext])

  async function enable(hour?: number): Promise<boolean> {
    const granted = await requestPermission()
    if (!granted) return false
    await registerSW()
    store.setNotifications({ enabled: true, hour: hour ?? store.notifications.hour })
    return true
  }

  function disable() {
    store.setNotifications({ enabled: false })
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  return {
    isSupported,
    enabled: store.notifications.enabled,
    permission: isSupported ? Notification.permission : 'denied',
    enable,
    disable,
    scheduleNext,
  }
}
