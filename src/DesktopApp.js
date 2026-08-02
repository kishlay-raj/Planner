import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography, IconButton, Tooltip, Popover, Link, Snackbar, Alert, Button } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import PlannerScreen from './components/PlannerScreen';
import NotesPanel from './components/NotesPanel';
import PomodoroPanel from './components/PomodoroPanel';
import WeeklyPlanner from './components/WeeklyPlanner';
import MonthlyPlanner from './components/MonthlyPlanner';
import YearlyPlanner from './components/YearlyPlanner';
import DailyJournal from './components/DailyJournal';
import GratitudeJournal from './components/GratitudeJournal';
import RoutinePlanner from './components/RoutinePlanner';
import RelapseFortificationJournal from './components/RelapseFortificationJournal';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import { useFirestore } from './hooks/useFirestore';
import './App.css';
import FloatingPomodoro from './components/FloatingPomodoro';
import AntiGravityHabitTracker from './components/AntiGravityHabitTracker';
import MistakesJournal from './components/MistakesJournal';
import PomodoroWidgetContent from './components/PomodoroWidgetContent';
import ProjectManagement from './components/ProjectManagement';
import ProjectDetails from './components/ProjectDetails';

// Moved theme creation inside component or useMemo to depend on mode
// But since we need it in JSX, we will refactor to use a useMemo hook for theme creation.


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
  enableInactivityAlert: true,
  inactivityAlertInterval: 15,
};

