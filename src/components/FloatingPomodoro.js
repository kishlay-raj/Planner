import React from 'react';
import { Box, Paper, Typography, IconButton, Fab, Zoom, Chip, Tooltip } from '@mui/material';
import { PlayArrow, Pause, Stop, Psychology, WorkOutline } from '@mui/icons-material';

const FloatingPomodoro = ({
    timeLeft,
    isActive,
    onToggle,
    mode,
    visible,
    workType = 'deep',
    onWorkTypeToggle
}) => {
    // Format time
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');

    // Mode colors
    const modeColors = {
        pomodoro: '#b74b4b',
        shortBreak: '#4c9195',
        longBreak: '#457ca3'
    };

    if (!visible) return null;

    return (
        <Zoom in={visible}>
            <Paper
                elevation={6}
                sx={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    zIndex: 2000,
                    bgcolor: modeColors[mode] || modeColors.pomodoro,
                    color: 'white',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    pr: 1
                }}
            >
                <Box
                    sx={{
                        px: 2,
                        py: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'default',
                        gap: 0.5
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                        {minutes}:{seconds}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                        {mode === 'pomodoro' ? 'FOCUS' : 'BREAK'}
                    </Typography>
                    {mode === 'pomodoro' && (
                        <Tooltip title="Click to toggle work type">
                            <Chip
                                icon={workType === 'deep' ? <Psychology sx={{ fontSize: '0.9rem' }} /> : <WorkOutline sx={{ fontSize: '0.9rem' }} />}
                                label={workType === 'deep' ? 'Deep' : 'Shallow'}
                                size="small"
                                onClick={onWorkTypeToggle}
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    bgcolor: 'rgba(255,255,255,0.25)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
                                    '& .MuiChip-icon': { color: 'white' }
                                }}
                            />
                        </Tooltip>
                    )}
                </Box>

                <IconButton
                    size="small"
                    onClick={onToggle}
                    sx={{
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                >
                    {isActive ? <Pause /> : <PlayArrow />}
                </IconButton>
            </Paper>
        </Zoom>
    );
};

export default FloatingPomodoro;
