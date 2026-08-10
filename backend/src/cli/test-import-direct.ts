import { ImportService } from '../import/import.service';
import * as fs from 'fs';
import * as path from 'path';

async function testDirectImport() {
  const sqlFilePath = 'd:\\Anti_Gravity_RAW\\cashew-2026-08-07-15-25-31-228356.sql';
  console.log(`Testing direct import of Cashew export file: ${sqlFilePath}`);

  const buffer = fs.readFileSync(sqlFilePath);
  console.log(`Read ${buffer.length} bytes from file.`);

  // Create mock repositories and entity manager
  const savedEntities: Record<string, any[]> = {
    Account: [],
    Category: [],
    Transaction: [],
    Budget: [],
    BudgetCategory: [],
    Goal: [],
    CategoryRule: [],
    AppSetting: [],
  };

  const createMockRepo = (name: string) => ({
    create: (dto: any) => ({ id: dto.id || `${name.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`, ...dto }),
    save: async (entities: any | any[]) => {
      const arr = Array.isArray(entities) ? entities : [entities];
      if (!savedEntities[name]) savedEntities[name] = [];
      savedEntities[name].push(...arr);
      return entities;
    },
    update: async (criteria: any, partialEntity: any) => {
      return true;
    },
    findOne: async () => null,
  });

  const mockManager = {
    getRepository: (entityClass: any) => {
      const name = entityClass.name || 'Unknown';
      return createMockRepo(name);
    },
  };

  const mockDataSource = {
    transaction: async (cb: any) => cb(mockManager),
  };

  const mockImportLogRepo = {
    create: (dto: any) => ({ id: 'log-123', ...dto }),
    save: async (log: any) => log,
  };

  const importService = new ImportService(mockImportLogRepo as any, mockDataSource as any);
  const result = await importService.processCashewFile(buffer, 'user-admin-123', 'cashew-2026-08-07-15-25-31-228356.sql');

  console.log('\n==================================================');
  console.log(' CASHEW FILE DIRECT PARSE & IMPORT TEST RESULT');
  console.log('==================================================');
  console.log('Status:', result.status);
  console.log('Totals Imported:');
  console.log(`  - Wallets Found: ${result.report.totals.walletsFound} | Accounts Created: ${savedEntities.Account.length}`);
  console.log(`  - Categories Found: ${result.report.totals.categoriesFound} | Categories Created: ${savedEntities.Category.length}`);
  console.log(`  - Transactions Found: ${result.report.totals.transactionsFound} | Transactions Created: ${savedEntities.Transaction.length}`);
  console.log(`  - Objectives Found: ${result.report.totals.objectivesFound} | Goals Created: ${savedEntities.Goal.length}`);
  console.log(`  - Category Rules Created: ${savedEntities.CategoryRule.length}`);
  console.log(`  - App Settings Stored: ${savedEntities.AppSetting.length}`);
  console.log('==================================================\n');

  if (savedEntities.Account.length === 8 && savedEntities.Transaction.length === 1504) {
    console.log('SUCCESS: All 8 wallets and all 1,504 transactions parsed and transformed perfectly!');
  } else {
    console.error('Mismatch in imported row counts!');
    process.exit(1);
  }
}

testDirectImport().catch(err => {
  console.error('Error during direct import test:', err);
  process.exit(1);
});
