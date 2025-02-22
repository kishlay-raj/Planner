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
    priority: 'medium',
    urgent: false,
    important: false
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
        priority: 'medium',
        urgent: false,
        important: false
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
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
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