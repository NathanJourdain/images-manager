import type { H3Event } from 'h3'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'

const SESSION_SECRET = process.env.SESSION_SECRET || 'sharpstore-secret-key-change-me-in-production'

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export async function requireAuth(event: H3Event) {
  const session = await useSession(event, { password: SESSION_SECRET })

  if (!session.data?.authenticated) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé'
    })
  }

  return session
}

export async function getAuthSession(event: H3Event) {
  return useSession(event, { password: SESSION_SECRET })
}
