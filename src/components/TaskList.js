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
  Typography
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import './TaskList.css';
import TaskEditDialog from './TaskEditDialog';
import { useTheme } from '@mui/material/styles';

function TaskList({ tasks, onTaskUpdate, onTaskSchedule }) {
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

  const priorityTasks = tasks.filter(task => 
    (task.important || task.isToday) && !task.completed
  );
  const regularTasks = tasks.filter(task => !task.completed);
  
  // Group priority tasks by priority level
  const priorityTasksByLevel = {
    P1: priorityTasks.filter(task => task.priority === 'P1'),
    P2: priorityTasks.filter(task => task.priority === 'P2'),
    P3: priorityTasks.filter(task => task.priority === 'P3'),
    P4: priorityTasks.filter(task => task.priority === 'P4')
  };

  // Apply filters to regular tasks
  const filteredTasks = tasks.filter(task => {
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

    const updatedTasks = tasks.map(task => {
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
    const updatedTasks = tasks.map(task =>
      task.id === editedTask.id ? editedTask : task
    );
    onTaskUpdate(updatedTasks);
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
                    paddingLeft: task.important ? 2 : 3,
                    '&:hover .MuiIconButton-root': {
                      color: theme.palette.primary.main
                    }
                  }}
                >
                  <div {...provided.dragHandleProps} className="drag-handle">
                    <DragIndicatorIcon sx={{ fontSize: '1.2rem' }} />
                  </div>
                  <ListItemText
                    primary={task.name}
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
      p: 1, 
      borderBottom: 1, 
      borderColor: 'divider',
      '& .MuiFormControlLabel-root': {
        marginRight: 1,
        '& .MuiTypography-root': {
          fontSize: '0.875rem'
        }
      }
    }}>
      <FormGroup row sx={{ gap: 2, alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={filters.important}
              onChange={(e) => setFilters({ ...filters, important: e.target.checked })}
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
            />
          }
          label="Urgent"
        />
        <Select
          size="small"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          sx={{ 
            minWidth: 100,
            height: 32,
            fontSize: '0.875rem',
            '& .MuiSelect-select': {
              padding: '4px 8px'
            }
          }}
        >
          <MenuItem value="all">All Priorities</MenuItem>
          <MenuItem value="P1">P1</MenuItem>
          <MenuItem value="P2">P2</MenuItem>
          <MenuItem value="P3">P3</MenuItem>
          <MenuItem value="P4">P4</MenuItem>
        </Select>
      </FormGroup>
    </Box>
  );

  const renderTaskSection = (sectionTasks, sectionId, title) => (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ 
          backgroundColor: 'white',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          minHeight: '40px !important',
          '& .MuiAccordionSummary-content': {
            margin: '4px 0 !important'
          },
          '& .MuiTypography-root': {
            fontWeight: 500,
            color: 'rgba(0, 0, 0, 0.87)'
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.2rem',
            color: 'rgba(0, 0, 0, 0.54)'
          }
        }}
      >
        <Typography variant="subtitle2">{`${title} (${sectionTasks.length})`}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }}>
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
        sx={{
          '& .MuiTab-root': {
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            minHeight: 48
          }
        }}
      >
        <Tab label={`Important & Today (${priorityTasks.length})`} />
        <Tab label={`All Tasks (${tasks.length})`} />
      </Tabs>
      <div className="task-list-content">
        <DragDropContext onDragEnd={handleDragEnd}>
          {currentTab === 0 ? (
            <>
              {['P1', 'P2', 'P3', 'P4'].map(priority => (
                priorityTasksByLevel[priority].length > 0 && (
                  <Accordion key={priority} defaultExpanded>
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
                      <Typography variant="subtitle2">{`${priority} (${priorityTasksByLevel[priority].length})`}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ padding: 0 }}>
                      <TaskListContent 
                        listId={`${priority}-priority-list`} 
                        items={priorityTasksByLevel[priority]} 
                      />
                    </AccordionDetails>
                  </Accordion>
                )
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