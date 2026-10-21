import type { Conversation, Message } from '@/types/messaging'
import type { CurrencyCode } from '@/types/api'
import { mockMedia } from './media'
import { hoursAgo, minutesAgo, daysAgo } from './time'

const usd = (amount: number) => ({ amount, currency: 'USD' as CurrencyCode })

const boseContext = {
  id: 'lst_001',
  slug: 'bose-a20-aviation-headset-dual-ga',
  title: 'Bose A20 Aviation Headset',
  image: mockMedia('bose-a20'),
  price: usd(74500),
  conditionLabel: 'Like new',
  offersCount: 5,
  reserved: false,
}

export const conversations: Conversation[] = [
  {
    id: 'cnv_1',
    context: 'selling',
    participant: { id: 'usr_09981k', displayName: 'Kunle Taiwo', initials: 'KT', username: 'kunle_t', verified: true, responseTime: 'Usually replies within 1 hour', location: 'Abuja', rating: 4.9, trades: 27, kycVerified: true, memberSince: '2024-02-01T00:00:00Z' },
    listing: boseContext,
    lastMessagePreview: 'Offer: $712 for the Bose A20',
    lastMessageAt: minutesAgo(2),
    unreadCount: 1,
  },
  {
    id: 'cnv_2',
    context: 'selling',
    participant: { id: 'usr_11034', displayName: 'Ifeoma A.', initials: 'IA', username: 'ifeoma_a', verified: false, location: 'Lagos', rating: 4.7, trades: 6, kycVerified: false },
    listing: boseContext,
    lastMessagePreview: 'Swap: Zulu 3 + $180?',
    lastMessageAt: hoursAgo(1),
    unreadCount: 1,
  },
  {
    id: 'cnv_3',
    context: 'buying',
    participant: { id: 'usr_11003', displayName: 'Gbenga Ebuko', initials: 'GE', username: 'gbenga_e', verified: true, rating: 4.8, trades: 12, kycVerified: true },
    listing: { ...boseContext, id: 'lst_010', slug: 'jeppesen-captain-flight-bag-leather', title: 'Jeppesen Captain Flight Bag', image: mockMedia('jeppesen-flight-bag'), price: usd(18000), conditionLabel: 'Good', offersCount: 0 },
    lastMessagePreview: 'Thanks! Will confirm once it lands',
    lastMessageAt: hoursAgo(3),
    unreadCount: 0,
  },
  {
    id: 'cnv_4',
    context: 'buying',
    participant: { id: 'usr_09981', displayName: 'Capt. A. Bello', initials: 'AB', username: 'capt_bello', verified: true, rating: 4.8, trades: 58, kycVerified: true },
    listing: { ...boseContext, id: 'lst_008', slug: 'garmin-gdl-52-ads-b-receiver', title: 'Garmin GDL 52 ADS-B receiver', image: mockMedia('captain-jacket'), price: usd(62000), conditionLabel: 'Like new', offersCount: 0 },
    lastMessagePreview: 'Label printed, dropping at DHL today',
    lastMessageAt: daysAgo(1),
    unreadCount: 0,
  },
  {
    id: 'cnv_5',
    context: 'support',
    participant: { id: 'usr_support', displayName: 'Pilotwardrobe Support', initials: 'PW', username: 'support', verified: true, isSupport: true },
    listing: null,
    lastMessagePreview: 'Your dispute #DS-2041 was updated',
    lastMessageAt: daysAgo(2),
    unreadCount: 0,
  },
]

export const messages: Message[] = [
  { id: 'msg_1', conversationId: 'cnv_1', senderId: 'usr_09981k', mine: false, kind: 'text', body: 'Hi! Is the A20 still available? Does it come with the Bluetooth cable?', sentAt: minutesAgo(70) },
  { id: 'msg_2', conversationId: 'cnv_1', senderId: 'usr_10422', mine: true, kind: 'text', body: 'Yes and yes — original case, cable and the spare ear seals.', sentAt: minutesAgo(66), readAt: minutesAgo(60) },
  {
    id: 'msg_3',
    conversationId: 'cnv_1',
    senderId: 'usr_09981k',
    mine: false,
    kind: 'offer',
    body: 'Offer · $712.00',
    offer: { id: 'off_9281', amount: usd(71200), listingTitle: 'Bose A20', listedPrice: usd(74500), expiresIn: '9h', status: 'pending' },
    sentAt: minutesAgo(5),
  },
  { id: 'msg_4', conversationId: 'cnv_1', senderId: 'usr_09981k', mine: false, kind: 'text', body: 'Can you do $712 if I pay today? Need it before my checkride on the 14th.', sentAt: minutesAgo(2) },
  { id: 'msg_5', conversationId: 'cnv_2', senderId: 'usr_11034', mine: false, kind: 'text', body: 'Would you swap for my Zulu 3 plus $180 cash?', sentAt: hoursAgo(1) },
  { id: 'msg_6', conversationId: 'cnv_3', senderId: 'usr_11003', mine: false, kind: 'text', body: 'Thanks! Will confirm once it lands', sentAt: hoursAgo(3) },
  { id: 'msg_7', conversationId: 'cnv_4', senderId: 'usr_09981', mine: false, kind: 'text', body: 'Label printed, dropping at DHL today', sentAt: daysAgo(1) },
  { id: 'msg_8', conversationId: 'cnv_5', senderId: 'usr_support', mine: false, kind: 'system', body: 'Your dispute #DS-2041 was updated: the mediator requested photos of the serial label.', sentAt: daysAgo(2) },
]
