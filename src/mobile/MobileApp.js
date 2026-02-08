import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, ThemeProvider, createTheme, BottomNavigation, BottomNavigationAction, Paper, Fab, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, List, ListItem, ListItemText, Checkbox, IconButton, CircularProgress, Divider, Alert, ToggleButton, ToggleButtonGroup, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { FormatListBulleted, Add, Delete, ChevronLeft, ChevronRight, ViewWeek, CalendarViewMonth, MenuBook, Logout, EditNote, Settings as SettingsIcon, GitHub, Refresh, Restore, CalendarToday, MoreHoriz, DragIndicator } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import NotesPanel from '../components/NotesPanel';
import CalendarView from '../components/CalendarView';
import packageJson from '../../package.json';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCollection, useFirestoreDoc } from '../hooks/useFirestoreNew';
import { useFirestore } from '../hooks/useFirestore';
import { useGitHubSync } from '../hooks/useGitHubSync';
import GoogleIcon from '@mui/icons-material/Google';
import { format, addDays, subDays, isSameDay, parseISO, startOfWeek, endOfWeek, getISOWeek, getYear, getMonth, addWeeks, subWeeks, addMonths, subMonths, eachDayOfInterval } from 'date-fns';



const MOBILE_JOURNAL_PROMPTS = [
    { id: '1', section: 'Morning', text: 'Who is the person I want to become today?' },
    { id: '2', section: 'Morning', text: 'The "Big Rock": What is the one thing I must accomplish today?' },
    { id: '3', section: 'Morning', text: 'The Obstacle: What is most likely to distract me today?' },
    { id: '15', section: 'Morning', text: 'Do I have a timeblock or deadline for my goals?' },
    { id: '16', section: 'Morning', text: 'Slow down cool down, Am I slowing down?' },
    { id: '4', section: 'Deep Work', text: 'The Depth Ratio: How many hours of actual Deep Work did I achieve today?' },
    { id: '5', section: 'Deep Work', text: 'Distraction Deep Dive: When I lost focus, what was the trigger (emotion or app/site)? What was I avoiding?' },
    { id: '6', section: 'Digital Minimalism', text: 'The Solitude Check: Did I spend any time today alone with my own thoughts?' },
    { id: '7', section: 'Digital Minimalism', text: 'Technology Mindfulness: Did I use technology as a tool to support my values, or was I driven by distraction?' },
    { id: '8', section: 'Behavioral Triggers', text: 'The Transition Trap: Did I lose time during a task, or between tasks?' },
    { id: '13', section: 'Evening', text: 'Daily Improvement: What is one system I can tweak to make tomorrow 1% better?' },
    { id: '14', section: 'Evening', text: '3 Amazing things that happened today.' },
    // Phase 1: Awareness Audit
    { id: 'detox-0', section: 'Dopamine detox phase 1: Awareness', text: `"What exactly did I consume today, and in what quantity?" (Be precise: e.g., '2 hours of scrolling,' not 'a little while').` },
    { id: 'detox-0b', section: 'Dopamine detox phase 1: Awareness', text: "Am I feeling the 'Gremlins' on the pain side right now?" },
    { id: 'detox-0c', section: 'Dopamine detox phase 1: Awareness', text: "Am I chasing 'new' right now to solve a real problem, or just to feed the dopamine loop?" },
    // Daily Digital Audit
    { id: 'digital-3', section: 'Daily Digital Audit', text: 'The "Junk internet" Limit: Total minutes spent on Insta/Twitter/News: ______ (Target: <10 mins)' },
    { id: 'digital-4', section: 'Daily Digital Audit', text: 'Fortress Protocol: Did I actively block websites or use a "single-purpose" device during work hours? (Yes/No)' },
    { id: 'digital-5', section: 'Daily Digital Audit', text: 'Trend Line: Did I use less internet today than yesterday? (Yes/No)' }
];

const TAB_CONFIG = {
    today: { label: 'Today', icon: <FormatListBulleted /> },
    schedule: { label: 'Schedule', icon: <CalendarToday /> },
    weekly: { label: 'Weekly', icon: <ViewWeek /> },
    monthly: { label: 'Monthly', icon: <CalendarViewMonth /> },
    journal: { label: 'Journal', icon: <MenuBook /> },
    notes: { label: 'Notes', icon: <EditNote /> },
    settings: { label: 'Settings', icon: <SettingsIcon /> }
};

