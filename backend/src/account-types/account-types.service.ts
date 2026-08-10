import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountType } from '../database/entities/account-type.entity';
import { CreateAccountTypeDto } from './dto/create-account-type.dto';

const DEFAULT_TYPES = [
  { code: 'checking', name: 'Checking / Bank', color: '#3f51b5', icon: 'wallet' },
  { code: 'savings', name: 'Savings', color: '#4caf50', icon: 'piggy-bank' },
  { code: 'credit_card', name: 'Credit Card', color: '#ff9800', icon: 'credit-card' },
  { code: 'cash', name: 'Cash / Wallet', color: '#e91e63', icon: 'banknote' },
  { code: 'investment', name: 'Investment', color: '#9c27b0', icon: 'trending-up' },
  { code: 'loan', name: 'Loan', color: '#607d8b', icon: 'landmark' },
  { code: 'crypto', name: 'Cryptocurrency', color: '#00bcd4', icon: 'coins' },
];

@Injectable()
export class AccountTypesService implements OnModuleInit {
  constructor(
    @InjectRepository(AccountType)
    private readonly typeRepo: Repository<AccountType>,
  ) {}

  async onModuleInit() {
    try {
      await this.typeRepo.query(`
        CREATE TABLE IF NOT EXISTS account_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          code VARCHAR(50) NOT NULL,
          icon VARCHAR(50) DEFAULT 'wallet',
          color VARCHAR(20) DEFAULT '#3f51b5',
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const count = await this.typeRepo.count({ where: { isDefault: true } });
      if (count === 0) {
        for (const t of DEFAULT_TYPES) {
          await this.typeRepo.save(
            this.typeRepo.create({
              code: t.code,
              name: t.name,
              color: t.color,
              icon: t.icon,
              isDefault: true,
              userId: null,
            }),
          );
        }
      }
    } catch (err) {
      console.error('AccountTypesService init error:', err);
    }
  }

  async findAll(userId: string): Promise<AccountType[]> {
    const types = await this.typeRepo.find({
      where: [{ isDefault: true }, { userId }],
      order: { isDefault: 'DESC', name: 'ASC' },
    });
    return types;
  }

  async create(userId: string, dto: CreateAccountTypeDto): Promise<AccountType> {
    const code = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const newType = this.typeRepo.create({
      name: dto.name,
      code,
      color: dto.color || '#3f51b5',
      icon: dto.icon || 'wallet',
      userId,
      isDefault: false,
    });
    return this.typeRepo.save(newType);
  }

  async update(id: string, userId: string, dto: Partial<CreateAccountTypeDto>): Promise<AccountType> {
    let type = await this.typeRepo.findOne({ where: { id } });
    if (!type) {
      type = await this.typeRepo.findOne({ where: { code: id } });
    }
    if (!type) {
      throw new NotFoundException(`Account type ${id} not found`);
    }
    if (dto.name) {
      type.name = dto.name;
      type.code = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    }
    if (dto.color) type.color = dto.color;
    if (dto.icon) type.icon = dto.icon;

    return this.typeRepo.save(type);
  }

  async remove(id: string, userId: string): Promise<{ success: boolean }> {
    let type = await this.typeRepo.findOne({ where: { id } });
    if (!type) {
      type = await this.typeRepo.findOne({ where: { code: id } });
    }
    if (!type) {
      throw new NotFoundException(`Account type ${id} not found`);
    }
    await this.typeRepo.remove(type);
    return { success: true };
  }
}
