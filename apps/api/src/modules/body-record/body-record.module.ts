import { Module } from '@nestjs/common';
import { BodyRecordController } from './body-record.controller';
import { BodyRecordService } from './body-record.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BodyRecordController],
  providers: [BodyRecordService],
})
export class BodyRecordModule {}
