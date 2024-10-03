import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class ChangeRoleDto {
  @ApiProperty({ description: 'Role id by user roles' })
  @IsNotEmpty()
  roleId: string
}
