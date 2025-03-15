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
  CalendarToday,
  Assignment,
  Dashboard,
  Schedule,
  Assessment,
  ChevronLeft,
  Menu
} from '@mui/icons-material';

function Sidebar({ onNavigate }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activePanel, setActivePanel] = React.useState('planner');

  const toggleDrawer = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNavigate = (panel) => {
    setActivePanel(panel);
    onNavigate(panel);
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
          bgcolor: activePanel === 'pomodoro' ? '#b74b4b' : 'background.paper',
          color: activePanel === 'pomodoro' ? 'white' : 'inherit',
          overflowX: 'hidden',
          transition: 'width 0.2s ease-in-out, background-color 0.3s ease',
          borderRight: activePanel === 'pomodoro' 
            ? '1px solid rgba(255, 255, 255, 0.12)' 
            : '1px solid rgba(0, 0, 0, 0.12)'
        },
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