import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ImportService } from '../import/import.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../database/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npm run import:cashew <path-to-cashew-sql-file>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at path: ${filePath}`);
    process.exit(1);
  }

  console.log(`Initializing FinanceOS context for Cashew import...`);
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });

  try {
    const importService = app.get(ImportService);
    const usersService = app.get(UsersService);

    // Find or create initial admin user for import ownership
    let admin = await usersService.findByUsername('admin');
    if (!admin) {
      console.log('No default admin user found. Creating initial admin user...');
      admin = await usersService.create({
        username: 'admin',
        email: 'admin@financeos.local',
        password: 'AdminUser123!',
        role: UserRole.ADMIN,
      });
    }

    console.log(`Processing Cashew export file: ${filePath}`);
    const fileBuffer = fs.readFileSync(filePath);
    const result = await importService.processCashewFile(fileBuffer, admin.id, path.basename(filePath));

    console.log('\n==================================================');
    console.log(' CASHEW IMPORT COMPLETED SUCCESSFULLY');
    console.log('==================================================');
    console.log(`Log ID: ${result.logId}`);
    console.log(`Status: ${result.status}`);
    console.log('Import Report Summary:');
    console.log(JSON.stringify(result.report, null, 2));
    console.log('==================================================\n');

    await app.close();
    process.exit(0);
  } catch (error: any) {
    console.error('\n==================================================');
    console.error(' CASHEW IMPORT FAILED');
    console.error('==================================================');
    console.error(`Error: ${error.message}`);
    if (error.stack) console.error(error.stack);
    console.error('==================================================\n');

    await app.close();
    process.exit(1);
  }
}

bootstrap();
