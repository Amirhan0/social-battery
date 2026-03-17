import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { EnergyEvent, EventCategory, EventType } from '../types'

const STORAGE_KEY = 'social-battery-data'

interface StoredData {
  currentLevel: number
  events: EnergyEvent[]
}

function loadFromStorage(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { currentLevel: 70, events: [] }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useEnergyStore = defineStore('energy', () => {
  const stored = loadFromStorage()

  const currentLevel = ref<number>(stored.currentLevel)
  const events = ref<EnergyEvent[]>(stored.events)

  watch(
    [currentLevel, events],
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentLevel: currentLevel.value, events: events.value }),
      )
    },
    { deep: true },
  )

  const sortedEvents = computed(() =>
    [...events.value].sort((a, b) => b.timestamp - a.timestamp),
  )

  const todayEvents = computed(() => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    return sortedEvents.value.filter((e) => e.timestamp >= startOfDay.getTime())
  })

  const chargeEvents = computed(() => events.value.filter((e) => e.type === 'charge'))
  const drainEvents = computed(() => events.value.filter((e) => e.type === 'drain'))

  const topChargeSources = computed(() => {
    const map = new Map<string, { total: number; count: number }>()
    chargeEvents.value.forEach((e) => {
      const entry = map.get(e.title) ?? { total: 0, count: 0 }
      map.set(e.title, { total: entry.total + e.impact, count: entry.count + 1 })
    })
    return [...map.entries()]
      .map(([title, stats]) => ({ title, ...stats, avg: stats.total / stats.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5)
  })

  const topDrainSources = computed(() => {
    const map = new Map<string, { total: number; count: number }>()
    drainEvents.value.forEach((e) => {
      const entry = map.get(e.title) ?? { total: 0, count: 0 }
      map.set(e.title, { total: entry.total + e.impact, count: entry.count + 1 })
    })
    return [...map.entries()]
      .map(([title, stats]) => ({ title, ...stats, avg: stats.total / stats.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5)
  })

  const energyTrend = computed((): 'up' | 'down' | 'stable' => {
    if (todayEvents.value.length < 2) return 'stable'
    const recent = todayEvents.value.slice(0, 3)
    const diffs = recent.map((e) => (e.type === 'charge' ? e.impact : -e.impact))
    const sum = diffs.reduce((a, b) => a + b, 0)
    if (sum > 5) return 'up'
    if (sum < -5) return 'down'
    return 'stable'
  })

  const chartData = computed(() => {
    const last20 = [...sortedEvents.value].reverse().slice(-20)
    if (last20.length === 0) return { labels: [], data: [] }
    const labels = last20.map((e) =>
      new Date(e.timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
    )
    const data = last20.map((e) => e.energyAfter)
    return { labels, data }
  })

  function addEvent(payload: {
    title: string
    category: EventCategory
    type: EventType
    impact: number
    note?: string
  }) {
    const delta = payload.type === 'charge' ? payload.impact : -payload.impact
    const newLevel = Math.min(100, Math.max(0, currentLevel.value + delta))
    currentLevel.value = newLevel

    const event: EnergyEvent = {
      id: generateId(),
      title: payload.title,
      category: payload.category,
      type: payload.type,
      impact: payload.impact,
      timestamp: Date.now(),
      energyAfter: newLevel,
      note: payload.note,
    }
    events.value.push(event)
  }

  function setLevel(level: number) {
    currentLevel.value = Math.min(100, Math.max(0, level))
  }

  function removeEvent(id: string) {
    events.value = events.value.filter((e) => e.id !== id)
  }

  function clearAll() {
    events.value = []
    currentLevel.value = 70
  }

  return {
    currentLevel,
    events,
    sortedEvents,
    todayEvents,
    chargeEvents,
    drainEvents,
    topChargeSources,
    topDrainSources,
    energyTrend,
    chartData,
    addEvent,
    setLevel,
    removeEvent,
    clearAll,
  }
})
