-- ============================================================
-- FinanceOS Database Schema — REFERENCE ONLY, NOT AUTHORITATIVE
-- PostgreSQL 17+
--
-- The actual schema is generated from TypeORM entities
-- (backend/src/database/entities/*.entity.ts) into
-- database/migrations/*.ts and applied via `npm run migrate`
-- (see backend/src/migrate.ts). This file is kept only as
-- human-readable documentation and may drift from the real
-- schema — do not run it directly against the app's database.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- trigram indexes for fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- GIN indexes on scalar types

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE account_type AS ENUM (
  'checking',
  'savings',
  'credit_card',
  'investment',
  'loan',
  'mortgage',
  'cash',
  'crypto',
  'other'
);

CREATE TYPE transaction_type AS ENUM (
  'income',
  'expense',
  'transfer'
);

CREATE TYPE budget_period AS ENUM (
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom'
);

CREATE TYPE goal_status AS ENUM (
  'active',
  'completed',
  'paused',
  'cancelled'
);

CREATE TYPE recurring_frequency AS ENUM (
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly'
);

CREATE TYPE import_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'partial'
);

CREATE TYPE notification_type AS ENUM (
  'budget_alert',
  'goal_milestone',
  'bill_reminder',
  'unusual_spending',
  'account_low_balance',
  'import_complete',
  'backup_complete',
  'system'
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(320) NOT NULL UNIQUE,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  display_name  VARCHAR(100),
  avatar_url    TEXT,
  currency      CHAR(3)      NOT NULL DEFAULT 'USD',  -- ISO 4217 currency code
  locale        VARCHAR(10)  NOT NULL DEFAULT 'en-US',
  timezone      VARCHAR(50)  NOT NULL DEFAULT 'UTC',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users IS 'Application users — supports multi-user household setups';
COMMENT ON COLUMN users.currency IS 'Default display currency, ISO 4217 (e.g. USD, EUR, INR)';
COMMENT ON COLUMN users.locale IS 'BCP 47 locale tag for number/date formatting';

CREATE INDEX idx_users_email    ON users (email);
CREATE INDEX idx_users_username ON users (username);

-- ============================================================
-- ACCOUNTS
-- ============================================================

CREATE TABLE accounts (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  type             account_type NOT NULL DEFAULT 'checking',
  currency         CHAR(3)      NOT NULL DEFAULT 'USD',
  initial_balance  NUMERIC(18,4) NOT NULL DEFAULT 0,
  current_balance  NUMERIC(18,4) NOT NULL DEFAULT 0,  -- denormalized for performance
  credit_limit     NUMERIC(18,4),                      -- for credit cards
  interest_rate    NUMERIC(6,4),                       -- annual rate %
  institution_name VARCHAR(100),
  account_number   VARCHAR(50),                        -- last 4 digits recommended
  color            CHAR(7)      DEFAULT '#6366f1',     -- hex color for UI
  icon             VARCHAR(50)  DEFAULT 'bank',
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  include_in_total BOOLEAN      NOT NULL DEFAULT TRUE, -- exclude investment/crypto from net worth calc
  notes            TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  accounts IS 'Financial accounts: bank, credit card, investment, cash, etc.';
COMMENT ON COLUMN accounts.current_balance IS 'Denormalized balance — kept in sync by triggers';
COMMENT ON COLUMN accounts.include_in_total IS 'Controls net worth calculation inclusion';

CREATE INDEX idx_accounts_user_id ON accounts (user_id);
CREATE INDEX idx_accounts_type    ON accounts (type);

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE categories (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         REFERENCES users(id) ON DELETE CASCADE, -- NULL = global default
  parent_id   UUID         REFERENCES categories(id) ON DELETE SET NULL,
  name        VARCHAR(100) NOT NULL,
  type        transaction_type NOT NULL DEFAULT 'expense',
  icon        VARCHAR(50)  DEFAULT 'tag',
  color       CHAR(7)      DEFAULT '#64748b',
  is_default  BOOLEAN      NOT NULL DEFAULT FALSE,  -- system seeded category
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  categories IS 'Transaction categories — hierarchical (parent/subcategory)';
COMMENT ON COLUMN categories.user_id IS 'NULL for global seeded categories, set for user-created ones';

CREATE INDEX idx_categories_user_id   ON categories (user_id);
CREATE INDEX idx_categories_parent_id ON categories (parent_id);
CREATE INDEX idx_categories_type      ON categories (type);

-- ============================================================
-- TAGS
-- ============================================================

CREATE TABLE tags (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(50)  NOT NULL,
  color      CHAR(7)      DEFAULT '#94a3b8',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

COMMENT ON TABLE tags IS 'Freeform labels that can be attached to transactions';

CREATE INDEX idx_tags_user_id ON tags (user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE transactions (
  id                UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id        UUID              NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id       UUID              REFERENCES categories(id) ON DELETE SET NULL,
  type              transaction_type  NOT NULL,
  amount            NUMERIC(18,4)     NOT NULL,
  currency          CHAR(3)           NOT NULL DEFAULT 'USD',
  amount_in_base    NUMERIC(18,4),               -- converted to user's base currency
  exchange_rate     NUMERIC(18,8),               -- rate used for conversion
  date              DATE              NOT NULL,
  value_date        DATE,                         -- settlement / value date
  description       TEXT              NOT NULL DEFAULT '',
  notes             TEXT,
  merchant          VARCHAR(150),
  location          VARCHAR(200),
  is_reconciled     BOOLEAN           NOT NULL DEFAULT FALSE,
  is_pending        BOOLEAN           NOT NULL DEFAULT FALSE,
  is_excluded       BOOLEAN           NOT NULL DEFAULT FALSE, -- exclude from budgets/reports
  is_split          BOOLEAN           NOT NULL DEFAULT FALSE, -- has transaction_splits
  reference_number  VARCHAR(100),
  cashew_id         BIGINT,                       -- original ID from Cashew import
  import_id         UUID,                         -- references cashew_import_logs
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  transactions IS 'Core financial transactions — the heart of FinanceOS';
COMMENT ON COLUMN transactions.amount_in_base IS 'Amount converted to user base currency for reports';
COMMENT ON COLUMN transactions.is_excluded IS 'When true, omitted from budget and spending reports';
COMMENT ON COLUMN transactions.cashew_id IS 'Original Cashew app integer ID for deduplication during import';

CREATE INDEX idx_transactions_user_id     ON transactions (user_id);
CREATE INDEX idx_transactions_account_id  ON transactions (account_id);
CREATE INDEX idx_transactions_category_id ON transactions (category_id);
CREATE INDEX idx_transactions_date        ON transactions (date DESC);
CREATE INDEX idx_transactions_type        ON transactions (type);
CREATE INDEX idx_transactions_cashew_id   ON transactions (cashew_id) WHERE cashew_id IS NOT NULL;
CREATE INDEX idx_transactions_import_id   ON transactions (import_id) WHERE import_id IS NOT NULL;
CREATE INDEX idx_transactions_description ON transactions USING gin(description gin_trgm_ops);
CREATE INDEX idx_transactions_merchant    ON transactions USING gin(merchant gin_trgm_ops);
-- Composite index for common dashboard query pattern
CREATE INDEX idx_transactions_user_date   ON transactions (user_id, date DESC);

-- ============================================================
-- TRANSACTION SPLITS
-- ============================================================

CREATE TABLE transaction_splits (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id  UUID          NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  category_id     UUID          REFERENCES categories(id) ON DELETE SET NULL,
  amount          NUMERIC(18,4) NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE transaction_splits IS 'Split transactions across multiple categories (amounts must sum to parent)';

CREATE INDEX idx_splits_transaction_id ON transaction_splits (transaction_id);

-- ============================================================
-- TRANSACTION TAGS (join table)
-- ============================================================

CREATE TABLE transaction_tags (
  transaction_id  UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

CREATE INDEX idx_transaction_tags_tag_id ON transaction_tags (tag_id);

-- ============================================================
-- TRANSFERS
-- ============================================================

CREATE TABLE transfers (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_account_id     UUID          NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id       UUID          NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  from_transaction_id UUID          UNIQUE REFERENCES transactions(id) ON DELETE SET NULL,
  to_transaction_id   UUID          UNIQUE REFERENCES transactions(id) ON DELETE SET NULL,
  amount              NUMERIC(18,4) NOT NULL,
  fee                 NUMERIC(18,4) DEFAULT 0,
  date                DATE          NOT NULL,
  description         TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CHECK (from_account_id != to_account_id)
);

COMMENT ON TABLE  transfers IS 'Transfers between accounts — linked to two transactions (debit + credit)';
COMMENT ON COLUMN transfers.fee IS 'Transfer fee charged (e.g. wire fee, conversion fee)';

CREATE INDEX idx_transfers_user_id        ON transfers (user_id);
CREATE INDEX idx_transfers_from_account   ON transfers (from_account_id);
CREATE INDEX idx_transfers_to_account     ON transfers (to_account_id);

-- ============================================================
-- BUDGETS
-- ============================================================

CREATE TABLE budgets (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100)  NOT NULL,
  period      budget_period NOT NULL DEFAULT 'monthly',
  start_date  DATE          NOT NULL,
  end_date    DATE,                                     -- NULL = rolling/ongoing
  amount      NUMERIC(18,4) NOT NULL,
  currency    CHAR(3)       NOT NULL DEFAULT 'USD',
  color       CHAR(7)       DEFAULT '#10b981',
  icon        VARCHAR(50)   DEFAULT 'wallet',
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  rollover    BOOLEAN       NOT NULL DEFAULT FALSE,    -- carry unspent forward
  notes       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  budgets IS 'Budget envelopes with period and rollover support';
COMMENT ON COLUMN budgets.rollover IS 'If true, unspent balance carries to next period';

CREATE INDEX idx_budgets_user_id ON budgets (user_id);

-- ============================================================
-- BUDGET CATEGORIES (many-to-many)
-- ============================================================

CREATE TABLE budget_categories (
  budget_id     UUID          NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id   UUID          NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  allocated     NUMERIC(18,4) NOT NULL DEFAULT 0,   -- per-category allocation within budget
  PRIMARY KEY (budget_id, category_id)
);

CREATE INDEX idx_budget_categories_category ON budget_categories (category_id);

-- ============================================================
-- GOALS
-- ============================================================

CREATE TABLE goals (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id      UUID          REFERENCES accounts(id) ON DELETE SET NULL,  -- linked savings account
  name            VARCHAR(100)  NOT NULL,
  description     TEXT,
  target_amount   NUMERIC(18,4) NOT NULL,
  current_amount  NUMERIC(18,4) NOT NULL DEFAULT 0,  -- denormalized
  currency        CHAR(3)       NOT NULL DEFAULT 'USD',
  target_date     DATE,
  status          goal_status   NOT NULL DEFAULT 'active',
  color           CHAR(7)       DEFAULT '#8b5cf6',
  icon            VARCHAR(50)   DEFAULT 'target',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  goals IS 'Savings goals with optional linked account and target date';
COMMENT ON COLUMN goals.current_amount IS 'Denormalized progress — updated when contributions are added';

CREATE INDEX idx_goals_user_id    ON goals (user_id);
CREATE INDEX idx_goals_account_id ON goals (account_id);

-- ============================================================
-- ATTACHMENTS
-- ============================================================

CREATE TABLE attachments (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id  UUID         REFERENCES transactions(id) ON DELETE CASCADE,
  filename        VARCHAR(255) NOT NULL,
  original_name   VARCHAR(255) NOT NULL,
  mime_type       VARCHAR(100) NOT NULL,
  size_bytes      BIGINT       NOT NULL,
  storage_path    TEXT         NOT NULL,   -- relative path on disk
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE attachments IS 'File attachments (receipts, statements) linked to transactions';

CREATE INDEX idx_attachments_user_id        ON attachments (user_id);
CREATE INDEX idx_attachments_transaction_id ON attachments (transaction_id);

-- ============================================================
-- RECURRING TRANSACTIONS
-- ============================================================

CREATE TABLE recurring_transactions (
  id              UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id      UUID               NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id     UUID               REFERENCES categories(id) ON DELETE SET NULL,
  type            transaction_type   NOT NULL,
  amount          NUMERIC(18,4)      NOT NULL,
  currency        CHAR(3)            NOT NULL DEFAULT 'USD',
  description     TEXT               NOT NULL,
  frequency       recurring_frequency NOT NULL,
  start_date      DATE               NOT NULL,
  end_date        DATE,              -- NULL = indefinite
  next_date       DATE               NOT NULL,
  last_created_at DATE,
  is_active       BOOLEAN            NOT NULL DEFAULT TRUE,
  auto_create     BOOLEAN            NOT NULL DEFAULT FALSE,  -- auto-insert when due
  reminder_days   INT                DEFAULT 3,               -- days before to notify
  notes           TEXT,
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  recurring_transactions IS 'Templates for recurring bills, subscriptions, and income';
COMMENT ON COLUMN recurring_transactions.auto_create IS 'When true, transactions are auto-inserted on next_date';
COMMENT ON COLUMN recurring_transactions.reminder_days IS 'Send notification N days before due date';

CREATE INDEX idx_recurring_user_id   ON recurring_transactions (user_id);
CREATE INDEX idx_recurring_next_date ON recurring_transactions (next_date) WHERE is_active = TRUE;

-- ============================================================
-- EXCHANGE RATES
-- ============================================================

CREATE TABLE exchange_rates (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency CHAR(3)       NOT NULL,
  quote_currency CHAR(3)      NOT NULL,
  rate          NUMERIC(18,8) NOT NULL,
  date          DATE          NOT NULL,
  source        VARCHAR(50)   DEFAULT 'manual',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (base_currency, quote_currency, date)
);

COMMENT ON TABLE exchange_rates IS 'Historical exchange rates for multi-currency support';

CREATE INDEX idx_exchange_rates_pair ON exchange_rates (base_currency, quote_currency, date DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id         UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      VARCHAR(200)      NOT NULL,
  body       TEXT              NOT NULL,
  data       JSONB,            -- arbitrary metadata (e.g. budget_id, account_id)
  is_read    BOOLEAN           NOT NULL DEFAULT FALSE,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'In-app notification feed — budget alerts, bill reminders, etc.';

CREATE INDEX idx_notifications_user_id  ON notifications (user_id, is_read, created_at DESC);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,  -- e.g. 'transaction.create', 'account.delete'
  entity_type VARCHAR(50),
  entity_id   UUID,
  old_data    JSONB,                  -- previous state (for UPDATE/DELETE)
  new_data    JSONB,                  -- new state
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all data mutations';

CREATE INDEX idx_audit_logs_user_id     ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity      ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at  ON audit_logs (created_at DESC);

-- ============================================================
-- CASHEW IMPORT LOGS
-- ============================================================

CREATE TABLE cashew_import_logs (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename            VARCHAR(255)  NOT NULL,
  status              import_status NOT NULL DEFAULT 'pending',
  total_records       INT           NOT NULL DEFAULT 0,
  imported_records    INT           NOT NULL DEFAULT 0,
  skipped_records     INT           NOT NULL DEFAULT 0,
  failed_records      INT           NOT NULL DEFAULT 0,
  error_log           JSONB,        -- array of {row, error} objects
  mapping_config      JSONB,        -- field mapping used
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cashew_import_logs IS 'Tracks Cashew ObjectBox data import jobs with per-row error details';

CREATE INDEX idx_cashew_imports_user_id ON cashew_import_logs (user_id, created_at DESC);

-- ============================================================
-- APP SETTINGS
-- ============================================================

CREATE TABLE app_settings (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         REFERENCES users(id) ON DELETE CASCADE,  -- NULL = global
  key         VARCHAR(100) NOT NULL,
  value       JSONB        NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, key)
);

COMMENT ON TABLE  app_settings IS 'Key-value settings store — both global (user_id NULL) and per-user';
COMMENT ON COLUMN app_settings.value IS 'JSONB allows storing strings, numbers, booleans, and objects';

CREATE INDEX idx_app_settings_user_id ON app_settings (user_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users', 'accounts', 'categories', 'transactions',
    'transfers', 'budgets', 'goals', 'recurring_transactions', 'app_settings'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- ACCOUNT BALANCE TRIGGER
-- Keep accounts.current_balance in sync when transactions change
-- ============================================================

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
    -- Reverse old amount
    IF OLD.type = 'income' THEN
      UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
    -- Apply new amount
    IF NEW.type = 'income' THEN
      UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transactions_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  WHEN (COALESCE(NEW.type, OLD.type) IN ('income', 'expense'))
  EXECUTE FUNCTION sync_account_balance();
