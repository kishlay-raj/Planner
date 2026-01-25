import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography, IconButton, Tooltip, Popover, Link } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PlannerScreen from './components/PlannerScreen';
import PomodoroPanel from './components/PomodoroPanel';
import WeeklyPlanner from './components/WeeklyPlanner';
import MonthlyPlanner from './components/MonthlyPlanner';
import YearlyPlanner from './components/YearlyPlanner';
import DailyJournal from './components/DailyJournal';
import RoutinePlanner from './components/RoutinePlanner';
import RelapseFortificationJournal from './components/RelapseFortificationJournal';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import { useFirestore } from './hooks/useFirestore';
import './App.css';
import FloatingPomodoro from './components/FloatingPomodoro';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    // ... (rest of palette is same, keeping it concise for replace)
    secondary: {
      main: '#7c4dff',
      light: '#b47cff',
      dark: '#3f1dcb'
    },
    priority: {
      p1: '#d32f2f', // Deep Red
      p2: '#ed6c02', // Deep Orange
      p3: '#0288d1', // Light Blue
      p4: '#546e7a'  // Blue Grey
    },
    tag: {
      work: '#2e7d32',     // Dark Green
      personal: '#7b1fa2', // Purple
      study: '#e65100',    // Deep Orange
      health: '#0097a7'    // Cyan
    },
    background: {
      default: '#f8fafd',
      paper: '#ffffff'
    },
    divider: 'rgba(0, 0, 0, 0.12)'
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.5px'
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.25px'
    },
    subtitle1: {
      fontWeight: 500
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem'
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '6px 16px'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 24,
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.2px'
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease'
        }
      }
    }
  }
});

const defaultSettings = {
  pomodoro: 30,
  shortBreak: 5,
  longBreak: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  longBreakInterval: 4,
  autoCheckTasks: false,
  autoSwitchTasks: true,
  alarmSound: 'Kitchen',
  alarmVolume: 50,
  alarmRepeat: 1,
  tickingSound: 'Ticking Slow',
  tickingVolume: 50,
  darkMode: false,
  hourFormat: '24-hour',
};

