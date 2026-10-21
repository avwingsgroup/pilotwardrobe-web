import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      environment: 'jsdom',
      include: ['tests/unit/**/*.spec.ts'],
      exclude: [...configDefaults.exclude, 'tests/e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['tests/unit/setup.ts'],
      env: {
        VITE_API_MODE: 'mock',
        VITE_MOCK_LATENCY_MS: '0',
        VITE_API_BASE_URL: '/api/v1',
      },
    },
  }),
)
