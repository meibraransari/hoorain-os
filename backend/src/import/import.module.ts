import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { CashewImportLog } from '../database/entities/cashew-import-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashewImportLog])],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
