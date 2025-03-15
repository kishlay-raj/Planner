import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  TextField,
  IconButton,
  Divider 
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { format, startOfWeek, addDays } from 'date-fns';

function WeeklyPlanner() {
  const [weeklyTasks, setWeeklyTasks] = useState(() => {
    const savedTasks = localStorage.getItem('weeklyTasks');
    return savedTasks ? JSON.parse(savedTasks) : {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };
  });

  useEffect(() => {
    localStorage.setItem('weeklyTasks', JSON.stringify(weeklyTasks));
  }, [weeklyTasks]);

  const addTask = (day) => {
    setWeeklyTasks(prev => ({
      ...prev,
      [day]: [...prev[day], { id: Date.now(), text: '', completed: false }]
    }));
  };

  const updateTask = (day, taskId, newText) => {
    setWeeklyTasks(prev => ({
      ...prev,
      [day]: prev[day].map(task => 
        task.id === taskId ? { ...task, text: newText } : task
      )
    }));
  };

  const deleteTask = (day, taskId) => {
    setWeeklyTasks(prev => ({
      ...prev,
      [day]: prev[day].filter(task => task.id !== taskId)
    }));
  };

  const toggleTask = (day, taskId) => {
    setWeeklyTasks(prev => ({
      ...prev,
      [day]: prev[day].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  // Get current week dates
  const startOfCurrentWeek = startOfWeek(new Date());
  const weekDates = [...Array(7)].map((_, i) => addDays(startOfCurrentWeek, i));

  return (
    <Paper sx={{ height: 'calc(100vh - 80px)', p: 2, overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Weekly Planner
      </Typography>
      <Grid container spacing={2}>
        {Object.keys(weeklyTasks).map((day, index) => (
          <Grid item xs={12} key={day}>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2 
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {day} - {format(weekDates[index], 'MMM d')}
                </Typography>
                <IconButton 
                  onClick={() => addTask(day)}
                  size="small"
                  color="primary"
                >
                  <Add />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {weeklyTasks[day].map(task => (
                <Box 
                  key={task.id} 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1 
                  }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    value={task.text}
                    onChange={(e) => updateTask(day, task.id, e.target.value)}
                    placeholder="Enter task..."
                    sx={{
                      '& .MuiInputBase-input': {
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }
                    }}
                    onClick={() => toggleTask(day, task.id)}
                  />
                  <IconButton 
                    onClick={() => deleteTask(day, task.id)}
                    size="small"
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

export default WeeklyPlanner; 