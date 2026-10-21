import { PLATFORM } from './nav'

/**
 * FAQ content (VC12). Each answer is plain text; `policy` links to the full
 * policy page. Ids are stable anchors (/faq?topic=escrow#escrow-protect).
 */
export type FaqTopic = 'buying' | 'selling' | 'swaps' | 'escrow' | 'freight' | 'account'

export interface Faq {
  id: string
  topic: FaqTopic
  q: string
  a: string
  policy?: { label: string; name: string }
}

export const FAQ_TOPICS: { value: FaqTopic; label: string }[] = [
  { value: 'buying', label: 'Buying' },
  { value: 'selling', label: 'Selling' },
  { value: 'swaps', label: 'Swaps' },
  { value: 'escrow', label: 'Escrow & payments' },
  { value: 'freight', label: 'Freight' },
  { value: 'account', label: 'Account' },
]

const { dispatchDays: D, inspectionHours: H, sellerReplyHours: R, mediationBusinessDays: M, commissionPercent: C, buyerFeePercent: B } = PLATFORM
const escrowPolicy = { label: 'Read the full Escrow policy', name: 'escrow-disputes' }
const returnsPolicy = { label: 'Read the Returns policy', name: 'returns' }

export const FAQS: Faq[] = [
  // Escrow & payments
  { id: 'escrow-protect', topic: 'escrow', q: 'How does escrow protect me as a buyer?', a: `Your payment goes into a balance we control, not to the seller. It’s only released when you confirm the item landed or ${H} hours pass with no dispute. If the seller never ships, you’re refunded automatically after ${D} days.`, policy: escrowPolicy },
  { id: 'seller-paid', topic: 'escrow', q: 'When do sellers get paid?', a: `As soon as the buyer confirms the item landed, or automatically ${H} hours after delivery if no dispute is open. Verified pilots receive payouts within 24 hours of release.`, policy: escrowPolicy },
  { id: 'not-as-described', topic: 'escrow', q: 'What happens if the item isn’t as described?', a: `Open a dispute from the order within the ${H}-hour inspection window. Escrow is frozen, the seller has ${R} hours to respond, and a mediator decides within ${M} business days if you can’t agree.`, policy: returnsPolicy },
  { id: 'pay-outside', topic: 'escrow', q: 'Can I pay outside Pilotwardrobe to save the fee?', a: 'No. Trades paid outside Pilotwardrobe aren’t covered by escrow or disputes, and asking to pay off-platform breaks our terms. Report anyone who suggests it from the chat menu.', policy: escrowPolicy },
  { id: 'licence-to-buy', topic: 'escrow', q: 'Do I need a pilot licence to buy?', a: 'No. Anyone with a registered account can buy and make offers. A verified licence is only needed to sell over $500, propose swaps, or sell photography licences.' },
  { id: 'buyer-fee', topic: 'escrow', q: 'What does the buyer service fee cover?', a: `The ${B}% service fee pays for escrow, buyer protection and dispute mediation. It’s refunded whenever the item price is refunded in full.`, policy: { label: 'See all fees', name: 'seller-fees' } },
  { id: 'fit-kit-size', topic: 'escrow', q: 'How does Fit Kit pick my size?', a: 'Fit Kit compares the measurements in your saved profile with each listing’s size chart and highlights the closest match. You can change your default profile from My Hangar → Fit Kit.' },
  { id: 'cancel-after-paying', topic: 'escrow', q: 'Can I cancel after paying?', a: 'Yes, until the seller adds tracking. Cancel from the order page and the full amount returns to your original payment method. Once the item has shipped, use the return process instead.', policy: returnsPolicy },

  // Buying
  { id: 'track-order', topic: 'buying', q: 'How do I track my order?', a: 'Open My Hangar → Orders and select the order. The tracker shows the same five stages the seller sees, from Cleared for pickup to Goods landed.', policy: { label: 'Read the Freight guide', name: 'freight-guide' } },
  { id: 'make-offer', topic: 'buying', q: 'How do offers work?', a: 'Tap Make offer on any listing that accepts offers. The seller has 24 hours to accept, decline or counter. If they accept, you check out at the agreed price.' },
  { id: 'confirm-landed', topic: 'buying', q: 'How long do I have to confirm goods landed?', a: `You have ${H} hours from the carrier’s delivery scan. Check the item against the listing, then tap Confirm landed, or open a dispute if something’s wrong.` },
  { id: 'payment-methods', topic: 'buying', q: 'Which payment methods can I use?', a: 'Cards, bank transfer and mobile money through our payment partners. Available methods depend on your country and currency and are shown at checkout.' },

  // Selling
  { id: 'listing-fees', topic: 'selling', q: 'Does it cost anything to list?', a: `No. Listing is free. You pay a ${C}% commission only when an item sells and the buyer confirms it landed.`, policy: { label: 'See seller fees', name: 'seller-fees' } },
  { id: 'how-long-to-ship', topic: 'selling', q: 'How long do I have to ship?', a: `${D} days from payment. Add the carrier and tracking number on the order page. Orders with no tracking after ${D} days are refunded automatically.` },
  { id: 'payout-pending', topic: 'selling', q: 'Why is my payout still pending?', a: `Funds stay in escrow until the buyer confirms or the ${H}-hour window closes. New sellers also have a short payout hold on their first sales.` },
  { id: 'listing-limit', topic: 'selling', q: 'Why can’t I publish more listings?', a: 'Unverified accounts can have up to 5 active listings. Complete ID verification in My Hangar → Verification to list without limits.' },

  // Swaps
  { id: 'swap-how', topic: 'swaps', q: 'How does a swap work?', a: `Pick items from your hangar, add a cash top-up if needed, and send the proposal. Once accepted, each side ships within ${D} days and escrow releases when both confirm landed.`, policy: { label: 'Read the swap guide', name: 'how-to-swap' } },
  { id: 'swap-cancel-accepted', topic: 'swaps', q: 'Can I cancel an offer after it’s accepted?', a: 'Not on your own. Once accepted, both sides are committed. Message the other pilot; if you both agree to cancel, Support can unwind it and refund any top-up.' },
  { id: 'swap-verification', topic: 'swaps', q: 'Who can propose swaps?', a: 'Both sides need completed ID verification. Swaps over $500 also need a verified pilot licence on at least one side.' },

  // Freight
  { id: 'holding-pattern', topic: 'freight', q: 'What does “Holding pattern” mean?', a: 'Your parcel is at a carrier hub or in customs. Most clear within 48 hours. If it’s held longer, the carrier may contact the recipient for import details.', policy: { label: 'Read the Freight guide', name: 'freight-guide' } },
  { id: 'batteries', topic: 'freight', q: 'Can I ship headsets with batteries?', a: 'Yes, with batteries installed in the device. Loose lithium batteries can’t be shipped.' },

  // Account
  { id: 'verify-licence', topic: 'account', q: 'How do I verify my pilot licence?', a: 'Go to My Hangar → Verification, complete ID verification, then upload your licence on the Aviator credentials step. Most checks finish within 24 hours.' },
  { id: 'delete-account', topic: 'account', q: 'How do I delete my account?', a: 'From Settings → Privacy. You can’t delete an account with open orders, disputes or a wallet balance; close those first.', policy: { label: 'Read the Privacy policy', name: 'privacy' } },
  { id: 'two-factor', topic: 'account', q: 'How do I turn on two-step verification?', a: 'Settings → Security → Two-step verification. Use an authenticator app; SMS is available as a backup.' },
]

export const faqsByTopic = (topic: FaqTopic) => FAQS.filter((f) => f.topic === topic)
