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
import EisenhowerMatrix from './components/EisenhowerMatrix';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import { useFirestore } from './hooks/useFirestore';
import './App.css';

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

function DesktopApp() {
  const [tasks, setTasks] = useFirestore('allTasks', []);
  const [activePanel, setActivePanel] = useState('planner');
  const [pomodoroMode, setPomodoroMode] = useState('pomodoro');
  const [supportAnchor, setSupportAnchor] = useState(null);

  // Navigation Configuration State
  const defaultNavConfig = [
    { id: 'planner', label: 'Daily', iconKey: 'dashboard', visible: true },
    { id: 'planner-week', label: 'Weekly', iconKey: 'viewWeek', visible: true },
    { id: 'planner-month', label: 'Monthly', iconKey: 'calendarMonth', visible: true },
    { id: 'planner-year', label: 'Yearly', iconKey: 'emojiEvents', visible: true },
    { id: 'daily-journal', label: 'Journal', iconKey: 'menuBook', visible: true },
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

  const handlePomodoroModeChange = (mode) => {
    setPomodoroMode(mode);
  };

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
      case 'routines':
        return <RoutinePlanner onTaskCreate={handleTaskCreate} />;
      case 'pomodoro':
        return <PomodoroPanel onModeChange={handlePomodoroModeChange} />;
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
          pomodoroMode={pomodoroMode}
          navConfig={navConfig}
        />

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {renderPanel()}
          </Box>
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