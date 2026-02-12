import { existsSync, createReadStream } from 'fs'
import { join, extname } from 'path'
import { createHash } from 'crypto'
import sharp from 'sharp'
import { validateImageRequest } from '../../utils/validate-image'

export default defineEventHandler(async (event) => {
  let params
  try {
    params = validateImageRequest(event)
  } catch (e: any) {
    setResponseStatus(event, 400, e.message)
    return e.message
  }

  const { folder, filename, options } = params
  const { w, h, q, fit, fm } = options

  // Build source path
  const sourcePath = join(getFolderPath(folder, 'originals'), filename)

  if (!existsSync(sourcePath)) {
    setResponseStatus(event, 404, 'image not found')
    return 'image not found'
  }

  // If no transforms, serve original
  const hasTransforms = w || h || fm
  if (!hasTransforms) {
    const ext = extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff'
    }

    setResponseHeader(event, 'Content-Type', mimeTypes[ext] || 'application/octet-stream')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    return sendStream(event, createReadStream(sourcePath))
  }

  // Build cache key from params
  const paramsHash = createHash('md5')
    .update(JSON.stringify({ w, h, q, fit, fm }))
    .digest('hex')
    .substring(0, 12)

  const baseName = filename.replace(extname(filename), '')
  const outputFormat = fm || 'webp'
  const cacheFilename = `${baseName}_${paramsHash}.${outputFormat}`

  // Ensure cache folder
  const cacheFolderPath = getFolderPath(folder, 'cache')
  ensureDir(cacheFolderPath)

  const cachePath = join(cacheFolderPath, cacheFilename)

  // Check cache
  if (existsSync(cachePath)) {
    const mimeTypes: Record<string, string> = {
      webp: 'image/webp',
      avif: 'image/avif',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png'
    }

    setResponseHeader(event, 'Content-Type', mimeTypes[outputFormat] || 'image/webp')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    setResponseHeader(event, 'X-Cache', 'HIT')
    return sendStream(event, createReadStream(cachePath))
  }

  // Transform image with Sharp
  try {
    let pipeline = sharp(sourcePath)

    if (w || h) {
      pipeline = pipeline.resize({
        width: w,
        height: h,
        fit: fit as keyof sharp.FitEnum,
        withoutEnlargement: true
      })
    }

    switch (outputFormat) {
      case 'webp':
        pipeline = pipeline.webp({ quality: q })
        break
      case 'avif':
        pipeline = pipeline.avif({ quality: q })
        break
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: q })
        break
      case 'png':
        pipeline = pipeline.png({ quality: q })
        break
    }

    // Save to cache
    await pipeline.toFile(cachePath)

    // Serve from cache
    const mimeTypes: Record<string, string> = {
      webp: 'image/webp',
      avif: 'image/avif',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png'
    }

    setResponseHeader(event, 'Content-Type', mimeTypes[outputFormat] || 'image/webp')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    setResponseHeader(event, 'X-Cache', 'MISS')
    return sendStream(event, createReadStream(cachePath))
  } catch (err) {
    setResponseStatus(event, 500, 'Erreur lors du traitement de l\'image')
    return 'Erreur lors du traitement de l\'image'
  }
})
