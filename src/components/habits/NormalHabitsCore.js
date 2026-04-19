import React, { useState } from 'react';
import { Box, Typography, Collapse, Checkbox, Paper, List, ListItem, ListItemText, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import { ExpandMore, ExpandLess, DeleteOutline, ArchiveOutlined } from '@mui/icons-material';
import { format } from 'date-fns';
import MilestoneBadges from './MilestoneBadges';
import HabitHeatmap from './HabitHeatmap';

function NormalHabitItem({ habit, onComplete, onDelete, onArchive, onUpdateNotes }) {
  const [expanded, setExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(habit.notes || '');
  const streak = habit.streak || 0;
  const bestStreak = habit.bestStreak || 0;
  const targetDays = habit.targetDays || 30;
  const progress = Math.min((streak / targetDays) * 100, 100);
  const isComplete = progress >= 100;
  const today = format(new Date(), 'yyyy-MM-dd');
  const completedToday = (habit.completionDates || []).includes(today);

  return (
    <Paper sx={{ mb: 1, borderRadius: 1, opacity: completedToday ? 0.75 : 1 }} elevation={0} variant="outlined">
      <ListItem 
        component="div" 
        disablePadding
        sx={{ px: 2, py: 1 }}
      >
        <Checkbox
          edge="start"
          checked={completedToday}
          onChange={() => onComplete(habit.id)}
          tabIndex={-1}
          disableRipple
          color="primary"
        />
        <ListItemText 
          primary={habit.name} 
          primaryTypographyProps={{ 
            fontWeight: 500,
            sx: { textDecoration: completedToday ? 'line-through' : 'none' }
          }}
          secondary={`Day ${streak} of ${targetDays}${bestStreak > 0 ? ` · Best: ${bestStreak} ⭐` : ''}`}
          secondaryTypographyProps={{ variant: 'caption' }}
          sx={{ ml: 1, cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <Typography variant="caption" color={isComplete ? 'success.main' : 'text.secondary'} fontWeight={isComplete ? 700 : 500}>
             {isComplete ? '🎯' : `${Math.round(progress)}%`}
           </Typography>
           <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
           >
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
           </IconButton>
        </Box>
      </ListItem>

      {/* Thin progress bar */}
      <LinearProgress 
        variant="determinate" 
        value={progress}
        color={isComplete ? 'success' : 'primary'}
        sx={{ 
          height: 3, 
          borderBottomLeftRadius: 4, 
          borderBottomRightRadius: 4,
          bgcolor: 'action.hover'
        }} 
      />
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ px: 3, pb: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
             <strong>Target:</strong> {habit.behavior || 'Not set'} · 
             <strong> Time:</strong> {habit.time || 'Not set'} · 
             <strong> Goal:</strong> {targetDays} days
          </Typography>
          <MilestoneBadges streak={streak} />
          <Box sx={{ mt: 1.5 }}>
            <HabitHeatmap completionDates={habit.completionDates || []} frictionLogs={habit.frictionLogs || {}} totalDays={90} />
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
              HABIT NOTES
            </Typography>
            <TextField 
              multiline 
              rows={2} 
              fullWidth 
              size="small"
              placeholder="Reflections..."
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => onUpdateNotes && onUpdateNotes(habit.id, localNotes)}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.8rem',
                  bgcolor: 'action.hover'
                }
              }}
            />
          </Box>

          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {onArchive && (
              <Tooltip title="Archive">
                <IconButton size="small" onClick={() => onArchive(habit.id)}>
                  <ArchiveOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => onDelete(habit.id)}>
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}

export default function NormalHabitsCore({ habits, onComplete, onDelete, onArchive, onUpdateNotes }) {
  const grouped = habits.reduce((acc, habit) => {
    const group = habit.identity || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(habit);
    return acc;
  }, {});

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {Object.keys(grouped).map((identity) => (
        <Box key={identity}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontWeight: 700, mb: 1, display: 'block' }}>
            {identity}
          </Typography>
          <List disablePadding>
            {grouped[identity].map(habit => (
              <NormalHabitItem key={habit.id} habit={habit} onComplete={onComplete} onDelete={onDelete} onArchive={onArchive} onUpdateNotes={onUpdateNotes} />
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );
}
