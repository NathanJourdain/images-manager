import { readdirSync, statSync, existsSync } from 'fs'
import { join, extname } from 'path'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const path = (query.path as string) || ''
  const page = parseInt(query.page as string) || 1
  const perPage = parseInt(query.perPage as string) || 20

  ensureStorageStructure()

  const folderPath = getFolderPath(path, 'originals')
  const cacheFolderPath = getFolderPath(path, 'cache')

  try {
    if (!existsSync(folderPath)) {
      return {
        images: [],
        pagination: { page: 1, perPage, total: 0, totalPages: 0 }
      }
    }

    const allFiles = readdirSync(folderPath)
      .filter(f => !f.startsWith('.'))
      .filter(f => {
        const fileStat = statSync(join(folderPath, f))
        if (fileStat.isDirectory()) return false
        const ext = extname(f).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.bmp', '.tiff'].includes(ext)
      })

    // Get cache variants count for each image
    let cacheFiles: string[] = []
    try {
      if (existsSync(cacheFolderPath)) {
        cacheFiles = readdirSync(cacheFolderPath).filter(f => !f.startsWith('.'))
      }
    } catch {
      // Cache folder might not exist yet
    }

    const totalFiles = allFiles.length
    const totalPages = Math.ceil(totalFiles / perPage)
    const startIndex = (page - 1) * perPage
    const paginatedFiles = allFiles.slice(startIndex, startIndex + perPage)

    const images = paginatedFiles.map(filename => {
      const filePath = join(folderPath, filename)
      const stats = statSync(filePath)
      const baseName = filename.replace(extname(filename), '')

      // Count cache variants for this image
      const variants = cacheFiles.filter(cf => cf.startsWith(baseName + '_')).length

      return {
        filename,
        path,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
        variants,
        url: path ? `/render/${path}/${filename}` : `/render/${filename}`
      }
    })

    return {
      images,
      pagination: {
        page,
        perPage,
        total: totalFiles,
        totalPages
      }
    }
  } catch {
    return {
      images: [],
      pagination: { page: 1, perPage, total: 0, totalPages: 0 }
    }
  }
})
