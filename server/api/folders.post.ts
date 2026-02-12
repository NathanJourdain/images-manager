import { existsSync, mkdirSync } from 'fs'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const name = body.name
  const parentPath = body.path || '' // Parent folder path, empty string for root

  if (!name || typeof name !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom du dossier est requis'
    })
  }

  // Validate folder name (alphanumeric, dashes, underscores only)
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom du dossier ne peut contenir que des lettres, chiffres, tirets et underscores'
    })
  }

  ensureStorageStructure()

  // Construct the full relative path for the new folder
  const newFolderRelPath = parentPath ? `${parentPath}/${name}` : name
  const fullPath = getFolderPath(newFolderRelPath, 'originals')

  if (existsSync(fullPath)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ce dossier existe déjà'
    })
  }

  mkdirSync(fullPath, { recursive: true })

  return { success: true, name, path: newFolderRelPath }
})
