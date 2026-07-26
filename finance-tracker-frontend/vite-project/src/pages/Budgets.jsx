import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Tooltip, LinearProgress, Alert, Skeleton, Stack,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../store/AppDataContext';
import { CATEGORIES, CURRENCIES, PERIODS } from '../api/api';
import { useTranslation } from 'react-i18next';

function Budgets() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const {
    state,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useAppData();

  const budgets = state.budgets.data;
  const loading = state.budgets.loading;
  const error = state.budgets.error;

  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '', amount: '', currency: 'AZN', period: 'monthly', startDate: '', endDate: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (token) {
      fetchBudgets(token);
    }
  }, [token, fetchBudgets]);

  const handleOpenCreate = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFormData({
      category: '', amount: '', currency: 'AZN', period: 'monthly',
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    });
    setEditingBudget(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (budget) => {
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      currency: budget.currency || 'AZN',
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
    });
    setEditingBudget(budget);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingBudget(null);
    setLocalError('');
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const { category, amount, currency, period, startDate, endDate } = formData;
    if (!category || !amount || !startDate || !endDate) {
      setLocalError(t('budgets.errors.fillRequired'));
      return;
    }
    try {
      const data = { category, amount: parseFloat(amount), currency, period, startDate, endDate };
      if (editingBudget) {
        await updateBudget(editingBudget.id, data, token);
      } else {
        await createBudget(data, token);
      }
      handleCloseForm();
      fetchBudgets(token);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleDeleteClick = (budget) => setDeleteConfirm(budget);
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteBudget(deleteConfirm.id, token);
      setDeleteConfirm(null);
      fetchBudgets(token);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const getProgressColor = (spent, amount) => {
    const ratio = spent / amount;
    if (ratio >= 0.9) return 'error';
    if (ratio >= 0.7) return 'warning';
    return 'success';
  };

  const BudgetCard = ({ budget }) => {
    const { category, amount, spent, remaining, currency } = budget;
    const progress = Math.min((spent / amount) * 100, 100);
    const color = getProgressColor(spent, amount);

    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currency} · {budget.period}
              </Typography>
            </Box>
            <Box>
              <Tooltip title={t('budgets.edit')}><IconButton size="small" onClick={() => handleOpenEdit(budget)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('budgets.delete')}><IconButton size="small" color="error" onClick={() => handleDeleteClick(budget)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </Box>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">{t('budgets.spent')}</Typography>
              <Typography variant="body2" fontWeight={600}>
                {spent.toFixed(2)} {currency} / {amount.toFixed(2)} {currency}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} color={color} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">{t('budgets.remaining')}: {remaining.toFixed(2)} {currency}</Typography>
            <Typography variant="caption" color="text.secondary">{progress.toFixed(0)}%</Typography>
          </Box>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">{budget.startDate} — {budget.endDate}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('budgets.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('budgets.add')}</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>{error}</Alert>}

      <Grid container spacing={3}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={180} /></Grid>
          ))
        ) : budgets.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('budgets.noBudgets')}</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={handleOpenCreate}>{t('budgets.create')}</Button>
            </Paper>
          </Grid>
        ) : (
          budgets.map((budget) => (
            <Grid item xs={12} sm={6} md={4} key={budget.id}>
              <BudgetCard budget={budget} />
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBudget ? t('budgets.formTitleEdit') : t('budgets.formTitleCreate')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>{t('budgets.category')}</InputLabel>
              <Select value={formData.category} onChange={(e) => handleFormChange('category', e.target.value)} label={t('budgets.category')}>
                {CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={t('budgets.amount')} type="number" value={formData.amount} onChange={(e) => handleFormChange('amount', e.target.value)} InputProps={{ inputProps: { min: 0, step: 0.01 } }} />
            <FormControl fullWidth>
              <InputLabel>{t('budgets.currency')}</InputLabel>
              <Select value={formData.currency} onChange={(e) => handleFormChange('currency', e.target.value)} label={t('budgets.currency')}>
                {CURRENCIES.map(cur => <MenuItem key={cur} value={cur}>{cur}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('budgets.period')}</InputLabel>
              <Select value={formData.period} onChange={(e) => handleFormChange('period', e.target.value)} label={t('budgets.period')}>
                {PERIODS.map(p => <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={t('budgets.startDate')} type="date" value={formData.startDate} onChange={(e) => handleFormChange('startDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label={t('budgets.endDate')} type="date" value={formData.endDate} onChange={(e) => handleFormChange('endDate', e.target.value)} InputLabelProps={{ shrink: true }} />
            {localError && <Alert severity="error" onClose={() => setLocalError('')}>{localError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>{t('budgets.cancel')}</Button>
          <Button onClick={handleSave} variant="contained">{editingBudget ? t('budgets.edit') : t('budgets.create')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('budgets.deleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('budgets.deleteConfirm')} <strong>{deleteConfirm?.category}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>{t('budgets.cancel')}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">{t('budgets.delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Budgets;