function MobileApp() {
    const { currentUser, loginWithGoogle, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('today');
    const [mobileTabOrder, setMobileTabOrder] = useFirestore('mobileTabOrder', ['today', 'schedule', 'weekly', 'monthly', 'journal', 'notes', 'settings']);
    const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);

    // Global State
    const [tasks, addTask, updateTask, deleteTask, tasksLoading] = useFirestoreCollection('tasks/active', 'createdAt');
    const [darkMode, setDarkMode] = useFirestore('darkMode', false);

    // --- AUTOMATIC DARK MODE LOGIC ---
    useEffect(() => {
        const checkDarkMode = () => {
            const hour = new Date().getHours();
            // Dark mode between 7 PM (19) and 6 AM (6)
            const shouldBeDark = hour >= 19 || hour < 6;

            // Only update if different to avoid unnecessary writes/renders
            if (shouldBeDark !== darkMode) {
                setDarkMode(shouldBeDark);
            }
        };

        // Check on mount
        checkDarkMode();

        // Check every minute
        const interval = setInterval(checkDarkMode, 60000);
        return () => clearInterval(interval);
    }, [darkMode, setDarkMode]);

    const mobileTheme = useMemo(() => createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: { main: '#1976d2' },
            secondary: { main: '#9c27b0' },
            background: {
                default: darkMode ? '#121212' : '#f0f2f5',
                paper: darkMode ? '#1e1e1e' : '#ffffff'
            },
        },
        components: {
            MuiBottomNavigation: {
                styleOverrides: {
                    root: {
                        height: 65,
                        borderTop: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000
                    }
                }
            },
            MuiFab: {
                styleOverrides: {
                    root: { position: 'fixed', bottom: 80, right: 20, zIndex: 1000 }
                }
            },
            MuiPaper: {
                styleOverrides: { root: { backgroundImage: 'none' } }
            }
        }
    }), [darkMode]);
    const [currentDate, setCurrentDate] = useState(new Date()); // State for Today view navigation if we add it later

    // Task Dialog State
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');

    // Settings State
    const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
    const [githubSettings, setGithubSettings] = useFirestore('githubSettings', { token: '', owner: '', repo: '' });
    const [ghToken, setGhToken] = useState(githubSettings.token || '');
    const [ghOwner, setGhOwner] = useState(githubSettings.owner || '');
    const [ghRepo, setGhRepo] = useState(githubSettings.repo || '');

    const { syncToGitHub, restoreFromGitHub, status: syncStatus, progress: syncProgress, error: syncError } = useGitHubSync((lastSyncTime) => {
        setGithubSettings({ ...githubSettings, lastSyncTime });
    });

    // Sync local state with Firestore when it changes
    React.useEffect(() => {
        setGhToken(githubSettings.token || '');
        setGhOwner(githubSettings.owner || '');
        setGhRepo(githubSettings.repo || '');
    }, [githubSettings]);

    // Auto-save GitHub credentials to Firestore when they change (debounced)
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (ghToken || ghOwner || ghRepo) {
                setGithubSettings({
                    token: ghToken,
                    owner: ghOwner,
                    repo: ghRepo,
                    lastSyncTime: githubSettings.lastSyncTime // preserve last sync time
                });
            }
        }, 1000); // 1 second debounce
        return () => clearTimeout(timer);
    }, [ghToken, ghOwner, ghRepo]); // Only depend on the input values, not githubSettings to avoid loops

    // --- NAVIGATION DATES ---
    const [weekDate, setWeekDate] = useState(new Date());
    const [monthDate, setMonthDate] = useState(new Date());
    const [journalDate, setJournalDate] = useState(new Date());
    const [notesDate, setNotesDate] = useState(new Date());

    // --- IDS ---
    const weekId = `${getYear(weekDate)}-${getISOWeek(weekDate)}`;
    const monthId = `${getYear(monthDate)}-${getMonth(monthDate) + 1}`;

    // Context IDs (Cascading)
    const todayWeekId = `${getYear(currentDate)}-${getISOWeek(currentDate)}`; // For Today View Context
    const weekMonthId = `${getYear(weekDate)}-${getMonth(weekDate) + 1}`; // For Weekly View Context
    const monthYearId = `${getYear(monthDate)}`; // For Monthly View Context

    // --- DATA HOOKS ---

    // 1. Weekly Data (Active Editing)
    const [weekData, setWeekData] = useFirestoreDoc(`planner/weekly/${weekId}`, {
        focus: '',
        goals: [],
        habit: { name: '', days: [false, false, false, false, false, false, false] },
        journal: { start: '', stop: '', continue: '', grateful: '' },
        days: {}
    });

    // 2. Monthly Data (Active Editing)
    const [monthData, setMonthData] = useFirestoreDoc(`planner/monthly/${monthId}`, { monthlyFocus: '', notes: '' });

    // 3. Context Data (Read Only for Cascading Display)
    const [todayWeekData] = useFirestoreDoc(`planner/weekly/${todayWeekId}`, { focus: '' }); // Context for Today View
    const [weekMonthData] = useFirestoreDoc(`planner/monthly/${weekMonthId}`, { monthlyFocus: '' }); // Context for Weekly View
    const [monthYearData] = useFirestoreDoc(`planner/yearly/${monthYearId}`, { yearFocus: '' }); // Context for Monthly View


    // Journal Data
    const journalDateKey = format(journalDate, 'yyyy-MM-dd');
    const [prompts] = useFirestore('journalPrompts', MOBILE_JOURNAL_PROMPTS);
    const [journalData, setJournalData] = useFirestore('dailyJournalData', {});
    const currentJournalEntry = journalData[journalDateKey] || { responses: {}, notes: '' };

    // --- HANDLERS ---

    const handleLogin = async () => { try { await loginWithGoogle(); } catch (e) { console.error(e); } };
    const handleLogout = async () => { try { await logout(); } catch (e) { console.error(e); } };

    const handleAddTask = async () => {
        if (!newTaskName.trim()) return;
        await addTask({
            name: newTaskName, completed: false, createdAt: Date.now(), priority: 'P4',
            date: currentDate.toISOString(), isToday: isSameDay(currentDate, new Date())
        });
        setNewTaskName(''); setOpenAddDialog(false);
    };

    const handleToggleComplete = async (task) => await updateTask(task.id, { completed: !task.completed });
    const handleDeleteTask = async (taskId) => await deleteTask(taskId);

    const handleJournalResponseChange = (promptId, val) => {
        setJournalData(prev => ({ ...prev, [journalDateKey]: { ...currentJournalEntry, responses: { ...currentJournalEntry.responses, [promptId]: val } } }));
    };
    const handleJournalNotesChange = (val) => {
        setJournalData(prev => ({ ...prev, [journalDateKey]: { ...currentJournalEntry, notes: val } }));
    };

    const handleTaskSchedule = async (taskId, timeSlot, newDuration) => {
        const taskIdStr = String(taskId);
        const task = tasks.find(t => String(t.id) === taskIdStr);
        if (task) {
            const scheduledTime = timeSlot instanceof Date ? timeSlot.toISOString() : timeSlot;
            await updateTask(taskIdStr, {
                scheduledTime: scheduledTime,
                duration: newDuration || task.duration
            });
        }
    };

    const handleTaskUpdate = async (updatedTasks) => {
        const tasksToUpdate = Array.isArray(updatedTasks) ? updatedTasks : [updatedTasks];
        for (const taskUpdate of tasksToUpdate) {
            if (taskUpdate.id) await updateTask(taskUpdate.id.toString(), taskUpdate);
        }
    };

    // Wrapper for handleAddTask to match CalendarView signature if needed, 
    // but CalendarView uses onTaskCreate which expects a task object.
    // We'll Create a specific handler for CalendarView creation which often passes fully formed task objects
    const handleCalendarTaskCreate = async (taskData) => {
        await addTask({
            completed: false,
            createdAt: Date.now(),
            ...taskData
        });
    };

    // --- RENDER HELPERS ---

    const getSectionDescription = (sectionName) => {
        if (sectionName === 'Dopamine detox phase 1: Awareness') {
            return "Acknowledge Life is Painful: Dr. Anna Lembke, suggests recalibrating expectations and accepting that life is inherently painful and unpleasant. This perspective can reduce the constant pursuit of comfort and pleasure that often leads to addiction. Desires, ambitions, anger, and greed heat up your system and make life miserable.";
        }
        if (sectionName === 'Dopamine detox phase 2: The Struggle') {
            return "Simulation Trap: Trick 1: Returning to work is easy. Trick 2: You can do it later.";
        }
        if (sectionName === 'Dopamine detox phase 3: Maintenance') {
            return "Simulation Trap: Trick 3: Excitement is not the same thing as fulfillment. Trick 4: You are missing out.";
        }
        switch (sectionName) {
            case 'Digital Minimalism':
                return "Don't have to use electronics and devices much. Technology is a powerful tool, but I will only use it for high-value activities. Every 5 mins scroll takes away your focus, every browser tab you add to your life brings a cognitive tax.";
            case 'Deep Work':
                return "One hour of deep work beats ten hours of distracted effort. Small focused sessions, repeated daily, create extraordinary results. Consistency compounds faster than intensity.";
            default:
                return null;
        }
    };

    const renderContextCard = (label, text, color = 'primary.main') => {
        if (!text) return null;
        return (
            <Paper sx={{ p: 2, mb: 2, bgcolor: `${color}15`, border: `1px solid ${color}40`, borderRadius: 2, mx: 2 }}>
                <Typography variant="caption" sx={{ color: color, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight="600" sx={{ color: 'text.primary' }}>
                    {text}
                </Typography>
            </Paper>
        );
    };

    const renderScheduleView = () => {
        // Filter for scheduled tasks
        const scheduledTasks = tasks.filter(t => t.scheduledTime);

        return (
            <Box sx={{ pb: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10, borderRadius: 0 }}>
                    <IconButton onClick={() => setCurrentDate(d => subDays(d, 1))}><ChevronLeft /></IconButton>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body1" fontWeight="700">{format(currentDate, 'MMMM d')}</Typography>
                        <Typography variant="caption" color="text.secondary">{format(currentDate, 'EEEE')}</Typography>
                    </Box>
                    <IconButton onClick={() => setCurrentDate(d => addDays(d, 1))}><ChevronRight /></IconButton>
                </Paper>

                <Box sx={{ flex: 1, p: 1, overflow: 'hidden' }}>
                    <CalendarView
                        scheduledTasks={scheduledTasks}
                        onTaskSchedule={handleTaskSchedule}
                        onTaskCreate={handleCalendarTaskCreate}
                        onTaskUpdate={handleTaskUpdate}
                        selectedDate={currentDate}
                        onDateChange={setCurrentDate}
                    />
                </Box>
            </Box>
        );
    };

    const renderTodayView = () => {
        const isToday = isSameDay(currentDate, new Date());
        const todayTasks = tasks.filter(task => {
            if (!task.date) return false;
            const taskDate = typeof task.date === 'string' ? parseISO(task.date) : new Date(task.date);
            return isSameDay(taskDate, currentDate);
        });
        const activeTasks = todayTasks.filter(t => !t.completed);
        const completedTasks = todayTasks.filter(t => t.completed);

        return (
            <Box sx={{ pb: 10 }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <IconButton onClick={() => setCurrentDate(d => subDays(d, 1))}><ChevronLeft /></IconButton>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="800" color="primary">{isToday ? 'Today' : format(currentDate, 'EEEE')}</Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight="500">{format(currentDate, 'MMM d, yyyy')}</Typography>
                    </Box>
                    <IconButton onClick={() => setCurrentDate(d => addDays(d, 1))}><ChevronRight /></IconButton>
                </Box>
                <Box sx={{ px: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton onClick={handleLogout} size="small" sx={{ opacity: 0.7 }} aria-label="Logout"><Logout fontSize="small" /></IconButton>
                </Box>

                {/* Context: Weekly Focus */}
                {renderContextCard('Weekly Focus', todayWeekData?.focus, '#1976d2')}

                <List sx={{ px: 2 }}>
                    {activeTasks.map(task => (
                        <Paper key={task.id} elevation={0} sx={{ mb: 1.5, border: '1px solid #eee', borderRadius: 3, overflow: 'hidden' }}>
                            <ListItem secondaryAction={<IconButton edge="end" onClick={() => handleDeleteTask(task.id)}><Delete fontSize="small" sx={{ color: 'text.disabled' }} /></IconButton>} disablePadding>
                                <Checkbox edge="start" checked={task.completed} onChange={() => handleToggleComplete(task)} sx={{ py: 2 }} />
                                <ListItemText primary={task.name} primaryTypographyProps={{ fontWeight: 500 }} />
                            </ListItem>
                        </Paper>
                    ))}
                    {activeTasks.length === 0 && (
                        <Box sx={{ py: 6, textAlign: 'center', opacity: 0.6 }}>
                            <Typography variant="body2">No tasks using your energy {isToday ? 'today' : 'on this day'}.</Typography>
                            <Button size="small" sx={{ mt: 1 }} onClick={() => setOpenAddDialog(true)}>Add Task</Button>
                        </Box>
                    )}

                    {completedTasks.length > 0 && (
                        <>
                            <Box sx={{ mt: 3, mb: 1, display: 'flex', alignItems: 'center' }}>
                                <Divider sx={{ flexGrow: 1 }} />
                                <Typography variant="caption" sx={{ mx: 2, color: 'text.disabled' }}>COMPLETED</Typography>
                                <Divider sx={{ flexGrow: 1 }} />
                            </Box>
                            {completedTasks.map(task => (
                                <ListItem key={task.id} dense sx={{ opacity: 0.6, px: 0 }}>
                                    <Checkbox edge="start" checked={task.completed} onChange={() => handleToggleComplete(task)} size="small" />
                                    <ListItemText primary={task.name} sx={{ textDecoration: 'line-through' }} />
                                </ListItem>
                            ))}
                        </>
                    )}
                </List>
                <Fab color="primary" aria-label="add" onClick={() => setOpenAddDialog(true)}><Add /></Fab>
                <Box sx={{ textAlign: 'center', mt: 4, mb: 2, opacity: 0.4 }}><Typography variant="caption">v{packageJson.version}</Typography></Box>
            </Box>
        );
    };

    const renderWeeklyView = () => {
        const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const habit = weekData?.habit || { name: '', days: [] };
        const journal = weekData?.journal || { start: '', stop: '', continue: '', grateful: '' };

        return (
            <Box sx={{ pb: 10 }}>
                <Paper elevation={0} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10, borderRadius: 0 }}>
                    <IconButton onClick={() => setWeekDate(d => subWeeks(d, 1))}><ChevronLeft /></IconButton>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body1" fontWeight="700">Week {getISOWeek(weekDate)}</Typography>
                        <Typography variant="caption" color="text.secondary">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}</Typography>
                    </Box>
                    <IconButton onClick={() => setWeekDate(d => addWeeks(d, 1))}><ChevronRight /></IconButton>
                </Paper>

                {/* Context: Monthly Focus */}
                {renderContextCard('Monthly Focus', weekMonthData?.monthlyFocus, '#9c27b0')}

                <Box sx={{ px: 2 }}>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Typography variant="caption" color="primary" fontWeight="bold" sx={{ mb: 1, display: 'block' }}>WEEKLY FOCUS</Typography>
                        <TextField fullWidth multiline variant="standard" placeholder="What matters most this week?" value={weekData?.focus || ''} onChange={(e) => setWeekData({ ...weekData, focus: e.target.value })} InputProps={{ disableUnderline: true, style: { fontSize: '1.1rem', fontWeight: 500 } }} />
                    </Paper>

                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, fontSize: '1rem' }}>Weekly Goals</Typography>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        {(weekData?.goals || []).map((goal, idx) => (
                            <Box key={goal.id || idx} sx={{ display: 'flex', alignItems: 'center', mb: idx === (weekData?.goals || []).length - 1 ? 0 : 1.5, gap: 1 }}>
                                <Checkbox
                                    checked={goal.completed || false}
                                    onChange={() => {
                                        const newGoals = [...(weekData?.goals || [])];
                                        newGoals[idx] = { ...goal, completed: !goal.completed };
                                        setWeekData({ ...weekData, goals: newGoals });
                                    }}
                                    size="small"
                                    sx={{ p: 0, '&.Mui-checked': { color: '#38a169' } }}
                                />
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    placeholder="Goal..."
                                    value={goal.text || ''}
                                    onChange={(e) => {
                                        const newGoals = [...(weekData?.goals || [])];
                                        newGoals[idx] = { ...goal, text: e.target.value };
                                        setWeekData({ ...weekData, goals: newGoals });
                                    }}
                                    InputProps={{ disableUnderline: true, style: { fontSize: '0.95rem' } }}
                                    sx={{ textDecoration: goal.completed ? 'line-through' : 'none', opacity: goal.completed ? 0.6 : 1 }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        const newGoals = (weekData?.goals || []).filter((_, i) => i !== idx);
                                        setWeekData({ ...weekData, goals: newGoals });
                                    }}
                                    sx={{ opacity: 0.5 }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                        <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={() => {
                                const newGoal = { id: Date.now(), text: '', completed: false };
                                setWeekData({ ...weekData, goals: [...(weekData?.goals || []), newGoal] });
                            }}
                            sx={{ mt: (weekData?.goals || []).length > 0 ? 1.5 : 0, textTransform: 'none' }}
                        >
                            Add Goal
                        </Button>
                    </Paper>

                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, fontSize: '1rem' }}>Habit Tracker</Typography>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <TextField fullWidth variant="standard" placeholder="Habit to build..." value={habit.name || ''} onChange={(e) => setWeekData({ ...weekData, habit: { ...habit, name: e.target.value } })} InputProps={{ disableUnderline: true, style: { fontSize: '1rem', marginBottom: '12px' } }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                                <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ fontSize: '0.7rem' }}>{day}</Typography>
                                    <Checkbox checked={habit.days?.[idx] || false} onChange={() => { const newDays = [...(habit.days || [])]; newDays[idx] = !newDays[idx]; setWeekData({ ...weekData, habit: { ...habit, days: newDays } }); }} sx={{ p: 0, '&.Mui-checked': { color: '#38a169' } }} />
                                </Box>
                            ))}
                        </Box>
                    </Paper>

                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, fontSize: '1rem' }}>Reflection</Typography>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        {[{ label: "Start", key: 'start' }, { label: "Stop", key: 'stop' }, { label: "Continue", key: 'continue' }, { label: "Grateful", key: 'grateful' }].map((item, idx) => (
                            <Box key={item.key} sx={{ mb: idx === 3 ? 0 : 2 }}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block', fontSize: '0.7rem' }}>{item.label}</Typography>
                                <TextField fullWidth multiline variant="standard" placeholder="..." value={journal[item.key] || ''} onChange={(e) => setWeekData({ ...weekData, journal: { ...journal, [item.key]: e.target.value } })} InputProps={{ disableUnderline: true }} sx={{ bgcolor: '#f7fafc', p: 1, borderRadius: 1 }} />
                            </Box>
                        ))}
                    </Paper>

                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, fontSize: '1rem' }}>Daily Plan</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {days.map(day => {
                            const dateKey = format(day, 'yyyy-MM-dd'); const isToday = isSameDay(day, new Date());
                            return (
                                <Paper key={dateKey} sx={{ p: 2, borderRadius: 3, border: isToday ? '1px solid #1976d2' : '1px solid transparent', bgcolor: isToday ? 'rgba(25, 118, 210, 0.04)' : 'white' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="700" color={isToday ? 'primary' : 'text.primary'}>{format(day, 'EEEE')}</Typography>
                                        <Typography variant="caption" color="text.secondary">{format(day, 'MMM d')}</Typography>
                                    </Box>
                                    <TextField fullWidth multiline variant="standard" placeholder="Plan..." value={weekData?.days?.[dateKey] || ''} onChange={(e) => setWeekData({ ...weekData, days: { ...weekData.days, [dateKey]: e.target.value } })} InputProps={{ disableUnderline: true, style: { fontSize: '0.95rem' } }} />
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        );
    };

    const renderMonthlyView = () => {
        return (
            <Box sx={{ pb: 10 }}>
                <Paper elevation={0} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10, borderRadius: 0 }}>
                    <IconButton onClick={() => setMonthDate(d => subMonths(d, 1))}><ChevronLeft /></IconButton>
                    <Typography variant="h6" fontWeight="700">{format(monthDate, 'MMMM yyyy')}</Typography>
                    <IconButton onClick={() => setMonthDate(d => addMonths(d, 1))}><ChevronRight /></IconButton>
                </Paper>

                {/* Context: Year Focus */}
                {renderContextCard('Year Focus', monthYearData?.yearFocus, '#ed6c02')}

                <Box sx={{ px: 2 }}>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Typography variant="caption" color="secondary" fontWeight="bold" sx={{ mb: 1, display: 'block' }}>MONTHLY FOCUS</Typography>
                        <TextField fullWidth multiline minRows={2} variant="standard" placeholder="One major goal for this month..." value={monthData?.monthlyFocus || ''} onChange={(e) => setMonthData({ ...monthData, monthlyFocus: e.target.value })} InputProps={{ disableUnderline: true, style: { fontSize: '1.2rem', fontWeight: 500 } }} />
                    </Paper>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Notes & Ideas</Typography>
                        <TextField fullWidth multiline minRows={6} variant="standard" placeholder="Brain dump..." value={monthData?.notes || ''} onChange={(e) => setMonthData({ ...monthData, notes: e.target.value })} InputProps={{ disableUnderline: true }} />
                    </Paper>
                </Box>
            </Box>
        );
    };

    const renderJournalView = () => {
        const sections = [...new Set(prompts.map(p => p.section))];
        return (
            <Box sx={{ pb: 10 }}>
                <Paper elevation={0} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10, borderRadius: 0 }}>
                    <IconButton onClick={() => setJournalDate(d => subDays(d, 1))}><ChevronLeft /></IconButton>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body1" fontWeight="700">{format(journalDate, 'MMMM d')}</Typography>
                        <Typography variant="caption" color="text.secondary">{format(journalDate, 'EEEE')}</Typography>
                    </Box>
                    <IconButton onClick={() => setJournalDate(d => addDays(d, 1))}><ChevronRight /></IconButton>
                </Paper>
                <Box sx={{ px: 2 }}>
                    {sections.map(section => (
                        <Box key={section} sx={{ mb: 4 }}>
                            <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mb: 2, fontSize: '1rem', textTransform: 'uppercase' }}>{section}</Typography>
                            {getSectionDescription(section) && (
                                <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(25, 118, 210, 0.08)', borderRadius: 2, border: '1px solid rgba(25, 118, 210, 0.2)' }}>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.5 }}>
                                        {getSectionDescription(section)}
                                    </Typography>
                                </Paper>
                            )}
                            {prompts.filter(p => p.section === section).map(prompt => (
                                <Paper key={prompt.id} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
                                    <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>{prompt.text}</Typography>
                                    <TextField fullWidth multiline minRows={2} variant="standard" placeholder="Write here..." value={currentJournalEntry.responses?.[prompt.id] || ''} onChange={(e) => handleJournalResponseChange(prompt.id, e.target.value)} InputProps={{ disableUnderline: true, style: { fontSize: '0.95rem' } }} sx={{ bgcolor: '#f7fafc', p: 1, borderRadius: 1 }} />
                                </Paper>
                            ))}
                        </Box>
                    ))}
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, fontSize: '1rem' }}>Daily Notes</Typography>
                    <Paper sx={{ p: 2, mb: 4, borderRadius: 3 }}>
                        <TextField fullWidth multiline minRows={6} variant="standard" placeholder="Free flow notes..." value={currentJournalEntry.notes || ''} onChange={(e) => handleJournalNotesChange(e.target.value)} InputProps={{ disableUnderline: true }} />
                    </Paper>
                </Box>
            </Box>
        );
    };

    const [notesType, setNotesType] = useState('daily'); // 'daily' or 'general'

    const renderNotesView = () => {
        return (
            <Box sx={{ pb: 10, height: '100%' }}>
                <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10, borderRadius: 0, flexDirection: 'column', gap: 1 }}>
                    {/* Toggle between Daily and General */}
                    <ToggleButtonGroup
                        color="primary"
                        value={notesType}
                        exclusive
                        onChange={(e, newType) => { if (newType) setNotesType(newType); }}
                        aria-label="Notes Type"
                        size="small"
                        sx={{ width: '100%', mb: 1 }}
                    >
                        <ToggleButton value="daily" sx={{ flex: 1 }}>Daily</ToggleButton>
                        <ToggleButton value="general" sx={{ flex: 1 }}>General</ToggleButton>
                    </ToggleButtonGroup>

                    {notesType === 'daily' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <IconButton onClick={() => setNotesDate(d => subDays(d, 1))}><ChevronLeft /></IconButton>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body1" fontWeight="700">{format(notesDate, 'MMMM d')}</Typography>
                                <Typography variant="caption" color="text.secondary">{format(notesDate, 'EEEE')}</Typography>
                            </Box>
                            <IconButton onClick={() => setNotesDate(d => addDays(d, 1))}><ChevronRight /></IconButton>
                        </Box>
                    )}
                </Paper>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {notesType === 'daily' ? (
                        <NotesPanel
                            key={notesDate.toISOString()}
                            selectedDate={notesDate}
                            sx={{ height: 'calc(100vh - 190px)', border: 'none' }}
                        />
                    ) : (
                        <NotesPanel
                            customPath="planner/notes/general"
                            title="General Notes"
                            enableLock={true}
                            sx={{ height: 'calc(100vh - 140px)', border: 'none' }}
                        />
                    )}
                </Box>
            </Box>
        );
    };

    const renderSettingsView = () => {
        const isLoading = syncStatus === 'fetching' || syncStatus === 'pushing' || syncStatus === 'pulling' || syncStatus === 'restoring';

        const handleGitHubSync = () => {
            if (!ghToken || !ghOwner || !ghRepo) {
                alert('Please fill in all GitHub details');
                return;
            }
            // Credentials are already saved via auto-save effect
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

        return (
            <Box sx={{ pb: 10 }}>
                <Paper elevation={0} sx={{ p: 2, mb: 2, borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10, borderRadius: 0 }}>
                    <Typography variant="h6" fontWeight="700">Settings</Typography>
                </Paper>

                <Box sx={{ px: 2 }}>
                    {/* GitHub Sync Section */}
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, fontSize: '1rem' }}>GitHub Backup</Typography>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        {syncError && <Alert severity="error" sx={{ mb: 2 }}>{syncError}</Alert>}
                        {syncStatus === 'success' && <Alert severity="success" sx={{ mb: 2 }}>{syncProgress || 'Operation successful!'}</Alert>}

                        <TextField
                            fullWidth
                            label="Token"
                            type="password"
                            value={ghToken}
                            onChange={(e) => setGhToken(e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Owner"
                            value={ghOwner}
                            onChange={(e) => setGhOwner(e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Repository"
                            value={ghRepo}
                            onChange={(e) => setGhRepo(e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <GitHub />}
                                onClick={handleGitHubSync}
                                disabled={isLoading}
                            >
                                {isLoading ? syncProgress : 'Sync'}
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                color="warning"
                                startIcon={<Restore />}
                                onClick={() => setOpenRestoreDialog(true)}
                                disabled={isLoading}
                            >
                                Restore
                            </Button>
                        </Box>

                        {githubSettings.lastSyncTime && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center' }}>
                                Last synced: {new Date(githubSettings.lastSyncTime).toLocaleString()}
                            </Typography>
                        )}
                    </Paper>

                    {/* Hard Refresh Section */}
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, fontSize: '1rem' }}>App</Typography>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={handleHardRefresh}
                        >
                            Hard Refresh
                        </Button>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>
                            Reload app and clear cache
                        </Typography>
                    </Paper>

                    {/* Logout Section */}
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid rgba(211, 47, 47, 0.3)' }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            startIcon={<Logout />}
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </Paper>

                    {/* Customize Tabs Section */}
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5, fontSize: '1rem' }}>Customize Tabs</Typography>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Drag to reorder. The top 4 will be shown in the bottom bar.
                        </Typography>
                        <DragDropContext onDragEnd={(result) => {
                            if (!result.destination) return;
                            const items = Array.from(mobileTabOrder);
                            const [reorderedItem] = items.splice(result.source.index, 1);
                            items.splice(result.destination.index, 0, reorderedItem);
                            setMobileTabOrder(items);
                        }}>
                            <Droppable droppableId="tabs">
                                {(provided) => (
                                    <List {...provided.droppableProps} ref={provided.innerRef}>
                                        {mobileTabOrder.map((key, index) => (
                                            <Draggable key={key} draggableId={key} index={index}>
                                                {(provided) => (
                                                    <ListItem
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        secondaryAction={<DragIndicator sx={{ color: 'text.disabled' }} />}
                                                        sx={{
                                                            mb: 1,
                                                            bgcolor: 'background.paper',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            borderRadius: 2
                                                        }}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                                            {TAB_CONFIG[key].icon}
                                                        </ListItemIcon>
                                                        <ListItemText primary={TAB_CONFIG[key].label} />
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

                    <Box sx={{ textAlign: 'center', mt: 4, mb: 2, opacity: 0.4 }}>
                        <Typography variant="caption">v{packageJson.version}</Typography>
                    </Box>
                </Box>
            </Box>
        );
    };


    const renderContent = () => {
        if (!currentUser) {
            return (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                    <Typography variant="h5" gutterBottom fontWeight="bold">Flow Planner</Typography>
                    <Button variant="contained" startIcon={<GoogleIcon />} onClick={handleLogin} fullWidth sx={{ mt: 2 }}>Sign in with Google</Button>
                </Box>
            );
        }
        if (tasksLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;


        switch (activeTab) {
            case 'today': return renderTodayView();
            case 'schedule': return renderScheduleView();
            case 'weekly': return renderWeeklyView();
            case 'monthly': return renderMonthlyView();
            case 'journal': return renderJournalView();
            case 'notes': return renderNotesView();
            case 'settings': return renderSettingsView();
            default: return renderTodayView();
        }
    };

    // Calculate visible and hidden tabs
    const visibleTabs = mobileTabOrder.slice(0, 4);
    const hiddenTabs = mobileTabOrder.slice(4);
    const isOverflowActive = hiddenTabs.includes(activeTab);

    return (
        <ThemeProvider theme={mobileTheme}>
            <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {renderContent()}
                </Box>
                {currentUser && (
                    <>
                        <BottomNavigation
                            showLabels
                            value={isOverflowActive ? 'more' : activeTab}
                            onChange={(event, newValue) => {
                                if (newValue !== 'more') {
                                    setActiveTab(newValue);
                                }
                            }}
                            sx={{
                                borderTop: mobileTheme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                height: 65,
                                position: 'fixed',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                zIndex: 1000
                            }}
                        >
                            {visibleTabs.map(key => (
                                <BottomNavigationAction
                                    key={key}
                                    label={TAB_CONFIG[key].label}
                                    value={key}
                                    icon={TAB_CONFIG[key].icon}
                                />
                            ))}

                            {hiddenTabs.length > 0 && (
                                <BottomNavigationAction
                                    label="More"
                                    value="more"
                                    icon={<MoreHoriz />}
                                    onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                                />
                            )}
                        </BottomNavigation>

                        <Menu
                            anchorEl={moreMenuAnchor}
                            open={Boolean(moreMenuAnchor)}
                            onClose={() => setMoreMenuAnchor(null)}
                            PaperProps={{
                                style: {
                                    width: '200px',
                                },
                            }}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                        >
                            {hiddenTabs.map(key => (
                                <MenuItem
                                    key={key}
                                    onClick={() => { setActiveTab(key); setMoreMenuAnchor(null); }}
                                    selected={activeTab === key}
                                >
                                    <ListItemIcon fontSize="small">{TAB_CONFIG[key].icon}</ListItemIcon>
                                    <ListItemText>{TAB_CONFIG[key].label}</ListItemText>
                                </MenuItem>
                            ))}
                        </Menu>
                    </>
                )}
            </Box>

            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle>New Task(Today)</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="Task Name" fullWidth variant="outlined" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') handleAddTask(); }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddTask} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openRestoreDialog} onClose={() => setOpenRestoreDialog(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ color: 'warning.main' }}>Confirm Restore?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        This will download data from your GitHub repository and <strong style={{ color: 'red' }}>OVERWRITE</strong> your local data for matching dates.
                        <br /><br />
                        This is intended for disaster recovery. Are you sure you want to proceed?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRestoreDialog(false)}>Cancel</Button>
                    <Button onClick={() => {
                        setOpenRestoreDialog(false);
                        if (!ghToken || !ghOwner || !ghRepo) {
                            alert('Please fill in all GitHub details');
                            return;
                        }
                        restoreFromGitHub(ghToken, ghOwner, ghRepo);
                    }} color="warning" autoFocus>
                        Yes, Restore Data
                    </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
}

export default MobileApp;
