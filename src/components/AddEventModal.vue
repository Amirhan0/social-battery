<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  X, Users, Briefcase, Moon, Activity, Palette, Sparkles,
  Zap, BatteryLow, Info, ChevronDown, Sliders,
} from 'lucide-vue-next'
import { useEnergyStore } from '../stores/energy'
import type { EventCategory, EventType } from '../types'
import { CATEGORY_LABELS } from '../types'
import { calculateAutoImpact } from '../utils/autoImpact'

const emit = defineEmits<{ close: [] }>()
const store = useEnergyStore()

const CATEGORY_ICONS: Record<EventCategory, ReturnType<typeof defineComponent>> = {
  social:   Users,
  work:     Briefcase,
  rest:     Moon,
  exercise: Activity,
  creative: Palette,
  other:    Sparkles,
}

import { defineComponent } from 'vue'

const categories: EventCategory[] = ['social', 'work', 'rest', 'exercise', 'creative', 'other']

const form = reactive({
  title: '',
  category: 'social' as EventCategory,
  type: 'drain' as EventType,
  note: '',
})

const titleError = ref(false)
const showOverride = ref(false)
const manualImpact = ref(10)

const breakdown = computed(() =>
  calculateAutoImpact(form.category, form.type, store.currentLevel, store.events),
)

// Keep manual override in sync when auto changes (only if not overriding)
watch(breakdown, (b) => {
  if (!showOverride.value) manualImpact.value = b.final
}, { immediate: true })

const finalImpact = computed(() =>
  showOverride.value ? manualImpact.value : breakdown.value.final,
)

const formatFactor = (f: number) => {
  if (f > 1) return `+${Math.round((f - 1) * 100)}%`
  if (f < 1) return `−${Math.round((1 - f) * 100)}%`
  return '×1'
}

const quickTitles: Record<EventType, string[]> = {
  drain: ['Созвон с командой', 'Конфликт', 'Переработка', 'Шумная компания', 'Сложные переговоры'],
  charge: ['Прогулка', 'Чтение', 'Медитация', 'Встреча с другом', 'Хобби'],
}

function selectQuick(title: string) {
  form.title = title
  titleError.value = false
}

