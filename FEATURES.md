# 💎 Hoorain — Complete Feature Guide & Architecture

**Hoorain** is a self-hosted, privacy-first personal finance platform designed for full data ownership, high performance, and elegant accounting management.

---

## 🌟 Core Feature Matrix

### 1. 🛡️ Privacy Mode & Numeric Masking
- **Global Privacy Switch**: Toggle button next to the dashboard performance greeting ("Here is your financial performance for [Month]").
- **Pill-shaped Toggle Control**: Interactive switch button with animated sliding thumb and Eye / EyeOff indicator.
- **Universal Masking**: Automatically masks all account balances, net worth values, income/expense cards, transaction amounts, chart Y-axes, and report breakdown totals (`₹••••••` / `$••••••`).

### 2. 🎨 Smooth Custom Select Dropdowns
- **Animated Dropdown Component (`SmoothSelect`)**: Modern, accessible dropdown replacing native select elements across:
  - Add & Edit Category Modals (Parent Category Selection)
  - Add & Edit Transaction Modals (Account & Category Selection)
  - Add & Edit Budget Modals (Period Selection)
  - Multi-Dimensional Financial Analytics & Reports Filter Panel

### 3. 📊 Multi-Dimensional Financial Analytics & 5 Expandable Reports
- **Report 1: Expenses Breakdown by Account**:
  - Visual progress bar distribution across all checking, savings, credit card, and investment accounts.
  - **Expandable Transactions**: Click "Expand Transactions" on any account row to reveal every underlying transaction record.
- **Report 2: Expenses Breakdown by Category**:
  - Detailed breakdown of expenditure per category.
  - **Expandable Transactions**: View itemized category transactions on demand.
- **Report 3: Transaction Type & Cash Flow Analysis**:
  - Income vs Expense vs Transfer volume ratios and Net Velocity calculations.
  - **Expandable Transactions**: Expand Outflow, Inflow, or Transfer buckets to view exact records.
- **Report 4: Monthly Spending Velocity & Trends**:
  - Month-over-month trend comparison.
  - **Expandable Transactions**: Expand any month card to view all transactions recorded in that month.
- **Report 5: Top Payees & Transaction Size Distribution**:
  - Expenditure distribution across transaction size brackets (`< ₹500`, `₹500 - ₹2,000`, `₹2,000 - ₹10,000`, `> ₹10,000`) and Top 10 Vendor rankings.
  - **Expandable Transactions**: Expand size brackets or top vendor cards to view itemized transactions.

### 4. 📈 Interactive Cash Flow Trend Chart
- **Period Switcher**: Toggle seamlessly between *This Month (Daily)* and *12-Month Trend*.
- **Header Summary Callouts**: Displays computed total Income and total Expense side-by-side (`💚 Income: [Val]` `🔴 Expense: [Val]`) right next to chart indicators, updating dynamically with period selection.

### 5. 💰 Account Management & Direct Navigation
- **Account Cards**: Interactive cards displaying account balance, card type icon, and custom border highlights.
- **Direct Transaction Reports Filtering**: Clicking any account card or its "Transactions" action button opens Reports & Transactions pre-filtered specifically for that account.

### 6. 📅 Budgeting & Goals
- **Budget Tracking**: Period-based allocation with progress indicators and remaining budget calculations.
- **Savings Goals**: Goal target tracking with progress bars and target completion dates.

### 7. 📤 Data Import & Integration
- **Database & Mobile App Import**: Direct import tool for importing account, category, and transaction data exported from personal finance mobile apps or database backups (JSON/CSV/SQL).

### 8. 🐳 Docker & Self-Hosted Infrastructure
- **5 Container Services**:
  - `HoorainOS-frontend`: Next.js 15 App Router frontend.
  - `HoorainOS-backend`: NestJS 10 REST API backend.
  - `HoorainOS-postgres`: PostgreSQL 17 database engine.
  - `HoorainOS-redis`: Redis 7 session & cache engine.
  - `HoorainOS-nginx`: Nginx reverse proxy router.
- **Decoupled Dynamic Port Bindings**: Configure public host-facing ports (`APP_PORT`, `FRONTEND_PORT`, `BACKEND_PORT`, etc.) in `.env` independently of internal container ports to avoid conflicts on host servers.

### 9. 🎛️ Drag-and-Drop Customizable Dashboards
- **Interactive Layout Grid**: Drag, drop, and resize cards/widgets manually using `react-grid-layout` across the three dashboard layouts (Overview, Analytics, Planning).
- **Persistent Layouts**: Custom layouts are persisted dynamically via the backend settings API so your tailored layout is loaded automatically.
- **Page-Specific Customizer Widget**: Click "+ Add Widget" to show or hide individual dashboard cards dynamically per page.
- **Smart Minimize / Maximize Height Auto-Adjust**: Clicking the minimize chevron physically shrinks the grid card's container row height (to 1 or 3 rows) to save space, and maximizing it expands it automatically back to its previous or default readable height (e.g., 7 rows for Pie Charts) without manual dragging.

