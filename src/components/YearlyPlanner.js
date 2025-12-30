import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Grid, TextField, Tooltip, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { NavigateBefore, NavigateNext, Brightness4, Brightness7, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { format, addYears, subYears } from 'date-fns';

function YearlyPlanner() {
    const [currentYear, setCurrentYear] = useState(new Date());
    const [isDark, setIsDark] = useState(false);
    const [plannerData, setPlannerData] = useState(() => {
        try {
            const saved = localStorage.getItem('yearlyPlannerData');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Error loading yearly planner data:', e);
            return {};
        }
    });

    const yearKey = `${currentYear.getFullYear()}`;
    const currentYearData = plannerData[yearKey] || {
        yearFocus: '',
        whyStatement: '',
        priorities: '',
        notes: '',
        monthlyGoals: {} // { '01': '', '02': '', ... }
    };

    useEffect(() => {
        localStorage.setItem('yearlyPlannerData', JSON.stringify(plannerData));
    }, [plannerData]);

    const updateYearData = (updates) => {
        setPlannerData(prev => ({
            ...prev,
            [yearKey]: { ...currentYearData, ...updates }
        }));
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
    };

    return (
        <Box sx={{ p: 3, minHeight: '100vh', bgcolor: theme.bg, color: theme.text }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <IconButton onClick={() => handleNavigate('prev')}><NavigateBefore /></IconButton>
                <Typography variant="h4" sx={{ mx: 3, fontWeight: 'bold' }}>{format(currentYear, 'yyyy')}</Typography>
                <IconButton onClick={() => handleNavigate('next')}><NavigateNext /></IconButton>
                <Tooltip title={isDark ? "Light Mode" : "Dark Mode"}>
                    <IconButton onClick={() => setIsDark(!isDark)}>
                        {isDark ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Year Focus */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
                <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Year Focus</Typography>
                <TextField
                    fullWidth multiline minRows={3}
                    placeholder="Main focus for the year..."
                    value={currentYearData.yearFocus}
                    onChange={handleChange('yearFocus')}
                    sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
                />
            </Paper>

            {/* Why Statement */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
                <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Why Statement</Typography>
                <TextField
                    fullWidth multiline minRows={3}
                    placeholder="Why are you chasing these goals?"
                    value={currentYearData.whyStatement}
                    onChange={handleChange('whyStatement')}
                    sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
                />
            </Paper>

            {/* Priorities */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
                <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Priorities</Typography>
                <TextField
                    fullWidth multiline minRows={4}
                    placeholder="Top priorities for the year..."
                    value={currentYearData.priorities}
                    onChange={handleChange('priorities')}
                    sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
                />
            </Paper>

            {/* Notes */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: theme.paper, borderRadius: 2, boxShadow: theme.shadow }}>
                <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Notes</Typography>
                <TextField
                    fullWidth multiline minRows={5}
                    placeholder="Free‑form notes..."
                    value={currentYearData.notes}
                    onChange={handleChange('notes')}
                    sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
                />
            </Paper>

            {/* Monthly Goal Breakdown */}
            <Typography variant="h6" sx={{ mb: 2, color: theme.accent3, fontWeight: 700 }}>Monthly Goal Breakdown</Typography>
            {Array.from({ length: 12 }, (_, i) => {
                const monthIdx = String(i + 1).padStart(2, '0');
                const monthName = format(new Date(currentYear.getFullYear(), i, 1), 'MMMM');
                return (
                    <Accordion key={monthIdx} defaultExpanded sx={{ bgcolor: theme.paper, mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={{ fontWeight: 600 }}>{monthName}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TextField
                                fullWidth multiline minRows={2}
                                placeholder={`Goals for ${monthName}`}
                                value={currentYearData.monthlyGoals[monthIdx] || ''}
                                onChange={handleMonthGoalChange(monthIdx)}
                                sx={{ bgcolor: theme.inputBg, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: theme.divider } } }}
                            />
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Box>
    );
}

export default YearlyPlanner;
