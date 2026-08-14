import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingColumnsAndAccountTypesTable1786417300000 implements MigrationInterface {
    name = 'AddMissingColumnsAndAccountTypesTable1786417300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ensure account_types table exists
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "account_types" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "name" character varying(100) NOT NULL,
                "code" character varying(50) NOT NULL,
                "icon" character varying(50) NOT NULL DEFAULT 'wallet',
                "color" character varying(20) NOT NULL DEFAULT '#3f51b5',
                "is_default" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_account_types_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_account_types_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // 2. Add goal_id, budget_id, and exclude_from_balance to transactions if missing
        await queryRunner.query(`
            ALTER TABLE "transactions"
            ADD COLUMN IF NOT EXISTS "goal_id" uuid,
            ADD COLUMN IF NOT EXISTS "budget_id" uuid,
            ADD COLUMN IF NOT EXISTS "exclude_from_balance" boolean DEFAULT false
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "transactions"
            DROP COLUMN IF EXISTS "exclude_from_balance",
            DROP COLUMN IF EXISTS "budget_id",
            DROP COLUMN IF EXISTS "goal_id"
        `);
        await queryRunner.query(`DROP TABLE IF EXISTS "account_types"`);
    }
}
