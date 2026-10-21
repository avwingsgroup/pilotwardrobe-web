<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'
import AppFileDrop from '@/components/forms/AppFileDrop.vue'
import AppImage from '@/components/common/AppImage.vue'
import { mediaService } from '@/api/listings.api'
import { toApiError } from '@/api/errors'
import type { MediaAsset } from '@/types/media'

/**
 * Listing photos (VB1): upload to Laravel (→ Cloudinary), progress per file,
 * remove, reorder by drag or ←/→ buttons (keyboard accessible). First = cover.
 */
const props = withDefaults(defineProps<{ max?: number }>(), { max: 8 })
const photos = defineModel<MediaAsset[]>({ required: true })
const uploads = ref<{ id: string; name: string; progress: number; error?: string }[]>([])
const dragIndex = ref<number | null>(null)
const announce = ref('')

async function onFiles(files: File[]) {
  const room = props.max - photos.value.length - uploads.value.length
  for (const file of files.slice(0, Math.max(0, room))) {
    const job = { id: `${Date.now()}-${file.name}`, name: file.name, progress: 0 as number, error: undefined as string | undefined }
    uploads.value.push(job)
    try {
      const asset = await mediaService.upload(file, 'listing', (p) => {
        const j = uploads.value.find((u) => u.id === job.id)
        if (j) j.progress = p
      })
      photos.value = [...photos.value, asset]
      uploads.value = uploads.value.filter((u) => u.id !== job.id)
      announce.value = `${file.name} uploaded`
    } catch (e) {
      const j = uploads.value.find((u) => u.id === job.id)
      if (j) j.error = toApiError(e).field('file') ?? toApiError(e).message
    }
  }
}

function remove(i: number) {
  const removed = photos.value[i]
  photos.value = photos.value.filter((_, idx) => idx !== i)
  announce.value = `Photo ${i + 1} removed`
  if (removed && !removed.id.startsWith('med_')) void mediaService.remove(removed.id).catch(() => undefined)
}

function move(from: number, to: number) {
  if (to < 0 || to >= photos.value.length) return
  const next = photos.value.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  photos.value = next
  announce.value = `Photo moved to position ${to + 1}${to === 0 ? ', now the cover' : ''}`
}

function onDrop(i: number) {
  if (dragIndex.value !== null) move(dragIndex.value, i)
  dragIndex.value = null
}
</script>

<template>
  <div class="pw-photos">
    <ul class="pw-photos__grid" role="list">
      <li
        v-for="(p, i) in photos"
        :key="p.id"
        class="pw-photos__item"
        :class="{ 'is-cover': i === 0 }"
        draggable="true"
        @dragstart="dragIndex = i"
        @dragover.prevent
        @drop="onDrop(i)"
      >
        <AppImage :media="p" ratio="1" fit="contain" sizes="140px" />
        <span v-if="i === 0" class="pw-photos__cover">Cover</span>
        <button type="button" class="pw-photos__remove" :aria-label="`Remove photo ${i + 1}`" @click="remove(i)"><X :size="14" /></button>
        <div class="pw-photos__move">
          <button type="button" :disabled="i === 0" :aria-label="`Move photo ${i + 1} left`" @click="move(i, i - 1)"><ChevronLeft :size="14" /></button>
          <button type="button" :disabled="i === photos.length - 1" :aria-label="`Move photo ${i + 1} right`" @click="move(i, i + 1)"><ChevronRight :size="14" /></button>
        </div>
      </li>
      <li v-for="u in uploads" :key="u.id" class="pw-photos__item pw-photos__uploading" :class="{ 'has-error': !!u.error }">
        <span class="pw-photos__name">{{ u.name }}</span>
        <span v-if="u.error" class="pw-photos__err" role="alert">{{ u.error }}</span>
        <span v-else class="pw-photos__bar" role="progressbar" :aria-valuenow="u.progress" aria-valuemin="0" aria-valuemax="100" :aria-label="`Uploading ${u.name}`"><span :style="{ width: `${u.progress}%` }" /></span>
        <button v-if="u.error" type="button" class="pw-photos__remove" aria-label="Dismiss failed upload" @click="uploads = uploads.filter((x) => x.id !== u.id)"><X :size="14" /></button>
      </li>
      <li v-if="photos.length + uploads.length < max" class="pw-photos__add">
        <AppFileDrop label="Add photos" hint="or drop files" multiple compact @files="onFiles" @rejected="announce = $event" />
      </li>
    </ul>
    <p class="pw-photos__hint">JPG, PNG or HEIC · min 1000px · first photo is the cover · drag or use arrows to reorder</p>
    <p class="sr-only" aria-live="polite">{{ announce }}</p>
  </div>
</template>

<style scoped>
.pw-photos__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--pw-space-3);
}

.pw-photos__item {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  cursor: grab;
}

.pw-photos__item.is-cover {
  border: 2px solid var(--pw-navy-700);
}

.pw-photos__cover {
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 3px 6px;
  border-radius: var(--pw-radius-xs);
  background: var(--pw-navy-700);
  color: #fff;
  font-size: 0.625rem;
  font-weight: var(--pw-weight-bold);
  text-transform: uppercase;
}

.pw-photos__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 92%);
  box-shadow: var(--pw-shadow-sm);
}

.pw-photos__move {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--pw-duration) var(--pw-ease);
}

.pw-photos__item:hover .pw-photos__move,
.pw-photos__item:focus-within .pw-photos__move {
  opacity: 1;
}

.pw-photos__move button {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: var(--pw-radius-sm);
  background: rgb(255 255 255 / 92%);
}

.pw-photos__move button:disabled {
  opacity: 0.35;
}

.pw-photos__uploading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--pw-space-2);
  aspect-ratio: 1;
  padding: var(--pw-space-3);
  cursor: default;
}

.pw-photos__uploading.has-error {
  border-color: var(--pw-danger-600);
}

.pw-photos__name {
  font-size: var(--pw-text-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pw-photos__bar {
  height: 4px;
  border-radius: 2px;
  background: var(--pw-border);
  overflow: hidden;
}

.pw-photos__bar span {
  display: block;
  height: 100%;
  background: var(--pw-navy-700);
  transition: width var(--pw-duration) linear;
}

.pw-photos__err {
  font-size: var(--pw-text-xs);
  color: var(--pw-danger-600);
}

.pw-photos__add :deep(.pw-drop) {
  aspect-ratio: 1;
}

.pw-photos__add :deep(.pw-drop__label) {
  min-height: 0;
}

.pw-photos__hint {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

@media (hover: none) {
  .pw-photos__move {
    opacity: 1;
  }
}
</style>
