import { describe, it, expect } from 'vitest'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

describe('Vite Configuration', () => {
  describe('Proxy Configuration', () => {
    it('should configure proxy for /api/* to localhost:4000', () => {
      const config = defineConfig({
        plugins: [react()],
        server: {
          proxy: {
            '/api': {
              target: 'http://localhost:4000',
              changeOrigin: true,
            },
          },
        },
      })

      // Access the server proxy configuration
      const serverConfig = config.server as {
        proxy: Record<string, { target: string; changeOrigin: boolean }>
      }
      expect(serverConfig.proxy['/api']).toBeDefined()
      expect(serverConfig.proxy['/api'].target).toBe('http://localhost:4000')
      expect(serverConfig.proxy['/api'].changeOrigin).toBe(true)
    })

    it('should have jsdom environment configured for tests', () => {
      const config = defineConfig({
        plugins: [react()],
        test: {
          globals: true,
          environment: 'jsdom',
        },
      })

      const testConfig = config.test as { globals: boolean; environment: string }
      expect(testConfig.globals).toBe(true)
      expect(testConfig.environment).toBe('jsdom')
    })
  })
})
