import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { CATEGORY_COLORS } from '../api/api';

function MobileTransactionCard({ transaction, onEdit, onDelete, accounts }) {
  const { date, description, category, type, amount, tags, accountId, currency, originalAmount, originalCurrency } = transaction;
  const account = accounts.find((a) => a.id === accountId);
  const categoryColor = CATEGORY_COLORS[category] || '#607D8B';

  const getTypeColor = (type) => {
    switch (type) {
      case 'income': return 'success';
      case 'expense': return 'error';
      case 'transfer': return 'warning';
      default: return 'default';
    }
  };

  const displayAmount = originalAmount !== undefined ? originalAmount : amount;
  const displayCurrency = originalCurrency || currency || 'AZN';

  return (
    <Card sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {description || category}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              <Chip
                label={category}
                size="small"
                sx={{
                  backgroundColor: categoryColor + '20',
                  color: categoryColor,
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
              <Chip
                label={type}
                size="small"
                color={getTypeColor(type)}
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
              <Chip
                label={date}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>
            {tags && tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                ))}
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {account?.name || accountId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 1 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              color={type === 'income' ? 'success.main' : type === 'expense' ? 'error.main' : 'text.secondary'}
            >
              {type === 'income' ? '+' : type === 'expense' ? '-' : ''}
              {displayAmount.toFixed(2)} {displayCurrency}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(transaction)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => onDelete(transaction)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default MobileTransactionCard;