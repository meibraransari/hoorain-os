import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DataSource } from 'typeorm';

@ApiTags('import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/import')
export class ImportController {
  constructor(
    private readonly importService: ImportService,
    private readonly dataSource: DataSource,
  ) {}

  @Post('cashew')
  @ApiOperation({ summary: 'Import financial records from Cashew SQLite file' })
  @UseInterceptors(FileInterceptor('file'))
  async importCashew(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.importService.processCashewFile(file.buffer, req.user.id, file.originalname);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Erase all user financial records (accounts, transactions, categories, budgets, goals)' })
  async resetData(@Req() req: any) {
    return this.importService.resetUserData(req.user.id);
  }

  @Post('reconcile')
  @ApiOperation({ summary: 'Reconcile and synchronize all database table balances in PostgreSQL' })
  async reconcileBalances(@Req() req: any) {
    const res = await this.dataSource.transaction((manager) =>
      this.importService.reconcileUserBalances(manager, req.user.id),
    );
    return { success: true, columns: res, message: 'All database table balances successfully reconciled and synced.' };
  }

  @Post('db-dump')
  @ApiOperation({ summary: 'Restore PostgreSQL database from a native SQL dump backup' })
  @UseInterceptors(FileInterceptor('file'))
  async restoreDatabaseDump(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No database backup file uploaded');
    }
    return this.importService.restoreDatabaseDump(file.buffer, file.originalname);
  }

  @Get(':logId')
  async getImportStatus(@Param('logId') logId: string) {
    return this.importService.getImportStatus(logId);
  }
}
