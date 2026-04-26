import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Caddyfile Configuration', () => {
  const caddyfilePath = join(process.cwd(), 'Caddyfile')
  let caddyfileContent: string

  beforeAll(() => {
    if (!existsSync(caddyfilePath)) {
      throw new Error('Caddyfile does not exist at project root')
    }
    caddyfileContent = readFileSync(caddyfilePath, 'utf-8')
  })

  it('Caddyfile has correct domain for seno.didtor.dev', () => {
    expect(caddyfileContent).toContain('seno.didtor.dev')
  })

  it('Caddyfile has proxy route for /api/* to localhost:4000', () => {
    expect(caddyfileContent).toContain('reverse_proxy')
    expect(caddyfileContent).toMatch(/reverse_proxy\s+\/api\/\*\s+localhost:4000/)
  })

  it('Caddyfile has proxy route for /* to localhost:3000', () => {
    expect(caddyfileContent).toMatch(/reverse_proxy\s+\/\*\s+localhost:3000/)
  })

  it("Caddyfile enables TLS with Let's Encrypt", () => {
    expect(caddyfileContent).toContain('tls')
    expect(caddyfileContent).toContain('issuer_acme_v2')
  })
})
