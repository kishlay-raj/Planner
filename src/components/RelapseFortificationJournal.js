import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    useTheme,
    Divider,
    Stack,
    Container,
    Popover
} from '@mui/material';
import EnhancedDatePicker from './EnhancedDatePicker';
import {
    NavigateBefore,
    NavigateNext,
    History as HistoryIcon,
    Security,
    Psychology,
    Build,
    Timeline,
    WarningAmber,
    CheckCircleOutline,
    EmojiEvents,
    Bolt,
    DoNotDisturb,
    Timer,
    Shield,
    ArrowBack
} from '@mui/icons-material';
import { format, addDays, subDays } from 'date-fns';

// --- VISUAL CONSTANTS ---
const THEME_COLORS = {
    CRASH: '#d32f2f',
    FORTRESS: '#2e7d32',
    ANALYSIS: '#ed6c02',
    PATCH: '#0288d1'
};

const SimpleInput = ({ label, value, onChange, placeholder, icon, minRows = 2, accentColor }) => (
    <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{
            color: accentColor,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1
        }}>
            {icon && React.cloneElement(icon, { sx: { fontSize: 18 } })}
            {label}
        </Typography>
        <TextField
            fullWidth
            multiline
            minRows={minRows}
            placeholder={placeholder}
            value={value || ''}
            onChange={onChange}
            variant="outlined"
            size="small"
            sx={{
                '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    '& fieldset': {
                        borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                        borderColor: 'text.secondary',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: accentColor,
                        borderWidth: 2
                    }
                }
            }}
        />
    </Box>
);

