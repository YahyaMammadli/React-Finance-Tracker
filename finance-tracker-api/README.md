# Finance Tracker API

A RESTful API for a personal finance tracking application built with Node.js, Express.js, and a JSON file database.

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment file and edit if needed
cp .env.example .env

# (Optional) regenerate seed data with fresh dates
npm run seed

# Run in development mode (with auto-reload)
npm run dev

# Run in production mode
npm start
```

The server starts at `http://localhost:5000` by default.

> **Tip:** seeded transactions cover the ~90 days before you run `npm run seed`, and account balances are computed from the transactions — the data is always internally consistent.

---

## Environment Variables

| Variable | Default | Description       |
|----------|---------|-------------------|
| `PORT`   | `5000`  | Port to listen on |

---

## Key behavior: automatic balance sync

The API keeps account balances in sync with transactions:

| Action                  | Effect on balance                                              |
|-------------------------|----------------------------------------------------------------|
| Create `income`         | `+amount` on the account                                       |
| Create `expense`        | `-amount` on the account                                       |
| Create `transfer`       | `-amount` on the account; `+amount` on `toAccountId` (if given)|
| Update any transaction  | Old effect reverted, new effect applied                        |
| Delete any transaction  | Effect fully reverted                                          |

---

## Entities

### Account
| Field      | Type   | Description                       |
|------------|--------|-----------------------------------|
| `id`       | string | Unique identifier (UUID)          |
| `name`     | string | Account name                      |
| `type`     | string | `cash` / `card` / `savings`       |
| `balance`  | number | Current balance (auto-maintained) |
| `currency` | string | `AZN` / `USD` / `EUR`             |
| `color`    | string | Hex color, e.g. `#2ecc71`         |
| `icon`     | string | Emoji                             |
| `createdAt`| string | ISO 8601 timestamp                |

