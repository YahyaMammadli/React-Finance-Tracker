import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  Stack,
  Tooltip,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../store/AppDataContext';
import { CATEGORIES, TX_TYPES, CATEGORY_COLORS } from '../api/api';
import TransactionForm from '../components/TransactionForm';
import MobileTransactionCard from '../components/MobileTransactionCard';
import { useTranslation } from 'react-i18next';
import useDebounce from '../hooks/useDebounce';

function Transactions() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const {
    state,
    fetchAccounts,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useAppData();

  const accounts = state.accounts.data;
  const accountsLoading = state.accounts.loading;
  const transactions = state.transactions.data;
  const transactionsLoading = state.transactions.loading;
  const transactionsError = state.transactions.error;
  const pagination = state.transactionsPagination;

  const [filters, setFilters] = useState({
    accountId: '',
    type: '',
    category: '',
    from: '',
    to: '',
    search: '',
  });

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const debouncedSearch = useDebounce(filters.search, 500);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [localError, setLocalError] = useState('');

  const loadData = useCallback(async () => {
    try {
      if (accounts.length === 0) {
        await fetchAccounts(token);
      }
      await fetchTransactions(
        {
          page: page + 1,
          limit: limit,
          accountId: filters.accountId || undefined,
          type: filters.type || undefined,
          category: filters.category || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          search: debouncedSearch || undefined,
        },
        token
      );
    } catch (err) {
      setLocalError(err.message || 'Failed to load data');
    }
  }, [page, limit, filters, debouncedSearch, token, fetchAccounts, fetchTransactions, accounts.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenCreate = () => {
    setEditingTx(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingTx(null);
    setLocalError('');
  };

  const handleSaveTransaction = async (data) => {
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, data, token);
      } else {
        await createTransaction(data, token);
      }
      handleCloseForm();
      loadData();
    } catch (err) {
      setLocalError(err.message || 'Failed to save transaction');
    }
  };

  const handleDeleteClick = (tx) => {
    setDeleteConfirm(tx);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTransaction(deleteConfirm.id, token);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      setLocalError(err.message || 'Failed to delete transaction');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'income': return 'success';
      case 'expense': return 'error';
      case 'transfer': return 'warning';
      default: return 'default';
    }
  };

  const getCategoryColor = (category) => CATEGORY_COLORS[category] || '#607D8B';

  // ⭐ Убрали вывод красного предупреждения – ошибки теперь только в консоли
  // const showError = localError || transactionsError;

  // Для отладки можно вывести в консоль (необязательно)
  if (localError || transactionsError) {
    console.error('Transaction error:', localError || transactionsError);
  }

  const formatAmount = (tx) => {
    if (tx.originalAmount !== undefined && tx.originalCurrency) {
      return (
        <Box>
          <Typography variant="body2" fontWeight={600} color={tx.type === 'income' ? 'success.main' : tx.type === 'expense' ? 'error.main' : 'text.secondary'}>
            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
            {tx.originalAmount.toFixed(2)} {tx.originalCurrency}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
            (≈ ₼{tx.amount.toFixed(2)})
          </Typography>
        </Box>
      );
    } else {
      return (
        <Typography variant="body2" fontWeight={600} color={tx.type === 'income' ? 'success.main' : tx.type === 'expense' ? 'error.main' : 'text.secondary'}>
          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
          ₼{tx.amount.toFixed(2)}
        </Typography>
      );
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>{t('transactions.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size={isMobile ? 'small' : 'medium'}>
          {t('transactions.add')}
        </Button>
      </Box>

      <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('transactions.account')}</InputLabel>
              <Select
                value={filters.accountId}
                onChange={(e) => handleFilterChange('accountId', e.target.value)}
                label={t('transactions.account')}
              >
                <MenuItem value="">All</MenuItem>
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('transactions.type')}</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label={t('transactions.type')}
              >
                <MenuItem value="">All</MenuItem>
                {TX_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('transactions.category')}</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label={t('transactions.category')}
              >
                <MenuItem value="">All</MenuItem>
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {!isMobile && (
            <>
              <Grid item xs={6} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('transactions.from')}
                  value={filters.from}
                  onChange={(e) => handleFilterChange('from', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={t('transactions.to')}
                  value={filters.to}
                  onChange={(e) => handleFilterChange('to', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={6} md={isMobile ? 12 : 3}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('transactions.search')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>),
                endAdornment: filters.search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleFilterChange('search', '')}><ClearIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ⭐ Красное предупреждение удалено – ошибки только в консоли */}
      {/* {showError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError('')}>{showError}</Alert>} */}

      {isMobile ? (
        <Stack spacing={1}>
          {transactionsLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={120} />)
          ) : transactions.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">{t('transactions.noTransactions')}</Typography></Paper>
          ) : (
            transactions.map((tx) => (
              <MobileTransactionCard key={tx.id} transaction={tx} onEdit={handleOpenEdit} onDelete={handleDeleteClick} accounts={accounts} />
            ))
          )}
        </Stack>
      ) : (
        <Paper>
          <TableContainer>
            <Table size={isTablet ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('transactions.date')}</TableCell>
                  <TableCell>{t('transactions.description')}</TableCell>
                  <TableCell>{t('transactions.category')}</TableCell>
                  <TableCell>{t('transactions.type')}</TableCell>
                  <TableCell align="right">{t('transactions.amount')}</TableCell>
                  <TableCell>{t('transactions.account')}</TableCell>
                  <TableCell align="center">{t('transactions.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactionsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={60} /></TableCell>
                      <TableCell><Skeleton width={60} /></TableCell>
                      <TableCell align="right"><Skeleton width={70} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell align="center"><Skeleton width={60} /></TableCell>
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">{t('transactions.noTransactions')}</Typography></TableCell></TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id} hover>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{tx.description || tx.category}</Typography>
                        {tx.tags && tx.tags.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            {tx.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={tx.category} size="small" sx={{ backgroundColor: getCategoryColor(tx.category) + '20', color: getCategoryColor(tx.category), fontWeight: 500 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={tx.type} size="small" color={getTypeColor(tx.type)} />
                      </TableCell>
                      <TableCell align="right">{formatAmount(tx)}</TableCell>
                      <TableCell>{accounts.find((a) => a.id === tx.accountId)?.name || tx.accountId}</TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('transactions.edit')}><IconButton size="small" onClick={() => handleOpenEdit(tx)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={t('transactions.delete')}><IconButton size="small" color="error" onClick={() => handleDeleteClick(tx)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={pagination.total}
            rowsPerPage={limit}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      )}

      <TransactionForm
        open={formOpen}
        onClose={handleCloseForm}
        onSave={handleSaveTransaction}
        editData={editingTx}
        accounts={accounts}
        error={localError}
      />

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('transactions.deleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('transactions.deleteConfirm')}</Typography>
          {deleteConfirm && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="body2">
                {deleteConfirm.description || deleteConfirm.category} · 
                {deleteConfirm.originalAmount !== undefined ? 
                  `${deleteConfirm.originalAmount.toFixed(2)} ${deleteConfirm.originalCurrency}` : 
                  `₼${deleteConfirm.amount?.toFixed(2)}`
                }
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>{t('transactions.cancel')}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">{t('transactions.delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Transactions;