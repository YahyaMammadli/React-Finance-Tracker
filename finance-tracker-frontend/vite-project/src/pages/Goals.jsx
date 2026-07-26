import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Tooltip, CircularProgress, Alert, Skeleton, Stack, Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../store/AppDataContext';
import { CURRENCIES, GOAL_STATUSES } from '../api/api';
import { useTranslation } from 'react-i18next';

function Goals() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const {
    state,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    depositToGoal,
  } = useAppData();

  const goals = state.goals.data;
  const loading = state.goals.loading;
  const error = state.goals.error;

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '', targetAmount: '', currentAmount: '', currency: 'AZN',
    deadline: '', icon: '🎯', color: '#3498db', status: 'active'
  });
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (token) fetchGoals(token);
  }, [token, fetchGoals]);

  const handleOpenCreate = () => {
    setFormData({ title: '', targetAmount: '', currentAmount: '', currency: 'AZN', deadline: '', icon: '🎯', color: '#3498db', status: 'active' });
    setEditingGoal(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      currency: goal.currency || 'AZN',
      deadline: goal.deadline || '',
      icon: goal.icon || '🎯',
      color: goal.color || '#3498db',
      status: goal.status,
    });
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingGoal(null);
    setLocalError('');
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const { title, targetAmount, currency, deadline, icon, color, status } = formData;
    if (!title || !targetAmount) {
      setLocalError(t('goals.errors.titleRequired'));
      return;
    }
    try {
      const data = {
        title,
        targetAmount: parseFloat(targetAmount),
        currency,
        deadline: deadline || null,
        icon,
        color,
        status,
      };
      if (formData.currentAmount && !editingGoal) {
        data.currentAmount = parseFloat(formData.currentAmount);
      }
      if (editingGoal) {
        await updateGoal(editingGoal.id, data, token);
      } else {
        await createGoal(data, token);
      }
      handleCloseForm();
      fetchGoals(token);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleOpenDeposit = (goal) => {
    setDepositGoal(goal);
    setDepositAmount('');
    setDepositOpen(true);
  };

  const handleDeposit = async () => {
    if (!depositGoal || !depositAmount) {
      setLocalError('Please enter an amount');
      return;
    }
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setLocalError(t('goals.errors.amountPositive'));
      return;
    }
    try {
      await depositToGoal(depositGoal.id, amount, token);
      setDepositOpen(false);
      setDepositGoal(null);
      setDepositAmount('');
      fetchGoals(token);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleDeleteClick = (goal) => setDeleteConfirm(goal);
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteGoal(deleteConfirm.id, token);
      setDeleteConfirm(null);
      fetchGoals(token);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const GoalCard = ({ goal }) => {
    const { title, targetAmount, currentAmount, currency, deadline, icon, color, status } = goal;
    const progress = Math.min((currentAmount / targetAmount) * 100, 100);
    const isCompleted = status === 'completed';

    return (
      <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
        {isCompleted && <Chip label={t('goals.completed')} color="success" size="small" sx={{ position: 'absolute', top: -10, right: 16 }} />}
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {icon || '🎯'}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
              <Typography variant="body2" color="text.secondary">{currency} · {status}</Typography>
            </Box>
            <Box>
              <Tooltip title={t('goals.edit')}><IconButton size="small" onClick={() => handleOpenEdit(goal)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title={t('goals.delete')}><IconButton size="small" color="error" onClick={() => handleDeleteClick(goal)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">{t('goals.progress')}</Typography>
            <Typography variant="body2" fontWeight={600}>{currentAmount.toFixed(2)} {currency} / {targetAmount.toFixed(2)} {currency}</Typography>
          </Box>
          <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', py: 1 }}>
            <CircularProgress variant="determinate" value={Math.min(progress, 100)} size={80} thickness={6} sx={{ color: isCompleted ? '#4CAF50' : color }} />
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>{progress.toFixed(0)}%</Typography>
              <Typography variant="caption" color="text.secondary">{isCompleted ? t('goals.done') : t('goals.toGo')}</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {deadline && <Typography variant="caption" color="text.secondary">{t('goals.due')}: {deadline}</Typography>}
            {!isCompleted && (
              <Button size="small" variant="outlined" startIcon={<TrendingUpIcon />} onClick={() => handleOpenDeposit(goal)} disabled={status === 'cancelled'}>
                {t('goals.deposit')}
              </Button>
            )}
            {isCompleted && <Chip label={t('goals.completed')} size="small" color="success" />}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('goals.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>{t('goals.add')}</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>{error}</Alert>}

      <Grid container spacing={3}>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={280} /></Grid>
          ))
        ) : goals.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('goals.noGoals')}</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={handleOpenCreate}>{t('goals.create')}</Button>
            </Paper>
          </Grid>
        ) : (
          goals.map((goal) => (
            <Grid item xs={12} sm={6} md={4} key={goal.id}>
              <GoalCard goal={goal} />
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGoal ? t('goals.edit') : t('goals.create')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField fullWidth label={t('goals.titleLabel')} value={formData.title} onChange={(e) => handleFormChange('title', e.target.value)} />
            <TextField fullWidth label={t('goals.targetAmount')} type="number" value={formData.targetAmount} onChange={(e) => handleFormChange('targetAmount', e.target.value)} InputProps={{ inputProps: { min: 0, step: 0.01 } }} />
            {!editingGoal && (
              <TextField fullWidth label={t('goals.currentAmount')} type="number" value={formData.currentAmount} onChange={(e) => handleFormChange('currentAmount', e.target.value)} InputProps={{ inputProps: { min: 0, step: 0.01 } }} />
            )}
            <FormControl fullWidth>
              <InputLabel>{t('goals.currency')}</InputLabel>
              <Select value={formData.currency} onChange={(e) => handleFormChange('currency', e.target.value)} label={t('goals.currency')}>
                {CURRENCIES.map(cur => <MenuItem key={cur} value={cur}>{cur}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label={t('goals.deadline')} type="date" value={formData.deadline} onChange={(e) => handleFormChange('deadline', e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField fullWidth label={t('goals.icon')} value={formData.icon} onChange={(e) => handleFormChange('icon', e.target.value)} placeholder="🎯" />
            <TextField fullWidth label={t('goals.color')} value={formData.color} onChange={(e) => handleFormChange('color', e.target.value)} placeholder="#3498db" />
            {editingGoal && (
              <FormControl fullWidth>
                <InputLabel>{t('goals.status')}</InputLabel>
                <Select value={formData.status} onChange={(e) => handleFormChange('status', e.target.value)} label={t('goals.status')}>
                  {GOAL_STATUSES.map(s => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {localError && <Alert severity="error" onClose={() => setLocalError('')}>{localError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>{t('goals.cancel')}</Button>
          <Button onClick={handleSave} variant="contained">{editingGoal ? t('goals.edit') : t('goals.create')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={depositOpen} onClose={() => setDepositOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('goals.depositTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {depositGoal?.title} · Target: {depositGoal?.targetAmount?.toFixed(2)} {depositGoal?.currency}
          </Typography>
          <TextField
            fullWidth
            label={t('goals.depositAmount')}
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            autoFocus
          />
          {localError && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setLocalError('')}>{localError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositOpen(false)}>{t('goals.cancel')}</Button>
          <Button onClick={handleDeposit} variant="contained">{t('goals.deposit')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('goals.deleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('goals.deleteConfirm')} <strong>{deleteConfirm?.title}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>{t('goals.cancel')}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">{t('goals.delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Goals;