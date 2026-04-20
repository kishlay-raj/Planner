import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, Select, MenuItem, 
  DialogActions, Grid, IconButton, Tooltip, List, ListItem, ListItemText, ListItemSecondaryAction,
  Divider, useMediaQuery, useTheme, Collapse, Paper } from '@mui/material';
import { Add, RocketLaunch, Settings, Delete, History, Archive, Unarchive, ExpandMore, ExpandLess, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useAntiGravityHabits } from '../hooks/useAntiGravityHabits';
import AtmosphereQuote from './habits/AtmosphereQuote';
import CriticalHabitCard from './habits/CriticalHabitCard';
import NormalHabitsCore from './habits/NormalHabitsCore';
import DailyScore from './habits/DailyScore';
import NotesPanel from './NotesPanel';
import { format, subDays, addDays, parseISO, isSameDay } from 'date-fns';
import './habits/AntiGravity.css';

// Helper: recalculate streak by walking backwards from today through completionDates
function recalcStreak(completionDates) {
  let streak = 0;
  const todayDate = new Date();
  for (let i = 0; i < 1000; i++) {
    const checkDate = format(subDays(todayDate, i), 'yyyy-MM-dd');
    if (completionDates.includes(checkDate)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function AntiGravityHabitTracker() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    criticalHabits,
    normalHabits,
    archivedHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    settings,
    setSettings
  } = useAntiGravityHabits();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackfillOpen, setIsBackfillOpen] = useState(false);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);
  const [backfillHabitId, setBackfillHabitId] = useState(null);
  const [hurdlePrompt, setHurdlePrompt] = useState({ open: false, dateStr: '', text: '' });
  const [newQuote, setNewQuote] = useState({ text: '', author: '' });
  const [newHabit, setNewHabit] = useState({ 
    name: '', behavior: '', time: '', location: '', 
    type: 'critical', identity: 'General', targetDays: 30 
  });

  // Random quote selection (stable per session)
  const dailyQuote = useMemo(() => {
    const quotes = settings?.quotes;
    if (!quotes || quotes.length === 0) {
      return { text: "Float into focus.", author: "Habit" };
    }
    const idx = Math.floor(Math.random() * quotes.length);
    return quotes[idx];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.quotes?.length]);

  // Daily score calculation
  const trueToday = new Date();
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const allTrackable = [...criticalHabits, ...normalHabits];
  const completedSelectedCount = allTrackable.filter(h => (h.completionDates || []).includes(selectedDateStr)).length;

  // === Core completion handler (date-based, always recalculates streak) ===
  const handleComplete = async (habitId) => {
    const target = allTrackable.find(h => h.id === habitId);
    if (!target) return;

    const dates = target.completionDates || [];
    const isCompletedSelectedDate = dates.includes(selectedDateStr);
    let newDates;

    if (isCompletedSelectedDate) {
      newDates = dates.filter(d => d !== selectedDateStr);
    } else {
      newDates = [...dates, selectedDateStr].sort();
    }

    const newStreak = recalcStreak(newDates);
    const newBestStreak = Math.max(target.bestStreak || 0, newStreak);

    await updateHabit(habitId, {
      completionDates: newDates,
      completedToday: newDates.includes(format(trueToday, 'yyyy-MM-dd')),
      streak: newStreak,
      bestStreak: newBestStreak
    });
  };

  // === Delete habit ===
  const handleDeleteHabit = async (habitId) => {
    if (window.confirm('Delete this habit? This cannot be undone.')) {
      await deleteHabit(habitId);
    }
  };

  // === Backfill: add a previous day's completion ===
  const handleBackfill = async (dateStr) => {
    if (!backfillHabitId) return;
    const target = allTrackable.find(h => h.id === backfillHabitId);
    if (!target) return;

    const dates = target.completionDates || [];
    if (dates.includes(dateStr)) return;

    const newDates = [...dates, dateStr].sort();
    const streak = recalcStreak(newDates);
    const newBestStreak = Math.max(target.bestStreak || 0, streak);

    // If there was a friction log, remove it since they completed the day
    const updatedFrictionLogs = { ...(target.frictionLogs || {}) };
    delete updatedFrictionLogs[dateStr];

    await updateHabit(backfillHabitId, {
      completionDates: newDates,
      streak,
      bestStreak: newBestStreak,
      completedToday: newDates.includes(format(new Date(), 'yyyy-MM-dd')),
      frictionLogs: updatedFrictionLogs
    });
  };

  // === Log Hurdle ===
  const handleSaveHurdle = async () => {
    if (!backfillHabitId || !hurdlePrompt.dateStr) return;
    const target = allTrackable.find(h => h.id === backfillHabitId);
    if (!target) return;

    const currentLogs = target.frictionLogs || {};
    
    await updateHabit(backfillHabitId, {
      frictionLogs: {
        ...currentLogs,
        [hurdlePrompt.dateStr]: hurdlePrompt.text
      }
    });
    setHurdlePrompt({ open: false, dateStr: '', text: '' });
  };

  // === Archive / Unarchive ===
  const handleArchiveHabit = async (habitId, archiveState = true) => {
    await updateHabit(habitId, { isArchived: archiveState });
  };

  // === Update Notes ===
  const handleUpdateNotes = async (habitId, notes) => {
    await updateHabit(habitId, { notes });
  };

  const handleAddHabit = async () => {
    if (!newHabit.name.trim()) return;
    await addHabit({
      ...newHabit,
      targetDays: Number(newHabit.targetDays) || 30,
      streak: 0,
      bestStreak: 0,
      completionDates: [],
      frictionLogs: {},
      completedToday: false,
      createdAt: Date.now()
    });
    setIsAddOpen(false);
    setNewHabit({ name: '', behavior: '', time: '', location: '', type: 'critical', identity: 'General', targetDays: 30 });
  };

  // Quote management
  const handleAddQuote = () => {
    if (!newQuote.text.trim()) return;
    const currentQuotes = settings?.quotes || [];
    setSettings({ ...settings, quotes: [...currentQuotes, { text: newQuote.text, author: newQuote.author || 'Unknown' }] });
    setNewQuote({ text: '', author: '' });
  };
  const handleDeleteQuote = (index) => {
    const currentQuotes = [...(settings?.quotes || [])];
    currentQuotes.splice(index, 1);
    setSettings({ ...settings, quotes: currentQuotes });
  };

  // Generate last 30 days for backfill picker
  const last30Days = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 1; i <= 30; i++) {
      days.push(format(subDays(now, i), 'yyyy-MM-dd'));
    }
    return days;
  }, []);

  const backfillTarget = allTrackable.find(h => h.id === backfillHabitId);

  return (
    <div className="planner-screen">
      {/* Header */}
      <Box className="planner-header" sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: isMobile ? 2 : 3,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <RocketLaunch sx={{ color: '#1976d2', fontSize: isMobile ? '24px' : '32px' }} />
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ color: 'text.primary', fontWeight: 600 }}>
            Habit Tracker
          </Typography>
        </Box>

        {/* Date Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
          <IconButton onClick={() => setSelectedDate(subDays(selectedDate, 1))} size="small">
            <ChevronLeft />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 600, px: 1, minWidth: '85px', textAlign: 'center' }}>
            {isSameDay(selectedDate, trueToday) ? 'Today' : format(selectedDate, 'MMM d')}
          </Typography>
          <IconButton 
            onClick={() => setSelectedDate(addDays(selectedDate, 1))} 
            disabled={isSameDay(selectedDate, trueToday)}
            size="small"
          >
            <ChevronRight />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DailyScore completedCount={completedSelectedCount} totalCount={allTrackable.length} />
          <Tooltip title="Settings">
            <IconButton onClick={() => setIsSettingsOpen(true)} size="small" sx={{ color: 'text.secondary' }}>
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Quote Banner */}
      <AtmosphereQuote quote={dailyQuote.text} author={dailyQuote.author} />

      {/* Main Content — Horizontal Stacked Sections */}
      <Box sx={{ 
        height: isMobile ? 'auto' : 'calc(100vh - 160px)', 
        overflowY: 'auto', 
        borderTop: '1px solid', 
        borderColor: 'divider' 
      }}>

        {/* Section 1: Critical Habits */}
        <Box sx={{ p: isMobile ? 2 : 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              CRITICAL HABITS
            </Typography>
            <Box>
              <IconButton onClick={() => setIsAddOpen(true)} color="primary" size="small">
                <Add />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {criticalHabits.map((habit, index) => (
              <Box key={habit.id}>
                <CriticalHabitCard 
                  habit={habit} 
                  index={index} 
                  selectedDate={selectedDateStr}
                  onComplete={handleComplete}
                  onDelete={handleDeleteHabit}
                  onArchive={(id) => handleArchiveHabit(id, true)}
                  onUpdateNotes={handleUpdateNotes}
                />
                <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                  <Button 
                    size="small" 
                    startIcon={<History />} 
                    sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                    onClick={() => { setBackfillHabitId(habit.id); setIsBackfillOpen(true); }}
                  >
                    Review History
                  </Button>
                </Box>
              </Box>
            ))}
            {criticalHabits.length === 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary">No critical habits yet. Click + to add one.</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Section 2: Routines */}
        <Box sx={{ p: isMobile ? 2 : 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              ROUTINES
            </Typography>
            <IconButton onClick={() => { setNewHabit(h => ({...h, type: 'normal'})); setIsAddOpen(true); }} color="primary" size="small">
              <Add />
            </IconButton>
          </Box>
          {normalHabits.length > 0 ? (
             <NormalHabitsCore 
                habits={normalHabits} 
                selectedDate={selectedDateStr}
                onComplete={handleComplete} 
                onDelete={handleDeleteHabit} 
                onArchive={(id) => handleArchiveHabit(id, true)}
                onUpdateNotes={handleUpdateNotes}
             />
          ) : (
             <Typography variant="body2" color="text.secondary">No routines yet.</Typography>
          )}
          {normalHabits.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {normalHabits.map(h => (
                <Button
                  key={h.id}
                  size="small"
                  startIcon={<History />}
                  sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                  onClick={() => { setBackfillHabitId(h.id); setIsBackfillOpen(true); }}
                >
                  Review History ({h.name})
                </Button>
              ))}
            </Box>
          )}
        </Box>

        {/* Section 3: Incubator */}
        <Box sx={{ minHeight: isMobile ? '300px' : '400px' }}>
          <NotesPanel 
            customPath="planner/incubator/notes" 
            title="Habit Incubator"
            enableLock={false}
            sx={{ 
              height: '100%',
              minHeight: isMobile ? '300px' : '400px',
              borderRadius: 0, 
              boxShadow: 'none',
              border: 'none'
            }} 
          />
        </Box>

        {/* Section 4: Archived Habits */}
        {archivedHabits.length > 0 && (
          <Box sx={{ p: isMobile ? 2 : 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box 
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setIsArchivedExpanded(!isArchivedExpanded)}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                ARCHIVED HABITS ({archivedHabits.length})
              </Typography>
              <IconButton size="small">
                {isArchivedExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={isArchivedExpanded}>
              <Box sx={{ mt: 2 }}>
                <List dense>
                  {archivedHabits.map(h => (
                    <ListItem 
                      key={h.id}
                      sx={{ 
                        bgcolor: 'action.hover', 
                        borderRadius: 1, 
                        mb: 1,
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <ListItemText 
                        primary={h.name} 
                        secondary={`${h.type.toUpperCase()} · ${h.streak || 0} day streak`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Unarchive">
                          <IconButton size="small" onClick={() => handleArchiveHabit(h.id, false)} sx={{ mr: 1 }}>
                            <Unarchive fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Permanently">
                          <IconButton size="small" color="error" onClick={() => handleDeleteHabit(h.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>

      {/* ===== NEW HABIT DIALOG ===== */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} maxWidth="xs" fullWidth scroll="paper">
        <DialogTitle>New Habit</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Habit Name" variant="outlined" fullWidth
              value={newHabit.name} 
              onChange={e => setNewHabit({...newHabit, name: e.target.value})}
            />
            <Select 
              value={newHabit.type} fullWidth
              onChange={e => setNewHabit({...newHabit, type: e.target.value})}
            >
              <MenuItem value="critical">Critical (Core)</MenuItem>
              <MenuItem value="normal">Routine (Normal)</MenuItem>
            </Select>
            <TextField
              label="Target Days" variant="outlined" type="number" fullWidth
              value={newHabit.targetDays}
              onChange={e => setNewHabit({...newHabit, targetDays: Number(e.target.value) || ''})}
              helperText="How many days do you want to follow this habit?"
              inputProps={{ min: 1 }}
            />
            {newHabit.type === 'normal' && (
              <TextField 
                label="Identity/Group (e.g. The Athlete)" variant="outlined" fullWidth
                value={newHabit.identity} 
                onChange={e => setNewHabit({...newHabit, identity: e.target.value})}
              />
            )}
            {newHabit.type === 'critical' && (
              <>
                <Typography variant="caption" color="text.secondary">I will [Behavior] at [Time] in [Location]</Typography>
                <TextField label="Behavior (e.g. Exercise)" variant="outlined" size="small" fullWidth value={newHabit.behavior} onChange={e => setNewHabit({...newHabit, behavior: e.target.value})} />
                <TextField label="Time (e.g. 6 PM)" variant="outlined" size="small" fullWidth value={newHabit.time} onChange={e => setNewHabit({...newHabit, time: e.target.value})} />
                <TextField label="Location (e.g. Living Room)" variant="outlined" size="small" fullWidth value={newHabit.location} onChange={e => setNewHabit({...newHabit, location: e.target.value})} />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddHabit}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* ===== BACKFILL DIALOG ===== */}
      <Dialog open={isBackfillOpen} onClose={() => setIsBackfillOpen(false)} maxWidth="xs" fullWidth scroll="paper">
        <DialogTitle>Add Past Completion — {backfillTarget?.name}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tap a date below to mark it as completed. Already-completed dates are highlighted.
          </Typography>
          <List dense>
            {last30Days.map(dateStr => {
              const alreadyDone = (backfillTarget?.completionDates || []).includes(dateStr);
              const hurdleLog = (backfillTarget?.frictionLogs || {})[dateStr];
              
              return (
                <ListItem 
                  key={dateStr} 
                  component="div"
                  sx={{ 
                    bgcolor: alreadyDone ? 'action.selected' : 'transparent',
                    borderRadius: 1,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <ListItemText 
                    primary={format(parseISO(dateStr), 'EEEE, MMM d, yyyy')}
                    secondary={hurdleLog ? `🚧 ${hurdleLog}` : null}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'warning.main' }}
                    sx={{ flexGrow: 1 }}
                  />
                  {alreadyDone ? (
                    <Typography variant="caption" color="success.main" fontWeight={700}>✅ Done</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" color="primary" onClick={() => handleBackfill(dateStr)} sx={{ minWidth: 'unset', px: 1, py: 0.25, fontSize: '0.7rem' }}>
                        ✅ Complete
                      </Button>
                      <Button size="small" variant="outlined" color="warning" onClick={() => setHurdlePrompt({ open: true, dateStr, text: hurdleLog || '' })} sx={{ minWidth: 'unset', px: 1, py: 0.25, fontSize: '0.7rem' }}>
                        🚧 Log Hurdle
                      </Button>
                    </Box>
                  )}
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsBackfillOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ===== LOG HURDLE DIALOG ===== */}
      <Dialog open={hurdlePrompt.open} onClose={() => setHurdlePrompt({ open: false, dateStr: '', text: '' })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Friction Analysis</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            What hurdle stopped the person you want to become on <strong>{hurdlePrompt.dateStr && format(parseISO(hurdlePrompt.dateStr), 'MMM d, yyyy')}</strong>?
          </Typography>
          <TextField
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            placeholder="I was too tired after work..."
            value={hurdlePrompt.text}
            onChange={(e) => setHurdlePrompt({ ...hurdlePrompt, text: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHurdlePrompt({ open: false, dateStr: '', text: '' })}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleSaveHurdle}>Save Hurdle</Button>
        </DialogActions>
      </Dialog>

      {/* ===== SETTINGS (QUOTES) DIALOG ===== */}
      <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle>Habit Tracker Settings</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Daily Quotes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            One will be randomly displayed each time you open the tracker.
          </Typography>
          <List dense sx={{ mb: 2 }}>
            {(settings?.quotes || []).map((q, i) => (
              <React.Fragment key={i}>
                <ListItem sx={{ py: 1 }}>
                  <ListItemText 
                    primary={`"${q.text}"`}
                    secondary={`— ${q.author}`}
                    primaryTypographyProps={{ variant: 'body2', fontStyle: 'italic' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" onClick={() => handleDeleteQuote(i)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {i < (settings?.quotes || []).length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {(!settings?.quotes || settings.quotes.length === 0) && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No quotes yet. Add your first one below.
              </Typography>
            )}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Add New Quote</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField label="Quote Text" variant="outlined" size="small" fullWidth multiline rows={2} value={newQuote.text} onChange={e => setNewQuote({...newQuote, text: e.target.value})} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="Author" variant="outlined" size="small" fullWidth value={newQuote.author} onChange={e => setNewQuote({...newQuote, author: e.target.value})} />
              <Button variant="outlined" onClick={handleAddQuote} disabled={!newQuote.text.trim()} sx={{ minWidth: '80px' }}>Add</Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
