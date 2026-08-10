import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import typeormConfig from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { AccountsModule } from './accounts/accounts.module';
import { AccountTypesModule } from './account-types/account-types.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { BudgetsModule } from './budgets/budgets.module';
import { GoalsModule } from './goals/goals.module';
import { ReportsModule } from './reports/reports.module';
import { ImportModule } from './import/import.module';
import { ExportModule } from './export/export.module';
import { HealthModule } from './health/health.module';
import { AdminSeederService } from './database/seeders/admin.seeder';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { User } from './database/entities/user.entity';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => typeormConfig(configService),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    MailModule,
    AccountsModule,
    AccountTypesModule,
    TransactionsModule,
    CategoriesModule,
    BudgetsModule,
    GoalsModule,
    ReportsModule,
    ImportModule,
    ExportModule,
    HealthModule,
    SettingsModule,
  ],
  providers: [
    AdminSeederService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
