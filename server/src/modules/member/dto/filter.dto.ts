import { MemberStatus, MemberTypes, ViewType } from '@prisma/client'

export class FilterDto {
  type: MemberTypes
  status: MemberStatus
  view: ViewType
}
