import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { CATEGORIES, TX_TYPES, CURRENCIES } from '../api/api';
import { useTranslation } from 'react-i18next';

const INCOME_CATEGORIES = ['salary', 'freelance', 'gift', 'other'];
const EXPENSE_CATEGORIES = CATEGORIES.filter((cat) => !INCOME_CATEGORIES.includes(cat));
const TRANSFER_CATEGORIES = CATEGORIES;

function TransactionForm({ open, onClose, onSave, editData, accounts, error: externalError }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    accountId: '',
    type: '',
    amount: '',
    category: '',
    description: '',
    date: '',
    time: '12:00',
    currency: '',
    tags: [],
    isRecurring: false,
    toAccountId: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setFormData({
        accountId: editData.accountId || '',
        type: editData.type || '',
        amount: editData.amount?.toString() || '',
        category: editData.category || '',
        description: editData.description || '',
        date: editData.date || '',
        time: editData.time || '12:00',
        currency: editData.currency || '',
        tags: editData.tags || [],
        isRecurring: editData.isRecurring || false,
        toAccountId: editData.toAccountId || '',
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setFormData({
        accountId: accounts.length > 0 ? accounts[0].id : '',
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: today,
        time: '12:00',
        currency: '',
        tags: [],
        isRecurring: false,
        toAccountId: '',
      });
    }
  }, [editData, accounts]);

  useEffect(() => {
    if (externalError) setError(externalError);
  }, [externalError]);

  const getAvailableCategories = (type) => {
    if (type === 'income') return INCOME_CATEGORIES;
    if (type === 'expense') return EXPENSE_CATEGORIES;
    if (type === 'transfer') return TRANSFER_CATEGORIES;
    return CATEGORIES;
  };

  const handleTypeChange = (newType) => {
    const available = getAvailableCategories(newType);
    const currentCategory = formData.category;
    if (currentCategory && !available.includes(currentCategory)) {
      setFormData((prev) => ({ ...prev, type: newType, category: '' }));
    } else {
      setFormData((prev) => ({ ...prev, type: newType }));
    }
    setError('');
  };

  const handleChange = (field, value) => {
    if (field === 'type') {
      handleTypeChange(value);
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setError('');
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSubmit = () => {
    const { accountId, type, amount, category, date, time, currency, description, tags, isRecurring, toAccountId } = formData;

    if (!accountId) {
      setError(t('transactions.errors.accountRequired'));
      return;
    }
    if (!type) {
      setError(t('transactions.errors.typeRequired'));
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError(t('transactions.errors.amountRequired'));
      return;
    }
    if (!category) {
      setError(t('transactions.errors.categoryRequired'));
      return;
    }
    if (!date) {
      setError(t('transactions.errors.dateRequired'));
      return;
    }
    if (type === 'transfer' && !toAccountId) {
      setError(t('transactions.errors.toAccountRequired'));
      return;
    }

    const data = {
      accountId,
      type,
      amount: parseFloat(amount),
      category,
      date,
      time: time || '12:00',
      currency: currency || undefined,
      description: description || '',
      tags: tags || [],
      isRecurring: Boolean(isRecurring),
    };

    if (type === 'transfer' && toAccountId) {
      data.toAccountId = toAccountId;
    }

    onSave(data);
  };

  const showTransfer = formData.type === 'transfer';
  const availableCategories = getAvailableCategories(formData.type);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editData ? t('transactions.formTitleEdit') : t('transactions.formTitleCreate')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>{t('transactions.selectAccount')}</InputLabel>
            <Select
              value={formData.accountId}
              onChange={(e) => handleChange('accountId', e.target.value)}
              label={t('transactions.selectAccount')}
            >
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('transactions.selectType')}</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              label={t('transactions.selectType')}
            >
              {TX_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {showTransfer && (
            <FormControl fullWidth>
              <InputLabel>{t('transactions.toAccount')}</InputLabel>
              <Select
                value={formData.toAccountId}
                onChange={(e) => handleChange('toAccountId', e.target.value)}
                label={t('transactions.toAccount')}
              >
                <MenuItem value="">{t('transactions.selectToAccount')}</MenuItem>
                {accounts
                  .filter((a) => a.id !== formData.accountId)
                  .map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            label={t('transactions.amount')}
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          />

          <FormControl fullWidth>
            <InputLabel>{t('transactions.selectCategory')}</InputLabel>
            <Select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              label={t('transactions.selectCategory')}
            >
              {availableCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={t('transactions.description')}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={t('transactions.descriptionPlaceholder')}
          />

          <TextField
            fullWidth
            label={t('transactions.dateLabel')}
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label={t('transactions.timeLabel')}
            type="time"
            value={formData.time}
            onChange={(e) => handleChange('time', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth>
            <InputLabel>{t('transactions.currencyLabel')}</InputLabel>
            <Select
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              label={t('transactions.currencyLabel')}
            >
              <MenuItem value="">{t('transactions.defaultCurrency')}</MenuItem>
              {CURRENCIES.map((cur) => (
                <MenuItem key={cur} value={cur}>
                  {cur}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
              {t('transactions.tagsLabel')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                placeholder={t('transactions.addTag')}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" size="small" onClick={handleAddTag} startIcon={<AddIcon />}>
                {t('transactions.tagAddButton')}
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {formData.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" onDelete={() => handleRemoveTag(tag)} />
              ))}
            </Box>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('transactions.cancel')}</Button>
        <Button onClick={handleSubmit} variant="contained">
          {editData ? t('transactions.update') : t('transactions.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TransactionForm;