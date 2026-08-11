# 📡 Hoorain OS REST API Reference

**Repository:** `https://github.com/meibraransari/hoorain-os.git`  
**Base URL:** `http://localhost:8080/api/v1`  
**Swagger UI:** `http://localhost:8080/api/docs`  
**Authentication:** JWT Bearer Token (`Authorization: Bearer <accessToken>`)  
**Format:** JSON (`Content-Type: application/json`)

---

## 📋 Table of Contents
- [Authentication & JWT Lifecycle](#authentication--jwt-lifecycle)
- [Pagination & Global Envelopes](#pagination--global-envelopes)
- [HTTP Status & Error Codes](#http-status--error-codes)
- [API Modules & Endpoints](#api-modules--endpoints)
  - [1. Authentication (`/api/v1/auth`)](#1-authentication-apiv1auth)
  - [2. User Management (`/api/v1/users`)](#2-user-management-apiv1users)
  - [3. Financial Accounts (`/api/v1/accounts`)](#3-financial-accounts-apiv1accounts)
  - [4. Account Types (`/api/v1/account-types`)](#4-account-types-apiv1account-types)
  - [5. Transactions (`/api/v1/transactions`)](#5-transactions-apiv1transactions)
  - [6. Categories (`/api/v1/categories`)](#6-categories-apiv1categories)
  - [7. Monthly Budgets (`/api/v1/budgets`)](#7-monthly-budgets-apiv1budgets)
  - [8. Financial Goals (`/api/v1/goals`)](#8-financial-goals-apiv1goals)
  - [9. Debt Payoff & Amortization (`/api/v1/debts`)](#9-debt-payoff--amortization-apiv1debts)
  - [10. Recurring Transactions & Bills (`/api/v1/recurring-transactions`)](#10-recurring-transactions--bills-apiv1recurring-transactions)
  - [11. AI Health & Spending Insights (`/api/v1/insights`)](#11-ai-health--spending-insights-apiv1insights)
  - [12. Executive Analytics & Reports (`/api/v1/reports`)](#12-executive-analytics--reports-apiv1reports)
  - [13. Database Backup & Exporter (`/api/v1/export`)](#13-database-backup--exporter-apiv1export)
  - [14. Multi-Format Importer (`/api/v1/import`)](#14-multi-format-importer-apiv1import)
  - [15. System Settings (`/api/v1/settings`)](#15-system-settings-apiv1settings)
  - [16. Health Monitor (`/api/v1/health`)](#16-health-monitor-apiv1health)

---

## Authentication & JWT Lifecycle

Hoorain OS uses **JWT Bearer tokens** with short-lived access tokens and long-lived refresh tokens.

```
POST /api/v1/auth/login → Returns { accessToken (15m), refreshToken (30d), user }
                                 ↓
                   Set Header: Authorization: Bearer <accessToken>
                                 ↓
          Access Token Expired → POST /api/v1/auth/refresh
```

### Authorization Header Format
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Pagination & Global Envelopes

All list endpoints support uniform query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number (1-indexed) |
| `limit` | `number` | `50` | Maximum records per page (max: `2000`) |
| `search` | `string` | — | Search title, description, or notes |
| `accountId` | `string` | — | Filter records by Account UUID |
| `categoryId` | `string` | — | Filter records by Category UUID |
| `type` | `string` | — | Filter by type (`income`, `expense`, `transfer`) |
| `from` | `date` | — | ISO date start filter (`YYYY-MM-DD`) |
| `to` | `date` | — | ISO date end filter (`YYYY-MM-DD`) |

---

## HTTP Status & Error Codes

| Status Code | Code | Description |
|---|---|---|
| `200 OK` | `SUCCESS` | Request completed successfully |
| `201 Created` | `CREATED` | Resource successfully created |
| `400 Bad Request` | `VALIDATION_ERROR` | Request body or query parameters invalid |
| `401 Unauthorized` | `UNAUTHORIZED` | Missing, expired, or invalid JWT token |
| `403 Forbidden` | `FORBIDDEN` | Admin privileges required |
| `404 Not Found` | `NOT_FOUND` | Target resource does not exist |
| `500 Server Error` | `INTERNAL_ERROR` | Internal server exception |

---

## API Modules & Endpoints

### 1. Authentication (`/api/v1/auth`)

#### `POST /api/v1/auth/login`
Authenticates a user via `username` or `email` and returns JWT tokens.

**Request Body:**
```json
{
  "username": "admin",
  "password": "AdminPass123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJI...",
  "refreshToken": "eyJhbGciOiJI...",
  "user": {
    "id": "accb7097-fa35-4399-bfa2-7d2f039ef263",
    "username": "admin",
    "email": "admin@hoorain.app",
    "role": "ADMIN"
  }
}
```

---

#### `POST /api/v1/auth/refresh`
Generates a new access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJI..."
}
```

---

#### `POST /api/v1/auth/logout`
Invalidates active session token.

---

### 2. User Management (`/api/v1/users`)

#### `GET /api/v1/users/me`
Retrieves currently authenticated user's profile information.

#### `PUT /api/v1/users/me`
Updates user profile settings (name, email, default currency).

#### `POST /api/v1/users` *(Admin Only)*
Creates a new user or administrator account.

**Request Body:**
```json
{
  "username": "hoorain_admin2",
  "email": "admin2@hoorain.app",
  "password": "SecurePassword123!",
  "role": "ADMIN"
}
```

---

### 3. Financial Accounts (`/api/v1/accounts`)

#### `GET /api/v1/accounts`
Retrieves all active bank, cash, savings, and credit accounts for the current user with dynamically synchronized balances.

**Response:**
```json
[
  {
    "id": "65844dda-087b-41f9-8c6a-8b9ee370dab0",
    "name": "HDFC Salary Account",
    "type": "bank",
    "currency": "INR",
    "initialBalance": 5000.00,
    "currentBalance": 297820.86,
    "creditLimit": 0.00,
    "color": "#6c63ff",
    "includeInNetWorth": true,
    "isActive": true
  }
]
```

---

#### `POST /api/v1/accounts`
Creates a new financial account.

**Request Body:**
```json
{
  "name": "ICICI Credit Card",
  "type": "credit_card",
  "currency": "INR",
  "initialBalance": 0,
  "creditLimit": 300000,
  "color": "#ff9800",
  "includeInNetWorth": true
}
```

---

#### `PUT /api/v1/accounts/:id`
Updates an existing account's details, initial balance, or credit limit.

---

#### `DELETE /api/v1/accounts/:id`
Deactivates an account (`isActive = false`).

---

### 4. Account Types (`/api/v1/account-types`)

#### `GET /api/v1/account-types`
Lists all available system account types (`bank`, `savings`, `cash`, `debit_card`, `credit_card`, `loan`, `digital_wallet`, `investment`, `crypto`, `custom`).

---

### 5. Transactions (`/api/v1/transactions`)

#### `GET /api/v1/transactions`
Retrieves paginated, filtered transaction records.

**Query Parameters:**
`?page=1&limit=50&search=salary&type=income&accountId=uuid&from=2026-08-01&to=2026-08-31`

**Response:**
```json
{
  "data": [
    {
      "id": "tx-uuid-123",
      "title": "Monthly Salary Credit",
      "amount": 103761.00,
      "type": "income",
      "date": "2026-08-01T00:00:00.000Z",
      "account": { "id": "acc-1", "name": "HDFC" },
      "category": { "id": "cat-1", "name": "Salary" },
      "isTransfer": false,
      "excludeFromBalance": false
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1521,
    "totalPages": 31
  }
}
```

---

#### `POST /api/v1/transactions`
Logs a new income, expense, or fund transfer.

**Request Body:**
```json
{
  "title": "Grocery Shopping",
  "amount": 2450.00,
  "type": "expense",
  "date": "2026-08-11",
  "accountId": "65844dda-087b-41f9-8c6a-8b9ee370dab0",
  "categoryId": "cat-uuid-grocery",
  "notes": "Supermarket weekly restock"
}
```

---

### 6. Categories (`/api/v1/categories`)

#### `GET /api/v1/categories`
Retrieves all transaction categories.

#### `POST /api/v1/categories`
Creates a custom category with icon and accent color.

---

### 7. Monthly Budgets (`/api/v1/budgets`)

#### `GET /api/v1/budgets`
Retrieves monthly budget caps and real-time spent totals.

**Response:**
```json
[
  {
    "id": "budget-uuid-1",
    "name": "Dining & Food",
    "amount": 15000.00,
    "spent": 8450.00,
    "period": "monthly",
    "category": { "name": "Food & Dining" }
  }
]
```

---

### 8. Financial Goals (`/api/v1/goals`)

#### `GET /api/v1/goals`
Lists target savings goals, current saved progress, and target completion dates.

---

### 9. Debt Payoff & Amortization (`/api/v1/debts`)

#### `GET /api/v1/debts`
Retrieves all credit card, loan, and personal financing debts.

#### `POST /api/v1/debts`
Registers a new debt with minimum payment and APR interest rate.

**Request Body:**
```json
{
  "name": "Home Loan",
  "balance": 2500000,
  "interestRate": 8.5,
  "minimumPayment": 22000,
  "extraPayment": 5000
}
```

---

### 10. Recurring Transactions & Bills (`/api/v1/recurring-transactions`)

#### `GET /api/v1/recurring-transactions`
Lists active recurring subscriptions and utility bills.

#### `POST /api/v1/recurring-transactions/:id/pay`
Executes an immediate bill payment, creating an expense transaction and updating the next due date.

---

### 11. AI Health & Spending Insights (`/api/v1/insights`)

#### `GET /api/v1/insights/health-score`
Computes the dynamic **AI Financial Health Score (0 - 100)** evaluating Emergency Fund Coverage, Debt-to-Income (DTI), Savings Rate Benchmark, and Budget Adherence.

**Response:**
```json
{
  "healthScore": 100,
  "ratingLabel": "Excellent",
  "ratingColor": "text-emerald-400",
  "metrics": {
    "emergencyMonths": 23.1,
    "emergencyScore": 25,
    "dtiRatio": 0,
    "dtiScore": 25,
    "savingsRate": 81.9,
    "savingsScore": 25,
    "budgetScore": 25,
    "liquidSavings": 434298.54,
    "currentMonthIncome": 103761,
    "currentMonthExpense": 18775,
    "monthlyDebtPayments": 0
  },
  "insights": [
    {
      "type": "success",
      "title": "Robust Emergency Shield",
      "description": "Your liquid emergency fund covers 23.1 months of expenses, exceeding the 6-month benchmark!"
    }
  ]
}
```

---

### 12. Executive Analytics & Reports (`/api/v1/reports`)

#### `GET /api/v1/reports/profit-loss`
Retrieves Gross Revenue, Operating Expenses, Net Operating Profit, Net Margin %, and Month-over-Month ($\text{MoM}\%$) growth velocity.

**Response:**
```json
{
  "grossRevenue": 103761.00,
  "operatingExpenses": 18775.00,
  "netOperatingProfit": 84986.00,
  "netMarginPercentage": 81.9,
  "momRevenueGrowth": -12.2,
  "momExpenseGrowth": -52.1,
  "momProfitGrowth": 7.6
}
```

---

#### `GET /api/v1/reports/credit-utilization`
Retrieves total credit limit vs. balance, overall safety status (`ideal` $<30\%$, `warning` $30-70\%$, `danger` $>70\%$), and per-card utilization breakdown.

**Response:**
```json
{
  "totalCreditLimit": 300000.00,
  "totalCreditUsed": 0.00,
  "overallUtilizationPercentage": 0.0,
  "overallSafetyStatus": "ideal",
  "perCardBreakdown": [
    {
      "id": "acc-uuid-1",
      "name": "ICICI Credit Card",
      "type": "credit_card",
      "currentBalance": 0.00,
      "creditLimit": 300000.00,
      "utilizationPercentage": 0.0,
      "safetyBadge": "ideal"
    }
  ]
}
```

---

### 13. Database Backup & Exporter (`/api/v1/export`)

- `GET /api/v1/export/csv`: Downloads account history as a `.csv` spreadsheet.
- `GET /api/v1/export/json`: Downloads full dataset as structured JSON.
- `GET /api/v1/export/backup`: Downloads complete SQL database dump.

---

### 14. Multi-Format Importer (`/api/v1/import`)

- `POST /api/v1/import/cashew`: Auto-detects and imports plain-text `.sql` scripts and `.sqlite` binaries exported from mobile finance apps.
- `GET /api/v1/import/cashew`: Lists past import job logs and statistics.

---

### 15. System Settings (`/api/v1/settings`)

- `GET /api/v1/settings`: Fetches system preferences (currency, date format, widget toggles).
- `PUT /api/v1/settings`: Updates preferences.
- `DELETE /api/v1/settings/reset`: Safely wipes test transactions and resets database state while preserving admin credentials.

---

### 16. Health Monitor (`/api/v1/health`)

#### `GET /api/v1/health`
Returns live container, PostgreSQL, and Redis connectivity health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-11T17:32:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```
