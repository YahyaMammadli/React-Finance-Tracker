import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../store/AppDataContext';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../api/api';
import { useTranslation } from 'react-i18next';

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#3F51B5', '#FF5722', '#009688', '#795548', '#E91E63', '#607D8B'];

function Dashboard() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const {
    state,
    fetchAccounts,
    fetchStatsOverview,
    fetchStatsTrends,
    fetchTransactions,
  } = useAppData();

  const accounts = state.accounts.data;
  const accountsLoading = state.accounts.loading;
  const statsOverview = state.statsOverview.data;
  const statsOverviewLoading = state.statsOverview.loading;
  const statsTrends = state.statsTrends.data;
  const statsTrendsLoading = state.statsTrends.loading;
  const transactions = state.transactions.data;
  const transactionsLoading = state.transactions.loading;

  useEffect(() => {
    if (token) {
      fetchAccounts(token);
      fetchStatsOverview(token);
      fetchStatsTrends(token);
      fetchTransactions({ page: 1, limit: 5 }, token);
    }
  }, [token, fetchAccounts, fetchStatsOverview, fetchStatsTrends, fetchTransactions]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const expenseByCategory = statsOverview?.expenseByCategory || [];
  const pieData = expenseByCategory.slice(0, 6).map((item) => ({
    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    value: item.amount,
    category: item.category,
  }));
  const incomeVsExpense = statsOverview?.incomeVsExpense || [];
  const recentTxs = transactions.slice(0, 5);

  const isLoading = accountsLoading || statsOverviewLoading || statsTrendsLoading || transactionsLoading;

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            {isLoading ? (
              <Skeleton width={80} height={36} />
            ) : (
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                {typeof value === 'number' ? `₼${value.toFixed(2)}` : value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const formatRecentAmount = (tx) => {
    if (tx.originalAmount !== undefined && tx.originalCurrency) {
      return (
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            color={tx.type === 'income' ? 'success.main' : tx.type === 'expense' ? 'error.main' : 'text.secondary'}
          >
            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
            {tx.originalAmount.toFixed(2)} {tx.originalCurrency}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
            ≈ ₼{tx.amount.toFixed(2)}
          </Typography>
        </Box>
      );
    } else {
      return (
        <Typography
          variant="subtitle1"
          fontWeight={600}
          color={tx.type === 'income' ? 'success.main' : tx.type === 'expense' ? 'error.main' : 'text.secondary'}
        >
          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
          ₼{tx.amount.toFixed(2)}
        </Typography>
      );
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        {t('dashboard.title')}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.totalBalance')}
            value={totalBalance}
            icon={<AccountBalanceIcon sx={{ color: 'white' }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.incomeThisMonth')}
            value={statsOverview?.incomeThisMonth || 0}
            icon={<ArrowUpwardIcon sx={{ color: 'white' }} />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.expenseThisMonth')}
            value={statsOverview?.expenseThisMonth || 0}
            icon={<ArrowDownwardIcon sx={{ color: 'white' }} />}
            color="#F44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={t('dashboard.savings')}
            value={statsOverview?.savingsThisMonth || 0}
            icon={<SavingsIcon sx={{ color: 'white' }} />}
            color="#FF9800"
            subtitle={`${statsOverview?.savingsThisMonth >= 0 ? '👍' : '👎'} ${statsOverview?.savingsThisMonth >= 0 ? t('dashboard.saving') : t('dashboard.spendingMore')}`}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        {t('dashboard.accounts')}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={100} /></Grid>
          ))
        ) : accounts.length === 0 ? (
          <Grid item xs={12}><Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">{t('dashboard.noAccounts')}</Typography></Paper></Grid>
        ) : (
          accounts.map((acc) => (
            <Grid item xs={12} sm={6} md={4} key={acc.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: acc.color || '#1976d2' }}>
                      <Typography fontSize={24}>{acc.icon || '💰'}</Typography>
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>{acc.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{acc.type.charAt(0).toUpperCase() + acc.type.slice(1)} · {acc.currency}</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>{acc.currency === 'AZN' ? '₼' : acc.currency === 'USD' ? '$' : '€'}{acc.balance.toFixed(2)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              {t('dashboard.incomeVsExpense')}
            </Typography>
            <Box sx={{ height: 280 }}>
              {isLoading ? (
                <Skeleton variant="rounded" height={260} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeVsExpense}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => `₼${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="income" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#F44336" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              {t('dashboard.expensesByCategory')}
            </Typography>
            <Box sx={{ height: 280 }}>
              {isLoading ? (
                <Skeleton variant="rounded" height={260} />
              ) : pieData.length === 0 ? (
                <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary" variant="body2">{t('dashboard.noExpenses')}</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => `₼${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        {t('dashboard.recentTransactions')}
      </Typography>
      <Paper sx={{ overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={40} sx={{ my: 1 }} />)}
          </Box>
        ) : recentTxs.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">{t('dashboard.noTransactions')}</Typography></Box>
        ) : (
          <List disablePadding>
            {recentTxs.map((tx, index) => (
              <React.Fragment key={tx.id}>
                <ListItem sx={{ py: 1.5, px: 2.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: CATEGORY_COLORS[tx.category] || '#607D8B' }}>
                      <Typography fontSize={18}>{CATEGORY_ICONS[tx.category] || '📌'}</Typography>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={500}>{tx.description || tx.category}</Typography>
                        <Chip label={tx.type} size="small" color={tx.type === 'income' ? 'success' : tx.type === 'expense' ? 'error' : 'warning'} sx={{ fontSize: '0.65rem', height: 20 }} />
                      </Box>
                    }
                    secondary={`${tx.date} · ${tx.category}`}
                  />
                  {formatRecentAmount(tx)}
                </ListItem>
                {index < recentTxs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}

export default Dashboard;