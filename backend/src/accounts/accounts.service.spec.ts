import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountsService } from './accounts.service';
import { Account, AccountType } from '../database/entities/account.entity';

describe('AccountsService', () => {
  let service: AccountsService;
  let repo: Repository<Account>;

  const mockAccount = {
    id: 'acc-uuid-1',
    userId: 'user-123',
    name: 'Main Checking',
    type: AccountType.BANK,
    currency: 'INR',
    initialBalance: 10000,
    currentBalance: 25000,
    color: '#3f51b5',
    includeInNetWorth: true,
  };

  const mockRepo = {
    find: jest.fn().mockResolvedValue([mockAccount]),
    findOne: jest.fn().mockResolvedValue(mockAccount),
    create: jest.fn().mockImplementation((dto) => ({ id: 'new-acc-uuid', ...dto })),
    save: jest.fn().mockImplementation((acc) => Promise.resolve(acc)),
    update: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(Account),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repo = module.get<Repository<Account>>(getRepositoryToken(Account));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all accounts for a user', async () => {
    const accounts = await service.findAll('user-123');
    expect(accounts).toEqual([mockAccount]);
  });

  it('should create a new account with initial balance', async () => {
    const newAccDto = {
      name: 'Savings',
      type: AccountType.SAVINGS,
      currency: 'INR',
      initialBalance: 5000,
    };
    const created = await service.create('user-123', newAccDto as any);
    expect(created).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalled();
  });
});