function RelapseFortificationJournal() {
    const theme = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [journalData, setJournalData] = useFirestore('relapseJournalData', {});
    const [historyMenuAnchor, setHistoryMenuAnchor] = useState(null);

    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const currentEntry = journalData[dateKey] || {};

    const handleChange = (field, value) => {
        setJournalData(prev => ({
            ...prev,
            [dateKey]: { ...currentEntry, [field]: value }
        }));
    };

    // Analytics
    useEffect(() => {
        const handler = setTimeout(() => {
            if (Object.keys(currentEntry).length > 0) {
                import("../firebase").then(({ logAnalyticsEvent }) => {
                    logAnalyticsEvent('relapse_journal_updated', { date: dateKey });
                });
            }
        }, 2000);
        return () => clearTimeout(handler);
    }, [currentEntry, dateKey]);

    const getSortedDates = () => {
        return Object.keys(journalData)
            .filter(d => journalData[d] && Object.values(journalData[d]).some(v => v && v.trim()))
            .sort((a, b) => new Date(a) - new Date(b)); // Ascending for logic
    };

    const handlePrevious = () => {
        const sorted = getSortedDates();
        const currentIndex = sorted.indexOf(dateKey);

        // If current date is in the list and has a previousone
        if (currentIndex > 0) {
            setCurrentDate(new Date(sorted[currentIndex - 1]));
        }
        // If current date is not in list (e.g. today new entry), find the last entry overall
        else if (currentIndex === -1 && sorted.length > 0) {
            // Find valid dates before current
            const before = sorted.filter(d => new Date(d) < currentDate);
            if (before.length > 0) {
                setCurrentDate(new Date(before[before.length - 1]));
            } else {
                setCurrentDate(subDays(currentDate, 1));
            }
        } else {
            setCurrentDate(subDays(currentDate, 1));
        }
    };

    const handleNext = () => {
        const sorted = getSortedDates();
        const currentIndex = sorted.indexOf(dateKey);

        if (currentIndex !== -1 && currentIndex < sorted.length - 1) {
            setCurrentDate(new Date(sorted[currentIndex + 1]));
        } else {
            // Check if we are already at "Today" or future
            const today = new Date();
            if (format(currentDate, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')) {
                // Try to find next existing
                const after = sorted.filter(d => new Date(d) > currentDate);
                if (after.length > 0) {
                    setCurrentDate(new Date(after[0]));
                } else {
                    // Jump to Today to allow creating new entry
                    setCurrentDate(today);
                }
            }
        }
    };

    const [calendarAnchor, setCalendarAnchor] = useState(null);

    const handleCalendarOpen = (event) => {
        setCalendarAnchor(event.currentTarget);
    };

    const handleCalendarClose = () => {
        setCalendarAnchor(null);
    };

    const handleDateChange = (newDate) => {
        setCurrentDate(newDate);
        handleCalendarClose();
    };

    // Prepare entries map for the calendar dots
    const entriesMap = Object.keys(journalData).reduce((acc, date) => {
        const entry = journalData[date];
        const hasContent = entry && Object.values(entry).some(v => v && v.trim());
        if (hasContent) {
            acc[date] = { hasJournal: true };
        }
        return acc;
    }, {});

    return (
        <Box sx={{
            height: '100vh',
            overflowY: 'auto',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            color: 'text.primary'
        }}>
            <Container maxWidth="md" sx={{ py: 6, flexGrow: 1 }}>

                {/* --- HEADER --- */}
                <Box sx={{ mb: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
                            Relapse Journal
                        </Typography>

                        {/* Date Nav */}
                        <Paper elevation={0} sx={{
                            display: 'flex', alignItems: 'center', gap: 1, p: 0.5, px: 2,
                            borderRadius: 10, bgcolor: 'background.paper', border: 1, borderColor: 'divider'
                        }}>
                            <IconButton onClick={handlePrevious} size="small" title="Previous Entry">
                                <NavigateBefore />
                            </IconButton>
                            <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {format(currentDate, 'MMM d, yyyy')}
                                </Typography>
                            </Box>
                            <IconButton onClick={handleNext} size="small" title="Next Entry">
                                <NavigateNext />
                            </IconButton>
                            <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto', mx: 1 }} />
                            <IconButton onClick={(e) => setHistoryMenuAnchor(e.currentTarget)} size="small" sx={{ color: 'primary.main' }}>
                                <HistoryIcon fontSize="small" />
                            </IconButton>
                        </Paper>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                        <Shield sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5, color: THEME_COLORS.FORTRESS }} />
                        Process audit. No judgment.
                    </Typography>
                </Box>

                <Stack spacing={6}>
                    {/* --- 1. THE INCIDENT --- */}
                    <Box>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 1,
                            borderBottom: `2px solid ${THEME_COLORS.CRASH}20`
                        }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${THEME_COLORS.CRASH}10`, color: THEME_COLORS.CRASH }}>
                                <Timeline />
                            </Box>
                            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                The Incident
                            </Typography>
                        </Box>
                        <SimpleInput
                            label="What happened?"
                            accentColor={THEME_COLORS.CRASH}
                            placeholder="Activity & Duration (e.g. 'Scrolled Twitter/X for 45 mins')"
                            value={currentEntry.crash}
                            onChange={(e) => handleChange('crash', e.target.value)}
                            minRows={3}
                        />
                    </Box>

                    {/* --- 2. FORTRESS REPORT --- */}
                    <Box>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 1,
                            borderBottom: `2px solid ${THEME_COLORS.FORTRESS}20`
                        }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${THEME_COLORS.FORTRESS}10`, color: THEME_COLORS.FORTRESS }}>
                                <Security />
                            </Box>
                            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                Fortress Report (Wins)
                            </Typography>
                        </Box>

                        <Stack spacing={0}>
                            <SimpleInput label="The Streak" accentColor={THEME_COLORS.FORTRESS} icon={<Timer />}
                                placeholder="Time focused before slip" value={currentEntry.streak} onChange={(e) => handleChange('streak', e.target.value)} minRows={1} />
                            <SimpleInput label="Effective Shields" accentColor={THEME_COLORS.FORTRESS} icon={<Shield />}
                                placeholder="What defenses worked earlier?" value={currentEntry.shields} onChange={(e) => handleChange('shields', e.target.value)} />
                            <SimpleInput label="Almost Victory" accentColor={THEME_COLORS.FORTRESS} icon={<EmojiEvents />}
                                placeholder="Did you surf an urge? How?" value={currentEntry.victory} onChange={(e) => handleChange('victory', e.target.value)} />
                        </Stack>
                    </Box>

                    {/* --- 3. ANALYSIS --- */}
                    <Box>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 1,
                            borderBottom: `2px solid ${THEME_COLORS.ANALYSIS}20`
                        }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${THEME_COLORS.ANALYSIS}10`, color: THEME_COLORS.ANALYSIS }}>
                                <Psychology />
                            </Box>
                            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                Root Cause
                            </Typography>
                        </Box>

                        <Stack spacing={0}>
                            <SimpleInput label="Trigger (Spark)" accentColor={THEME_COLORS.ANALYSIS} icon={<Bolt />}
                                placeholder="Visual/Auditory cue?" value={currentEntry.trigger} onChange={(e) => handleChange('trigger', e.target.value)} minRows={1} />
                            <SimpleInput label="Craving (Fuel)" accentColor={THEME_COLORS.ANALYSIS} icon={<DoNotDisturb />}
                                placeholder="What discomfort were you escaping?" value={currentEntry.craving} onChange={(e) => handleChange('craving', e.target.value)} minRows={1} />
                            <SimpleInput label="Weak Link" accentColor={THEME_COLORS.ANALYSIS} icon={<WarningAmber />}
                                placeholder="How did you bypass rules?" value={currentEntry.weakLink} onChange={(e) => handleChange('weakLink', e.target.value)} minRows={1} />
                            <SimpleInput label="The Lie" accentColor={THEME_COLORS.ANALYSIS} icon={<Psychology />}
                                placeholder="What did you tell yourself?" value={currentEntry.lie} onChange={(e) => handleChange('lie', e.target.value)} minRows={1} />
                        </Stack>
                    </Box>

                    {/* --- 4. THE PATCH --- */}
                    <Box>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 1,
                            borderBottom: `2px solid ${THEME_COLORS.PATCH}20`
                        }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${THEME_COLORS.PATCH}10`, color: THEME_COLORS.PATCH }}>
                                <Build />
                            </Box>
                            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                                The Patch
                            </Typography>
                        </Box>

                        <Paper elevation={0} sx={{ p: 3, bgcolor: `${THEME_COLORS.PATCH}08`, borderRadius: 3, border: `1px solid ${THEME_COLORS.PATCH}30` }}>
                            <SimpleInput
                                label="Immediate Fix"
                                accentColor={THEME_COLORS.PATCH}
                                icon={<CheckCircleOutline />}
                                placeholder="Specific change to environment right now."
                                value={currentEntry.fix}
                                onChange={(e) => handleChange('fix', e.target.value)}
                                minRows={3}
                            />
                        </Paper>
                    </Box>
                </Stack>
            </Container>

            {/* History Menu */}
            <Menu
                anchorEl={historyMenuAnchor}
                open={Boolean(historyMenuAnchor)}
                onClose={() => setHistoryMenuAnchor(null)}
            >
                {getSortedDates().length === 0 ? (
                    <MenuItem disabled>No history found</MenuItem>
                ) : (
                    getSortedDates().reverse().slice(0, 20).map(d => (
                        <MenuItem key={d} onClick={() => { setCurrentDate(new Date(d)); setHistoryMenuAnchor(null); }}>
                            {format(new Date(d), 'MMM d, yyyy')}
                        </MenuItem>
                    ))
                )}
            </Menu>
        </Box>
    );
}

export default RelapseFortificationJournal;
