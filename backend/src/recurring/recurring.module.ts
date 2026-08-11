import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringTransaction } from '../database/entities/recurring-transaction.entity';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { RecurringService } from './recurring.service';
import { RecurringController } from './recurring.controller';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecurringTransaction, Account, Transaction]),
    TransactionsModule,
  ],
  controllers: [RecurringController],
  providers: [RecurringService],
  exports: [RecurringService],
})
export class RecurringModule {}