function submit() {
  if (!form.title.trim()) {
    titleError.value = true
    return
  }
  store.addEvent({
    title: form.title.trim(),
    category: form.category,
    type: form.type,
    impact: finalImpact.value,
    note: form.note.trim() || undefined,
  })
  emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <h2>Новое событие</h2>
        <button class="close-btn" @click="emit('close')"><X :size="16" /></button>
      </div>

      <!-- Type toggle -->
      <div class="type-toggle">
        <button class="type-btn drain" :class="{ active: form.type === 'drain' }" @click="form.type = 'drain'">
          <BatteryLow :size="16" />
          Разряд
        </button>
        <button class="type-btn charge" :class="{ active: form.type === 'charge' }" @click="form.type = 'charge'">
          <Zap :size="16" />
          Заряд
        </button>
      </div>

      <!-- Quick titles -->
      <div class="section">
        <p class="section-label">Быстрый выбор</p>
        <div class="quick-tags">
          <button
            v-for="t in quickTitles[form.type]"
            :key="t"
            class="quick-tag"
            :class="{ selected: form.title === t }"
            @click="selectQuick(t)"
          >{{ t }}</button>
        </div>
      </div>

      <!-- Title -->
      <div class="field">
        <label>Название</label>
        <input
          v-model="form.title"
          type="text"
          placeholder="Что произошло?"
          :class="{ error: titleError }"
          @input="titleError = false"
          maxlength="60"
        />
        <span v-if="titleError" class="error-msg">Введите название события</span>
      </div>

      <!-- Category -->
      <div class="field">
        <label>Категория</label>
        <div class="category-grid">
          <button
            v-for="cat in categories"
            :key="cat"
            class="cat-btn"
            :class="{ active: form.category === cat }"
            @click="form.category = cat"
          >
            <component :is="CATEGORY_ICONS[cat]" :size="18" />
            <span>{{ CATEGORY_LABELS[cat] }}</span>
          </button>
        </div>
      </div>

      <!-- Auto-calculated impact block -->
      <div class="impact-block">
        <div class="impact-header">
          <div class="impact-label">
            <Info :size="14" class="info-icon" />
            Автоматический расчёт влияния
          </div>
          <div class="impact-value" :class="form.type === 'charge' ? 'text-green' : 'text-red'">
            {{ form.type === 'charge' ? '+' : '−' }}{{ finalImpact }}%
          </div>
        </div>

        <!-- Base + modifiers breakdown -->
        <div class="breakdown">
          <div class="breakdown-row base">
            <span>Базовое значение ({{ CATEGORY_LABELS[form.category] }})</span>
            <span>{{ breakdown.base }}%</span>
          </div>
          <div
            v-for="mod in breakdown.modifiers"
            :key="mod.label"
            class="breakdown-row modifier"
          >
            <div class="mod-info">
              <span class="mod-label">{{ mod.label }}</span>
              <span class="mod-desc">{{ mod.description }}</span>
            </div>
            <span
              class="mod-factor"
              :class="mod.factor > 1 ? (form.type === 'drain' ? 'text-red' : 'text-green') : (form.type === 'drain' ? 'text-green' : 'text-red')"
            >{{ formatFactor(mod.factor) }}</span>
          </div>
          <div v-if="breakdown.modifiers.length === 0" class="breakdown-row base">
            <span class="mod-desc">Нет дополнительных факторов</span>
          </div>
        </div>

        <!-- Override toggle -->
        <button class="override-toggle" @click="showOverride = !showOverride">
          <Sliders :size="13" />
          {{ showOverride ? 'Скрыть' : 'Задать вручную' }}
          <ChevronDown :size="13" :style="{ transform: showOverride ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }" />
        </button>

        <Transition name="slide-down">
          <div v-if="showOverride" class="override-row">
            <input
              v-model.number="manualImpact"
              type="range"
              min="1"
              max="40"
              :class="['slider', form.type === 'charge' ? 'slider-charge' : 'slider-drain']"
            />
            <span class="override-val" :class="form.type === 'charge' ? 'text-green' : 'text-red'">
              {{ form.type === 'charge' ? '+' : '−' }}{{ manualImpact }}%
            </span>
          </div>
        </Transition>
      </div>

      <!-- Note -->
      <div class="field">
        <label>Заметка <span class="optional">(необязательно)</span></label>
        <textarea
          v-model="form.note"
          placeholder="Как себя чувствовал(а)?"
          rows="2"
          maxlength="200"
        />
      </div>

      <button
        class="submit-btn"
        :class="form.type === 'charge' ? 'submit-charge' : 'submit-drain'"
        @click="submit"
      >
        Сохранить
      </button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

@media (min-width: 640px) {
  .modal-overlay { align-items: center; }
}

.modal {
  background: #14122b;
  border: 1px solid #2d2a5c;
  border-radius: 24px 24px 0 0;
  padding: 24px 20px 32px;
  width: 100%;
  max-width: 540px;
  max-height: 92dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

@media (min-width: 640px) {
  .modal {
    border-radius: 24px;
    max-height: 88dvh;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #e2e8f0;
  margin: 0;
}

.close-btn {
  width: 30px;
  height: 30px;
  background: #1e1b4b;
  border: none;
  border-radius: 50%;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.close-btn:hover { background: #312e81; color: #e2e8f0; }

.type-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.type-btn {
  background: #1e1b4b;
  border: 2px solid transparent;
  color: #64748b;
  padding: 11px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: all 0.15s;
}

.type-btn.drain.active  { background: rgba(239,68,68,.12); border-color: #ef4444; color: #ef4444; }
.type-btn.charge.active { background: rgba(16,185,129,.12); border-color: #10b981; color: #10b981; }

.section { display: flex; flex-direction: column; gap: 9px; }

.section-label {
  font-size: 0.72rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}

.quick-tags { display: flex; flex-wrap: wrap; gap: 7px; }

.quick-tag {
  background: #1e1b4b;
  border: 1px solid #2d2a5c;
  color: #94a3b8;
  padding: 5px 11px;
  border-radius: 20px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}

.quick-tag:hover, .quick-tag.selected {
  background: #312e81;
  border-color: #6366f1;
  color: #c7d2fe;
}

.field { display: flex; flex-direction: column; gap: 7px; }

.field label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.field input, .field textarea {
  background: #1e1b4b;
  border: 1px solid #2d2a5c;
  color: #e2e8f0;
  border-radius: 12px;
  padding: 11px 13px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
  resize: none;
}

.field input:focus, .field textarea:focus { border-color: #6366f1; }
.field input.error { border-color: #ef4444; }

.error-msg { color: #ef4444; font-size: 0.77rem; }
.optional  { color: #374155; font-weight: 400; }

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
}

.cat-btn {
  background: #1e1b4b;
  border: 1px solid #2d2a5c;
  color: #64748b;
  border-radius: 12px;
  padding: 10px 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 0.77rem;
  font-weight: 500;
  transition: all 0.15s;
}

.cat-btn.active {
  background: rgba(99,102,241,.15);
  border-color: #6366f1;
  color: #a5b4fc;
}

/* ─── IMPACT BLOCK ─── */
.impact-block {
  background: #11112a;
  border: 1px solid #2d2a5c;
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.impact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.impact-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 500;
}

.info-icon { color: #475569; }

.impact-value {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breakdown-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.breakdown-row.base {
  font-size: 0.8rem;
  color: #64748b;
}

.breakdown-row.modifier {
  padding: 7px 10px;
  background: #1a1733;
  border-radius: 9px;
}

.mod-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mod-label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 600;
}

.mod-desc {
  font-size: 0.72rem;
  color: #475569;
}

.mod-factor {
  font-size: 0.82rem;
  font-weight: 700;
  flex-shrink: 0;
}

.override-toggle {
  background: none;
  border: 1px dashed #2d2a5c;
  color: #475569;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.77rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  align-self: flex-start;
}

.override-toggle:hover { border-color: #6366f1; color: #818cf8; }

.override-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 4px;
}

.override-val {
  font-size: 1rem;
  font-weight: 800;
  min-width: 44px;
  text-align: right;
}

.slider {
  flex: 1;
  -webkit-appearance: none;
  height: 5px;
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.slider-drain {
  background: linear-gradient(to right, #ef4444, #1e1b4b);
}
.slider-drain::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #ef4444;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(239,68,68,.5);
}

.slider-charge {
  background: linear-gradient(to right, #10b981, #1e1b4b);
}
.slider-charge::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #10b981;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(16,185,129,.5);
}

.submit-btn {
  border: none;
  border-radius: 14px;
  padding: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.submit-drain  { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; box-shadow: 0 4px 16px rgba(239,68,68,.25); }
.submit-charge { background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 4px 16px rgba(16,185,129,.25); }
.submit-btn:hover { transform: translateY(-1px); }

.text-green { color: #10b981; }
.text-red   { color: #ef4444; }

.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; max-height: 0; }
.slide-down-enter-to, .slide-down-leave-from { max-height: 80px; }
</style>
