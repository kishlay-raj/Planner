import React, { useState } from 'react';
import { Box, Typography, ThemeProvider, createTheme, BottomNavigation, BottomNavigationAction, Paper, Fab, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, List, ListItem, ListItemText, Checkbox, IconButton, CircularProgress, Divider } from '@mui/material';
import { FormatListBulleted, Add, Delete, ChevronLeft, ChevronRight, ViewWeek, CalendarViewMonth, MenuBook, Logout } from '@mui/icons-material';
import packageJson from '../../package.json';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCollection, useFirestoreDoc } from '../hooks/useFirestoreNew';
import { useFirestore } from '../hooks/useFirestore';
import GoogleIcon from '@mui/icons-material/Google';
import { format, addDays, subDays, isSameDay, parseISO, startOfWeek, endOfWeek, getISOWeek, getYear, getMonth, addWeeks, subWeeks, addMonths, subMonths, eachDayOfInterval } from 'date-fns';

const mobileTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        secondary: { main: '#9c27b0' },
        background: { default: '#f0f2f5', paper: '#ffffff' },
    },
    components: {
        MuiBottomNavigation: {
            styleOverrides: {
                root: {
                    height: 65,
                    borderTop: '1px solid rgba(0,0,0,0.05)',
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
});

const DEFAULT_MOBILE_PROMPTS = [
    { id: '1', section: 'Morning', text: 'Who is the person I want to become today?' },
    { id: '2', section: 'Morning', text: 'The "Big Rock": What is the one thing I must accomplish today?' },
    { id: '15', section: 'Evening', text: 'Review: What is one system I can tweak to make tomorrow 1% easier?' },
    { id: '16', section: 'Evening', text: '3 Amazing things that happened today.' }
];

function MobileApp() {
    const { currentUser, loginWithGoogle, logout } = useAuth();
    const [value, setValue] = useState(0);

    // Global State
    const [tasks, addTask, updateTask, deleteTask, tasksLoading] = useFirestoreCollection('tasks/active', 'createdAt');
    const [currentDate, setCurrentDate] = useState(new Date()); // State for Today view navigation if we add it later

    // Task Dialog State
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');

    // --- NAVIGATION DATES ---
    const [weekDate, setWeekDate] = useState(new Date());
    const [monthDate, setMonthDate] = useState(new Date());
    const [journalDate, setJournalDate] = useState(new Date());

    // --- IDS ---
    const weekId = `${getYear(weekDate)}-${getISOWeek(weekDate)}`;
    const monthId = `${getYear(monthDate)}-${getMonth(monthDate) + 1}`;

    // Context IDs (Cascading)
    const todayWeekId = `${getYear(new Date())}-${getISOWeek(new Date())}`; // For Today View Context
    const weekMonthId = `${getYear(weekDate)}-${getMonth(weekDate) + 1}`; // For Weekly View Context
    const monthYearId = `${getYear(monthDate)}`; // For Monthly View Context

    // --- DATA HOOKS ---

    // 1. Weekly Data (Active Editing)
    const [weekData, setWeekData] = useFirestoreDoc(`planner/weekly/${weekId}`, {
        focus: '',
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
    const [prompts] = useFirestore('journalPrompts', DEFAULT_MOBILE_PROMPTS);
    const [journalData, setJournalData] = useFirestore('dailyJournalData', {});
    const currentJournalEntry = journalData[journalDateKey] || { responses: {}, notes: '' };

    // --- HANDLERS ---

    const handleLogin = async () => { try { await loginWithGoogle(); } catch (e) { console.error(e); } };
    const handleLogout = async () => { try { await logout(); } catch (e) { console.error(e); } };

    const handleAddTask = async () => {
        if (!newTaskName.trim()) return;
        await addTask({
            name: newTaskName, completed: false, createdAt: Date.now(), priority: 'P4',
            date: new Date().toISOString(), isToday: true
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

    // --- RENDER HELPERS ---

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

    const renderTodayView = () => {
        const todayTasks = tasks.filter(task => {
            if (!task.date) return false;
            const taskDate = typeof task.date === 'string' ? parseISO(task.date) : new Date(task.date);
            return isSameDay(taskDate, new Date());
        });
        const activeTasks = todayTasks.filter(t => !t.completed);
        const completedTasks = todayTasks.filter(t => t.completed);

        return (
            <Box sx={{ pb: 10 }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h5" fontWeight="800" color="primary">Today</Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight="500">{format(new Date(), 'EEE, MMM d')}</Typography>
                    </Box>
                    <IconButton onClick={handleLogout} size="small" sx={{ opacity: 0.7 }}><Logout fontSize="small" /></IconButton>
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
                            <Typography variant="body2">No tasks using your energy today.</Typography>
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
        switch (value) {
            case 0: return renderTodayView();
            case 1: return renderWeeklyView();
            case 2: return renderMonthlyView();
            case 3: return renderJournalView();
            default: return null;
        }
    };

    return (
        <ThemeProvider theme={mobileTheme}>
            <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {renderContent()}
                </Box>
                {currentUser && (
                    <BottomNavigation showLabels value={value} onChange={(event, newValue) => setValue(newValue)}>
                        <BottomNavigationAction label="Today" icon={<FormatListBulleted />} />
                        <BottomNavigationAction label="Weekly" icon={<ViewWeek />} />
                        <BottomNavigationAction label="Monthly" icon={<CalendarViewMonth />} />
                        <BottomNavigationAction label="Journal" icon={<MenuBook />} />
                    </BottomNavigation>
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
        </ThemeProvider>
    );
}

export default MobileApp;
