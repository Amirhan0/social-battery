<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  LayoutDashboard, History, BarChart2, Settings,
  TrendingUp, TrendingDown, Minus, Plus, Battery,
  ChevronRight,
} from 'lucide-vue-next'
import { useEnergyStore } from './stores/energy'
import BatteryDisplay from './components/BatteryDisplay.vue'
import AddEventModal from './components/AddEventModal.vue'
import EventList from './components/EventList.vue'
import EnergyChart from './components/EnergyChart.vue'
import StatsPanel from './components/StatsPanel.vue'

const store = useEnergyStore()

type Tab = 'dashboard' | 'history' | 'stats'
const activeTab = ref<Tab>('dashboard')
const showModal = ref(false)
const showLevelEditor = ref(false)
const manualLevel = ref(store.currentLevel)

const trendIcon = computed(() => {
  if (store.energyTrend === 'up') return TrendingUp
  if (store.energyTrend === 'down') return TrendingDown
  return Minus
})

const trendColor = computed(() => {
  if (store.energyTrend === 'up') return '#10b981'
  if (store.energyTrend === 'down') return '#ef4444'
  return '#64748b'
})

function applyManualLevel() {
  store.setLevel(manualLevel.value)
  showLevelEditor.value = false
}

const navItems = [
  { id: 'dashboard' as Tab, icon: LayoutDashboard, label: 'Главная' },
  { id: 'history'   as Tab, icon: History,         label: 'История' },
  { id: 'stats'     as Tab, icon: BarChart2,        label: 'Статистика' },
]

const levelColor = computed(() => {
  if (store.currentLevel >= 60) return '#10b981'
  if (store.currentLevel >= 30) return '#f59e0b'
  return '#ef4444'
})
</script>

