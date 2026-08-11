import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringTransaction, RecurringFrequency } from '../database/entities/recurring-transaction.entity';
import { Account } from '../database/entities/account.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class RecurringService {
  constructor(
    @InjectRepository(RecurringTransaction)
    private readonly recurringRepo: Repository<RecurringTransaction>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly transactionsService: TransactionsService,
  ) {}

  async findAll(userId: string): Promise<any[]> {
    const items = await this.recurringRepo.find({
      where: { userId },
      relations: ['account', 'category'],
      order: { nextDate: 'ASC' },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return items.map((item) => {
      const nextD = new Date(item.nextDate);
      nextD.setHours(0, 0, 0, 0);

      const diffTime = nextD.getTime() - now.getTime();
      const dueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isOverdue = dueDays < 0 && item.isActive;
      const isUpcoming = dueDays >= 0 && dueDays <= 30 && item.isActive;

      return {
        ...item,
        rawAmount: Number(item.amount),
        dueDays,
        isOverdue,
        isUpcoming,
        status: !item.isActive ? 'disabled' : isOverdue ? 'overdue' : isUpcoming ? 'upcoming' : 'normal',
      };
    });
  }

  async findOne(id: string, userId: string): Promise<RecurringTransaction> {
    const item = await this.recurringRepo.findOne({
      where: { id, userId },
      relations: ['account', 'category'],
    });
    if (!item) {
      throw new NotFoundException(`Recurring payment rule ${id} not found`);
    }
    return item;
  }

  async create(userId: string, dto: CreateRecurringDto): Promise<RecurringTransaction> {
    const item = this.recurringRepo.create({
      ...dto,
      userId,
      amount: Number(dto.amount),
      nextDate: new Date(dto.nextDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isActive: dto.isActive ?? true,
    });
    return this.recurringRepo.save(item);
  }

  async update(id: string, userId: string, dto: UpdateRecurringDto): Promise<RecurringTransaction> {
    const item = await this.findOne(id, userId);
    if (dto.nextDate) {
      dto.nextDate = new Date(dto.nextDate) as any;
    }
    if (dto.endDate) {
      dto.endDate = new Date(dto.endDate) as any;
    }
    if (dto.amount !== undefined) {
      dto.amount = Number(dto.amount) as any;
    }
    Object.assign(item, dto);
    return this.recurringRepo.save(item);
  }

  async remove(id: string, userId: string): Promise<{ id: string; success: boolean }> {
    const item = await this.findOne(id, userId);
    await this.recurringRepo.remove(item);
    return { id, success: true };
  }

  async payBill(
    id: string,
    userId: string,
    payData: { accountId?: string; date?: string; notes?: string },
  ): Promise<{ success: boolean; transaction: Transaction; recurring: RecurringTransaction }> {
    const item = await this.findOne(id, userId);
    const targetAccountId = payData.accountId || item.accountId;

    const payDate = payData.date ? new Date(payData.date) : new Date();
    const isoPayDate = !isNaN(payDate.getTime()) ? payDate.toISOString() : new Date().toISOString();

    const txTitle = `Bill Payment: ${item.title}`;
    const txNotes = payData.notes
      ? `${payData.notes} (Recurring: ${item.title})`
      : `Logged recurring payment for ${item.title}`;

    // Create a real transaction using TransactionsService
    const createdTx = await this.transactionsService.create(userId, {
      title: txTitle,
      amount: Number(item.amount),
      type: item.type as any,
      accountId: targetAccountId,
      categoryId: item.categoryId || undefined,
      date: isoPayDate,
      notes: txNotes,
    });

    // Advance nextDate to next cycle
    const currentNext = new Date(item.nextDate);
    let nextDate = new Date(currentNext);

    switch (item.frequency) {
      case RecurringFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RecurringFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RecurringFrequency.BIWEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case RecurringFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RecurringFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case RecurringFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    item.nextDate = nextDate;
    const updatedRecurring = await this.recurringRepo.save(item);

    return {
      success: true,
      transaction: createdTx,
      recurring: updatedRecurring,
    };
  }
}
