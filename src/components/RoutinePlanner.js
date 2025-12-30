import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    List,
    ListItem,
    IconButton,
    TextField,
    Button,
    Fade
} from '@mui/material';
import {
    WbSunny,
    WbTwilight,
    NightsStay,
    Add as AddIcon,
    Delete as DeleteIcon,
    PlaylistAdd as PlaylistAddIcon,
    Category as CategoryIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const DEFAULT_ROUTINES = {
    weekday: {
        morning: [
            { id: 1, text: 'Wake up at 6:00 AM', completed: false },
            { id: 2, text: 'Drink water', completed: false },
            { id: 3, text: 'Review daily planner', completed: false }
        ],
        evening: [
            { id: 4, text: 'Plan tomorrow', completed: false },
            { id: 5, text: 'Read for 30 mins', completed: false }
        ],
        night: [
            { id: 6, text: 'Screens off by 10 PM', completed: false },
            { id: 7, text: 'Sleep by 10:30 PM', completed: false }
        ]
    },
    weekend: {
        morning: [
            { id: 8, text: 'Sleep in until 8:00 AM', completed: false },
            { id: 9, text: 'Morning walk', completed: false }
        ],
        evening: [
            { id: 10, text: 'Socialize / Family Time', completed: false }
        ],
        night: [
            { id: 11, text: 'Reflect on the week', completed: false }
        ]
    }
};

function RoutinePlanner({ onTaskCreate }) {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0); // 0 = Weekday, 1 = Weekend

    // Load from LS or defaults
    const [routines, setRoutines] = useState(() => {
        try {
            const saved = localStorage.getItem('routineData');
            return saved ? JSON.parse(saved) : DEFAULT_ROUTINES;
        } catch (e) {
            return DEFAULT_ROUTINES;
        }
    });

    const [newItemText, setNewItemText] = useState({});
    const [newSectionName, setNewSectionName] = useState('');
    const [isAddingSection, setIsAddingSection] = useState(false);

    const currentType = activeTab === 0 ? 'weekday' : 'weekend';

    // Get all section keys for the current type
    const sectionKeys = Object.keys(routines[currentType] || {});

    useEffect(() => {
        localStorage.setItem('routineData', JSON.stringify(routines));
    }, [routines]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleAddItem = (section) => {
        const text = newItemText[section] || '';
        if (!text.trim()) return;

        setRoutines(prev => ({
            ...prev,
            [currentType]: {
                ...prev[currentType],
                [section]: [
                    ...prev[currentType][section],
                    { id: Date.now(), text, completed: false }
                ]
            }
        }));

        setNewItemText(prev => ({ ...prev, [section]: '' }));
    };

    const handleDeleteItem = (section, id) => {
        setRoutines(prev => ({
            ...prev,
            [currentType]: {
                ...prev[currentType],
                [section]: prev[currentType][section].filter(item => item.id !== id)
            }
        }));
    };

    const handleAddSection = () => {
        if (!newSectionName.trim()) return;
        const key = newSectionName.toLowerCase().replace(/\s+/g, '_');
        if (routines[currentType][key]) {
            alert('A section with this name already exists.');
            return;
        }
        setRoutines(prev => ({
            ...prev,
            weekday: { ...prev.weekday, [key]: [] },
            weekend: { ...prev.weekend, [key]: [] }
        }));
        setNewSectionName('');
        setIsAddingSection(false);
    };

    const handleDeleteSection = (sectionKey) => {
        if (['morning', 'evening', 'night'].includes(sectionKey)) return; // Protect default sections
        if (!window.confirm(`Delete the "${sectionKey}" ritual section?`)) return;
        setRoutines(prev => {
            const newWeekday = { ...prev.weekday };
            const newWeekend = { ...prev.weekend };
            delete newWeekday[sectionKey];
            delete newWeekend[sectionKey];
            return { weekday: newWeekday, weekend: newWeekend };
        });
    };

    const handleScheduleSection = (sectionKey) => {
        const items = routines[currentType][sectionKey];
        if (!items || items.length === 0) return;

        if (onTaskCreate) {
            items.forEach(item => {
                onTaskCreate({
                    name: item.text,
                    duration: 30,
                    priority: 'P2',
                    tag: 'Personal',
                    important: false,
                    urgent: false
                });
            });
            alert(`Added ${items.length} tasks to your Daily Planner.`);
        }
    };

    const getIconForSection = (sectionKey) => {
        switch (sectionKey) {
            case 'morning': return WbSunny;
            case 'evening': return WbTwilight;
            case 'night': return NightsStay;
            default: return CategoryIcon;
        }
    };

    const isDefaultSection = (sectionKey) => ['morning', 'evening', 'night'].includes(sectionKey);

    const getSectionStyles = (sectionKey) => {
        const isDark = theme.palette.mode === 'dark';

        switch (sectionKey) {
            case 'morning':
                return {
                    background: isDark
                        ? 'linear-gradient(135deg, #2c241b 0%, #1e1e1e 100%)'
                        : 'linear-gradient(135deg, #FFF9E5 0%, #FFFFFF 100%)',
                    border: isDark ? '1px solid #3e332a' : '1px solid #FFE082',
                    iconColor: isDark ? '#FFB74D' : '#FF9800', // Orange
                    accentColor: isDark ? '#FFB74D' : '#F57C00'
                };
            case 'evening':
                return {
                    background: isDark
                        ? 'linear-gradient(135deg, #2a1c1c 0%, #1e1e1e 100%)'
                        : 'linear-gradient(135deg, #FFEBEE 0%, #FFFFFF 100%)',
                    border: isDark ? '1px solid #3e2a2a' : '1px solid #FFAB91',
                    iconColor: isDark ? '#FF8A65' : '#FF5722', // Deep Orange
                    accentColor: isDark ? '#FF8A65' : '#D84315'
                };
            case 'night':
                return {
                    background: isDark
                        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                        : 'linear-gradient(135deg, #E8EAF6 0%, #FFFFFF 100%)',
                    border: isDark ? '1px solid #2a2a4e' : '1px solid #9FA8DA',
                    iconColor: isDark ? '#9FA8DA' : '#3F51B5', // Indigo
                    accentColor: isDark ? '#9FA8DA' : '#283593'
                };
            default:
                return {
                    background: theme.paper,
                    border: `1px solid ${theme.divider}`,
                    iconColor: theme.textSecondary,
                    accentColor: theme.text
                };
        }
    };

    const renderSection = (sectionKey) => {
        const items = routines[currentType][sectionKey] || [];
        const Icon = getIconForSection(sectionKey);
        const title = sectionKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const styles = getSectionStyles(sectionKey);

        return (
            <Paper sx={{
                p: 3,
                height: '100%',
                background: styles.background,
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: styles.border,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                }
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Icon sx={{ color: styles.iconColor, mr: 1.5, fontSize: 24 }} />
                        <Typography variant="h6" sx={{
                            color: styles.accentColor,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontSize: '0.85rem',
                            letterSpacing: '1px'
                        }}>
                            {title}
                        </Typography>
                    </Box>
                    <Box>
                        <IconButton
                            size="small"
                            onClick={() => handleScheduleSection(sectionKey)}
                            title="Add these to Today's Tasks"
                            sx={{ color: theme.primary }}
                        >
                            <PlaylistAddIcon fontSize="small" />
                        </IconButton>
                        {!isDefaultSection(sectionKey) && (
                            <IconButton
                                size="small"
                                onClick={() => handleDeleteSection(sectionKey)}
                                title="Delete this section"
                                sx={{ color: theme.error || '#d32f2f' }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                <List sx={{ flexGrow: 1, overflow: 'auto', minHeight: 0, mb: 1 }}>
                    {items.map(item => (
                        <ListItem
                            key={item.id}
                            sx={{
                                px: 0,
                                py: 0.5,
                                borderBottom: `1px solid ${theme.divider}40`
                            }}
                            secondaryAction={
                                <IconButton edge="end" size="small" onClick={() => handleDeleteItem(sectionKey, item.id)}>
                                    <DeleteIcon fontSize="small" sx={{ opacity: 0.5 }} />
                                </IconButton>
                            }
                        >
                            <Typography variant="body2" sx={{ color: theme.text, fontSize: '0.95rem' }}>
                                {item.text}
                            </Typography>
                        </ListItem>
                    ))}
                    {items.length === 0 && (
                        <Typography variant="body2" sx={{ color: theme.textSecondary, fontStyle: 'italic', mt: 4, textAlign: 'center' }}>
                            No routine steps yet.
                        </Typography>
                    )}
                </List>

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, pt: 2, borderTop: `1px solid ${theme.divider}`, flexShrink: 0 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Add new step..."
                        value={newItemText[sectionKey] || ''}
                        onChange={(e) => setNewItemText(prev => ({ ...prev, [sectionKey]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem(sectionKey)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        sx={{
                            bgcolor: 'transparent',
                            mr: 1,
                            '& .MuiInputBase-root': {
                                fontSize: '0.9rem',
                                color: theme.text,
                            }
                        }}
                    />
                    <IconButton size="small" onClick={() => handleAddItem(sectionKey)} disabled={!(newItemText[sectionKey] || '').trim()}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Paper>
        );
    };

    return (
        <Box sx={{ p: 3, height: '100vh', maxHeight: '100vh', overflow: 'hidden', bgcolor: theme.bg, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h3" sx={{ color: theme.text, fontWeight: 800, letterSpacing: '-1px', mb: 0.5 }}>
                        Routines & Rituals
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: theme.textSecondary, fontWeight: 500 }}>
                        Design your ideal day.
                    </Typography>
                </Box>
                <Paper sx={{ borderRadius: 2, border: `1px solid ${theme.divider}`, bgcolor: theme.paper }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{ minHeight: 48 }}
                    >
                        <Tab label="Weekday Routine" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }} />
                        <Tab label="Weekend Routine" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }} />
                    </Tabs>
                </Paper>
            </Box>

            <Box sx={{
                flexGrow: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                flexWrap: 'wrap',
                gap: 3
            }}>
                {sectionKeys.map(key => (
                    <Box key={key} sx={{ flex: '1 1 300px', minWidth: 280, maxWidth: 400, height: 'auto', minHeight: 300 }}>
                        {renderSection(key)}
                    </Box>
                ))}

                {/* Add New Ritual Card */}
                <Box sx={{ flex: '1 1 300px', minWidth: 280, maxWidth: 400, minHeight: 300 }}>
                    <Paper sx={{
                        p: 3,
                        height: '100%',
                        bgcolor: isAddingSection ? theme.paper : 'transparent',
                        borderRadius: 4,
                        boxShadow: isAddingSection ? '0 8px 30px rgba(0,0,0,0.12)' : 'none',
                        border: isAddingSection ? `2px solid ${theme.palette.primary.main}` : `2px dashed ${theme.divider}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: isAddingSection ? 'default' : 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            borderColor: isAddingSection ? theme.palette.primary.main : theme.palette.primary.main,
                            bgcolor: isAddingSection ? theme.paper : `${theme.palette.primary.main}08`,
                            transform: !isAddingSection && 'translateY(-4px)'
                        }
                    }}
                        onClick={() => !isAddingSection && setIsAddingSection(true)}
                    >
                        {!isAddingSection ? (
                            <Fade in={!isAddingSection}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <AddIcon sx={{ fontSize: 48, color: theme.textSecondary, mb: 2, opacity: 0.7 }} />
                                    <Typography variant="h6" sx={{ color: theme.textSecondary, fontWeight: 600 }}>
                                        Add New Ritual
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: theme.textSecondary, opacity: 0.6, mt: 1 }}>
                                        e.g., Gym, Meditation, Reading
                                    </Typography>
                                </Box>
                            </Fade>
                        ) : (
                            <Fade in={isAddingSection}>
                                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                    <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 3, fontWeight: 700 }}>
                                        Name Your Ritual
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        autoFocus
                                        placeholder="e.g. Morning Focus"
                                        value={newSectionName}
                                        onChange={(e) => setNewSectionName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
                                        variant="standard"
                                        InputProps={{
                                            disableUnderline: false,
                                            sx: { fontSize: '1.2rem', textAlign: 'center', '& input': { textAlign: 'center' } }
                                        }}
                                        sx={{ mb: 4 }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsAddingSection(false);
                                                setNewSectionName('');
                                            }}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handleAddSection}
                                            disabled={!newSectionName.trim()}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)' }}
                                        >
                                            Create
                                        </Button>
                                    </Box>
                                </Box>
                            </Fade>
                        )}
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}

export default RoutinePlanner;
