import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

function Tasks({ selectedDate }) {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        date: format(selectedDate, 'yyyy-MM-dd'),
        priority,
        created: new Date().toISOString()
      };
      setTasks([...tasks, task]);
      setNewTask('');
      setPriority('Medium');
    }
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const filteredTasks = tasks.filter(task => task.date === dateStr);

  return (
    <Paper sx={{ 
      height: 'calc(100vh - 80px)', 
      p: 2,
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Tasks for {format(selectedDate, 'MMMM d, yyyy')}
      </Typography>

      <Box component="form" onSubmit={handleAddTask} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              label="Priority"
              onChange={(e) => setPriority(e.target.value)}
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            type="submit"
            disabled={!newTask.trim()}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {filteredTasks.map(task => (
          <ListItem
            key={task.id}
            sx={{
              mb: 1,
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 1
            }}
          >
            <ListItemText
              primary={
                <Box
                  component="span"
                  sx={{
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'text.disabled' : 'text.primary',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.text}
                </Box>
              }
              secondary={
                <Chip
                  size="small"
                  label={task.priority}
                  color={getPriorityColor(task.priority)}
                  icon={<FlagIcon />}
                  sx={{ mt: 1 }}
                />
              }
            />
            <IconButton
              edge="end"
              onClick={() => deleteTask(task.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default Tasks; 