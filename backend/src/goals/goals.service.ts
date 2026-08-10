import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../database/entities/goal.entity';
import { ContributeGoalDto } from './dto/contribute-goal.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService implements OnModuleInit {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
  ) {}

  async onModuleInit() {
    try {
      await this.goalRepo.query(`
        ALTER TABLE goals ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'income';
        ALTER TABLE goals ADD COLUMN IF NOT EXISTS account_id UUID;
      `);
    } catch (err) {
      console.error('GoalsService init columns error:', err);
    }
  }

  async findAll(userId: string): Promise<Goal[]> {
    return this.goalRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalRepo.findOne({ where: { id, userId } });
    if (!goal) {
      throw new NotFoundException(`Goal ${id} not found`);
    }
    return goal;
  }

  async create(userId: string, dto: CreateGoalDto): Promise<Goal> {
    const goal = this.goalRepo.create({ ...dto, userId });
    return this.goalRepo.save(goal);
  }

  async update(id: string, userId: string, dto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.findOne(id, userId);
    Object.assign(goal, dto);
    goal.isCompleted = Number(goal.currentAmount) >= Number(goal.targetAmount);
    return this.goalRepo.save(goal);
  }

  async remove(id: string, userId: string): Promise<{ id: string; deleted: boolean }> {
    const goal = await this.findOne(id, userId);
    await this.goalRepo.remove(goal);
    return { id, deleted: true };
  }

  async contribute(id: string, userId: string, dto: ContributeGoalDto): Promise<Goal> {
    const goal = await this.findOne(id, userId);
    const target = Number(goal.targetAmount);
    const next = Number(goal.currentAmount) + Number(dto.amount);
    goal.currentAmount = Math.min(Math.max(next, 0), target);
    goal.isCompleted = goal.currentAmount >= target;
    return this.goalRepo.save(goal);
  }
}