function DesktopApp() {
  const [tasks, setTasks] = useFirestore('allTasks', []);
  const [activePanel, setActivePanel] = useState('planner');
  // const [pomodoroMode, setPomodoroMode] = useState('pomodoro'); // Removed: managed in logic below
  const [supportAnchor, setSupportAnchor] = useState(null);

  // --- GLOBAL POMODORO STATE ---
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('pomodoro');
  const [cycles, setCycles] = useState(0);
  const [settings, setSettings] = useFirestore('pomodoroSettings', defaultSettings);
  const defaultStats = { total: 0, today: 0, lastDate: new Date().toDateString() };
  const [stats, setStats] = useFirestore('pomodoroStats', defaultStats);
  const [tickInterval, setTickInterval] = useState(null);

  // Audio Context
  const [audioContext] = useState(() => {
    try {
      return new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API is not supported');
      return null;
    }
  });

  const playBeep = () => {
    if (!audioContext) return;
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(settings.alarmVolume / 100, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) { console.warn(e); }
  };

  const playTick = () => {
    if (!audioContext) return;
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      gainNode.gain.setValueAtTime(settings.tickingVolume / 400, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) { console.warn(e); }
  };

  const cleanupTick = () => {
    if (tickInterval) {
      clearInterval(tickInterval);
      setTickInterval(null);
    }
  };

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      if (settings.tickingVolume > 0 && !tickInterval) {
        setTickInterval(setInterval(playTick, 1000));
      }
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      cleanupTick();
      if (settings.alarmVolume > 0) {
        let count = 0;
        const alarmInt = setInterval(() => {
          if (count < settings.alarmRepeat) { playBeep(); count++; }
          else clearInterval(alarmInt);
        }, 1500);
      }

      // Update stats and cycles
      setCycles(c => c + 1);
      setStats(prev => {
        const isNewDay = prev.lastDate !== new Date().toDateString();
        return { ...prev, total: prev.total + 1, today: isNewDay ? 1 : prev.today + 1, lastDate: new Date().toDateString() };
      });

      // Auto-switch logic
      if (mode === 'pomodoro') {
        if (cycles + 1 >= settings.longBreakInterval) {
          setMode('longBreak');
          setTimeLeft(settings.longBreak * 60);
          setCycles(0);
        } else {
          setMode('shortBreak');
          setTimeLeft(settings.shortBreak * 60);
        }
        setIsActive(settings.autoStartBreaks);
      } else {
        setMode('pomodoro');
        setTimeLeft(settings.pomodoro * 60);
        setIsActive(settings.autoStartPomodoros);
      }
    }
    return () => { clearInterval(interval); cleanupTick(); };
  }, [isActive, timeLeft, settings, mode, cycles]);

  const toggleTimer = () => {
    if (isActive) cleanupTick();
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    cleanupTick();
    // Logic to switch modes manually
    if (mode === 'pomodoro') {
      setMode('shortBreak');
      setTimeLeft(settings.shortBreak * 60);
    } else if (mode === 'shortBreak') {
      setMode('longBreak');
      setTimeLeft(settings.longBreak * 60);
    } else {
      setMode('pomodoro');
      setTimeLeft(settings.pomodoro * 60);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Immediate update if matches current mode
    if (key === mode) setTimeLeft(value * 60);
  };

  const setModeAndUpdateTime = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    cleanupTick();
    if (newMode === 'pomodoro') setTimeLeft(settings.pomodoro * 60);
    else if (newMode === 'shortBreak') setTimeLeft(settings.shortBreak * 60);
    else if (newMode === 'longBreak') setTimeLeft(settings.longBreak * 60);
  };

  // -------------------------

  // Navigation Configuration State
  const defaultNavConfig = [
    { id: 'planner', label: 'Daily', iconKey: 'dashboard', visible: true },
    { id: 'planner-week', label: 'Weekly', iconKey: 'viewWeek', visible: true },
    { id: 'planner-month', label: 'Monthly', iconKey: 'calendarMonth', visible: true },
    { id: 'planner-year', label: 'Yearly', iconKey: 'emojiEvents', visible: true },
    { id: 'daily-journal', label: 'Journal', iconKey: 'menuBook', visible: true },
    { id: 'relapse-journal', label: 'Fortification', iconKey: 'security', visible: true },
    { id: 'routines', label: 'Routines', iconKey: 'selfImprovement', visible: true },
    { id: 'eisenhower', label: 'Matrix', iconKey: 'viewQuilt', visible: true },
    { id: 'pomodoro', label: 'Pomodoro', iconKey: 'timer', visible: true }
  ];

  const [navConfig, setNavConfig] = useFirestore('navConfig', defaultNavConfig);

  const handleNavUpdate = (newConfig) => {
    setNavConfig(newConfig);
  };

  const handleTaskCreate = (taskData) => {
    const newTask = {
      id: Date.now(),
      name: taskData.name,
      duration: taskData.duration,
      priority: taskData.priority || 'P4',
      tag: taskData.tag,
      important: taskData.important || false,
      urgent: taskData.urgent || false,
      completed: false,
      isToday: taskData.isToday !== undefined ? taskData.isToday : false,
      date: (taskData.isToday || taskData.isToday === undefined) ? new Date().toISOString() : undefined
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
  };

  // const handlePomodoroModeChange = (mode) => {
  //   setPomodoroMode(mode);
  // };

  const renderPanel = () => {
    switch (activePanel) {
      case 'planner':
        return <PlannerScreen tasks={tasks} onTaskCreate={handleTaskCreate} />;
      case 'planner-week':
        return <WeeklyPlanner />;
      case 'planner-month':
        return <MonthlyPlanner />;
      case 'planner-year':
        return <YearlyPlanner />;
      case 'daily-journal':
        return <DailyJournal />;
      case 'relapse-journal':
        return <RelapseFortificationJournal />;
      case 'routines':
        return <RoutinePlanner onTaskCreate={handleTaskCreate} />;
      case 'pomodoro':
        return <PomodoroPanel
          timeLeft={timeLeft}
          isActive={isActive}
          mode={mode}
          setMode={setModeAndUpdateTime}
          cycles={cycles}
          toggleTimer={toggleTimer}
          resetTimer={resetTimer}
          settings={settings}
          handleSettingChange={handleSettingChange}
        />;
      case 'eisenhower':
        return <EisenhowerMatrix />;
      case 'settings':
        return <Settings navConfig={navConfig} onUpdate={handleNavUpdate} />;
      default:
        return <PlannerScreen tasks={tasks} onTaskCreate={handleTaskCreate} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        display: 'flex',
        minHeight: '100vh',
        transition: 'margin 0.2s ease-in-out'
      }}>
        <Sidebar
          onNavigate={setActivePanel}
          activePanel={activePanel}
          pomodoroMode={mode}
          navConfig={navConfig}
        />

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {renderPanel()}
          </Box>

          {/* Floating Pomodoro Bubble */}
          <FloatingPomodoro
            timeLeft={timeLeft}
            isActive={isActive}
            onToggle={toggleTimer}
            mode={mode}
            visible={isActive && activePanel !== 'pomodoro'}
          />

          <Box sx={{
            py: 1.5,
            px: 3,
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
            bgcolor: 'background.paper',
            flexShrink: 0
          }}>
            <Typography variant="caption" color="text.secondary">
              Need help or have suggestions? Contact us at{' '}
              <a
                href="mailto:kishlayrajmanju@gmail.com"
                style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}
              >
                kishlayrajmanju@gmail.com
              </a>
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default DesktopApp; 