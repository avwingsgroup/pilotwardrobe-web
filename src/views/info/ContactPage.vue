<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { CircleCheck, Flag, Mail, MapPin, MessageCircle, Paperclip, Phone, Send, X } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import AppFileDrop from '@/components/forms/AppFileDrop.vue'
import { contentService } from '@/api/messages.api'
import { orderService } from '@/api/orders.api'
import { mediaService } from '@/api/listings.api'
import { toApiError } from '@/api/errors'
import { useForm } from '@/composables/useForm'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { PLATFORM } from '@/content/info/nav'
import type { ContactTopic } from '@/types/support'
import { email, minLength, required } from '@/utils/validators'

useSeo({ title: 'Contact us', description: 'Talk to the Pilotwardrobe ground crew about orders, escrow, disputes, selling or safety.', canonicalPath: '/contact' })

const auth = useAuthStore()
const ui = useUiStore()
const ticket = ref<string | null>(null)
const formEl = ref<HTMLElement | null>(null)

const TOPICS: { value: ContactTopic; label: string }[] = [
  { value: 'order', label: 'Order or delivery' },
  { value: 'escrow', label: 'Escrow, payments or payouts' },
  { value: 'dispute', label: 'A dispute' },
  { value: 'selling', label: 'Selling or listings' },
  { value: 'account', label: 'Account or verification' },
  { value: 'trust_safety', label: 'Fraud or a safety concern' },
  { value: 'callback', label: 'Request a phone call' },
  { value: 'other', label: 'Something else' },
]

const form = useForm(
  { name: auth.displayName, email: auth.user?.email ?? '', topic: 'order' as ContactTopic, orderId: '', subject: '', message: '', phone: auth.user?.phone ?? '' },
  {
    name: [required('Please tell us your name.')],
    email: [required('Enter your email address.'), email],
    subject: [required('Add a short subject.')],
    message: [required('How can we help?'), minLength(10, 'Message')],
    phone: [(v: string): string | true => (form.values.topic !== 'callback' || /^\+?[\d\s()-]{7,}$/.test(v) ? true : 'Enter a phone number we can call.')],
  },
)

// Related order: the signed-in member's recent orders (buying and selling).
const { data: orders } = useResource(async (signal) => (auth.isAuthenticated ? (await orderService.list({}, signal)).data : []))
const orderOptions = computed(() => [{ value: '', label: 'Not about an order' }, ...(orders.value ?? []).slice(0, 12).map((o) => ({ value: o.id, label: `#${o.number} · ${o.items[0]?.title ?? 'Order'}` }))])

const { data: info } = useResource((signal) => contentService.contactInfo(signal))
const maxLoad = computed(() => Math.max(1, ...(info.value?.chatLoad ?? [1])))
// The seven busiest hours are drawn solid, the rest tinted (as in VC11).
const peakFloor = computed(() => [...(info.value?.chatLoad ?? [])].sort((a, b) => b - a)[6] ?? Infinity)

// Attachments: uploaded to /media as private message files, then sent by id.
const attachments = ref<{ id: string; name: string }[]>([])
const uploading = ref(false)
async function addFiles(files: File[]) {
  const room = 5 - attachments.value.length
  if (room <= 0) return ui.error('Attachment limit reached', 'You can attach up to 5 files.')
  uploading.value = true
  try {
    for (const file of files.slice(0, room)) {
      const asset = await mediaService.upload(file, 'message')
      attachments.value = [...attachments.value, { id: asset.id, name: file.name }]
    }
  } catch (e) {
    ui.error('Upload failed', toApiError(e).message)
  } finally {
    uploading.value = false
  }
}

async function focusForm(topic: ContactTopic) {
  form.values.topic = topic
  await nextTick()
  formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  formEl.value?.querySelector<HTMLElement>(topic === 'callback' ? 'input[type="tel"]' : 'input:not([type="hidden"]), textarea')?.focus({ preventScroll: true })
}

async function submit() {
  const res = await form.submit((v) =>
    contentService.contact({
      name: v.name,
      email: v.email,
      topic: v.topic,
      subject: v.subject,
      message: v.message,
      orderId: v.orderId || null,
      phone: v.topic === 'callback' ? v.phone : null,
      attachmentIds: attachments.value.map((a) => a.id),
    }),
  )
  if (res) ticket.value = res.ticket
}

function startOver() {
  ticket.value = null
  attachments.value = []
  form.reset()
}
</script>

