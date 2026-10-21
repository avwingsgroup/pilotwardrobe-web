<script setup lang="ts">
import AuthHeading from '@/components/auth/AuthHeading.vue'
import SocialButtons from '@/components/auth/SocialButtons.vue'
import OrDivider from '@/components/auth/OrDivider.vue'
import EmailStartForm from '@/components/auth/EmailStartForm.vue'
import { useSeo } from '@/composables/useSeo'

useSeo({ title: 'Welcome aboard', noindex: true })
</script>

<template>
  <div>
    <AuthHeading title="Welcome aboard" subtitle="Sign in or create an account. We'll check whether your email is already registered." />
    <SocialButtons />
    <OrDivider label="or use your email" />
    <EmailStartForm />
    <p class="pw-legal">
      By continuing you agree to the Pilotwardrobe <RouterLink to="/terms">Terms of Service</RouterLink> and <RouterLink to="/privacy">Privacy Policy</RouterLink>.
    </p>
  </div>
</template>

<style scoped>
.pw-legal {
  margin-top: var(--pw-space-6);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
  text-align: center;
  line-height: var(--pw-leading-relaxed);
}

.pw-legal a {
  font-weight: var(--pw-weight-semibold);
  text-decoration: underline;
}
</style>
