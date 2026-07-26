import React, { createContext, useContext, useReducer, useCallback } from 'react';
import * as api from '../api/api';
import { useAuth } from '../context/AuthContext';

const initialState = {
  accounts: { data: [], loading: false, error: null },
  transactions: { data: [], loading: false, error: null },
  budgets: { data: [], loading: false, error: null },
  goals: { data: [], loading: false, error: null },
  statsOverview: { data: null, loading: false, error: null },
  statsTrends: { data: null, loading: false, error: null },
  transactionsPagination: { total: 0, page: 0, limit: 10, totalPages: 0 },
};

function appDataReducer(state, action) {
  switch (action.type) {

    case 'FETCH_ACCOUNTS_LOADING':
      return { ...state, accounts: { ...state.accounts, loading: true, error: null } };
    case 'FETCH_ACCOUNTS_SUCCESS':
      return { ...state, accounts: { data: action.payload, loading: false, error: null } };
    case 'FETCH_ACCOUNTS_ERROR':
      return { ...state, accounts: { ...state.accounts, loading: false, error: action.payload } };
    case 'ADD_ACCOUNT_SUCCESS':
      return { ...state, accounts: { ...state.accounts, data: [...state.accounts.data, action.payload] } };
    case 'UPDATE_ACCOUNT_SUCCESS':
      return {
        ...state,
        accounts: {
          ...state.accounts,
          data: state.accounts.data.map(acc => acc.id === action.payload.id ? action.payload : acc)
        }
      };
    case 'DELETE_ACCOUNT_SUCCESS':
      return {
        ...state,
        accounts: {
          ...state.accounts,
          data: state.accounts.data.filter(acc => acc.id !== action.payload)
        }
      };

    case 'FETCH_TRANSACTIONS_LOADING':
      return { ...state, transactions: { ...state.transactions, loading: true, error: null } };
    case 'FETCH_TRANSACTIONS_SUCCESS':
      return {
        ...state,
        transactions: { data: action.payload.data, loading: false, error: null },
        transactionsPagination: {
          total: action.payload.total || 0,
          page: action.payload.page || 0,
          limit: action.payload.limit || 10,
          totalPages: action.payload.totalPages || 0,
        }
      };
    case 'FETCH_TRANSACTIONS_ERROR':
      return { ...state, transactions: { ...state.transactions, loading: false, error: action.payload } };
    case 'ADD_TRANSACTION_SUCCESS':
      return {
        ...state,
        transactions: { ...state.transactions, data: [action.payload, ...state.transactions.data] }
      };
    case 'UPDATE_TRANSACTION_SUCCESS':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          data: state.transactions.data.map(tx => tx.id === action.payload.id ? action.payload : tx)
        }
      };
    case 'DELETE_TRANSACTION_SUCCESS':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          data: state.transactions.data.filter(tx => tx.id !== action.payload)
        }
      };

    // Budgets
    case 'FETCH_BUDGETS_LOADING':
      return { ...state, budgets: { ...state.budgets, loading: true, error: null } };
    case 'FETCH_BUDGETS_SUCCESS':
      return { ...state, budgets: { data: action.payload, loading: false, error: null } };
    case 'FETCH_BUDGETS_ERROR':
      return { ...state, budgets: { ...state.budgets, loading: false, error: action.payload } };
    case 'ADD_BUDGET_SUCCESS':
      return { ...state, budgets: { ...state.budgets, data: [...state.budgets.data, action.payload] } };
    case 'UPDATE_BUDGET_SUCCESS':
      return {
        ...state,
        budgets: {
          ...state.budgets,
          data: state.budgets.data.map(b => b.id === action.payload.id ? action.payload : b)
        }
      };
    case 'DELETE_BUDGET_SUCCESS':
      return {
        ...state,
        budgets: {
          ...state.budgets,
          data: state.budgets.data.filter(b => b.id !== action.payload)
        }
      };

    // Goals
    case 'FETCH_GOALS_LOADING':
      return { ...state, goals: { ...state.goals, loading: true, error: null } };
    case 'FETCH_GOALS_SUCCESS':
      return { ...state, goals: { data: action.payload, loading: false, error: null } };
    case 'FETCH_GOALS_ERROR':
      return { ...state, goals: { ...state.goals, loading: false, error: action.payload } };
    case 'ADD_GOAL_SUCCESS':
      return { ...state, goals: { ...state.goals, data: [...state.goals.data, action.payload] } };
    case 'UPDATE_GOAL_SUCCESS':
      return {
        ...state,
        goals: {
          ...state.goals,
          data: state.goals.data.map(g => g.id === action.payload.id ? action.payload : g)
        }
      };
    case 'DELETE_GOAL_SUCCESS':
      return {
        ...state,
        goals: {
          ...state.goals,
          data: state.goals.data.filter(g => g.id !== action.payload)
        }
      };
    case 'DEPOSIT_GOAL_SUCCESS':
      return {
        ...state,
        goals: {
          ...state.goals,
          data: state.goals.data.map(g => g.id === action.payload.id ? action.payload : g)
        }
      };

    case 'FETCH_STATS_OVERVIEW_LOADING':
      return { ...state, statsOverview: { ...state.statsOverview, loading: true, error: null } };
    case 'FETCH_STATS_OVERVIEW_SUCCESS':
      return { ...state, statsOverview: { data: action.payload, loading: false, error: null } };
    case 'FETCH_STATS_OVERVIEW_ERROR':
      return { ...state, statsOverview: { ...state.statsOverview, loading: false, error: action.payload } };

    case 'FETCH_STATS_TRENDS_LOADING':
      return { ...state, statsTrends: { ...state.statsTrends, loading: true, error: null } };
    case 'FETCH_STATS_TRENDS_SUCCESS':
      return { ...state, statsTrends: { data: action.payload, loading: false, error: null } };
    case 'FETCH_STATS_TRENDS_ERROR':
      return { ...state, statsTrends: { ...state.statsTrends, loading: false, error: action.payload } };

    default:
      return state;
  }
}

