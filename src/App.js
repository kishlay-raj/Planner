import React from 'react';
import { useState } from 'react';
import PlannerScreen from './components/PlannerScreen';
import { ThemeProvider, createTheme } from '@mui/material';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
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