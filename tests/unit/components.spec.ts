import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppOtpInput from '@/components/forms/AppOtpInput.vue'
import DataTable from '@/components/common/DataTable.vue'
import ProductCard from '@/components/products/ProductCard.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { listings } from '@/mocks/products.mock'
import { nextTick } from 'vue'

const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/marketplace/:slug', name: 'listing', component: { template: '<div />' } }, { path: '/:p(.*)*', component: { template: '<div />' } }] })

describe('AppButton', () => {
  it('disables and marks busy while loading', () => {
    const w = mount(AppButton, { props: { loading: true }, slots: { default: 'Pay' } })
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.attributes('aria-busy')).toBe('true')
  })
})

describe('AppOtpInput', () => {
  it('fills every box on paste and emits complete', async () => {
    const w = mount(AppOtpInput, { props: { length: 4, label: 'Code', modelValue: '', 'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v }) } })
    const first = w.findAll('input')[0]!
    await first.trigger('paste', { clipboardData: { getData: () => '73 79' } })
    await nextTick()
    expect(w.props('modelValue')).toBe('7379')
    expect(w.emitted('complete')?.[0]).toEqual(['7379'])
  })
})

describe('DataTable', () => {
  it('selects all rows and exposes a bulk bar', async () => {
    const rows = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
    const w = mount(DataTable, {
      props: { columns: [{ key: 'name', label: 'Name' }], rows, caption: 'Test', selectable: true, selected: [], 'onUpdate:selected': (v: string[]) => w.setProps({ selected: v }) },
      slots: { bulk: '<button>Delete</button>' },
    })
    await w.find('thead input[type="checkbox"]').setValue(true)
    expect(w.props('selected')).toEqual(['a', 'b'])
    expect(w.text()).toContain('2 selected')
  })

  it('emits sort for sortable columns', async () => {
    const w = mount(DataTable, { props: { columns: [{ key: 'gmv', label: 'GMV', sortable: true }], rows: [], caption: 'T' } })
    await w.find('thead button').trigger('click')
    expect(w.emitted('sort')?.[0]).toEqual(['gmv'])
  })
})

describe('ProductCard', () => {
  it('renders title, price, discount and responsive image', async () => {
    setActivePinia(createPinia())
    const listing = listings[0]!
    const w = mount(ProductCard, { props: { listing }, global: { plugins: [router] } })
    expect(w.text()).toContain(listing.title)
    expect(w.text()).toContain('$745.00')
    expect(w.text()).toContain('−18%')
    const img = w.find('img')
    expect(img.attributes('loading')).toBe('lazy')
    expect(img.attributes('width')).toBeTruthy()
    expect(w.findAll('source').map((s) => s.attributes('type'))).toEqual(['image/avif', 'image/webp'])
  })

  it('shows the sold state', () => {
    setActivePinia(createPinia())
    const w = mount(ProductCard, { props: { listing: { ...listings[0]!, status: 'sold' } }, global: { plugins: [router] } })
    expect(w.text()).toContain('Sold')
  })
})

describe('AppPagination', () => {
  it('windows long page ranges', () => {
    const w = mount(AppPagination, { props: { page: 1, lastPage: 14 } })
    expect(w.text()).toMatch(/1\s*2\s*3\s*…\s*14/)
  })
})
