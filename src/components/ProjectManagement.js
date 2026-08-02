import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    IconButton,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    Checkbox,
    FormControlLabel,
    useTheme,
    Collapse,
    Grow
} from '@mui/material';
import {
    Star,
    StarBorder,
    Archive,
    Unarchive,
    Delete,
    FolderSpecial,
    AddCircleOutline,
    Close,
    InfoOutlined,
    Assignment,
    ExpandMore,
    ExpandLess
} from '@mui/icons-material';
import { useFirestore } from '../hooks/useFirestore';

export default function ProjectManagement({ onProjectClick }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // State for projects
    const [projects, setProjects] = useFirestore('projects', []);

    // Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPriority, setIsPriority] = useState(false);
    const [formError, setFormError] = useState('');

    // Accordion State (Archived collapsed by default)
    const [archivedExpanded, setArchivedExpanded] = useState(false);

    // Modal States
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);

    // Filter projects
    const priorityProjects = projects.filter(p => p.priority && !p.archived);
    const normalProjects = projects.filter(p => !p.priority && !p.archived);
    const archivedProjects = projects.filter(p => p.archived);

    // Form Submission
    const handleAddProject = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setFormError('Project name is required');
            return;
        }

        const newProject = {
            id: Date.now().toString(),
            name: name.trim(),
            description: description.trim(),
            priority: isPriority,
            archived: false,
            createdAt: new Date().toISOString()
        };

        setProjects([...projects, newProject]);

        // Reset fields
        setName('');
        setDescription('');
        setIsPriority(false);
        setFormError('');
        setShowAddForm(false);
    };

    // Actions
    const togglePriority = (id, event) => {
        event.stopPropagation();
        setProjects(prev => prev.map(p =>
            p.id === id ? { ...p, priority: !p.priority } : p
        ));
    };

    const toggleArchive = (id, event) => {
        event.stopPropagation();
        setProjects(prev => prev.map(p =>
            p.id === id ? { ...p, archived: !p.archived } : p
        ));
    };

    const handleDeleteClick = (project, event) => {
        event.stopPropagation();
        setProjectToDelete(project);
    };

    const confirmDelete = () => {
        if (projectToDelete) {
            setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
            setProjectToDelete(null);
        }
    };

    // Helper to format date
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

    // Empty state component
    const EmptyState = ({ message }) => (
        <Paper
            variant="outlined"
            sx={{
                p: 3,
                textAlign: 'center',
                bgcolor: 'background.paper',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: 'divider',
                borderRadius: 3,
                opacity: 0.7
            }}
        >
            <Assignment sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
                {message}
            </Typography>
        </Paper>
    );

    // Render a single project row
    const ProjectRow = ({ project, borderCol, accentColor, hoverShadow, actions }) => (
        <Card
            onClick={() => onProjectClick ? onProjectClick(project.id) : setSelectedProject(project)}
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                border: `1px solid ${borderCol}`,
                borderRadius: 3,
                position: 'relative',
                p: 2,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: hoverShadow,
                    borderColor: accentColor
                }
            }}
        >
            {/* Star left accent border for priority projects */}
            {project.priority && !project.archived && (
                <Box
                    sx={{
                        width: 4,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        bgcolor: accentColor,
                        borderTopLeftRadius: 12,
                        borderBottomLeftRadius: 12
                    }}
                />
            )}

            <Box sx={{ flexGrow: 1, minWidth: 0, mr: 2, pl: project.priority && !project.archived ? 1.5 : 0.5 }}>
                <Typography
                    variant="subtitle1"
                    fontWeight="700"
                    color="text.primary"
                    noWrap
                    sx={{ textDecoration: project.archived ? 'line-through' : 'none' }}
                >
                    {project.name}
                </Typography>
                {project.description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ mt: 0.25 }}
                    >
                        {project.description}
                    </Typography>
                )}
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                    Created: {formatDate(project.createdAt)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                {actions}
            </Box>
        </Card>
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
            {/* Header section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FolderSpecial color="primary" sx={{ fontSize: 36 }} />
                        Project Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Organize and prioritize your active and archived goals.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutline />}
                    onClick={() => setShowAddForm(!showAddForm)}
                    sx={{
                        borderRadius: 3,
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                        transition: 'all 0.2s',
                        '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)'
                        }
                    }}
                >
                    {showAddForm ? 'Cancel' : 'New Project'}
                </Button>
            </Box>

            {/* Collapsible Add Project Form */}
            <Collapse in={showAddForm}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 4,
                        borderRadius: 4,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.01)',
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Typography variant="h6" fontWeight="700" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AddCircleOutline color="primary" /> Add New Project
                    </Typography>
                    
                    <Box component="form" onSubmit={handleAddProject} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            fullWidth
                            label="Project Name"
                            placeholder="e.g. Launch Product Campaign"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (e.target.value) setFormError('');
                            }}
                            error={!!formError}
                            helperText={formError}
                            variant="outlined"
                            InputProps={{
                                sx: { borderRadius: 3 }
                            }}
                        />
                        
                        <TextField
                            fullWidth
                            label="Description (Optional)"
                            placeholder="Describe project scope, goals, and key results..."
                            multiline
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            variant="outlined"
                            InputProps={{
                                sx: { borderRadius: 3 }
                            }}
                        />
                        
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            flexWrap: 'wrap', 
                            gap: 2, 
                            mt: 1,
                            pt: 2,
                            borderTop: `1px solid ${theme.palette.divider}`
                        }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isPriority}
                                        onChange={(e) => setIsPriority(e.target.checked)}
                                        icon={<StarBorder />}
                                        checkedIcon={<Star sx={{ color: '#f5a623' }} />}
                                        sx={{
                                            color: '#f5a623',
                                            '&.Mui-checked': {
                                                color: '#f5a623',
                                            }
                                        }}
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <Typography variant="body2" fontWeight="700">Priority Project</Typography>
                                        <Typography variant="caption" color="text.secondary">Places this project in the top priority shelf</Typography>
                                    </Box>
                                }
                                sx={{ m: 0 }}
                            />
                            
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => setShowAddForm(false)} 
                                    sx={{ 
                                        borderRadius: 3,
                                        px: 3,
                                        fontWeight: 600
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="contained" 
                                    sx={{ 
                                        borderRadius: 3,
                                        px: 3,
                                        fontWeight: 600,
                                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)'
                                    }}
                                >
                                    Create Project
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Collapse>

            {/* Sections */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* 1. Priority Projects */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Star sx={{ color: '#f5a623' }} />
                        <Typography variant="h6" fontWeight="700">
                            Priority Projects ({priorityProjects.length})
                        </Typography>
                    </Box>
                    {priorityProjects.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {priorityProjects.map(project => (
                                <Grow in={true} key={project.id}>
                                    <Box>
                                        <ProjectRow
                                            project={project}
                                            borderCol="rgba(245, 166, 35, 0.3)"
                                            accentColor="#f5a623"
                                            hoverShadow="0 4px 14px rgba(245, 166, 35, 0.12)"
                                            actions={
                                                <>
                                                    <Tooltip title="Toggle Priority">
                                                        <IconButton size="small" onClick={(e) => togglePriority(project.id, e)}>
                                                            <Star sx={{ color: '#f5a623' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Archive Project">
                                                        <IconButton size="small" onClick={(e) => toggleArchive(project.id, e)}>
                                                            <Archive fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Project">
                                                        <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(project, e)}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            }
                                        />
                                    </Box>
                                </Grow>
                            ))}
                        </Box>
                    ) : (
                        <EmptyState message="No priority projects. Flag important projects to keep them top-of-mind." />
                    )}
                </Box>

                {/* 2. Normal Projects */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Assignment color="primary" />
                        <Typography variant="h6" fontWeight="700">
                            Normal Projects ({normalProjects.length})
                        </Typography>
                    </Box>
                    {normalProjects.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {normalProjects.map(project => (
                                <Grow in={true} key={project.id}>
                                    <Box>
                                        <ProjectRow
                                            project={project}
                                            borderCol={theme.palette.divider}
                                            accentColor={theme.palette.primary.main}
                                            hoverShadow="0 4px 14px rgba(0, 0, 0, 0.05)"
                                            actions={
                                                <>
                                                    <Tooltip title="Toggle Priority">
                                                        <IconButton size="small" onClick={(e) => togglePriority(project.id, e)}>
                                                            <StarBorder />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Archive Project">
                                                        <IconButton size="small" onClick={(e) => toggleArchive(project.id, e)}>
                                                            <Archive fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Project">
                                                        <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(project, e)}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            }
                                        />
                                    </Box>
                                </Grow>
                            ))}
                        </Box>
                    ) : (
                        <EmptyState message="No active normal projects. Add a project to start planning." />
                    )}
                </Box>

                {/* 3. Archived Projects */}
                <Box>
                    <Box
                        onClick={() => setArchivedExpanded(!archivedExpanded)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            mb: 2,
                            userSelect: 'none',
                            p: 1,
                            borderRadius: 2,
                            transition: 'background-color 0.2s',
                            '&:hover': { bgcolor: theme.palette.action.hover }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Archive sx={{ color: 'text.disabled' }} />
                            <Typography variant="h6" fontWeight="700" color="text.secondary">
                                Archived Projects ({archivedProjects.length})
                            </Typography>
                        </Box>
                        {archivedExpanded ? <ExpandLess sx={{ color: 'text.secondary' }} /> : <ExpandMore sx={{ color: 'text.secondary' }} />}
                    </Box>
                    <Collapse in={archivedExpanded}>
                        {archivedProjects.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                                {archivedProjects.map(project => (
                                    <Grow in={true} key={project.id}>
                                        <Box sx={{ opacity: 0.65 }}>
                                            <ProjectRow
                                                project={project}
                                                borderCol={theme.palette.divider}
                                                accentColor={theme.palette.text.disabled}
                                                hoverShadow="0 2px 8px rgba(0, 0, 0, 0.03)"
                                                actions={
                                                    <>
                                                        <Tooltip title="Restore Project">
                                                            <IconButton size="small" color="primary" onClick={(e) => toggleArchive(project.id, e)}>
                                                                <Unarchive fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Project">
                                                            <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(project, e)}>
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                }
                                            />
                                        </Box>
                                    </Grow>
                                ))}
                            </Box>
                        ) : (
                            <EmptyState message="No archived projects. Completed or paused projects will show up here." />
                        )}
                    </Collapse>
                </Box>
            </Box>

            {/* Dialog: Project Details */}
            <Dialog
                open={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, p: 1 }
                }}
            >
                {selectedProject && (
                    <>
                        <DialogTitle sx={{ pr: 6, position: 'relative', fontWeight: 800 }}>
                            {selectedProject.name}
                            <IconButton
                                onClick={() => setSelectedProject(null)}
                                sx={{
                                    position: 'absolute',
                                    right: 12,
                                    top: 12,
                                    color: 'text.secondary'
                                }}
                            >
                                <Close />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" color="text.disabled" display="block">
                                    CREATED ON
                                </Typography>
                                <Typography variant="body2" fontWeight="500" sx={{ mb: 2 }}>
                                    {formatDate(selectedProject.createdAt)}
                                </Typography>

                                <Typography variant="caption" color="text.disabled" display="block">
                                    STATUS / CATEGORY
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 2 }}>
                                    {selectedProject.priority && !selectedProject.archived && (
                                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(245, 166, 35, 0.1)', color: '#f5a623', fontSize: '0.75rem', fontWeight: 700 }}>
                                            Priority Project
                                        </Box>
                                    )}
                                    {!selectedProject.priority && !selectedProject.archived && (
                                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(25, 118, 210, 0.1)', color: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>
                                            Normal Project
                                        </Box>
                                    )}
                                    {selectedProject.archived && (
                                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(0, 0, 0, 0.08)', color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700 }}>
                                            Archived Project
                                        </Box>
                                    )}
                                </Box>

                                <Typography variant="caption" color="text.disabled" display="block">
                                    DESCRIPTION
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                                    {selectedProject.description || 'No description provided.'}
                                </Typography>
                            </Box>

                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    display: 'flex',
                                    gap: 1.5,
                                    alignItems: 'center',
                                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(25, 118, 210, 0.03)',
                                    borderColor: isDark ? 'divider' : 'rgba(25, 118, 210, 0.15)'
                                }}
                            >
                                <InfoOutlined color="primary" sx={{ fontSize: 20 }} />
                                <Typography variant="caption" color="text.secondary">
                                    Project details view will be implemented in the future. Add tasks, timelines, and updates here later.
                                </Typography>
                            </Paper>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2 }}>
                            <Button onClick={() => setSelectedProject(null)} variant="outlined" sx={{ borderRadius: 2 }}>
                                Close
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Dialog: Confirm Delete */}
            <Dialog
                open={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Delete Project?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete project "{projectToDelete?.name}"? All project settings will be permanently lost. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setProjectToDelete(null)} variant="outlined" sx={{ borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: 2 }} autoFocus>
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
