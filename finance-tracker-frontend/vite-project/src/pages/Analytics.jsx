import React, { useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Skeleton, Avatar, Chip,
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../store/AppDataContext';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../api/api';
import { useTranslation } from 'react-i18next';

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#3F51B5', '#FF5722', '#009688'];

function Analytics() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const {
    state,
    fetchStatsOverview,
    fetchStatsTrends,
  } = useAppData();

  const statsOverview = state.statsOverview.data;
  const statsOverviewLoading = state.statsOverview.loading;
  const statsTrends = state.statsTrends.data;
  const statsTrendsLoading = state.statsTrends.loading;

  useEffect(() => {
    if (token) {
      fetchStatsOverview(token);
      fetchStatsTrends(token);
    }
  }, [token, fetchStatsOverview, fetchStatsTrends]);

  const dailyData = statsTrends?.dailySpending || [];
  const topCategories = statsTrends?.topCategories || [];
  const avgDailySpend = statsTrends?.avgDailySpend || 0;
  const biggestExpense = statsTrends?.biggestExpense || null;
  const pieData = topCategories.slice(0, 6).map((item) => ({
    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    value: item.amount,
    category: item.category,
  }));

  const isLoading = statsOverviewLoading || statsTrendsLoading;

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
            {isLoading ? (
              <Skeleton width={60} height={32} />
            ) : (
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                {typeof value === 'number' ? `₼${value.toFixed(2)}` : value}
              </Typography>
            )}
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 44, height: 44 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>{t('analytics.title')}</Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('analytics.avgDailySpend')} value={avgDailySpend} icon={<TrendingDownIcon sx={{ color: 'white' }} />} color="#F44336" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('analytics.totalSpend')} value={dailyData.reduce((sum, d) => sum + d.amount, 0)} icon={<AttachMoneyIcon sx={{ color: 'white' }} />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('analytics.topCategory')} value={topCategories.length > 0 ? topCategories[0].category : 'N/A'} icon={<CategoryIcon sx={{ color: 'white' }} />} color="#FF9800" subtitle={topCategories.length > 0 ? `₼${topCategories[0].amount.toFixed(2)}` : ''} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title={t('analytics.biggestExpense')} value={biggestExpense ? `₼${biggestExpense.amount?.toFixed(2) || 0}` : 'N/A'} icon={<TrendingUpIcon sx={{ color: 'white' }} />} color="#9C27B0" subtitle={biggestExpense?.description || ''} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>{t('analytics.dailySpending')}</Typography>
            <Box sx={{ height: 300 }}>
              {isLoading ? (
                <Skeleton variant="rounded" height={280} />
              ) : dailyData.length === 0 ? (
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">{t('analytics.noData')}</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(dailyData.length / 10)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => `₼${value.toFixed(2)}`} labelFormatter={(label) => `Date: ${label}`} />
                    <Line type="monotone" dataKey="amount" stroke="#1976d2" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>{t('analytics.topCategories')}</Typography>
            <Box sx={{ height: 300 }}>
              {isLoading ? (
                <Skeleton variant="rounded" height={280} />
              ) : pieData.length === 0 ? (
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">{t('analytics.noCategoryData')}</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
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

        <Grid item xs={12}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>{t('analytics.categoryBreakdown')}</Typography>
            {isLoading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} variant="rounded" height={36} sx={{ my: 1 }} />)
            ) : topCategories.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 2 }}>{t('analytics.noData')}</Typography>
            ) : (
              <Grid container spacing={2}>
                {topCategories.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.category}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: CATEGORY_COLORS[item.category] + '20', color: CATEGORY_COLORS[item.category] || '#607D8B', width: 36, height: 36 }}>
                            <Typography fontSize={18}>{CATEGORY_ICONS[item.category] || '📌'}</Typography>
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</Typography>
                            <Typography variant="body2" color="text.secondary">₼{item.amount.toFixed(2)}</Typography>
                          </Box>
                          <Box sx={{ width: 6, height: 32, borderRadius: 3, bgcolor: CATEGORY_COLORS[item.category] || '#607D8B' }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {biggestExpense && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>🔥 {t('analytics.biggestExpense')}</Typography>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FFF3E0', border: '1px solid #FFE0B2', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 1, sm: 3 } }}>
                <Typography variant="h6" fontWeight={700} color="error.main">₼{biggestExpense.amount?.toFixed(2) || 0}</Typography>
                <Typography variant="body1" fontWeight={500}>{biggestExpense.description || biggestExpense.category || 'Expense'}</Typography>
                <Typography variant="body2" color="text.secondary">{biggestExpense.category} · {biggestExpense.date}</Typography>
                <Chip label={biggestExpense.type} size="small" color="error" />
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default Analytics;