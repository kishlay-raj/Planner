import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    IconButton,
    Chip,
    Fade,
    Checkbox,
    InputBase
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    RadioButtonUnchecked as UncheckedIcon,
    PriorityHigh as UrgentIcon,
    Star as ImportantIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import TaskEditDialog from './TaskEditDialog';

const Quadrant = ({ title, tasks, color, bgColor, icon, onEdit, onDelete, onToggleComplete, onAdd, onQuickAdd }) => {
    const theme = useTheme();
    const [newItemText, setNewItemText] = useState('');

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && newItemText.trim()) {
            onQuickAdd(newItemText);
            setNewItemText('');
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                p: 2,
                borderRadius: 3,
                border: 'none',
                bgcolor: bgColor, // Pastel background
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {icon}
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '1rem' }}>
                        {title}
                    </Typography>
                    <Chip
                        label={tasks.length}
                        size="small"
                        sx={{
                            height: 20,
                            minWidth: 20,
                            fontSize: '0.75rem',
                            bgcolor: 'rgba(255,255,255,0.6)',
                            color: theme.palette.text.secondary,
                            fontWeight: 700
                        }}
                    />
                </Box>
                <IconButton size="small" onClick={onAdd} sx={{ color: theme.palette.text.secondary, '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}>
                    <AddIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ mb: 1.5 }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.7)',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    border: '1px solid transparent',
                    '&:focus-within': {
                        bgcolor: '#fff',
                        borderColor: color,
                        boxShadow: `0 0 0 2px ${color}20`
                    },
                    transition: 'all 0.2s'
                }}>
                    <AddIcon fontSize="small" sx={{ color: theme.palette.text.disabled, mr: 0.5 }} />
                    <InputBase
                        placeholder="Add task..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        fullWidth
                        sx={{
                            fontSize: '0.9rem',
                            '& ::placeholder': { color: theme.palette.text.disabled }
                        }}
                    />
                </Box>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {tasks.length === 0 ? (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>No tasks</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {tasks.map(task => (
                            <Fade in key={task.id}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        p: 0.5,
                                        borderRadius: 1,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.5)',
                                            '& .action-buttons': { opacity: 1 }
                                        }
                                    }}
                                >
                                    <Checkbox
                                        checked={!!task.completed}
                                        onChange={(e) => { e.stopPropagation(); onToggleComplete(task); }}
                                        size="small"
                                        sx={{
                                            p: 0.5,
                                            color: theme.palette.text.disabled,
                                            '&.Mui-checked': { color: theme.palette.text.disabled }
                                        }}
                                    />

                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            onClick={() => onEdit(task)}
                                            sx={{
                                                fontWeight: 400,
                                                textDecoration: task.completed ? 'line-through' : 'none',
                                                color: task.completed ? theme.palette.text.disabled : theme.palette.text.primary,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {task.name}
                                        </Typography>
                                    </Box>

                                    <Box className="action-buttons" sx={{ display: 'flex', opacity: 0, transition: 'opacity 0.2s' }}>
                                        <IconButton size="small" onClick={() => onEdit(task)} sx={{ padding: 0.5 }}>
                                            <EditIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => onDelete(task.id)} sx={{ padding: 0.5 }}>
                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Fade>
                        ))}
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

