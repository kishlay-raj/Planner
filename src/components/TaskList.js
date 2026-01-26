import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Paper,
  Checkbox,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  InputBase,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import './TaskList.css';
import TaskEditDialog from './TaskEditDialog';
import { format } from 'date-fns';

function TaskList({ tasks, onTaskCreate, onTaskUpdate, onTaskSchedule, selectedDate }) {
  const theme = useTheme();
  const taskList = Array.isArray(tasks) ? tasks : [];
  const [editDialog, setEditDialog] = useState({ open: false, task: null });
  const [newTaskTexts, setNewTaskTexts] = useState({
    P1: '',
    P2: '',
    P3: '',
    P4: '',
  });
  const completedSectionRef = React.useRef(null);

  // Filter tasks to only show those created for the selected date
  const filteredTasks = taskList.filter(task => {
    if (!task.date) return false;
    const taskDate = new Date(task.date).toDateString();
    const selectedDateString = selectedDate.toDateString();
    return taskDate === selectedDateString;
  });

  // Tasks for priority sections (active only)
  const priorityTasksByLevel = {
    P1: filteredTasks.filter(task => task.priority === 'P1' && !task.completed),
    P2: filteredTasks.filter(task => task.priority === 'P2' && !task.completed),
    P3: filteredTasks.filter(task => task.priority === 'P3' && !task.completed),
    P4: filteredTasks.filter(task => task.priority === 'P4' && !task.completed)
  };

  // Tasks for completed section
  const completedSectionTasks = filteredTasks.filter(task => task.completed);

  const handleDragEnd = (result) => {
    // Defensive checks to prevent react-beautiful-dnd errors
    if (!result) return;
    if (!result.destination) return;
    if (result.source.droppableId === result.destination.droppableId &&
      result.source.index === result.destination.index) {
      return; // No change in position
    }

    try {
      const taskToMove = taskList.find(task => String(task.id) === result.draggableId);
      if (!taskToMove) return;

      let updatedTask = { ...taskToMove };

      if (result.destination.droppableId === 'completed-list') {
        updatedTask.completed = true;
      } else if (result.destination.droppableId.includes('priority')) {
        const newPriority = result.destination.droppableId.split('-')[0];
        updatedTask.priority = newPriority;
        // If moving back from completed, ensure it's marked active
        if (updatedTask.completed) {
          updatedTask.completed = false;
        }
      }

      // Only update the single modified task
      onTaskUpdate([updatedTask]);
    } catch (error) {
      console.error('Drag end error:', error);
    }
  };

  const handleDragStart = (event, task) => {
    // Only allow drag if not using the drag handle
    if (event.target.closest('.drag-handle')) {
      return;
    }

    event.dataTransfer.setData('task', JSON.stringify(task));
    event.dataTransfer.effectAllowed = 'move';

    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'task-drag-image';
    dragImage.textContent = task.name;
    document.body.appendChild(dragImage);

    event.dataTransfer.setDragImage(dragImage, 0, 0);

    // Clean up the drag image after dragging
    requestAnimationFrame(() => {
      dragImage.remove();
    });
  };

  const getPriorityColor = (priority) => {
    // Fallback colors if theme palette not fully populated, or use standard MUI colors
    if (theme.palette.priority) {
      const colors = {
        P1: theme.palette.priority.p1,
        P2: theme.palette.priority.p2,
        P3: theme.palette.priority.p3,
        P4: theme.palette.priority.p4
      };
      return colors[priority] || colors.P4;
    }
    // Default Material Colors fallback
    const fallback = {
      P1: '#f44336',
      P2: '#ff9800',
      P3: '#2196f3',
      P4: '#4caf50'
    };
    return fallback[priority] || fallback.P4;
  };

  const getPriorityBgColor = (priority) => {
    // Use alpha blending for background
    const color = getPriorityColor(priority);
    // Dark mode: slightly stronger opacity?
    const opacity = theme.palette.mode === 'dark' ? 0.2 : 0.1;
    return alpha(color, opacity);
  };

  const getTagColor = (tag) => {
    const colors = {
      work: theme.palette.info.main,
      personal: theme.palette.success.main,
      study: theme.palette.warning.main,
      health: theme.palette.error.main
    };
    return colors[tag.toLowerCase()] || theme.palette.grey[500];
  };

  const handleTaskEdit = (task) => {
    setEditDialog({
      open: true,
      task: task
    });
  };

  const handleTaskSave = (task) => {
    // Only update the single modified task
    onTaskUpdate([task]);
  };

  const handleQuickAdd = (priority, section) => {
    if (newTaskTexts[section]?.trim()) {
      const newTask = {
        name: newTaskTexts[section],
        priority,
        duration: 30, // Default duration
        completed: false,
        todoLater: section === 'todoLater',
        date: format(selectedDate, 'yyyy-MM-dd'),
      };

      if (onTaskCreate) {
        onTaskCreate(newTask);
      } else {
        console.warn("onTaskCreate prop missing in TaskList");
      }

      setNewTaskTexts(prev => ({
        ...prev,
        [section]: ''
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
          draggable="true"
          onDragStart={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              return;
            }
          }}
        >
          {items.length === 0 && (
            <ListItem className="priority-empty" sx={{ justifyContent: 'center', py: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                No tasks
              </Typography>
            </ListItem>
          )}
          {items.map((task, index) => (
            <Draggable
              key={task.id}
              draggableId={String(task.id)}
              index={index}
            >
              {(provided, snapshot) => (
                <ListItem
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className={`task-item ${snapshot.isDragging ? 'dragging' : ''} ${task.scheduledTime ? 'scheduled' : ''}`}
                  draggable="true"
                  onDragStart={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, task);
                  }}
                  onClick={() => handleTaskEdit(task)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: snapshot.isDragging ? 'action.selected' :
                      task.scheduledTime ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
                    color: 'text.primary',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    },
                    ...(task.scheduledTime && {
                      borderLeft: `3px solid ${theme.palette.primary.main}`,
                      bgcolor: alpha(theme.palette.primary.main, 0.04)
                    })
                  }}
                >
                  <div
                    {...provided.dragHandleProps}
                    className="drag-handle"
                    onMouseDown={(e) => {
                      if (e.target === e.currentTarget) {
                        e.stopPropagation();
                      }
                    }}
                    style={{ color: theme.palette.text.disabled }}
                  >
                    <DragIndicatorIcon sx={{ fontSize: '1.2rem' }} />
                  </div>
                  <Checkbox
                    size="small"
                    checked={task.completed || false}
                    onChange={async () => {
                      const updatedTask = { ...task, completed: !task.completed };
                      const { logAnalyticsEvent } = await import("../firebase");
                      if (updatedTask.completed) {
                        logAnalyticsEvent('task_completed', { priority: task.priority });
                      } else {
                        logAnalyticsEvent('task_uncompleted', { priority: task.priority });
                      }
                      onTaskUpdate([updatedTask]);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      padding: '4px',
                      marginRight: '8px',
                      color: 'text.disabled',
                      '&.Mui-checked': {
                        color: 'success.main'
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  />
                  <ListItemText
                    disableTypography
                    primary={
                      <div className="task-content">
                        <div className="task-header-row">
                          <Typography
                            variant="body1"
                            sx={{
                              textDecoration: task.completed ? 'line-through' : 'none',
                              opacity: task.completed ? 0.7 : 1,
                              fontWeight: 500,
                              fontSize: '0.85rem',
                              marginRight: '8px',
                              color: 'text.primary'
                            }}
                          >
                            {task.name}
                          </Typography>
                          <div className="task-chips">
                            <Chip
                              label={`${task.duration}min`}
                              size="small"
                              variant="outlined"
                              sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                color: 'primary.main',
                                fontWeight: 500,
                                borderColor: alpha(theme.palette.primary.main, 0.3)
                              }}
                            />
                            <Chip
                              label={task.priority}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getPriorityColor(task.priority), 0.15),
                                color: getPriorityColor(task.priority),
                                fontWeight: 500,
                              }}
                            />
                            {task.tag && (
                              <Chip
                                label={task.tag}
                                size="small"
                                variant="outlined"
                                sx={{
                                  backgroundColor: alpha(getTagColor(task.tag), 0.15),
                                  color: getTagColor(task.tag),
                                  fontWeight: 500,
                                  borderColor: alpha(getTagColor(task.tag), 0.3)
                                }}
                              />
                            )}
                            {task.urgent && (
                              <Chip
                                label="Urgent"
                                size="small"
                                sx={{
                                  backgroundColor: alpha(theme.palette.error.main, 0.15),
                                  color: 'error.main',
                                  fontWeight: 500
                                }}
                              />
                            )}
                            {task.subtasks && task.subtasks.length > 0 && (
                              <Chip
                                label={`${task.subtasks.filter(st => st.completed).length}/${task.subtasks.length}`}
                                size="small"
                                variant="outlined"
                                icon={<Box component="span" sx={{ fontSize: '10px', mr: 0.5 }}>✓</Box>}
                                sx={{
                                  backgroundColor: 'action.hover',
                                  color: 'text.secondary',
                                  fontWeight: 500,
                                  borderColor: 'transparent',
                                  '& .MuiChip-label': { px: 1 }
                                }}
                              />
                            )}
                          </div>
                        </div>
                        {task.taskDetails && (
                          <Typography
                            variant="body2"
                            className="task-details-text"
                            sx={{
                              mt: 0.5,
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontStyle: 'italic',
                              marginLeft: '0 !important',
                              borderLeft: 'none !important',
                              paddingLeft: '0 !important'
                            }}
                          >
                            {task.taskDetails}
                          </Typography>
                        )}
                      </div>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskEdit(task);
                    }}
                    className="edit-button"
                    sx={{ padding: '4px', color: 'text.secondary' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <Tooltip title="Add to Calendar">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskSchedule(task.id, new Date());
                      }}
                      className="schedule-button"
                      sx={{ padding: '4px', color: 'text.secondary' }}
                    >
                      <ScheduleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                </ListItem>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </List>
      )}
    </Droppable>
  );

  return (
    <Paper className="task-list" sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>
          Task Priorities
        </Typography>
      </Box>

      <div className="task-list-content">
        <DragDropContext onDragEnd={handleDragEnd}>
          {Object.keys(priorityTasksByLevel).map(priority => (
            <Accordion
              key={priority}
              defaultExpanded
              className={`priority-section`}
              sx={{ bgcolor: 'transparent', boxShadow: 'none' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                className={`priority-header-${priority.toLowerCase()}`}
                sx={{
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  minHeight: '40px !important',
                  bgcolor: getPriorityBgColor(priority) + ' !important',
                  '& .MuiAccordionSummary-content': {
                    margin: '4px 0 !important'
                  }
                }}
              >
                <div className="priority-header">
                  <div className="priority-header-text">
                    {/* Indicator removed as background now serves this purpose, but can keep if desired. Keeping for now for extra clarity */}
                    <div className={`priority-indicator priority-${priority.toLowerCase()}`} style={{ display: 'none' }} />
                    <Typography className="priority-title" sx={{
                      color: theme.palette.mode === 'dark' ? getPriorityColor(priority) : theme.palette.text.primary,
                      fontWeight: 600
                    }}>
                      {priority === 'P1' ? 'P1 - Critical' :
                        priority === 'P2' ? 'P2 - High' :
                          priority === 'P3' ? 'P3 - Medium' :
                            'P4 - Low (To-Do Later)'}
                    </Typography>
                    <Typography className="priority-count" sx={{ color: 'text.secondary' }}>
                      {priorityTasksByLevel[priority].length} tasks
                    </Typography>
                  </div>
                </div>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0 }}>
                <Box className="quick-add-task" sx={{
                  bgcolor: 'background.paper',
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>
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
                    sx={{ color: 'text.primary', fontSize: '0.875rem' }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleQuickAdd(priority, priority)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                <TaskListContent
                  listId={`${priority}-priority-list`}
                  items={priorityTasksByLevel[priority]}
                />
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Completed Tasks Section */}
          <Accordion
            ref={completedSectionRef}
            defaultExpanded={false}
            className="priority-section completed-section"
            onChange={(event, isExpanded) => {
              if (isExpanded && completedSectionRef.current) {
                setTimeout(() => {
                  completedSectionRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }, 100);
              }
            }}
            sx={{
              mt: 2,
              opacity: 0.8,
              '&:before': { display: 'none' },
              bgcolor: 'transparent',
              boxShadow: 'none'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
              sx={{
                backgroundColor: 'action.hover',
                borderBottom: `1px solid ${theme.palette.divider}`,
                minHeight: '40px !important',
                '& .MuiAccordionSummary-content': {
                  margin: '4px 0 !important'
                }
              }}
            >
              <div className="priority-header">
                <div className="priority-header-text">
                  <div className="priority-indicator" style={{ backgroundColor: theme.palette.text.disabled }} />
                  <Typography className="priority-title" sx={{ color: 'text.secondary' }}>
                    Completed
                  </Typography>
                  <Typography className="priority-count" sx={{ color: 'text.secondary' }}>
                    {completedSectionTasks.length} tasks
                  </Typography>
                </div>
              </div>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: 0 }}>
              <TaskListContent
                listId="completed-list"
                items={completedSectionTasks}
              />
            </AccordionDetails>
          </Accordion>
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