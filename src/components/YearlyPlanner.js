import React, { useState } from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreNew';
import { Box, Paper, Typography, IconButton, Grid, TextField, Tooltip } from '@mui/material';
import { NavigateBefore, NavigateNext, Brightness4, Brightness7 } from '@mui/icons-material';
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
    const [currentYear, setCurrentYear] = useState(new Date());
    const [isDark, setIsDark] = useState(false);

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

    const theme = {
        bg: isDark ? '#121212' : '#f0f2f5',
        paper: isDark ? '#1e1e1e' : '#ffffff',
        text: isDark ? '#e0e0e0' : '#2d3748',
        textSecondary: isDark ? '#a0a0a0' : '#718096',
        inputBg: isDark ? 'rgba(255,255,255,0.05)' : '#f7fafc',
        divider: isDark ? '#333333' : '#e2e8f0',
        primary: isDark ? '#90caf9' : '#3182ce',
        accent3: isDark ? '#ffcc80' : '#dd6b20',
        shadow: isDark ? '0 4px 6px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    };

    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: theme.bg, color: theme.text }}>
            {/* Header */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', mb: 4 }}>
                <Box /> {/* Left spacer for perfect centering */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => handleNavigate('prev')}><NavigateBefore /></IconButton>
                    <Typography variant="h4" sx={{ mx: 3, fontWeight: 'bold' }}>{format(currentYear, 'yyyy')}</Typography>
                    <IconButton onClick={() => handleNavigate('next')}><NavigateNext /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title={isDark ? "Light Mode" : "Dark Mode"}>
                        <IconButton onClick={() => setIsDark(!isDark)}>
                            {isDark ? <Brightness7 /> : <Brightness4 />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Top Section: Focus & Why */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
                        <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Year Focus</Typography>
                        <TextField
                            fullWidth multiline minRows={4}
                            placeholder="What is your ONE main focus for this year?"
                            value={currentYearData.yearFocus}
                            onChange={handleChange('yearFocus')}
                            sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
                        <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Why Statement</Typography>
                        <TextField
                            fullWidth multiline minRows={4}
                            placeholder="Why does this matter? What is the emotional fuel?"
                            value={currentYearData.whyStatement}
                            onChange={handleChange('whyStatement')}
                            sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Middle Section: Priorities & Notes */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
                        <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Top Priorities</Typography>
                        <TextField
                            fullWidth multiline minRows={6}
                            placeholder="1. Priority A&#10;2. Priority B&#10;3. Priority C"
                            value={currentYearData.priorities}
                            onChange={handleChange('priorities')}
                            sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%', bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
                        <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Notes & Ideas</Typography>
                        <TextField
                            fullWidth multiline minRows={6}
                            placeholder="Brain dump, random thoughts, ideas..."
                            value={currentYearData.notes}
                            onChange={handleChange('notes')}
                            sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Bottom Section: Monthly Grid */}
            <Typography variant="h5" sx={{ mt: 6, mb: 3, fontWeight: 700, color: theme.text }}>Monthly Breakdown</Typography>
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
                        <Paper key={monthIdx} sx={{ p: 2, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: theme.primary }}>
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
                                    bgcolor: theme.inputBg,
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