<template>
  <div class="app">
    <!-- ════ DESKTOP SIDEBAR ════ -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <Battery :size="22" class="logo-icon-svg" />
        <span class="logo-text">Social Battery</span>
      </div>

      <!-- Battery widget in sidebar -->
      <div class="sidebar-battery">
        <BatteryDisplay :level="store.currentLevel" />
      </div>

      <!-- Quick stats -->
      <div class="sidebar-stats">
        <div class="ss-row">
          <span class="ss-label">Сегодня событий</span>
          <span class="ss-val">{{ store.todayEvents.length }}</span>
        </div>
        <div class="ss-row">
          <span class="ss-label">Заряд</span>
          <span class="ss-val text-green">+{{ store.todayEvents.filter(e => e.type === 'charge').reduce((s, e) => s + e.impact, 0) }}%</span>
        </div>
        <div class="ss-row">
          <span class="ss-label">Расход</span>
          <span class="ss-val text-red">-{{ store.todayEvents.filter(e => e.type === 'drain').reduce((s, e) => s + e.impact, 0) }}%</span>
        </div>
        <div class="ss-row">
          <span class="ss-label">Тренд</span>
          <span class="ss-val" :style="{ color: trendColor }">
            <component :is="trendIcon" :size="14" style="vertical-align:middle" />
          </span>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="sidebar-nav-btn"
          :class="{ active: activeTab === item.id }"
          @click="activeTab = item.id"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-spacer" />

      <!-- Manual level editor toggle -->
      <button class="sidebar-settings-btn" @click="showLevelEditor = !showLevelEditor">
        <Settings :size="16" />
        <span>Установить уровень</span>
      </button>

      <Transition name="slide-down">
        <div v-if="showLevelEditor" class="sidebar-level-editor">
          <div class="sle-row">
            <input
              v-model.number="manualLevel"
              type="range"
              min="0"
              max="100"
              class="level-slider"
            />
            <span class="level-preview" :style="{ color: levelColor }">{{ manualLevel }}%</span>
          </div>
          <button class="apply-btn" @click="applyManualLevel">Применить</button>
        </div>
      </Transition>

      <!-- Add event button (sidebar) -->
      <button class="sidebar-add-btn" @click="showModal = true">
        <Plus :size="18" />
        <span>Добавить событие</span>
      </button>
    </aside>

    <!-- ════ MAIN AREA ════ -->
    <div class="main-area">
      <!-- Mobile header -->
      <header class="mobile-header">
        <div class="mobile-logo">
          <Battery :size="20" class="logo-icon-svg" />
          <span class="logo-text">Social Battery</span>
        </div>
        <div class="mobile-header-right">
          <div class="trend-badge" :style="{ color: trendColor, borderColor: trendColor }">
            <component :is="trendIcon" :size="12" />
            Тренд
          </div>
          <button class="icon-btn" @click="showLevelEditor = !showLevelEditor">
            <Settings :size="18" />
          </button>
        </div>
        <Transition name="slide-down">
          <div v-if="showLevelEditor" class="mobile-level-editor">
            <label>Установить уровень вручную</label>
            <div class="sle-row">
              <input
                v-model.number="manualLevel"
                type="range"
                min="0"
                max="100"
                class="level-slider"
              />
              <span class="level-preview" :style="{ color: levelColor }">{{ manualLevel }}%</span>
              <button class="apply-btn" @click="applyManualLevel">OK</button>
            </div>
          </div>
        </Transition>
      </header>

      <!-- Content -->
      <main class="main-content">
        <!-- Dashboard -->
        <div v-if="activeTab === 'dashboard'" class="tab-content">
          <!-- Mobile battery card -->
          <div class="mobile-battery-card card">
            <div class="mbc-battery">
              <BatteryDisplay :level="store.currentLevel" compact />
            </div>
            <div class="mbc-right">
              <div class="mbc-stats">
                <div class="mbc-stat">
                  <span class="mbc-v">{{ store.todayEvents.length }}</span>
                  <span class="mbc-l">событий сегодня</span>
                </div>
                <div class="mbc-stat">
                  <span class="mbc-v text-green">+{{ store.todayEvents.filter(e => e.type === 'charge').reduce((s, e) => s + e.impact, 0) }}%</span>
                  <span class="mbc-l">заряд</span>
                </div>
                <div class="mbc-stat">
                  <span class="mbc-v text-red">-{{ store.todayEvents.filter(e => e.type === 'drain').reduce((s, e) => s + e.impact, 0) }}%</span>
                  <span class="mbc-l">расход</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Chart -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Динамика энергии</h2>
              <span class="card-hint">последние 20 событий</span>
            </div>
            <EnergyChart />
          </div>

          <!-- Recent events -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Последние события</h2>
              <button class="text-link" @click="activeTab = 'history'">
                Все <ChevronRight :size="14" style="vertical-align:middle" />
              </button>
            </div>
            <div class="recent-list">
              <div
                v-for="event in store.sortedEvents.slice(0, 4)"
                :key="event.id"
                class="recent-item"
                :class="event.type"
              >
                <span class="ri-impact" :class="event.type === 'charge' ? 'text-green' : 'text-red'">
                  {{ event.type === 'charge' ? '+' : '−' }}{{ event.impact }}%
                </span>
                <span class="ri-title">{{ event.title }}</span>
              </div>
              <div v-if="store.sortedEvents.length === 0" class="empty-hint">
                Нет событий — нажмите «Добавить событие»
              </div>
            </div>
          </div>
        </div>

        <!-- History -->
        <div v-else-if="activeTab === 'history'" class="tab-content">
          <div class="page-header">
            <h1>История</h1>
            <span class="page-count">{{ store.events.length }} событий</span>
          </div>
          <EventList />
        </div>

        <!-- Stats -->
        <div v-else-if="activeTab === 'stats'" class="tab-content">
          <div class="page-header">
            <h1>Статистика</h1>
          </div>
          <StatsPanel />
        </div>
      </main>

      <!-- Mobile bottom nav (includes Add button) -->
      <nav class="bottom-nav">
        <button
          class="bnav-btn"
          :class="{ active: activeTab === 'dashboard' }"
          @click="activeTab = 'dashboard'"
        >
          <LayoutDashboard :size="20" />
          <span>Главная</span>
        </button>

        <button
          class="bnav-btn"
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <History :size="20" />
          <span>История</span>
        </button>

        <!-- Center add button -->
        <button class="bnav-add" @click="showModal = true">
          <span class="bnav-add-inner">
            <Plus :size="22" />
          </span>
        </button>

        <button
          class="bnav-btn"
          :class="{ active: activeTab === 'stats' }"
          @click="activeTab = 'stats'"
        >
          <BarChart2 :size="20" />
          <span>Статистика</span>
        </button>

        <button
          class="bnav-btn"
          style="opacity: 0; pointer-events: none;"
          aria-hidden="true"
        >
          <Settings :size="20" />
          <span>.</span>
        </button>
      </nav>
    </div>

    <!-- Modal -->
    <Transition name="modal">
      <AddEventModal v-if="showModal" @close="showModal = false" />
    </Transition>
  </div>
