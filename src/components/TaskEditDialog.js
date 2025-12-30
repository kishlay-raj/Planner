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
  Switch,
  IconButton,
  InputAdornment
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Checkbox } from '@mui/material';

function TaskEditDialog({ open, onClose, onSave, task }) {
  const [editedTask, setEditedTask] = useState({
    name: '',
    priority: 'P4',
    duration: 30,
    important: false,
    urgent: false,
    isToday: true,
    taskDetails: '',
    tag: '',
    scheduledTime: null
  });

  useEffect(() => {
    if (task) {
      setEditedTask({
        ...task,
        // Preserve the original date if it exists
        date: task.date || new Date().toISOString().split('T')[0],
        scheduledTime: task.scheduledTime ? new Date(task.scheduledTime) : null
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
        date: new Date().toISOString().split('T')[0],
        scheduledTime: null
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
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <DateTimePicker
              label="Scheduled Time"
              value={editedTask.scheduledTime}
              onChange={(newValue) => setEditedTask({ ...editedTask, scheduledTime: newValue })}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'dense',
                  InputProps: {
                    endAdornment: editedTask.scheduledTime && (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditedTask({ ...editedTask, scheduledTime: null });
                          }}
                          edge="end"
                          size="small"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }
              }}
            />
          </div>
        </LocalizationProvider>
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

        {/* Subtasks Section */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <TextField
              margin="dense"
              label="Add Subtask"
              fullWidth
              size="small"
              value={editedTask.newSubtaskText || ''}
              onChange={(e) => setEditedTask({ ...editedTask, newSubtaskText: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && editedTask.newSubtaskText?.trim()) {
                  e.preventDefault();
                  const newSubtask = {
                    id: Date.now(),
                    text: editedTask.newSubtaskText,
                    completed: false
                  };
                  setEditedTask({
                    ...editedTask,
                    subtasks: [...(editedTask.subtasks || []), newSubtask],
                    newSubtaskText: ''
                  });
                }
              }}
            />
            <IconButton
              onClick={() => {
                if (editedTask.newSubtaskText?.trim()) {
                  const newSubtask = {
                    id: Date.now(),
                    text: editedTask.newSubtaskText,
                    completed: false
                  };
                  setEditedTask({
                    ...editedTask,
                    subtasks: [...(editedTask.subtasks || []), newSubtask],
                    newSubtaskText: ''
                  });
                }
              }}
              sx={{ ml: 1 }}
            >
              <AddIcon />
            </IconButton>
          </div>

          {(editedTask.subtasks || []).map((subtask, index) => (
            <div key={subtask.id || index} style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
              <Checkbox
                checked={subtask.completed}
                onChange={(e) => {
                  const updatedSubtasks = [...(editedTask.subtasks || [])];
                  updatedSubtasks[index] = { ...subtask, completed: e.target.checked };
                  setEditedTask({ ...editedTask, subtasks: updatedSubtasks });
                }}
                size="small"
              />
              <span style={{
                flexGrow: 1,
                textDecoration: subtask.completed ? 'line-through' : 'none',
                color: subtask.completed ? 'text.secondary' : 'text.primary',
                fontSize: '0.9rem'
              }}>
                {subtask.text}
              </span>
              <IconButton
                size="small"
                onClick={() => {
                  const updatedSubtasks = (editedTask.subtasks || []).filter((_, i) => i !== index);
                  setEditedTask({ ...editedTask, subtasks: updatedSubtasks });
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
          ))}
        </div>
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