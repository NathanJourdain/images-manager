export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nom d\'utilisateur et mot de passe requis'
    })
  }

  if (!validateCredentials(username, password)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Identifiants invalides'
    })
  }

  const session = await getAuthSession(event)
  await session.update({ authenticated: true, username })

  return { success: true }
})
