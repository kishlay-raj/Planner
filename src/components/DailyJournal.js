import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    IconButton,
    Button,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    NavigateBefore,
    NavigateNext,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    WbSunny,
    NightsStay,
    SelfImprovement,
    PhonelinkOff,
    Psychology,
    TrackChanges
} from '@mui/icons-material';
import { format, addDays, subDays } from 'date-fns';
import { useTheme } from '@mui/material/styles';

// Default prompts as requested
const DEFAULT_PROMPTS = [
    { id: '1', section: 'Morning', text: 'Who is the person I want to become today? (e.g., "I am a focused writer," "I am a calm parent.")' },
    { id: '2', section: 'Morning', text: 'The "Big Rock": What is the one thing I must accomplish today to feel satisfied?' },
    { id: '3', section: 'Morning', text: 'The Obstacle: What is most likely to distract me today, and how will I handle it?' },
    { id: '4', section: 'Deep Work', text: 'The Depth Ratio: How many hours of actual Deep Work did I achieve today versus "Shallow Work" (emails, meetings, admin)? Was this ratio acceptable?' },
    { id: '5', section: 'Deep Work', text: 'The Distraction Autopsy: When I lost focus today, what was the trigger? Was it internal (boredom) or external (notifications)?' },
    { id: '6', section: 'Deep Work', text: 'The Skill Builder: What specifically did I do today to become better at my craft? Did I stretch my abilities?' },
    { id: '7', section: 'Deep Work', text: 'Rare & Valuable: Am I doing work that is easy to replicate, or am I building skills that are rare and valuable?' },
    { id: '8', section: 'Deep Work', text: 'The Roosevelt Dash: If I had to finish my work in half the time today, what would I have ignored?' },
    { id: '9', section: 'Digital Minimalism', text: 'The Solitude Check: Did I spend any time today alone with my own thoughts, free from inputs (no podcasts, no music, no scrolling)?' },
    { id: '10', section: 'Digital Minimalism', text: 'The Tech Audit: Did I use technology as a tool to support my values today, or did I use it as a pacifier to avoid boredom?' },
    { id: '11', section: 'Digital Minimalism', text: 'The "Default" Test: Which apps or sites did I open unconsciously today? What feeling was I trying to numb?' },
    { id: '12', section: 'Behavioral Triggers', text: 'The Numbing Agent: When I started wasting time today, what feeling was I trying to avoid? (Anxiety, boredom, fear of a hard task, loneliness?)' },
    { id: '13', section: 'Behavioral Triggers', text: 'The Environmental Leak: What physical cue triggered my biggest distraction today? (e.g., "My phone was face up on the desk," "The TV remote was next to me").' },
    { id: '14', section: 'Behavioral Triggers', text: 'The Transition Trap: Did I lose time during a task, or between tasks? (Most time is wasted in the "transition moments" just after finishing one thing and before starting the next).' },
    { id: '15', section: 'Evening', text: 'Review: What is one system I can tweak to make tomorrow 1% easier?' },
    { id: '16', section: 'Evening', text: '3 Amazing things that happened today.' },
    { id: '17', section: 'Evening', text: 'How could I have made today even better?' }
];

