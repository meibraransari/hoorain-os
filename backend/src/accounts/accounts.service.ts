import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../database/entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async findAll(userId: string): Promise<Account[]> {
    return this.accountRepo.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Account> {
    const account = await this.accountRepo.findOne({ where: { id, userId, isActive: true } });
    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }
    return account;
  }

  async create(userId: string, dto: CreateAccountDto): Promise<Account> {
    const initialBalance = dto.initialBalance ?? 0;
    const account = this.accountRepo.create({
      ...dto,
      userId,
      initialBalance,
      currentBalance: initialBalance,
      isActive: true,
    });
    return this.accountRepo.save(account);
  }

  async update(id: string, userId: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id, userId);
    if (dto.initialBalance !== undefined && dto.initialBalance !== null) {
      const oldInitial = Number(account.initialBalance || 0);
      const newInitial = Number(dto.initialBalance);
      const diff = newInitial - oldInitial;
      account.initialBalance = newInitial;
      account.currentBalance = Number(account.currentBalance || 0) + diff;
    }
    Object.assign(account, dto);
    return this.accountRepo.save(account);
  }

  async remove(id: string, userId: string): Promise<{ id: string; success: boolean }> {
    const account = await this.findOne(id, userId);
    account.isActive = false;
    await this.accountRepo.save(account);
    return { id: account.id, success: true };
  }
}
