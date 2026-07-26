const { readDB, writeDB } = require('../middleware/db');
const { v4: uuidv4 } = require('uuid');
const {
  ACCOUNT_TYPES, CURRENCIES, TX_TYPES, CATEGORIES, HEX_RE, paginate,
} = require('./shared');

function getAccounts(req, res) {
  const db = readDB();
  const userId = req.user.id;
  const userAccounts = db.accounts.filter(a => a.userId === userId);
  res.json(userAccounts);
}

function createAccount(req, res) {
  const { name, type, balance, currency, color, icon } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'name and type are required' });
  }
  if (!ACCOUNT_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${ACCOUNT_TYPES.join(', ')}` });
  }
  if (currency !== undefined && !CURRENCIES.includes(currency)) {
    return res.status(400).json({ error: `currency must be one of: ${CURRENCIES.join(', ')}` });
  }
  if (color !== undefined && !HEX_RE.test(color)) {
    return res.status(400).json({ error: 'color must be a hex code like #2ecc71' });
  }

  const db = readDB();
  const account = {
    id: uuidv4(),
    userId: req.user.id,           
    name,
    type,
    balance: Number(balance) || 0,
    currency: currency || 'AZN',
    color: color || '#2ecc71',
    icon: icon || '💳',
    createdAt: new Date().toISOString(),
  };

  db.accounts.push(account);
  writeDB(db);
  res.status(201).json(account);
}

function updateAccount(req, res) {
  const db = readDB();
  const index = db.accounts.findIndex(a => a.id === req.params.id && a.userId === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'Account not found' });

  const { type, currency, color } = req.body;
  if (type !== undefined && !ACCOUNT_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${ACCOUNT_TYPES.join(', ')}` });
  }
  if (currency !== undefined && !CURRENCIES.includes(currency)) {
    return res.status(400).json({ error: `currency must be one of: ${CURRENCIES.join(', ')}` });
  }
  if (color !== undefined && !HEX_RE.test(color)) {
    return res.status(400).json({ error: 'color must be a hex code like #2ecc71' });
  }

  const allowed = ['name', 'type', 'balance', 'currency', 'color', 'icon'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.balance !== undefined) updates.balance = Number(updates.balance);

  db.accounts[index] = { ...db.accounts[index], ...updates };
  writeDB(db);
  res.json(db.accounts[index]);
}

function deleteAccount(req, res) {
  const db = readDB();
  const index = db.accounts.findIndex(a => a.id === req.params.id && a.userId === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'Account not found' });

  db.accounts.splice(index, 1);
  db.transactions = db.transactions.filter(t => t.accountId !== req.params.id);
  writeDB(db);
  res.json({ message: 'Account deleted' });
}

function getAccountTransactions(req, res) {
  const db = readDB();
  const account = db.accounts.find(a => a.id === req.params.id && a.userId === req.user.id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const { from, to, type, category, sort } = req.query;
  const SORTS = ['newest', 'oldest', 'amount-asc', 'amount-desc'];
  if (sort && !SORTS.includes(sort)) {
    return res.status(400).json({ error: `sort must be one of: ${SORTS.join(', ')}` });
  }
  if (type && !TX_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${TX_TYPES.join(', ')}` });
  }
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
  }

  let txs = db.transactions.filter(t => t.accountId === req.params.id);
  if (from) txs = txs.filter(t => t.date >= from);
  if (to) txs = txs.filter(t => t.date <= to);
  if (type) txs = txs.filter(t => t.type === type);
  if (category) txs = txs.filter(t => t.category === category);

  switch (sort) {
    case 'oldest':
      txs.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      break;
    case 'amount-asc':
      txs.sort((a, b) => a.amount - b.amount);
      break;
    case 'amount-desc':
      txs.sort((a, b) => b.amount - a.amount);
      break;
    case 'newest':
    default:
      txs.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }

  res.json(paginate(txs, req.query));
}

module.exports = {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountTransactions,
};