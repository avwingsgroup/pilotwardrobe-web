<script setup lang="ts">
import { Ban, Check, CreditCard, KeyRound, Lock, Minus, Scale, Send, ShieldAlert, Users } from '@lucide/vue'
import PolicyShell from '@/components/info/PolicyShell.vue'
import PolicySummary from '@/components/info/PolicySummary.vue'
import PolicySection from '@/components/info/PolicySection.vue'
import PolicyAccordion from '@/components/info/PolicyAccordion.vue'
import { useSeo } from '@/composables/useSeo'
import { PLATFORM } from '@/content/info/nav'

useSeo({ title: 'Terms of service', description: 'The agreement between you and Pilotwardrobe Ltd for buying, selling and swapping aviation gear.', canonicalPath: '/terms' })

const sections = [
  { id: 'about', title: 'About these terms' },
  { id: 'account', title: 'Your account' },
  { id: 'account-types', title: 'Account types' },
  { id: 'listing-rules', title: 'Listing rules' },
  { id: 'prohibited', title: 'Prohibited items' },
  { id: 'buying', title: 'Buying and paying' },
  { id: 'swaps', title: 'Swaps' },
  { id: 'fees', title: 'Fees' },
  { id: 'disputes', title: 'Disputes' },
  { id: 'suspension', title: 'Suspension' },
  { id: 'liability', title: 'Liability' },
  { id: 'contact', title: 'Contact' },
]

const summary = [
  { icon: Users, title: 'Verified community', body: 'You need an account to trade and ID verification to sell over $500 or swap.' },
  { icon: Lock, title: 'Escrow on every order', body: `Payment is held until the buyer confirms the item landed or ${PLATFORM.inspectionHours} hours pass.` },
  { icon: Scale, title: 'Fair dispute process', body: 'Either side can raise a dispute. Our team decides using the evidence both sides share.' },
]

type Cell = boolean | string
const tiers = ['Visitor', 'Registered', 'Verified pilot', 'Hangar Pro']
const matrix: { label: string; cells: Cell[] }[] = [
  { label: 'Browse and search', cells: [true, true, true, true] },
  { label: 'Buy, make offers', cells: [false, true, true, true] },
  { label: 'Propose swaps', cells: [false, false, true, true] },
  { label: 'Active listings', cells: ['—', '5', 'Unlimited', 'Unlimited'] },
  { label: 'Sell photography licences', cells: [false, false, true, true] },
  { label: 'Bulk tools and invoices', cells: [false, false, false, true] },
]

const listingRules = [
  `Only list items you own and can ship within ${PLATFORM.dispatchDays} days of a sale.`,
  'Use your own photos. Show the real item, including any wear.',
  'Describe condition honestly using our four grades.',
  'Tag the correct aircraft types so the right pilots find it.',
]

const prohibited = [
  { icon: Ban, label: 'Counterfeit or replica gear' },
  { icon: KeyRound, label: 'Airline IDs, badges, crew passes' },
  { icon: ShieldAlert, label: 'Security or restricted items' },
  { icon: Send, label: 'Current chart subscriptions' },
  { icon: Users, label: 'Stolen or company-owned kit' },
  { icon: CreditCard, label: 'Payment outside escrow' },
]

const collapsed = [
  {
    id: 'buying',
    number: 6,
    title: 'Buying and paying',
    paragraphs: [
      'When you buy, you enter a contract with the seller, not with Pilotwardrobe. We provide the marketplace, hold the payment in escrow and step in if something goes wrong.',
      `Prices include the item and the freight shown at checkout. A ${PLATFORM.buyerFeePercent}% buyer service fee covers escrow and buyer protection. Payment is processed by our licensed payment partners; we never see or store your card details.`,
      `Your order is confirmed only after the payment provider confirms the payment to us. Funds stay in escrow until you confirm the item landed or ${PLATFORM.inspectionHours} hours pass after delivery without a dispute.`,
    ],
  },
  {
    id: 'swaps',
    number: 7,
    title: 'Swaps',
    paragraphs: [
      'Both sides of a swap must be verified, and every item offered must be an active listing. Any cash top-up is paid into escrow with the proposal.',
      `Each side ships within ${PLATFORM.dispatchDays} days of acceptance and gets its own ${PLATFORM.inspectionHours}-hour inspection window. Escrow releases only when both sides confirm, or both windows close without a dispute.`,
    ],
  },
  {
    id: 'fees',
    number: 8,
    title: 'Fees',
    paragraphs: [
      `Listing is free. Sellers pay a ${PLATFORM.commissionPercent}% commission on the item price when a sale completes; swaps pay commission on the cash top-up only. Current rates are on the Seller fees page and apply from the date shown there.`,
      'We give at least 30 days’ notice before increasing any fee. Promotions such as boosts are charged up front and are non-refundable once live.',
    ],
  },
  {
    id: 'disputes',
    number: 9,
    title: 'Disputes',
    paragraphs: [
      `If an item doesn’t arrive or isn’t as described, open a dispute from the order within the ${PLATFORM.inspectionHours}-hour inspection window. Escrow is frozen while the case is open.`,
      `The seller has ${PLATFORM.sellerReplyHours} hours to respond. If you can’t agree, a Pilotwardrobe mediator reviews the evidence and decides within ${PLATFORM.mediationBusinessDays} business days. The full process is in the Escrow & disputes policy.`,
    ],
  },
  {
    id: 'suspension',
    number: 10,
    title: 'Suspension',
    paragraphs: [
      'We may limit, suspend or close an account that breaks these terms, puts other members at risk, or is linked to fraud. Where we can, we’ll tell you why and how to appeal.',
      'Open orders on a suspended account are completed or refunded through escrow; we never keep a buyer’s money because of a seller’s suspension.',
    ],
  },
  {
    id: 'liability',
    number: 11,
    title: 'Liability',
    paragraphs: [
      'Pilotwardrobe isn’t the seller of items listed by members and doesn’t guarantee their airworthiness or fitness for a particular aircraft. Always check equipment against your operator’s and regulator’s requirements.',
      'Nothing in these terms limits liability that can’t be limited by law. Otherwise our liability for any claim is limited to the fees you paid us in the 12 months before it.',
    ],
  },
  {
    id: 'contact',
    number: 12,
    title: 'Contact',
    paragraphs: [`Pilotwardrobe Ltd, Suite C8, Mediatrix Of All Graces Plaza, 79 Stadium Road, Port Harcourt, Nigeria. Email ${PLATFORM.legalEmail} or message Support from any order.`],
  },
]
</script>

