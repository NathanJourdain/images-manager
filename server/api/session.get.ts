export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event)

  return {
    authenticated: !!session.data?.authenticated,
    username: session.data?.username || null
  }
})
