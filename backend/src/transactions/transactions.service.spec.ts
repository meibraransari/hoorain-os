import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from '../database/entities/transaction.entity';
import { Account } from '../database/entities/account.entity';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let txRepo: Repository<Transaction>;

  const mockTransaction = {
    id: 'tx-uuid-1',
    userId: 'user-123',
    accountId: 'acc-uuid-1',
    categoryId: 'cat-uuid-1',
    amount: 1500,
    type: TransactionType.EXPENSE,
    date: new Date(),
    title: 'Groceries',
    isPending: false,
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockTransaction], 1]),
  };

  const mockTxRepo = {
    find: jest.fn().mockResolvedValue([mockTransaction]),
    findOne: jest.fn().mockResolvedValue(mockTransaction),
    create: jest.fn().mockImplementation((dto) => ({ id: 'new-tx-uuid', ...dto })),
    save: jest.fn().mockImplementation((tx) => Promise.resolve(tx)),
    delete: jest.fn().mockResolvedValue(true),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockAccountRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'acc-uuid-1', currentBalance: 10000 }),
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTxRepo,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: mockAccountRepo,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    txRepo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list transactions for a user', async () => {
    const result = await service.findAll('user-123', {});
    expect(result).toBeDefined();
    expect(mockTxRepo.createQueryBuilder).toHaveBeenCalledWith('transaction');
  });
});
