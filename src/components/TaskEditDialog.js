import React, { useState, useEffect } from 'react';
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

function TaskEditDialog({ open, onClose, onSave, task }) {
  const [editedTask, setEditedTask] = useState({
    name: '',
    priority: 'P4',
    duration: 30,
    important: false,
    urgent: false,
    isToday: true,
    taskDetails: '',
    tag: ''
  });

  useEffect(() => {
    if (task) {
      setEditedTask({
        ...task,
        // Preserve the original date if it exists
        date: task.date || new Date().toISOString().split('T')[0]
      });
    } else {
      setEditedTask({
        name: '',
        priority: 'P4',
        duration: 30,
        important: false,
        urgent: false,
        isToday: true,
        taskDetails: '',
        tag: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [task]);

  const handleSave = () => {
    if (editedTask && editedTask.name.trim()) {
      onSave(editedTask);
      onClose();
    }
  };

  if (!editedTask) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Task Name"
          fullWidth
          value={editedTask.name}
          onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
        />
        <TextField
          type="number"
          margin="dense"
          label="Duration (minutes)"
          fullWidth
          value={editedTask.duration}
          onChange={(e) => setEditedTask({ ...editedTask, duration: Number(e.target.value) })}
        />
        <TextField
          margin="dense"
          label="Tag"
          fullWidth
          value={editedTask.tag || ''}
          onChange={(e) => setEditedTask({ ...editedTask, tag: e.target.value })}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Priority</InputLabel>
          <Select
            value={editedTask.priority}
            onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
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
              checked={editedTask.urgent}
              onChange={(e) => setEditedTask({ ...editedTask, urgent: e.target.checked })}
            />
          }
          label="Urgent"
        />
        <FormControlLabel
          control={
            <Switch
              checked={editedTask.important}
              onChange={(e) => setEditedTask({ ...editedTask, important: e.target.checked })}
            />
          }
          label="Important"
        />
        <FormControlLabel
          control={
            <Switch
              checked={editedTask.isToday}
              onChange={(e) => setEditedTask({ ...editedTask, isToday: e.target.checked })}
            />
          }
          label={editedTask.isToday ? "Today" : "Dump"}
        />
        <TextField
          margin="dense"
          label="Task Details"
          fullWidth
          multiline
          rows={3}
          value={editedTask.taskDetails || ''}
          onChange={(e) => setEditedTask({ ...editedTask, taskDetails: e.target.value })}
          placeholder="Add additional details about this task..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TaskEditDialog; 