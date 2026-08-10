import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async check() {
    const timestamp = new Date().toISOString();
    let database: 'up' | 'down' = 'down';

    try {
      await this.dataSource.query('SELECT 1');
      database = 'up';
    } catch {
      // Liveness check should never fail hard just because the DB is
      // unreachable; report it in the payload instead.
      database = 'down';
    }

    return {
      status: 'ok',
      timestamp,
      database,
    };
  }
}
