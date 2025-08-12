import { SetMetadata } from '@nestjs/common'

export const AdminAudit = (action?: string) =>
  SetMetadata('adminAudit', { action })