<template>
  <div>
    <header class="pw-contact-head">
      <div class="pw-container">
        <p class="pw-info-eyebrow">Support · Contact us</p>
        <h1 class="pw-contact-head__title">Talk to the ground crew</h1>
        <p class="pw-info-lead">Real people, most of them pilots or ex-airline ops. Pick the fastest way to reach us.</p>
      </div>
    </header>

    <div class="pw-container pw-contact">
      <ul class="pw-channels" role="list">
        <li class="pw-channel is-primary">
          <span class="pw-info-icon"><MessageCircle :size="18" aria-hidden="true" /></span>
          <h2>Message the crew</h2>
          <p class="pw-channel__tag">Avg reply {{ info?.avgChatReplyMinutes ?? 4 }} min</p>
          <p>Daily {{ PLATFORM.chatHours }}</p>
          <AppButton variant="gold" size="sm" @click="focusForm('order')">Start a message</AppButton>
        </li>
        <li class="pw-channel">
          <span class="pw-info-icon"><Mail :size="18" aria-hidden="true" /></span>
          <h2>Email</h2>
          <p class="pw-channel__tag">Reply within 24 h</p>
          <p>{{ PLATFORM.supportEmail }}</p>
          <AppButton variant="secondary" size="sm" :href="`mailto:${PLATFORM.supportEmail}`">Send email</AppButton>
        </li>
        <li class="pw-channel">
          <span class="pw-info-icon"><Phone :size="18" aria-hidden="true" /></span>
          <h2>Phone</h2>
          <p class="pw-channel__tag">Disputes over $500</p>
          <p>{{ PLATFORM.supportPhone }}</p>
          <AppButton variant="secondary" size="sm" @click="focusForm('callback')">Request a call</AppButton>
        </li>
        <li class="pw-channel">
          <span class="pw-info-icon"><Flag :size="18" aria-hidden="true" /></span>
          <h2>Trust &amp; Safety</h2>
          <p class="pw-channel__tag">Fraud or a safety concern</p>
          <p>Staffed 24/7</p>
          <AppButton variant="secondary" size="sm" @click="focusForm('trust_safety')">Report now</AppButton>
        </li>
      </ul>

      <div class="pw-contact__grid">
        <section id="message" ref="formEl" class="pw-info-card pw-contact__form" aria-labelledby="send-msg">
          <AppEmptyState v-if="ticket" :icon="CircleCheck" tone="success" title="Message received" :body="`Your reference is ${ticket}. We’ve emailed a copy to ${form.values.email}.`" compact>
            <AppButton variant="secondary" @click="startOver">Send another</AppButton>
          </AppEmptyState>
          <form v-else novalidate @submit.prevent="submit">
            <h2 id="send-msg" class="pw-contact__h2">Send us a message</h2>
            <p v-if="auth.isAuthenticated" class="pw-muted pw-contact__who">Signed in as {{ auth.displayName }} · we’ll reply to {{ form.values.email }}</p>
            <div v-else class="pw-contact__row">
              <AppInput v-model="form.values.name" label="Your name" autocomplete="name" :error="form.fieldError('name')" @blur="form.touch('name')" />
              <AppInput v-model="form.values.email" label="Email" type="email" autocomplete="email" :error="form.fieldError('email')" @blur="form.touch('email')" />
            </div>
            <div class="pw-contact__row">
              <AppSelect v-model="form.values.topic" label="Topic" :options="TOPICS" />
              <AppSelect v-if="auth.isAuthenticated" v-model="form.values.orderId" label="Related order" :options="orderOptions" />
            </div>
            <AppInput v-if="form.values.topic === 'callback'" v-model="form.values.phone" label="Phone number" type="tel" autocomplete="tel" hint="We call back within 2 hours, 7am–11pm WAT." :error="form.fieldError('phone')" @blur="form.touch('phone')" />
            <AppInput v-model="form.values.subject" label="Subject" :error="form.fieldError('subject')" @blur="form.touch('subject')" />
            <AppTextarea v-model="form.values.message" label="Message" :rows="4" :error="form.fieldError('message')" @blur="form.touch('message')" />

            <AppFileDrop label="Attach screenshots or photos" hint="Up to 5 files, 10 MB each" multiple :max-bytes="10 * 1024 * 1024" :disabled="uploading || attachments.length >= 5" compact @files="addFiles" @rejected="(m) => ui.error('File not added', m)" />
            <ul v-if="attachments.length" class="pw-contact__files" role="list">
              <li v-for="a in attachments" :key="a.id">
                <Paperclip :size="14" aria-hidden="true" />{{ a.name }}
                <button type="button" :aria-label="`Remove ${a.name}`" @click="attachments = attachments.filter((x) => x.id !== a.id)"><X :size="14" /></button>
              </li>
            </ul>

            <p v-if="form.formError.value" class="pw-contact__error" role="alert">{{ form.formError.value }}</p>
            <div class="pw-contact__foot">
              <span class="pw-muted">{{ form.values.orderId ? 'Order details are attached automatically.' : 'Add an order so we can see the tracking.' }}</span>
              <AppButton type="submit" :loading="form.submitting.value || uploading">
                <template #icon><Send :size="16" /></template>
                Send message
              </AppButton>
            </div>
          </form>
        </section>

        <div class="pw-contact__side">
          <section class="pw-info-card" aria-labelledby="busiest">
            <div class="pw-busy__head">
              <h2 id="busiest" class="pw-info-card-title">When we’re busiest</h2>
              <span class="pw-muted">Chats per hour, WAT</span>
            </div>
            <div v-if="info" class="pw-busy" role="img" aria-label="Chat volume peaks between 9am and 5pm WAT; replies are quickest before 8am and after 8pm.">
              <span v-for="(v, h) in info.chatLoad" :key="h" :class="{ 'is-peak': v >= peakFloor }" :style="{ height: `${Math.max(4, (v / maxLoad) * 100)}%` }" />
            </div>
            <div class="pw-busy__axis" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
            <p class="pw-muted pw-busy__note">Quickest replies before 8am and after 8pm.</p>
          </section>

          <section class="pw-info-card" aria-labelledby="offices">
            <h2 id="offices" class="pw-info-card-title">Offices</h2>
            <ul class="pw-offices" role="list">
              <li v-for="o in info?.offices ?? []" :key="o.name">
                <MapPin :size="16" aria-hidden="true" />
                <span><strong>{{ o.name }}</strong><small>{{ o.address }}</small></span>
              </li>
            </ul>
            <p class="pw-muted pw-offices__note">Visits by appointment only. We can’t accept parcels.</p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pw-contact-head {
  background: var(--pw-surface);
  border-bottom: 1px solid var(--pw-border);
  padding: var(--pw-space-8) 0;
}

