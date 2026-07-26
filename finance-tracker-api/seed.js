const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function hashPassword(password) {
  return crypto.createHash('sha512').update(password).digest('hex');
}

const hashedPassword = hashPassword('admin123');
console.log('Hashed password (admin123):', hashedPassword);




const fs = require('fs');
const path = require('path');

function dateStr(daysAgo) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function iso(daysAgo) {
  return dateStr(daysAgo) + 'T12:00:00.000Z';
}

function monthStartEnd(monthsAgo) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo + 1, 0));
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

const accounts = [
  { id: 'a-001', name: 'Cash', type: 'cash', startBalance: 250, currency: 'AZN', color: '#27ae60', icon: '💵' },
  { id: 'a-002', name: 'Kapital Bank Card', type: 'card', startBalance: 1800, currency: 'AZN', color: '#2980b9', icon: '💳' },
  { id: 'a-003', name: 'Savings', type: 'savings', startBalance: 4500, currency: 'AZN', color: '#8e44ad', icon: '🏦' },
];

let rngState = 42;
function rng() {
  rngState = (rngState * 1103515245 + 12345) % 2147483648;
  return rngState / 2147483648;
}
function pick(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

const expensePool = [
  ['food', 'Groceries at Bravo', [25, 90], 'a-002', ['groceries']],
  ['food', 'Lunch at work', [8, 18], 'a-001', ['lunch']],
  ['food', 'Coffee', [4, 9], 'a-001', ['coffee']],
  ['food', 'Dinner with friends', [30, 70], 'a-002', ['restaurant']],
  ['transport', 'Bolt ride', [4, 15], 'a-002', ['taxi']],
  ['transport', 'BakuCard top-up', [5, 10], 'a-001', ['metro']],
  ['transport', 'Fuel', [40, 60], 'a-002', ['car', 'fuel']],
  ['housing', 'Utilities payment', [60, 120], 'a-002', ['utilities']],
  ['housing', 'Internet (CityNet)', [25, 25], 'a-002', ['internet']],
  ['health', 'Pharmacy', [10, 45], 'a-002', ['pharmacy']],
  ['health', 'Gym membership', [50, 50], 'a-002', ['gym']],
  ['entertainment', 'Cinema (CinemaPlus)', [10, 24], 'a-002', ['cinema']],
  ['entertainment', 'Netflix subscription', [16, 16], 'a-002', ['subscription']],
  ['entertainment', 'Concert tickets', [40, 80], 'a-002', ['music']],
  ['education', 'Udemy course', [20, 35], 'a-002', ['online-course']],
  ['education', 'Books', [15, 40], 'a-001', ['books']],
  ['shopping', 'Clothes', [40, 150], 'a-002', ['clothes']],
  ['shopping', 'Electronics accessory', [20, 90], 'a-002', ['gadgets']],
  ['other', 'Gift for a friend', [25, 60], 'a-002', ['gift']],
  ['other', 'Haircut', [15, 25], 'a-001', []],
];

const transactions = [];
let txId = 1;

function addTx(tx) {
  transactions.push({
    id: `t-${String(txId++).padStart(3, '0')}`,
    currency: 'AZN',
    tags: [],
    isRecurring: false,
    description: '',
    time: `${String(9 + Math.floor(rng() * 12)).padStart(2, '0')}:${String(Math.floor(rng() * 60)).padStart(2, '0')}`,
    ...tx,
    createdAt: tx.date + 'T12:00:00.000Z',
  });
}

for (let m = 2; m >= 0; m--) {
  const [start] = monthStartEnd(m);
  const base = start.slice(0, 8);
  const today = dateStr(0);

  const salaryDate = base + '05';
  if (salaryDate <= today) {
    addTx({ accountId: 'a-002', type: 'income', amount: 2200, category: 'salary', description: 'Monthly salary', date: salaryDate, tags: ['work'], isRecurring: true });
  }
  const freelanceDate = base + '18';
  if (freelanceDate <= today) {
    addTx({ accountId: 'a-002', type: 'income', amount: 350 + Math.floor(rng() * 300), category: 'freelance', description: 'Freelance project payment', date: freelanceDate, tags: ['side-hustle'] });
  }
  const rentDate = base + '03';
  if (rentDate <= today) {
    addTx({ accountId: 'a-002', type: 'expense', amount: 600, category: 'housing', description: 'Apartment rent', date: rentDate, tags: ['rent'], isRecurring: true });
  }
  const transferDate = base + '06';
  if (transferDate <= today) {
    addTx({ accountId: 'a-002', toAccountId: 'a-003', type: 'transfer', amount: 400, category: 'other', description: 'Monthly savings transfer', date: transferDate, tags: ['savings'], isRecurring: true });
  }
}

addTx({ accountId: 'a-001', type: 'income', amount: 150, category: 'gift', description: 'Birthday gift from family', date: dateStr(40), tags: ['birthday'] });

for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
  const count = rng() < 0.3 ? 0 : rng() < 0.7 ? 1 : 2;
  for (let i = 0; i < count; i++) {
    const [category, description, [min, max], accountId, tags] = pick(expensePool);
    addTx({
      accountId,
      type: 'expense',
      amount: Math.round((min + rng() * (max - min)) * 100) / 100,
      category,
      description,
      date: dateStr(daysAgo),
      tags,
    });
  }
}

