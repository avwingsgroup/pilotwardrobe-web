import { computed, onBeforeUnmount, ref } from 'vue'

/** Resend-cooldown style countdown ("Resend in 00:34"). */
export function useCountdown(initialSeconds = 0) {
  const remaining = ref(initialSeconds)
  let timer: ReturnType<typeof setInterval> | null = null

  function start(seconds: number) {
    stop()
    remaining.value = seconds
    timer = setInterval(() => {
      remaining.value = Math.max(0, remaining.value - 1)
      if (remaining.value === 0) stop()
    }, 1000)
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  const label = computed(() => {
    const m = Math.floor(remaining.value / 60)
    const s = remaining.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  const active = computed(() => remaining.value > 0)

  if (initialSeconds > 0) start(initialSeconds)
  onBeforeUnmount(stop)

  return { remaining, label, active, start, stop }
}