function DesktopApp() {
  const [tasks, setTasks] = useFirestore('allTasks', []);
  const [activePanel, setActivePanel] = useState(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const validIds = [
      'planner', 'planner-week', 'planner-month', 'planner-year', 
      'anti-gravity', 'daily-journal', 'gratitude-journal', 'independent-notes', 
      'project-management', 'relapse-journal', 'mistakes', 'routines', 
      'eisenhower', 'pomodoro'
    ];
    return (validIds.includes(hash) || hash.startsWith('project-details-')) ? hash : 'planner';
  });
  // const [pomodoroMode, setPomodoroMode] = useState('pomodoro'); // Removed: managed in logic below
  const [supportAnchor, setSupportAnchor] = useState(null);

  // --- DARK MODE STATE ---
  const [darkMode, setDarkMode] = useFirestore('darkMode', false);

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0'
      },
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
        work: darkMode ? '#66bb6a' : '#2e7d32',     // Lighter green for dark mode
        personal: '#ab47bc',
        study: '#ffa726',
        health: '#26c6da'
      },
      background: {
        default: darkMode ? '#121212' : '#f8fafd',
        paper: darkMode ? '#1e1e1e' : '#ffffff'
      },
      divider: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      text: {
        primary: darkMode ? '#fff' : 'rgba(0, 0, 0, 0.87)',
        secondary: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
      }
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
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
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
  }), [darkMode]);

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // --- HASH ROUTING SIDE EFFECTS ---
  useEffect(() => {
    if (window.location.hash !== `#${activePanel}`) {
      window.location.hash = activePanel;
    }
  }, [activePanel]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const validIds = [
        'planner', 'planner-week', 'planner-month', 'planner-year', 
        'anti-gravity', 'daily-journal', 'gratitude-journal', 'independent-notes', 
        'project-management', 'relapse-journal', 'mistakes', 'routines', 
        'eisenhower', 'pomodoro'
      ];
      if (validIds.includes(hash) || hash.startsWith('project-details-')) {
        setActivePanel(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // --- GLOBAL POMODORO STATE ---
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('pomodoro');
  const [cycles, setCycles] = useState(0);
  const [settings, setSettings] = useFirestore('pomodoroSettings', defaultSettings);
  const defaultStats = { total: 0, today: 0, lastDate: new Date().toDateString() };
  const [stats, setStats] = useFirestore('pomodoroStats', defaultStats);
  const [tickInterval, setTickInterval] = useState(null);
  const [workType, setWorkType] = useFirestore('pomodoroWorkType', 'deep'); // 'deep' or 'shallow'
  const [sessionHistory, setSessionHistory] = useFirestore('pomodoroSessionHistory', []); // Track all completed sessions
  const [primaryTask, setPrimaryTask] = useFirestore('pomodoroPrimaryTask', '');
  const [secondaryTask, setSecondaryTask] = useFirestore('pomodoroSecondaryTask', '');
  const [pomodoroNotes, setPomodoroNotes] = useFirestore('pomodoroNotes', '');
  const [pomodoroSubtasks, setPomodoroSubtasks] = useFirestore('pomodoroSubtasks', []);
  const [allowedWebsites, setAllowedWebsites] = useFirestore('pomodoroAllowedWebsites', '');
  const earlyCompleteElapsedRef = useRef(null);

  // --- SYSTEM ACTIVITY & INACTIVITY ALERT STATE ---
  const [activeNoPomodoroTime, setActiveNoPomodoroTime] = useState(0);
  const [inactivityAlertOpen, setInactivityAlertOpen] = useState(false);
  const lastActivityRef = useRef(Date.now());

  // Listen to system / user interaction events to track active user status
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'focus', 'visibilitychange'];
    events.forEach(event => window.addEventListener(event, handleUserActivity, { passive: true }));
    return () => {
      events.forEach(event => window.removeEventListener(event, handleUserActivity));
    };
  }, []);

  // --- PIP WIDGET STATE ---
  const [pipWindow, setPipWindow] = useState(null);
  const pipWindowRef = useRef(null);

  const handleOpenWidget = async () => {
    // Try native Document Picture-in-Picture first (Chrome 116+)
    if ('documentPictureInPicture' in window) {
      try {
        const pip = await window.documentPictureInPicture.requestWindow({
          width: 330,
          height: 270,
        });
        const style = pip.document.createElement('style');
        style.textContent = '* { margin:0; padding:0; box-sizing:border-box; } body { overflow-y:auto; overflow-x:hidden; }';
        pip.document.head.appendChild(style);
        pip.addEventListener('pagehide', () => {
          setPipWindow(null);
          pipWindowRef.current = null;
        });
        pipWindowRef.current = pip;
        setPipWindow(pip);
        return; // Success!
      } catch (e) {
        console.warn('Native Document PiP failed, falling back to popup window:', e);
      }
    }

    // Fallback to standard window.open (works on Safari, Firefox, and Electron)
    try {
      const popup = window.open(
        '',
        'PomodoroWidget',
        'width=330,height=270,resizable=yes,scrollbars=yes,status=no,menubar=no,toolbar=no'
      );
      if (!popup) {
        alert('Popup blocker blocked the widget! Please allow popups for this site.');
        return;
      }
      const style = popup.document.createElement('style');
      style.textContent = '* { margin:0; padding:0; box-sizing:border-box; } body { overflow-y:auto; overflow-x:hidden; }';
      popup.document.head.appendChild(style);
      popup.addEventListener('pagehide', () => {
        setPipWindow(null);
        pipWindowRef.current = null;
      });
      popup.onbeforeunload = () => {
        setPipWindow(null);
        pipWindowRef.current = null;
      };
      pipWindowRef.current = popup;
      setPipWindow(popup);
    } catch (e) {
      console.error('Fallback popup window failed:', e);
      alert('Failed to open the pop-out widget.');
    }
  };

  // Cleanup PiP window on unmount
  useEffect(() => {
    return () => { try { pipWindowRef.current?.close(); } catch(e) {} };
  }, []);

  // Audio Context
  const [audioContext] = useState(() => {
    try {
      return new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API is not supported');
      return null;
    }
  });

  // --- REQUEST NOTIFICATION PERMISSION ON MOUNT ---
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // --- LIVE BROWSER-TAB TITLE (visible even when window is minimised) ---
  useEffect(() => {
    if (isActive) {
      const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const secs = (timeLeft % 60).toString().padStart(2, '0');
      const modeLabel = mode === 'pomodoro' ? '🍅' : mode === 'shortBreak' ? '☕' : '🛌';
      document.title = `${modeLabel} ${mins}:${secs} — Flow Planner`;
    } else {
      document.title = 'Flow Planner';
    }
  }, [isActive, timeLeft, mode]);

  const playBeep = () => {
    if (!audioContext) return;
    try {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime((settings.alarmVolume || 50) / 100, audioContext.currentTime);
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

  // --- NATIVE DESKTOP / MACOS NOTIFICATION HELPER ---
  const fireDesktopNotification = (title, body, tag = 'inactivity-focus-alert', persistent = true) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const notifOptions = {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag,
      renotify: true,
      requireInteraction: persistent, // Keeps macOS banner visible until user clicks/dismisses
      silent: false
    };

    // Always prefer SW showNotification — required for native macOS system notification banners
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then(reg => {
          reg.showNotification(title, notifOptions);
        })
        .catch(() => {
          try { new Notification(title, notifOptions); } catch (e) { console.warn(e); }
        });
    } else {
      try { new Notification(title, notifOptions); } catch (e) { console.warn(e); }
    }
  };

  // --- INACTIVITY ALERT LOGIC ---
  useEffect(() => {
    if (isActive || settings.enableInactivityAlert === false) {
      if (activeNoPomodoroTime !== 0) setActiveNoPomodoroTime(0);
      if (inactivityAlertOpen) setInactivityAlertOpen(false);
      return;
    }

    const interval = setInterval(() => {
      const isUserActive = (Date.now() - lastActivityRef.current) < 2 * 60 * 1000;
      if (isUserActive) {
        setActiveNoPomodoroTime(prev => {
          const nextTime = prev + 1;
          const targetSeconds = (settings.inactivityAlertInterval || 15) * 60;
          if (nextTime >= targetSeconds && !inactivityAlertOpen) {
            setInactivityAlertOpen(true);

            fireDesktopNotification(
              '🍅 Intentional Focus Alert',
              `You've been active for ${settings.inactivityAlertInterval || 15} minutes without a Pomodoro timer. Time to focus!`,
              'inactivity-focus-alert',
              true
            );

            if (settings.alarmVolume > 0) {
              playBeep();
            }
          }
          return nextTime;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, settings.enableInactivityAlert, settings.inactivityAlertInterval, settings.alarmVolume, inactivityAlertOpen]);

  const handleTestInactivityAlert = () => {
    setInactivityAlertOpen(true);
    fireDesktopNotification(
      '🍅 Intentional Focus Alert (Test)',
      `This is a test inactivity alert. Time to focus!`,
      'inactivity-focus-alert',
      true
    );
    if (settings.alarmVolume > 0) {
      playBeep();
    }
  };

  const handleStartPomodoroFromAlert = () => {
    setInactivityAlertOpen(false);
    setActiveNoPomodoroTime(0);
    setMode('pomodoro');
    setTimeLeft((settings.pomodoro || 30) * 60);
    setIsActive(true);
  };

  const handleSnoozeInactivityAlert = () => {
    setInactivityAlertOpen(false);
    setActiveNoPomodoroTime(0);
  };

  const handleDismissInactivityAlert = () => {
    setInactivityAlertOpen(false);
    setActiveNoPomodoroTime(0);
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

      // --- DESKTOP NOTIFICATION ---
      const isPomodoro = mode === 'pomodoro';
      const title = isPomodoro ? '🍅 Focus session complete!' : '☕ Break time over!';
      const body = isPomodoro
        ? 'Great work! Time for a break.'
        : 'Break is done. Ready to focus again?';
      
      fireDesktopNotification(title, body, 'pomodoro-complete', false);

      // Update stats and cycles
      setCycles(c => c + 1);
      setStats(prev => {
        const isNewDay = prev.lastDate !== new Date().toDateString();
        return { ...prev, total: prev.total + 1, today: isNewDay ? 1 : prev.today + 1, lastDate: new Date().toDateString() };
      });

      // Save session to history if it was a pomodoro (focus session)
      if (mode === 'pomodoro') {
        const actualDuration = earlyCompleteElapsedRef.current !== null ? earlyCompleteElapsedRef.current : settings.pomodoro;
        const notePrefix = earlyCompleteElapsedRef.current !== null ? "(Completed early) " : "";
        const session = {
          id: Date.now(),
          workType: workType, // 'deep' or 'shallow'
          duration: actualDuration, // duration in minutes
          timestamp: new Date().toISOString(),
          date: new Date().toDateString(),
          primaryTask: primaryTask,
          secondaryTask: secondaryTask,
          allowedWebsites: allowedWebsites,
          notes: pomodoroNotes ? notePrefix + pomodoroNotes : (earlyCompleteElapsedRef.current !== null ? "Completed early" : ""),
          subtasks: pomodoroSubtasks
        };
        setSessionHistory(prev => [...prev, session]);
        earlyCompleteElapsedRef.current = null;
        
        // Clean up session-specific data
        setPomodoroSubtasks([]);
      }

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

  const completeTimer = () => {
    // Record elapsed time if completed early
    const expectedTime = mode === 'pomodoro' ? settings.pomodoro * 60 : (mode === 'shortBreak' ? settings.shortBreak * 60 : settings.longBreak * 60);
    const elapsedMinutes = Math.max(1, Math.round((expectedTime - Math.max(0, timeLeft)) / 60));
    if (elapsedMinutes < settings.pomodoro && mode === 'pomodoro') {
       earlyCompleteElapsedRef.current = elapsedMinutes;
    }
    
    // Try to find the primary task in tasks and mark it complete
    if (mode === 'pomodoro' && primaryTask) {
       const taskToComplete = tasks.find(t => !t.completed && t.name.trim().toLowerCase() === primaryTask.trim().toLowerCase());
       if (taskToComplete) {
         const updatedTasks = tasks.map(t => t.id === taskToComplete.id ? { ...t, completed: true } : t);
         setTasks(updatedTasks);
       }
    }
    
    // Setting timeLeft to 0 triggers the completion logic in the useEffect
    setTimeLeft(0);
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

  const toggleWorkType = () => {
    setWorkType(prev => prev === 'deep' ? 'shallow' : 'deep');
  };

  // -------------------------

  // Navigation Configuration State
  const defaultNavConfig = [
    { id: 'planner', label: 'Daily', iconKey: 'dashboard', visible: true },
    { id: 'planner-week', label: 'Weekly', iconKey: 'viewWeek', visible: true },
    { id: 'planner-month', label: 'Monthly', iconKey: 'calendarMonth', visible: true },
    { id: 'planner-year', label: 'Yearly', iconKey: 'emojiEvents', visible: true },
    { id: 'anti-gravity', label: 'Habit', iconKey: 'rocket', visible: true },
    { id: 'daily-journal', label: 'Journal', iconKey: 'menuBook', visible: true },
    { id: 'gratitude-journal', label: 'Gratitude', iconKey: 'favorite', visible: true },
    { id: 'independent-notes', label: 'General Notes', iconKey: 'editNote', visible: true },
    { id: 'project-management', label: 'Projects', iconKey: 'project', visible: true },
    { id: 'relapse-journal', label: 'Fortification', iconKey: 'security', visible: true },
    { id: 'mistakes', label: 'Mistakes', iconKey: 'warning', visible: true },
    { id: 'routines', label: 'Routines', iconKey: 'selfImprovement', visible: true },
    { id: 'eisenhower', label: 'Matrix', iconKey: 'viewQuilt', visible: true },
    { id: 'pomodoro', label: 'Pomodoro', iconKey: 'timer', visible: true }
  ];

  const [rawNavConfig, setNavConfig] = useFirestore('navConfig', defaultNavConfig);

  const navConfig = React.useMemo(() => {
    if (!rawNavConfig) return defaultNavConfig;
    const configList = Array.isArray(rawNavConfig) ? rawNavConfig : defaultNavConfig;
    const validIds = defaultNavConfig.map(item => item.id);
    const filtered = configList.filter(item => validIds.includes(item.id));
    const missing = defaultNavConfig.filter(item => !filtered.some(f => f.id === item.id));
    return [...filtered, ...missing];
  }, [rawNavConfig]);

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


  const handleStartPomodoroForTask = (task) => {
    const taskName = typeof task === 'string' ? task : task?.name || '';
    const taskDuration = (typeof task === 'object' && task?.duration) ? Number(task.duration) : (settings.pomodoro || 30);
    setPrimaryTask(taskName);
    setMode('pomodoro');
    setTimeLeft(taskDuration * 60);
    setIsActive(true);
  };

  const renderPanel = () => {
    if (activePanel.startsWith('project-details-')) {
      const pId = activePanel.replace('project-details-', '');
      return <ProjectDetails projectId={pId} onBack={() => setActivePanel('project-management')} />;
    }

    switch (activePanel) {
      case 'planner':
        return <PlannerScreen tasks={tasks} onTaskCreate={handleTaskCreate} sessionHistory={sessionHistory} onStartPomodoro={handleStartPomodoroForTask} />;
      case 'planner-week':
        return <WeeklyPlanner />;
      case 'planner-month':
        return <MonthlyPlanner />;
      case 'planner-year':
        return <YearlyPlanner />;
      case 'daily-journal':
        return <DailyJournal />;
      case 'gratitude-journal':
        return <GratitudeJournal />;
      case 'independent-notes':
        return <NotesPanel customPath="planner/notes/general" title="General Notes" enableLock={true} />;
      case 'project-management':
        return <ProjectManagement onProjectClick={(id) => setActivePanel(`project-details-${id}`)} />;
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
          completeTimer={completeTimer}
          settings={settings}
          handleSettingChange={handleSettingChange}
          workType={workType}
          onWorkTypeToggle={toggleWorkType}
          sessionHistory={sessionHistory}
          onOpenWidget={handleOpenWidget}
          widgetOpen={!!pipWindow}
          primaryTask={primaryTask}
          setPrimaryTask={setPrimaryTask}
          secondaryTask={secondaryTask}
          setSecondaryTask={setSecondaryTask}
          pomodoroNotes={pomodoroNotes}
          setPomodoroNotes={setPomodoroNotes}
          pomodoroSubtasks={pomodoroSubtasks}
          setPomodoroSubtasks={setPomodoroSubtasks}
          allowedWebsites={allowedWebsites}
          setAllowedWebsites={setAllowedWebsites}
        />;
      case 'eisenhower':
        return <EisenhowerMatrix />;
      case 'anti-gravity':
        return <AntiGravityHabitTracker />;
      case 'mistakes':
        return <MistakesJournal />;
      case 'settings':
        // Pass darkMode, toggle handler, and pomodoroSettings to Settings
        return <Settings
          navConfig={navConfig}
          onUpdate={handleNavUpdate}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          pomodoroSettings={settings}
          handleSettingChange={handleSettingChange}
          activeNoPomodoroTime={activeNoPomodoroTime}
          onTestInactivityAlert={handleTestInactivityAlert}
          isActive={isActive}
        />;
      default:
        return <PlannerScreen tasks={tasks} onTaskCreate={handleTaskCreate} sessionHistory={sessionHistory} onStartPomodoro={handleStartPomodoroForTask} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        display: 'flex',
        minHeight: '100vh',
        transition: 'margin 0.2s ease-in-out',
        bgcolor: 'background.default',
        color: 'text.primary'
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

          {/* Floating Pomodoro Bubble — visible on all panels while timer runs */}
          <FloatingPomodoro
            timeLeft={timeLeft}
            isActive={isActive}
            onToggle={toggleTimer}
            mode={mode}
            visible={isActive && activePanel !== 'pomodoro'}
            workType={workType}
            onWorkTypeToggle={toggleWorkType}
            primaryTask={primaryTask}
            secondaryTask={secondaryTask}
            allowedWebsites={allowedWebsites}
            onOpenWidget={handleOpenWidget}
            widgetOpen={!!pipWindow}
            onSkip={completeTimer}
            onUpdatePrimaryTask={setPrimaryTask}
            onUpdateSecondaryTask={setSecondaryTask}
            alarmVolume={settings.alarmVolume}
            onVolumeChange={(val) => {
              handleSettingChange('alarmVolume', val);
              handleSettingChange('tickingVolume', val);
            }}
          />

          {/* PiP Widget Portal — renders into the always-on-top mini window */}
          {pipWindow && createPortal(
            <PomodoroWidgetContent
              timeLeft={timeLeft}
              isActive={isActive}
              mode={mode}
              workType={workType}
              primaryTask={primaryTask}
              secondaryTask={secondaryTask}
              allowedWebsites={allowedWebsites}
              pomodoroNotes={pomodoroNotes}
              pomodoroSubtasks={pomodoroSubtasks}
              onToggle={toggleTimer}
              onSkip={completeTimer}
              onUpdatePrimaryTask={setPrimaryTask}
              onUpdateSecondaryTask={setSecondaryTask}
              onUpdateNotes={setPomodoroNotes}
              onUpdateSubtasks={setPomodoroSubtasks}
            />,
            pipWindow.document.body
          )}

          {/* Inactivity Alert Snackbar */}
          <Snackbar
            open={inactivityAlertOpen}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ mb: 4 }}
          >
            <Alert
              severity="warning"
              variant="filled"
              icon={<NotificationsActiveIcon sx={{ color: 'white' }} />}
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    color="inherit"
                    size="small"
                    variant="outlined"
                    onClick={handleStartPomodoroFromAlert}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}
                  >
                    🍅 Start Focus ({settings.pomodoro || 30}m)
                  </Button>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleSnoozeInactivityAlert}
                    sx={{ color: 'white', opacity: 0.9 }}
                  >
                    Snooze ({settings.inactivityAlertInterval || 15}m)
                  </Button>
                  <IconButton
                    size="small"
                    aria-label="close"
                    color="inherit"
                    onClick={handleDismissInactivityAlert}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              sx={{
                width: '100%',
                maxWidth: 680,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #d32f2f 0%, #ed6c02 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                color: 'white',
                alignItems: 'center'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Intentional Focus Reminder
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                You've been active on your system for {settings.inactivityAlertInterval || 15}+ minutes without a Pomodoro timer running.
              </Typography>
            </Alert>
          </Snackbar>

          <Box sx={{
            py: 1.5,
            px: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
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