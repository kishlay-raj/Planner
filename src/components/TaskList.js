import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Tooltip,
  InputBase
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import './TaskList.css';
import TaskEditDialog from './TaskEditDialog';
import { useTheme } from '@mui/material/styles';

function TaskList({ tasks, onTaskUpdate, onTaskSchedule }) {
  // Ensure tasks is an array
  const taskList = Array.isArray(tasks) ? tasks : [];
  const [currentTab, setCurrentTab] = useState(0);
  const [editDialog, setEditDialog] = useState({
    open: false,
    task: null
  });
  const [filters, setFilters] = useState({
    important: false,
    urgent: false,
    priority: 'all'
  });
  const [newTaskTexts, setNewTaskTexts] = useState({
    P1: '',
    P2: '',
    P3: '',
    P4: '',
    today: '',
    dump: ''
  });

  const priorityTasks = taskList.filter(task => 
    (task.important || task.isToday) && !task.completed
  );
  const regularTasks = taskList.filter(task => !task.completed);
  
  // Group priority tasks by priority level
  const priorityTasksByLevel = {
    P1: priorityTasks.filter(task => task.priority === 'P1'),
    P2: priorityTasks.filter(task => task.priority === 'P2'),
    P3: priorityTasks.filter(task => task.priority === 'P3'),
    P4: priorityTasks.filter(task => task.priority === 'P4')
  };

  // Apply filters to regular tasks
  const filteredTasks = taskList.filter(task => {
    if (filters.important && !task.important) return false;
    if (filters.urgent && !task.urgent) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (task.completed) return false;
    return true;
  });

  // Separate tasks into Today and Dump
  const todayTasks = filteredTasks.filter(task => task.isToday);
  const dumpTasks = filteredTasks.filter(task => !task.isToday);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    // Get source and destination lists
    let sourceList;
    let destinationList;
    let updatedTask;

    if (result.source.droppableId.startsWith('P')) {
      sourceList = priorityTasksByLevel[result.source.droppableId.split('-')[0]];
    } else if (result.source.droppableId === 'today-list') {
      sourceList = todayTasks;
    } else {
      sourceList = dumpTasks;
    }

    // Get the task being moved
    const taskToMove = sourceList[result.source.index];
    
    // Update task's isToday status based on destination
    if (result.destination.droppableId === 'today-list') {
      updatedTask = { ...taskToMove, isToday: true };
    } else if (result.destination.droppableId === 'dump-list') {
      updatedTask = { ...taskToMove, isToday: false };
    } else if (result.destination.droppableId.startsWith('P')) {
      // If moving to a priority section, update priority and keep isToday status
      const newPriority = result.destination.droppableId.split('-')[0];
      updatedTask = { ...taskToMove, priority: newPriority };
    } else {
      updatedTask = taskToMove;
    }

    const updatedTasks = taskList.map(task => {
      if (task.id === taskToMove.id) {
        return updatedTask;
      }
      return task;
    });

    onTaskUpdate(updatedTasks);
  };

  const handleDragStart = (event, task) => {
    event.dataTransfer.setData('task', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';
  };

  const theme = useTheme();

  const getPriorityColor = (priority) => {
    const colors = {
      P1: theme.palette.priority.p1,
      P2: theme.palette.priority.p2,
      P3: theme.palette.priority.p3,
      P4: theme.palette.priority.p4
    };
    return colors[priority] || colors.P4;
  };

  const getTagColor = (tag) => {
    const colors = {
      work: theme.palette.tag.work,
      personal: theme.palette.tag.personal,
      study: theme.palette.tag.study,
      health: theme.palette.tag.health
    };
    return colors[tag.toLowerCase()] || theme.palette.grey[500];
  };

  const handleTaskEdit = (task) => {
    setEditDialog({
      open: true,
      task: task
    });
  };

  const handleTaskSave = (editedTask) => {
    const updatedTasks = taskList.map(task =>
      task.id === editedTask.id ? editedTask : task
    );
    onTaskUpdate(updatedTasks);
  };

  const handleQuickAdd = (priority, section) => {
    const text = newTaskTexts[section] || newTaskTexts[priority];
    if (text.trim()) {
      const newTask = {
        id: Date.now(),
        name: text,
        priority,
        duration: 30,
        isToday: section !== 'dump',
        completed: false,
        important: false,
        urgent: false,
        tag: ''
      };
      const updatedTasks = [...taskList, newTask];
      onTaskUpdate(updatedTasks);
      setNewTaskTexts(prev => ({
        ...prev,
        [section]: '',
        [priority]: ''
      }));
    }
  };

  const TaskListContent = ({ listId, items }) => (
    <Droppable droppableId={listId}>
      {(provided) => (
        <List
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="task-list-items"
        >
          {items.map((task, index) => (
            <Draggable
              key={task.id}
              draggableId={String(task.id)}
              index={index}
            >
              {(provided) => (
                <ListItem
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className="task-item"
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, task)}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      color: task.important ? theme.palette.priority.p1 : 'rgba(0, 0, 0, 0.87)'
                    },
                    '& .MuiListItemText-secondary': {
                      marginTop: 0.5
                    },
                    borderLeft: task.important ? `4px solid ${theme.palette.priority.p1}` : 'none',
                    paddingLeft: 0,
                    '&:hover .MuiIconButton-root': {
                      color: theme.palette.primary.main
                    }
                  }}
                >
                  <div {...provided.dragHandleProps} className="drag-handle">
                    <DragIndicatorIcon sx={{ fontSize: '1.2rem' }} />
                  </div>
                  <Checkbox
                    size="small"
                    checked={task.completed || false}
                    onChange={() => {
                      const updatedTasks = taskList.map(t =>
                        t.id === task.id ? { ...t, completed: !t.completed } : t
                      );
                      onTaskUpdate(updatedTasks);
                    }}
                    sx={{
                      padding: '4px',
                      marginRight: '8px',
                      color: 'rgba(0, 0, 0, 0.3)',
                      '&.Mui-checked': {
                        color: theme.palette.success.main
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  />
                  <ListItemText
                    primary={task.name}
                    sx={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      opacity: task.completed ? 0.7 : 1
                    }}
                    secondary={
                      <div className="task-details">
                        <Chip 
                          label={`${task.duration}min`} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            backgroundColor: 'rgba(33, 150, 243, 0.08)',
                            color: theme.palette.primary.main,
                            fontWeight: 500
                          }}
                        />
                        <Chip 
                          label={task.priority} 
                          size="small"
                          sx={{ 
                            backgroundColor: `${getPriorityColor(task.priority)}15`,
                            color: getPriorityColor(task.priority),
                            fontWeight: 500,
                            borderColor: getPriorityColor(task.priority)
                          }}
                        />
                        {task.tag && (
                          <Chip 
                            label={task.tag} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              backgroundColor: `${getTagColor(task.tag)}15`,
                              color: getTagColor(task.tag),
                              fontWeight: 500,
                              borderColor: getTagColor(task.tag)
                            }}
                          />
                        )}
                        {task.urgent && (
                          <Chip 
                            label="Urgent"
                            size="small"
                            sx={{ 
                              backgroundColor: `${theme.palette.error.main}15`,
                              color: theme.palette.error.main,
                              fontWeight: 500
                            }}
                          />
                        )}
                      </div>
                    }
                  />
                  <IconButton
                    onClick={() => handleTaskEdit(task)}
                    className="edit-button"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => onTaskSchedule(task.id, new Date())}
                    className="schedule-button"
                  >
                    <ScheduleIcon />
                  </IconButton>
                </ListItem>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </List>
      )}
    </Droppable>
  );

  const renderFilters = () => (
    <Box sx={{ 
      p: 2,
      backgroundColor: 'white',
      borderRadius: 2,
      margin: '8px 4px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      '& .MuiFormControlLabel-root': {
        margin: 0,
        minWidth: 'auto',
        '& .MuiTypography-root': {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'rgba(0, 0, 0, 0.7)'
        }
      }
    }}>
      <FormGroup row sx={{ 
        gap: 2,
        alignItems: 'center',
        flexWrap: 'nowrap',
        '& .MuiCheckbox-root': {
          padding: '6px',
          borderRadius: '6px',
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filters.important}
                onChange={(e) => setFilters({ ...filters, important: e.target.checked })}
                sx={{
                  color: theme.palette.priority.p1,
                  '&.Mui-checked': {
                    color: theme.palette.priority.p1
                  }
                }}
              />
            }
            label="Important"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={filters.urgent}
                onChange={(e) => setFilters({ ...filters, urgent: e.target.checked })}
                sx={{
                  color: theme.palette.error.main,
                  '&.Mui-checked': {
                    color: theme.palette.error.main
                  }
                }}
              />
            }
            label="Urgent"
          />
        </Box>
        <Box sx={{ 
          borderLeft: '1px solid rgba(0, 0, 0, 0.08)', 
          height: 24, 
          mx: 2 
        }} />
        <Select
          size="small"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          sx={{ 
            minWidth: 140,
            height: 32,
            fontSize: '0.875rem',
            fontWeight: 500,
            '& .MuiSelect-select': {
              padding: '4px 12px'
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 0, 0, 0.12)'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 0, 0, 0.24)'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main
            }
          }}
        >
          <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All Priorities</MenuItem>
          <MenuItem value="P1" sx={{ 
            fontSize: '0.875rem',
            color: theme.palette.priority.p1,
            fontWeight: 500 
          }}>P1 - Urgent</MenuItem>
          <MenuItem value="P2" sx={{ 
            fontSize: '0.875rem',
            color: theme.palette.priority.p2,
            fontWeight: 500 
          }}>P2 - High</MenuItem>
          <MenuItem value="P3" sx={{ 
            fontSize: '0.875rem',
            color: theme.palette.priority.p3,
            fontWeight: 500 
          }}>P3 - Medium</MenuItem>
          <MenuItem value="P4" sx={{ 
            fontSize: '0.875rem',
            color: theme.palette.priority.p4,
            fontWeight: 500 
          }}>P4 - Low</MenuItem>
        </Select>
      </FormGroup>
    </Box>
  );

  const renderTaskSection = (sectionTasks, sectionId, title) => (
    <Accordion defaultExpanded className="task-section">
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography className="section-title">
          {title}
          <Typography component="span" className="section-count">
            ({sectionTasks.length})
          </Typography>
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }}>
        <Box className="quick-add-task">
          <InputBase
            placeholder="Add a task..."
            value={newTaskTexts[sectionId.split('-')[0]] || ''}
            onChange={(e) => setNewTaskTexts(prev => ({
              ...prev,
              [sectionId.split('-')[0]]: e.target.value
            }))}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleQuickAdd(sectionId.split('-')[0], sectionId.includes('dump') ? 'dump' : 'today');
              }
            }}
            fullWidth
          />
          <IconButton 
            size="small"
            onClick={() => handleQuickAdd(sectionId.split('-')[0], sectionId.includes('dump') ? 'dump' : 'today')}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
        <TaskListContent listId={sectionId} items={sectionTasks} />
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Paper className="task-list">
      <Tabs
        value={currentTab}
        onChange={(_, newValue) => setCurrentTab(newValue)}
        variant="fullWidth"
      >
        <Tab label="Priorities" />
        <Tab label="Tasks" />
      </Tabs>
      <div className="task-list-content">
        <DragDropContext onDragEnd={handleDragEnd}>
          {currentTab === 0 ? (
            <>
              {['P1', 'P2', 'P3', 'P4'].map(priority => (
                <Accordion key={priority} defaultExpanded className="priority-section">
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.03)',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                      minHeight: '40px !important',
                      '& .MuiAccordionSummary-content': {
                        margin: '4px 0 !important'
                      }
                    }}
                  >
                    <div className="priority-header">
                      <div className="priority-header-text">
                        <div className={`priority-indicator priority-${priority.toLowerCase()}`} />
                        <Typography className="priority-title">
                          {priority === 'P1' ? 'P1 - Critical' :
                           priority === 'P2' ? 'P2 - High' :
                           priority === 'P3' ? 'P3 - Medium' :
                           'P4 - Low'}
                        </Typography>
                        <Typography className="priority-count">
                          {priorityTasksByLevel[priority].length} tasks
                        </Typography>
                      </div>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails sx={{ padding: 0 }}>
                    <Box className="quick-add-task">
                      <InputBase
                        placeholder="Add a task..."
                        value={newTaskTexts[priority] || ''}
                        onChange={(e) => setNewTaskTexts(prev => ({
                          ...prev,
                          [priority]: e.target.value
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleQuickAdd(priority, priority);
                          }
                        }}
                        fullWidth
                      />
                      <IconButton 
                        size="small"
                        onClick={() => handleQuickAdd(priority, priority)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    {priorityTasksByLevel[priority].length === 0 ? (
                      <Typography 
                        className="priority-empty"
                        sx={{ 
                          padding: '12px 24px',
                          color: 'text.secondary',
                          fontSize: '0.875rem'
                        }}
                      >
                        No tasks
                      </Typography>
                    ) : (
                      <TaskListContent 
                        listId={`${priority}-priority-list`} 
                        items={priorityTasksByLevel[priority]} 
                      />
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </>
          ) : (
            <>
              {renderFilters()}
              {renderTaskSection(todayTasks, 'today-list', 'Today')}
              {renderTaskSection(dumpTasks, 'dump-list', 'Dump')}
            </>
          )}
        </DragDropContext>
      </div>
      <TaskEditDialog
        open={editDialog.open}
        task={editDialog.task}
        onClose={() => setEditDialog({ open: false, task: null })}
        onSave={handleTaskSave}
      />
    </Paper>
  );
}

export default TaskList; 