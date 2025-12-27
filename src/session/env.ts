const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const

export type RequiredEnvKey = (typeof REQUIRED_KEYS)[number]

export function requireEnv(key: RequiredEnvKey): string {
  const value = import.meta.env[key]
  if (typeof value === 'string' && value.trim().length > 0) return value

  // Vite populates import.meta.env from either:
  // - OS environment variables available at dev/build time, or
  // - .env files (e.g. .env.local, .env.production, .env.production.local)
  const hint = REQUIRED_KEYS.map((k) => k).join(', ')
  throw new Error(`Missing required env var: ${key}. Configure one of: ${hint}`)
}
