import React from 'react';
import { Box, Paper, Typography, IconButton, Zoom, Chip, Tooltip } from '@mui/material';
import { PlayArrow, Pause, Psychology, WorkOutline, OpenInNew } from '@mui/icons-material';

const FloatingPomodoro = ({
    timeLeft,
    isActive,
    onToggle,
    mode,
    visible,
    workType = 'deep',
    onWorkTypeToggle,
    primaryTask = '',
    secondaryTask = '',
    onOpenWidget,
    widgetOpen = false,
    onSkip,
    onUpdatePrimaryTask,
    onUpdateSecondaryTask
}) => {
    const [editingPrimary, setEditingPrimary] = React.useState(false);
    const [localPrimary, setLocalPrimary] = React.useState(primaryTask);
    const [editingSecondary, setEditingSecondary] = React.useState(false);
    const [localSecondary, setLocalSecondary] = React.useState(secondaryTask);

    React.useEffect(() => { setLocalPrimary(primaryTask); }, [primaryTask]);
    React.useEffect(() => { setLocalSecondary(secondaryTask); }, [secondaryTask]);

    const handlePrimarySave = () => {
        setEditingPrimary(false);
        if (onUpdatePrimaryTask) onUpdatePrimaryTask(localPrimary);
    };

    const handleSecondarySave = () => {
        setEditingSecondary(false);
        if (onUpdateSecondaryTask) onUpdateSecondaryTask(localSecondary);
    };
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
                    pr: 1,
                    maxWidth: 340
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
                        gap: 0.5,
                        minWidth: 0,
                        flex: 1
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
                    {/* Primary task — truncated */}
                    {primaryTask && (
                        editingPrimary ? (
                            <input
                                autoFocus
                                value={localPrimary}
                                onChange={(e) => setLocalPrimary(e.target.value)}
                                onBlur={handlePrimarySave}
                                onKeyDown={(e) => { if (e.key === 'Enter') handlePrimarySave(); }}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    width: '100%',
                                    outline: 'none',
                                    textAlign: 'center'
                                }}
                            />
                        ) : (
                            <Typography
                                variant="caption"
                                onClick={() => setEditingPrimary(true)}
                                sx={{
                                    opacity: 0.85,
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    bgcolor: 'rgba(255,255,255,0.15)',
                                    borderRadius: 1,
                                    px: 1, py: 0.25,
                                    cursor: 'text'
                                }}
                            >
                                {primaryTask}
                            </Typography>
                        )
                    )}
                    {/* Secondary task — lighter */}
                    {secondaryTask && workType !== 'deep' && (
                        editingSecondary ? (
                            <input
                                autoFocus
                                value={localSecondary}
                                onChange={(e) => setLocalSecondary(e.target.value)}
                                onBlur={handleSecondarySave}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSecondarySave(); }}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '1px solid rgba(255,255,255,0.5)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '0.6rem',
                                    fontWeight: 500,
                                    padding: '2px 6px',
                                    width: '100%',
                                    outline: 'none',
                                    textAlign: 'center'
                                }}
                            />
                        ) : (
                            <Typography
                                variant="caption"
                                onClick={() => setEditingSecondary(true)}
                                sx={{
                                    opacity: 0.6,
                                    fontSize: '0.6rem',
                                    fontWeight: 500,
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    borderRadius: 1,
                                    px: 1, py: 0.15,
                                    cursor: 'text'
                                }}
                            >
                                {secondaryTask}
                            </Typography>
                        )
                    )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                        {(mode === 'shortBreak' || mode === 'longBreak') && onSkip && (
                            <Tooltip title="Skip Break">
                                <IconButton
                                    size="small"
                                    onClick={onSkip}
                                    sx={{
                                        color: 'white',
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                    }}
                                >
                                    <span style={{ fontSize: '0.9rem' }}>⏭</span>
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {/* Pop-out widget button */}
                    {onOpenWidget && !widgetOpen && (
                        <Tooltip title="Pop out as always-on-top widget">
                            <IconButton
                                size="small"
                                onClick={onOpenWidget}
                                sx={{
                                    color: 'white',
                                    opacity: 0.6,
                                    p: '3px',
                                    '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.15)' }
                                }}
                            >
                                <OpenInNew sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Paper>
        </Zoom>
    );
};

export default FloatingPomodoro;