function EisenhowerMatrix() {
    const theme = useTheme();
    const [tasks, setTasks] = useState([]);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [defaultQuadrant, setDefaultQuadrant] = useState({ urgent: false, important: false });

    // Load tasks
    useEffect(() => {
        try {
            const savedTasks = localStorage.getItem('allTasks');
            if (savedTasks) {
                setTasks(JSON.parse(savedTasks));
            }
        } catch (e) {
            console.error('Failed to load tasks', e);
        }
    }, []);

    // Save tasks
    useEffect(() => {
        localStorage.setItem('allTasks', JSON.stringify(tasks));
    }, [tasks]);

    const handleAddTask = (urgent, important) => {
        setDefaultQuadrant({ urgent, important });
        setCurrentTask(null);
        setEditDialogOpen(true);
    };

    const handleQuickAdd = (text, urgent, important) => {
        if (!text.trim()) return;
        const newTask = {
            id: Date.now(),
            name: text.trim(),
            priority: 'P4', // Default priority
            urgent: urgent,
            important: important,
            isToday: true, // Auto-add to Today view as well
            completed: false
        };
        setTasks([...tasks, newTask]);
    };

    const handleEditTask = (task) => {
        setCurrentTask(task);
        setEditDialogOpen(true);
    };

    const handleSaveTask = (taskToSave) => {
        if (currentTask) {
            setTasks(tasks.map(t => t.id === taskToSave.id ? taskToSave : t));
        } else {
            const newTask = {
                ...taskToSave,
                id: Date.now(),
                urgent: defaultQuadrant.urgent,
                important: defaultQuadrant.important
            };
            setTasks([...tasks, newTask]);
        }
        setEditDialogOpen(false);
    };

    const handleDeleteTask = (taskId) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const handleToggleComplete = (task) => {
        const updated = { ...task, completed: !task.completed };
        setTasks(tasks.map(t => t.id === task.id ? updated : t));
    };

    // Filter Logic
    const activeTasks = tasks.filter(t => !t.completed); // Show only active? Or all? Usually matrix is for active planning.
    // Let's show all but maybe move completed to bottom or filter them out.
    // Plan implied "Prioritization", so active tasks makes sense.
    // Let's filter for active only for the grid to keep it clean.

    // Actually, user might want to see what they did. Let's keep them but maybe sorted to bottom.
    // For now, let's just show all and rely on the checkmark visualization.

    const quadrantTasks = {
        doFirst: tasks.filter(t => t.urgent && t.important), // Show completed too, strike-through handles state
        schedule: tasks.filter(t => !t.urgent && t.important),
        delegate: tasks.filter(t => t.urgent && !t.important),
        eliminate: tasks.filter(t => !t.urgent && !t.important),
    };

    return (
        <Box sx={{ p: 3, height: '100vh', overflow: 'hidden', bgcolor: theme.palette.background.default, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: theme.palette.text.primary, letterSpacing: '-0.5px' }}>
                    Eisenhower Matrix
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Prioritize tasks based on urgency and importance.
                </Typography>
            </Box>

            {/* Matrix Layout Container */}
            <Box sx={{
                flexGrow: 1,
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr 1fr',
                gridTemplateRows: 'min-content 1fr 1fr',
                gap: 2,
                overflow: 'hidden',
                pb: 2
            }}>
                {/* Header Row: Empty Corner + Column Labels */}
                <Box></Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#EF5350' }}>
                        Urgent
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#42A5F5' }}>
                        Not Urgent
                    </Typography>
                </Box>

                {/* Important Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#EF5350' }}>
                        Important
                    </Typography>
                </Box>

                {/* Q1: Do First */}
                <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
                    <Quadrant
                        title="Do First"
                        tasks={quadrantTasks.doFirst}
                        color="#EF5350"
                        bgColor="#FFEBEE" // Red 50
                        icon={<UrgentIcon sx={{ color: '#EF5350' }} />}
                        onAdd={() => handleAddTask(true, true)}
                        onQuickAdd={(text) => handleQuickAdd(text, true, true)}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onToggleComplete={handleToggleComplete}
                    />
                </Box>

                {/* Q2: Schedule */}
                <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
                    <Quadrant
                        title="Schedule"
                        tasks={quadrantTasks.schedule}
                        color="#42A5F5"
                        bgColor="#E3F2FD" // Blue 50
                        icon={<ImportantIcon sx={{ color: '#42A5F5' }} />}
                        onAdd={() => handleAddTask(false, true)}
                        onQuickAdd={(text) => handleQuickAdd(text, false, true)}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onToggleComplete={handleToggleComplete}
                    />
                </Box>

                {/* Not Important Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9E9E9E' }}>
                        Not Important
                    </Typography>
                </Box>

                {/* Q3: Delegate */}
                <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
                    <Quadrant
                        title="Delegate"
                        tasks={quadrantTasks.delegate}
                        color="#FFA726"
                        bgColor="#FFF3E0" // Orange 50
                        icon={<UrgentIcon sx={{ color: '#FFA726' }} />}
                        onAdd={() => handleAddTask(true, false)}
                        onQuickAdd={(text) => handleQuickAdd(text, true, false)}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onToggleComplete={handleToggleComplete}
                    />
                </Box>

                {/* Q4: Eliminate */}
                <Box sx={{ minHeight: 0, overflow: 'hidden' }}>
                    <Quadrant
                        title="Eliminate"
                        tasks={quadrantTasks.eliminate}
                        color="#BDBDBD"
                        bgColor="#F5F5F5" // Grey 50
                        icon={<UncheckedIcon sx={{ color: '#BDBDBD' }} />}
                        onAdd={() => handleAddTask(false, false)}
                        onQuickAdd={(text) => handleQuickAdd(text, false, false)}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onToggleComplete={handleToggleComplete}
                    />
                </Box>
            </Box>

            {/* We need to pass initial values to TaskEditDialog if we want to pre-select Urgent/Important based on which "+" button was clicked. 
                TaskEditDialog doesn't currently support 'initialValues' prop other than 'task'. 
                I'll create a dummy 'task' object with the flags set. */}
            <TaskEditDialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                onSave={handleSaveTask}
                task={currentTask || {
                    name: '',
                    priority: 'P4',
                    duration: 30,
                    urgent: defaultQuadrant.urgent,
                    important: defaultQuadrant.important,
                    isToday: true // Default to Today
                }}
            />
        </Box>
    );
}

export default EisenhowerMatrix;
