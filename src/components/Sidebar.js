import React from 'react';
import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Divider,
  ListItemButton,
  IconButton,
  Box,
  Tooltip
} from '@mui/material';
import {
  Timer,
  Dashboard,
  ChevronLeft,
  Menu,
  ViewWeek,
  CalendarMonth,
  EmojiEvents,
  MenuBook,
  SelfImprovement,
  ViewQuilt,
  Settings
} from '@mui/icons-material';

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

function Sidebar({ onNavigate, activePanel, pomodoroMode, navConfig }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const modeColors = {
    pomodoro: '#b74b4b',
    shortBreak: '#4c9195',
    longBreak: '#457ca3'
  };

  const toggleDrawer = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavigate = (panel) => {
    onNavigate(panel);
  };

  const getSidebarColor = () => {
    if (activePanel === 'pomodoro') {
      return modeColors[pomodoroMode];
    }
    return 'background.paper';
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isExpanded ? 240 : 60,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isExpanded ? 240 : 60,
          boxSizing: 'border-box',
          bgcolor: getSidebarColor(),
          color: activePanel === 'pomodoro' ? 'white' : 'inherit',
          overflowX: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRight: activePanel === 'pomodoro'
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : '1px solid rgba(0, 0, 0, 0.12)'
        },
        '& .MuiListItemIcon-root, & .MuiListItemText-primary, & .MuiIconButton-root': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        '& .MuiDivider-root': {
          transition: 'border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        '& .MuiListItemButton-root': {
          transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }}
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpanded ? 'flex-end' : 'center',
        p: 1,
        minHeight: 56
      }}>
        <IconButton
          onClick={toggleDrawer}
          sx={{
            color: activePanel === 'pomodoro' ? 'white' : 'inherit',
            '&:hover': {
              bgcolor: activePanel === 'pomodoro'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          {isExpanded ? <ChevronLeft /> : <Menu />}
        </IconButton>
      </Box>
      <Divider
        sx={{
          borderColor: activePanel === 'pomodoro'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.12)'
        }}
      />

      <List component="nav" sx={{ flexGrow: 1 }}>
        {navConfig && navConfig.map((item) => {
          if (!item.visible) return null;
          return (
            <Tooltip key={item.id} title={item.label} placement="right" arrow disableHoverListener={isExpanded}>
              <ListItemButton
                onClick={() => handleNavigate(item.id)}
                selected={activePanel === item.id}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: activePanel === 'pomodoro' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'
                  },
                  '&:hover': {
                    bgcolor: activePanel === 'pomodoro'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <ListItemIcon sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }}>
                  {iconMap[item.iconKey] || <Dashboard />}
                </ListItemIcon>
                {isExpanded && <ListItemText
                  primary={item.label}
                  sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }}
                />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider
        sx={{
          borderColor: activePanel === 'pomodoro'
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.12)'
        }}
      />

      {/* Settings Link at the bottom */}
      <List>
        <Tooltip title="Settings" placement="right" arrow disableHoverListener={isExpanded}>
          <ListItemButton
            onClick={() => handleNavigate('settings')}
            selected={activePanel === 'settings'}
            sx={{
              '&.Mui-selected': {
                bgcolor: activePanel === 'pomodoro' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'
              },
              '&:hover': {
                bgcolor: activePanel === 'pomodoro'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <ListItemIcon sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }}>
              <Settings />
            </ListItemIcon>
            {isExpanded && <ListItemText
              primary="Settings"
              sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }}
            />}
          </ListItemButton>
        </Tooltip>
      </List>
    </Drawer>
  );
}

export default Sidebar; 