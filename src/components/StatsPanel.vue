<script setup lang="ts">
import { computed } from 'vue'
import { Zap, BatteryLow, BarChart2, CalendarDays, TrendingUp, TrendingDown, Users, Briefcase, Moon, Activity, Palette, Sparkles } from 'lucide-vue-next'
import { useEnergyStore } from '../stores/energy'
import { CATEGORY_LABELS } from '../types'
import type { EventCategory } from '../types'

const store = useEnergyStore()

const CATEGORY_ICONS: Record<EventCategory, unknown> = {
  social: Users, work: Briefcase, rest: Moon, exercise: Activity, creative: Palette, other: Sparkles,
}

const totalCharged = computed(() => store.chargeEvents.reduce((s, e) => s + e.impact, 0))
const totalDrained = computed(() => store.drainEvents.reduce((s, e) => s + e.impact, 0))
const avgLevel     = computed(() => {
  if (!store.events.length) return 0
  return Math.round(store.events.reduce((s, e) => s + e.energyAfter, 0) / store.events.length)
})

const todayCharge = computed(() => store.todayEvents.filter(e => e.type === 'charge').reduce((s, e) => s + e.impact, 0))
const todayDrain  = computed(() => store.todayEvents.filter(e => e.type === 'drain').reduce((s, e) => s + e.impact, 0))
const todayNet    = computed(() => todayCharge.value - todayDrain.value)

const categoryStats = computed(() => {
  const map = new Map<EventCategory, { charge: number; drain: number; count: number }>()
  store.events.forEach(e => {
    const entry = map.get(e.category) ?? { charge: 0, drain: 0, count: 0 }
    if (e.type === 'charge') entry.charge += e.impact
    else entry.drain += e.impact
    entry.count++
    map.set(e.category, entry)
  })
  return [...map.entries()]
    .map(([cat, s]) => ({ cat, ...s, net: s.charge - s.drain }))
    .sort((a, b) => b.count - a.count)
})
</script>

<template>
  <div class="stats">
    <!-- Summary -->
    <div class="summary-grid">
      <div class="stat-card">
        <div class="sc-icon green"><Zap :size="18" /></div>
        <div class="sc-val text-green">+{{ totalCharged }}%</div>
        <div class="sc-label">Заряжено всего</div>
      </div>
      <div class="stat-card">
        <div class="sc-icon red"><BatteryLow :size="18" /></div>
        <div class="sc-val text-red">-{{ totalDrained }}%</div>
        <div class="sc-label">Потрачено всего</div>
      </div>
      <div class="stat-card">
        <div class="sc-icon purple"><BarChart2 :size="18" /></div>
        <div class="sc-val">{{ avgLevel }}%</div>
        <div class="sc-label">Средний уровень</div>
      </div>
      <div class="stat-card">
        <div class="sc-icon blue"><CalendarDays :size="18" /></div>
        <div class="sc-val">{{ store.todayEvents.length }}</div>
        <div class="sc-label">Событий сегодня</div>
      </div>
    </div>

    <!-- Today balance -->
    <div v-if="store.todayEvents.length > 0" class="today-card">
      <div class="today-header">
        <span class="section-title">Баланс сегодня</span>
        <div class="today-net" :class="todayNet >= 0 ? 'text-green' : 'text-red'">
          <component :is="todayNet >= 0 ? TrendingUp : TrendingDown" :size="14" />
          {{ todayNet >= 0 ? '+' : '' }}{{ todayNet }}%
        </div>
      </div>
      <div class="bar-track">
        <div
          class="bar-seg drain-seg"
          :style="{ flex: todayDrain || 1 }"
        />
        <div
          class="bar-seg charge-seg"
          :style="{ flex: todayCharge || 1 }"
        />
      </div>
      <div class="bar-legend">
        <span class="bl-item red"><BatteryLow :size="12" /> {{ todayDrain }}% расход</span>
        <span class="bl-item green"><Zap :size="12" /> {{ todayCharge }}% заряд</span>
      </div>
    </div>

    <!-- Top charge -->
    <div v-if="store.topChargeSources.length > 0" class="list-section">
      <h3 class="section-title">
        <Zap :size="14" class="text-green" /> Лучшие источники заряда
      </h3>
      <div class="source-list">
        <div v-for="(src, i) in store.topChargeSources" :key="src.title" class="source-row">
          <span class="rank">{{ i + 1 }}</span>
          <span class="src-title">{{ src.title }}</span>
          <div class="src-bar-wrap"><div class="src-bar charge-bar" :style="{ width: `${(src.avg/40)*100}%` }" /></div>
          <span class="src-avg text-green">+{{ Math.round(src.avg) }}%</span>
        </div>
      </div>
    </div>

    <!-- Top drain -->
    <div v-if="store.topDrainSources.length > 0" class="list-section">
      <h3 class="section-title">
        <BatteryLow :size="14" class="text-red" /> Главные потребители
      </h3>
      <div class="source-list">
        <div v-for="(src, i) in store.topDrainSources" :key="src.title" class="source-row">
          <span class="rank">{{ i + 1 }}</span>
          <span class="src-title">{{ src.title }}</span>
          <div class="src-bar-wrap"><div class="src-bar drain-bar" :style="{ width: `${(src.avg/40)*100}%` }" /></div>
          <span class="src-avg text-red">-{{ Math.round(src.avg) }}%</span>
        </div>
      </div>
    </div>

    <!-- By category -->
    <div v-if="categoryStats.length > 0" class="list-section">
      <h3 class="section-title"><BarChart2 :size="14" /> По категориям</h3>
      <div class="cat-list">
        <div v-for="item in categoryStats" :key="item.cat" class="cat-row">
          <div class="cat-icon-wrap">
            <component :is="CATEGORY_ICONS[item.cat]" :size="16" />
          </div>
          <div class="cat-info">
            <span class="cat-name">{{ CATEGORY_LABELS[item.cat] }}</span>
            <span class="cat-cnt">{{ item.count }} событий</span>
          </div>
          <span class="cat-net" :class="item.net >= 0 ? 'text-green' : 'text-red'">
            {{ item.net >= 0 ? '+' : '' }}{{ item.net }}%
          </span>
        </div>
      </div>
    </div>

    <div v-if="store.events.length === 0" class="empty-stats">
      <div class="empty-icon"><BarChart2 :size="28" /></div>
      <p>Статистика появится после добавления событий</p>
    </div>
  </div>
