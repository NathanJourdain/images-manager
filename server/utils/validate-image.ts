import { z } from 'zod'
import type { H3Event } from 'h3'

const ImageOptionsSchema = z.object({
  w: z.coerce.number()
    .int('Width must be an integer')
    .min(1, 'Width must be positive')
    .max(8000, 'Width too large (max 8000)')
    .optional(),
  h: z.coerce.number()
    .int('Height must be an integer')
    .min(1, 'Height must be positive')
    .max(8000, 'Height too large (max 8000)')
    .optional(),
  q: z.coerce.number()
    .int('Quality must be an integer')
    .min(1, 'Quality must be between 1 and 100')
    .max(100, 'Quality must be between 1 and 100')
    .default(80),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover'),
  fm: z.enum(['webp', 'avif', 'jpg', 'jpeg', 'png', 'gif']).optional()
})

export type ImageOptions = z.infer<typeof ImageOptionsSchema>

export function validateImageRequest(event: H3Event) {
  const params = getRouterParams(event)
  const query = getQuery(event)

  const path = params._ || params.path

  if (!path) {
    throw new Error('Path required')
  }

  const parts = path.split('/')
  const filename = parts.pop()

  if (!filename) {
    throw new Error('Filename required')
  }

  const folder = parts.join('/')

  const result = ImageOptionsSchema.safeParse(query)

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message || 'Invalid parameters')
  }

  return {
    folder,
    filename,
    options: result.data
  }
}
