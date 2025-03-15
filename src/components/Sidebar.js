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
  ExpandLess,
  ExpandMore,
  Dashboard,
  Schedule,
  Assessment,
  Settings,
  ChevronLeft,
  Menu
} from '@mui/icons-material';

function Sidebar({ onNavigate }) {
  const [plannerOpen, setPlannerOpen] = React.useState(true);
  const [toolsOpen, setToolsOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handlePlannerClick = () => {
    setPlannerOpen(!plannerOpen);
  };

  const handleToolsClick = () => {
    setToolsOpen(!toolsOpen);
  };

  const toggleDrawer = () => {
    setIsExpanded(!isExpanded);
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
          bgcolor: 'background.paper',
          overflowX: 'hidden',
          transition: 'width 0.2s ease-in-out',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)'
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
        <IconButton onClick={toggleDrawer}>
          {isExpanded ? <ChevronLeft /> : <Menu />}
        </IconButton>
      </Box>
      <Divider />

      <List component="nav">
        <Tooltip title="Planner" placement="right" arrow disableHoverListener={isExpanded}>
          <ListItemButton onClick={() => onNavigate('planner')}>
            <ListItemIcon>
              <Dashboard />
            </ListItemIcon>
            {isExpanded && <ListItemText primary="Planner" />}
          </ListItemButton>
        </Tooltip>

        <Divider sx={{ my: 1 }} />

        <Tooltip title="Tools" placement="right" arrow disableHoverListener={isExpanded}>
          <ListItemButton onClick={handleToolsClick}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            {isExpanded && <ListItemText primary="Tools" />}
            {isExpanded && (toolsOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </Tooltip>

        <Collapse in={toolsOpen && isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <Tooltip title="Pomodoro" placement="right" arrow disableHoverListener={isExpanded}>
              <ListItemButton sx={{ pl: 4 }} onClick={() => onNavigate('pomodoro')}>
                <ListItemIcon>
                  <Timer />
                </ListItemIcon>
                {isExpanded && <ListItemText primary="Pomodoro" />}
              </ListItemButton>
            </Tooltip>
          </List>
        </Collapse>
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