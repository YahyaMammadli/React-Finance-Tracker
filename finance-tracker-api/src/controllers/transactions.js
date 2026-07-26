const { readDB, writeDB } = require('../middleware/db');
const { v4: uuidv4 } = require('uuid');
const {
  CURRENCIES, TX_TYPES, CATEGORIES, DATE_RE, TIME_RE,
  applyTransaction, paginate, convertCurrency, round2,
} = require('./shared');

function isUserAccount(db, accountId, userId) {
  return db.accounts.some(a => a.id === accountId && a.userId === userId);
}



function getTransactions(req, res) {
  const { accountId, type, category, from, to, search } = req.query;
  const userId = req.user.id;

  if (type && !TX_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${TX_TYPES.join(', ')}` });
  }
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
  }

  const db = readDB();
  let txs = db.transactions;

  const userAccountIds = db.accounts.filter(a => a.userId === userId).map(a => a.id);
  txs = txs.filter(t => userAccountIds.includes(t.accountId));

  if (accountId) {
    if (!userAccountIds.includes(accountId)) {
      return res.status(404).json({ error: 'Account not found or not yours' });
    }
    txs = txs.filter(t => t.accountId === accountId);
  }
  if (type) txs = txs.filter(t => t.type === type);
  if (category) txs = txs.filter(t => t.category === category);
  if (from) txs = txs.filter(t => t.date >= from);
  if (to) txs = txs.filter(t => t.date <= to);
  if (search) {
    const q = search.toLowerCase();
    txs = txs.filter(
      t =>
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }

  txs = [...txs].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  res.json(paginate(txs, req.query));
}



function validateTransaction(body, partial = false) {
  const { accountId, type, amount, currency, category, date, time } = body;
  if (!partial && (!accountId || !type || amount === undefined || !category || !date)) {
    return 'accountId, type, amount, category, and date are required';
  }
  if (type !== undefined && !TX_TYPES.includes(type)) {
    return `type must be one of: ${TX_TYPES.join(', ')}`;
  }
  if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
    return 'amount must be a positive number';
  }
  if (currency !== undefined && !CURRENCIES.includes(currency)) {
    return `currency must be one of: ${CURRENCIES.join(', ')}`;
  }
  if (category !== undefined && !CATEGORIES.includes(category)) {
    return `category must be one of: ${CATEGORIES.join(', ')}`;
  }
  if (date !== undefined && !DATE_RE.test(date)) {
    return 'date must be in YYYY-MM-DD format';
  }
  if (time !== undefined && !TIME_RE.test(time)) {
    return 'time must be in HH:MM format';
  }
  return null;
}



function createTransaction(req, res) {
  const error = validateTransaction(req.body);
  if (error) return res.status(400).json({ error });

  const {
    accountId, toAccountId, type, amount, currency, category,
    description, date, time, tags, isRecurring,
  } = req.body;

  const db = readDB();
  const userId = req.user.id;

  const account = db.accounts.find(a => a.id === accountId && a.userId === userId);
  if (!account) {
    return res.status(404).json({ error: 'Account not found or does not belong to you' });
  }

  if (type === 'transfer' && toAccountId) {
    const target = db.accounts.find(a => a.id === toAccountId && a.userId === userId);
    if (!target) {
      return res.status(404).json({ error: 'Target account not found or does not belong to you' });
    }
    if (toAccountId === accountId) {
      return res.status(400).json({ error: 'toAccountId must differ from accountId' });
    }
  }


  const txCurrency = currency || account.currency;

  let amountInAccountCurrency;
  let originalAmount = amount;
  let originalCurrency = txCurrency;

  if (txCurrency === account.currency) {
    amountInAccountCurrency = Number(amount);
  } else {

    amountInAccountCurrency = convertCurrency(Number(amount), txCurrency, account.currency);

    amountInAccountCurrency = round2(amountInAccountCurrency);
  }


  const tx = {
    id: uuidv4(),
    accountId,
    type,
    amount: amountInAccountCurrency,          
    currency: account.currency,               
    originalAmount: Number(amount),           
    originalCurrency: txCurrency,             
    category,
    description: description || '',
    date,
    time: time || '12:00',
    tags: Array.isArray(tags) ? tags : [],
    isRecurring: Boolean(isRecurring),
    createdAt: new Date().toISOString(),
  };
  if (type === 'transfer' && toAccountId) tx.toAccountId = toAccountId;

  db.transactions.push(tx);
  applyTransaction(db, tx, +1);
  writeDB(db);
  res.status(201).json(tx);
}

function updateTransaction(req, res) {
  const db = readDB();
  const userId = req.user.id;

  const index = db.transactions.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Transaction not found' });

  const oldTx = db.transactions[index];

  if (!isUserAccount(db, oldTx.accountId, userId)) {
    return res.status(403).json({ error: 'You do not own this transaction' });
  }

  const error = validateTransaction(req.body, true);
  if (error) return res.status(400).json({ error });

  if (req.body.accountId !== undefined) {
    if (!isUserAccount(db, req.body.accountId, userId)) {
      return res.status(404).json({ error: 'New account not found or not yours' });
    }
  }

  if (req.body.toAccountId !== undefined && req.body.type === 'transfer') {
    if (!isUserAccount(db, req.body.toAccountId, userId)) {
      return res.status(404).json({ error: 'Target account not found or not yours' });
    }
  }

  applyTransaction(db, oldTx, -1);

  const allowed = [
    'accountId', 'toAccountId', 'type', 'category',
    'description', 'date', 'time', 'tags', 'isRecurring',
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  let newAmount = oldTx.amount;
  let newCurrency = oldTx.currency;
  let newOriginalAmount = oldTx.originalAmount;
  let newOriginalCurrency = oldTx.originalCurrency;

  if (req.body.currency !== undefined || req.body.amount !== undefined) {
    const account = db.accounts.find(a => a.id === (updates.accountId || oldTx.accountId));
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    const txCurrency = req.body.currency || oldTx.originalCurrency;
    const amountVal = req.body.amount !== undefined ? Number(req.body.amount) : oldTx.originalAmount;

    if (txCurrency === account.currency) {
      newAmount = amountVal;
      newOriginalAmount = amountVal;
      newOriginalCurrency = account.currency;
    } else {
      newAmount = round2(convertCurrency(amountVal, txCurrency, account.currency));
      newOriginalAmount = amountVal;
      newOriginalCurrency = txCurrency;
    }
    newCurrency = account.currency;
  }

  updates.amount = newAmount;
  updates.currency = newCurrency;
  updates.originalAmount = newOriginalAmount;
  updates.originalCurrency = newOriginalCurrency;

  const updatedTx = { ...oldTx, ...updates };
  if (updatedTx.type !== 'transfer') {
    delete updatedTx.toAccountId;
  }

  db.transactions[index] = updatedTx;
  applyTransaction(db, updatedTx, +1);
  writeDB(db);
  res.json(updatedTx);
}

function deleteTransaction(req, res) {
  const db = readDB();
  const userId = req.user.id;

  const index = db.transactions.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Transaction not found' });

  const tx = db.transactions[index];

  if (!isUserAccount(db, tx.accountId, userId)) {
    return res.status(403).json({ error: 'You do not own this transaction' });
  }

  const [removed] = db.transactions.splice(index, 1);
  applyTransaction(db, removed, -1);
  writeDB(db);
  res.json({ message: 'Transaction deleted, account balance reverted' });
}

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};