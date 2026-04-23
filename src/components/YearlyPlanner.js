import React, { useState } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreNew';
import { Box, Paper, Typography, IconButton, Grid, TextField, Tooltip, useTheme } from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';
import { format, addYears, subYears } from 'date-fns';

// Default year data structure
const defaultYearData = {
    yearFocus: '',
    whyStatement: '',
    priorities: '',
    notes: '',
    monthlyGoals: {}
};

function YearlyPlanner() {
    const theme = useTheme();
    const [currentYear, setCurrentYear] = useState(new Date());

    const yearKey = `${currentYear.getFullYear()}`;

    // Use year-specific document path
    const [rawYearData, setYearData] = useFirestoreDoc(`planner/yearly/${yearKey}`, defaultYearData);

    // Ensure all properties have safe defaults
    const currentYearData = {
        yearFocus: rawYearData?.yearFocus ?? '',
        whyStatement: rawYearData?.whyStatement ?? '',
        priorities: rawYearData?.priorities ?? '',
        notes: rawYearData?.notes ?? '',
        monthlyGoals: rawYearData?.monthlyGoals ?? {}
    };

    const updateYearData = (updates) => {
        setYearData({
            ...currentYearData,
            ...updates
        });
    };

    const handleNavigate = (dir) => {
        setCurrentYear(prev => dir === 'prev' ? subYears(prev, 1) : addYears(prev, 1));
    };

    const handleChange = (field) => (e) => updateYearData({ [field]: e.target.value });

    const handleMonthGoalChange = (month) => (e) => {
        updateYearData({ monthlyGoals: { ...currentYearData.monthlyGoals, [month]: e.target.value } });
    };

    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
            {/* Header */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', mb: 4 }}>
                <Box /> {/* Left spacer for perfect centering */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => handleNavigate('prev')}><NavigateBefore /></IconButton>
                    <Typography variant="h4" sx={{ mx: 3, fontWeight: 'bold' }}>{format(currentYear, 'yyyy')}</Typography>
                    <IconButton onClick={() => handleNavigate('next')}><NavigateNext /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                </Box>
            </Box>

            {/* Top Section: Focus & Why */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'warning.main', fontWeight: 700 }}>Year Focus</Typography>
                        <TextField
                            fullWidth multiline minRows={4}
                            placeholder="What is your ONE main focus for this year?"
                            value={currentYearData.yearFocus}
                            onChange={handleChange('yearFocus')}
                            sx={{ bgcolor: 'action.hover', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'divider' } } }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'warning.main', fontWeight: 700 }}>Why Statement</Typography>
                        <TextField
                            fullWidth multiline minRows={4}
                            placeholder="Why does this matter? What is the emotional fuel?"
                            value={currentYearData.whyStatement}
                            onChange={handleChange('whyStatement')}
                            sx={{ bgcolor: 'action.hover', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'divider' } } }}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Middle Section: Priorities & Notes */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'warning.main', fontWeight: 700 }}>Top Priorities</Typography>
                        <TextField
                            fullWidth multiline minRows={6}
                            placeholder="1. Priority A&#10;2. Priority B&#10;3. Priority C"
                            value={currentYearData.priorities}
                            onChange={handleChange('priorities')}
                            sx={{ bgcolor: 'action.hover', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'divider' } } }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'warning.main', fontWeight: 700 }}>Notes & Ideas</Typography>
                        <TextField
                            fullWidth multiline minRows={6}
                            placeholder="Brain dump, random thoughts, ideas..."
                            value={currentYearData.notes}
                            onChange={handleChange('notes')}
                            sx={{ bgcolor: 'action.hover', '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'divider' } } }}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Bottom Section: Monthly Grid */}
            <Typography variant="h5" sx={{ mt: 6, mb: 3, fontWeight: 700, color: 'text.primary' }}>Monthly Breakdown</Typography>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: 'repeat(3, 1fr)'
                },
                gap: 3
            }}>
                {Array.from({ length: 12 }, (_, i) => {
                    const monthIdx = String(i + 1).padStart(2, '0');
                    const monthName = format(new Date(currentYear.getFullYear(), i, 1), 'MMMM');
                    return (
                        <Paper key={monthIdx} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                                {monthName}
                            </Typography>
                            <TextField
                                fullWidth multiline minRows={3}
                                placeholder={`Goals for ${monthName}...`}
                                value={currentYearData.monthlyGoals[monthIdx] || ''}
                                onChange={handleMonthGoalChange(monthIdx)}
                                variant="standard"
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    bgcolor: 'action.hover',
                                    borderRadius: 1,
                                    p: 1,
                                    fontSize: '0.9rem',
                                    flexGrow: 1,
                                    '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' }
                                }}
                            />
                        </Paper>
                    );
                })}
            </Box>
        </Box>
    );
}

export default YearlyPlanner;
