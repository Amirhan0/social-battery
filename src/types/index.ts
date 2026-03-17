export type EventType = 'charge' | 'drain'

export type EventCategory =
  | 'social'
  | 'work'
  | 'rest'
  | 'exercise'
  | 'creative'
  | 'other'

export interface EnergyEvent {
  id: string
  title: string
  category: EventCategory
  type: EventType
  impact: number
  timestamp: number
  energyAfter: number
  note?: string
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  social: 'Общение',
  work: 'Работа',
  rest: 'Отдых',
  exercise: 'Активность',
  creative: 'Творчество',
  other: 'Другое',
}

export const CATEGORY_ICONS: Record<EventCategory, string> = {
  social: '👥',
  work: '💼',
  rest: '😴',
  exercise: '🏃',
  creative: '🎨',
  other: '✨',
}
