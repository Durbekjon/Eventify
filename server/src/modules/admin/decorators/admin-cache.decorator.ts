import { SetMetadata } from '@nestjs/common'

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  key?: string // Custom cache key
  skip?: boolean // Skip caching
}

export const AdminCache = (options: CacheOptions = {}) =>
  SetMetadata('adminCache', options)
