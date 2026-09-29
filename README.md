# 💰 FinTrack - Full-Stack Personal Finance Tracker

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MUI](https://img.shields.io/badge/MUI-5-blue?logo=mui)
![License](https://img.shields.io/badge/license-MIT-blue)

A comprehensive full-stack web application designed to help users track their personal finances, manage budgets, set savings goals, and visualize spending trends.

## ✨ Features

- **🔐 Authentication:** Secure JWT-based registration and login system.
- **💳 Accounts Management:** Support for multiple account types (Cash, Card, Savings) with different currencies (AZN, USD, EUR).
- **📊 Transactions:** Full CRUD for income, expense, and transfer transactions. Includes automatic balance synchronization, tags, filtering, and pagination.
- **🎯 Budgets:** Create monthly or weekly budgets per category. The system automatically calculates spent amounts and remaining balances.
- **🏆 Savings Goals:** Set financial goals, track progress, and make deposits. Goals auto-complete when the target amount is reached.
- **📈 Analytics:** Interactive charts (using Recharts) for daily spending, income vs. expense, and category breakdowns.
- **🌙 UI/UX:** Responsive design (Mobile-first with Material-UI), Dark/Light theme toggle, and smooth transitions.
- **🌍 Localization:** Multi-language support (English, Russian, Azerbaijani) using `i18next`.

## 🛠 Tech Stack

**Frontend:**
- React 18 (Vite)
- Material-UI (MUI)
- Recharts (Data Visualization)
- React Router v6
- i18next (Localization)
- Context API + `useReducer` (State Management)

**Backend:**
- Node.js & Express.js
- JSON Web Tokens (JWT) for Auth
- JSON File Database (`db.json`) — *Zero-config, no external DB required for testing.*
- `uuid` for unique ID generation

## 📂 Project Structure

```text
finance-tracker/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Business logic (accounts, transactions, etc.)
│   │   ├── middleware/        # DB read/write, auth middleware
│   │   ├── routes/            # API endpoints
│   │   └── index.js           # Express server entry point
│   ├── db.json                # Persistent JSON database (seeded)
│   ├── seed.js                # Script to generate fresh dummy data
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/               # API fetch wrappers
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth and Theme contexts
│   │   ├── hooks/             # Custom hooks (e.g., useDebounce)
│   │   ├── layout/            # Main layout with sidebar
│   │   ├── pages/             # Route pages (Dashboard, Transactions, etc.)
│   │   ├── store/             # AppDataContext (Global state)
│   │   └── i18n.js            # Localization setup
│   └── package.json
└── README.md
