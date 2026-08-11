import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Category, CategoryType } from '../entities/category.entity';
import { AccountType } from '../entities/account-type.entity';

@Injectable()
export class AdminSeederService {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(AccountType)
    private readonly accountTypeRepository: Repository<AccountType>,
  ) {}

  async seed() {
    let admin = await this.userRepository.findOne({ where: { username: 'admin' } });
    if (!admin) {
      const passwordHash = await bcrypt.hash('AdminPass123!', 10);
      admin = this.userRepository.create({
        username: 'admin',
        email: 'admin@hoorain.app',
        passwordHash,
        role: UserRole.ADMIN,
        mustChangePassword: false,
        isActive: true,
      });

      await this.userRepository.save(admin);

      console.log(`
╔══════════════════════════════════════╗
║     Hoorain — First Boot Setup       ║
╠══════════════════════════════════════╣
║  Admin Account Created               ║
║  Username: admin                     ║
║  Password: AdminPass123!             ║
╚══════════════════════════════════════╝
      `);
    }

    // Seed default Account Types if empty
    const accountTypesCount = await this.accountTypeRepository.count();
    if (accountTypesCount === 0) {
      const defaultAccountTypes = [
        { name: 'Bank Account', type: 'bank', icon: 'building-bank', color: '#6c63ff', isCustom: false },
        { name: 'Savings Account', type: 'savings', icon: 'piggy-bank', color: '#10b981', isCustom: false },
        { name: 'Cash Wallet', type: 'cash', icon: 'wallet', color: '#f59e0b', isCustom: false },
        { name: 'Credit Card', type: 'credit_card', icon: 'credit-card', color: '#ef4444', isCustom: false },
        { name: 'Investment', type: 'investment', icon: 'trending-up', color: '#3b82f6', isCustom: false },
        { name: 'Digital Wallet', type: 'digital_wallet', icon: 'smartphone', color: '#8b5cf6', isCustom: false },
      ];
      await this.accountTypeRepository.save(defaultAccountTypes);
      this.logger.log('Seeded default account types');
    }

    // Seed default Categories if empty
    const categoriesCount = await this.categoryRepository.count();
    if (categoriesCount === 0) {
      const defaultCategories = [
        // Income Categories
        { name: 'Salary', type: CategoryType.INCOME, icon: 'briefcase', color: '#10b981', isDefault: true },
        { name: 'Business & Freelance', type: CategoryType.INCOME, icon: 'laptop', color: '#3b82f6', isDefault: true },
        { name: 'Investments & Dividends', type: CategoryType.INCOME, icon: 'trending-up', color: '#8b5cf6', isDefault: true },
        { name: 'Borrowed', type: CategoryType.INCOME, icon: 'hand-coins', color: '#f59e0b', isDefault: true },
        { name: 'Other Income', type: CategoryType.INCOME, icon: 'dollar-sign', color: '#64748b', isDefault: true },

        // Expense Categories
        { name: 'Food & Dining', type: CategoryType.EXPENSE, icon: 'utensils', color: '#ef4444', isDefault: true },
        { name: 'Housing & Rent', type: CategoryType.EXPENSE, icon: 'home', color: '#f97316', isDefault: true },
        { name: 'Utilities & Bills', type: CategoryType.EXPENSE, icon: 'zap', color: '#eab308', isDefault: true },
        { name: 'Transportation & Fuel', type: CategoryType.EXPENSE, icon: 'car', color: '#06b6d4', isDefault: true },
        { name: 'Shopping & Clothes', type: CategoryType.EXPENSE, icon: 'shopping-bag', color: '#ec4899', isDefault: true },
        { name: 'Health & Medical', type: CategoryType.EXPENSE, icon: 'heart-pulse', color: '#14b8a6', isDefault: true },
        { name: 'Entertainment & Subscriptions', type: CategoryType.EXPENSE, icon: 'film', color: '#a855f7', isDefault: true },
        { name: 'Debt Payoff', type: CategoryType.EXPENSE, icon: 'calculator', color: '#6c63ff', isDefault: true },
        { name: 'Lent', type: CategoryType.EXPENSE, icon: 'hand-coins', color: '#6366f1', isDefault: true },
        { name: 'Other Expenses', type: CategoryType.EXPENSE, icon: 'tag', color: '#94a3b8', isDefault: true },
      ];
      await this.categoryRepository.save(defaultCategories);
      this.logger.log('Seeded default income & expense categories');
    }
  }
}
