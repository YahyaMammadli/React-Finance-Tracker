const ACCOUNT_TYPES = ['cash', 'card', 'savings'];
const CURRENCIES = ['AZN', 'USD', 'EUR'];
const TX_TYPES = ['income', 'expense', 'transfer'];
const CATEGORIES = [
  'food', 'transport', 'housing', 'health', 'entertainment',
  'education', 'shopping', 'salary', 'freelance', 'gift', 'other',
];
const PERIODS = ['monthly', 'weekly'];
const GOAL_STATUSES = ['active', 'completed', 'cancelled'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const EXCHANGE_RATES = {
  AZN: 1,
  USD: 1.7,
  EUR: 1.8,
};


function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;

  const rateFrom = EXCHANGE_RATES[fromCurrency];
  const rateTo = EXCHANGE_RATES[toCurrency];

  if (!rateFrom || !rateTo) {
    throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
  }

  const amountInAZN = amount * rateFrom;
  const result = amountInAZN / rateTo;

  return result;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}


function balanceEffect(tx) {
  return tx.type === 'income' ? tx.amount : -tx.amount;
}


 
function applyTransaction(db, tx, sign) {
  const account = db.accounts.find((a) => a.id === tx.accountId);
  if (account) {
    account.balance = round2(account.balance + sign * balanceEffect(tx));
  }
  if (tx.type === 'transfer' && tx.toAccountId) {
    const target = db.accounts.find((a) => a.id === tx.toAccountId);
    if (target) {
      target.balance = round2(target.balance + sign * tx.amount);
    }
  }
}

function paginate(items, query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 20));
  return {
    data: items.slice((page - 1) * limit, page * limit),
    total: items.length,
    page,
    limit,
    totalPages: Math.ceil(items.length / limit),
  };
}

module.exports = {
  ACCOUNT_TYPES,
  CURRENCIES,
  TX_TYPES,
  CATEGORIES,
  PERIODS,
  GOAL_STATUSES,
  DATE_RE,
  TIME_RE,
  HEX_RE,
  EXCHANGE_RATES,
  convertCurrency,
  round2,
  balanceEffect,
  applyTransaction,
  paginate,
};