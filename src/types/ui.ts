/** Shared UI component contracts (kept out of <script setup> so they can be imported). */

export interface TabItem<V extends string> {
  value: V
  label: string
  count?: number | null
}

export interface RadioCardOption<V extends string> {
  value: V
  label: string
  hint?: string
  aside?: string
  extra?: string
  disabled?: boolean
}

export interface Column<R> {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  width?: string
  /** Hide on the mobile stacked-card layout. */
  hideOnMobile?: boolean
  /** Plain accessor for cells without a slot. */
  value?: (row: R) => string | number | null | undefined
}
