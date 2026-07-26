const { readDB, writeDB } = require('../middleware/db');
const { v4: uuidv4 } = require('uuid');
const { CURRENCIES, CATEGORIES, PERIODS, DATE_RE, round2, convertCurrency } = require('./shared');

function withComputed(budget, transactions) {
  let spent = 0;
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    if (t.category !== budget.category) continue;

    let amountInBudgetCurrency;
    if (t.currency === budget.currency) {
      amountInBudgetCurrency = t.amount;
    } else {
      try {
        amountInBudgetCurrency = convertCurrency(t.amount, t.currency, budget.currency);
      } catch {
        continue; 
      }
    }

    if (t.date >= budget.startDate && t.date <= budget.endDate) {
      spent += amountInBudgetCurrency;
    }
  }

  return {
    ...budget,
    spent: round2(spent),
    remaining: round2(budget.amount - spent),
  };
}

function getBudgets(req, res) {
  const db = readDB();
  const userId = req.user.id;

  const userAccountIds = db.accounts.filter(a => a.userId === userId).map(a => a.id);

  const userTransactions = db.transactions.filter(t => userAccountIds.includes(t.accountId));

  const userBudgets = db.budgets.filter(b => b.userId === userId);

  const result = userBudgets.map((b) => withComputed(b, userTransactions));

  res.json(result);

}

function validateBudget(body, partial = false) {
  const { category, amount, currency, period, startDate, endDate } = body;

  if (!partial && (!category || amount === undefined || !startDate || !endDate)) {
    return 'category, amount, startDate, and endDate are required';
  }
  if (category !== undefined && !CATEGORIES.includes(category)) {
    return `category must be one of: ${CATEGORIES.join(', ')}`;
  }
  if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
    return 'amount must be a positive number';
  }
  if (currency !== undefined && !CURRENCIES.includes(currency)) {
    return `currency must be one of: ${CURRENCIES.join(', ')}`;
  }
  if (period !== undefined && !PERIODS.includes(period)) {
    return `period must be one of: ${PERIODS.join(', ')}`;
  }
  if (startDate !== undefined && !DATE_RE.test(startDate)) {
    return 'startDate must be in YYYY-MM-DD format';
  }
  if (endDate !== undefined && !DATE_RE.test(endDate)) {
    return 'endDate must be in YYYY-MM-DD format';
  }
  return null;
}

function createBudget(req, res) {
  const error = validateBudget(req.body);
  if (error) return res.status(400).json({ error });

  const { category, amount, currency, period, startDate, endDate } = req.body;
  const db = readDB();
  const userId = req.user.id;

  const budget = {
    id: uuidv4(),
    userId: userId,
    category,
    amount: Number(amount),
    currency: currency || 'AZN',
    period: period || 'monthly',
    startDate,
    endDate,
  };

  db.budgets.push(budget);
  writeDB(db);

  const userAccountIds = db.accounts.filter(a => a.userId === userId).map(a => a.id);
  const userTransactions = db.transactions.filter(t => userAccountIds.includes(t.accountId));
  const result = withComputed(budget, userTransactions);

  res.status(201).json(result);
}

function updateBudget(req, res) {
  const db = readDB();
  const userId = req.user.id;
  const index = db.budgets.findIndex(b => b.id === req.params.id && b.userId === userId);
  if (index === -1) return res.status(404).json({ error: 'Budget not found' });

  const error = validateBudget(req.body, true);
  if (error) return res.status(400).json({ error });

  const allowed = ['category', 'amount', 'currency', 'period', 'startDate', 'endDate'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.amount !== undefined) updates.amount = Number(updates.amount);

  db.budgets[index] = { ...db.budgets[index], ...updates };
  writeDB(db);

  const userAccountIds = db.accounts.filter(a => a.userId === userId).map(a => a.id);
  const userTransactions = db.transactions.filter(t => userAccountIds.includes(t.accountId));
  const result = withComputed(db.budgets[index], userTransactions);

  res.json(result);
}

function deleteBudget(req, res) {
  const db = readDB();
  const userId = req.user.id;
  const index = db.budgets.findIndex(b => b.id === req.params.id && b.userId === userId);
  if (index === -1) return res.status(404).json({ error: 'Budget not found' });

  db.budgets.splice(index, 1);
  writeDB(db);
  res.json({ message: 'Budget deleted' });
}

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };