const { readDB } = require('../middleware/db');
const { round2 } = require('./shared');

function monthKey(dateStr) {
  return dateStr.slice(0, 7); 
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getUserAccountIds(db, userId) {
  return db.accounts.filter(a => a.userId === userId).map(a => a.id);
}

function getOverview(req, res) {
  const db = readDB();
  const userId = req.user.id;
  const userAccountIds = getUserAccountIds(db, userId);
  const thisMonth = monthKey(todayStr());

  const totalBalance = round2(
    db.accounts
      .filter(a => a.userId === userId)
      .reduce((sum, a) => sum + a.balance, 0)
  );

  let incomeThisMonth = 0;
  let expenseThisMonth = 0;
  const expenseByCategory = {};

  for (const t of db.transactions) {
    if (!userAccountIds.includes(t.accountId)) continue;
    if (monthKey(t.date) !== thisMonth) continue;
    if (t.type === 'income') incomeThisMonth += t.amount;
    if (t.type === 'expense') {
      expenseThisMonth += t.amount;
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    }
  }

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  const incomeVsExpense = months.map((month) => {
    let income = 0;
    let expense = 0;
    for (const t of db.transactions) {
      if (!userAccountIds.includes(t.accountId)) continue;
      if (monthKey(t.date) !== month) continue;
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    }
    return { month, income: round2(income), expense: round2(expense) };
  });

  res.json({
    totalBalance,
    incomeThisMonth: round2(incomeThisMonth),
    expenseThisMonth: round2(expenseThisMonth),
    savingsThisMonth: round2(incomeThisMonth - expenseThisMonth),
    expenseByCategory: Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount: round2(amount) })),
    incomeVsExpense,
  });
}

function getTrends(req, res) {
  const db = readDB();
  const userId = req.user.id;
  const userAccountIds = getUserAccountIds(db, userId);

  const days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const daysSet = new Set(days);

  const byDay = {};
  const byCategory = {};
  let biggestExpense = null;

  for (const t of db.transactions) {
    if (!userAccountIds.includes(t.accountId)) continue;
    if (t.type !== 'expense') continue;
    if (daysSet.has(t.date)) {
      byDay[t.date] = (byDay[t.date] || 0) + t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      if (!biggestExpense || t.amount > biggestExpense.amount) {
        biggestExpense = t;
      }
    }
  }

  const dailySpending = days.map((date) => ({
    date,
    amount: round2(byDay[date] || 0),
  }));

  const totalSpent = dailySpending.reduce((s, d) => s + d.amount, 0);

  res.json({
    dailySpending,
    topCategories: Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount: round2(amount) })),
    avgDailySpend: round2(totalSpent / 30),
    biggestExpense,
  });
}

module.exports = { getOverview, getTrends };