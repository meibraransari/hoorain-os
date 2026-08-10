import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesAndBalanceTrigger1786266770000 implements MigrationInterface {
  name = 'AddIndexesAndBalanceTrigger1786266770000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "idx_accounts_user_id" ON "accounts" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_categories_user_id" ON "categories" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_categories_parent_id" ON "categories" ("parent_id")`);
    await queryRunner.query(`CREATE INDEX "idx_transactions_user_id" ON "transactions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_transactions_account_id" ON "transactions" ("account_id")`);
    await queryRunner.query(`CREATE INDEX "idx_transactions_category_id" ON "transactions" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "idx_transactions_date" ON "transactions" ("date" DESC)`);
    await queryRunner.query(`CREATE INDEX "idx_transactions_type" ON "transactions" ("type")`);
    await queryRunner.query(
      `CREATE INDEX "idx_transactions_external_id" ON "transactions" ("external_id") WHERE "external_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transactions_user_date" ON "transactions" ("user_id", "date" DESC)`,
    );
    await queryRunner.query(`CREATE INDEX "idx_budgets_user_id" ON "budgets" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_goals_user_id" ON "goals" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_tags_user_id" ON "tags" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_category_rules_user_id" ON "category_rules" ("user_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_cashew_import_logs_user_id" ON "cashew_import_logs" ("user_id")`,
    );

    // Keep accounts.current_balance in sync whenever an income/expense transaction
    // is inserted, updated, or deleted. Transfers are represented as a pair of
    // ordinary income/expense rows (one per account), so no special-casing is needed.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sync_account_balance()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          IF NEW.type = 'income' THEN
            UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
          ELSIF NEW.type = 'expense' THEN
            UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
          END IF;
        ELSIF TG_OP = 'DELETE' THEN
          IF OLD.type = 'income' THEN
            UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
          ELSIF OLD.type = 'expense' THEN
            UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
          END IF;
        ELSIF TG_OP = 'UPDATE' THEN
          IF OLD.type = 'income' THEN
            UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
          ELSIF OLD.type = 'expense' THEN
            UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
          END IF;
          IF NEW.type = 'income' THEN
            UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
          ELSIF NEW.type = 'expense' THEN
            UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
          END IF;
        END IF;
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Postgres forbids a WHEN clause that references NEW on a combined
    // INSERT/UPDATE/DELETE trigger (DELETE has no NEW row) — split per event.
    await queryRunner.query(`
      CREATE TRIGGER trg_transactions_balance_insert
        AFTER INSERT ON transactions
        FOR EACH ROW
        WHEN (NEW.type IN ('income', 'expense'))
        EXECUTE FUNCTION sync_account_balance();
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_transactions_balance_update
        AFTER UPDATE ON transactions
        FOR EACH ROW
        WHEN (OLD.type IN ('income', 'expense') OR NEW.type IN ('income', 'expense'))
        EXECUTE FUNCTION sync_account_balance();
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_transactions_balance_delete
        AFTER DELETE ON transactions
        FOR EACH ROW
        WHEN (OLD.type IN ('income', 'expense'))
        EXECUTE FUNCTION sync_account_balance();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_transactions_balance_delete ON transactions`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_transactions_balance_update ON transactions`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_transactions_balance_insert ON transactions`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS sync_account_balance()`);
    await queryRunner.query(`DROP INDEX "idx_cashew_import_logs_user_id"`);
    await queryRunner.query(`DROP INDEX "idx_category_rules_user_id"`);
    await queryRunner.query(`DROP INDEX "idx_tags_user_id"`);
    await queryRunner.query(`DROP INDEX "idx_goals_user_id"`);
    await queryRunner.query(`DROP INDEX "idx_budgets_user_id"`);
    await queryRunner.query(`DROP INDEX "idx_transactions_user_date"`);
    await queryRunner.query(`DROP INDEX "idx_transactions_external_id"`);
    await queryRunner.query(`DROP INDEX "idx_transactions_type"`);
    await queryRunner.query(`DROP INDEX "idx_transactions_date"`);
    await queryRunner.query(`DROP INDEX "idx_transactions_category_id"`);
    await queryRunner.query(`DROP INDEX "idx_transactions_account_id"`);
    await queryRunner.query(`DROP INDEX "idx_transactions_user_id"`);
    await queryRunner.query(`DROP INDEX "idx_categories_parent_id"`);
    await queryRunner.query(`DROP INDEX "idx_categories_user_id"`);
    await queryRunner.query(`DROP INDEX "idx_accounts_user_id"`);
  }
}
