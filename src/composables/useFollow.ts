import { ref, type Ref } from 'vue'
import { sellerService } from '@/api/account.api'
import { toApiError } from '@/api/errors'
import { useGatedAction } from './useGatedAction'
import { useUiStore } from '@/stores/ui.store'
import type { SellerProfile } from '@/types/user'

/** Optimistic follow/unfollow for seller & photographer profiles. */
export function useFollow(profile: Ref<SellerProfile | null>) {
  const gate = useGatedAction()
  const ui = useUiStore()
  const busy = ref(false)

  function toggle() {
    const p = profile.value
    if (!p) return
    gate(
      async () => {
        busy.value = true
        const following = !!p.isFollowing
        profile.value = { ...p, isFollowing: !following, followers: p.followers + (following ? -1 : 1) }
        try {
          const res = following ? await sellerService.unfollow(p.username) : await sellerService.follow(p.username)
          profile.value = { ...profile.value!, followers: res.followers }
        } catch (e) {
          profile.value = p
          ui.error("Couldn't update follow", toApiError(e).message)
        } finally {
          busy.value = false
        }
      },
      { intent: `To follow ${p.displayName}` },
    )
  }

  return { toggle, busy }
}
