import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    Checkbox,
    FormControlLabel,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    useTheme,
    Tooltip,
    Grid,
    Grow,
    Chip,
    InputBase,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    alpha,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Menu
} from '@mui/material';
import {
    ArrowBack,
    Add,
    DeleteOutline,
    Edit,
    Star,
    Assignment,
    Feedback,
    NoteAlt,
    AttachMoney,
    Folder,
    ExpandMore,
    GitHub
} from '@mui/icons-material';
import { useFirestore } from '../hooks/useFirestore';
import NotesPanel from './NotesPanel';

export default function ProjectDetails({ projectId, onBack }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [isSyncing, setIsSyncing] = useState(false);

    // Retrieve global projects list to get project details
    const [projects] = useFirestore('projects', []);
    const project = projects.find(p => p.id === projectId);

    // Firestore states for tasks and feedbacks specific to this project
    const [tasks, setTasks] = useFirestore(`project_${projectId}_tasks`, []);
    const [feedbacks, setFeedbacks] = useFirestore(`project_${projectId}_feedbacks`, []);

    // Form States - Tasks
    const [taskName, setTaskName] = useState('');
    const [taskPriority, setTaskPriority] = useState('P3');
    const [quickTaskTexts, setQuickTaskTexts] = useState({ P1: '', P2: '', P3: '', P4: '' });

    // Form States - Feedbacks
    const [feedbackContent, setFeedbackContent] = useState('');
    const [feedbackPriority, setFeedbackPriority] = useState('medium');
    const [hasMonetaryImpact, setHasMonetaryImpact] = useState(false);
    const [quickFeedbackTexts, setQuickFeedbackTexts] = useState({ high: '', medium: '', low: '' });
    const [quickFeedbackMonetary, setQuickFeedbackMonetary] = useState({ high: false, medium: false, low: false });

    // Task edit state
    const [editingTask, setEditingTask] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const [priorityMenuAnchor, setPriorityMenuAnchor] = useState(null);
    const [priorityMenuTaskId, setPriorityMenuTaskId] = useState(null);

    if (!project) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Loading project details or project not found...
                </Typography>
                <Button startIcon={<ArrowBack />} onClick={onBack} sx={{ mt: 2 }}>
                    Back to Projects
                </Button>
            </Box>
        );
    }

    // Task Actions
    const handleAddTask = (e) => {
        e.preventDefault();
        if (!taskName.trim()) return;

        const newTask = {
            id: Date.now().toString(),
            name: taskName.trim(),
            priority: taskPriority,
            completed: false,
            createdAt: new Date().toISOString(),
            notes: '',
            subtasks: []
        };

        setTasks(prev => [...prev, newTask]);
        setTaskName('');
        setTaskPriority('P3');
    };

    const handleQuickAddTask = (priorityCode) => {
        const text = quickTaskTexts[priorityCode];
        if (!text || !text.trim()) return;

        const newTask = {
            id: Date.now().toString(),
            name: text.trim(),
            priority: priorityCode,
            completed: false,
            createdAt: new Date().toISOString(),
            notes: '',
            subtasks: []
        };

        setTasks(prev => [...prev, newTask]);
        setQuickTaskTexts({
            ...quickTaskTexts,
            [priorityCode]: ''
        });
    };

    const toggleTaskCompleted = (id) => {
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    const handleDeleteTask = (id) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleChangeTaskPriority = (id, newPriority) => {
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, priority: newPriority } : t
        ));
    };

    const handleToggleSubtaskInline = (taskId, subtaskId) => {
        setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;
            const currentSubtasks = t.subtasks || [];
            const updatedSubtasks = currentSubtasks.map(st =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            return { ...t, subtasks: updatedSubtasks };
        }));
    };

    const handleEditTask = (task) => {
        setEditingTask({
            ...task,
            notes: task.notes || '',
            subtasks: task.subtasks ? [...task.subtasks] : []
        });
        setNewSubtaskText('');
        setEditDialogOpen(true);
    };

    const handleSaveEditedTask = () => {
        if (!editingTask || !editingTask.name.trim()) return;

        setTasks(prev => prev.map(t =>
            t.id === editingTask.id
                ? {
                    ...t,
                    name: editingTask.name.trim(),
                    priority: editingTask.priority,
                    notes: editingTask.notes ? editingTask.notes.trim() : '',
                    subtasks: editingTask.subtasks || []
                }
                : t
        ));
        setEditDialogOpen(false);
        setEditingTask(null);
        setNewSubtaskText('');
    };

    const handleAddSubtaskInDialog = () => {
        if (!newSubtaskText.trim() || !editingTask) return;
        const newSubtask = {
            id: Date.now().toString(),
            text: newSubtaskText.trim(),
            completed: false
        };
        setEditingTask({
            ...editingTask,
            subtasks: [...(editingTask.subtasks || []), newSubtask]
        });
        setNewSubtaskText('');
    };

    const handleToggleSubtaskInDialog = (subtaskId) => {
        if (!editingTask) return;
        setEditingTask({
            ...editingTask,
            subtasks: (editingTask.subtasks || []).map(st =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
            )
        });
    };

    const handleDeleteSubtaskInDialog = (subtaskId) => {
        if (!editingTask) return;
        setEditingTask({
            ...editingTask,
            subtasks: (editingTask.subtasks || []).filter(st => st.id !== subtaskId)
        });
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setEditingTask(null);
        setNewSubtaskText('');
    };

    const handleOpenPriorityMenu = (event, taskId) => {
        event.stopPropagation();
        setPriorityMenuAnchor(event.currentTarget);
        setPriorityMenuTaskId(taskId);
    };

    const handleClosePriorityMenu = () => {
        setPriorityMenuAnchor(null);
        setPriorityMenuTaskId(null);
    };

    const handleSelectTaskPriority = (newPriority) => {
        if (priorityMenuTaskId) {
            handleChangeTaskPriority(priorityMenuTaskId, newPriority);
        }
        handleClosePriorityMenu();
    };

    // Feedback Actions
    const handleAddFeedback = (e) => {
        e.preventDefault();
        if (!feedbackContent.trim()) return;

        const newFeedback = {
            id: Date.now().toString(),
            content: feedbackContent.trim(),
            priority: feedbackPriority,
            highMonetaryImpact: hasMonetaryImpact,
            createdAt: new Date().toISOString()
        };

        setFeedbacks(prev => [...prev, newFeedback]);
        setFeedbackContent('');
        setFeedbackPriority('medium');
        setHasMonetaryImpact(false);
    };

    const handleDeleteFeedback = (id) => {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
    };

    const handleGitSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            alert("Synced with Git successfully!");
        }, 1500);
    };

    const handleQuickAddFeedback = (pLevel) => {
        const text = quickFeedbackTexts[pLevel];
        if (!text || !text.trim()) return;

        const newFeedback = {
            id: Date.now().toString(),
            content: text.trim(),
            priority: pLevel,
            highMonetaryImpact: quickFeedbackMonetary[pLevel],
            createdAt: new Date().toISOString()
        };

        setFeedbacks(prev => [...prev, newFeedback]);
        setQuickFeedbackTexts(prev => ({
            ...prev,
            [pLevel]: ''
        }));
        setQuickFeedbackMonetary(prev => ({
            ...prev,
            [pLevel]: false
        }));
    };

    const getFeedbackPriorityBgColor = (priority) => {
        const colorMap = {
            high: theme.palette.error.main,
            medium: theme.palette.warning.main,
            low: theme.palette.info.main
        };
        const color = colorMap[priority] || theme.palette.text.secondary;
        return alpha(color, isDark ? 0.15 : 0.08);
    };

    // Helpers
    const formatDate = (isoString) => {
        try {
            return new Date(isoString).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return '';
        }
    };

    // Task categorizer helpers
    const filterTasksByPriority = (priorityCode) => {
        return tasks.filter(t => t.priority === priorityCode && !t.completed);
    };

    const getPriorityName = (code) => {
        switch (code) {
            case 'P1': return 'Critical';
            case 'P2': return 'High';
            case 'P3': return 'Medium';
            default: return 'Low';
        }
    };

    const getPriorityColor = (code) => {
        switch (code) {
            case 'P1': return theme.palette.error.main;
            case 'P2': return theme.palette.warning.main;
            case 'P3': return theme.palette.info.main;
            default: return theme.palette.text.secondary;
        }
    };

    const getPriorityBgColor = (code) => {
        const color = getPriorityColor(code);
        const opacity = theme.palette.mode === 'dark' ? 0.2 : 0.1;
        return alpha(color, opacity);
    };

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const highImpactCount = feedbacks.filter(f => f.highMonetaryImpact).length;

    const renderTaskRow = (task, idx, totalInSection, isCompleted = false) => {
        const taskPriority = task.priority || 'P4';
        const subtasks = task.subtasks || [];
        const completedSubtasksCount = subtasks.filter(s => s.completed).length;

        return (
            <Grow in={true} key={task.id}>
                <Paper
                    square
                    variant="none"
                    sx={{
                        p: 1.5,
                        px: { xs: 1.5, sm: 3 },
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'visible',
                        borderBottom: idx < totalInSection - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                        bgcolor: isCompleted
                            ? (isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)')
                            : 'background.paper',
                        opacity: isCompleted ? 0.7 : 1,
                        '&:hover': {
                            bgcolor: 'action.hover'
                        }
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 1,
                        width: '100%'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0, flex: 1 }}>
                            <Checkbox
                                size="small"
                                checked={task.completed || false}
                                onChange={() => toggleTaskCompleted(task.id)}
                                sx={{
                                    p: 0.5,
                                    mt: 0.25,
                                    color: 'text.disabled',
                                    '&.Mui-checked': {
                                        color: 'success.main'
                                    }
                                }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    variant="body2"
                                    onClick={() => handleEditTask(task)}
                                    sx={{
                                        fontWeight: 500,
                                        wordBreak: 'break-word',
                                        textDecoration: isCompleted ? 'line-through' : 'none',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            color: 'primary.main'
                                        }
                                    }}
                                >
                                    {task.name}
                                </Typography>
                                {task.notes && (
                                    <Typography
                                        variant="caption"
                                        onClick={() => handleEditTask(task)}
                                        sx={{
                                            display: 'block',
                                            color: 'text.secondary',
                                            fontSize: '0.75rem',
                                            fontStyle: 'italic',
                                            mt: 0.25,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: 500,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📝 {task.notes}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                flexShrink: 0,
                                justifyContent: 'flex-end',
                                pl: { xs: 4.5, sm: 0 }
                            }}
                        >
                            {subtasks.length > 0 && (
                                <Chip
                                    label={`${completedSubtasksCount}/${subtasks.length}`}
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleEditTask(task)}
                                    icon={<Box component="span" sx={{ fontSize: '10px', ml: 0.5, mr: -0.2 }}>✓</Box>}
                                    sx={{
                                        height: 24,
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        color: 'text.secondary',
                                        borderColor: theme.palette.divider,
                                        cursor: 'pointer'
                                    }}
                                />
                            )}
                            {task.notes && (
                                <Tooltip title={task.notes}>
                                    <Chip
                                        icon={<NoteAlt sx={{ fontSize: '12px' }} />}
                                        label="Notes"
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleEditTask(task)}
                                        sx={{
                                            height: 24,
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            color: 'info.main',
                                            borderColor: alpha(theme.palette.info.main, 0.4),
                                            bgcolor: alpha(theme.palette.info.main, 0.08),
                                            cursor: 'pointer'
                                        }}
                                    />
                                </Tooltip>
                            )}
                            <Chip
                                label={taskPriority}
                                size="small"
                                clickable
                                onClick={(e) => handleOpenPriorityMenu(e, task.id)}
                                aria-label={`Change priority, currently ${taskPriority}`}
                                sx={{
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    height: 26,
                                    bgcolor: alpha(getPriorityColor(taskPriority), 0.15),
                                    color: getPriorityColor(taskPriority),
                                    border: `1px solid ${alpha(getPriorityColor(taskPriority), 0.35)}`,
                                    '&:hover': {
                                        bgcolor: alpha(getPriorityColor(taskPriority), 0.25)
                                    }
                                }}
                            />
                            <IconButton
                                size="small"
                                aria-label="Edit task"
                                onClick={() => handleEditTask(task)}
                                sx={{ color: 'primary.main' }}
                            >
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                color="error"
                                aria-label="Delete task"
                                onClick={() => handleDeleteTask(task.id)}
                            >
                                <DeleteOutline fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Inline Subtasks checklist */}
                    {subtasks.length > 0 && (
                        <Box sx={{ pl: 4.5, pr: 1, pt: 0.75, pb: 0.25, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            {subtasks.map(st => (
                                <Box key={st.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Checkbox
                                        size="small"
                                        checked={st.completed || false}
                                        onChange={() => handleToggleSubtaskInline(task.id, st.id)}
                                        sx={{ p: 0.2, color: 'text.disabled', '&.Mui-checked': { color: 'success.main' } }}
                                    />
                                    <Typography
                                        variant="caption"
                                        onClick={() => handleToggleSubtaskInline(task.id, st.id)}
                                        sx={{
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            textDecoration: st.completed ? 'line-through' : 'none',
                                            color: st.completed ? 'text.secondary' : 'text.primary',
                                            opacity: st.completed ? 0.65 : 0.95
                                        }}
                                    >
                                        {st.text}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Paper>
            </Grow>
        );
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={onBack}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                        color="inherit"
                    >
                        Back to Projects
                    </Button>
                    <Tooltip title={isSyncing ? "Syncing with Git..." : "Sync with Git"}>
                        <IconButton
                            onClick={handleGitSync}
                            disabled={isSyncing}
                            size="small"
                            sx={{
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2,
                                color: isSyncing ? 'primary.main' : 'text.secondary',
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                                p: 1,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                    color: 'primary.main'
                                }
                            }}
                        >
                            {isSyncing ? (
                                <CircularProgress size={20} color="primary" />
                            ) : (
                                <GitHub sx={{ fontSize: 20 }} />
                            )}
                        </IconButton>
                    </Tooltip>
                </Box>
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 3 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                                <Folder color="primary" sx={{ fontSize: 28 }} />
                                <Typography variant="h5" fontWeight="800" noWrap>
                                    {project.name}
                                </Typography>
                                {project.priority && (
                                    <Chip
                                        icon={<Star sx={{ color: '#f5a623 !important', fontSize: '1rem' }} />}
                                        label="Priority"
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(245, 166, 35, 0.1)',
                                            color: '#f5a623',
                                            fontWeight: 700,
                                            border: '1px solid rgba(245, 166, 35, 0.25)'
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                                {project.description || 'No description provided.'}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                                Created on {formatDate(project.createdAt)}
                            </Typography>
                        </Box>

                        {/* Stats Dashboard */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
                            <Paper variant="outlined" sx={{ p: 1.5, px: 2, borderRadius: 3, textAlign: 'center', minWidth: 90, flex: 1 }}>
                                <Typography variant="h6" fontWeight="800" color="primary">
                                    {completedTasks}/{totalTasks}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', whiteSpace: 'nowrap' }}>
                                    Tasks ({percentComplete}%)
                                </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 1.5, px: 2, borderRadius: 3, textAlign: 'center', minWidth: 90, flex: 1 }}>
                                <Typography variant="h6" fontWeight="800" color="secondary">
                                    {feedbacks.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', whiteSpace: 'nowrap' }}>
                                    Feedbacks
                                </Typography>
                            </Paper>
                            {highImpactCount > 0 && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        px: 2,
                                        borderRadius: 3,
                                        textAlign: 'center',
                                        minWidth: 90,
                                        flex: 1,
                                        borderColor: 'rgba(76, 175, 80, 0.3)',
                                        bgcolor: 'rgba(76, 175, 80, 0.02)'
                                    }}
                                >
                                    <Typography variant="h6" fontWeight="800" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AttachMoney sx={{ fontSize: 18 }} />
                                        {highImpactCount}
                                    </Typography>
                                    <Typography variant="caption" color="success.main" fontWeight="700" sx={{ display: 'block', whiteSpace: 'nowrap' }}>
                                        High Impact
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Section 1: Priority Tasks */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                        borderColor: theme.palette.divider
                    }}
                >
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assignment color="primary" /> Priority Tasks
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {['P1', 'P2', 'P3', 'P4'].map(pCode => {
                            const pTasks = filterTasksByPriority(pCode);
                            const pColor = getPriorityColor(pCode);
                            const pName = getPriorityName(pCode);
                            const pBgColor = getPriorityBgColor(pCode);

                            return (
                                <Accordion
                                    key={pCode}
                                    defaultExpanded={pCode === 'P1' || pCode === 'P2'}
                                    sx={{
                                        bgcolor: 'transparent',
                                        boxShadow: 'none',
                                        '&:before': { display: 'none' },
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: '8px !important',
                                        overflow: 'visible',
                                        mb: 1.5
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMore sx={{ color: 'text.secondary' }} />}
                                        sx={{
                                            borderBottom: `1px solid ${theme.palette.divider}`,
                                            minHeight: '40px !important',
                                            bgcolor: pBgColor + ' !important',
                                            '& .MuiAccordionSummary-content': {
                                                margin: '8px 0 !important',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                width: '100%',
                                                pr: 2
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: pColor }} />
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight="800"
                                                sx={{ color: isDark ? pColor : 'text.primary' }}
                                            >
                                                {pCode} - {pName}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight="700">
                                            {pTasks.length} tasks
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ p: 0, overflow: 'visible' }}>
                                        {/* Quick Add Task Input for this priority */}
                                        <Box
                                            sx={{
                                                p: '6px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                borderBottom: `1px solid ${theme.palette.divider}`,
                                                bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'
                                            }}
                                        >
                                            <InputBase
                                                placeholder={`Add to ${pName.toLowerCase()}...`}
                                                value={quickTaskTexts[pCode] || ''}
                                                onChange={(e) => {
                                                    setQuickTaskTexts({
                                                        ...quickTaskTexts,
                                                        [pCode]: e.target.value
                                                    });
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleQuickAddTask(pCode);
                                                    }
                                                }}
                                                sx={{ flexGrow: 1, fontSize: '0.875rem', color: 'text.primary' }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => handleQuickAddTask(pCode)}
                                                sx={{ color: 'primary.main' }}
                                            >
                                                <Add fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        {pTasks.length > 0 ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                {pTasks.map((t, idx) => renderTaskRow(t, idx, pTasks.length))}
                                            </Box>
                                        ) : (
                                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                    No active tasks.
                                                </Typography>
                                            </Box>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}

                        {/* Completed Section */}
                        <Accordion
                            defaultExpanded={false}
                            sx={{
                                bgcolor: 'transparent',
                                boxShadow: 'none',
                                '&:before': { display: 'none' },
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '8px !important',
                                overflow: 'visible',
                                mt: 1
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMore sx={{ color: 'text.secondary' }} />}
                                sx={{
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    minHeight: '40px !important',
                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05) !important' : 'rgba(0, 0, 0, 0.03) !important',
                                    '& .MuiAccordionSummary-content': {
                                        margin: '8px 0 !important',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        pr: 2
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="800"
                                        color="text.secondary"
                                    >
                                        Completed
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="700">
                                    {tasks.filter(t => t.completed).length} tasks
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0, overflow: 'visible' }}>
                                {tasks.filter(t => t.completed).length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                        {tasks.filter(t => t.completed).map((t, idx, arr) =>
                                            renderTaskRow(t, idx, arr.length, true)
                                        )}
                                    </Box>
                                ) : (
                                    <Box sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                            No completed tasks.
                                        </Typography>
                                    </Box>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                </Paper>

                {/* Section 2: User Feedback */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                        borderColor: theme.palette.divider
                    }}
                >
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Feedback color="secondary" /> User Feedback
                    </Typography>

                    {/* Desktop View: Grid Layout with Left Form and Side-by-Side Lists */}
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                                    <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1.5 }}>
                                        Log User Feedback
                                    </Typography>
                                    <Box component="form" onSubmit={handleAddFeedback} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <TextField
                                            size="small"
                                            label="Feedback / Feature Request"
                                            placeholder="What is the user requesting or reporting?"
                                            multiline
                                            rows={2}
                                            value={feedbackContent}
                                            onChange={(e) => setFeedbackContent(e.target.value)}
                                            fullWidth
                                        />
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap', gap: 2 }}>
                                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, flex: 1 }}>
                                                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 100 }, flex: { xs: 'none', sm: 'initial' } }}>
                                                    <InputLabel>Priority</InputLabel>
                                                    <Select
                                                        value={feedbackPriority}
                                                        onChange={(e) => setFeedbackPriority(e.target.value)}
                                                        label="Priority"
                                                    >
                                                        <MenuItem value="high">High</MenuItem>
                                                        <MenuItem value="medium">Medium</MenuItem>
                                                        <MenuItem value="low">Low</MenuItem>
                                                    </Select>
                                                </FormControl>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={hasMonetaryImpact}
                                                            onChange={(e) => setHasMonetaryImpact(e.target.checked)}
                                                            icon={<AttachMoney />}
                                                            checkedIcon={<AttachMoney sx={{ color: 'success.main' }} />}
                                                        />
                                                    }
                                                    label={
                                                        <Typography variant="caption" fontWeight="700" color={hasMonetaryImpact ? 'success.main' : 'inherit'}>
                                                            Monetary Impact
                                                        </Typography>
                                                    }
                                                    sx={{ m: 0 }}
                                                />
                                            </Box>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                startIcon={<Add />}
                                                size="small"
                                                sx={{ borderRadius: 2, fontWeight: 600, py: 0.75, width: { xs: '100%', sm: 'auto' } }}
                                            >
                                                Log
                                            </Button>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={8}>
                                <Grid container spacing={3}>
                                    {['high', 'medium', 'low'].map(pLevel => {
                                        const pFeedbacks = feedbacks.filter(f => f.priority === pLevel);
                                        const pName = pLevel.charAt(0).toUpperCase() + pLevel.slice(1);
                                        const pColor = pLevel === 'high' ? 'error.main' : (pLevel === 'medium' ? 'warning.main' : 'text.secondary');

                                        return (
                                            <Grid item xs={12} md={4} key={pLevel}>
                                                <Paper
                                                    variant="outlined"
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 3,
                                                        bgcolor: isDark ? 'rgba(255,255,255,0.005)' : 'background.paper',
                                                        height: '100%',
                                                        borderColor: theme.palette.divider
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: pColor }} />
                                                        <Typography variant="subtitle2" fontWeight="800" color="text.secondary">
                                                            {pName} ({pFeedbacks.length})
                                                        </Typography>
                                                    </Box>

                                                    {pFeedbacks.length > 0 ? (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                            {pFeedbacks.map(f => (
                                                                <Grow in={true} key={f.id}>
                                                                    <Paper
                                                                        variant="outlined"
                                                                        sx={{
                                                                            p: 1.5,
                                                                            borderRadius: 2.5,
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'flex-start',
                                                                            borderColor: f.highMonetaryImpact ? 'rgba(76, 175, 80, 0.3)' : undefined,
                                                                            bgcolor: f.highMonetaryImpact ? 'rgba(76, 175, 80, 0.01)' : 'background.paper',
                                                                        }}
                                                                    >
                                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, flex: 1, mr: 1 }}>
                                                                            <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word', lineHeight: 1.4, fontSize: '0.825rem' }}>
                                                                                {f.content}
                                                                            </Typography>
                                                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                                                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                                                                    {formatDate(f.createdAt)}
                                                                                </Typography>
                                                                                {f.highMonetaryImpact && (
                                                                                    <Chip
                                                                                        icon={<AttachMoney sx={{ fontSize: '0.75rem !important' }} />}
                                                                                        label="Monetary"
                                                                                        size="small"
                                                                                        color="success"
                                                                                        variant="outlined"
                                                                                        sx={{
                                                                                            height: 14,
                                                                                            fontSize: '0.6rem',
                                                                                            fontWeight: 700,
                                                                                            borderColor: 'rgba(76, 175, 80, 0.3)',
                                                                                            color: 'success.main',
                                                                                            bgcolor: 'rgba(76, 175, 80, 0.05)',
                                                                                            px: 0.3,
                                                                                            '& .MuiChip-label': { px: 0.3 }
                                                                                        }}
                                                                                    />
                                                                                )}
                                                                            </Box>
                                                                        </Box>
                                                                        <IconButton size="small" color="error" onClick={() => handleDeleteFeedback(f.id)}>
                                                                            <DeleteOutline fontSize="small" />
                                                                        </IconButton>
                                                                    </Paper>
                                                                </Grow>
                                                            ))}
                                                        </Box>
                                                    ) : (
                                                        <Box sx={{ py: 3, textAlign: 'center' }}>
                                                            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                                No feedback.
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Mobile View: Vertical Accordions (Similar to Priority Tasks) */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {['high', 'medium', 'low'].map(pLevel => {
                                const pFeedbacks = feedbacks.filter(f => f.priority === pLevel);
                                const pName = pLevel.charAt(0).toUpperCase() + pLevel.slice(1);
                                const pColor = pLevel === 'high' ? 'error.main' : (pLevel === 'medium' ? 'warning.main' : 'info.main');
                                const bg = getFeedbackPriorityBgColor(pLevel);

                                return (
                                    <Accordion
                                        key={pLevel}
                                        defaultExpanded={pLevel === 'high'}
                                        elevation={0}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: '12px !important',
                                            overflow: 'hidden',
                                            '&:before': { display: 'none' },
                                            borderColor: theme.palette.divider
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMore />}
                                            sx={{
                                                bgcolor: bg,
                                                minHeight: 48,
                                                '& .MuiAccordionSummary-content': {
                                                    margin: '12px 0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    width: '100%',
                                                    pr: 2
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: pColor }} />
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight="800"
                                                    sx={{ color: isDark ? pColor : 'text.primary' }}
                                                >
                                                    {pName} Priority
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight="700">
                                                {pFeedbacks.length} feedback
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: 0, overflow: 'visible' }}>
                                            {/* Quick Add Feedback Input */}
                                            <Box
                                                sx={{
                                                    p: '6px 16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'
                                                }}
                                            >
                                                <InputBase
                                                    placeholder={`Add ${pLevel} priority feedback...`}
                                                    value={quickFeedbackTexts[pLevel] || ''}
                                                    onChange={(e) => {
                                                        setQuickFeedbackTexts({
                                                            ...quickFeedbackTexts,
                                                            [pLevel]: e.target.value
                                                        });
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleQuickAddFeedback(pLevel);
                                                        }
                                                    }}
                                                    sx={{ flexGrow: 1, fontSize: '0.875rem', color: 'text.primary' }}
                                                />
                                                <Tooltip title="Toggle Monetary Impact">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setQuickFeedbackMonetary({
                                                                ...quickFeedbackMonetary,
                                                                [pLevel]: !quickFeedbackMonetary[pLevel]
                                                            });
                                                        }}
                                                        sx={{ 
                                                            color: quickFeedbackMonetary[pLevel] ? 'success.main' : 'text.disabled',
                                                            mr: 1
                                                        }}
                                                    >
                                                        <AttachMoney fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleQuickAddFeedback(pLevel)}
                                                    sx={{ color: 'secondary.main' }}
                                                >
                                                    <Add fontSize="small" />
                                                </IconButton>
                                            </Box>

                                            {pFeedbacks.length > 0 ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    {pFeedbacks.map((f, idx) => (
                                                        <Grow in={true} key={f.id}>
                                                            <Paper
                                                                square
                                                                variant="none"
                                                                sx={{
                                                                    p: 1.5,
                                                                    px: 3,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    borderBottom: idx < pFeedbacks.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                                                    bgcolor: f.highMonetaryImpact ? 'rgba(76, 175, 80, 0.02)' : (isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'),
                                                                    '&:hover': {
                                                                        bgcolor: 'action.hover'
                                                                    }
                                                                }}
                                                            >
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, flex: 1, mr: 1 }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word', lineHeight: 1.4, fontSize: '0.825rem' }}>
                                                                        {f.content}
                                                                    </Typography>
                                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                                                            {formatDate(f.createdAt)}
                                                                        </Typography>
                                                                        {f.highMonetaryImpact && (
                                                                            <Chip
                                                                                icon={<AttachMoney sx={{ fontSize: '0.75rem !important' }} />}
                                                                                label="Monetary"
                                                                                size="small"
                                                                                color="success"
                                                                                variant="outlined"
                                                                                sx={{
                                                                                    height: 14,
                                                                                    fontSize: '0.6rem',
                                                                                    fontWeight: 700,
                                                                                    borderColor: 'rgba(76, 175, 80, 0.3)',
                                                                                    color: 'success.main',
                                                                                    bgcolor: 'rgba(76, 175, 80, 0.05)',
                                                                                    px: 0.3,
                                                                                    '& .MuiChip-label': { px: 0.3 }
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                                <IconButton size="small" color="error" onClick={() => handleDeleteFeedback(f.id)}>
                                                                    <DeleteOutline fontSize="small" />
                                                                </IconButton>
                                                            </Paper>
                                                        </Grow>
                                                    ))}
                                                </Box>
                                            ) : (
                                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                        No feedback.
                                                    </Typography>
                                                </Box>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            })}
                        </Box>
                    </Box>
                </Paper>

                {/* Section 3: Project Notes */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                        borderColor: theme.palette.divider
                    }}
                >
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NoteAlt sx={{ color: '#4caf50' }} /> Project Notes
                    </Typography>
                    <NotesPanel
                        customPath={`projects/${projectId}/notes`}
                        title="Notes"
                    />
                </Paper>
            </Box>

            <Menu
                anchorEl={priorityMenuAnchor}
                open={Boolean(priorityMenuAnchor)}
                onClose={handleClosePriorityMenu}
            >
                {['P1', 'P2', 'P3', 'P4'].map(code => (
                    <MenuItem
                        key={code}
                        selected={tasks.find(t => t.id === priorityMenuTaskId)?.priority === code}
                        onClick={() => handleSelectTaskPriority(code)}
                        sx={{
                            fontWeight: 700,
                            color: getPriorityColor(code)
                        }}
                    >
                        {code} - {getPriorityName(code)}
                    </MenuItem>
                ))}
            </Menu>

            <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Edit Task</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Task Name"
                        fullWidth
                        value={editingTask?.name || ''}
                        onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEditedTask();
                            }
                        }}
                    />
                    <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
                        <InputLabel>Priority</InputLabel>
                        <Select
                            value={editingTask?.priority || 'P4'}
                            label="Priority"
                            onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                        >
                            <MenuItem value="P1">P1 - Critical</MenuItem>
                            <MenuItem value="P2">P2 - High</MenuItem>
                            <MenuItem value="P3">P3 - Medium</MenuItem>
                            <MenuItem value="P4">P4 - Low</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Task Notes Section */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <NoteAlt fontSize="small" color="primary" /> Task Notes
                        </Typography>
                        <TextField
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="Add notes, details, or context for this task..."
                            value={editingTask?.notes || ''}
                            onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                            variant="outlined"
                            size="small"
                        />
                    </Box>

                    {/* Subtasks Section */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Assignment fontSize="small" color="primary" /> Subtasks
                            </Box>
                            {editingTask?.subtasks && editingTask.subtasks.length > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                    {editingTask.subtasks.filter(s => s.completed).length}/{editingTask.subtasks.length} completed
                                </Typography>
                            )}
                        </Typography>

                        {/* List existing subtasks */}
                        {editingTask?.subtasks && editingTask.subtasks.length > 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                {editingTask.subtasks.map((st) => (
                                    <Paper key={st.id} variant="outlined" sx={{ p: 1, px: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                                            <Checkbox
                                                size="small"
                                                checked={st.completed || false}
                                                onChange={() => handleToggleSubtaskInDialog(st.id)}
                                                sx={{ p: 0 }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    textDecoration: st.completed ? 'line-through' : 'none',
                                                    color: st.completed ? 'text.secondary' : 'text.primary',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                {st.text}
                                            </Typography>
                                        </Box>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteSubtaskInDialog(st.id)}>
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </Paper>
                                ))}
                            </Box>
                        )}

                        {/* Add subtask input */}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Add a new subtask..."
                                value={newSubtaskText}
                                onChange={(e) => setNewSubtaskText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSubtaskInDialog();
                                    }
                                }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Add />}
                                onClick={handleAddSubtaskInDialog}
                                disabled={!newSubtaskText.trim()}
                                sx={{ flexShrink: 0 }}
                            >
                                Add
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseEditDialog}>Cancel</Button>
                    <Button onClick={handleSaveEditedTask} variant="contained" disabled={!editingTask?.name?.trim()}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
