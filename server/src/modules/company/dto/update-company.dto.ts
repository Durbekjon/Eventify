import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class UpdateSelfCompanyDto {
  @ApiProperty({ description: 'Company name' })
  @IsNotEmpty()
  name: string
}