.pw-contact-head__title {
  margin-top: var(--pw-space-2);
  font-size: clamp(2rem, 4vw, 2.5rem);
  line-height: 1.1;
}

.pw-contact {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-5);
  padding-top: var(--pw-space-8);
  padding-bottom: var(--pw-space-12);
}

.pw-channels {
  display: grid;
  gap: var(--pw-space-3);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pw-channel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: var(--pw-space-5);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-channel h2 {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-md);
  color: var(--pw-ink);
}

.pw-channel__tag {
  color: var(--pw-success-600);
  font-weight: var(--pw-weight-medium);
}

.pw-channel :deep(.pw-btn) {
  margin-top: var(--pw-space-4);
}

.pw-channel.is-primary {
  border-color: var(--pw-navy-900);
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 80%);
}

.pw-channel.is-primary h2 {
  color: #fff;
}

.pw-channel.is-primary .pw-channel__tag {
  color: var(--pw-gold-400);
}

.pw-channel.is-primary .pw-info-icon {
  background: rgb(255 255 255 / 12%);
  color: #fff;
}

.pw-contact__grid {
  display: grid;
  gap: var(--pw-space-5);
  grid-template-columns: minmax(0, 1fr);
}

.pw-contact__form {
  scroll-margin-top: 136px;
}

.pw-contact__form form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
}

.pw-contact__h2 {
  font-size: var(--pw-text-xl);
}

.pw-contact__who {
  margin-top: calc(var(--pw-space-3) * -1);
  font-size: var(--pw-text-xs);
}

.pw-contact__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
}

.pw-contact__files {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}

.pw-contact__files li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px 4px 10px;
  border-radius: 999px;
  background: var(--pw-navy-100);
  font-size: var(--pw-text-xs);
}

.pw-contact__files button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--pw-muted);
}

.pw-contact__error {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

.pw-contact__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-3);
  font-size: var(--pw-text-xs);
}

.pw-contact__side {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-5);
  align-content: start;
}

.pw-busy__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-busy__head span {
  font-size: var(--pw-text-xs);
}

.pw-busy {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 110px;
  margin-top: var(--pw-space-5);
}

.pw-busy span {
  flex: 1;
  border-radius: 2px 2px 0 0;
  background: var(--pw-navy-300);
}

.pw-busy span.is-peak {
  background: var(--pw-navy-700);
}

.pw-busy__axis {
  display: flex;
  justify-content: space-between;
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-busy__note,
.pw-offices__note {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-xs);
}

.pw-offices {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-top: var(--pw-space-4);
}

.pw-offices li {
  display: flex;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) 0;
  font-size: var(--pw-text-sm);
}

.pw-offices li + li {
  border-top: 1px solid var(--pw-border);
}

.pw-offices svg {
  flex: none;
  margin-top: 2px;
  color: var(--pw-navy-700);
}

.pw-offices span {
  display: grid;
}

.pw-offices small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

@media (min-width: 640px) {
  .pw-contact__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .pw-channels {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .pw-contact__grid {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    align-items: start;
  }
}

@media (max-width: 479px) {
  .pw-channels {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
