const { readDB, writeDB } = require('../middleware/db');
const { v4: uuidv4 } = require('uuid');
const { CURRENCIES, GOAL_STATUSES, DATE_RE, HEX_RE, round2 } = require('./shared');

function getGoals(req, res) {
  const db = readDB();
  const userId = req.user.id;
  const userGoals = db.goals.filter(g => g.userId === userId);
  res.json(userGoals);
}

function createGoal(req, res) {
  const { title, targetAmount, currentAmount, currency, deadline, icon, color } = req.body;
  const userId = req.user.id;

  if (!title || targetAmount === undefined) {
    return res.status(400).json({ error: 'title and targetAmount are required' });
  }
  if (isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
    return res.status(400).json({ error: 'targetAmount must be a positive number' });
  }
  if (currency !== undefined && !CURRENCIES.includes(currency)) {
    return res.status(400).json({ error: `currency must be one of: ${CURRENCIES.join(', ')}` });
  }
  if (deadline !== undefined && !DATE_RE.test(deadline)) {
    return res.status(400).json({ error: 'deadline must be in YYYY-MM-DD format' });
  }
  if (color !== undefined && !HEX_RE.test(color)) {
    return res.status(400).json({ error: 'color must be a hex code like #3498db' });
  }

  const db = readDB();
  const goal = {
    id: uuidv4(),
    userId: userId,
    title,
    targetAmount: Number(targetAmount),
    currentAmount: Number(currentAmount) || 0,
    currency: currency || 'AZN',
    deadline: deadline || null,
    icon: icon || '🎯',
    color: color || '#3498db',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.goals.push(goal);
  writeDB(db);
  res.status(201).json(goal);
}

function updateGoal(req, res) {
  const db = readDB();
  const userId = req.user.id;
  const index = db.goals.findIndex(g => g.id === req.params.id && g.userId === userId);
  if (index === -1) return res.status(404).json({ error: 'Goal not found' });

  const { currency, deadline, color, status } = req.body;
  if (currency !== undefined && !CURRENCIES.includes(currency)) {
    return res.status(400).json({ error: `currency must be one of: ${CURRENCIES.join(', ')}` });
  }
  if (deadline !== undefined && deadline !== null && !DATE_RE.test(deadline)) {
    return res.status(400).json({ error: 'deadline must be in YYYY-MM-DD format' });
  }
  if (color !== undefined && !HEX_RE.test(color)) {
    return res.status(400).json({ error: 'color must be a hex code like #3498db' });
  }
  if (status !== undefined && !GOAL_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${GOAL_STATUSES.join(', ')}` });
  }

  const allowed = ['title', 'targetAmount', 'currentAmount', 'currency', 'deadline', 'icon', 'color', 'status'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.targetAmount !== undefined) updates.targetAmount = Number(updates.targetAmount);
  if (updates.currentAmount !== undefined) updates.currentAmount = Number(updates.currentAmount);

  db.goals[index] = { ...db.goals[index], ...updates };
  writeDB(db);
  res.json(db.goals[index]);
}

function deleteGoal(req, res) {
  const db = readDB();
  const userId = req.user.id;
  const index = db.goals.findIndex(g => g.id === req.params.id && g.userId === userId);
  if (index === -1) return res.status(404).json({ error: 'Goal not found' });

  db.goals.splice(index, 1);
  writeDB(db);
  res.json({ message: 'Goal deleted' });
}

function depositToGoal(req, res) {
  const { amount } = req.body;
  if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  const db = readDB();
  const userId = req.user.id;
  const goal = db.goals.find(g => g.id === req.params.id && g.userId === userId);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  if (goal.status !== 'active') {
    return res.status(400).json({ error: `Cannot deposit to a ${goal.status} goal` });
  }

  goal.currentAmount = round2(goal.currentAmount + Number(amount));
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = 'completed';
  }

  writeDB(db);
  res.json(goal);
}

module.exports = { getGoals, createGoal, updateGoal, deleteGoal, depositToGoal };