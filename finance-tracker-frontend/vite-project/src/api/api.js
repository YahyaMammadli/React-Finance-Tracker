const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message || 'Unauthorized');
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new UnauthorizedError(data.error || 'Unauthorized');
    }
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const apiRegister = async (username, password) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
};

export const apiLogin = async (username, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
};

export const getAccounts = async (token) => {
  const res = await fetch(`${API_BASE}/accounts`, {
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const createAccount = async (data, token) => {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateAccount = async (id, data, token) => {
  const res = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteAccount = async (id, token) => {
  const res = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const getAccountTransactions = async (accountId, params, token) => {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/accounts/${accountId}/transactions${query ? '?' + query : ''}`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return handleResponse(res);
};

export const getTransactions = async (params, token) => {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/transactions${query ? '?' + query : ''}`;
  const res = await fetch(url, { headers: getHeaders(token) });
  return handleResponse(res);
};

export const createTransaction = async (data, token) => {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateTransaction = async (id, data, token) => {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteTransaction = async (id, token) => {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const getBudgets = async (token) => {
  const res = await fetch(`${API_BASE}/budgets`, {
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const createBudget = async (data, token) => {
  const res = await fetch(`${API_BASE}/budgets`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateBudget = async (id, data, token) => {
  const res = await fetch(`${API_BASE}/budgets/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteBudget = async (id, token) => {
  const res = await fetch(`${API_BASE}/budgets/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const getGoals = async (token) => {
  const res = await fetch(`${API_BASE}/goals`, {
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const createGoal = async (data, token) => {
  const res = await fetch(`${API_BASE}/goals`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateGoal = async (id, data, token) => {
  const res = await fetch(`${API_BASE}/goals/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteGoal = async (id, token) => {
  const res = await fetch(`${API_BASE}/goals/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const depositToGoal = async (id, amount, token) => {
  const res = await fetch(`${API_BASE}/goals/${id}/deposit`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ amount }),
  });
  return handleResponse(res);
};

export const getStatsOverview = async (token) => {
  const res = await fetch(`${API_BASE}/stats/overview`, {
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const getStatsTrends = async (token) => {
  const res = await fetch(`${API_BASE}/stats/trends`, {
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

export const CATEGORIES = [
  'food', 'transport', 'housing', 'health', 'entertainment',
  'education', 'shopping', 'salary', 'freelance', 'gift', 'other',
];

export const ACCOUNT_TYPES = ['cash', 'card', 'savings'];
export const CURRENCIES = ['AZN', 'USD', 'EUR'];
export const TX_TYPES = ['income', 'expense', 'transfer'];
export const PERIODS = ['monthly', 'weekly'];
export const GOAL_STATUSES = ['active', 'completed', 'cancelled'];

export const CATEGORY_COLORS = {
  food: '#4CAF50',
  transport: '#FF9800',
  housing: '#2196F3',
  health: '#F44336',
  entertainment: '#9C27B0',
  education: '#3F51B5',
  shopping: '#FF5722',
  salary: '#009688',
  freelance: '#795548',
  gift: '#E91E63',
  other: '#607D8B',
};

export const CATEGORY_ICONS = {
  food: '🍔',
  transport: '🚗',
  housing: '🏠',
  health: '💊',
  entertainment: '🎬',
  education: '📚',
  shopping: '🛍️',
  salary: '💰',
  freelance: '💼',
  gift: '🎁',
  other: '📌',
};