const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appDataReducer, initialState);
  const { logout } = useAuth();

  const handleError = (err, errorAction) => {
    if (err.status === 401 || err.name === 'UnauthorizedError') {
      logout();
    }
    dispatch({ type: errorAction, payload: err.message || 'An error occurred' });
  };

  const fetchAccounts = useCallback(async (token) => {
    dispatch({ type: 'FETCH_ACCOUNTS_LOADING' });
    try {
      const data = await api.getAccounts(token);
      dispatch({ type: 'FETCH_ACCOUNTS_SUCCESS', payload: data });
    } catch (err) {
      handleError(err, 'FETCH_ACCOUNTS_ERROR');
    }
  }, []);

  const fetchTransactions = useCallback(async (params, token) => {
    dispatch({ type: 'FETCH_TRANSACTIONS_LOADING' });
    try {
      const data = await api.getTransactions(params, token);
      dispatch({ type: 'FETCH_TRANSACTIONS_SUCCESS', payload: data });
    } catch (err) {
      handleError(err, 'FETCH_TRANSACTIONS_ERROR');
    }
  }, []);

  const createTransaction = useCallback(async (data, token) => {
    try {
      const newTx = await api.createTransaction(data, token);
      dispatch({ type: 'ADD_TRANSACTION_SUCCESS', payload: newTx });
      return newTx;
    } catch (err) {
      handleError(err, 'FETCH_TRANSACTIONS_ERROR');
      throw err;
    }
  }, []);

  const updateTransaction = useCallback(async (id, data, token) => {
    try {
      const updated = await api.updateTransaction(id, data, token);
      dispatch({ type: 'UPDATE_TRANSACTION_SUCCESS', payload: updated });
      return updated;
    } catch (err) {
      handleError(err, 'FETCH_TRANSACTIONS_ERROR');
      throw err;
    }
  }, []);

  const deleteTransaction = useCallback(async (id, token) => {
    try {
      await api.deleteTransaction(id, token);
      dispatch({ type: 'DELETE_TRANSACTION_SUCCESS', payload: id });
    } catch (err) {
      handleError(err, 'FETCH_TRANSACTIONS_ERROR');
      throw err;
    }
  }, []);

  const fetchBudgets = useCallback(async (token) => {
    dispatch({ type: 'FETCH_BUDGETS_LOADING' });
    try {
      const data = await api.getBudgets(token);
      dispatch({ type: 'FETCH_BUDGETS_SUCCESS', payload: data });
    } catch (err) {
      handleError(err, 'FETCH_BUDGETS_ERROR');
    }
  }, []);

  const createBudget = useCallback(async (data, token) => {
    try {
      const newBudget = await api.createBudget(data, token);
      dispatch({ type: 'ADD_BUDGET_SUCCESS', payload: newBudget });
      return newBudget;
    } catch (err) {
      handleError(err, 'FETCH_BUDGETS_ERROR');
      throw err;
    }
  }, []);

  const updateBudget = useCallback(async (id, data, token) => {
    try {
      const updated = await api.updateBudget(id, data, token);
      dispatch({ type: 'UPDATE_BUDGET_SUCCESS', payload: updated });
      return updated;
    } catch (err) {
      handleError(err, 'FETCH_BUDGETS_ERROR');
      throw err;
    }
  }, []);

  const deleteBudget = useCallback(async (id, token) => {
    try {
      await api.deleteBudget(id, token);
      dispatch({ type: 'DELETE_BUDGET_SUCCESS', payload: id });
    } catch (err) {
      handleError(err, 'FETCH_BUDGETS_ERROR');
      throw err;
    }
  }, []);

  const fetchGoals = useCallback(async (token) => {
    dispatch({ type: 'FETCH_GOALS_LOADING' });
    try {
      const data = await api.getGoals(token);
      dispatch({ type: 'FETCH_GOALS_SUCCESS', payload: data });
    } catch (err) {
      handleError(err, 'FETCH_GOALS_ERROR');
    }
  }, []);

  const createGoal = useCallback(async (data, token) => {
    try {
      const newGoal = await api.createGoal(data, token);
      dispatch({ type: 'ADD_GOAL_SUCCESS', payload: newGoal });
      return newGoal;
    } catch (err) {
      handleError(err, 'FETCH_GOALS_ERROR');
      throw err;
    }
  }, []);

  const updateGoal = useCallback(async (id, data, token) => {
    try {
      const updated = await api.updateGoal(id, data, token);
      dispatch({ type: 'UPDATE_GOAL_SUCCESS', payload: updated });
      return updated;
    } catch (err) {
      handleError(err, 'FETCH_GOALS_ERROR');
      throw err;
    }
  }, []);

  const deleteGoal = useCallback(async (id, token) => {
    try {
      await api.deleteGoal(id, token);
      dispatch({ type: 'DELETE_GOAL_SUCCESS', payload: id });
    } catch (err) {
      handleError(err, 'FETCH_GOALS_ERROR');
      throw err;
    }
  }, []);

  const depositToGoal = useCallback(async (id, amount, token) => {
    try {
      const updated = await api.depositToGoal(id, amount, token);
      dispatch({ type: 'DEPOSIT_GOAL_SUCCESS', payload: updated });
      return updated;
    } catch (err) {
      handleError(err, 'FETCH_GOALS_ERROR');
      throw err;
    }
  }, []);

  const fetchStatsOverview = useCallback(async (token) => {
    dispatch({ type: 'FETCH_STATS_OVERVIEW_LOADING' });
    try {
      const data = await api.getStatsOverview(token);
      dispatch({ type: 'FETCH_STATS_OVERVIEW_SUCCESS', payload: data });
    } catch (err) {
      handleError(err, 'FETCH_STATS_OVERVIEW_ERROR');
    }
  }, []);

  const fetchStatsTrends = useCallback(async (token) => {
    dispatch({ type: 'FETCH_STATS_TRENDS_LOADING' });
    try {
      const data = await api.getStatsTrends(token);
      dispatch({ type: 'FETCH_STATS_TRENDS_SUCCESS', payload: data });
    } catch (err) {
      handleError(err, 'FETCH_STATS_TRENDS_ERROR');
    }
  }, []);

  const value = {
    state,
    fetchAccounts,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    depositToGoal,
    fetchStatsOverview,
    fetchStatsTrends,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
};