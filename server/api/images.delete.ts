import { unlinkSync, readdirSync, existsSync } from 'fs'
import { join, extname } from 'path'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody(event)
  const { path, filename } = body

  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le paramètre filename est requis'
    })
  }

  // path can be empty string for root
  const currentPath = path || ''
  const filePath = join(getFolderPath(currentPath, 'originals'), filename)

  // Delete source file
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la suppression du fichier source'
    })
  }

  // Purge cached variants
  const cacheFolderPath = getFolderPath(currentPath, 'cache')
  try {
    if (existsSync(cacheFolderPath)) {
      const baseName = filename.replace(extname(filename), '')
      const cacheFiles = readdirSync(cacheFolderPath)
      cacheFiles
        .filter(cf => cf.startsWith(baseName + '_'))
        .forEach(cf => {
          unlinkSync(join(cacheFolderPath, cf))
        })
    }
  } catch {
    // Cache cleanup failed, not critical
  }

  return { success: true }
})
