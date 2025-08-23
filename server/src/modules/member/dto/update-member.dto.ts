import { ApiProperty } from '@nestjs/swagger'
import { MemberPermissions, MemberTypes, ViewType } from '@prisma/client'
import { IsArray, IsEnum, IsOptional } from 'class-validator'

export class UpdateMemberDto {
  @ApiProperty({
    description: `Member type: ${MemberTypes.MEMBER} or ${MemberTypes.VIEWER}`,
    example: MemberTypes.MEMBER,
  })
  @IsEnum(MemberTypes)
  @IsOptional()
  type: MemberTypes

  @ApiProperty({
    description: `Permissions: CREATE, READ, UPDATE, DELETE, or ALL`,
    type: [String], // Change this to String because enums are not supported in the array type
    example: [MemberPermissions.ALL],
  })
  @IsOptional()
  permissions: MemberPermissions[]

  @ApiProperty({
    description: `View type: ${ViewType.ALL} or ${ViewType.OWN}`,
  })
  @IsEnum(ViewType)
  @IsOptional()
  view?: ViewType

  @ApiProperty({
    description: 'Access to workspaces',
    type: [String],
    nullable: true,
  })
  @IsArray()
  @IsOptional()
  workspaces?: string[] | null
}