transactions.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

const balances = Object.fromEntries(accounts.map((a) => [a.id, a.startBalance]));
for (const t of transactions) {
  if (t.type === 'income') balances[t.accountId] += t.amount;
  else balances[t.accountId] -= t.amount;
  if (t.type === 'transfer' && t.toAccountId) balances[t.toAccountId] += t.amount;
}

const finalAccounts = accounts.map(({ startBalance, ...a }) => ({
  ...a,
  balance: Math.round(balances[a.id] * 100) / 100,
  createdAt: iso(200),
}));

const [curStart, curEnd] = monthStartEnd(0);
const budgets = [
  { id: 'b-001', category: 'food', amount: 500, currency: 'AZN', period: 'monthly', startDate: curStart, endDate: curEnd },
  { id: 'b-002', category: 'transport', amount: 150, currency: 'AZN', period: 'monthly', startDate: curStart, endDate: curEnd },
  { id: 'b-003', category: 'entertainment', amount: 120, currency: 'AZN', period: 'monthly', startDate: curStart, endDate: curEnd },
  { id: 'b-004', category: 'shopping', amount: 200, currency: 'AZN', period: 'monthly', startDate: curStart, endDate: curEnd },
  { id: 'b-005', category: 'health', amount: 100, currency: 'AZN', period: 'monthly', startDate: curStart, endDate: curEnd },
];

const goals = [
  { id: 'g-001', title: 'New MacBook Pro', targetAmount: 4000, currentAmount: 1750, currency: 'AZN', deadline: dateStr(-180), icon: '💻', color: '#34495e', status: 'active', createdAt: iso(120) },
  { id: 'g-002', title: 'Summer vacation in Turkey', targetAmount: 2500, currentAmount: 900, currency: 'AZN', deadline: dateStr(-60), icon: '🏖️', color: '#e67e22', status: 'active', createdAt: iso(80) },
  { id: 'g-003', title: 'Emergency fund', targetAmount: 6000, currentAmount: 4500, currency: 'AZN', deadline: dateStr(-365), icon: '🛡️', color: '#c0392b', status: 'active', createdAt: iso(300) },
];

const db = { accounts: finalAccounts, transactions, budgets, goals };

fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
console.log(
  `Seeded ${finalAccounts.length} accounts, ${transactions.length} transactions, ` +
  `${budgets.length} budgets, ${goals.length} goals.`
);
console.log('Balances:', finalAccounts.map((a) => `${a.name}: ${a.balance} ${a.currency}`).join(' | '));



const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('ADMIN_PASSWORD_HASH')) {
    envContent += `\nADMIN_PASSWORD_HASH=${hashedPassword}`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ ADMIN_PASSWORD_HASH added to .env');
  }
}