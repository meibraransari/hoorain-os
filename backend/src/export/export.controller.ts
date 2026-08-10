import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportQueryDto } from './dto/export-query.dto';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('transactions')
  @ApiOperation({ summary: "Export user's transactions as CSV or JSON" })
  async exportTransactions(@Query() query: ExportQueryDto, @Req() req: any, @Res() res: Response) {
    const transactions = await this.exportService.getTransactions(req.user.id);

    if (query.format === 'csv') {
      const csv = this.exportService.toCsv(transactions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      res.send(csv);
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.json"');
    res.send(transactions);
  }

  @Get('full-backup')
  @ApiOperation({ summary: "Export user's full financial backup as JSON" })
  async exportFullBackup(@Req() req: any, @Res() res: Response) {
    const backup = await this.exportService.getFullBackup(req.user.id);
    const filename = `financeos-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  }

  @Get('db-dump')
  @ApiOperation({ summary: 'Export active PostgreSQL database dump as downloadable .sql file' })
  async exportDatabaseDump(@Res() res: Response) {
    const { dumpSql, filename } = await this.exportService.generatePostgresDump();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(dumpSql);
  }
}
