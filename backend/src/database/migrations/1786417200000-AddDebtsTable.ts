import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDebtsTable1786417200000 implements MigrationInterface {
    name = 'AddDebtsTable1786417200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "debts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "title" character varying NOT NULL,
                "balance" numeric(20,4) NOT NULL,
                "interest_rate" numeric(10,4) NOT NULL,
                "minimum_payment" numeric(20,4) NOT NULL,
                "extra_payment" numeric(20,4) NOT NULL DEFAULT '0',
                "category" character varying,
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_debts_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "debts"
            ADD CONSTRAINT "FK_debts_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "debts" DROP CONSTRAINT IF EXISTS "FK_debts_user_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "debts"`);
    }
}
