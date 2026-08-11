import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt } from '../database/entities/debt.entity';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@Injectable()
export class DebtService {
  constructor(
    @InjectRepository(Debt)
    private readonly debtRepo: Repository<Debt>,
  ) {}

  async findAll(userId: string): Promise<any> {
    const debts = await this.debtRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const parsedDebts = debts.map((d) => ({
      ...d,
      balance: Number(d.balance),
      interestRate: Number(d.interestRate),
      minimumPayment: Number(d.minimumPayment),
      extraPayment: Number(d.extraPayment || 0),
    }));

    const totalBalance = parsedDebts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = parsedDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const totalExtraPayment = parsedDebts.reduce((sum, d) => sum + d.extraPayment, 0);

    // Snowball calculation (Lowest balance first)
    const snowballDebts = [...parsedDebts].sort((a, b) => a.balance - b.balance);
    const snowballSim = this.simulatePayoff(snowballDebts, totalExtraPayment);

    // Avalanche calculation (Highest interest rate first)
    const avalancheDebts = [...parsedDebts].sort((a, b) => b.interestRate - a.interestRate);
    const avalancheSim = this.simulatePayoff(avalancheDebts, totalExtraPayment);

    return {
      debts: parsedDebts,
      summary: {
        totalBalance,
        totalMinPayment,
        totalExtraPayment,
        totalMonthlyCommitment: totalMinPayment + totalExtraPayment,
        count: parsedDebts.length,
      },
      snowball: snowballSim,
      avalanche: avalancheSim,
    };
  }

  async findOne(id: string, userId: string): Promise<Debt> {
    const item = await this.debtRepo.findOne({ where: { id, userId } });
    if (!item) {
      throw new NotFoundException(`Debt item ${id} not found`);
    }
    return item;
  }

  async create(userId: string, dto: CreateDebtDto): Promise<Debt> {
    const item = this.debtRepo.create({
      ...dto,
      userId,
      balance: Number(dto.balance),
      interestRate: Number(dto.interestRate),
      minimumPayment: Number(dto.minimumPayment),
      extraPayment: Number(dto.extraPayment || 0),
    });
    return this.debtRepo.save(item);
  }

  async update(id: string, userId: string, dto: UpdateDebtDto): Promise<Debt> {
    const item = await this.findOne(id, userId);
    if (dto.balance !== undefined) dto.balance = Number(dto.balance);
    if (dto.interestRate !== undefined) dto.interestRate = Number(dto.interestRate);
    if (dto.minimumPayment !== undefined) dto.minimumPayment = Number(dto.minimumPayment);
    if (dto.extraPayment !== undefined) dto.extraPayment = Number(dto.extraPayment);
    Object.assign(item, dto);
    return this.debtRepo.save(item);
  }

  async remove(id: string, userId: string): Promise<{ id: string; success: boolean }> {
    const item = await this.findOne(id, userId);
    await this.debtRepo.remove(item);
    return { id, success: true };
  }

  private simulatePayoff(debtList: any[], extraPool: number) {
    if (debtList.length === 0) {
      return { totalMonths: 0, totalInterestPaid: 0, payoffDate: new Date().toISOString(), schedule: [] };
    }

    const items = debtList.map((d) => ({
      id: d.id,
      title: d.title,
      balance: d.balance,
      rate: d.interestRate / 100 / 12, // monthly rate
      minPay: d.minimumPayment,
    }));

    let months = 0;
    let totalInterestPaid = 0;
    const schedule: any[] = [];
    const maxMonths = 360; // 30 year safety cap

    while (items.some((i) => i.balance > 0.01) && months < maxMonths) {
      months++;
      let extraAvailable = extraPool;
      let monthInterest = 0;
      let monthPaid = 0;

      // 1. Charge interest & pay minimums
      for (const item of items) {
        if (item.balance <= 0) continue;
        const interest = item.balance * item.rate;
        monthInterest += interest;
        item.balance += interest;

        const pay = Math.min(item.balance, item.minPay);
        item.balance -= pay;
        monthPaid += pay;
      }

      // 2. Apply extra pool to target item (first non-zero in ordered list)
      for (const item of items) {
        if (item.balance <= 0) continue;
        if (extraAvailable > 0) {
          const extraPay = Math.min(item.balance, extraAvailable);
          item.balance -= extraPay;
          extraAvailable -= extraPay;
          monthPaid += extraPay;
        }
      }

      totalInterestPaid += monthInterest;

      const remainingTotal = items.reduce((sum, i) => sum + Math.max(0, i.balance), 0);
      if (months <= 48 || remainingTotal <= 0) {
        schedule.push({
          month: months,
          interestPaid: Math.round(monthInterest),
          totalPaid: Math.round(monthPaid),
          remainingBalance: Math.round(remainingTotal),
        });
      }

      if (remainingTotal <= 0.01) break;
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);

    return {
      totalMonths: months,
      totalInterestPaid: Math.round(totalInterestPaid),
      payoffDate: payoffDate.toISOString(),
      schedule,
    };
  }
}
