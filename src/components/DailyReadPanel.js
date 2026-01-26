import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    CircularProgress
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useFirestoreCollection } from '../hooks/useFirestoreNew';
import { format } from 'date-fns';

function DailyReadPanel({ sx }) {
    const [dailyReads, addDailyRead, updateDailyRead, deleteDailyRead, loading] = useFirestoreCollection('daily_reads', 'createdAt');
    const [newReadText, setNewReadText] = useState('');

    const handleAddRead = async () => {
        if (!newReadText.trim()) return;

        await addDailyRead({
            text: newReadText,
            createdAt: Date.now()
        });
        setNewReadText('');
    };

    const handleDeleteRead = async (id) => {
        if (window.confirm('Are you sure you want to delete this specific daily read?')) {
            await deleteDailyRead(id);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, ...sx }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ ...sx }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Daily Reads
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Texts, affirmations, or quotes you want to read every day.
                </Typography>
            </Box>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Add new text..."
                        value={newReadText}
                        onChange={(e) => setNewReadText(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleAddRead();
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddRead}
                        disabled={!newReadText.trim()}
                        startIcon={<Add />}
                    >
                        Add
                    </Button>
                </Box>
            </Paper>

            <List sx={{ p: 0 }}>
                {dailyReads.map((read) => (
                    <Paper
                        key={read.id}
                        sx={{
                            mb: 2,
                            p: 2,
                            borderRadius: 2,
                            borderLeft: '4px solid #1976d2',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {read.text}
                            </Typography>
                            {/* Optional: Show created date if needed, but for daily reads maybe strictly content is better */}
                            {/* <Typography variant="caption" color="text.secondary">
                                Added {format(new Date(read.createdAt), 'MMM d, yyyy')}
                            </Typography> */}
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => handleDeleteRead(read.id)}
                            sx={{ ml: 1, opacity: 0.6 }}
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    </Paper>
                ))}
                {dailyReads.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4, opacity: 0.6 }}>
                        <Typography variant="body2">
                            No daily reads yet. Add something you want to see every day!
                        </Typography>
                    </Box>
                )}
            </List>
        </Box>
    );
}

export default DailyReadPanel;
