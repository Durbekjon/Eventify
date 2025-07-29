import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateFileDto {
  @ApiProperty({ description: 'Task ID to attach file to', required: false })
  @IsOptional()
  @IsUUID()
  taskId?: string

  @ApiProperty({ description: 'Sheet ID to attach file to', required: false })
  @IsOptional()
  @IsUUID()
  sheetId?: string

  @ApiProperty({ description: 'Company ID', required: true })
  @IsString()
  companyId: string
}
