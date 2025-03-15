import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions 
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  Add,
  Delete 
} from '@mui/icons-material';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths
} from 'date-fns';

function MonthlyPlanner() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyTasks, setMonthlyTasks] = useState(() => {
    const savedTasks = localStorage.getItem('monthlyTasks');
    return savedTasks ? JSON.parse(savedTasks) : {};
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    localStorage.setItem('monthlyTasks', JSON.stringify(monthlyTasks));
  }, [monthlyTasks]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDateClick = (date) => {
    if (isSameMonth(date, currentDate)) {
      setSelectedDate(date);
      setIsDialogOpen(true);
    }
  };

  const handleAddTask = () => {
    if (newTask.trim() && selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      setMonthlyTasks(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), { id: Date.now(), text: newTask, completed: false }]
      }));
      setNewTask('');
      setIsDialogOpen(false);
    }
  };

  const handleDeleteTask = (dateKey, taskId) => {
    setMonthlyTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(task => task.id !== taskId)
    }));
  };

  const toggleTask = (dateKey, taskId) => {
    setMonthlyTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  return (
    <Paper sx={{ height: 'calc(100vh - 80px)', p: 2, overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Monthly Planner
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={1}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Grid item xs={12/7} key={day}>
            <Box sx={{ p: 1, textAlign: 'center', fontWeight: 'bold' }}>
              {day}
            </Box>
          </Grid>
        ))}
        
        {daysInMonth.map(date => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const tasks = monthlyTasks[dateKey] || [];
          
          return (
            <Grid item xs={12/7} key={date.toString()}>
              <Box 
                onClick={() => handleDateClick(date)}
                sx={{ 
                  p: 1, 
                  height: 100,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: isSameMonth(date, currentDate) ? 'background.paper' : 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Typography variant="body2">
                  {format(date, 'd')}
                </Typography>
                {tasks.slice(0, 2).map(task => (
                  <Typography 
                    key={task.id} 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'text.disabled' : 'text.primary'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(dateKey, task.id);
                    }}
                  >
                    {task.text}
                  </Typography>
                ))}
                {tasks.length > 2 && (
                  <Typography variant="caption" color="text.secondary">
                    +{tasks.length - 2} more
                  </Typography>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>
          Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New task..."
            />
            <Button 
              onClick={handleAddTask}
              startIcon={<Add />}
              sx={{ mt: 1 }}
            >
              Add Task
            </Button>
          </Box>
          {selectedDate && monthlyTasks[format(selectedDate, 'yyyy-MM-dd')]?.map(task => (
            <Box 
              key={task.id} 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                mb: 1 
              }}
            >
              <Typography 
                sx={{ 
                  flex: 1,
                  textDecoration: task.completed ? 'line-through' : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => toggleTask(format(selectedDate, 'yyyy-MM-dd'), task.id)}
              >
                {task.text}
              </Typography>
              <IconButton 
                size="small"
                color="error"
                onClick={() => handleDeleteTask(format(selectedDate, 'yyyy-MM-dd'), task.id)}
              >
                <Delete />
              </IconButton>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default MonthlyPlanner; 