function DailyJournal() {
    const theme = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());

    // State for prompts configuration
    const [prompts, setPrompts] = useFirestore('journalPrompts', DEFAULT_PROMPTS);

    // State for journal entries (answers)
    const [journalData, setJournalData] = useFirestore('dailyJournalData', {});

    // Edit Prompts Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newPromptText, setNewPromptText] = useState('');
    const [newPromptSection, setNewPromptSection] = useState('Morning');

    // Migration & Deduplication: Ensure new sections exist and remove duplicates
    useEffect(() => {
        setPrompts(currentPrompts => {
            let updatedPrompts = [...currentPrompts];
            let changed = false;

            // 1. Add missing sections/prompts
            const hasDeepWork = updatedPrompts.some(p => p.section === 'Deep Work');
            const hasDigitalMinimalism = updatedPrompts.some(p => p.section === 'Digital Minimalism');
            const hasBehavioralTriggers = updatedPrompts.some(p => p.section === 'Behavioral Triggers');

            if (!hasDeepWork || !hasDigitalMinimalism || !hasBehavioralTriggers) {
                const newDefaults = DEFAULT_PROMPTS.filter(dp =>
                    (dp.section === 'Deep Work' && !hasDeepWork) ||
                    (dp.section === 'Digital Minimalism' && !hasDigitalMinimalism) ||
                    (dp.section === 'Behavioral Triggers' && !hasBehavioralTriggers)
                );
                if (newDefaults.length > 0) {
                    updatedPrompts = [...updatedPrompts, ...newDefaults];
                    changed = true;
                }
            }

            // 2. Remove duplicates
            const unique = [];
            const seen = new Set();
            for (const p of updatedPrompts) {
                if (!seen.has(p.text)) {
                    seen.add(p.text);
                    unique.push(p);
                } else {
                    changed = true; // Found a duplicate
                }
            }

            return changed ? unique : currentPrompts;
        });
    }, []);



    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const currentEntry = journalData[dateKey] || { responses: {}, notes: '' };

    const handleResponseChange = (promptId, value) => {
        setJournalData(prev => ({
            ...prev,
            [dateKey]: {
                ...currentEntry,
                responses: {
                    ...currentEntry.responses,
                    [promptId]: value
                }
            }
        }));
    };

    const handleNotesChange = (value) => {
        setJournalData(prev => ({
            ...prev,
            [dateKey]: {
                ...currentEntry,
                notes: value
            }
        }));
    };

    const handleAddPrompt = () => {
        if (!newPromptText.trim()) return;
        const newId = Date.now().toString();
        setPrompts([...prompts, { id: newId, text: newPromptText, section: newPromptSection }]);
        setNewPromptText('');
    };

    const handleDeletePrompt = (id) => {
        setPrompts(prompts.filter(p => p.id !== id));
    };

    const getSectionConfig = (sectionName) => {
        switch (sectionName) {
            case 'Morning': return { icon: WbSunny, color: '#FFB74D', borderColor: '#FFB74D' }; // Warm Orange
            case 'Evening': return { icon: NightsStay, color: '#5C6BC0', borderColor: '#5C6BC0' }; // Indigo
            case 'Deep Work': return { icon: Psychology, color: '#29B6F6', borderColor: '#29B6F6' }; // Light Blue
            case 'Digital Minimalism': return { icon: PhonelinkOff, color: '#26A69A', borderColor: '#26A69A' }; // Teal
            case 'Behavioral Triggers': return { icon: TrackChanges, color: '#EF5350', borderColor: '#EF5350' }; // Red
            default: return { icon: SelfImprovement, color: theme.palette.text.secondary, borderColor: theme.palette.divider };
        }
    };

    const renderSection = (sectionName) => {
        const sectionPrompts = prompts.filter(p => p.section === sectionName);
        const config = getSectionConfig(sectionName);
        const Icon = config.icon;

        return (
            <Paper sx={{
                p: 4,
                mb: 4,
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: 'none',
                border: `1px solid ${theme.palette.divider}`,
                borderTop: `3px solid ${config.borderColor}`
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Icon sx={{ color: config.color, mr: 2, fontSize: 24, opacity: 0.9 }} />
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                        {sectionName} Reflection
                    </Typography>
                </Box>

                {sectionPrompts.length === 0 && (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', opacity: 0.7 }}>
                        No prompts configured for this section.
                    </Typography>
                )}

                {sectionPrompts.map(prompt => (
                    <Box key={prompt.id} sx={{ mb: 4 }}>
                        <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 1.5, fontSize: '0.95rem' }}>
                            {prompt.text}
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            placeholder="Type here..."
                            value={currentEntry.responses[prompt.id] || ''}
                            onChange={(e) => handleResponseChange(prompt.id, e.target.value)}
                            variant="standard"
                            InputProps={{
                                disableUnderline: true
                            }}
                            sx={{
                                bgcolor: 'transparent',
                                '& .MuiInputBase-root': {
                                    fontSize: '1rem',
                                    color: theme.palette.text.secondary,
                                    lineHeight: 1.6,
                                    padding: 0
                                }
                            }}
                        />
                        <Divider sx={{ mt: 1.5, borderColor: theme.palette.divider, opacity: 0.6 }} />
                    </Box>
                ))}
            </Paper>
        );
    };

    return (
        <Box sx={{ p: 4, height: '100vh', overflow: 'auto', bgcolor: theme.palette.background.default }}>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                <Box>
                    <Typography variant="h3" sx={{ color: theme.palette.text.primary, fontWeight: 800, letterSpacing: '-1px', mb: 0.5 }}>
                        Daily Journal
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        Capture your day, shape your life.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        startIcon={<EditIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => setIsEditDialogOpen(true)}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            color: theme.palette.text.secondary,
                            borderColor: theme.palette.divider,
                            '&:hover': { borderColor: theme.palette.text.secondary, bgcolor: 'transparent' }
                        }}
                    >
                        Customize Prompts
                    </Button>

                    <Paper sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 0.5,
                        px: 1,
                        borderRadius: 8,
                        boxShadow: 'none',
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.background.paper
                    }}>
                        <IconButton onClick={() => setCurrentDate(subDays(currentDate, 1))} size="small">
                            <NavigateBefore sx={{ color: theme.palette.text.secondary }} />
                        </IconButton>
                        <Box sx={{ textAlign: 'center', minWidth: 160 }}>
                            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600, lineHeight: 1.2, fontSize: '1rem' }}>
                                {format(currentDate, 'MMMM d, yyyy')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                                {format(currentDate, 'EEEE')}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setCurrentDate(addDays(currentDate, 1))} size="small">
                            <NavigateNext sx={{ color: theme.palette.text.secondary }} />
                        </IconButton>
                    </Paper>
                </Box>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    {renderSection('Morning')}
                    {renderSection('Deep Work')}
                </Grid>
                <Grid item xs={12} md={6}>
                    {renderSection('Evening')}
                    {renderSection('Digital Minimalism')}
                    {renderSection('Behavioral Triggers')}
                </Grid>
            </Grid>

            {/* Freeform Notes */}
            <Paper sx={{
                p: 4,
                mb: 10,
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: 'none',
                border: `1px solid ${theme.palette.divider}`,
                borderTop: `3px solid ${theme.palette.primary.main}`
            }}>
                <Typography variant="h6" sx={{ mb: 3, color: theme.palette.text.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.5px' }}>
                    <EditIcon fontSize="small" sx={{ opacity: 0.7 }} /> notes & brain dump
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    minRows={6}
                    placeholder="Type here..."
                    value={currentEntry.notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    variant="standard"
                    InputProps={{
                        disableUnderline: true
                    }}
                    sx={{
                        bgcolor: 'transparent',
                        '& .MuiInputBase-root': {
                            fontSize: '0.95rem',
                            color: theme.palette.text.secondary,
                            lineHeight: 1.6,
                            padding: 0
                        }
                    }}
                />
            </Paper>

            {/* Edit Prompts Dialog */}
            <Dialog
                open={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Customize Journal Prompts</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        {/* Add New Prompt */}
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, bgcolor: 'action.hover', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <TextField
                                    fullWidth
                                    label="New Prompt Question"
                                    value={newPromptText}
                                    onChange={(e) => setNewPromptText(e.target.value)}
                                    size="small"
                                />
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Section</InputLabel>
                                    <Select
                                        value={newPromptSection}
                                        label="Section"
                                        onChange={(e) => setNewPromptSection(e.target.value)}
                                    >
                                        <MenuItem value="Morning">Morning</MenuItem>
                                        <MenuItem value="Deep Work">Deep Work</MenuItem>
                                        <MenuItem value="Digital Minimalism">Digital Minimalism</MenuItem>
                                        <MenuItem value="Behavioral Triggers">Behavioral Triggers</MenuItem>
                                        <MenuItem value="Evening">Evening</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddPrompt}
                                    disabled={!newPromptText.trim()}
                                >
                                    Add
                                </Button>
                            </Paper>
                        </Grid>

                        {/* List Existing Prompts */}
                        <Grid item xs={12}>
                            <List>
                                {prompts.map(prompt => (
                                    <React.Fragment key={prompt.id}>
                                        <ListItem>
                                            <ListItemText
                                                primary={prompt.text}
                                                secondary={prompt.section}
                                                primaryTypographyProps={{ fontWeight: 500 }}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton edge="end" aria-label="delete" onClick={() => handleDeletePrompt(prompt.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                        <Divider component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsEditDialogOpen(false)}>Done</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}

export default DailyJournal;
