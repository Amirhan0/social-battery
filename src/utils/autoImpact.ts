import type { EventCategory, EventType, EnergyEvent } from '../types'

/**
 * Base impact values per category.
 * These are research-inspired defaults: rest/creative charge more,
 * work/social contexts have asymmetric drain vs charge.
 */
const BASE_IMPACT: Record<EventCategory, Record<EventType, number>> = {
  social:   { drain: 14, charge: 16 },
  work:     { drain: 18, charge:  8 },
  rest:     { drain:  5, charge: 22 },
  exercise: { drain: 10, charge: 18 },
  creative: { drain:  8, charge: 20 },
  other:    { drain: 10, charge: 12 },
}

/**
 * Time-of-day modifier.
 * Late night events hit harder; morning is the "reset window".
 */
function timeModifier(type: EventType): number {
  const hour = new Date().getHours()
  if (hour >= 22 || hour < 5)  return type === 'drain' ? 1.30 : 0.85 // night
  if (hour >= 5  && hour < 9)  return type === 'drain' ? 0.85 : 1.15 // morning fresh
  if (hour >= 9  && hour < 13) return 1.00                            // peak hours
  if (hour >= 13 && hour < 17) return type === 'drain' ? 1.05 : 1.00 // post-lunch dip
  if (hour >= 17 && hour < 22) return type === 'drain' ? 1.12 : 0.95 // evening fatigue
  return 1.00
}

/**
 * Current energy level modifier.
 * Low battery = everything hits harder; high battery = more resilient.
 */
function levelModifier(currentLevel: number, type: EventType): number {
  if (type === 'drain') {
    if (currentLevel < 20) return 1.35
    if (currentLevel < 40) return 1.18
    if (currentLevel < 60) return 1.05
    return 1.00
  } else {
    // Charging: diminishing returns when already full
    if (currentLevel > 80) return 0.70
    if (currentLevel > 60) return 0.85
    if (currentLevel < 20) return 1.20 // rest helps more when depleted
    return 1.00
  }
}

/**
 * Repetition modifier.
 * Doing the same category repeatedly in the last 2 hours leads to
 * fatigue accumulation (drain++) or habituation (charge--).
 */
function repetitionModifier(
  category: EventCategory,
  type: EventType,
  recentEvents: EnergyEvent[],
): number {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
  const recent = recentEvents.filter(
    (e) => e.timestamp > twoHoursAgo && e.category === category && e.type === type,
  ).length

  if (recent === 0) return 1.00
  if (recent === 1) return type === 'drain' ? 1.10 : 0.90
  if (recent === 2) return type === 'drain' ? 1.20 : 0.80
  return               type === 'drain' ? 1.30 : 0.70
}

export interface ImpactBreakdown {
  base: number
  final: number
  modifiers: {
    label: string
    factor: number
    description: string
  }[]
}

export function calculateAutoImpact(
  category: EventCategory,
  type: EventType,
  currentLevel: number,
  recentEvents: EnergyEvent[],
): ImpactBreakdown {
  const base = BASE_IMPACT[category][type]

  const tMod  = timeModifier(type)
  const lMod  = levelModifier(currentLevel, type)
  const rMod  = repetitionModifier(category, type, recentEvents)

  const raw   = base * tMod * lMod * rMod
  const final = Math.min(40, Math.max(1, Math.round(raw)))

  const modifiers: ImpactBreakdown['modifiers'] = []

  const hour = new Date().getHours()
  if (tMod !== 1.00) {
    const isNight = hour >= 22 || hour < 5
    const isMorning = hour >= 5 && hour < 9
    modifiers.push({
      label: isNight ? 'Ночное время' : isMorning ? 'Утренняя свежесть' : 'Вечерняя усталость',
      factor: tMod,
      description: isNight
        ? 'Поздний час усиливает эффект'
        : isMorning
          ? 'Утром энергия восстанавливается лучше'
          : 'К вечеру ресурс истощается быстрее',
    })
  }

  if (lMod !== 1.00) {
    modifiers.push({
      label: currentLevel < 40 ? 'Низкий заряд' : 'Высокий заряд',
      factor: lMod,
      description:
        currentLevel < 40
          ? 'При низкой энергии нагрузка ощущается острее'
          : 'Полный заряд — меньше отдача от отдыха',
    })
  }

  if (rMod !== 1.00) {
    modifiers.push({
      label: 'Повторение',
      factor: rMod,
      description:
        type === 'drain'
          ? 'Та же нагрузка снова — накапливается усталость'
          : 'Тот же вид отдыха — эффект ослабевает',
    })
  }

  return { base, final, modifiers }
}
