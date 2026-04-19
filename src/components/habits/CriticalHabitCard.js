import React, { useState } from 'react';
import { Box, Typography, Paper, Checkbox, Chip, LinearProgress, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess, DeleteOutline } from '@mui/icons-material';
import { format } from 'date-fns';
import MilestoneBadges from './MilestoneBadges';
import HabitHeatmap from './HabitHeatmap';

export default function CriticalHabitCard({ habit, onComplete, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const streak = habit.streak || 0;
  const bestStreak = habit.bestStreak || 0;
  const targetDays = habit.targetDays || 30;
  const progress = Math.min((streak / targetDays) * 100, 100);
  const isTargetReached = progress >= 100;
  const today = format(new Date(), 'yyyy-MM-dd');
  const completedToday = (habit.completionDates || []).includes(today);

  const getProgressColor = () => {
    if (isTargetReached) return 'success';
    if (progress >= 60) return 'primary';
    return 'inherit';
  };

  return (
    <Paper 
      sx={{
        mb: 2, 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2,
        bgcolor: completedToday ? 'action.hover' : 'background.paper',
        opacity: completedToday ? 0.75 : 1,
        transition: 'all 0.2s ease',
        border: completedToday ? '1px solid' : '1px solid transparent',
        borderColor: completedToday ? 'divider' : 'transparent'
      }} 
      elevation={completedToday ? 0 : 1}
    >
      {/* Top Row: Checkbox + Name + Streak */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Checkbox
          checked={completedToday}
          onChange={() => onComplete(habit.id)}
          color="primary"
          sx={{ p: 0.5 }} 
        />
        
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography 
            variant="subtitle1" 
            fontWeight={600} 
            color="text.primary"
            sx={{ textDecoration: completedToday ? 'line-through' : 'none' }}
            noWrap
          >
            {habit.name}
          </Typography>
          {habit.behavior && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {habit.behavior} · {habit.time} · {habit.location}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Chip 
            label={`🔥 ${streak}`} 
            color={streak >= 7 ? "warning" : "default"} 
            variant={streak >= 7 ? "filled" : "outlined"}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mt: 1.5, px: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Day {streak} of {targetDays} {bestStreak > 0 && `· Best: ${bestStreak} ⭐`}
          </Typography>
          <Typography variant="caption" color={isTargetReached ? 'success.main' : 'text.secondary'} fontWeight={isTargetReached ? 700 : 400}>
            {isTargetReached ? '🎯 Target Reached!' : `${Math.round(progress)}%`}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress}
          color={getProgressColor()}
          sx={{ 
            height: 6, 
            borderRadius: 3,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              transition: 'transform 0.4s ease'
            }
          }} 
        />
      </Box>

      {/* Expandable detail: Badges + Heatmap */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            MILESTONES
          </Typography>
          <MilestoneBadges streak={streak} />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
              LAST 90 DAYS
            </Typography>
            <HabitHeatmap completionDates={habit.completionDates || []} totalDays={90} />
          </Box>

          {onDelete && (
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <IconButton size="small" color="error" onClick={() => onDelete(habit.id)}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
