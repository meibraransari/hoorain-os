import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ImportService } from '../import/import.service';
import { User, UserRole } from '../database/entities/user.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const fileArg = process.argv[2] || 'd:\\Anti_Gravity_RAW\\cashew-2026-08-07-15-25-31-228356.sql';
  const filePath = path.resolve(fileArg);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: Cashew SQL export file not found at: ${filePath}`);
    process.exit(1);
  }

  console.log('Initializing FinanceOS application context for DB reset & import...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });

  try {
    const dataSource = app.get(DataSource);
    const importService = app.get(ImportService);

    console.log('Cleaning all existing database tables...');
    await dataSource.query(`
      TRUNCATE TABLE 
        transactions, 
        accounts, 
        categories, 
        budgets, 
        budget_categories, 
        goals, 
        category_rules, 
        cashew_import_logs, 
        app_settings, 
        users 
      RESTART IDENTITY CASCADE;
    `);
    console.log('Database tables cleaned successfully.');

    console.log('Creating canonical admin user (admin / AdminPass123!)...');
    const userRepo = dataSource.getRepository(User);
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    const admin = userRepo.create({
      username: 'admin',
      email: 'admin@financeos.local',
      passwordHash,
      role: UserRole.ADMIN,
      mustChangePassword: false,
      isActive: true,
    });
    await userRepo.save(admin);
    console.log(`Admin user created with ID: ${admin.id}`);

    console.log(`Reading and processing Cashew SQL export: ${filePath}`);
    const fileBuffer = fs.readFileSync(filePath);
    const result = await importService.processCashewFile(fileBuffer, admin.id, path.basename(filePath));

    console.log('\n==================================================');
    console.log(' CLEAN & IMPORT COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`Log ID: ${result.logId}`);
    console.log(`Status: ${result.status}`);
    console.log('Report Summary:');
    console.log(JSON.stringify(result.report, null, 2));
    console.log('==================================================\n');

    await app.close();
    process.exit(0);
  } catch (error: any) {
    console.error('\n==================================================');
    console.error(' CLEAN & IMPORT FAILED');
    console.error('==================================================');
    console.error(`Error: ${error.message}`);
    if (error.stack) console.error(error.stack);
    console.error('==================================================\n');

    await app.close();
    process.exit(1);
  }
}

bootstrap();
