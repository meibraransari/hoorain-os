import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1786266764766 implements MigrationInterface {
    name = 'InitSchema1786266764766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'manager', 'family_member', 'viewer')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'viewer', "first_name" character varying, "last_name" character varying, "avatar_url" character varying, "default_currency" character varying NOT NULL DEFAULT 'INR', "language" character varying NOT NULL DEFAULT 'en', "timezone" character varying NOT NULL DEFAULT 'Asia/Kolkata', "theme" character varying NOT NULL DEFAULT 'dark', "is_active" boolean NOT NULL DEFAULT true, "must_change_password" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_type_enum" AS ENUM('cash', 'bank', 'credit_card', 'debit_card', 'savings', 'investment', 'loan', 'crypto', 'digital_wallet', 'custom')`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying NOT NULL, "type" "public"."accounts_type_enum" NOT NULL DEFAULT 'bank', "currency" character varying NOT NULL DEFAULT 'INR', "initial_balance" numeric(20,4) NOT NULL DEFAULT '0', "current_balance" numeric(20,4) NOT NULL DEFAULT '0', "color" character varying, "icon" character varying, "is_active" boolean NOT NULL DEFAULT true, "include_in_net_worth" boolean NOT NULL DEFAULT false, "bank_name" character varying, "account_number" character varying, "notes" character varying, "external_id" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."categories_type_enum" AS ENUM('income', 'expense')`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "name" character varying NOT NULL, "type" "public"."categories_type_enum" NOT NULL, "icon" character varying, "color" character varying, "parent_id" uuid, "is_default" boolean NOT NULL DEFAULT false, "external_id" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying NOT NULL, "color" character varying, CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transaction_tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transaction_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_b863ee4bcc80a16ebfedb13542d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transaction_splits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transaction_id" uuid NOT NULL, "category_id" uuid NOT NULL, "amount" numeric(20,4) NOT NULL, "notes" text, CONSTRAINT "PK_ff450f3d91d3c2764e27a3dfc15" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transaction_id" uuid NOT NULL, "file_path" character varying NOT NULL, "file_name" character varying NOT NULL, "mime_type" character varying NOT NULL, "file_size" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('income', 'expense', 'transfer')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "account_id" uuid NOT NULL, "category_id" uuid, "user_id" uuid NOT NULL, "amount" numeric(20,4) NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "date" date NOT NULL, "title" character varying, "notes" text, "merchant" character varying, "location" character varying, "payment_method" character varying, "is_recurring" boolean NOT NULL DEFAULT false, "recurring_id" character varying, "is_pending" boolean NOT NULL DEFAULT false, "is_transfer" boolean NOT NULL DEFAULT false, "transfer_pair_id" character varying, "external_id" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_transactions_type_enum" AS ENUM('income', 'expense', 'transfer')`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_transactions_frequency_enum" AS ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')`);
        await queryRunner.query(`CREATE TABLE "recurring_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "account_id" uuid NOT NULL, "category_id" uuid, "amount" numeric(20,4) NOT NULL, "type" "public"."recurring_transactions_type_enum" NOT NULL, "title" character varying, "notes" text, "frequency" "public"."recurring_transactions_frequency_enum" NOT NULL, "next_date" date NOT NULL, "end_date" date, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6485db3243762a54992dc0ce3b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" character varying NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "goals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying NOT NULL, "description" text, "target_amount" numeric(20,4) NOT NULL, "current_amount" numeric(20,4) NOT NULL DEFAULT '0', "deadline" date, "color" character varying, "icon" character varying, "is_completed" boolean NOT NULL DEFAULT false, "external_id" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_26e17b251afab35580dff769223" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "exchange_rates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "from_currency" character varying NOT NULL, "to_currency" character varying NOT NULL, "rate" numeric(20,6) NOT NULL, "date" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_33a614bad9e61956079d817ebe2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "category_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "category_id" uuid NOT NULL, "title" character varying NOT NULL, "is_exact_match" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', "external_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3001e05a8ef4840599a676769a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."cashew_import_logs_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "cashew_import_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "filename" character varying NOT NULL, "status" "public"."cashew_import_logs_status_enum" NOT NULL DEFAULT 'pending', "total_records" integer NOT NULL DEFAULT '0', "imported_records" integer NOT NULL DEFAULT '0', "errors" jsonb, "started_at" TIMESTAMP, "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4cb7a32bdc99bffd495486600d0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."budgets_period_enum" AS ENUM('monthly', 'weekly', 'yearly', 'custom')`);
        await queryRunner.query(`CREATE TABLE "budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying NOT NULL, "amount" numeric(20,4) NOT NULL, "period" "public"."budgets_period_enum" NOT NULL DEFAULT 'monthly', "start_date" date, "end_date" date, "is_rollover" boolean NOT NULL DEFAULT false, "alert_threshold" numeric(5,2) NOT NULL DEFAULT '80', "color" character varying, "icon" character varying, "external_id" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "budget_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "budget_id" uuid NOT NULL, "category_id" uuid NOT NULL, "limit_amount" numeric(20,4) NOT NULL, CONSTRAINT "PK_2159c4d6372542f4629c4149045" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "action" character varying NOT NULL, "entity" character varying NOT NULL, "entity_id" character varying NOT NULL, "changes" jsonb, "ip_address" character varying, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "app_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" text NOT NULL, "description" character varying, CONSTRAINT "UQ_975c2db59c65c05fd9c6b63a2ab" UNIQUE ("key"), CONSTRAINT "PK_4800b266ba790931744b3e53a74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_3000dad1da61b29953f07476324" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_2296b7fe012d95646fa41921c8b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_74603743868d1e4f4fc2c0225b6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_tags" ADD CONSTRAINT "FK_6a8b1add6b564b10240a9b930bc" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_tags" ADD CONSTRAINT "FK_319b507343ce97b2873641bfe54" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_splits" ADD CONSTRAINT "FK_ffa9819d782617720cd8d13b109" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction_splits" ADD CONSTRAINT "FK_773e197b795bfceb6b5aeefc2ca" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attachments" ADD CONSTRAINT "FK_57d149bdf1200d26c13519d9ccf" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_49c0d6e8ba4bfb5582000d851f0" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_transactions" ADD CONSTRAINT "FK_d78f3002f99b0f15a3797201c92" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_transactions" ADD CONSTRAINT "FK_49ccbdbeef159c1c12b1931a5b7" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_transactions" ADD CONSTRAINT "FK_eb623e5e626cf95fd42710adf25" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "goals" ADD CONSTRAINT "FK_88b78010581f2d293699d064441" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "category_rules" ADD CONSTRAINT "FK_a0e8e884cd7eafdda1aa8ac1b47" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "category_rules" ADD CONSTRAINT "FK_edd050f44b3f46d0e0768973dae" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_5d25d8bbd6c209261dfe04558f1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budget_categories" ADD CONSTRAINT "FK_919faa73fd59efb0f80ccc36079" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budget_categories" ADD CONSTRAINT "FK_7bf4a38f525c0de01a6c4226a04" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budget_categories" DROP CONSTRAINT "FK_7bf4a38f525c0de01a6c4226a04"`);
        await queryRunner.query(`ALTER TABLE "budget_categories" DROP CONSTRAINT "FK_919faa73fd59efb0f80ccc36079"`);
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_5d25d8bbd6c209261dfe04558f1"`);
        await queryRunner.query(`ALTER TABLE "category_rules" DROP CONSTRAINT "FK_edd050f44b3f46d0e0768973dae"`);
        await queryRunner.query(`ALTER TABLE "category_rules" DROP CONSTRAINT "FK_a0e8e884cd7eafdda1aa8ac1b47"`);
        await queryRunner.query(`ALTER TABLE "goals" DROP CONSTRAINT "FK_88b78010581f2d293699d064441"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "recurring_transactions" DROP CONSTRAINT "FK_eb623e5e626cf95fd42710adf25"`);
        await queryRunner.query(`ALTER TABLE "recurring_transactions" DROP CONSTRAINT "FK_49ccbdbeef159c1c12b1931a5b7"`);
        await queryRunner.query(`ALTER TABLE "recurring_transactions" DROP CONSTRAINT "FK_d78f3002f99b0f15a3797201c92"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_c9e41213ca42d50132ed7ab2b0f"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_49c0d6e8ba4bfb5582000d851f0"`);
        await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "FK_57d149bdf1200d26c13519d9ccf"`);
        await queryRunner.query(`ALTER TABLE "transaction_splits" DROP CONSTRAINT "FK_773e197b795bfceb6b5aeefc2ca"`);
        await queryRunner.query(`ALTER TABLE "transaction_splits" DROP CONSTRAINT "FK_ffa9819d782617720cd8d13b109"`);
        await queryRunner.query(`ALTER TABLE "transaction_tags" DROP CONSTRAINT "FK_319b507343ce97b2873641bfe54"`);
        await queryRunner.query(`ALTER TABLE "transaction_tags" DROP CONSTRAINT "FK_6a8b1add6b564b10240a9b930bc"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_74603743868d1e4f4fc2c0225b6"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_2296b7fe012d95646fa41921c8b"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_3000dad1da61b29953f07476324"`);
        await queryRunner.query(`DROP TABLE "app_settings"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "budget_categories"`);
        await queryRunner.query(`DROP TABLE "budgets"`);
        await queryRunner.query(`DROP TYPE "public"."budgets_period_enum"`);
        await queryRunner.query(`DROP TABLE "cashew_import_logs"`);
        await queryRunner.query(`DROP TYPE "public"."cashew_import_logs_status_enum"`);
        await queryRunner.query(`DROP TABLE "category_rules"`);
        await queryRunner.query(`DROP TABLE "exchange_rates"`);
        await queryRunner.query(`DROP TABLE "goals"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "recurring_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_transactions_frequency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "attachments"`);
        await queryRunner.query(`DROP TABLE "transaction_splits"`);
        await queryRunner.query(`DROP TABLE "transaction_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TYPE "public"."categories_type_enum"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
