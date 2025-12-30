import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
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
  DateRange
} from '@mui/icons-material';

function Sidebar({ onNavigate, activePanel, pomodoroMode }) {
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

      <List component="nav">
        <Tooltip title="Planner" placement="right" arrow disableHoverListener={isExpanded}>
          <ListItemButton
            onClick={() => handleNavigate('planner')}
            sx={{
              '&:hover': {
                bgcolor: activePanel === 'pomodoro'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <ListItemIcon>
              <Dashboard sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }} />
            </ListItemIcon>
            {isExpanded && <ListItemText
              primary="Planner"
              sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }}
            />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title="Weekly Planner" placement="right" arrow disableHoverListener={isExpanded}>
          <ListItemButton
            onClick={() => handleNavigate('planner-week')}
            sx={{
              '&:hover': {
                bgcolor: activePanel === 'pomodoro'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <ListItemIcon>
              <ViewWeek sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }} />
            </ListItemIcon>
            {isExpanded && <ListItemText
              primary="Weekly"
              sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }}
            />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title="Monthly Planner" placement="right" arrow disableHoverListener={isExpanded}>
          <ListItemButton
            onClick={() => handleNavigate('planner-month')}
            sx={{
              '&:hover': {
                bgcolor: activePanel === 'pomodoro'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <ListItemIcon>
              <CalendarMonth sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }} />
            </ListItemIcon>
            {isExpanded && <ListItemText
              primary="Monthly"
              sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }}
            />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title="Yearly Planner" placement="right" arrow disableHoverListener={isExpanded}>
          <ListItemButton
            onClick={() => handleNavigate('planner-year')}
            sx={{
              '&:hover': {
                bgcolor: activePanel === 'pomodoro'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <ListItemIcon>
              <DateRange sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }} />
            </ListItemIcon>
            {isExpanded && <ListItemText primary="Yearly" sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }} />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title="Pomodoro" placement="right" arrow disableHoverListener={isExpanded}>
          <ListItemButton
            onClick={() => handleNavigate('pomodoro')}
            sx={{
              '&:hover': {
                bgcolor: activePanel === 'pomodoro'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <ListItemIcon>
              <Timer sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }} />
            </ListItemIcon>
            {isExpanded && <ListItemText
              primary="Pomodoro"
              sx={{ color: activePanel === 'pomodoro' ? 'white' : 'inherit' }}
            />}
          </ListItemButton>
        </Tooltip>

        <Divider
          sx={{
            my: 1,
            borderColor: activePanel === 'pomodoro'
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(0, 0, 0, 0.12)'
          }}
        />
      </List>
      <Box sx={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        p: 1,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Divider />
      </Box>
    </Drawer>
  );
}

export default Sidebar; 