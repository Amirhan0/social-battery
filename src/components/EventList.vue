<script setup lang="ts">
import { computed } from 'vue'
import { Users, Briefcase, Moon, Activity, Palette, Sparkles, Trash2, Zap, BatteryLow } from 'lucide-vue-next'
import { useEnergyStore } from '../stores/energy'
import { CATEGORY_LABELS } from '../types'
import type { EnergyEvent, EventCategory } from '../types'

const store = useEnergyStore()

const CATEGORY_ICONS: Record<EventCategory, unknown> = {
  social:   Users,
  work:     Briefcase,
  rest:     Moon,
  exercise: Activity,
  creative: Palette,
  other:    Sparkles,
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString())     return 'Сегодня'
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'long' })
}

interface Group { dateLabel: string; events: EnergyEvent[] }

const grouped = computed((): Group[] => {
  const map = new Map<string, EnergyEvent[]>()
  for (const e of store.sortedEvents) {
    const label = formatDate(e.timestamp)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(e)
  }
  return [...map.entries()].map(([dateLabel, events]) => ({ dateLabel, events }))
})
</script>

<template>
  <div class="event-list">
    <div v-if="store.sortedEvents.length === 0" class="empty">
      <div class="empty-icon-wrap">
        <Sparkles :size="28" />
      </div>
      <p>Событий пока нет</p>
      <span>Добавьте первое событие, чтобы начать</span>
    </div>

    <div v-for="group in grouped" :key="group.dateLabel" class="group">
      <div class="date-sep">{{ group.dateLabel }}</div>

      <div
        v-for="event in group.events"
        :key="event.id"
        class="event-card"
        :class="event.type"
      >
        <div class="event-cat-icon">
          <component :is="CATEGORY_ICONS[event.category]" :size="16" />
        </div>

        <div class="event-body">
          <div class="event-row">
            <span class="event-title">{{ event.title }}</span>
            <span class="event-impact" :class="event.type === 'charge' ? 'text-green' : 'text-red'">
              <component :is="event.type === 'charge' ? Zap : BatteryLow" :size="12" style="vertical-align:middle" />
              {{ event.type === 'charge' ? '+' : '−' }}{{ event.impact }}%
            </span>
          </div>
          <div class="event-meta">
            <span>{{ CATEGORY_LABELS[event.category] }}</span>
            <span class="dot">·</span>
            <span>{{ formatTime(event.timestamp) }}</span>
            <span class="dot">·</span>
            <span>После: {{ event.energyAfter }}%</span>
          </div>
          <p v-if="event.note" class="event-note">{{ event.note }}</p>
        </div>

        <button class="del-btn" @click="store.removeEvent(event.id)" title="Удалить">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-list { display: flex; flex-direction: column; gap: 22px; }

.empty {
  text-align: center;
  padding: 52px 20px;
  color: #475569;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  background: #1a1733;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4338ca;
  margin-bottom: 8px;
}

.empty p {
  font-size: 1rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}

.empty span { font-size: 0.85rem; }

.group { display: flex; flex-direction: column; gap: 8px; }

.date-sep {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0 4px;
}

.event-card {
  background: #1a1733;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  border-left: 3px solid transparent;
  transition: transform 0.15s;
}

.event-card.charge { border-left-color: #10b981; }
.event-card.drain  { border-left-color: #ef4444; }
.event-card:hover  { transform: translateX(2px); }

.event-cat-icon {
  width: 34px;
  height: 34px;
  background: #11112a;
  border: 1px solid #2d2a5c;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  flex-shrink: 0;
}

.event-body { flex: 1; min-width: 0; }

.event-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.event-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-impact {
  font-size: 0.82rem;
  font-weight: 700;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 3px;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 0.74rem;
  color: #475569;
  flex-wrap: wrap;
}

.dot { color: #2d2a5c; }

.event-note {
  font-size: 0.78rem;
  color: #64748b;
  font-style: italic;
  margin: 5px 0 0;
}

.del-btn {
  background: none;
  border: none;
  color: #2d2a5c;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.del-btn:hover { background: rgba(239,68,68,.12); color: #ef4444; }

.text-green { color: #10b981; }
.text-red   { color: #ef4444; }
</style>
