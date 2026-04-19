import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

/**
 * Shows a circular progress ring with today's completion percentage.
 */
export default function DailyScore({ completedCount, totalCount }) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isPerfect = percentage === 100 && totalCount > 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        {/* Background track */}
        <CircularProgress 
          variant="determinate" 
          value={100} 
          size={52} 
          thickness={4}
          sx={{ color: 'action.hover', position: 'absolute' }}
        />
        {/* Actual progress */}
        <CircularProgress 
          variant="determinate" 
          value={percentage} 
          size={52} 
          thickness={4}
          color={isPerfect ? 'success' : 'primary'}
          sx={{
            transition: 'all 0.4s ease',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round'
            }
          }}
        />
        <Box sx={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0, right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="caption" fontWeight={700} color={isPerfect ? 'success.main' : 'text.primary'}>
            {percentage}%
          </Typography>
        </Box>
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={600} color="text.primary">
          {isPerfect ? '🎯 Perfect Day!' : `${completedCount}/${totalCount}`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Today's Score
        </Typography>
      </Box>
    </Box>
  );
}
