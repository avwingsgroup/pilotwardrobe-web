/** Relative timestamps so mock data always looks "live" (expires in 9h, 2m ago…). */
const HOUR = 3600_000

export const now = () => new Date()
export const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR).toISOString()
export const daysAgo = (d: number) => hoursAgo(d * 24)
export const inHours = (h: number) => new Date(Date.now() + h * HOUR).toISOString()
export const inDays = (d: number) => inHours(d * 24)
export const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()
