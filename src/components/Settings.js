import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Switch,
    useTheme,
    Divider
} from '@mui/material';
import {
    DragIndicator,
    Dashboard,
    ViewWeek,
    CalendarMonth,
    EmojiEvents,
    MenuBook,
    SelfImprovement,
    ViewQuilt,
    Timer
} from '@mui/icons-material';

// Map icon keys to actual components
const iconMap = {
    dashboard: <Dashboard />,
    viewWeek: <ViewWeek />,
    calendarMonth: <CalendarMonth />,
    emojiEvents: <EmojiEvents />,
    menuBook: <MenuBook />,
    selfImprovement: <SelfImprovement />,
    viewQuilt: <ViewQuilt />,
    timer: <Timer />
};

function Settings({ navConfig, onUpdate }) {
    const theme = useTheme();

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(navConfig);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        onUpdate(items);
    };

    const handleToggle = (id) => {
        const updatedConfig = navConfig.map(item =>
            item.id === id ? { ...item, visible: !item.visible } : item
        );
        onUpdate(updatedConfig);
    };

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary }}>
                Settings
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
                Customize your workspace navigation.
            </Typography>

            <Paper elevation={0} sx={{ p: 0, borderRadius: 3, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ p: 3, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Sidebar Navigation
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Drag to reorder. Toggle to hide or show items.
                    </Typography>
                </Box>
                <Divider />

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="nav-settings-list">
                        {(provided) => (
                            <List {...provided.droppableProps} ref={provided.innerRef}>
                                {navConfig.map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(provided, snapshot) => (
                                            <ListItem
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                sx={{
                                                    bgcolor: snapshot.isDragging ? theme.palette.action.selected : 'transparent',
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    '&:last-child': { borderBottom: 'none' }
                                                }}
                                                secondaryAction={
                                                    <Switch
                                                        edge="end"
                                                        checked={item.visible}
                                                        onChange={() => handleToggle(item.id)}
                                                    />
                                                }
                                            >
                                                <ListItemIcon
                                                    {...provided.dragHandleProps}
                                                    sx={{ minWidth: 40, cursor: 'grab', color: theme.palette.text.disabled }}
                                                >
                                                    <DragIndicator />
                                                </ListItemIcon>
                                                <ListItemIcon sx={{ minWidth: 46, color: item.visible ? theme.palette.primary.main : theme.palette.text.disabled }}>
                                                    {iconMap[item.iconKey]}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={item.label}
                                                    primaryTypographyProps={{
                                                        fontWeight: 500,
                                                        color: item.visible ? theme.palette.text.primary : theme.palette.text.disabled
                                                    }}
                                                />
                                            </ListItem>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </List>
                        )}
                    </Droppable>
                </DragDropContext>
            </Paper>
        </Box>
    );
}

export default Settings;
