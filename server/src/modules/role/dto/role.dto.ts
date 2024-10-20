import {
  MemberPermissions,
  MemberStatus,
  MemberTypes,
  RoleTypes,
  ViewType,
} from '@prisma/client'

export interface RoleDto {
  id: string
  companyId: string
  company: {
    id: string
    name: string
    isBlocked: boolean
  }
  type: RoleTypes
  access: {
    id: string
    createdAt: Date
    companyId: string
    updatedAt: Date
    type: MemberTypes
    permissions: MemberPermissions[]
    view: ViewType
    status: MemberStatus
    userId: string
    notificationId: string
    workspaces: {
      // This is the required property
      id: string
      name: string
      order: number
      createdAt: Date
      companyId: string
    }[]
  }
}
