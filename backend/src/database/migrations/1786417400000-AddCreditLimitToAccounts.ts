import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditLimitToAccounts1786417400000 implements MigrationInterface {
  name = 'AddCreditLimitToAccounts1786417400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "credit_limit" numeric(20,4) DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN IF EXISTS "credit_limit"`);
  }
}
