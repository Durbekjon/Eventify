import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class UpdateCompanyDto {
  @ApiProperty({ description: 'Company name' })
  @IsNotEmpty()
  name: string
}
