# 📡 Hoorain OS API Reference

**Repository:** `https://github.com/meibraransari/hoorain-os.git`  
**Base URL:** `http://localhost:8080/api/v1`  
**Interactive Docs:** `http://localhost:8080/api/docs` (Swagger UI)  
**Content-Type:** `application/json` (unless uploading files)

---

## Table of Contents
- [Authentication](#authentication)
- [Pagination & Filtering](#pagination--filtering)
- [Error Codes](#error-codes)
- [Endpoints](#endpoints)
  - [Auth](#auth)
  - [Users](#users)
  - [Accounts](#accounts)
  - [Transactions](#transactions)
  - [Categories](#categories)
  - [Tags](#tags)
  - [Transfers](#transfers)
  - [Budgets](#budgets)
  - [Goals](#goals)
  - [Recurring Transactions](#recurring-transactions)
  - [Attachments](#attachments)
  - [Import (Cashew)](#import-cashew)
  - [Reports](#reports)
  - [Notifications](#notifications)
  - [Health](#health)

---

## Authentication

FinanceOS uses **JWT Bearer tokens** with access + refresh token rotation.

### Token Lifecycle

```
POST /auth/login → { accessToken (15m), refreshToken (30d) }
                            ↓
               Use accessToken in all requests
                            ↓
          Token expires → POST /auth/refresh
                            ↓
              New accessToken + new refreshToken
```

### Authorization Header

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Pagination & Filtering

All list endpoints support:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | `1` | Page number (1-indexed) |
| `limit` | int | `20` | Items per page (max: 100) |
| `sortBy` | string | varies | Field to sort by |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `search` | string | — | Full-text search |
| `startDate` | date | — | ISO 8601 date filter start |
| `endDate` | date | — | ISO 8601 date filter end |

### Response Envelope

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 247,
    "totalPages": 13,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Error Codes

| HTTP Status | Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request body fails validation |
| `401` | `UNAUTHORIZED` | Missing or invalid token |
| `401` | `TOKEN_EXPIRED` | Access token has expired |
| `403` | `FORBIDDEN` | Insufficient permissions |
| `404` | `NOT_FOUND` | Resource does not exist |
| `409` | `CONFLICT` | Duplicate resource (e.g. same email) |
| `413` | `FILE_TOO_LARGE` | Upload exceeds MAX_UPLOAD_SIZE |
| `422` | `UNPROCESSABLE` | Business logic error |
| `429` | `RATE_LIMITED` | Too many requests |
| `500` | `INTERNAL_ERROR` | Server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "amount", "message": "amount must be a positive number" }
    ]
  }
}
```

---

## Endpoints

---

### Auth

#### `POST /auth/register`

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "displayName": "John Doe",
  "currency": "USD",
  "timezone": "America/New_York"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "username": "johndoe" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

#### `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900,
    "user": { "id": "uuid", "email": "user@example.com", "displayName": "John Doe" }
  }
}
```

---

#### `POST /auth/refresh`

Exchange a refresh token for new tokens.

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

---

#### `POST /auth/logout`

Revoke the refresh token. Requires `Authorization` header.

**Response `200`:** `{ "success": true }`

---

#### `POST /auth/forgot-password`

**Request:** `{ "email": "user@example.com" }`

**Response `200`:** `{ "success": true, "message": "If the email exists, a reset link was sent." }`

---

#### `POST /auth/reset-password`

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

---

### Users

#### `GET /users/me`
Get current user profile.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "currency": "USD",
    "locale": "en-US",
    "timezone": "America/New_York",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `PATCH /users/me`

Update profile. All fields optional.

**Request:**
```json
{
  "displayName": "Johnny Doe",
  "currency": "EUR",
  "timezone": "Europe/London"
}
```

---

#### `PATCH /users/me/password`

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

---

### Accounts

#### `GET /accounts`

List all accounts for the authenticated user.

**Query params:** `?includeInactive=false`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Chase Checking",
      "type": "checking",
      "currency": "USD",
      "currentBalance": 4250.00,
      "initialBalance": 1000.00,
      "color": "#6366f1",
      "icon": "bank",
      "isActive": true,
      "includeInTotal": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### `POST /accounts`

**Request:**
```json
{
  "name": "Chase Checking",
  "type": "checking",
  "currency": "USD",
  "initialBalance": 1000.00,
  "color": "#6366f1",
  "icon": "bank",
  "institutionName": "Chase",
  "includeInTotal": true
}
```

---

#### `GET /accounts/:id`
#### `PATCH /accounts/:id`
#### `DELETE /accounts/:id`

---

#### `GET /accounts/:id/balance-history`

Returns daily balance over a date range.

**Query:** `?startDate=2024-01-01&endDate=2024-12-31`

**Response:**
```json
{
  "success": true,
  "data": [
    { "date": "2024-01-01", "balance": 1000.00 },
    { "date": "2024-01-02", "balance": 950.00 }
  ]
}
```

---

### Transactions

#### `GET /transactions`

**Query params:**

| Param | Type | Description |
|---|---|---|
| `accountId` | UUID | Filter by account |
| `categoryId` | UUID | Filter by category |
| `type` | string | `income`, `expense`, `transfer` |
| `startDate` | date | Start date (inclusive) |
| `endDate` | date | End date (inclusive) |
| `search` | string | Search description/merchant |
| `minAmount` | number | Minimum amount |
| `maxAmount` | number | Maximum amount |
| `tagIds` | UUID[] | Filter by tag(s) |
| `isReconciled` | bool | Filter reconciled |
| `isPending` | bool | Filter pending |
| `isExcluded` | bool | Include excluded |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "accountName": "Chase Checking",
      "categoryId": "uuid",
      "categoryName": "Groceries",
      "type": "expense",
      "amount": 85.50,
      "currency": "USD",
      "date": "2024-09-15",
      "description": "Whole Foods Market",
      "merchant": "Whole Foods",
      "isReconciled": false,
      "isPending": false,
      "tags": [{ "id": "uuid", "name": "weekly-shop", "color": "#94a3b8" }],
      "attachments": [],
      "createdAt": "2024-09-15T18:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1247 }
}
```

---

#### `POST /transactions`

**Request:**
```json
{
  "accountId": "uuid",
  "categoryId": "uuid",
  "type": "expense",
  "amount": 85.50,
  "currency": "USD",
  "date": "2024-09-15",
  "description": "Whole Foods Market",
  "merchant": "Whole Foods",
  "notes": "Weekly groceries",
  "tagIds": ["uuid"],
  "splits": [
    { "categoryId": "uuid", "amount": 50.00, "description": "Groceries" },
    { "categoryId": "uuid", "amount": 35.50, "description": "Household" }
  ]
}
```

> When `splits` is provided, `categoryId` can be omitted; `amount` must equal sum of splits.

---

#### `GET /transactions/:id`
#### `PATCH /transactions/:id`
#### `DELETE /transactions/:id`

---

#### `POST /transactions/bulk`

Import multiple transactions at once.

**Request:**
```json
{
  "transactions": [ ...array of transaction objects... ]
}
```

---

### Categories

#### `GET /categories`

Returns hierarchical tree of all categories (global + user's custom).

**Query:** `?type=expense` or `?type=income`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Food & Dining",
      "type": "expense",
      "icon": "utensils",
      "color": "#f97316",
      "isDefault": true,
      "children": [
        { "id": "uuid", "name": "Groceries", "icon": "shopping-basket", ... },
        { "id": "uuid", "name": "Restaurants", "icon": "fork-knife", ... }
      ]
    }
  ]
}
```

---

#### `POST /categories`

**Request:**
```json
{
  "name": "Pet Expenses",
  "type": "expense",
  "parentId": null,
  "icon": "paw-print",
  "color": "#f59e0b"
}
```

#### `PATCH /categories/:id`
#### `DELETE /categories/:id`

---

### Tags

#### `GET /tags`
#### `POST /tags`
**Request:** `{ "name": "tax-deductible", "color": "#22c55e" }`
#### `DELETE /tags/:id`

---

### Transfers

#### `POST /transfers`

**Request:**
```json
{
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amount": 500.00,
  "fee": 0,
  "date": "2024-09-15",
  "description": "Monthly savings transfer"
}
```

Creates two linked transactions automatically.

#### `GET /transfers`
#### `GET /transfers/:id`
#### `DELETE /transfers/:id`

---

### Budgets

#### `GET /budgets`
#### `POST /budgets`

**Request:**
```json
{
  "name": "Monthly Budget",
  "period": "monthly",
  "startDate": "2024-09-01",
  "amount": 3000.00,
  "currency": "USD",
  "rollover": false,
  "categories": [
    { "categoryId": "uuid", "allocated": 500.00 },
    { "categoryId": "uuid", "allocated": 300.00 }
  ]
}
```

#### `GET /budgets/:id`

Returns budget with current spending summary:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Monthly Budget",
    "amount": 3000.00,
    "spent": 1842.50,
    "remaining": 1157.50,
    "percentUsed": 61.4,
    "categories": [
      {
        "categoryId": "uuid",
        "categoryName": "Groceries",
        "allocated": 500.00,
        "spent": 312.80,
        "remaining": 187.20
      }
    ]
  }
}
```

#### `PATCH /budgets/:id`
#### `DELETE /budgets/:id`

---

### Goals

#### `GET /goals`
#### `POST /goals`

**Request:**
```json
{
  "name": "Emergency Fund",
  "targetAmount": 10000.00,
  "currency": "USD",
  "targetDate": "2025-06-01",
  "accountId": "uuid",
  "icon": "shield",
  "color": "#10b981"
}
```

#### `GET /goals/:id`
#### `PATCH /goals/:id`
#### `DELETE /goals/:id`

#### `POST /goals/:id/contribute`

**Request:** `{ "amount": 200.00, "date": "2024-09-15" }`

---

### Recurring Transactions & Bills

#### `GET /recurring-transactions`
Returns list of configured recurring bills, home rent, utility subscriptions, and income rules with calculated `dueDays`, `isOverdue`, `isUpcoming`, and `status`.

#### `POST /recurring-transactions`

**Request:**
```json
{
  "title": "Home Rent",
  "amount": 15000.00,
  "type": "expense",
  "accountId": "uuid-account-id",
  "categoryId": "uuid-category-id",
  "frequency": "monthly",
  "nextDate": "2026-09-01",
  "notes": "Landlord Rent Account: HDFC",
  "isActive": true
}
```

#### `GET /recurring-transactions/:id`
#### `PUT /recurring-transactions/:id`
#### `DELETE /recurring-transactions/:id`

#### `POST /recurring-transactions/:id/pay` — Log Bill Payment & Deduct Balance

**Request:**
```json
{
  "accountId": "uuid-payment-account",
  "date": "2026-08-11T08:30:00.000Z",
  "notes": "Paid Home Rent via GPay"
}
```

Creates a REAL system `Transaction`, updates account balance in real-time via PostgreSQL triggers, and advances `nextDate` to the next cycle (+1 month, +1 year, etc.).

---

### Debt Payoff & Amortization Planner

#### `GET /debts`
Returns active debt records along with **Debt Snowball** (lowest balance first) and **Debt Avalanche** (highest APR first) payoff simulations, total interest projections, and month-by-month amortization schedules.

#### `POST /debts`

**Request:**
```json
{
  "title": "HDFC Credit Card",
  "balance": 50000.00,
  "interestRate": 18.5,
  "minimumPayment": 2500.00,
  "extraPayment": 1000.00,
  "category": "Credit Card",
  "notes": "Card Ending in 9482"
}
```

#### `GET /debts/:id`
#### `PUT /debts/:id`
#### `DELETE /debts/:id`

---

### AI Financial Health & Insights

#### `GET /insights/health-score`
Computes dynamic **Financial Health Score (0-100)** and returns sub-metric breakdown (Emergency Fund Coverage, Debt-to-Income Ratio, Savings Rate, Budget Adherence) along with automated smart spending insights.

---

### Attachments

#### `POST /attachments`

Upload a file (receipt, statement). Content-Type: `multipart/form-data`

**Form fields:**
- `file` — The file (PDF, PNG, JPG, WEBP — max 50MB)
- `transactionId` — Optional UUID to link to a transaction

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "receipt_20240915.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 102400,
    "url": "/api/v1/attachments/uuid/download"
  }
}
```

#### `GET /attachments/:id/download`
#### `DELETE /attachments/:id`

---

### Import (Cashew)

#### `POST /import/cashew`

Upload a Cashew export file. Content-Type: `multipart/form-data`

**Form fields:**
- `file` — Cashew JSON or CSV export file

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "importId": "uuid",
    "status": "processing",
    "message": "Import job queued. Check status endpoint for progress."
  }
}
```

---

#### `GET /import/cashew/:importId`

Poll import job status.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "totalRecords": 1547,
    "importedRecords": 1532,
    "skippedRecords": 12,
    "failedRecords": 3,
    "errorLog": [
      { "row": 45, "error": "Unknown currency: XYZ" }
    ],
    "startedAt": "2024-09-15T10:00:00.000Z",
    "completedAt": "2024-09-15T10:00:23.000Z"
  }
}
```

---

#### `GET /import/cashew`

List all import jobs for the current user.

---

### Reports

#### `GET /reports/spending-by-category`

**Query:** `?startDate=2024-09-01&endDate=2024-09-30&accountId=uuid`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2024-09-01", "end": "2024-09-30" },
    "totalExpenses": 2450.00,
    "totalIncome": 5000.00,
    "netSavings": 2550.00,
    "savingsRate": 51.0,
    "categories": [
      {
        "categoryId": "uuid",
        "categoryName": "Food & Dining",
        "amount": 650.00,
        "percentage": 26.5,
        "transactionCount": 28
      }
    ]
  }
}
```

---

#### `GET /reports/monthly-trend`

**Query:** `?months=12`

**Response:**
```json
{
  "success": true,
  "data": [
    { "month": "2024-01", "income": 5000.00, "expenses": 3200.00, "savings": 1800.00 },
    { "month": "2024-02", "income": 5000.00, "expenses": 2900.00, "savings": 2100.00 }
  ]
}
```

---

#### `GET /reports/net-worth`

**Query:** `?startDate=2024-01-01`

Returns daily net worth snapshots.

---

### Notifications

#### `GET /notifications`

**Query:** `?unreadOnly=true&limit=20`

#### `PATCH /notifications/:id/read`
#### `POST /notifications/mark-all-read`
#### `DELETE /notifications/:id`

---

### Health

#### `GET /health`

Public endpoint — no authentication required.

**Response `200`:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-09-15T10:00:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  },
  "uptime": 86400
}
```
