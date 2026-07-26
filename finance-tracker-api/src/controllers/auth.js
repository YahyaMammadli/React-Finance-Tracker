const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../middleware/db');
const { v4: uuidv4 } = require('uuid');

function hashPassword(password) {
  return crypto.createHash('sha512').update(password).digest('hex');
}

function verifyPassword(plain, hashed) {
  return hashPassword(plain) === hashed;
}

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token required' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function registerUser(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const db = readDB();
  if (!db.users) db.users = [];
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  const hashed = hashPassword(password);
  const userId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
  const user = {
    id: userId,
    username,
    password: hashed,
    role: 'user',
    createdAt: new Date().toISOString()
  };
  db.users.push(user);

  if (!db.accounts) db.accounts = [];
  const defaultAccount = {
    id: uuidv4(),
    userId: userId,
    name: 'Cash',
    type: 'cash',
    balance: 100000000,
    currency: 'AZN',
    color: '#27ae60',
    icon: '💵',
    createdAt: new Date().toISOString()
  };
  db.accounts.push(defaultAccount);

  writeDB(db);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );
  res.status(201).json({
    token,
    expiresIn: '24h',
    user: { id: user.id, username: user.username }
  });
}

function loginUser(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const db = readDB();
  if (!db.users) db.users = [];
  const user = db.users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  if (!verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );
  res.json({
    token,
    expiresIn: '24h',
    user: { id: user.id, username: user.username }
  });
}

module.exports = { hashPassword, verifyPassword, authMiddleware, registerUser, loginUser };