import type { AppNotification } from '@/types/notification'
import { daysAgo, hoursAgo, minutesAgo } from './time'

export const notifications: AppNotification[] = [
  { id: 'ntf_1', category: 'offers_swaps', icon: 'offer', title: 'New offer — $712 on Bose A20', body: 'Kunle T. · expires in 9h', readAt: null, createdAt: minutesAgo(2), actions: [{ label: 'Review offer', to: '/hangar/offers?id=off_9281', variant: 'primary' }] },
  { id: 'ntf_2', category: 'orders', icon: 'order', title: 'Order #PW-4471 is airborne', body: 'Departed LOS sort facility · ETA Aug 2–4', readAt: null, createdAt: hoursAgo(3), link: '/hangar/orders/ord_4471' },
  {
    id: 'ntf_3',
    category: 'orders',
    icon: 'landed',
    title: 'Goods landed — confirm within 72h',
    body: 'Aviator Uniform Shirt · order #PW-4468',
    readAt: null,
    createdAt: hoursAgo(5),
    actions: [
      { label: 'Confirm & release', to: '/hangar/orders/ord_4468?confirm=1', variant: 'success' },
      { label: 'Report a problem', to: '/hangar/disputes/new?order=ord_4468', variant: 'secondary' },
    ],
  },
  { id: 'ntf_4', category: 'disputes', icon: 'dispute', title: 'Dispute #DS-2041 updated', body: 'Mediator requested photos of the serial label', readAt: null, createdAt: daysAgo(1.1), link: '/hangar/disputes/dsp_2041' },
  { id: 'ntf_5', category: 'reviews', icon: 'review', title: 'You received a 5-star review', body: '“Fast dispatch, well packed” — G. Ebuko', readAt: daysAgo(1), createdAt: daysAgo(1.2), link: '/hangar/reviews' },
  { id: 'ntf_6', category: 'payouts', icon: 'payout', title: 'Payout of $1,200.00 sent', body: 'To GTBank •••• 0921 · arrives in 1–2 business days', readAt: daysAgo(5), createdAt: daysAgo(6), link: '/hangar/wallet' },
  { id: 'ntf_7', category: 'account', icon: 'verified', title: 'Identity verified', body: 'Your Verified badge is now live on all listings', readAt: daysAgo(9), createdAt: daysAgo(10), link: '/hangar/verification' },
]
