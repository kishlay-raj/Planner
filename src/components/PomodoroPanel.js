import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Container,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Slider,
  Divider,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import {
  Settings,
  Psychology,
  WorkOutline,
  TrendingUp,
  AccessTime
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

import { useFirestore } from '../hooks/useFirestore';


function PomodoroPanel({
  timeLeft,
  isActive,
  mode,
  setMode,
  cycles,
  toggleTimer,
  resetTimer,
  settings,
  handleSettingChange,
  workType = 'deep',
  onWorkTypeToggle,
  sessionHistory = []
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsView, setAnalyticsView] = useState(0); // 0: Daily, 1: Weekly, 2: Monthly

  // Stats handling (keeping this locally for now as it reads from firestore mostly)
  const defaultStats = { total: 0, today: 0, lastDate: new Date().toDateString() };
  const [stats] = useFirestore('pomodoroStats', defaultStats);

  // Helper functions for analytics
  const calculateTotalTime = (type) => {
    return sessionHistory
      .filter(s => type === 'all' || s.workType === type)
      .reduce((sum, s) => sum + s.duration, 0);
  };

  const calculateTodayTime = (type) => {
    const today = new Date().toDateString();
    return sessionHistory
      .filter(s => s.date === today && (type === 'all' || s.workType === type))
      .reduce((sum, s) => sum + s.duration, 0);
  };

  const getDailyData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayData = {
        name: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        deep: sessionHistory.filter(s => s.date === dateStr && s.workType === 'deep').reduce((sum, s) => sum + s.duration, 0),
        shallow: sessionHistory.filter(s => s.date === dateStr && s.workType === 'shallow').reduce((sum, s) => sum + s.duration, 0)
      };
      last7Days.push(dayData);
    }
    return last7Days;
  };

  const getWeeklyData = () => {
    const last4Weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      const weekSessions = sessionHistory.filter(s => {
        const sessionDate = new Date(s.timestamp);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });

      last4Weeks.push({
        name: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        deep: weekSessions.filter(s => s.workType === 'deep').reduce((sum, s) => sum + s.duration, 0),
        shallow: weekSessions.filter(s => s.workType === 'shallow').reduce((sum, s) => sum + s.duration, 0)
      });
    }
    return last4Weeks;
  };

  const getMonthlyData = () => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      const monthSessions = sessionHistory.filter(s => {
        const sessionDate = new Date(s.timestamp);
        return sessionDate.getMonth() === date.getMonth() && sessionDate.getFullYear() === date.getFullYear();
      });

      last6Months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        deep: monthSessions.filter(s => s.workType === 'deep').reduce((sum, s) => sum + s.duration, 0),
        shallow: monthSessions.filter(s => s.workType === 'shallow').reduce((sum, s) => sum + s.duration, 0)
      });
    }
    return last6Months;
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const modeColors = {
    pomodoro: '#b74b4b',
    shortBreak: '#4c9195',
    longBreak: '#457ca3'
  };

  const handleModeChangeInternal = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: modeColors[mode],
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        pb: 8, // Add padding at bottom for better scrolling
        filter: settings.darkMode && isActive ? 'brightness(0.85)' : 'none',
        animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transition: 'filter 0.3s ease-in-out',
        '@keyframes fadeIn': {
          from: { opacity: 0, bgcolor: 'background.paper' },
          to: { opacity: 1, bgcolor: modeColors[mode] }
        }
      }}
    >
      <Box sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pl: 3,
        pr: 8,
        py: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Typography variant="h6" sx={{
          fontWeight: 500,
          letterSpacing: 0.5
        }}>
          Pomodoro
        </Typography>
        <IconButton
          color="inherit"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            width: 36,
            height: 36,
            padding: 2,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            right: 32,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            },
            transition: 'all 0.2s',
            '& svg': {
              fontSize: 22,
              color: 'rgba(255, 255, 255, 0.9)'
            }
          }}
        >
          <Settings />
        </IconButton>
      </Box>

      <Container maxWidth="sm" sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 6
      }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChangeInternal}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            padding: '4px',
            '& .MuiToggleButton-root': {
              color: 'white',
              border: 'none',
              px: 3,
              py: 1,
              borderRadius: 1.5,
              fontSize: '0.9rem',
              fontWeight: 500,
              letterSpacing: 0.5,
              transition: 'all 0.2s',
              '&.Mui-selected': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                }
              }
            }
          }}
        >
          <ToggleButton value="pomodoro">Pomodoro</ToggleButton>
          <ToggleButton value="shortBreak">Short Break</ToggleButton>
          <ToggleButton value="longBreak">Long Break</ToggleButton>
        </ToggleButtonGroup>

        <Typography
          variant="h1"
          sx={{
            fontSize: '120px',
            fontWeight: 'bold',
            mt: 8,
            mb: 6,
            fontFamily: 'monospace',
            letterSpacing: 4,
            userSelect: 'none'
          }}
        >
          {`${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={toggleTimer}
            sx={{
              bgcolor: 'white',
              color: modeColors[mode],
              px: 6,
              py: 2,
              fontSize: '1.25rem',
              fontWeight: 'bold',
              borderRadius: 2,
              minWidth: 200,
              letterSpacing: 1,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                transform: 'translateY(-1px)',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
              }
            }}
          >
            {isActive ? 'PAUSE' : 'START'}
          </Button>
          <Button
            variant="contained"
            color="inherit"
            onClick={resetTimer}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              px: 3,
              py: 2,
              borderRadius: 2,
              minWidth: 'auto',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            SKIP
          </Button>
        </Box>

        <Fade in={true}>
          <Box sx={{
            mt: 6,
            textAlign: 'center',
            opacity: 0.9
          }}>
            <Typography
              sx={{
                fontSize: '1.1rem',
                fontWeight: 500,
                mb: 1
              }}
            >
              #{cycles + 1}
            </Typography>
            <Typography
              sx={{
                fontSize: '1rem',
                opacity: 0.8,
                letterSpacing: 0.5
              }}
            >
              {mode === 'pomodoro' ? 'Time to focus!' : 'Time for a break!'}
            </Typography>
          </Box>
        </Fade>
        {mode === 'pomodoro' && (
          <Chip
            icon={workType === 'deep' ? <Psychology /> : <WorkOutline />}
            label={workType === 'deep' ? 'Deep Work' : 'Shallow Work'}
            onClick={onWorkTypeToggle}
            sx={{
              mt: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              px: 2,
              py: 2.5,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              '& .MuiChip-icon': { color: 'white', fontSize: '1.2rem' }
            }}
          />
        )}
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.6 }}>
          Today's Focus: {stats.today} cycles
        </Typography>
      </Container>

      {/* Analytics Section */}
      <Box sx={{
        bgcolor: 'rgba(255, 255, 255, 0.05)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        py: 4,
        px: 3,
        mt: 4
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <TrendingUp sx={{ color: 'white', opacity: 0.9 }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Work Analytics
            </Typography>
          </Box>

          {/* Statistics Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Psychology sx={{ color: '#29B6F6', fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Total Deep Work
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {formatTime(calculateTotalTime('deep'))}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WorkOutline sx={{ color: '#FFB74D', fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Total Shallow Work
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {formatTime(calculateTotalTime('shallow'))}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTime sx={{ color: '#66BB6A', fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Today's Deep Work
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {formatTime(calculateTodayTime('deep'))}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTime sx={{ color: '#FFA726', fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Today's Shallow Work
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {formatTime(calculateTodayTime('shallow'))}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Graph Section */}
          <Paper sx={{
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            p: 3,
            borderRadius: 2
          }}>
            <Tabs
              value={analyticsView}
              onChange={(e, v) => setAnalyticsView(v)}
              sx={{
                mb: 3,
                '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 },
                '& .Mui-selected': { color: 'white' },
                '& .MuiTabs-indicator': { bgcolor: 'white' }
              }}
            >
              <Tab label="Daily (Last 7 Days)" />
              <Tab label="Weekly (Last 4 Weeks)" />
              <Tab label="Monthly (Last 6 Months)" />
            </Tabs>

            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsView === 0 ? getDailyData() : analyticsView === 1 ? getWeeklyData() : getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255, 255, 255, 0.7)"
                    tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="rgba(255, 255, 255, 0.7)"
                    tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
                    label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: 'rgba(255, 255, 255, 0.7)' }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 8,
                      color: 'white'
                    }}
                    formatter={(value) => `${value} min`}
                  />
                  <Legend
                    wrapperStyle={{ color: 'white' }}
                    iconType="circle"
                  />
                  <Bar dataKey="deep" fill="#29B6F6" name="Deep Work" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="shallow" fill="#FFB74D" name="Shallow Work" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Container>
      </Box>

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Timer Settings
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            Time (minutes)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Pomodoro"
              type="number"
              value={settings.pomodoro}
              onChange={(e) => handleSettingChange('pomodoro', e.target.value)}
              size="small"
            />
            <TextField
              label="Short Break"
              type="number"
              value={settings.shortBreak}
              onChange={(e) => handleSettingChange('shortBreak', e.target.value)}
              size="small"
            />
            <TextField
              label="Long Break"
              type="number"
              value={settings.longBreak}
              onChange={(e) => handleSettingChange('longBreak', e.target.value)}
              size="small"
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={settings.autoStartBreaks}
                onChange={(e) => handleSettingChange('autoStartBreaks', e.target.checked)}
              />
            }
            label="Auto Start Breaks"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.autoStartPomodoros}
                onChange={(e) => handleSettingChange('autoStartPomodoros', e.target.checked)}
              />
            }
            label="Auto Start Pomodoros"
          />

          <TextField
            label="Long Break interval"
            type="number"
            value={settings.longBreakInterval}
            onChange={(e) => handleSettingChange('longBreakInterval', e.target.value)}
            size="small"
            sx={{ mt: 2, mb: 3 }}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            SOUND
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Select
              value={settings.alarmSound}
              onChange={(e) => handleSettingChange('alarmSound', e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="Kitchen">Kitchen</MenuItem>
              <MenuItem value="Bell">Bell</MenuItem>
              <MenuItem value="Birds">Birds</MenuItem>
            </Select>
            <Box sx={{ mt: 1 }}>
              <Slider
                value={settings.alarmVolume}
                onChange={(e, value) => handleSettingChange('alarmVolume', value)}
                valueLabelDisplay="auto"
              />
            </Box>
            <TextField
              label="Repeat"
              type="number"
              value={settings.alarmRepeat}
              onChange={(e) => handleSettingChange('alarmRepeat', e.target.value)}
              size="small"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Select
              value={settings.tickingSound}
              onChange={(e) => handleSettingChange('tickingSound', e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="Ticking Slow">Ticking Slow</MenuItem>
              <MenuItem value="Ticking Fast">Ticking Fast</MenuItem>
            </Select>
            <Box sx={{ mt: 1 }}>
              <Slider
                value={settings.tickingVolume}
                onChange={(e, value) => handleSettingChange('tickingVolume', value)}
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
            THEME
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Select
              value={settings.hourFormat}
              onChange={(e) => handleSettingChange('hourFormat', e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="24-hour">24-hour</MenuItem>
              <MenuItem value="12-hour">12-hour</MenuItem>
            </Select>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={settings.darkMode}
                onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
              />
            }
            label="Dark Mode when running"
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default PomodoroPanel; 