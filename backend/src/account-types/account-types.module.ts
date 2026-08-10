import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountType } from '../database/entities/account-type.entity';
import { AccountTypesService } from './account-types.service';
import { AccountTypesController } from './account-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccountType])],
  controllers: [AccountTypesController],
  providers: [AccountTypesService],
  exports: [AccountTypesService],
})
export class AccountTypesModule {}