<template>
  <PolicyShell title="Terms of service" effective="Oct 1, 2026" version="3.2" :read-minutes="12" :sections="sections">
    <PolicySummary :items="summary" />

    <PolicySection id="about" :number="1" title="About these terms">
      <p>These terms are an agreement between you and Pilotwardrobe Ltd. They apply whenever you use our website, apps or services to browse, buy, sell or swap. By creating an account you confirm you are at least 18 and able to enter a binding contract.</p>
    </PolicySection>

    <PolicySection id="account" :number="2" title="Your account">
      <p>Keep your login details private and your profile accurate. You’re responsible for activity on your account. If you think someone else has access, change your password and tell Support straight away.</p>
    </PolicySection>

    <PolicySection id="account-types" :number="3" title="Account types" lead="What you can do depends on your verification level. You can upgrade at any time from Settings → Verification.">
      <div class="pw-info-table-wrap">
        <table class="pw-info-table pw-terms-matrix">
          <thead>
            <tr>
              <th scope="col">What you can do</th>
              <th v-for="(t, i) in tiers" :key="t" scope="col" :class="{ 'is-hl': i === 2 }">{{ t }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in matrix" :key="row.label">
              <th scope="row">{{ row.label }}</th>
              <td v-for="(c, i) in row.cells" :key="i" :class="{ 'is-hl': i === 2 }">
                <template v-if="c === true"><Check :size="16" class="is-yes" aria-hidden="true" /><span class="sr-only">Yes</span></template>
                <template v-else-if="c === false"><Minus :size="16" class="is-no" aria-hidden="true" /><span class="sr-only">No</span></template>
                <strong v-else>{{ c }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PolicySection>

    <PolicySection id="listing-rules" :number="4" title="Listing rules">
      <ul class="pw-info-checks" role="list">
        <li v-for="r in listingRules" :key="r"><Check :size="16" aria-hidden="true" />{{ r }}</li>
      </ul>
    </PolicySection>

    <PolicySection id="prohibited" :number="5" title="Prohibited items">
      <ul class="pw-prohibited" role="list">
        <li v-for="p in prohibited" :key="p.label">
          <span class="pw-info-icon pw-info-icon--danger"><component :is="p.icon" :size="16" aria-hidden="true" /></span>
          {{ p.label }}
        </li>
      </ul>
      <p>We remove listings that break these rules and may suspend repeat offenders. The full list is in the <RouterLink :to="{ name: 'help', params: { slug: 'prohibited-items' } }">Prohibited items policy</RouterLink>.</p>
    </PolicySection>

    <PolicyAccordion :items="collapsed" />
  </PolicyShell>
</template>

<style scoped>
.pw-terms-matrix th:not(:first-child),
.pw-terms-matrix td {
  text-align: center;
}

.pw-terms-matrix .is-hl {
  background: var(--pw-navy-50);
}

.pw-terms-matrix thead .is-hl {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}

.pw-terms-matrix svg {
  vertical-align: middle;
}

.pw-terms-matrix .is-yes {
  color: var(--pw-success-600);
}

.pw-terms-matrix .is-no {
  color: var(--pw-disabled);
}

.pw-prohibited {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-4);
}

.pw-prohibited li {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

@media (min-width: 640px) {
  .pw-prohibited {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .pw-prohibited {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