</template>

<style scoped>
.stats { display: flex; flex-direction: column; gap: 20px; }

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (min-width: 640px) {
  .summary-grid { grid-template-columns: repeat(4, 1fr); }
}

.stat-card {
  background: #1a1733;
  border: 1px solid #1e1b4b;
  border-radius: 16px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sc-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sc-icon.green  { background: rgba(16,185,129,.12); color: #10b981; }
.sc-icon.red    { background: rgba(239,68,68,.12);  color: #ef4444; }
.sc-icon.purple { background: rgba(124,58,237,.12); color: #a78bfa; }
.sc-icon.blue   { background: rgba(59,130,246,.12); color: #60a5fa; }

.sc-val   { font-size: 1.4rem; font-weight: 800; color: #e2e8f0; }
.sc-label { font-size: 0.72rem; color: #475569; }

.today-card {
  background: #1a1733;
  border: 1px solid #1e1b4b;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.today-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.today-net {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  font-weight: 700;
}

.bar-track {
  height: 8px;
  background: #11112a;
  border-radius: 4px;
  display: flex;
  overflow: hidden;
  gap: 2px;
}

.bar-seg { height: 100%; border-radius: 4px; transition: flex 0.5s ease; }
.drain-seg  { background: #ef4444; }
.charge-seg { background: #10b981; }

.bar-legend {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.bl-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #64748b;
}
.bl-item.red   { color: #ef4444; }
.bl-item.green { color: #10b981; }

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.list-section { display: flex; flex-direction: column; gap: 10px; }

.source-list { display: flex; flex-direction: column; gap: 7px; }

.source-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rank {
  font-size: 0.72rem;
  font-weight: 700;
  color: #374155;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.src-title {
  font-size: 0.85rem;
  color: #cbd5e1;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.src-bar-wrap {
  width: 80px;
  height: 5px;
  background: #1e1b4b;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.src-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.charge-bar { background: #10b981; }
.drain-bar  { background: #ef4444; }

.src-avg { font-size: 0.82rem; font-weight: 700; width: 40px; text-align: right; flex-shrink: 0; }

.cat-list { display: flex; flex-direction: column; gap: 7px; }

.cat-row {
  background: #1a1733;
  border: 1px solid #1e1b4b;
  border-radius: 12px;
  padding: 11px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-icon-wrap {
  width: 32px;
  height: 32px;
  background: #11112a;
  border: 1px solid #2d2a5c;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  flex-shrink: 0;
}

.cat-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.cat-name { font-size: 0.88rem; font-weight: 600; color: #e2e8f0; }
.cat-cnt  { font-size: 0.72rem; color: #475569; }
.cat-net  { font-size: 0.9rem; font-weight: 700; flex-shrink: 0; }

.empty-stats {
  text-align: center;
  padding: 48px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  width: 56px;
  height: 56px;
  background: #1a1733;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4338ca;
}

.empty-stats p { font-size: 0.88rem; color: #64748b; max-width: 240px; margin: 0; }

.text-green { color: #10b981; }
.text-red   { color: #ef4444; }
</style>
