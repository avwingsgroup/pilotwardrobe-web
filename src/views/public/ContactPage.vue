<script setup lang="ts">
import { ref } from 'vue'
import { CircleCheck, Clock, Mail, MapPin } from '@lucide/vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import { contentService } from '@/api/messages.api'
import { useForm } from '@/composables/useForm'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { email, minLength, required } from '@/utils/validators'

useSeo({ title: 'Contact us', description: 'Talk to the Pilotwardrobe crew about orders, escrow, disputes or selling.', canonicalPath: '/contact' })
const auth = useAuthStore()
const ticket = ref<string | null>(null)

const form = useForm(
  { name: auth.displayName, email: auth.user?.email ?? '', topic: 'order', orderNumber: '', message: '' },
  { name: [required('Please tell us your name.')], email: [required('Enter your email address.'), email], message: [required('How can we help?'), minLength(10, 'Message')] },
)

const topics = [
  { value: 'order', label: 'An order or delivery' },
  { value: 'escrow', label: 'Escrow, payments or payouts' },
  { value: 'dispute', label: 'A dispute' },
  { value: 'selling', label: 'Selling or listings' },
  { value: 'account', label: 'My account or verification' },
  { value: 'other', label: 'Something else' },
]

async function submit() {
  const res = await form.submit((v) => contentService.contact({ ...v, orderNumber: v.orderNumber || undefined }))
  if (res) ticket.value = res.ticket
}
</script>

<template>
  <div class="pw-container pw-contact">
    <div class="pw-contact__grid">
      <div>
        <h1 class="pw-page-title">Contact us</h1>
        <p class="pw-page-sub">Our crew replies within 4 hours, 7 days a week.</p>
        <ul class="pw-contact__info" role="list">
          <li><Clock :size="18" aria-hidden="true" /> First response in under 4 hours</li>
          <li><Mail :size="18" aria-hidden="true" /> support@pilotwardrobe.com</li>
          <li><MapPin :size="18" aria-hidden="true" /> Suite C8, Mediatrix Of All Graces Plaza, 79 Stadium Road, Port Harcourt</li>
        </ul>
      </div>

      <div class="pw-card pw-card-pad">
        <AppEmptyState v-if="ticket" :icon="CircleCheck" tone="success" title="Message received" :body="`Your reference is ${ticket}. We've emailed a copy to ${form.values.email}.`" compact>
          <AppButton variant="secondary" @click="(ticket = null), form.reset()">Send another</AppButton>
        </AppEmptyState>
        <form v-else class="pw-contact__form" novalidate @submit.prevent="submit">
          <div class="pw-contact__row">
            <AppInput v-model="form.values.name" label="Your name" autocomplete="name" :error="form.fieldError('name')" @blur="form.touch('name')" />
            <AppInput v-model="form.values.email" label="Email" type="email" autocomplete="email" :error="form.fieldError('email')" @blur="form.touch('email')" />
          </div>
          <div class="pw-contact__row">
            <AppSelect v-model="form.values.topic" label="Topic" :options="topics" />
            <AppInput v-model="form.values.orderNumber" label="Order number (optional)" placeholder="PW-4471" />
          </div>
          <AppTextarea v-model="form.values.message" label="Message" :rows="6" :maxlength="2000" show-count :error="form.fieldError('message')" @blur="form.touch('message')" />
          <p v-if="form.formError.value" class="pw-contact__error" role="alert">{{ form.formError.value }}</p>
          <AppButton type="submit" size="lg" :loading="form.submitting.value">Send message</AppButton>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pw-contact {
  padding-top: var(--pw-space-10);
  padding-bottom: var(--pw-space-16);
}

.pw-contact__grid {
  display: grid;
  gap: var(--pw-space-8);
}

.pw-contact__info {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-6);
  color: var(--pw-ink-2);
}

.pw-contact__info li {
  display: flex;
  gap: var(--pw-space-3);
}

.pw-contact__info svg {
  flex: none;
  color: var(--pw-navy-700);
}

.pw-contact__form {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
}

.pw-contact__row {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-contact__error {
  color: var(--pw-danger-600);
}

@media (min-width: 640px) {
  .pw-contact__row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .pw-contact__grid {
    grid-template-columns: 1fr 1.4fr;
  }
}
</style>