### Transaction
| Field         | Type     | Description                                                       |
|---------------|----------|-------------------------------------------------------------------|
| `id`          | string   | Unique identifier (UUID)                                          |
| `accountId`   | string   | Source account                                                    |
| `toAccountId` | string   | *(transfers only, optional)* receiving account                    |
| `type`        | string   | `income` / `expense` / `transfer`                                 |
| `amount`      | number   | Positive number                                                   |
| `currency`    | string   | `AZN` / `USD` / `EUR` (defaults to the account's currency)        |
| `category`    | string   | `food` / `transport` / `housing` / `health` / `entertainment` / `education` / `shopping` / `salary` / `freelance` / `gift` / `other` |
| `description` | string   | Freeform text                                                     |
| `date`        | string   | `YYYY-MM-DD`                                                      |
| `time`        | string   | `HH:MM` (default `12:00`)                                         |
| `tags`        | string[] | Freeform tags                                                     |
| `isRecurring` | boolean  | Marks recurring transactions                                      |
| `createdAt`   | string   | ISO 8601 timestamp                                                |

### Budget
| Field       | Type   | Description                                        |
|-------------|--------|----------------------------------------------------|
| `id`        | string | Unique identifier (UUID)                           |
| `category`  | string | Spending category the budget limits                |
| `amount`    | number | Spending limit                                     |
| `currency`  | string | `AZN` / `USD` / `EUR`                              |
| `period`    | string | `monthly` / `weekly`                               |
| `startDate` | string | `YYYY-MM-DD`                                       |
| `endDate`   | string | `YYYY-MM-DD`                                       |
| `spent`     | number | **Computed** — expenses in category within period  |
| `remaining` | number | **Computed** — `amount - spent`                    |

### Goal
| Field           | Type   | Description                            |
|-----------------|--------|----------------------------------------|
| `id`            | string | Unique identifier (UUID)               |
| `title`         | string | Goal name                              |
| `targetAmount`  | number | Amount to reach                        |
| `currentAmount` | number | Saved so far                           |
| `currency`      | string | `AZN` / `USD` / `EUR`                  |
| `deadline`      | string | `YYYY-MM-DD` or `null`                 |
| `icon`          | string | Emoji                                  |
| `color`         | string | Hex color                              |
| `status`        | string | `active` / `completed` / `cancelled` (auto-completes on reaching target) |
| `createdAt`     | string | ISO 8601 timestamp                     |

---

## API Endpoints

### Accounts

---

#### `GET /api/accounts` — Get all accounts

**Example Response** `200 OK`
```json
[
  {
    "id": "a-001",
    "name": "Cash",
    "type": "cash",
    "balance": 15.3,
    "currency": "AZN",
    "color": "#27ae60",
    "icon": "💵",
    "createdAt": "2025-11-23T12:00:00.000Z"
  }
]
```

---

#### `POST /api/accounts` — Create an account

**Request Body**

| Field      | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| `name`     | string | Yes      | Account name                         |
| `type`     | string | Yes      | `cash` / `card` / `savings`          |
| `balance`  | number | No       | Starting balance (default `0`)       |
| `currency` | string | No       | Default `AZN`                        |
| `color`    | string | No       | Hex code (default `#2ecc71`)         |
| `icon`     | string | No       | Emoji (default `💳`)                 |

**Example Request Body**
```json
{ "name": "USD Card", "type": "card", "balance": 500, "currency": "USD", "icon": "💲" }
```

**Example Response** `201 Created` — the full created account object.

---

#### `PUT /api/accounts/:id` — Update an account

All creation fields are optional. Note: setting `balance` directly here is allowed (e.g. for corrections) but normally balances are maintained automatically by transactions.

**Example Request Body**
```json
{ "name": "Main Card", "color": "#3498db" }
```

**Example Response** `200 OK` — the full updated account.

---

#### `DELETE /api/accounts/:id` — Delete an account

Also deletes all transactions belonging to the account.

**Example Response** `200 OK`
```json
{ "message": "Account deleted" }
```

---

#### `GET /api/accounts/:id/transactions` — Get transactions for an account

**Query Parameters**

| Param      | Type   | Description                                                |
|------------|--------|------------------------------------------------------------|
| `from`     | string | Start date inclusive (`YYYY-MM-DD`)                        |
| `to`       | string | End date inclusive (`YYYY-MM-DD`)                          |
| `type`     | string | `income` / `expense` / `transfer`                          |
| `category` | string | Any valid category                                         |
| `sort`     | string | `newest` (default) / `oldest` / `amount-asc` / `amount-desc` |
| `page`     | number | Page number, default `1`                                   |
| `limit`    | number | Items per page, default `20`, max `100`                    |

**Example Request**
```
GET /api/accounts/a-002/transactions?category=food&sort=amount-desc&page=1&limit=10
```

**Example Response** `200 OK`
```json
{
  "data": [
    {
      "id": "t-042",
      "accountId": "a-002",
      "type": "expense",
      "amount": 64.5,
      "currency": "AZN",
      "category": "food",
      "description": "Dinner with friends",
      "date": "2026-06-02",
      "time": "19:34",
      "tags": ["restaurant"],
      "isRecurring": false,
      "createdAt": "2026-06-02T12:00:00.000Z"
    }
  ],
  "total": 11,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

---

### Transactions

---

#### `GET /api/transactions` — Get all transactions

Sorted newest first. Same paginated response shape as above.

**Query Parameters**

| Param       | Type   | Description                                  |
|-------------|--------|----------------------------------------------|
| `accountId` | string | Filter by account                            |
| `type`      | string | `income` / `expense` / `transfer`            |
| `category`  | string | Any valid category                           |
| `from`      | string | Start date inclusive                         |
| `to`        | string | End date inclusive                           |
| `search`    | string | Case-insensitive search in description and tags |
| `page`      | number | Default `1`                                  |
| `limit`     | number | Default `20`, max `100`                      |

**Example Request**
```
GET /api/transactions?type=expense&search=coffee&from=2026-05-01
```

---

#### `POST /api/transactions` — Create a transaction

**Automatically updates the account balance** (see the balance sync table above).

**Request Body**

| Field         | Type     | Required | Description                                            |
|---------------|----------|----------|--------------------------------------------------------|
| `accountId`   | string   | Yes      | Source account ID                                      |
| `type`        | string   | Yes      | `income` / `expense` / `transfer`                      |
| `amount`      | number   | Yes      | Positive number                                        |
| `category`    | string   | Yes      | Any valid category                                     |
| `date`        | string   | Yes      | `YYYY-MM-DD`                                           |
| `toAccountId` | string   | No       | For transfers: the receiving account                   |
| `currency`    | string   | No       | Defaults to the account's currency                     |
| `description` | string   | No       | Default `""`                                           |
| `time`        | string   | No       | `HH:MM`, default `12:00`                               |
| `tags`        | string[] | No       | Default `[]`                                           |
| `isRecurring` | boolean  | No       | Default `false`                                        |

**Example Request Body**
```json
{
  "accountId": "a-002",
  "type": "expense",
  "amount": 45.5,
  "category": "food",
  "description": "Weekly groceries",
  "date": "2026-06-11",
  "time": "18:20",
  "tags": ["groceries"]
}
```

**Example Response** `201 Created` — the full created transaction object.

**Error Responses**
- `400 Bad Request` — `{ "error": "amount must be a positive number" }`
- `404 Not Found` — `{ "error": "Account not found" }`

---

#### `PUT /api/transactions/:id` — Update a transaction

All creation fields are optional. The old balance effect is **reverted** and the new one **applied** — balances stay correct even when the amount, type, or account changes.

**Example Request Body**
```json
{ "amount": 50, "description": "Weekly groceries + snacks" }
```

**Example Response** `200 OK` — the full updated transaction.

---

#### `DELETE /api/transactions/:id` — Delete a transaction

Reverts the transaction's effect on the account balance.

**Example Response** `200 OK`
```json
{ "message": "Transaction deleted, account balance reverted" }
```

---

### Budgets

---

#### `GET /api/budgets` — Get all budgets with computed spent/remaining

`spent` sums expense transactions in the budget's category and currency within `[startDate, endDate]`. `remaining = amount - spent` (can go negative when overspent).

**Example Response** `200 OK`
```json
[
  {
    "id": "b-001",
    "category": "food",
    "amount": 500,
    "currency": "AZN",
    "period": "monthly",
    "startDate": "2026-06-01",
    "endDate": "2026-06-30",
    "spent": 41.02,
    "remaining": 458.98
  }
]
```

---

#### `POST /api/budgets` — Create a budget

**Request Body**

| Field       | Type   | Required | Description                       |
|-------------|--------|----------|-----------------------------------|
| `category`  | string | Yes      | Any valid category                |
| `amount`    | number | Yes      | Positive spending limit           |
| `startDate` | string | Yes      | `YYYY-MM-DD`                      |
| `endDate`   | string | Yes      | `YYYY-MM-DD`                      |
| `currency`  | string | No       | Default `AZN`                     |
| `period`    | string | No       | `monthly` (default) / `weekly`    |

**Example Request Body**
```json
{
  "category": "education",
  "amount": 150,
  "period": "monthly",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30"
}
```

**Example Response** `201 Created` — the budget including computed `spent` / `remaining`.

---

#### `PUT /api/budgets/:id` — Update a budget

All creation fields are optional.

**Example Request Body**
```json
{ "amount": 600 }
```

**Example Response** `200 OK` — the updated budget with recomputed `spent` / `remaining`.

---

#### `DELETE /api/budgets/:id` — Delete a budget

**Example Response** `200 OK`
```json
{ "message": "Budget deleted" }
```

---

### Goals

---

#### `GET /api/goals` — Get all goals

**Example Response** `200 OK`
```json
[
  {
    "id": "g-001",
    "title": "New MacBook Pro",
    "targetAmount": 4000,
    "currentAmount": 1750,
    "currency": "AZN",
    "deadline": "2026-12-08",
    "icon": "💻",
    "color": "#34495e",
    "status": "active",
    "createdAt": "2026-02-11T12:00:00.000Z"
  }
]
```

---

#### `POST /api/goals` — Create a goal

**Request Body**

| Field           | Type   | Required | Description                       |
|-----------------|--------|----------|-----------------------------------|
| `title`         | string | Yes      | Goal name                         |
| `targetAmount`  | number | Yes      | Positive target                   |
| `currentAmount` | number | No       | Default `0`                       |
| `currency`      | string | No       | Default `AZN`                     |
| `deadline`      | string | No       | `YYYY-MM-DD` (default `null`)     |
| `icon`          | string | No       | Emoji (default `🎯`)              |
| `color`         | string | No       | Hex (default `#3498db`)           |

New goals always start with `status: "active"`.

**Example Request Body**
```json
{ "title": "New phone", "targetAmount": 1200, "deadline": "2026-12-31", "icon": "📱" }
```

**Example Response** `201 Created` — the full created goal.

---

#### `PUT /api/goals/:id` — Update a goal

All fields optional, including `status` (e.g. to cancel a goal).

**Example Request Body**
```json
{ "status": "cancelled" }
```

**Example Response** `200 OK` — the full updated goal.

---

#### `DELETE /api/goals/:id` — Delete a goal

**Example Response** `200 OK`
```json
{ "message": "Goal deleted" }
```

---

#### `PATCH /api/goals/:id/deposit` — Deposit into a goal

Adds `amount` to `currentAmount`. When `currentAmount` reaches `targetAmount`, the goal's status automatically becomes `completed`. Deposits to non-active goals are rejected.

**Request Body**

| Field    | Type   | Required | Description       |
|----------|--------|----------|-------------------|
| `amount` | number | Yes      | Positive number   |

**Example Request Body**
```json
{ "amount": 200 }
```

**Example Response** `200 OK`
```json
{
  "id": "g-001",
  "title": "New MacBook Pro",
  "targetAmount": 4000,
  "currentAmount": 1950,
  "status": "active",
  "...": "..."
}
```

**Error Response** `400 Bad Request`
```json
{ "error": "Cannot deposit to a completed goal" }
```

---

### Stats

---

#### `GET /api/stats/overview` — Financial overview

| Field               | Type   | Description                                            |
|---------------------|--------|--------------------------------------------------------|
| `totalBalance`      | number | Sum of all account balances                            |
| `incomeThisMonth`   | number | Income in the current calendar month                   |
| `expenseThisMonth`  | number | Expenses in the current calendar month                 |
| `savingsThisMonth`  | number | `income - expense`                                     |
| `expenseByCategory` | array  | This month's expenses as `{ category, amount }`, descending |
| `incomeVsExpense`   | array  | Last 6 months as `{ month: "YYYY-MM", income, expense }`, oldest first |

**Example Response** `200 OK`
```json
{
  "totalBalance": 9751.97,
  "incomeThisMonth": 2200,
  "expenseThisMonth": 883.31,
  "savingsThisMonth": 1316.69,
  "expenseByCategory": [
    { "category": "housing", "amount": 625 },
    { "category": "shopping", "amount": 130.54 }
  ],
  "incomeVsExpense": [
    { "month": "2026-01", "income": 0, "expense": 0 },
    { "month": "2026-04", "income": 2705, "expense": 1240.7 },
    { "month": "2026-06", "income": 2200, "expense": 883.31 }
  ]
}
```

---

#### `GET /api/stats/trends` — Spending trends

| Field            | Type   | Description                                                  |
|------------------|--------|--------------------------------------------------------------|
| `dailySpending`  | array  | Last 30 days as `{ date, amount }`, oldest first (zero-filled) |
| `topCategories`  | array  | Top 5 categories by spend in the last 30 days                |
| `avgDailySpend`  | number | Average spend per day over the last 30 days                  |
| `biggestExpense` | object | The single largest expense transaction in the last 30 days   |

**Example Response** `200 OK`
```json
{
  "dailySpending": [
    { "date": "2026-05-13", "amount": 23.4 },
    { "date": "2026-06-11", "amount": 0 }
  ],
  "topCategories": [
    { "category": "housing", "amount": 625 },
    { "category": "food", "amount": 187.6 }
  ],
  "avgDailySpend": 58.75,
  "biggestExpense": {
    "id": "t-090",
    "type": "expense",
    "amount": 600,
    "category": "housing",
    "description": "Apartment rent",
    "date": "2026-06-03",
    "...": "..."
  }
}
```

---

## Project Structure

```
finance-tracker-api/
├── src/
│   ├── index.js                  # Entry point
│   ├── routes/
│   │   ├── accounts.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── goals.js
│   │   └── stats.js
│   ├── controllers/
│   │   ├── shared.js             # Constants, balance sync, pagination helpers
│   │   ├── accounts.js
│   │   ├── transactions.js       # CRUD + automatic balance updates
│   │   ├── budgets.js            # Computed spent/remaining
│   │   ├── goals.js              # Deposits + auto-completion
│   │   └── stats.js              # Overview + trends
│   └── middleware/
│       └── db.js                 # JSON file read/write helpers
├── db.json                       # Persistent JSON database (seeded)
├── seed.js                       # Regenerates db.json with fresh dates
├── .env.example                  # PORT=5000
├── .gitignore
├── package.json
└── README.md
```
