import { writeFileSync } from 'fs'
import { join, extname } from 'path'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Aucun fichier fourni'
    })
  }

  // Find path field (supports nested paths, empty = root)
  const pathField = formData.find(f => f.name === 'path')
  const path = pathField?.data.toString() || ''

  // Ensure target directory exists
  const targetDir = getFolderPath(path, 'originals')
  ensureDir(targetDir)

  const uploadedFiles: Array<{ originalName: string, filename: string, path: string, url: string }> = []

  for (const file of formData) {
    if (file.name === 'path') continue
    if (!file.filename) continue

    const ext = extname(file.filename).toLowerCase()
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.bmp', '.tiff']

    if (!allowedExts.includes(ext)) {
      continue
    }

    const uuid = uuidv4()
    const newFilename = `${uuid}${ext}`
    const filePath = join(targetDir, newFilename)

    writeFileSync(filePath, file.data)

    uploadedFiles.push({
      originalName: file.filename,
      filename: newFilename,
      path,
      url: path ? `/render/${path}/${newFilename}` : `/render/${newFilename}`
    })
  }

  if (uploadedFiles.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Aucun fichier valide'
    })
  }

  return {
    success: true,
    files: uploadedFiles
  }
})
