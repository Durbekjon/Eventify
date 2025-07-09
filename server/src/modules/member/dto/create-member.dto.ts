import { ApiProperty } from '@nestjs/swagger'
import { MemberPermissions, MemberTypes, ViewType } from '@prisma/client'
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator'

export class CreateMemberDto {
  @ApiProperty({
    description: `Member type: ${MemberTypes.MEMBER} or ${MemberTypes.VIEWER}`,
    example: MemberTypes.MEMBER,
  })
  @IsEnum(MemberTypes)
  @IsNotEmpty()
  type: MemberTypes

  @ApiProperty({
    description: `Permissions: CREATE, READ, UPDATE, DELETE, or ALL`,
    type: [String], // Change this to String because enums are not supported in the array type
    example: [MemberPermissions.ALL],
  })
  @IsNotEmpty()
  permissions: MemberPermissions[]

  @ApiProperty({
    description: `View type: ${ViewType.ALL} or ${ViewType.OWN}`,
  })
  @IsEnum(ViewType)
  @IsOptional()
  view?: ViewType

  @ApiProperty({ description: 'User UUID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string

  @ApiProperty({
    description: 'Access to workspaces',
    type: [String],
    nullable: true,
  })
  @IsArray()
  @IsOptional()
  workspaces?: string[] | null
}
