<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { useEnergyStore } from '../stores/energy'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const store = useEnergyStore()

const chartData = computed(() => ({
  labels: store.chartData.labels,
  datasets: [
    {
      label: 'Уровень энергии',
      data: store.chartData.data,
      fill: true,
      borderColor: '#818cf8',
      backgroundColor: (ctx: { chart: ChartJS }) => {
        const chart = ctx.chart
        const { ctx: canvasCtx, chartArea } = chart
        if (!chartArea) return 'rgba(129,140,248,0.1)'
        const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(129,140,248,0.4)')
        gradient.addColorStop(1, 'rgba(129,140,248,0.02)')
        return gradient
      },
      tension: 0.4,
      pointBackgroundColor: store.chartData.data.map((v) =>
        v >= 60 ? '#10b981' : v >= 30 ? '#f59e0b' : '#ef4444',
      ),
      pointBorderColor: '#1e1b4b',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 8,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e1b4b',
      borderColor: '#4338ca',
      borderWidth: 1,
      titleColor: '#94a3b8',
      bodyColor: '#e2e8f0',
      padding: 12,
      callbacks: {
        label: (ctx: { parsed: { y: number | null } }) =>
          ` Энергия: ${ctx.parsed.y ?? 0}%`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(75,85,99,0.2)' },
      ticks: { color: '#64748b', font: { size: 11 } },
    },
    y: {
      min: 0,
      max: 100,
      grid: { color: 'rgba(75,85,99,0.2)' },
      ticks: {
        color: '#64748b',
        font: { size: 11 },
        callback: (v: string | number) => `${v}%`,
      },
    },
  },
  animation: { duration: 600, easing: 'easeInOutQuart' as const },
}))

const hasData = computed(() => store.chartData.data.length > 0)
</script>

<template>
  <div class="chart-wrapper">
    <div v-if="!hasData" class="no-data">
      <span>📊</span>
      <p>Добавьте несколько событий, чтобы увидеть график</p>
    </div>
    <div v-else class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
}

.chart-container {
  height: 240px;
  width: 100%;
}

.no-data {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
}

.no-data span {
  font-size: 2.5rem;
}

.no-data p {
  font-size: 0.9rem;
  text-align: center;
  max-width: 220px;
  margin: 0;
}
</style>
