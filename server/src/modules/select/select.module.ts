import { Module } from '@nestjs/common';
import { SelectController } from './select.controller';
import { SelectService } from './select.service';

@Module({
  controllers: [SelectController],
  providers: [SelectService]
})
export class SelectModule {}
