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
    InputLabel,
    Tab,
    Tabs,
    Switch,
    FormControl,
    Select,
    MenuItem,
    ListItemIcon,
    Collapse,
    Tooltip,
    Menu
} from '@mui/material';
import {
    NavigateBefore,
    NavigateNext,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    ExpandMore,
    ExpandLess,
    WbSunny,
    NightsStay,
    SelfImprovement,
    PhonelinkOff,
    Psychology,
    TrackChanges,
    Visibility,
    Terrain,
    Build,
    Notes,
    History as HistoryIcon,
    PhoneAndroid
} from '@mui/icons-material';
import { format, addDays, subDays } from 'date-fns';
import { useTheme } from '@mui/material/styles';

// Default prompts as requested
const DEFAULT_PROMPTS = [
    { id: '1', section: 'Morning', text: 'Who is the person I want to become today? (e.g., "I am a focused writer," "I am a calm parent.")' },
    { id: '2', section: 'Morning', text: 'The "Big Rock": What is the one thing I must accomplish today to feel satisfied?' },
    { id: '3', section: 'Morning', text: 'The Obstacle: What is most likely to distract me today, and how will I handle it?' },
    { id: '15', section: 'Morning', text: 'Do I have a timeblock or deadline for my goals?' },
    { id: '16', section: 'Morning', text: 'Slow down cool down, Am I slowing down?' },
    { id: '4', section: 'Deep Work', text: 'The Depth Ratio: How many hours of actual Deep Work did I achieve today versus "Shallow Work" (emails, meetings, admin)? Was this ratio acceptable?' },
    { id: '5', section: 'Deep Work', text: 'Distraction Deep Dive: When I lost focus today, what was the trigger (internal emotion or external app/site)? What was I trying to avoid or numb?' },
    { id: '6', section: 'Deep Work', text: 'Skill Growth & Value: What specifically did I do today to become better at my craft? Am I building skills that are rare and valuable, or am I doing work that is easy to replicate?' },
    { id: '7', section: 'Deep Work', text: 'The Roosevelt Dash: If I had to finish my work in half the time today, what would I have ignored?' },
    { id: '8', section: 'Digital Minimalism', text: 'The Solitude Check: Did I spend any time today alone with my own thoughts, free from inputs (no podcasts, no music, no scrolling)?' },
    { id: '9', section: 'Digital Minimalism', text: 'Technology Mindfulness: Did I use technology as a tool to support my values, or was I driven by distraction/boredom avoidance? How mindful was my usage?' },
    { id: '12', section: 'Behavioral Triggers', text: 'The Transition Trap: Did I lose time during a task, or between tasks? (Most time is wasted in the "transition moments" just after finishing one thing and before starting the next).' },
    { id: '13', section: 'Evening', text: 'Daily Improvement: What is one system I can tweak or change to make tomorrow 1% better than today?' },
    { id: '14', section: 'Evening', text: '3 Amazing things that happened today.' },
    // Phase 1: Awareness Audit
    { id: 'detox-0', section: 'Dopamine detox phase 1: Awareness', text: `"What exactly did I consume today, and in what quantity?" (Be precise: e.g., '2 hours of scrolling,' not 'a little while').` },
    { id: 'detox-0b', section: 'Dopamine detox phase 1: Awareness', text: "Am I feeling the 'Gremlins' on the pain side right now?" },
    { id: 'detox-0c', section: 'Dopamine detox phase 1: Awareness', text: "Am I chasing 'new' right now to solve a real problem, or just to feed the dopamine loop?" },
    { id: 'detox-1', section: 'Dopamine detox phase 1: Awareness', text: 'The "One Thing" Analysis: If I eliminated just one distraction, which one would have the biggest impact? Why haven\'t I cut it yet?' },
    { id: 'detox-2', section: 'Dopamine detox phase 1: Awareness', text: 'Excitement vs. Fulfillment: List 3 stimulating things I did today. Did they leave me fulfilling or empty?' },
    // Phase 2: The Struggle
    { id: 'detox-3', section: 'Dopamine detox phase 2: The Struggle', text: 'Sitting with Boredom: When I urged for my phone, what emotion was underneath? What happened when I sat with it?' },
    { id: 'detox-4', section: 'Dopamine detox phase 2: The Struggle', text: 'The "Hard Thing" Re-frame: I tackled a hard task without breaks. Was it actually difficult or just the transition?' },
    { id: 'detox-5', section: 'Dopamine detox phase 2: The Struggle', text: 'Clarity Check: Without constant inputs, what creative thoughts bubbled up naturally?' },
    // Phase 3: Maintenance
    { id: 'detox-6', section: 'Dopamine detox phase 3: Maintenance', text: 'The Morning Audit: Did I start with High Stimulation or Low Stimulation? How did it dictate my focus?' },
    { id: 'detox-7', section: 'Dopamine detox phase 3: Maintenance', text: 'Friction Review: Did I make bad habits harder and good habits easier today?' },
    { id: 'detox-8', section: 'Dopamine detox phase 3: Maintenance', text: 'The "Closed System" Check: Did I close out loops (emails, tabs) or leave them draining attention?' },
    // Daily Digital Audit
    { id: 'digital-3', section: 'Daily Digital Audit', text: 'The "Junk internet" Limit: Total minutes spent on Insta/Twitter/News: ______ (Target: <10 mins)' },
    { id: 'digital-4', section: 'Daily Digital Audit', text: 'Fortress Protocol: Did I actively block websites or use a "single-purpose" device during work hours? (Yes/No)' },
    { id: 'digital-5', section: 'Daily Digital Audit', text: 'Trend Line: Did I use less internet today than yesterday? (Yes/No)' }
];

