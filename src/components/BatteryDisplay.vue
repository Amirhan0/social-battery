<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'

const props = defineProps<{ level: number; compact?: boolean }>()

const uid = getCurrentInstance()!.uid

const R = 52
const CIRCUMFERENCE = 2 * Math.PI * R

const fillColor = computed(() => {
  if (props.level >= 60) return '#10b981'
  if (props.level >= 30) return '#f59e0b'
  return '#ef4444'
})

const fillColorLight = computed(() => {
  if (props.level >= 60) return '#6ee7b7'
  if (props.level >= 30) return '#fcd34d'
  return '#fca5a5'
})

const glowColor = computed(() => {
  if (props.level >= 60) return 'rgba(16,185,129,0.5)'
  if (props.level >= 30) return 'rgba(245,158,11,0.5)'
  return 'rgba(239,68,68,0.5)'
})

const statusLabel = computed(() => {
  if (props.level >= 80) return 'Отлично'
  if (props.level >= 60) return 'Хорошо'
  if (props.level >= 40) return 'Средне'
  if (props.level >= 20) return 'Низко'
  return 'Разряжен'
})

const strokeOffset = computed(() => CIRCUMFERENCE * (1 - props.level / 100))
const tipRotation = computed(() => `rotate(${props.level * 3.6}deg)`)

const pulseClass = computed(() => {
  if (props.level < 20) return 'pulse-danger'
  if (props.level >= 80) return 'pulse-success'
  return ''
})
</script>

<template>
  <div class="ring-wrap" :class="[{ compact }, pulseClass]">
    <div class="ring-outer">
      <div class="ring-glow" :style="{ background: glowColor }" />

      <svg
        :width="compact ? 78 : 148"
        :height="compact ? 78 : 148"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient :id="`rg-${uid}`" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" :stop-color="fillColorLight" />
            <stop offset="100%" :stop-color="fillColor" />
          </linearGradient>
          <filter :id="`gf-${uid}`" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter :id="`tf-${uid}`" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Track ring -->
        <circle cx="60" cy="60" :r="R" stroke="#1a1733" stroke-width="10" fill="none" />

        <!-- Inner decorative ring -->
        <circle cx="60" cy="60" r="38" stroke="#1e1b4b" stroke-width="1" fill="none" opacity="0.6" />

        <!-- Fill arc -->
        <circle
          v-if="level > 0"
          cx="60" cy="60" :r="R"
          :stroke="`url(#rg-${uid})`"
          stroke-width="10"
          fill="none"
          stroke-linecap="round"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="strokeOffset"
          transform="rotate(-90 60 60)"
          class="ring-arc"
          :filter="level >= 60 ? `url(#gf-${uid})` : ''"
        />

        <!-- Tip dot (rotates smoothly with level) -->
        <circle
          v-if="level > 2"
          cx="60" cy="8" r="5.5"
          :fill="fillColorLight"
          :filter="`url(#tf-${uid})`"
          class="tip-dot"
          :style="{ transform: tipRotation }"
        />

        <!-- Center % for compact -->
        <text
          v-if="compact"
          x="60" y="60"
          text-anchor="middle"
          dominant-baseline="central"
          :fill="fillColor"
          font-size="28"
          font-weight="800"
          font-family="Inter, sans-serif"
        >{{ level }}</text>
      </svg>

      <!-- Center overlay for full size -->
      <div v-if="!compact" class="ring-center">
        <div class="ring-pct" :style="{ color: fillColor }">
          {{ level }}<span class="sym">%</span>
        </div>
        <div class="ring-label" :style="{ color: fillColor }">{{ statusLabel }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ring-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ring-outer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-glow {
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  filter: blur(28px);
  opacity: 0.3;
  pointer-events: none;
  transition: background 0.7s ease, opacity 0.7s ease;
}

.ring-arc {
  transition: stroke-dashoffset 0.7s cubic-bezier(.4, 0, .2, 1);
}

.tip-dot {
  transform-origin: 60px 60px;
  transition: transform 0.7s cubic-bezier(.4, 0, .2, 1);
}

.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.ring-pct {
  font-size: 2.8rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
  transition: color 0.6s ease;
}

.sym {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  opacity: 0.75;
}

.ring-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  margin-top: 6px;
  opacity: 0.65;
  transition: color 0.6s ease;
}

/* ── Pulse animations ───────────── */
@keyframes pulse-danger {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.04); }
}

@keyframes pulse-success {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 0.6; }
}

.pulse-danger .ring-outer {
  animation: pulse-danger 1.6s ease-in-out infinite;
}

.pulse-success .ring-glow {
  animation: pulse-success 2.4s ease-in-out infinite;
}
</style>
