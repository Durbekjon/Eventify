import { RoleTypes } from '@prisma/client'

export class CreateRoleDto {
  user: string
  company: string
  type: RoleTypes
  access: string | null
}
