import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { UserModule } from '@user/user.module';
import { RoleModule } from '@role/role.module';
import { TransactionRepository } from './transaction.repository';
import { CoreModule } from '@core/core.module';
import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository],
  imports: [UserModule, RoleModule, CoreModule, PrismaModule],
})
export class TransactionModule {}
