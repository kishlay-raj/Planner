import React from 'react';
import { useState } from 'react';
import PlannerScreen from './components/PlannerScreen';
import { ThemeProvider, createTheme } from '@mui/material';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2'
    },
    secondary: {
      main: '#ff4081',
      light: '#ff79b0',
      dark: '#c60055'
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff'
    },
    divider: 'rgba(0, 0, 0, 0.08)'
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600
    },
    subtitle1: {
      fontWeight: 500
    },
    subtitle2: {
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 24,
          fontSize: '0.75rem',
          fontWeight: 500
        }
      }
    }
  }
});

function App() {
  const [tasks, setTasks] = useState([]);

  const handleTaskCreate = (taskData) => {
    const newTask = {
      id: Date.now(),
      name: taskData.name,
      duration: taskData.duration,
      priority: taskData.priority,
      tag: taskData.tag,
      urgent: taskData.urgent,
      important: taskData.important,
      isToday: taskData.isToday,
      completed: false,
      scheduledTime: null
    };
    setTasks([...tasks, newTask]);
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <PlannerScreen tasks={tasks} onTaskCreate={handleTaskCreate} />
      </div>
    </ThemeProvider>
  );
}

export default App; 