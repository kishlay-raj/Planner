import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';

function QuickTaskDialog({ open, onClose, onSave, startTime }) {
  const [task, setTask] = useState({
    name: '',
    duration: 30,
    priority: 'P3',
    urgent: false,
    important: false,
    isToday: true
  });

  const handleSave = () => {
    if (task.name.trim()) {
      onSave({
        ...task,
        scheduledTime: startTime
      });
      setTask({
        name: '',
        duration: 30,
        priority: 'P3',
        urgent: false,
        important: false,
        isToday: true
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Quick Add Task</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Task Name"
          fullWidth
          value={task.name}
          onChange={(e) => setTask({ ...task, name: e.target.value })}
        />
        <TextField
          type="number"
          margin="dense"
          label="Duration (minutes)"
          fullWidth
          value={task.duration}
          onChange={(e) => setTask({ ...task, duration: Number(e.target.value) })}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Priority</InputLabel>
          <Select
            value={task.priority}
            onChange={(e) => setTask({ ...task, priority: e.target.value })}
          >
            <MenuItem value="P1">P1</MenuItem>
            <MenuItem value="P2">P2</MenuItem>
            <MenuItem value="P3">P3</MenuItem>
            <MenuItem value="P4">P4</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={task.urgent}
              onChange={(e) => setTask({ ...task, urgent: e.target.checked })}
            />
          }
          label="Urgent"
        />
        <FormControlLabel
          control={
            <Switch
              checked={task.important}
              onChange={(e) => setTask({ ...task, important: e.target.checked })}
            />
          }
          label="Important"
        />
        <FormControlLabel
          control={
            <Switch
              checked={task.isToday}
              onChange={(e) => setTask({ ...task, isToday: e.target.checked })}
            />
          }
          label={task.isToday ? "Today" : "Dump"}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default QuickTaskDialog; 