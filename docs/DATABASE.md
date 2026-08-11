# 🗄 Hoorain OS Database Documentation

**Repository:** `https://github.com/meibraransari/hoorain-os.git`

## Table of Contents
- [Schema Overview](#schema-overview)
- [Table Descriptions](#table-descriptions)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Balance Calculation Logic](#balance-calculation-logic)
- [Migration Process](#migration-process)
- [Cashew Import Mapping](#cashew-import-mapping)

---

## Schema Overview

Hoorain OS uses **PostgreSQL 17** with the following design principles:

- **UUID primary keys** everywhere (via `uuid-ossp`)
- **Soft deletes** via `is_active` flags (no hard deletes for critical data)
- **Denormalized balances** on `accounts.current_balance` kept in sync by triggers
- **JSONB** for flexible metadata (`notifications.data`, `audit_logs.old_data`, etc.)
- **Full-text search** via `pg_trgm` GIN indexes on `description` and `merchant` fields
- **Immutable audit log** — all mutations are recorded in `audit_logs`
- **Trigger-managed timestamps** — `updated_at` maintained automatically

---

## Table Descriptions

### `users`

Application users. Supports multiple users (household multi-user scenarios).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | VARCHAR(320) | Unique, used for login |
| `username` | VARCHAR(50) | Unique display handle |
| `password_hash` | TEXT | bcrypt hash |
| `currency` | CHAR(3) | ISO 4217 base currency |
| `locale` | VARCHAR(10) | BCP 47 locale (e.g. `en-US`) |
| `timezone` | VARCHAR(50) | IANA timezone |
| `is_admin` | BOOLEAN | Admin access flag |

---

### `accounts`

Financial accounts of any type. All transactions belong to an account.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users |
| `type` | ENUM | `checking`, `savings`, `credit_card`, `investment`, `loan`, `mortgage`, `cash`, `crypto`, `other` |
| `initial_balance` | NUMERIC(18,4) | Opening balance |
| `current_balance` | NUMERIC(18,4) | Denormalized — maintained by trigger |
| `credit_limit` | NUMERIC(18,4) | Credit cards only |
| `include_in_total` | BOOLEAN | Controls net worth calc |

---

### `categories`

Hierarchical transaction categories. Default categories are seeded globally (`user_id = NULL`).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | NULL = global default |
| `parent_id` | UUID | Self-referential FK (subcategories) |
| `type` | ENUM | `income` or `expense` |
| `is_default` | BOOLEAN | System-seeded (read-only) |

---

### `transactions`

The core entity — every financial movement.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `account_id` | UUID | FK → accounts |
| `category_id` | UUID | Nullable FK → categories |
| `type` | ENUM | `income`, `expense`, `transfer` |
| `amount` | NUMERIC(18,4) | Always positive; type determines sign |
| `amount_in_base` | NUMERIC(18,4) | Converted to user's base currency |
| `exchange_rate` | NUMERIC(18,8) | Rate applied for conversion |
| `date` | DATE | Transaction date (user-entered) |
| `value_date` | DATE | Settlement/value date (bank) |
| `is_excluded` | BOOLEAN | If true, omit from reports/budgets |
| `is_split` | BOOLEAN | Has child `transaction_splits` |
| `cashew_id` | BIGINT | Original Cashew ID (dedup key) |

---

### `transaction_splits`

When a transaction spans multiple categories (e.g. a supermarket receipt split into Groceries + Household). Split amounts must sum to the parent transaction amount.

| Column | Type | Notes |
|---|---|---|
| `transaction_id` | UUID | FK → transactions |
| `category_id` | UUID | Per-split category |
| `amount` | NUMERIC(18,4) | Portion amount |

---

### `transaction_tags` _(join table)_

Many-to-many link between transactions and tags.

---

### `transfers`

A transfer between two accounts creates two linked transactions: a debit on `from_account` and a credit on `to_account`.

| Column | Type | Notes |
|---|---|---|
| `from_transaction_id` | UUID | FK → transactions (debit) |
| `to_transaction_id` | UUID | FK → transactions (credit) |
| `fee` | NUMERIC(18,4) | Transfer/wire fee |

---

### `budgets`

Period-based budget envelopes. Can cover all categories or specific ones.

| Column | Type | Notes |
|---|---|---|
| `period` | ENUM | `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly`, `custom` |
| `rollover` | BOOLEAN | Carry unspent balance to next period |
| `end_date` | DATE | NULL = rolling/indefinite |

---

### `budget_categories`

Allocates a portion of a budget's total amount to specific categories.

---

### `goals`

Savings goals with optional linked account.

| Column | Type | Notes |
|---|---|---|
| `target_amount` | NUMERIC(18,4) | Goal target |
| `current_amount` | NUMERIC(18,4) | Denormalized progress |
| `target_date` | DATE | Optional deadline |
| `status` | ENUM | `active`, `completed`, `paused`, `cancelled` |

---

### `recurring_transactions`

Templates for auto-generating periodic transactions.

| Column | Type | Notes |
|---|---|---|
| `frequency` | ENUM | `daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly` |
| `next_date` | DATE | Next due date |
| `auto_create` | BOOLEAN | Auto-insert transaction when due |
| `reminder_days` | INT | Days before to send notification |

---

### `exchange_rates`

Historical daily FX rates for multi-currency support.

| Column | Type | Notes |
|---|---|---|
| `base_currency` | CHAR(3) | ISO 4217 |
| `quote_currency` | CHAR(3) | ISO 4217 |
| `rate` | NUMERIC(18,8) | Quote per 1 base |
| `source` | VARCHAR | `manual`, `openexchangerates`, etc. |

---

### `cashew_import_logs`

Tracks every Cashew import job with per-row error details.

| Column | Type | Notes |
|---|---|---|
| `status` | ENUM | `pending`, `processing`, `completed`, `failed`, `partial` |
| `total_records` | INT | Total rows in source file |
| `imported_records` | INT | Successfully imported |
| `skipped_records` | INT | Duplicates skipped |
| `error_log` | JSONB | Array of `{row, error}` objects |

---

## Entity Relationship Diagram

```
users (1)─────────────────────────────────────────── (N) accounts
  │                                                         │
  │ (1)                                                     │ (1)
  │                                                         │
  ├──── (N) categories (hierarchical tree)                  │
  │          │                                              │
  │          │ (N)                                          │ (N)
  │          │                                              │
  ├──── (N) transactions ◄───────────────────────────────────
  │          │   │
  │          │   ├─── (N) transaction_splits
  │          │   │         └── (1) categories
  │          │   │
  │          │   └─── (N) transaction_tags ◄─── (N) tags
  │          │
  ├──── (N) transfers ─── (1) transactions (from)
  │                  └─── (1) transactions (to)
  │
  ├──── (N) budgets
  │          └─── (N) budget_categories ◄─── (N) categories
  │
  ├──── (N) goals ──── (1) accounts
  │
  ├──── (N) attachments ─── (1) transactions
  │
  ├──── (N) recurring_transactions ─── (1) accounts
  │
  ├──── (N) debts (Snowball & Avalanche Amortization Planner)
  │
  ├──── (N) notifications
  ├──── (N) cashew_import_logs
  └──── (N) app_settings
```

---

### `debts`

Debt records for the Debt Payoff & Amortization Planner (Credit cards, Mortgages, Personal loans).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users |
| `title` | VARCHAR | Loan or debt title |
| `balance` | NUMERIC(20,4) | Current owed balance |
| `interest_rate` | NUMERIC(10,4) | Annual Percentage Rate (APR %) |
| `minimum_payment` | NUMERIC(20,4) | Required minimum monthly payment |
| `extra_payment` | NUMERIC(20,4) | Optional extra monthly payoff pool |
| `category` | VARCHAR | Debt type (Credit Card, Home Loan, Car Loan) |
| `notes` | TEXT | Lender reference or notes |

---

---

## Balance Calculation Logic

### Denormalized Balance (Recommended)

`accounts.current_balance` is maintained by a database trigger on the `transactions` table:

```sql
-- Trigger: trg_sync_account_balance
-- Fires: AFTER INSERT OR UPDATE OR DELETE on transactions
-- Effect: ± updates accounts.current_balance

-- On INSERT income:  current_balance += amount
-- On INSERT expense: current_balance -= amount
-- On DELETE income:  current_balance -= amount
-- On DELETE expense: current_balance += amount
-- On UPDATE:         reverses old, applies new
```

### Dynamic Balance Re-calculation
`AccountsService.findAll()` evaluates:

$$\text{currentBalance} = \text{initialBalance} + \sum (\text{Active Income}) - \sum (\text{Active Expenses})$$

---

## Lent & Borrow (Debts & Loans) Schema Mapping

Every debt record in the **Lent & Borrow** module maps to an underlying `Transaction` entry:

- **Money Lent (Receivable)**: Saved as a transaction (`type = 'expense'`, `category = 'Lent'`). Decreases cash balance and registers total receivables.
- **Money Borrowed (Payable)**: Saved as a transaction (`type = 'income'`, `category = 'Borrowed'`). Increases cash balance and registers total payables.
- **Settled Loans**: Toggling settled status updates `excludeFromBalance = true` and prefixes `[SETTLED]` to notes.

---

### Net Worth Calculation

```sql
SELECT
  SUM(CASE WHEN type IN ('checking', 'savings', 'investment', 'cash', 'crypto')
      THEN current_balance ELSE 0 END) AS assets,
  SUM(CASE WHEN type IN ('credit_card', 'loan', 'mortgage')
      THEN current_balance ELSE 0 END) AS liabilities,
  SUM(CASE
      WHEN type IN ('checking', 'savings', 'investment', 'cash', 'crypto') THEN current_balance
      WHEN type IN ('credit_card', 'loan', 'mortgage') THEN -current_balance
      ELSE 0 END) AS net_worth
FROM accounts
WHERE user_id = $1 AND is_active = TRUE AND include_in_total = TRUE;
```

---

## Migration & Seeding Process

### Automated Migrations

TypeORM database migrations run automatically upon NestJS container startup or manually via `npm run migration:run`. The platform includes 4 core migration scripts:

1. **`1786266764766-InitSchema.ts`**: Core application tables (`users`, `accounts`, `categories`, `transactions`, `recurring_transactions`, `budgets`, `goals`, `tags`, `attachments`, `notifications`, etc.).
2. **`1786266770000-AddIndexesAndBalanceTrigger.ts`**: PostgreSQL indexes for ultra-fast queries and `trg_sync_account_balance` triggers.
3. **`1786417200000-AddDebtsTable.ts`**: `debts` table for Debt Payoff & Amortization Planner.
4. **`1786417300000-AddMissingColumnsAndAccountTypesTable.ts`**: `account_types` table creation and `transactions` schema columns (`goal_id`, `budget_id`, `exclude_from_balance`).

### First-Boot Seeding (`AdminSeederService`)

When launching the application on a clean database, `AdminSeederService` automatically seeds:
- **Admin User**: Default `admin` user (`admin@hoorain.app`).
- **Account Types**: Pre-seeded default account types (Bank Account, Savings Account, Cash Wallet, Credit Card, Investment, Digital Wallet).
- **Default Categories**: Income categories (Salary, Freelance, Investments, Borrowed) and Expense categories (Food & Dining, Rent & Housing, Utilities, Transportation, Shopping, Health, Entertainment, Debt Payoff, Lent).

### Running Migrations Manually

```bash
# Run pending TypeORM migrations inside backend container
docker compose exec backend npm run migration:run
```

# Or via the backend CLI
docker compose exec backend npm run migration:run
```

---

## Cashew Import Mapping

The following table shows how Cashew fields map to FinanceOS fields.

### Transactions

| Cashew Field | FinanceOS Field | Notes |
|---|---|---|
| `id` (ObjectBox int) | `transactions.cashew_id` | Stored for deduplication |
| `name` | `transactions.description` | Transaction title |
| `note` | `transactions.notes` | Additional notes |
| `amount` | `transactions.amount` | Positive value |
| `income` (bool) | `transactions.type` | `true` → `income`, `false` → `expense` |
| `dateCreated` | `transactions.date` | Parsed as DATE |
| `categoryFk` | `transactions.category_id` | Matched by name → UUID |
| `walletFk` | `transactions.account_id` | Matched by name → UUID |

### Categories

| Cashew Field | FinanceOS Field | Notes |
|---|---|---|
| `name` | `categories.name` | Matched or created |
| `income` | `categories.type` | income / expense |
| `iconName` | `categories.icon` | Remapped to Lucide icon names |
| `colour` | `categories.color` | Hex color string |

### Accounts (Wallets)

| Cashew Field | FinanceOS Field | Notes |
|---|---|---|
| `name` | `accounts.name` | — |
| `currency` | `accounts.currency` | ISO 4217 |
| `decimals` | — | Used during amount parsing |

### Import Deduplication

Duplicate detection uses `cashew_id` (original Cashew integer ID):

```sql
-- Check if already imported
SELECT id FROM transactions WHERE cashew_id = $1 AND user_id = $2;
```

If a record with the same `cashew_id` already exists, it is counted as `skipped_records` and not duplicated.
