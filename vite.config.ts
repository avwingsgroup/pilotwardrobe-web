import { rm } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/** Live builds must not ship mock fixtures' demo imagery (public/media/mock). */
function stripMockMedia(enabled: boolean): Plugin {
  return {
    name: 'pw-strip-mock-media',
    apply: 'build',
    async closeBundle() {
      if (!enabled) return
      await rm(fileURLToPath(new URL('./dist/media/mock', import.meta.url)), { recursive: true, force: true })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
  const live = env.VITE_API_MODE === 'live'

  return {
    plugins: [vue(), stripMockMedia(live)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
    },
    build: {
      target: 'es2022',
      sourcemap: false,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            http: ['axios'],
          },
        },
      },
    },
  }
})
