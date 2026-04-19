import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

export default function AtmosphereQuote({ quote, author }) {
  return (
    <Box sx={{ px: 3, pt: 1, pb: 1 }}>
      <Paper sx={{
        p: 1.5,
        bgcolor: 'rgba(56, 178, 172, 0.08)',
        borderRadius: 2,
        border: '1px solid #38B2AC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }} elevation={0}>
        <Typography variant="body2" sx={{ color: 'text.primary', fontStyle: 'italic', mb: 0.5 }}>
          "{quote}"
        </Typography>
        <Typography variant="caption" sx={{ color: '#319795', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          — {author}
        </Typography>
      </Paper>
    </Box>
  );
}
