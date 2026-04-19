import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, List, ListItem, IconButton, Divider, useTheme, useMediaQuery } from '@mui/material';
import { DeleteOutline, AutoAwesome } from '@mui/icons-material';
import { format } from 'date-fns';
import { useFirestoreCollection } from '../hooks/useFirestoreNew';

export default function MistakesJournal() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    // Using firestore hook to automatically sync mistakes
    // Items are returned from hook sorted by whatever is in firestore by default.
    // We'll sort them by createdAt below.
    const [mistakes, addMistake, updateMistake, deleteMistake, loading] = useFirestoreCollection('mistakesJournal');

    const [newMistake, setNewMistake] = useState('');
    const [newLesson, setNewLesson] = useState('');

    const handleAddMistake = async () => {
        if (!newMistake.trim() || !newLesson.trim()) return;
        
        await addMistake({
            mistake: newMistake,
            lesson: newLesson,
            date: format(new Date(), 'MMM d, yyyy')
        });

        setNewMistake('');
        setNewLesson('');
    };

    // Sort descending by creation time (newest first)
    const sortedMistakes = [...mistakes].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <Box sx={{ 
            height: isMobile ? 'auto' : '100%', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: 'background.default'
        }}>
            
            {/* Header Area */}
            <Box sx={{ 
                p: 3, 
                pb: 4, 
                pt: isMobile ? 3 : 5, 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText',
                textAlign: 'center',
                boxShadow: 2,
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '800px', mx: 'auto' }}>
                    <AutoAwesome sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} color="inherit" />
                    <Typography variant="h5" color="inherit" fontWeight="800" sx={{ mb: 1.5, letterSpacing: '-0.5px' }}>
                        Mistakes & Lessons
                    </Typography>
                    <Typography variant="body1" color="inherit" sx={{ fontStyle: 'italic', opacity: 0.9, fontWeight: 500, lineHeight: 1.6, px: 2 }}>
                        "Don't make the same mistakes. Make new mistakes, learn from them and don't repeat them."
                    </Typography>
                </Box>
            </Box>

            {/* Input Section */}
            <Box sx={{ flexShrink: 0, px: isMobile ? 2 : 4, mt: -2, zIndex: 10, maxWidth: '800px', mx: 'auto', width: '100%' }}>
                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 2 }}>
                        LOG A NEW LESSON
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField 
                            label="The Mistake" 
                            placeholder="What went wrong?"
                            variant="outlined" 
                            fullWidth 
                            multiline 
                            rows={2}
                            value={newMistake} 
                            onChange={e => setNewMistake(e.target.value)}
                        />
                        <TextField 
                            label="The Fix / Lesson" 
                            placeholder="What did you learn? How will you prevent this?"
                            variant="outlined" 
                            fullWidth 
                            multiline 
                            rows={2}
                            value={newLesson} 
                            onChange={e => setNewLesson(e.target.value)}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleAddMistake}
                                disabled={!newMistake.trim() || !newLesson.trim() || loading}
                                sx={{ px: 4, py: 1, borderRadius: 2 }}
                            >
                                Log Lesson
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Previous Logs Section */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', px: isMobile ? 2 : 4, py: 4, maxWidth: '800px', mx: 'auto', width: '100%' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                    Previous Logs
                </Typography>
                
                {sortedMistakes.length === 0 && !loading && (
                    <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
                        <Typography variant="body1">No mistakes logged yet.</Typography>
                        <Typography variant="body2">Start building your wisdom library above.</Typography>
                    </Box>
                )}

                <List disablePadding>
                    {sortedMistakes.map((log) => (
                        <Paper key={log.id} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }} elevation={0}>
                            <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                    {log.date || 'Unknown Date'}
                                </Typography>
                                <IconButton size="small" onClick={() => {
                                    if(window.confirm('Delete this log permanently?')) {
                                        deleteMistake(log.id);
                                    }
                                }} color="error" sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}>
                                    <DeleteOutline fontSize="small" />
                                </IconButton>
                            </Box>
                            <Box sx={{ p: 2.5 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="error.main" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 0.5, display: 'block' }}>
                                        Mistake
                                    </Typography>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {log.mistake}
                                    </Typography>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box>
                                    <Typography variant="caption" color="success.main" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 0.5, display: 'block' }}>
                                        Lesson / Fix
                                    </Typography>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {log.lesson}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </List>
            </Box>
        </Box>
    );
}
