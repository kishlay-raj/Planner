import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Switch,
    useTheme,
    Divider,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    LinearProgress,
    Chip
} from '@mui/material';
import {
    DragIndicator,
    Dashboard,
    ViewWeek,
    CalendarMonth,
    EmojiEvents,
    MenuBook,
    SelfImprovement,
    ViewQuilt,
    Timer,
    DeleteForever,
    WbSunny,
    NightsStay,
    GitHub,
    Restore,
    Refresh,
    FolderSpecial
} from '@mui/icons-material';
import { useFirestore } from '../hooks/useFirestore';
import { useGitHubSync } from '../hooks/useGitHubSync';
import packageJson from '../../package.json';

// Map icon keys to actual components
const iconMap = {
    dashboard: <Dashboard />,
    viewWeek: <ViewWeek />,
    calendarMonth: <CalendarMonth />,
    emojiEvents: <EmojiEvents />,
    menuBook: <MenuBook />,
    selfImprovement: <SelfImprovement />,
    viewQuilt: <ViewQuilt />,
    timer: <Timer />,
    security: <Box sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>🛡️</Box>,
    project: <FolderSpecial />
};

function Settings({ navConfig, onUpdate, darkMode, onToggleDarkMode, pomodoroSettings, handleSettingChange, activeNoPomodoroTime = 0, onTestInactivityAlert, isActive = false }) {
    const theme = useTheme();

    const [tasks, setTasks] = useFirestore('allTasks', []);
    const [openResetDialog, setOpenResetDialog] = useState(false);
    const [openRestoreDialog, setOpenRestoreDialog] = useState(false);

    // GitHub Sync State
    const { syncToGitHub, restoreFromGitHub, status: syncStatus, progress: syncProgress, error: syncError } = useGitHubSync((lastSyncTime) => {
        // Update Firestore with last sync time
        setGithubSettings({ ...githubSettings, lastSyncTime });
    });
    const [githubSettings, setGithubSettings] = useFirestore('githubSettings', { token: '', owner: '', repo: '' });

    const [ghToken, setGhToken] = useState(githubSettings.token || '');
    const [ghOwner, setGhOwner] = useState(githubSettings.owner || '');
    const [ghRepo, setGhRepo] = useState(githubSettings.repo || '');

    // Sync local state with Firestore when it changes
    React.useEffect(() => {
        setGhToken(githubSettings.token || '');
        setGhOwner(githubSettings.owner || '');
        setGhRepo(githubSettings.repo || '');
    }, [githubSettings]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(navConfig);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        onUpdate(items);
    };

    const handleToggle = (id) => {
        const updatedConfig = navConfig.map(item =>
            item.id === id ? { ...item, visible: !item.visible } : item
        );
        onUpdate(updatedConfig);
    };

    const handleResetAllTasks = () => {
        setTasks([]);
        setOpenResetDialog(false);
    };

    const handleGitHubSync = () => {
        if (!ghToken || !ghOwner || !ghRepo) {
            alert('Please fill in all GitHub details');
            return;
        }
        // Save to Firestore
        setGithubSettings({ token: ghToken, owner: ghOwner, repo: ghRepo });

        syncToGitHub(ghToken, ghOwner, ghRepo);
    };

    const handleGitHubRestore = () => {
        setOpenRestoreDialog(false);
        if (!ghToken || !ghOwner || !ghRepo) {
            alert('Please fill in all GitHub details');
            return;
        }
        restoreFromGitHub(ghToken, ghOwner, ghRepo);
    };

    const handleHardRefresh = async () => {
        if (window.confirm('This will reload the app and clear cached data (but keep you logged in). Continue?')) {
            try {
                // Clear all caches
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                }

                // Unregister service workers
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(reg => reg.unregister()));
                }

                // Reload without forcing cache bypass (preserves auth)
                window.location.reload();
            } catch (error) {
                console.error('Error during hard refresh:', error);
                // Fallback to simple reload
                window.location.reload();
            }
        }
    };

    const isLoading = syncStatus === 'fetching' || syncStatus === 'pushing' || syncStatus === 'pulling' || syncStatus === 'restoring';

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary }}>
                Settings
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
                Customize your workspace navigation and manage data.
            </Typography>

            {/* Appearance Section */}
            <Paper elevation={0} sx={{ p: 0, mb: 4, borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ p: 3, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Appearance
                    </Typography>
                </Box>
                <Divider />
                <List>
                    <ListItem>
                        <ListItemIcon>
                            {darkMode ? <NightsStay /> : <WbSunny />}
                        </ListItemIcon>
                        <ListItemText
                            primary="Dark Mode"
                            secondary="Switch between light and dark themes"
                        />
                        <Switch
                            edge="end"
                            checked={darkMode}
                            onChange={onToggleDarkMode}
                        />
                    </ListItem>
                </List>
            </Paper>

            {/* Pomodoro Inactivity Alert Section */}
            {pomodoroSettings && handleSettingChange && (
                <Paper elevation={0} sx={{ p: 0, mb: 4, borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                    <Box sx={{ p: 3, bgcolor: theme.palette.action.hover, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Timer color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Pomodoro Focus Alert
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                Get notified when active on your system without an active Pomodoro timer.
                            </Typography>
                        </Box>
                        {onTestInactivityAlert && (
                            <Button
                                variant="outlined"
                                color="secondary"
                                size="small"
                                onClick={onTestInactivityAlert}
                                sx={{ borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap' }}
                            >
                                🧪 Test Alert Now
                            </Button>
                        )}
                    </Box>
                    <Divider />
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Focus Inactivity Alert"
                                secondary="Alert me if I am active on my computer without running a Pomodoro timer"
                            />
                            <Switch
                                edge="end"
                                checked={pomodoroSettings.enableInactivityAlert !== false}
                                onChange={(e) => handleSettingChange('enableInactivityAlert', e.target.checked)}
                            />
                        </ListItem>
                        {pomodoroSettings.enableInactivityAlert !== false && (
                            <>
                                <Divider component="li" />
                                <ListItem>
                                    <ListItemText
                                        primary="Alert Threshold"
                                        secondary="How long you must be active without Pomodoro before the alert triggers"
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        {[1, 5, 10, 15, 20, 30].map((mins) => (
                                            <Button
                                                key={mins}
                                                size="small"
                                                variant={(pomodoroSettings.inactivityAlertInterval || 15) === mins ? "contained" : "outlined"}
                                                onClick={() => handleSettingChange('inactivityAlertInterval', mins)}
                                                sx={{ minWidth: 42, px: 1, py: 0.5, fontWeight: 700 }}
                                            >
                                                {mins === 1 ? '1m (debug)' : `${mins}m`}
                                            </Button>
                                        ))}
                                    </Box>
                                </ListItem>

                                <Divider component="li" />
                                {/* Live Alert Progress Status */}
                                <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                                            Live Alert Progress
                                        </Typography>
                                        <Chip
                                            size="small"
                                            color={isActive ? "info" : "warning"}
                                            variant={isActive ? "outlined" : "filled"}
                                            label={
                                                isActive 
                                                    ? "Pomodoro Active (Paused Tracking)" 
                                                    : `${Math.floor(activeNoPomodoroTime / 60).toString().padStart(2, '0')}:${(activeNoPomodoroTime % 60).toString().padStart(2, '0')} / ${String(pomodoroSettings.inactivityAlertInterval || 15).padStart(2, '0')}:00`
                                            }
                                            sx={{ fontWeight: 700, fontFamily: 'monospace' }}
                                        />
                                    </Box>

                                    {isActive ? (
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Timer is currently running. Inactivity counter will restart when timer finishes or stops.
                                        </Typography>
                                    ) : (
                                        (() => {
                                            const targetSecs = (pomodoroSettings.inactivityAlertInterval || 15) * 60;
                                            const progress = Math.min(100, Math.round((activeNoPomodoroTime / targetSecs) * 100));
                                            const remainingSecs = Math.max(0, targetSecs - activeNoPomodoroTime);
                                            const remMins = Math.floor(remainingSecs / 60);
                                            const remSecs = remainingSecs % 60;

                                            return (
                                                <Box sx={{ width: '100%' }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={progress}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            bgcolor: theme.palette.action.selected,
                                                            '& .MuiLinearProgress-bar': {
                                                                borderRadius: 4,
                                                                background: progress > 80
                                                                    ? 'linear-gradient(90deg, #ed6c02, #d32f2f)'
                                                                    : 'linear-gradient(90deg, #1976d2, #ed6c02)'
                                                            }
                                                        }}
                                                    />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                                            {progress}% completed
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                                                            {remainingSecs === 0 
                                                                ? 'Alert triggering now!' 
                                                                : `${remMins}m ${remSecs}s remaining until alert`
                                                            }
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })()
                                    )}
                                </ListItem>
                            </>
                        )}
                    </List>
                </Paper>
            )}

            {/* Sidebar Navigation Section */}
            <Paper elevation={0} sx={{ p: 0, mb: 4, borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ p: 3, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Sidebar Navigation
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Drag to reorder. Toggle to hide or show items.
                    </Typography>
                </Box>
                <Divider />

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="nav-settings-list">
                        {(provided) => (
                            <List {...provided.droppableProps} ref={provided.innerRef}>
                                {navConfig.map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(provided, snapshot) => (
                                            <ListItem
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                sx={{
                                                    bgcolor: snapshot.isDragging ? theme.palette.action.selected : 'transparent',
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    '&:last-child': { borderBottom: 'none' }
                                                }}
                                                secondaryAction={
                                                    <Switch
                                                        edge="end"
                                                        checked={item.visible}
                                                        onChange={() => handleToggle(item.id)}
                                                    />
                                                }
                                            >
                                                <ListItemIcon
                                                    {...provided.dragHandleProps}
                                                    sx={{ minWidth: 40, cursor: 'grab', color: theme.palette.text.disabled }}
                                                >
                                                    <DragIndicator />
                                                </ListItemIcon>
                                                <ListItemIcon sx={{ minWidth: 46, color: item.visible ? theme.palette.primary.main : theme.palette.text.disabled }}>
                                                    {iconMap[item.iconKey]}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={item.label}
                                                    primaryTypographyProps={{
                                                        fontWeight: 500,
                                                        color: item.visible ? theme.palette.text.primary : theme.palette.text.disabled
                                                    }}
                                                />
                                            </ListItem>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </List>
                        )}
                    </Droppable>
                </DragDropContext>
            </Paper>

            {/* GitHub Sync Section */}
            <Paper elevation={0} sx={{ p: 0, mb: 4, borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ p: 3, bgcolor: theme.palette.action.hover }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GitHub />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            GitHub Backup & Restore
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Sync your data to a private GitHub repository or restore from it.
                    </Typography>
                </Box>
                <Divider />
                <Box sx={{ p: 3 }}>
                    {syncError && (
                        <Alert severity="error" sx={{ mb: 2 }}>{syncError}</Alert>
                    )}
                    {syncStatus === 'success' && (
                        <Alert severity="success" sx={{ mb: 2 }}>{syncProgress || 'Operation successful!'}</Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Personal Access Token (PAT)"
                            type="password"
                            value={ghToken}
                            onChange={(e) => setGhToken(e.target.value)}
                            fullWidth
                            size="small"
                            helperText="Create a token with 'repo' scope at github.com/settings/tokens"
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Owner (Username)"
                                value={ghOwner}
                                onChange={(e) => setGhOwner(e.target.value)}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="Repository Name"
                                value={ghRepo}
                                onChange={(e) => setGhRepo(e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <GitHub />}
                                onClick={handleGitHubSync}
                                disabled={isLoading}
                            >
                                {isLoading ? syncProgress : 'Sync to GitHub'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="warning"
                                startIcon={<Restore />}
                                onClick={() => setOpenRestoreDialog(true)}
                                disabled={isLoading}
                            >
                                Restore from GitHub
                            </Button>
                        </Box>

                        {githubSettings.lastSyncTime && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Last synced: {new Date(githubSettings.lastSyncTime).toLocaleString()}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Paper>

            {/* App Maintenance Section */}
            <Paper elevation={0} sx={{ p: 0, mb: 4, borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ p: 3, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        App Maintenance
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Troubleshoot issues by clearing cache and force reloading.
                    </Typography>
                </Box>
                <Divider />
                <Box sx={{ p: 3 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={handleHardRefresh}
                    >
                        Hard Refresh
                    </Button>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                        This will reload the application, clear cached assets (forcing latest update), and unregister the service worker. Your session will be preserved.
                    </Typography>
                </Box>
            </Paper>

            <Box sx={{ mt: 6 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.error.main }}>
                    Danger Zone
                </Typography>
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.error.light}`,
                        bgcolor: 'background.paper'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.error.dark }}>
                                Reset All Tasks
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                This will permanently delete all your tasks. This action cannot be undone.
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteForever />}
                            onClick={() => setOpenResetDialog(true)}
                        >
                            Reset All
                        </Button>
                    </Box>
                </Paper>
            </Box>

            <Dialog
                open={openResetDialog}
                onClose={() => setOpenResetDialog(false)}
            >
                <DialogTitle>Reset All Tasks?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete all tasks? This process cannot be undone and you will lose all your progress.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenResetDialog(false)}>Cancel</Button>
                    <Button onClick={handleResetAllTasks} color="error" autoFocus>
                        Reset All
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Restore Confirmation Dialog */}
            <Dialog
                open={openRestoreDialog}
                onClose={() => setOpenRestoreDialog(false)}
            >
                <DialogTitle sx={{ color: 'warning.main' }}>Confirm Restore?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will download data from your GitHub repository and <strong style={{ color: 'red' }}>OVERWRITE</strong> your local data for matching dates.
                        <br /><br />
                        This is intended for disaster recovery. Are you sure you want to proceed?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRestoreDialog(false)}>Cancel</Button>
                    <Button onClick={handleGitHubRestore} color="warning" autoFocus>
                        Yes, Restore Data
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Version Information */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                    Version {packageJson.version}
                </Typography>
            </Box>
        </Box>
    );
}

export default Settings;
