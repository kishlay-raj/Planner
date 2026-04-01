import React, { useState } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Divider,
    Tooltip
} from '@mui/material';
import {
    NavigateBefore,
    NavigateNext,
    CloudDone,
    CloudUpload,
    Favorite
} from '@mui/icons-material';
import { format, addDays, subDays } from 'date-fns';
import { useTheme } from '@mui/material/styles';

function GratitudeJournal() {
    const theme = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());

    // State for journal entries
    const [journalData, setJournalData, loading, saving] = useFirestore('gratitudeJournalData', {});

    const getSyncStatus = () => {
        if (loading) return { icon: <CloudUpload fontSize="small" sx={{ animation: 'spin 2s linear infinite' }} />, text: 'Loading...', color: 'text.secondary' };
        if (saving) return { icon: <CloudUpload fontSize="small" sx={{ animation: 'spin 2s linear infinite' }} />, text: 'Saving...', color: 'primary.main' };
        return { icon: <CloudDone fontSize="small" />, text: 'All changes saved', color: 'success.main' };
    };
    const status = getSyncStatus();

    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const currentEntry = journalData[dateKey] || { item1: '', item2: '', item3: '', notes: '' };

    const handleResponseChange = (field, value) => {
        setJournalData(prev => ({
            ...prev,
            [dateKey]: {
                ...currentEntry,
                [field]: value
            }
        }));
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, height: '100%', overflow: 'auto', bgcolor: theme.palette.background.default }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h3" sx={{ color: theme.palette.text.primary, fontWeight: 800, letterSpacing: '-1px', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Favorite sx={{ fontSize: 40, color: '#e91e63' }} /> Gratitude Journal
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, fontWeight: 500, maxWidth: 600 }}>
                        Before you sleep, shift your focus. Remember your achievements and the good things that happened today.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Sync Status Icon */}
                    <Tooltip title={status.text}>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: status.color, opacity: 0.7 }}>
                            {status.icon}
                        </Box>
                    </Tooltip>

                    <Paper sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 0.5,
                        px: 1,
                        borderRadius: 8,
                        boxShadow: 'none',
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.background.paper
                    }}>
                        <IconButton onClick={() => setCurrentDate(subDays(currentDate, 1))} size="small">
                            <NavigateBefore sx={{ color: theme.palette.text.secondary }} />
                        </IconButton>
                        <Box sx={{ textAlign: 'center', minWidth: 160 }}>
                            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600, lineHeight: 1.2, fontSize: '1rem' }}>
                                {format(currentDate, 'MMMM d, yyyy')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                                {format(currentDate, 'EEEE')}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setCurrentDate(addDays(currentDate, 1))} size="small">
                            <NavigateNext sx={{ color: theme.palette.text.secondary }} />
                        </IconButton>
                    </Paper>
                </Box>
            </Box>

            <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
                <Paper sx={{
                    p: 4,
                    mb: 4,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 2,
                    boxShadow: 'none',
                    border: `1px solid ${theme.palette.divider}`,
                    borderTop: `3px solid #e91e63`,
                    overflow: 'hidden'
                }}>
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700, mb: 3 }}>
                        1. What is something you achieved today, big or small?
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder="I finally finished..."
                        value={currentEntry.item1 || ''}
                        onChange={(e) => handleResponseChange('item1', e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                            bgcolor: 'transparent',
                            '& .MuiInputBase-root': { fontSize: '1.2rem', color: theme.palette.text.secondary, lineHeight: 1.6, padding: 0 }
                        }}
                    />
                    <Divider sx={{ mt: 2, mb: 3, borderColor: theme.palette.divider, opacity: 0.6 }} />

                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700, mb: 3 }}>
                        2. What is a good moment or positive thing that happened?
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder="I really enjoyed..."
                        value={currentEntry.item2 || ''}
                        onChange={(e) => handleResponseChange('item2', e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                            bgcolor: 'transparent',
                            '& .MuiInputBase-root': { fontSize: '1.2rem', color: theme.palette.text.secondary, lineHeight: 1.6, padding: 0 }
                        }}
                    />
                    <Divider sx={{ mt: 2, mb: 3, borderColor: theme.palette.divider, opacity: 0.6 }} />

                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700, mb: 3 }}>
                        3. What is something you are deeply grateful for right now?
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder="I am grateful for..."
                        value={currentEntry.item3 || ''}
                        onChange={(e) => handleResponseChange('item3', e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                            bgcolor: 'transparent',
                            '& .MuiInputBase-root': { fontSize: '1.2rem', color: theme.palette.text.secondary, lineHeight: 1.6, padding: 0 }
                        }}
                    />
                </Paper>

                {/* Freeform Notes */}
                <Paper sx={{
                    p: 4,
                    mb: 10,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 2,
                    boxShadow: 'none',
                    border: `1px solid ${theme.palette.divider}`,
                }}>
                    <Typography variant="h6" sx={{ mb: 3, color: theme.palette.text.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.5px' }}>
                        Additional Notes & Reflections
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder="Anything else?"
                        value={currentEntry.notes || ''}
                        onChange={(e) => handleResponseChange('notes', e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                            bgcolor: 'transparent',
                            '& .MuiInputBase-root': { fontSize: '0.95rem', color: theme.palette.text.secondary, lineHeight: 1.6, padding: 0 }
                        }}
                    />
                </Paper>
            </Box>
        </Box>
    );
}

export default GratitudeJournal;
