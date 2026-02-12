import { readdirSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const path = (query.path as string) || ''

  ensureStorageStructure()

  const currentDir = getFolderPath(path, 'originals')

  try {
    const entries = readdirSync(currentDir, { withFileTypes: true })
    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => {
        const folderFullPath = join(currentDir, entry.name)
        const children = readdirSync(folderFullPath).filter(f => !f.startsWith('.'))
        return {
          name: entry.name,
          path: path ? `${path}/${entry.name}` : entry.name,
          count: children.length
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return { folders }
  } catch {
    return { folders: [] }
  }
})
