import { ApiProperty } from '@nestjs/swagger'
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator'
import { MemberTypes, MemberStatus, MemberPermissions } from '@prisma/client'

export class MemberDto {
  @ApiProperty({
    description: 'The unique identifier for the member',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  id: string

  @ApiProperty({
    description: 'The type of the member',
    enum: [MemberTypes.MEMBER, MemberTypes.VIEWER],
  })
  @IsEnum(MemberTypes)
  @IsNotEmpty()
  type: MemberTypes

  @ApiProperty({
    description: 'The status of the member',
    enum: [
      MemberStatus.NEW,
      MemberStatus.ACTIVE,
      MemberStatus.REJECTED,
      MemberStatus.CANCELLED,
    ],
    default: MemberStatus.NEW,
  })
  @IsEnum(MemberStatus)
  @IsOptional()
  status?: MemberStatus

  @ApiProperty({
    description: 'The permissions assigned to the member',
    type: [String],
    enum: [
      MemberPermissions.ALL,
      MemberPermissions.READ,
      MemberPermissions.CREATE,
      MemberPermissions.UPDATE,
      MemberPermissions.DELETE,
    ],
  })
  @IsArray()
  @IsEnum(MemberPermissions, { each: true })
  @IsOptional()
  permissions?: MemberPermissions[]

  @ApiProperty({
    description: 'The view access level for the member',
    enum: ['ALL', 'OWN'],
    default: 'OWN',
  })
  @IsString()
  @IsOptional()
  view?: 'ALL' | 'OWN'

  @ApiProperty({
    description: 'The ID of the user associated with this member',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsNotEmpty()
  userId: string

  @ApiProperty({
    description: 'The ID of the company associated with this member',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsString()
  @IsNotEmpty()
  companyId: string
}
