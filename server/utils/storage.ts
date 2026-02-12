import { resolve, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const STORAGE_ROOT = resolve(process.cwd(), 'storage')
const ORIGINALS_DIR = join(STORAGE_ROOT, 'originals')
const CACHE_DIR = join(STORAGE_ROOT, 'cache')

export function getStorageRoot() {
  return STORAGE_ROOT
}

export function getOriginalsDir() {
  return ORIGINALS_DIR
}

export function getCacheDir() {
  return CACHE_DIR
}

export function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export function ensureStorageStructure() {
  ensureDir(ORIGINALS_DIR)
  ensureDir(CACHE_DIR)
}

/**
 * Get the full filesystem path for a given relative path.
 * Supports nested paths like "blog/2024/summer".
 * If path is empty/null, returns the base directory (root).
 */
export function getFolderPath(path: string | undefined | null, base: 'originals' | 'cache' = 'originals') {
  const baseDir = base === 'originals' ? ORIGINALS_DIR : CACHE_DIR

  if (!path || path === '/' || path === '.' || path === '') {
    return baseDir
  }

  // Prevent directory traversal
  const safePath = path.replace(/\.\./g, '').replace(/^\/+/, '')
  return join(baseDir, safePath)
}
