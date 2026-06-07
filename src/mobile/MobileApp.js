import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, ThemeProvider, createTheme, BottomNavigation, BottomNavigationAction, Paper, Fab, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, List, ListItem, ListItemText, Checkbox, IconButton, CircularProgress, Divider, Alert, ToggleButton, ToggleButtonGroup, Menu, MenuItem, ListItemIcon, Collapse, Switch, Chip } from '@mui/material';
import { FormatListBulleted, Add, Delete, ChevronLeft, ChevronRight, ViewWeek, CalendarViewMonth, MenuBook, Logout, EditNote, Settings as SettingsIcon, GitHub, Refresh, Restore, CalendarToday, MoreHoriz, DragIndicator, ExpandMore, ExpandLess, TrendingUp, Favorite, RocketLaunch, WarningAmber, Visibility, VisibilityOff, Timer } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import NotesPanel from '../components/NotesPanel';
import CalendarView from '../components/CalendarView';
import AntiGravityHabitTracker from '../components/AntiGravityHabitTracker';
import MistakesJournal from '../components/MistakesJournal';
import WeeklyPlanner from '../components/WeeklyPlanner';
import packageJson from '../../package.json';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCollection, useFirestoreDoc } from '../hooks/useFirestoreNew';
import { useFirestore } from '../hooks/useFirestore';
import { useGitHubSync } from '../hooks/useGitHubSync';
import GoogleIcon from '@mui/icons-material/Google';
import { format, addDays, subDays, isSameDay, parseISO, startOfWeek, endOfWeek, getISOWeek, getYear, getMonth, addWeeks, subWeeks, addMonths, subMonths, eachDayOfInterval } from 'date-fns';



