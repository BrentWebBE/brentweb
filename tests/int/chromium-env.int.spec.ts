import { describe, expect, it } from 'vitest'

import { chromiumEnv } from '@/lib/screenshots/capture'

describe('chromiumEnv', () => {
  it('keeps only the allowlisted, non-secret variables', () => {
    const env = chromiumEnv({
      PATH: '/usr/bin',
      HOME: '/tmp',
      PAYLOAD_SECRET: 'secret',
      DATABASE_URI: 'mongodb://db',
      RESEND_API_KEY: 're_x',
      ANTHROPIC_API_KEY: 'sk-x',
      LANG: '',
    })
    expect(env).toEqual({ PATH: '/usr/bin', HOME: '/tmp' })
  })
})
