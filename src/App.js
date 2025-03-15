import React from 'react';
import { useState } from 'react';
import PlannerScreen from './components/PlannerScreen';
import Sidebar from './components/Sidebar';
import { ThemeProvider, createTheme } from '@mui/material';
import { Box } from '@mui/material';
import './App.css';
import PomodoroPanel from './components/PomodoroPanel';

const theme = createTheme({
  palette: {
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

function App() {
  const [tasks, setTasks] = useState(() => {
    // Load initial tasks from localStorage if available
    const savedTasks = localStorage.getItem('allTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [activePanel, setActivePanel] = useState('planner');
  const [pomodoroMode, setPomodoroMode] = useState('pomodoro');

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
      isToday: false
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem('allTasks', JSON.stringify(updatedTasks));
  };

  const handlePomodoroModeChange = (mode) => {
    setPomodoroMode(mode);
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'planner':
        return <PlannerScreen tasks={tasks} onTaskCreate={handleTaskCreate} />;
      case 'pomodoro':
        return <PomodoroPanel onModeChange={handlePomodoroModeChange} />;
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
        />
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {renderPanel()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 