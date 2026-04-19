import React from 'react';
import { Box, Tooltip } from '@mui/material';
import '../habits/AntiGravity.css';

const MILESTONES = [
  { days: 7,   emoji: '🌱', label: 'Seedling (7 days)' },
  { days: 21,  emoji: '🌿', label: 'Sprouting (21 days)' },
  { days: 30,  emoji: '🌳', label: 'Rooted (30 days)' },
  { days: 66,  emoji: '💎', label: 'Habit Formed (66 days)' },
  { days: 100, emoji: '🔥', label: 'Centurion (100 days)' },
  { days: 365, emoji: '👑', label: 'Legend (365 days)' },
];

export default function MilestoneBadges({ streak = 0 }) {
  return (
    <Box className="badge-container">
      {MILESTONES.map(m => {
        const earned = streak >= m.days;
        return (
          <Tooltip key={m.days} title={`${m.label}${earned ? ' ✅' : ' — Locked'}`} arrow>
            <Box className={`badge-item ${earned ? 'badge-earned' : 'badge-locked'}`}>
              {m.emoji}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}

export { MILESTONES };
