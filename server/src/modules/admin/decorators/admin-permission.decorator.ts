import { SetMetadata } from '@nestjs/common'
import { AdminPermission } from '../types/admin-permissions.types'

export const RequireAdminPermission = (...permissions: AdminPermission[]) =>
  SetMetadata('adminPermissions', permissions)
