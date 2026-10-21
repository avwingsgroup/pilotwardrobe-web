<script setup lang="ts">
import { computed } from 'vue'

/**
 * Dependency-free SVG line chart (AD2 sparklines + GMV/orders). Each series is
 * normalised to its own range so two units can share one plot area. A visually
 * hidden table carries the data for screen readers.
 */
const props = withDefaults(
  defineProps<{
    series: { name: string; values: number[]; color: string; area?: boolean }[]
    labels?: string[]
    height?: number
    sparkline?: boolean
    title: string
  }>(),
  { height: 180 },
)

const W = 600
const pad = computed(() => (props.sparkline ? 2 : 12))

function path(values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const h = props.height - pad.value * 2
  return values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * W
    const y = pad.value + h - ((v - min) / span) * h
    return [x, y] as const
  })
}

const lines = computed(() =>
  props.series.map((s) => {
    const pts = path(s.values)
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
    return { ...s, d, area: s.area ? `${d} L${W},${props.height} L0,${props.height} Z` : null }
  }),
)
</script>

<template>
  <figure class="pw-chart" :class="{ 'pw-chart--spark': sparkline }">
    <svg :viewBox="`0 0 ${W} ${height}`" preserveAspectRatio="none" role="img" :aria-label="title" :style="{ height: `${height}px` }">
      <template v-if="!sparkline">
        <line v-for="n in 4" :key="n" x1="0" :x2="W" :y1="(height / 4) * n - 1" :y2="(height / 4) * n - 1" class="pw-chart__grid" />
      </template>
      <template v-for="l in lines" :key="l.name">
        <path v-if="l.area" :d="l.area" :fill="l.color" opacity="0.08" />
        <path :d="l.d" fill="none" :stroke="l.color" :stroke-width="sparkline ? 2.5 : 2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" />
      </template>
    </svg>
    <figcaption v-if="labels && !sparkline" class="pw-chart__labels" aria-hidden="true">
      <span v-for="(l, i) in labels" :key="i">{{ l }}</span>
    </figcaption>
    <table class="sr-only">
      <caption>{{ title }}</caption>
      <thead>
        <tr><th scope="col">Point</th><th v-for="s in series" :key="s.name" scope="col">{{ s.name }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="(_, i) in series[0]?.values ?? []" :key="i">
          <th scope="row">{{ labels?.[i] ?? i + 1 }}</th>
          <td v-for="s in series" :key="s.name">{{ s.values[i] }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>

<style scoped>
.pw-chart {
  margin: 0;
}

.pw-chart svg {
  display: block;
  width: 100%;
}

.pw-chart__grid {
  stroke: var(--pw-border);
  stroke-dasharray: 2 4;
  vector-effect: non-scaling-stroke;
}

.pw-chart__labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}
</style>
