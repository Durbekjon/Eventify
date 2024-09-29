import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UtilsModule } from './utils/utils.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [PrismaModule, UtilsModule, EmailModule]
})
export class CoreModule {}
