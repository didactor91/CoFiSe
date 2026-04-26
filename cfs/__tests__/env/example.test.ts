import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('.env.example Environment Configuration', () => {
  const envExamplePath = join(process.cwd(), '.env.example')
  let envContent: string

  beforeAll(() => {
    if (!existsSync(envExamplePath)) {
      throw new Error('.env.example does not exist at project root')
    }
    envContent = readFileSync(envExamplePath, 'utf-8')
  })

  it('.env.example has JWT_SECRET variable', () => {
    expect(envContent).toContain('JWT_SECRET')
  })

  it('.env.example has DATABASE_PATH variable', () => {
    expect(envContent).toContain('DATABASE_PATH')
  })

  it('.env.example has PORT_CLIENT variable', () => {
    expect(envContent).toContain('PORT_CLIENT')
  })

  it('.env.example has PORT_SERVER variable', () => {
    expect(envContent).toContain('PORT_SERVER')
  })

  it('.env.example has placeholder values (not empty)', () => {
    const lines = envContent.split('\n').filter((line) => line.includes('='))
    lines.forEach((line) => {
      const [key, value] = line.split('=')
      expect(value.trim().length).toBeGreaterThan(0)
    })
  })
})