// ── Self-contained Drum Picker for Mobile Pomodoro ────────────────────────────
function MobileDrumColumn({ value, min, max, onChange, disabled }) {
    const ITEM_H = 72;
    const startY = React.useRef(null);
    const startVal = React.useRef(value);
    const handleTouchStart = (e) => {
        if (disabled) return;
        e.preventDefault();
        startY.current = e.touches[0].clientY;
        startVal.current = value;
    };
    const handleTouchMove = (e) => {
        if (disabled || startY.current === null) return;
        e.preventDefault();
        const dy = startY.current - e.touches[0].clientY;
        const delta = Math.round(dy / (ITEM_H * 0.6));
        const next = Math.max(min, Math.min(max, startVal.current + delta));
        if (next !== value) onChange(next);
    };
    const handleTouchEnd = () => { startY.current = null; };
    const handleWheel = (e) => {
        if (disabled) return;
        e.preventDefault();
        onChange(Math.max(min, Math.min(max, value + (e.deltaY > 0 ? 1 : -1))));
    };
    const prev = Math.max(min, value - 1);
    const next = Math.min(max, value + 1);
    return (
        <Box onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onWheel={handleWheel}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: disabled ? 'default' : 'ns-resize', userSelect: 'none', touchAction: 'none', position: 'relative', height: `${ITEM_H * 3}px`, overflow: 'hidden', width: 90 }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', top: ITEM_H, left: 4, right: 4, height: ITEM_H, border: '2px solid rgba(255,255,255,0.5)', borderRadius: 2, zIndex: 1, pointerEvents: 'none' }} />
            <Box sx={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <Typography sx={{ fontSize: '2.6rem', fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>{String(prev).padStart(2, '0')}</Typography>
            </Box>
            <Box sx={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '3.8rem', fontFamily: 'monospace', fontWeight: 900, color: 'white', lineHeight: 1 }}>{String(value).padStart(2, '0')}</Typography>
            </Box>
            <Box sx={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <Typography sx={{ fontSize: '2.6rem', fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>{String(next).padStart(2, '0')}</Typography>
            </Box>
        </Box>
    );
}

function MobileScrollTimePicker({ timeLeft, isActive, onMinuteChange }) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    {!isActive && (
                        <IconButton
                            onClick={() => onMinuteChange(Math.min(90, minutes + 5))}
                            sx={{
                                color: 'white',
                                bgcolor: 'rgba(255,255,255,0.12)',
                                borderRadius: 2,
                                width: 44,
                                height: 32,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                p: 0,
                                '&:active': { bgcolor: 'rgba(255,255,255,0.25)' }
                            }}
                        >▲</IconButton>
                    )}
                    <MobileDrumColumn value={minutes} min={1} max={90} onChange={onMinuteChange} disabled={isActive} />
                    {!isActive && (
                        <IconButton
                            onClick={() => onMinuteChange(Math.max(1, minutes - 5))}
                            sx={{
                                color: 'white',
                                bgcolor: 'rgba(255,255,255,0.12)',
                                borderRadius: 2,
                                width: 44,
                                height: 32,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                p: 0,
                                '&:active': { bgcolor: 'rgba(255,255,255,0.25)' }
                            }}
                        >▼</IconButton>
                    )}
                </Box>
                <Typography sx={{ fontSize: '3.8rem', fontWeight: 900, fontFamily: 'monospace', color: 'white', opacity: 0.7, lineHeight: 1, mb: 0.5 }}>:</Typography>
                <MobileDrumColumn value={seconds} min={0} max={59} onChange={() => {}} disabled={true} />
            </Box>
            {!isActive && (
                <Typography sx={{ mt: 1.5, fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    swipe or use ▲ ▼ to set time
                </Typography>
            )}
        </Box>
    );
}

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
    // Growth Section
    { id: 'growth-1', section: 'Growth', text: 'Comfort Zone: Did I come out of my comfort zone? Give instance.' },
    { id: 'growth-2', section: 'Growth', text: 'Loving Action: DSN mode (Do Something Now) / Yes Mind. Give instance.' },
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
    'anti-gravity': { label: 'Habit', icon: <RocketLaunch /> },
    journal: { label: 'Journal', icon: <MenuBook /> },
    gratitude: { label: 'Gratitude', icon: <Favorite /> },
    mistakes: { label: 'Mistakes', icon: <WarningAmber /> },
    notes: { label: 'Notes', icon: <EditNote /> },
    pomodoro: { label: 'Pomodoro', icon: <Timer /> },
    settings: { label: 'Settings', icon: <SettingsIcon /> }
};

function MobileApp() {
    const { currentUser, loginWithGoogle, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('today');
    const [mobileTabOrder, setMobileTabOrder, orderLoading] = useFirestore('mobileTabOrder', ['today', 'schedule', 'weekly', 'monthly', 'anti-gravity', 'journal', 'gratitude', 'mistakes', 'notes', 'settings']);
    const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);

    // Migration: ensure existing users get new tabs (gratitude, anti-gravity)
    useEffect(() => {
        if (!orderLoading && mobileTabOrder) {
            let updated = false;
            let newOrder = [...mobileTabOrder];

            if (!newOrder.includes('gratitude')) {
                const journalIndex = newOrder.indexOf('journal');
                if (journalIndex !== -1) {
                    newOrder.splice(journalIndex + 1, 0, 'gratitude');
                } else {
                    newOrder.push('gratitude');
                }
                updated = true;
            }

            if (!newOrder.includes('anti-gravity')) {
                const monthlyIndex = newOrder.indexOf('monthly');
                if (monthlyIndex !== -1) {
                    newOrder.splice(monthlyIndex + 1, 0, 'anti-gravity');
                } else {
                    newOrder.push('anti-gravity');
                }
                updated = true;
            }

            if (!newOrder.includes('mistakes')) {
                const notesIndex = newOrder.indexOf('notes');
                if (notesIndex !== -1) {
                    newOrder.splice(notesIndex, 0, 'mistakes');
                } else {
                    newOrder.push('mistakes');
                }
                updated = true;
            }

            if (!newOrder.includes('pomodoro')) {
                const settingsIndex = newOrder.indexOf('settings');
                if (settingsIndex !== -1) {
                    newOrder.splice(settingsIndex, 0, 'pomodoro');
                } else {
                    newOrder.push('pomodoro');
                }
                updated = true;
            }

            if (updated) {
                setMobileTabOrder(newOrder);
            }
        }
    }, [mobileTabOrder, orderLoading, setMobileTabOrder]);

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
    const [monthDate, setMonthDate] = useState(new Date());
    const [journalDate, setJournalDate] = useState(new Date());
    const [gratitudeDate, setGratitudeDate] = useState(new Date());
    const [notesDate, setNotesDate] = useState(new Date());
    const monthId = `${getYear(monthDate)}-${getMonth(monthDate) + 1}`;

    // Context IDs (Cascading)
    const todayWeekId = `${getYear(currentDate)}-${getISOWeek(currentDate)}`; // For Today View Context
    const weekMonthId = `${getYear(monthDate)}-${getMonth(monthDate) + 1}`; // For Weekly View Context
    const monthYearId = `${getYear(monthDate)}`; // For Monthly View Context

    // --- DATA HOOKS ---

    // 2. Monthly Data (Active Editing)
    const [monthData, setMonthData] = useFirestoreDoc(`planner/monthly/${monthId}`, { monthlyFocus: '', notes: '' });

    // 3. Context Data (Read Only for Cascading Display)
    const [todayWeekData] = useFirestoreDoc(`planner/weekly/${todayWeekId}`, { focus: '' }); // Context for Today View
    const [weekMonthData] = useFirestoreDoc(`planner/monthly/${weekMonthId}`, { monthlyFocus: '' }); // Context for Weekly View
    const [monthYearData] = useFirestoreDoc(`planner/yearly/${monthYearId}`, { yearFocus: '' }); // Context for Monthly View


    // Journal Data
    const journalDateKey = format(journalDate, 'yyyy-MM-dd');
    const [prompts, setPrompts, loadingPrompts] = useFirestore('journalPrompts', MOBILE_JOURNAL_PROMPTS);
    const [journalData, setJournalData] = useFirestore('dailyJournalData', {});

    // Migration & Deduplication for Mobile prompts
    useEffect(() => {
        if (loadingPrompts) return;

        setPrompts(currentPrompts => {
            let updatedPrompts = [...currentPrompts];
            let changed = false;

            // 1. Add missing prompts by ID
            const existingIds = new Set(updatedPrompts.map(p => p.id));
            const newDefaults = MOBILE_JOURNAL_PROMPTS.filter(dp => !existingIds.has(dp.id));

            if (newDefaults.length > 0) {
                updatedPrompts = [...updatedPrompts, ...newDefaults];
                changed = true;
            }

            // 2. Remove duplicates
            const unique = [];
            const seen = new Set();
            for (const p of updatedPrompts) {
                if (!seen.has(p.text)) {
                    seen.add(p.text);
                    unique.push(p);
                } else {
                    changed = true;
                }
            }

            return changed ? unique : currentPrompts;
        });
    }, [loadingPrompts]);
    const currentJournalEntry = journalData[journalDateKey] || { responses: {}, notes: '' };

    // Gratitude Data
    const gratitudeDateKey = format(gratitudeDate, 'yyyy-MM-dd');
    const [gratitudeData, setGratitudeData] = useFirestore('gratitudeJournalData', {});
    const currentGratitudeEntry = gratitudeData[gratitudeDateKey] || { item1: '', item2: '', item3: '', notes: '' };

    // --- COLLAPSIBLE SECTIONS STATE ---
    const [collapsedSections, setCollapsedSections] = useState([]);

    // --- JOURNAL SETTINGS STATE ---
    const [disabledSections, setDisabledSections] = useFirestore('journalDisabledSections', []);
    const [disabledPrompts, setDisabledPrompts] = useFirestore('journalDisabledPrompts', []);
    const [defaultCollapsedSections, setDefaultCollapsedSections] = useFirestore('journalDefaultCollapsedSections', []);
    const [openJournalSettings, setOpenJournalSettings] = useState(false);
    const [expandedSettingsSection, setExpandedSettingsSection] = useState(null);
    const [addQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false);
    const [newQuestionCategory, setNewQuestionCategory] = useState('');
    const [newQuestionText, setNewQuestionText] = useState('');
    const [journalManageMode, setJournalManageMode] = useState(false);

    const handleAddQuestion = () => {
        if (!newQuestionText.trim()) return;
        const newPrompt = {
            id: 'user-' + Date.now().toString(),
            section: newQuestionCategory,
            text: newQuestionText.trim()
        };
        setPrompts([...prompts, newPrompt]);
        setNewQuestionText('');
        setAddQuestionDialogOpen(false);
    };

    const handleRemoveQuestion = (promptId) => {
        if (window.confirm('Are you sure you want to remove this question?')) {
            setPrompts(prompts.filter(p => p.id !== promptId));
            setDisabledPrompts(prev => prev.filter(id => id !== promptId));
        }
    };

    const handleTogglePrompt = (promptId) => {
        setDisabledPrompts(prev =>
            prev.includes(promptId) ? prev.filter(id => id !== promptId) : [...prev, promptId]
        );
    };

    const handleToggleJournalSection = (section) => {
        setDisabledSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const handleToggleDefaultCollapse = (section) => {
        setDefaultCollapsedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    // Auto-collapse Morning section logic + Apply User Defaults
    useEffect(() => {
        const todayRes = new Date();
        todayRes.setHours(0, 0, 0, 0);

        const journalDateStart = new Date(journalDate);
        journalDateStart.setHours(0, 0, 0, 0);

        const isPastDate = journalDateStart < todayRes;
        const isToday = journalDateStart.getTime() === todayRes.getTime();
        const currentHour = new Date().getHours();

        setCollapsedSections(prev => {
            // Start with user-defined defaults
            let newCollapsed = [...defaultCollapsedSections];

            // Add automatic Morning collapse logic (if not already there)
            if (isPastDate || (isToday && currentHour >= 15)) {
                if (!newCollapsed.includes('Morning')) {
                    newCollapsed.push('Morning');
                }
            }
            return newCollapsed;
        });
    }, [journalDate, defaultCollapsedSections]);

    const handleToggleCollapse = (section) => {
        setCollapsedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

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
            case 'Growth':
                return "Growth happens when you step specifically outside your boundaries. Loving Action is breaking the inertia.";
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

        // Map Pomodoro sessions to calendar events
        const pomodoroEvents = mSessionHistory.map(session => {
            const endTime = new Date(session.timestamp);
            const startTime = new Date(endTime.getTime() - session.duration * 60000);
            
            let taskName = session.workType === 'deep' ? 'Deep Work' : 'Shallow Work';
            if (session.primaryTask || session.secondaryTask) {
                const parts = [];
                if (session.primaryTask) parts.push(session.primaryTask);
                if (session.secondaryTask) parts.push(session.secondaryTask);
                taskName = parts.join(' / ');
            }

            return {
                id: `pomodoro-${session.id}`,
                name: `🍅 ${taskName}`,
                duration: session.duration,
                scheduledTime: startTime.toISOString(),
                completed: true,
                isPomodoro: true,
                notes: session.notes
            };
        });

        const allScheduledEvents = [...scheduledTasks, ...pomodoroEvents];

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
                        scheduledTasks={allScheduledEvents}
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
        return <WeeklyPlanner />;
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
        const allSections = [...new Set(prompts.map(p => p.section))];
        const sections = allSections.filter(s => !disabledSections.includes(s));
        return (
            <Box sx={{ pb: 10 }}>
                <Paper elevation={0} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10, borderRadius: 0 }}>
                    <IconButton onClick={() => setJournalDate(d => subDays(d, 1))}><ChevronLeft /></IconButton>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body1" fontWeight="700">{format(journalDate, 'MMMM d')}</Typography>
                        <Typography variant="caption" color="text.secondary">{format(journalDate, 'EEEE')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                        <IconButton onClick={() => setJournalDate(d => addDays(d, 1))}><ChevronRight /></IconButton>
                        <IconButton onClick={() => setOpenJournalSettings(true)}><SettingsIcon fontSize="small" /></IconButton>
                    </Box>
                </Paper>
                <Box sx={{ px: 2 }}>
                    {sections.map(section => {
                        const isCollapsed = collapsedSections.includes(section);
                        const visiblePrompts = prompts.filter(p => p.section === section && !disabledPrompts.includes(p.id));
                        return (
                            <Box key={section} sx={{ mb: 2 }}>
                                <Box
                                    onClick={() => handleToggleCollapse(section)}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 1,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Typography variant="h6" fontWeight="bold" color="primary" sx={{ fontSize: '1rem', textTransform: 'uppercase' }}>
                                        {section}
                                    </Typography>
                                    <IconButton size="small">
                                        {isCollapsed ? <ExpandMore /> : <ExpandLess />}
                                    </IconButton>
                                </Box>
                                <Collapse in={!isCollapsed}>
                                    {getSectionDescription(section) && (
                                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(25, 118, 210, 0.08)', borderRadius: 2, border: '1px solid rgba(25, 118, 210, 0.2)' }}>
                                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.5 }}>
                                                {getSectionDescription(section)}
                                            </Typography>
                                        </Paper>
                                    )}
                                    {visiblePrompts.map(prompt => (
                                        <Paper key={prompt.id} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
                                            <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>{prompt.text}</Typography>
                                            <TextField fullWidth multiline minRows={2} variant="standard" placeholder="Write here..." value={currentJournalEntry.responses?.[prompt.id] || ''} onChange={(e) => handleJournalResponseChange(prompt.id, e.target.value)} InputProps={{ disableUnderline: true, style: { fontSize: '0.95rem' } }} sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1 }} />
                                        </Paper>
                                    ))}
                                </Collapse>
                            </Box>
                        );
                    })}
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, fontSize: '1rem' }}>Daily Notes</Typography>
                    <Paper sx={{ p: 2, mb: 4, borderRadius: 3 }}>
                        <TextField fullWidth multiline minRows={6} variant="standard" placeholder="Free flow notes..." value={currentJournalEntry.notes || ''} onChange={(e) => handleJournalNotesChange(e.target.value)} InputProps={{ disableUnderline: true }} />
                    </Paper>
                </Box>
            </Box>
        );
    };

    const renderGratitudeView = () => {
        return (
            <Box sx={{ pb: 10 }}>
                <Paper elevation={0} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10, borderRadius: 0 }}>
                    <IconButton onClick={() => setGratitudeDate(d => subDays(d, 1))}><ChevronLeft /></IconButton>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body1" fontWeight="700">{format(gratitudeDate, 'MMMM d')}</Typography>
                        <Typography variant="caption" color="text.secondary">{format(gratitudeDate, 'EEEE')}</Typography>
                    </Box>
                    <IconButton onClick={() => setGratitudeDate(d => addDays(d, 1))}><ChevronRight /></IconButton>
                </Paper>
                <Box sx={{ px: 2 }}>
                    <Typography variant="subtitle1" fontWeight="600" color="text.secondary" sx={{ mb: 3 }}>
                        Before you sleep, shift your focus. Remember your achievements and the good things that happened today.
                    </Typography>

                    {[
                        { id: 'item1', label: '1. What is something you achieved today, big or small?', placeholder: 'I finally finished...' },
                        { id: 'item2', label: '2. What is a good moment or positive thing that happened?', placeholder: 'I really enjoyed...' },
                        { id: 'item3', label: '3. What is something you are deeply grateful for right now?', placeholder: 'I am grateful for...' }
                    ].map((item) => (
                        <Box key={item.id} sx={{ mb: 3 }}>
                            <Typography variant="body2" fontWeight="600" sx={{ mb: 1, color: 'text.primary', lineHeight: 1.4 }}>{item.label}</Typography>
                            <Paper sx={{ p: 2, borderRadius: 3 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    variant="standard"
                                    placeholder={item.placeholder}
                                    value={currentGratitudeEntry[item.id] || ''}
                                    onChange={(e) => {
                                        setGratitudeData(prev => ({
                                            ...prev,
                                            [gratitudeDateKey]: {
                                                ...currentGratitudeEntry,
                                                [item.id]: e.target.value
                                            }
                                        }));
                                    }}
                                    InputProps={{ disableUnderline: true, style: { fontSize: '1.05rem' } }}
                                    sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1 }}
                                />
                            </Paper>
                        </Box>
                    ))}

                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, mt: 4, fontSize: '1rem' }}>Additional Notes</Typography>
                    <Paper sx={{ p: 2, mb: 4, borderRadius: 3 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            variant="standard"
                            placeholder="Anything else?"
                            value={currentGratitudeEntry.notes || ''}
                            onChange={(e) => {
                                setGratitudeData(prev => ({
                                    ...prev,
                                    [gratitudeDateKey]: {
                                        ...currentGratitudeEntry,
                                        notes: e.target.value
                                    }
                                }));
                            }}
                            InputProps={{ disableUnderline: true }}
                        />
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


    const renderAntiGravityView = () => {
        return <AntiGravityHabitTracker />;
    };

    // --- MOBILE POMODORO STATE ---
    const [mPrimaryTask, setMPrimaryTask] = useFirestore('pomodoroPrimaryTask', '');
    const [mSecondaryTask, setMSecondaryTask] = useFirestore('pomodoroSecondaryTask', '');
    const [mEditingTasks, setMEditingTasks] = useState(false);
    const [mLocalPrimary, setMLocalPrimary] = useState('');
    const [mLocalSecondary, setMLocalSecondary] = useState('');
    const [mTimeLeft, setMTimeLeft] = useState(25 * 60);
    const [mIsActive, setMIsActive] = useState(false);
    const [mMode, setMMode] = useState('pomodoro');
    const [mCycles, setMCycles] = useState(0);
    const [mNotifPermission, setMNotifPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
    );
    const mPomodoroSettings = { pomodoro: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
    const mModeColors = { pomodoro: '#b74b4b', shortBreak: '#4c9195', longBreak: '#457ca3' };
    const [mPomodoroStats] = useFirestore('pomodoroStats', { total: 0, today: 0, lastDate: new Date().toDateString() });
    const [mSessionHistory, setMSessionHistory] = useFirestore('pomodoroSessionHistory', []);
    const [mVibrateOnEnd, setMVibrateOnEnd] = useFirestore('pomodoroVibrateOnEnd', true);

    const mRequestNotifPermission = async () => {
        if (typeof Notification === 'undefined') return;
        const result = await Notification.requestPermission();
        setMNotifPermission(result);
    };

    const mFireNotification = (title, body, icon = '/icon-192.png') => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

        // Always prefer SW showNotification — required for iOS PWA, also works on Android
        if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, {
                    body,
                    icon,
                    badge: '/icon-192.png',
                    vibrate: [200, 100, 200],
                    tag: 'pomodoro-alert',       // replaces previous notification instead of stacking
                    renotify: true,              // vibrate even if same tag
                    requireInteraction: false,
                });
            }).catch(() => {
                // Final fallback for desktop browsers without SW
                try { new Notification(title, { body, icon }); } catch (_) {}
            });
        } else {
            // Desktop fallback
            try { new Notification(title, { body, icon }); } catch (_) {}
        }
    };

    useEffect(() => {
        setMLocalPrimary(mPrimaryTask || '');
        setMLocalSecondary(mSecondaryTask || '');
    }, [mPrimaryTask, mSecondaryTask]);

    const mEarlyCompleteElapsedRef = React.useRef(null);
    const mHandleCompleteEarly = () => {
        const expectedTime = mMode === 'pomodoro' ? mPomodoroSettings.pomodoro * 60 : (mMode === 'shortBreak' ? mPomodoroSettings.shortBreak * 60 : mPomodoroSettings.longBreak * 60);
        const elapsedMinutes = Math.max(1, Math.round((expectedTime - Math.max(0, mTimeLeft)) / 60));
        if (elapsedMinutes < mPomodoroSettings.pomodoro && mMode === 'pomodoro') {
            mEarlyCompleteElapsedRef.current = elapsedMinutes;
        }

        if (mMode === 'pomodoro' && mPrimaryTask) {
            const taskToComplete = tasks.find(t => !t.completed && t.name.trim().toLowerCase() === mPrimaryTask.trim().toLowerCase());
            if (taskToComplete) {
                updateTask(taskToComplete.id.toString(), { completed: true });
            }
        }
        setMTimeLeft(0);
    };

    useEffect(() => {
        let interval = null;
        if (mIsActive && mTimeLeft > 0) {
            interval = setInterval(() => setMTimeLeft(t => t - 1), 1000);
        } else if (mTimeLeft === 0) {
            setMCycles(c => c + 1);

            if (mMode === 'pomodoro') {
                const actualDuration = mEarlyCompleteElapsedRef.current !== null ? mEarlyCompleteElapsedRef.current : mPomodoroSettings.pomodoro;
                const notePrefix = mEarlyCompleteElapsedRef.current !== null ? "(Completed early) " : "";
                const session = {
                    id: Date.now(),
                    workType: 'deep', // Default for mobile
                    duration: actualDuration,
                    timestamp: new Date().toISOString(),
                    date: new Date().toDateString(),
                    primaryTask: mPrimaryTask,
                    secondaryTask: mSecondaryTask,
                    notes: mEarlyCompleteElapsedRef.current !== null ? "Completed early" : ""
                };
                setMSessionHistory(prev => [...prev, session]);
                mEarlyCompleteElapsedRef.current = null;

                if ((mCycles + 1) >= mPomodoroSettings.longBreakInterval) {
                    setMMode('longBreak');
                    setMTimeLeft(mPomodoroSettings.longBreak * 60);
                    setMCycles(0);
                    mFireNotification(
                        '🎉 Pomodoro Complete!',
                        `Time for a long break (${mPomodoroSettings.longBreak} min). Great work!`
                    );
                } else {
                    setMMode('shortBreak');
                    setMTimeLeft(mPomodoroSettings.shortBreak * 60);
                    mFireNotification(
                        '✅ Focus Session Done!',
                        `Take a short break (${mPomodoroSettings.shortBreak} min). You earned it!`
                    );
                }
            } else {
                setMMode('pomodoro');
                setMTimeLeft(mPomodoroSettings.pomodoro * 60);
                mFireNotification(
                    '⏰ Break Over!',
                    'Time to focus again. Let\'s go!'
                );
            }
            setMIsActive(false);
            // Vibrate on session end if enabled and supported
            if (mVibrateOnEnd && navigator.vibrate) {
                navigator.vibrate([300, 100, 300, 100, 600]);
            }
        }
        return () => clearInterval(interval);
    }, [mIsActive, mTimeLeft, mMode, mCycles]);

    // ── Live Ongoing Notification (updates every minute while active) ──────────
    const mMinutesLeft = Math.floor(mTimeLeft / 60);
    useEffect(() => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        if (!navigator.serviceWorker) return;

        if (!mIsActive) {
            // Dismiss the live notification when the timer is paused / stopped
            navigator.serviceWorker.ready.then(reg => {
                reg.getNotifications({ tag: 'pomodoro-live' })
                    .then(notes => notes.forEach(n => n.close()))
                    .catch(() => {});
            }).catch(() => {});
            return;
        }

        const modeLabel = mMode === 'pomodoro' ? '🍅 Focus' : mMode === 'shortBreak' ? '☕ Short Break' : '🌿 Long Break';
        const secs = mTimeLeft % 60;
        const timeStr = `${mMinutesLeft}:${String(secs).padStart(2, '0')}`;
        const bodyText = mMode === 'pomodoro'
            ? `Stay locked in — ${mMinutesLeft} min remaining`
            : `Rest up — ${mMinutesLeft} min left`;

        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(`${modeLabel}  ${timeStr}`, {
                body: bodyText,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: 'pomodoro-live',   // same tag = replaces old one, no stacking
                renotify: false,         // no sound/vibration on each update
                silent: true,
                requireInteraction: false,
            });
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mIsActive, mMinutesLeft, mMode]);

    const mHandleModeChange = (newMode) => {
        setMMode(newMode);
        setMIsActive(false);
        if (newMode === 'pomodoro') setMTimeLeft(mPomodoroSettings.pomodoro * 60);
        else if (newMode === 'shortBreak') setMTimeLeft(mPomodoroSettings.shortBreak * 60);
        else setMTimeLeft(mPomodoroSettings.longBreak * 60);
    };

    const mSaveTasks = () => {
        setMPrimaryTask(mLocalPrimary);
        setMSecondaryTask(mLocalSecondary);
        setMEditingTasks(false);
    };

    const mHandleMinuteChange = (newMin) => {
        if (mIsActive) return;
        setMTimeLeft(newMin * 60);
    };

    const renderPomodoroView = () => {
        const bgColor = mModeColors[mMode];
        const mins = Math.floor(mTimeLeft / 60).toString().padStart(2, '0');
        const secs = (mTimeLeft % 60).toString().padStart(2, '0');
        return (
            <Box sx={{ pb: 10, minHeight: '100vh', bgcolor: bgColor, color: 'white', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: 1 }}>Pomodoro</Typography>
                    {mNotifPermission !== 'granted' && mNotifPermission !== 'unsupported' && (
                        <Chip
                            icon={<span style={{ fontSize: '1rem' }}>🔔</span>}
                            label={mNotifPermission === 'denied' ? 'Notifications blocked — enable in browser settings' : 'Tap to enable completion alerts'}
                            onClick={mNotifPermission !== 'denied' ? mRequestNotifPermission : undefined}
                            size="small"
                            sx={{
                                bgcolor: mNotifPermission === 'denied' ? 'rgba(255,100,100,0.25)' : 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontSize: '0.7rem',
                                cursor: mNotifPermission !== 'denied' ? 'pointer' : 'default',
                                border: '1px solid rgba(255,255,255,0.3)',
                                '& .MuiChip-icon': { ml: 0.5 },
                                '&:hover': { bgcolor: mNotifPermission !== 'denied' ? 'rgba(255,255,255,0.3)' : undefined }
                            }}
                        />
                    )}
                    {mNotifPermission === 'granted' && (
                        <Chip
                            icon={<span style={{ fontSize: '0.9rem' }}>✅</span>}
                            label="Notifications enabled"
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.2)' }}
                        />
                    )}
                </Box>


                {/* Mode Selector */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, px: 2, mb: 2 }}>
                    {[['pomodoro', 'Focus'], ['shortBreak', 'Short Break'], ['longBreak', 'Long Break']].map(([val, label]) => (
                        <Button
                            key={val}
                            size="small"
                            onClick={() => mHandleModeChange(val)}
                            sx={{
                                color: 'white',
                                fontWeight: mMode === val ? 700 : 400,
                                bgcolor: mMode === val ? 'rgba(255,255,255,0.2)' : 'transparent',
                                borderRadius: 2,
                                px: 1.5,
                                fontSize: '0.75rem',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
                            }}
                        >{label}</Button>
                    ))}
                </Box>

                {/* Stats Bar */}
                {(() => {
                    const todayStr = new Date().toDateString();
                    const todaySessions = Array.isArray(mSessionHistory)
                        ? mSessionHistory.filter(s => s.date === todayStr && s.workType)
                        : [];
                    const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
                    const todayCount = todaySessions.length + (mCycles > 0 ? mCycles : 0);
                    const totalSessions = (mPomodoroStats?.total || 0) + mCycles;
                    const focusDisplay = todayMinutes >= 60
                        ? `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`
                        : `${todayMinutes || (mCycles * (mPomodoroSettings.pomodoro || 25))}m`;
                    return (
                        <Box sx={{
                            display: 'flex', justifyContent: 'center', gap: 0, mx: 2, mb: 2,
                            bgcolor: 'rgba(0,0,0,0.18)', borderRadius: 3, overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.12)'
                        }}>
                            {[
                                { label: 'Today', value: todayCount, icon: '🍅' },
                                { label: 'Focus', value: focusDisplay, icon: '⏱' },
                                { label: 'All time', value: totalSessions, icon: '🏆' },
                            ].map(({ label, value, icon }, i) => (
                                <Box key={label} sx={{
                                    flex: 1, py: 1.2, px: 1, textAlign: 'center',
                                    borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                }}>
                                    <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, textTransform: 'uppercase', mb: 0.2 }}>
                                        {icon} {label}
                                    </Typography>
                                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', fontFamily: 'monospace', lineHeight: 1 }}>
                                        {value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    );
                })()}

                {/* Timer - Swipeable Drum Picker */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <MobileScrollTimePicker
                        timeLeft={mTimeLeft}
                        isActive={mIsActive}
                        onMinuteChange={mHandleMinuteChange}
                    />
                    {!mIsActive && mMode === 'pomodoro' && (
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, mb: 0 }}>
                            {[10, 20, 40].map(mins => (
                                <Box
                                    key={mins}
                                    onClick={() => mHandleMinuteChange(mins)}
                                    sx={{
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: 2,
                                        px: 2.5,
                                        py: 0.8,
                                        cursor: 'pointer',
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        '&:active': { bgcolor: 'rgba(255,255,255,0.2)' }
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{mins} min</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                    <Typography sx={{ mt: 1.5, opacity: 0.7, fontSize: '0.9rem' }}>
                        #{mCycles + 1} · {mMode === 'pomodoro' ? 'Time to focus!' : 'Take a break!'}
                    </Typography>
                </Box>

                {/* Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                    <Button
                        variant="contained"
                        onClick={() => setMIsActive(a => !a)}
                        sx={{
                            bgcolor: 'white',
                            color: bgColor,
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            px: 6,
                            py: 1.5,
                            borderRadius: 2,
                            minWidth: 160,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                        }}
                    >
                        {mIsActive ? 'PAUSE' : 'START'}
                    </Button>
                    <Button
                        onClick={() => { setMIsActive(false); mHandleModeChange(mMode); }}
                        sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, px: 2, fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                    >
                        RESET
                    </Button>
                    <Button
                        onClick={mHandleCompleteEarly}
                        sx={{ color: '#1a1a2e', bgcolor: '#4ade80', borderRadius: 2, px: 2, fontWeight: 700, '&:hover': { bgcolor: '#22c55e' } }}
                    >
                        COMPLETE
                    </Button>
                </Box>

                {/* Quick Settings Row */}
                <Box sx={{ mx: 2, mb: 3, p: 1.5, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '1.1rem' }}>📳</Typography>
                        <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', lineHeight: 1.2 }}>Vibrate on end</Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>Buzz when session completes</Typography>
                        </Box>
                    </Box>
                    <Switch
                        checked={!!mVibrateOnEnd}
                        onChange={(e) => setMVibrateOnEnd(e.target.checked)}
                        size="small"
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#4ade80' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#4ade80' },
                            '& .MuiSwitch-track': { bgcolor: 'rgba(255,255,255,0.25)' },
                        }}
                    />
                </Box>

                {/* Task Section */}
                <Box sx={{ px: 2 }}>
                    {!mEditingTasks ? (
                        <Box
                            onClick={() => setMEditingTasks(true)}
                            sx={{
                                border: '1px dashed rgba(255,255,255,0.35)',
                                borderRadius: 3,
                                p: 2.5,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                                transition: 'background 0.2s'
                            }}
                        >
                            {mPrimaryTask ? (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: mSecondaryTask ? 1.5 : 0 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'white', flexShrink: 0 }} />
                                        <Box>
                                            <Typography sx={{ fontSize: '0.6rem', opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase' }}>Primary Focus</Typography>
                                            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{mPrimaryTask}</Typography>
                                        </Box>
                                    </Box>
                                    {/* Secondary Task (Gap Filler) removed for Deep Work */}
                                </>
                            ) : (
                                <Typography sx={{ opacity: 0.5, textAlign: 'center', fontSize: '0.95rem' }}>
                                    + Set focus tasks for this session
                                </Typography>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, p: 2.5, bgcolor: 'rgba(0,0,0,0.15)' }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, letterSpacing: 1, textTransform: 'uppercase', mb: 0.5 }}>Primary Focus</Typography>
                            <TextField
                                fullWidth
                                variant="standard"
                                placeholder="What's the one thing you must do?"
                                value={mLocalPrimary}
                                onChange={e => setMLocalPrimary(e.target.value)}
                                sx={{ mb: 2.5, '& .MuiInput-underline:before': { borderColor: 'rgba(255,255,255,0.3)' }, '& .MuiInput-underline:after': { borderColor: 'white' }, input: { color: 'white', fontSize: '1rem', fontWeight: 600 }, '& input::placeholder': { color: 'rgba(255,255,255,0.35)' } }}
                                InputProps={{ disableUnderline: false }}
                            />
                            {/* Secondary Task (Gap Filler) removed for Deep Work */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={mSaveTasks}
                                    sx={{ bgcolor: 'white', color: bgColor, fontWeight: 700, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                                >
                                    Save
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setMEditingTasks(false)}
                                    sx={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)' }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    )}
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
            case 'anti-gravity': return renderAntiGravityView();
            case 'journal': return renderJournalView();
            case 'gratitude': return renderGratitudeView();
            case 'mistakes': return <MistakesJournal />;
            case 'notes': return renderNotesView();
            case 'pomodoro': return renderPomodoroView();
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

            <Dialog open={openJournalSettings} onClose={() => setOpenJournalSettings(false)} fullScreen>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="700">Manage Journal</Typography>
                        <Button onClick={() => setOpenJournalSettings(false)} sx={{ fontWeight: 600 }}>Done</Button>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        {[...new Set(prompts.map(p => p.section))].map(section => {
                            const sectionEnabled = !disabledSections.includes(section);
                            const sectionPrompts = prompts.filter(p => p.section === section);
                            const enabledCount = sectionPrompts.filter(p => !disabledPrompts.includes(p.id)).length;
                            return (
                                <Paper key={section} sx={{ mb: 2, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: sectionEnabled ? 'divider' : 'action.disabledBackground' }}>
                                    {/* Section header */}
                                    <Box sx={{
                                        px: 2, py: 1.5,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        bgcolor: sectionEnabled ? 'primary.main' : 'action.disabledBackground',
                                        cursor: 'pointer'
                                    }}
                                        onClick={() => setExpandedSettingsSection(expandedSettingsSection === section ? null : section)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                            <Typography sx={{ fontWeight: 700, color: sectionEnabled ? 'white' : 'text.disabled', fontSize: '0.95rem' }}>
                                                {section}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.7rem', color: sectionEnabled ? 'rgba(255,255,255,0.7)' : 'text.disabled' }}>
                                                {enabledCount}/{sectionPrompts.length} active
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Switch
                                                size="small"
                                                checked={sectionEnabled}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={() => handleToggleJournalSection(section)}
                                                sx={{ '& .MuiSwitch-thumb': { bgcolor: sectionEnabled ? 'white' : undefined } }}
                                            />
                                            {expandedSettingsSection === section ? <ExpandLess sx={{ color: sectionEnabled ? 'white' : 'text.disabled' }} /> : <ExpandMore sx={{ color: sectionEnabled ? 'white' : 'text.disabled' }} />}
                                        </Box>
                                    </Box>
                                    {/* Questions list */}
                                    <Collapse in={expandedSettingsSection === section}>
                                        <Box sx={{ py: 1 }}>
                                            {sectionPrompts.map((prompt, idx) => {
                                                const isEnabled = !disabledPrompts.includes(prompt.id);
                                                return (
                                                    <Box key={prompt.id}>
                                                        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Switch
                                                                size="small"
                                                                checked={isEnabled}
                                                                onChange={() => handleTogglePrompt(prompt.id)}
                                                                color="primary"
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    flex: 1,
                                                                    color: isEnabled ? 'text.primary' : 'text.disabled',
                                                                    textDecoration: isEnabled ? 'none' : 'line-through',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                            >
                                                                {prompt.text}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleRemoveQuestion(prompt.id)}
                                                                sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}
                                                            >
                                                                <Delete sx={{ fontSize: 18, color: 'error.main' }} />
                                                            </IconButton>
                                                        </Box>
                                                        {idx < sectionPrompts.length - 1 && <Divider sx={{ mx: 2 }} />}
                                                    </Box>
                                                );
                                            })}
                                            <Box sx={{ px: 2, py: 1 }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<Add />}
                                                    onClick={() => {
                                                        setNewQuestionCategory(section);
                                                        setAddQuestionDialogOpen(true);
                                                    }}
                                                    sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                                                >
                                                    Add question
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Collapse>
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>
            </Dialog>

            <Dialog open={addQuestionDialogOpen} onClose={() => setAddQuestionDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add Question to {newQuestionCategory}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Question Text"
                        fullWidth
                        multiline
                        minRows={2}
                        variant="outlined"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddQuestionDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddQuestion} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
}

export default MobileApp;
