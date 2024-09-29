import { ApiProperty } from '@nestjs/swagger'
import { MemberPermissions, MemberTypes, ViewType } from '@prisma/client'
import { IsEnum, IsNotEmpty } from 'class-validator'

export class UpdateMemberDto {
  @ApiProperty({
    description: `Member type: ${MemberTypes.MEMBER} or ${MemberTypes.VIEWER}`,
    example: MemberTypes.MEMBER,
  })
  @IsEnum(MemberTypes)
  @IsNotEmpty()
  type: MemberTypes

  @ApiProperty({
    description: `permissions: CREATE, READ, UPDATE, DELETE or ALL`,
    example: MemberPermissions.ALL,
  })
  @IsNotEmpty()
  permissions: MemberPermissions[]

  @ApiProperty({
    description: `View type: ${ViewType.ALL} or ${ViewType.OWN}`,
  })
  @IsEnum(ViewType)
  view: ViewType
}
