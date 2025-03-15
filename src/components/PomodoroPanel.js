import React, { useState, useEffect } from 'react';
import {
  Paper,
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
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  Settings
} from '@mui/icons-material';

function PomodoroPanel({ onModeChange }) {
  const [timeLeft, setTimeLeft] = useState(30 * 60); // Default 30 minutes
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'
  const [cycles, setCycles] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audio, setAudio] = useState(null);
  const [tickingAudio, setTickingAudio] = useState(null);

  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      pomodoro: 30,
      shortBreak: 5,
      longBreak: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      autoCheckTasks: false,
      autoSwitchTasks: true,
      alarmSound: 'Kitchen',
      alarmVolume: 50,
      alarmRepeat: 1,
      tickingSound: 'Ticking Slow',
      tickingVolume: 50,
      darkMode: false,
      hourFormat: '24-hour',
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  }, [settings]);

  // Initialize audio
  useEffect(() => {
    const alarm = new Audio(`/sounds/${settings.alarmSound.toLowerCase()}.mp3`);
    alarm.volume = settings.alarmVolume / 100;
    setAudio(alarm);

    const ticking = new Audio(`/sounds/${settings.tickingSound.toLowerCase()}.mp3`);
    ticking.volume = settings.tickingVolume / 100;
    ticking.loop = true;
    setTickingAudio(ticking);

    return () => {
      ticking.pause();
      alarm.pause();
    };
  }, [settings.alarmSound, settings.tickingSound, settings.alarmVolume, settings.tickingVolume]);

  const modeColors = {
    pomodoro: '#b74b4b',
    shortBreak: '#4c9195',
    longBreak: '#457ca3'
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
      onModeChange(newMode);
      setIsActive(false);
      tickingAudio?.pause();
      switch (newMode) {
        case 'pomodoro':
          setTimeLeft(settings.pomodoro * 60);
          break;
        case 'shortBreak':
          setTimeLeft(settings.shortBreak * 60);
          break;
        case 'longBreak':
          setTimeLeft(settings.longBreak * 60);
          break;
      }
    }
  };

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      // Start ticking sound when timer is active
      if (settings.tickingVolume > 0) {
        tickingAudio?.play();
      }

      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Stop ticking sound
      tickingAudio?.pause();

      // Play alarm sound
      if (settings.alarmVolume > 0) {
        for (let i = 0; i < settings.alarmRepeat; i++) {
          setTimeout(() => {
            audio?.play();
          }, i * 1500); // Play every 1.5 seconds
        }
      }

      setCycles(c => c + 1);
      
      // Handle auto-start features
      if (mode === 'pomodoro') {
        if (cycles + 1 >= settings.longBreakInterval) {
          setMode('longBreak');
          setTimeLeft(settings.longBreak * 60);
          setCycles(0);
        } else {
          setMode('shortBreak');
          setTimeLeft(settings.shortBreak * 60);
        }
        if (settings.autoStartBreaks) {
          setIsActive(true);
        } else {
          setIsActive(false);
        }
      } else {
        setMode('pomodoro');
        setTimeLeft(settings.pomodoro * 60);
        if (settings.autoStartPomodoros) {
          setIsActive(true);
        } else {
          setIsActive(false);
        }
      }
    }
    return () => {
      clearInterval(interval);
      tickingAudio?.pause();
    };
  }, [isActive, timeLeft, settings, mode, cycles, audio, tickingAudio]);

  const toggleTimer = () => {
    setIsActive(!isActive);
    if (isActive) {
      tickingAudio?.pause();
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    tickingAudio?.pause();
    switch (mode) {
      case 'pomodoro':
        setTimeLeft(settings.pomodoro * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreak * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreak * 60);
        break;
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Apply immediate changes where necessary
    if (key === 'pomodoro' && mode === 'pomodoro') {
      setTimeLeft(value * 60);
    } else if (key === 'shortBreak' && mode === 'shortBreak') {
      setTimeLeft(value * 60);
    } else if (key === 'longBreak' && mode === 'longBreak') {
      setTimeLeft(value * 60);
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100vh',
        bgcolor: modeColors[mode],
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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
        pt: 6,
        overflow: 'hidden'
      }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
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
          <IconButton 
            color="inherit"
            onClick={resetTimer}
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              width: 48,
              height: 48,
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            <SkipNext />
          </IconButton>
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
      </Container>

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