</template>

<style scoped>
/* ─── Layout shell ─────────────────────────────── */
.app {
  display: flex;
  height: 100%;
  background: #0b0b14;
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

/* ─── SIDEBAR (desktop only) ───────────────────── */
.sidebar {
  display: none;
}

@media (min-width: 900px) {
  .sidebar {
    display: flex;
    flex-direction: column;
    width: 260px;
    min-width: 260px;
    background: #11112a;
    border-right: 1px solid #1e1b4b;
    padding: 24px 16px 24px;
    position: sticky;
    top: 0;
    height: 100dvh;
    overflow-y: auto;
    gap: 0;
  }
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 20px;
  border-bottom: 1px solid #1e1b4b;
  margin-bottom: 20px;
}

.logo-icon-svg {
  color: #818cf8;
}

.logo-text {
  font-size: 1rem;
  font-weight: 800;
  background: linear-gradient(135deg, #818cf8, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-battery {
  display: flex;
  justify-content: center;
  padding: 8px 0 12px;
}

.sidebar-stats {
  background: #1a1733;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.ss-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ss-label {
  font-size: 0.78rem;
  color: #64748b;
}

.ss-val {
  font-size: 0.85rem;
  font-weight: 700;
  color: #e2e8f0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.sidebar-nav-btn {
  background: none;
  border: none;
  color: #64748b;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
  text-align: left;
}

.sidebar-nav-btn:hover {
  background: #1e1b4b;
  color: #e2e8f0;
}

.sidebar-nav-btn.active {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  font-weight: 700;
}

.sidebar-spacer {
  flex: 1;
}

.sidebar-settings-btn {
  background: none;
  border: 1px solid #1e1b4b;
  color: #64748b;
  border-radius: 10px;
  padding: 9px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.15s;
  width: 100%;
}

.sidebar-settings-btn:hover {
  border-color: #4338ca;
  color: #94a3b8;
}

.sidebar-level-editor {
  background: #1a1733;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-add-btn {
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  border: none;
  color: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  margin-top: 8px;
}

.sidebar-add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(99, 102, 241, 0.45);
}

/* ─── MAIN AREA ─────────────────────────────────── */
.main-area {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* ─── MOBILE HEADER ─────────────────────────────── */
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(11, 11, 20, 0.98);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid #1e1b4b;
  padding: 0 20px;
  will-change: transform;
}

@media (min-width: 900px) {
  .mobile-header {
    display: none;
  }
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  flex: 1;
}

.mobile-header-right {
  position: absolute;
  right: 20px;
  top: 0;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.trend-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.icon-btn:hover {
  color: #94a3b8;
}

.mobile-level-editor {
  padding: 12px 0 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid #1e1b4b;
}

.mobile-level-editor label {
  font-size: 0.78rem;
  color: #64748b;
}

/* ─── MAIN CONTENT ──────────────────────────────── */
.main-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  padding: 20px 20px 100px;
}

@media (min-width: 900px) {
  .main-content {
    padding: 28px 32px 40px;
    max-width: 900px;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── CARDS ─────────────────────────────────────── */
.card {
  background: #1a1733;
  border: 1px solid #1e1b4b;
  border-radius: 20px;
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.card-hint {
  font-size: 0.72rem;
  color: #374155;
}

/* ─── MOBILE BATTERY CARD ───────────────────────── */
.mobile-battery-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

@media (min-width: 900px) {
  .mobile-battery-card {
    display: none;
  }
}

.mbc-battery {
  flex-shrink: 0;
}

.mbc-right {
  flex: 1;
  min-width: 0;
}

.mbc-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mbc-stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mbc-v {
  font-size: 1.25rem;
  font-weight: 800;
  color: #e2e8f0;
  line-height: 1.1;
}

.mbc-l {
  font-size: 0.7rem;
  color: #475569;
}

/* ─── RECENT LIST ───────────────────────────────── */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  background: #11112a;
  border-left: 3px solid transparent;
}

.recent-item.charge { border-left-color: #10b981; }
.recent-item.drain  { border-left-color: #ef4444; }

.ri-impact {
  font-size: 0.82rem;
  font-weight: 800;
  min-width: 44px;
  flex-shrink: 0;
}

.ri-title {
  font-size: 0.88rem;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-hint {
  font-size: 0.85rem;
  color: #475569;
  text-align: center;
  padding: 14px 0;
}

/* ─── PAGE HEADER ───────────────────────────────── */
.page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 4px;
}

.page-header h1 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #e2e8f0;
  margin: 0;
}

.page-count {
  font-size: 0.82rem;
  color: #475569;
}

/* ─── SHARED FORM CONTROLS ──────────────────────── */
.sle-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.level-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 5px;
  border-radius: 3px;
  background: linear-gradient(to right, #818cf8, #312e81);
  outline: none;
  cursor: pointer;
}

.level-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #818cf8;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(129, 140, 248, 0.5);
}

.level-preview {
  font-size: 0.9rem;
  font-weight: 700;
  min-width: 38px;
  text-align: center;
}

.apply-btn {
  background: #4338ca;
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.apply-btn:hover {
  background: #6366f1;
}

.text-link {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ─── BOTTOM NAV (mobile) ───────────────────────── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(11, 11, 20, 0.99);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-top: 1px solid #1e1b4b;
  display: grid;
  grid-template-columns: 1fr 1fr 64px 1fr 1fr;
  align-items: center;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  z-index: 50;
  height: calc(60px + max(8px, env(safe-area-inset-bottom)));
  transform: translateZ(0);
}

@media (min-width: 900px) {
  .bottom-nav { display: none; }
}

.bnav-btn {
  background: none;
  border: none;
  color: #475569;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 4px;
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 500;
  transition: color 0.15s;
  height: 100%;
  justify-content: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.bnav-btn.active {
  color: #818cf8;
  font-weight: 700;
}

/* Center add button */
.bnav-add {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: relative;
  top: -10px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.bnav-add-inner {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5), 0 0 0 4px #0b0b14;
  transition: all 0.2s;
}

.bnav-add:hover .bnav-add-inner,
.bnav-add:active .bnav-add-inner {
  transform: scale(1.1);
  box-shadow: 0 6px 26px rgba(99, 102, 241, 0.7), 0 0 0 4px #0b0b14;
}

/* ─── UTILITIES ─────────────────────────────────── */
.text-green { color: #10b981; }
.text-red   { color: #ef4444; }

/* ─── TRANSITIONS ───────────────────────────────── */
.modal-enter-active,
.modal-leave-active { transition: opacity 0.25s ease; }
.modal-enter-from,
.modal-leave-to     { opacity: 0; }

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-down-enter-to,
.slide-down-leave-from { max-height: 200px; }
</style>
