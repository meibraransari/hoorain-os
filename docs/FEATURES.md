# 🚀 Hoorain OS — Complete Feature Guide & Architecture Reference

**Repository:** [https://github.com/meibraransari/hoorain-os.git](https://github.com/meibraransari/hoorain-os.git)  
**Version:** 1.0.0 (Production Stable)  
**License:** MIT License  

Hoorain OS is a self-hosted, full-stack personal finance and executive accounting suite engineered for individuals, freelancers, and small business owners. It provides 100% data ownership, real-time mathematical precision, dynamic AI financial health rating, executive profit & loss summaries, credit limit safety gauges, debt amortization planners, and multi-format database backup/import engines.

---

## 📋 Table of Contents
1. [Core Financial Accounting Engine](#1-core-financial-accounting-engine)
2. [Executive Dashboard & Live Widgets](#2-executive-dashboard--live-widgets)
3. [AI Financial Health Rating Engine & Smart Insights](#3-ai-financial-health-rating-engine--smart-insights)
4. [Debt Payoff & Amortization Planner (Snowball vs. Avalanche)](#4-debt-payoff--amortization-planner-snowball-vs-avalanche)
5. [Overdue & Upcoming Subscriptions Tracker](#5-overdue--upcoming-subscriptions-tracker)
6. [Lent & Borrow Contact Ledger](#6-lent--borrow-contact-ledger)
7. [Luxury Reports & Financial Analytics Engine](#7-luxury-reports--financial-analytics-engine)
8. [Database Backup & Multi-Format Importer (Cashew SQL/SQLite)](#8-database-backup--multi-format-importer-cashew-sqlsqlite)
9. [Security, Roles & First-Boot Admin Setup](#9-security-roles--first-boot-admin-setup)
10. [Global Settings & Privacy Mode](#10-global-settings--privacy-mode)

---

## 1. Core Financial Accounting Engine

Hoorain OS uses a double-entry inspired single-entry accounting system with automated database triggers and real-time transaction balance synchronization.

### 💰 Real-Time Balance Synchronization Formula
$$\text{Current Balance} = \text{Initial Balance} + \sum (\text{Active Income}) - \sum (\text{Active Expenses})$$

- **PostgreSQL Database Trigger (`trg_sync_account_balance`)**: Automatically recalculates `accounts.current_balance` on every `INSERT`, `UPDATE`, or `DELETE` transaction.
- **Dynamic Service Aggregation**: `AccountsService.findAll()` evaluates non-excluded transactions for 100% mathematical accuracy across all bank, cash, and credit accounts.
- **Supported Account Types**:
  - `bank`: Bank Checking or Current Accounts (HDFC, ICICI, Kotak, etc.)
  - `savings`: Liquid Savings Accounts
  - `cash`: Physical Cash Holdings
  - `debit_card`: Debit Cards linked to checking accounts
  - `credit_card`: Credit Cards with configurable `creditLimit` and utilization gauges
  - `loan`: Personal Loans, Home Loans, Auto Loans
  - `digital_wallet`: Mobile Wallets (Paytm, Google Pay, Apple Pay)
  - `investment`: Mutual Funds, Stocks, ETFs
  - `crypto`: Digital Asset Wallets
  - `custom`: Custom Asset/Liability Accounts

---

## 2. Executive Dashboard & Live Widgets

The dashboard provides a real-time, customizable overview of financial health and cash flow velocity.

### 📈 Executive Profit & Loss (P&L) Summary Widget
- **Gross Revenue**: Sum of all non-transfer income inflows in the target period.
- **Operating Expenses**: Sum of all non-transfer category outflows in the target period.
- **Net Operating Profit**: $\text{Gross Revenue} - \text{Operating Expenses}$
- **Net Margin %**: $\left( \frac{\text{Net Operating Profit}}{\text{Gross Revenue}} \right) \times 100$
- **Month-over-Month ($\text{MoM}\%$) Growth Velocity**: Compares current month metrics against the preceding month's figures.

### 💳 Credit Utilization & Debt Safety Gauge Widget
- **Aggregate Utilization**: Computes total credit card balance against aggregate credit limit:
  $$\text{Utilization \%} = \left( \frac{\sum \text{Credit Balances}}{\sum \text{Credit Limits}} \right) \times 100$$
- **Safety Badges**:
  - 🟢 **Ideal ($< 30\%$)**: Excellent credit score maintenance
  - 🟡 **Warning ($30\% - 70\%$)**: Moderate credit usage
  - 🔴 **Danger ($> 70\%$)**: High risk credit utilization alert
- **Per-Card Breakdown**: Interactive cards showing balance, limit, and safety status per credit card.

### 💵 Net Worth & Monthly Cash Flow Cards
- **Net Worth**: Total Assets minus Total Liabilities (Credit Card & Loan Balances).
- **Monthly Income & Expense Cards**: Displays current month total inflow, outflow, and net savings rate $\%$.
- **Customizable Dashboard Layout**: Toggle visibility for all widgets via the **Customize Dashboard** popover.

---

## 3. AI Financial Health Rating Engine & Smart Insights

Computes a dynamic **Financial Health Index (0 - 100)** evaluating four core financial ratios:

### 📊 4 Core Metric Ratios (25 Points Each)
1. **Emergency Fund Ratio (25 pts)**:
   $$\text{Emergency Months} = \frac{\text{Liquid Savings}}{\text{Average Monthly Expense}}$$
   - Target: 3 to 6 months. Full 25 points awarded for $\ge 6$ months buffer.
2. **Debt-to-Income (DTI) Ratio (25 pts)**:
   $$\text{DTI \%} = \left( \frac{\text{Monthly Debt Payments}}{\text{Monthly Income}} \right) \times 100$$
   - Target: $< 36\%$. Full 25 points awarded for 0 debt or $\le 20\%$ DTI.
3. **Savings Rate Benchmark (25 pts)**:
   $$\text{Savings Rate \%} = \left( \frac{\text{Monthly Income} - \text{Monthly Expenses}}{\text{Monthly Income}} \right) \times 100$$
   - Target: $\ge 20\%$. Full 25 points awarded for saving $\ge 20\%$ of income.
4. **Budget Adherence Score (25 pts)**:
   $$\text{Budget Score} = \left( \frac{\text{Budgets Within Limit}}{\text{Total Configured Budgets}} \right) \times 25$$
   - Target: 100% adherence. Full 25 points awarded when no budgets are overspent.

### 💡 Automated Spending Insights
- **Category Expense Spikes**: Triggers warnings when category spending increases by $> 25\%$ month-over-month.
- **Emergency Fund Shield Notice**: Alerts when emergency reserves drop below 3 months.
- **Savings Rate Advice**: Recommends exact monthly surplus target to achieve 20% savings.

---

## 4. Debt Payoff & Amortization Planner (Snowball vs. Avalanche)

An interactive payoff planner for credit cards, home loans, personal loans, and vehicle financing.

### 🏔 Payoff Strategies Supported
1. **Debt Snowball**: Orders debts by smallest balance first. Provides quick psychological wins as small balances are eliminated rapidly.
2. **Debt Avalanche**: Orders debts by highest APR (interest rate) first. Mathematically minimizes total interest paid over time.

### 📅 Amortization Outputs
- **Debt-Free Date**: Exact estimated month and year of zero debt balance.
- **Interest Savings**: Total interest saved by making extra monthly payments.
- **Payoff Schedule**: Month-by-month principal vs interest payoff table.

---

## 5. Overdue & Upcoming Subscriptions Tracker

Tracks recurring bills, utility payments, and SaaS subscriptions (`/bills-recurring`).

- **Frequency Options**: Weekly, Monthly, Yearly.
- **Overdue Detection**: Automatically highlights overdue bills in red with days elapsed.
- **One-Click Payment Execution**: Clicking **Pay Now** automatically logs an expense transaction for the chosen account and updates the bill's next due date.

---

## 6. Lent & Borrow Contact Ledger

Tracks money given out to contacts and money borrowed from friends/family (`/lent-borrow`).

- **Money Lent (Receivable)**: Creates a transaction (`type = 'expense'`, `category = 'Lent'`) for your chosen account, updating cash balance and tracking outstanding receivables (`+₹XX,XXX`).
- **Money Borrowed (Payable)**: Creates a transaction (`type = 'income'`, `category = 'Borrowed'`), updating cash balance and tracking outstanding payables (`-₹XX,XXX`).
- **Settlement Workflow**: Marking a record as **Settled** updates status and balances cleanly.

---

## 7. Luxury Reports & Financial Analytics Engine

Glassmorphic reports page (`/reports`) with explicit **Apply Filter** state:

- **Glassmorphic Calendar DateRangePicker**: Filter reports by preset ranges (*This Month*, *Last Month*, *This Year*, *All Time*, or *Custom Date Range*).
- **Apply Filter Workflow**: Charts and summary metrics refetch ONLY when clicking **Apply Filter**, ensuring fast navigation.
- **Visual Analytics**: Area charts for daily cash flow trends, donut charts for category distributions, and tabular breakdowns.

---

## 8. Database Backup & Multi-Format Importer (Cashew SQL/SQLite)

Import existing data from mobile finance apps and database backups (`/api/v1/import/cashew`).

- **Auto-Detection Engine**: `ImportService.processCashewFile` auto-detects both binary SQLite databases (`.sqlite` / `.db`) and plain-text SQL scripts (`.sql` dumps containing `CREATE TABLE` and `INSERT INTO` statements).
- **SQLite Engine Execution**: SQL scripts are executed inside a temporary SQLite database before seeding PostgreSQL, guaranteeing 100% data integrity without database corruption.
- **Full Data Backup & Export**: Export entire account history as CSV (`/api/v1/export/csv`), JSON (`/api/v1/export/json`), or SQL Backup (`/api/v1/export/backup`).

---

## 9. Security, Roles & First-Boot Admin Setup

- **JWT Bearer Authentication**: Short-lived access tokens (15m) and long-lived refresh tokens (30d).
- **Password Encryption**: Bcrypt hashing (`SALT_ROUNDS = 10`).
- **Automatic First-Boot Admin Seeder**: `AdminSeederService.seed()` generates default administrator credentials (`admin` / `AdminPass123!`) upon initial container startup.
- **Role-Based Authorization**: `ADMIN` and `VIEWER` roles.

---

## 10. Global Settings & Privacy Mode

- **Privacy Mode Toggle**: Eye icon toggle on the top navigation bar masks all sensitive currency values (`₹4,34,298.54` $\rightarrow$ `••••••`).
- **Currency & Formatting**: Configurable default currency (`INR`, `USD`, `EUR`, `GBP`), date format (`DD/MM/YYYY`), and number formatting.
- **Erase / Reset Database**: Built-in system reset in Settings to safely wipe test data while preserving admin credentials.