function DailyJournal() {
    const theme = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());

    // State for prompts configuration
    const [prompts, setPrompts] = useFirestore('journalPrompts', DEFAULT_PROMPTS);

    // State for journal entries (answers)
    const [journalData, setJournalData] = useFirestore('dailyJournalData', {});

    // State for disabled (hidden) sections
    const [disabledSections, setDisabledSections] = useFirestore('journalDisabledSections', []);

    // Edit Prompts Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0); // 0: Prompts, 1: Sections
    const [newPromptText, setNewPromptText] = useState('');

    // Section selection state
    const [selectedSectionInput, setSelectedSectionInput] = useState('Morning');
    const [customSectionName, setCustomSectionName] = useState('');
    const isCustomSection = selectedSectionInput === 'NEW_SECTION';

    const getFinalSection = () => isCustomSection ? customSectionName : selectedSectionInput;

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
                    (dp.section === 'Behavioral Triggers' && !hasBehavioralTriggers) ||
                    (dp.section === 'Dopamine detox phase 1: Awareness' && !updatedPrompts.some(p => p.section === 'Dopamine detox phase 1: Awareness')) ||
                    (dp.section === 'Dopamine detox phase 2: The Struggle' && !updatedPrompts.some(p => p.section === 'Dopamine detox phase 2: The Struggle')) ||
                    (dp.section === 'Dopamine detox phase 3: Maintenance' && !updatedPrompts.some(p => p.section === 'Dopamine detox phase 3: Maintenance'))
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

    // Analytics for Journal Updates
    useEffect(() => {
        const handler = setTimeout(() => {
            // Only log if there's data (avoid initial load empty log)
            if (Object.keys(journalData).length > 0) {
                import("../firebase").then(({ logAnalyticsEvent }) => {
                    logAnalyticsEvent('journal_entry_updated', {
                        date: dateKey,
                        entries_count: Object.keys(currentEntry.responses || {}).length
                    });
                });
            }
        }, 2000); // 2-second debounce
        return () => clearTimeout(handler);
    }, [journalData, dateKey]);

    const handleAddPrompt = () => {
        const sectionToAdd = getFinalSection();
        if (!newPromptText.trim() || !sectionToAdd.trim()) return;

        const newId = Date.now().toString();
        setPrompts([...prompts, { id: newId, text: newPromptText, section: sectionToAdd }]);
        setNewPromptText('');
        setCustomSectionName('');
        setSelectedSectionInput(sectionToAdd); // Switch to the newly created section

        import("../firebase").then(({ logAnalyticsEvent }) => {
            logAnalyticsEvent('journal_prompt_added', { section: sectionToAdd });
        });
    };

    const handleToggleSection = (sectionName) => {
        if (disabledSections.includes(sectionName)) {
            setDisabledSections(disabledSections.filter(s => s !== sectionName));
        } else {
            setDisabledSections([...disabledSections, sectionName]);
        }
    };

    // Calculate all available sections based on prompts + defaults
    const getAllSections = () => {
        const sections = new Set(DEFAULT_PROMPTS.map(p => p.section));
        prompts.forEach(p => sections.add(p.section));
        return Array.from(sections);
    };

    const allSections = getAllSections();
    const visibleSections = allSections.filter(s => !disabledSections.includes(s));

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
            case 'Dopamine detox phase 1: Awareness': return { icon: Visibility, color: '#7E57C2', borderColor: '#7E57C2' }; // Deep Purple
            case 'Dopamine detox phase 2: The Struggle': return { icon: Terrain, color: '#FF7043', borderColor: '#FF7043' }; // Deep Orange
            case 'Dopamine detox phase 3: Maintenance': return { icon: Build, color: '#66BB6A', borderColor: '#66BB6A' }; // Green
            case 'Daily Digital Audit': return { icon: PhoneAndroid, color: '#AB47BC', borderColor: '#AB47BC' }; // Purple
            default: return { icon: Notes, color: theme.palette.text.secondary, borderColor: theme.palette.divider };
        }
    };

    const getSectionDescription = (sectionName) => {
        if (sectionName === 'Dopamine detox phase 1: Awareness') {
            return "Acknowledge Life is Painful: Dr. Anna Lembke, suggests recalibrating expectations and accepting that life is inherently painful and unpleasant. This perspective can reduce the constant pursuit of comfort and pleasure that often leads to addiction. Desires, ambitions, anger, and greed heat up your system and make life miserable.";
        }
        if (sectionName === 'Dopamine detox phase 2: The Struggle') {
            return "Simulation Trap: Trick 1: Returning to work is easy. Trick 2: You can do it later.";
        }
        if (sectionName === 'Dopamine detox phase 3: Maintenance') {
            return "Simulation Trap: Trick 3: Excitement is not the same thing as fulfillment. Trick 4: You are missing out.";
        }
        switch (sectionName) {
            case 'Digital Minimalism':
                return "Don't have to use electronics and devices much. Technology is a powerful tool, but I will only use it for high-value activities. Every 5 mins scroll takes away your focus, every browser tab you add to your life brings a cognitive tax.";
            case 'Deep Work':
                return "One hour of deep work beats ten hours of distracted effort. Small focused sessions, repeated daily, create extraordinary results. Consistency compounds faster than intensity.";
            default:
                return null;
        }
    };

    const [collapsedSections, setCollapsedSections] = useState([]);
    const [historyMenuAnchor, setHistoryMenuAnchor] = useState(null);

    const handleToggleCollapse = (sectionName) => {
        if (collapsedSections.includes(sectionName)) {
            setCollapsedSections(collapsedSections.filter(s => s !== sectionName));
        } else {
            setCollapsedSections([...collapsedSections, sectionName]);
        }
    };

    // Get all dates with journal entries
    const getDatesWithEntries = () => {
        return Object.keys(journalData)
            .filter(dateKey => {
                const entry = journalData[dateKey];
                const hasResponses = entry.responses && Object.values(entry.responses).some(r => r && r.trim());
                const hasNotes = entry.notes && entry.notes.trim();
                return hasResponses || hasNotes;
            })
            .sort((a, b) => new Date(b) - new Date(a)) // Sort in descending order (most recent first)
            .slice(0, 20); // Limit to 20 most recent dates
    };

    const handleHistoryMenuOpen = (event) => {
        setHistoryMenuAnchor(event.currentTarget);
    };

    const handleHistoryMenuClose = () => {
        setHistoryMenuAnchor(null);
    };

    const handleDateSelect = (dateKey) => {
        setCurrentDate(new Date(dateKey));
        handleHistoryMenuClose();
    };

    const renderSection = (sectionName) => {
        const sectionPrompts = prompts.filter(p => p.section === sectionName);
        const config = getSectionConfig(sectionName);
        const Icon = config.icon;
        const isCollapsed = collapsedSections.includes(sectionName);

        return (
            <Paper sx={{
                p: 0, // Removed padding here, handled inside
                mb: 4,
                bgcolor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: 'none',
                border: `1px solid ${theme.palette.divider}`,
                borderTop: `3px solid ${config.borderColor}`,
                overflow: 'hidden' // Ensure collapse animation is clean
            }}>
                <Box
                    onClick={() => handleToggleCollapse(sectionName)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 3,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Icon sx={{ color: config.color, mr: 2, fontSize: 24, opacity: 0.9 }} />
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                            {sectionName} Reflection
                        </Typography>
                    </Box>
                    <IconButton size="small">
                        {isCollapsed ? <ExpandMore /> : <ExpandLess />}
                    </IconButton>
                </Box>

                <Collapse in={!isCollapsed}>
                    <Box sx={{ px: 4, pb: 4 }}>
                        {getSectionDescription(sectionName) && (
                            <Paper sx={{ p: 2, mb: 3, bgcolor: `${config.color}08`, border: `1px solid ${config.borderColor}30`, borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontStyle: 'italic', lineHeight: 1.6 }}>
                                    {getSectionDescription(sectionName)}
                                </Typography>
                            </Paper>
                        )}

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
                    </Box>
                </Collapse>
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
                        Customize Journal
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
                        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                        <Tooltip title="Jump to date">
                            <IconButton
                                onClick={handleHistoryMenuOpen}
                                size="small"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    '&:hover': { color: theme.palette.primary.main }
                                }}
                            >
                                <HistoryIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Paper>
                    <Menu
                        anchorEl={historyMenuAnchor}
                        open={Boolean(historyMenuAnchor)}
                        onClose={handleHistoryMenuClose}
                        PaperProps={{
                            sx: {
                                maxHeight: 400,
                                width: 250,
                                mt: 1
                            }
                        }}
                    >
                        {getDatesWithEntries().length === 0 ? (
                            <MenuItem disabled>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                                    No entries yet
                                </Typography>
                            </MenuItem>
                        ) : (
                            getDatesWithEntries().map(dateKey => (
                                <MenuItem
                                    key={dateKey}
                                    onClick={() => handleDateSelect(dateKey)}
                                    selected={dateKey === format(currentDate, 'yyyy-MM-dd')}
                                >
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {format(new Date(dateKey), 'MMMM d, yyyy')}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            {format(new Date(dateKey), 'EEEE')}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))
                        )}
                    </Menu>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Dynamically render visible sections */}
                {visibleSections.map((section, index) => {
                    // Simple 2-column layout logic: Evens left, Odds right (not perfect for height, but functional)
                    // Or simply map all and let Masonry handles it? 
                    // Since we don't have masonry, we can split into 2 columns arrays
                    return null;
                })}

                <Grid item xs={12} md={6}>
                    {visibleSections.filter((_, i) => i % 2 === 0).map(section => (
                        <Box key={section} sx={{ mb: 2 }}>
                            {renderSection(section)}
                        </Box>
                    ))}
                </Grid>
                <Grid item xs={12} md={6}>
                    {visibleSections.filter((_, i) => i % 2 !== 0).map(section => (
                        <Box key={section} sx={{ mb: 2 }}>
                            {renderSection(section)}
                        </Box>
                    ))}
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
                <DialogTitle sx={{ fontWeight: 700 }}>Customize Journal</DialogTitle>
                <DialogContent>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                            <Tab label="Sections" />
                            <Tab label="Prompts" />
                        </Tabs>
                    </Box>

                    {activeTab === 0 && (
                        <List>
                            {allSections.map(section => (
                                <React.Fragment key={section}>
                                    <ListItem>
                                        <ListItemIcon>
                                            {getSectionConfig(section).icon && React.createElement(getSectionConfig(section).icon)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={section}
                                            secondary={disabledSections.includes(section) ? "Hidden" : "Visible"}
                                        />
                                        <ListItemSecondaryAction>
                                            <Switch
                                                edge="end"
                                                checked={!disabledSections.includes(section)}
                                                onChange={() => handleToggleSection(section)}
                                            />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))}
                        </List>
                    )}

                    {activeTab === 1 && (
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            {/* Add New Prompt */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: 'action.hover', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <TextField
                                        fullWidth
                                        label="New Prompt Question"
                                        value={newPromptText}
                                        onChange={(e) => setNewPromptText(e.target.value)}
                                        size="small"
                                        sx={{ flexBasis: '100%', mb: 2 }}
                                    />

                                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                        <FormControl size="small" sx={{ minWidth: 200, flexGrow: 1 }}>
                                            <InputLabel>Section</InputLabel>
                                            <Select
                                                value={selectedSectionInput}
                                                label="Section"
                                                onChange={(e) => setSelectedSectionInput(e.target.value)}
                                            >
                                                {allSections.map(s => (
                                                    <MenuItem key={s} value={s}>{s}</MenuItem>
                                                ))}
                                                <Divider />
                                                <MenuItem value="NEW_SECTION" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    + Create Create New Section
                                                </MenuItem>
                                            </Select>
                                        </FormControl>

                                        {isCustomSection && (
                                            <TextField
                                                label="Custom Section Name"
                                                value={customSectionName}
                                                onChange={(e) => setCustomSectionName(e.target.value)}
                                                size="small"
                                                sx={{ flexGrow: 1 }}
                                            />
                                        )}

                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={handleAddPrompt}
                                            disabled={!newPromptText.trim() || (isCustomSection && !customSectionName.trim())}
                                        >
                                            Add
                                        </Button>
                                    </Box>
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
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsEditDialogOpen(false)}>Done</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}

export default DailyJournal;
