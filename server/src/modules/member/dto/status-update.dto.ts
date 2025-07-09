import { ApiProperty } from '@nestjs/swagger'
import { MemberStatus } from '@prisma/client'
import { IsEnum, IsNotEmpty } from 'class-validator'

export class StatusUpdateDto {
  @ApiProperty({
    description: `Member status: ${MemberStatus.ACTIVE} or ${MemberStatus.REJECTED}`,
    enum: [MemberStatus.ACTIVE, MemberStatus.REJECTED],
  })
  @IsEnum(MemberStatus)
  @IsNotEmpty()
  status: MemberStatus
}
