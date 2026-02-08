import React from 'react';
import { Paper, Typography, Box, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import { format, addDays, subDays } from 'date-fns';
import {
  History as HistoryIcon,
  NavigateBefore,
  NavigateNext,
  CloudDone,
  CloudUpload,
  CloudOff,
  Lock,
  LockOpen
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './NotesPanel.css';
import { useFirestoreDoc } from '../hooks/useFirestoreNew';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

// Import markdown shortcuts if available
// eslint-disable-next-line no-unused-vars
let MarkdownShortcuts;
try {
  MarkdownShortcuts = require('quill-markdown-shortcuts');
} catch (e) {
  console.warn('quill-markdown-shortcuts not available, markdown features disabled');
  console.warn('quill-markdown-shortcuts not available, markdown features disabled');
}

// Demo content for non-logged-in users
const DEMO_CONTENT = `<h1>✨ Welcome to Flow Planner Demo</h1>
          <p><br></p>
          <p>This is your space for <strong>daily notes</strong> — and yes, it supports markdown! But for now, let's get you started:</p>
          <p><br></p>
          <h2>🧠 Main Focus</h2>
          <ul>
            <li>Create some new to-dos</li>
            <li>Drag and re-order your to-dos</li>
            <li>Drop a to-do in the <strong>timebox scheduler</strong></li>
            <li>Check off a to-do to complete it!</li>
          </ul>
          <p><br></p>
          <h2>🚀 What Else Does Flow Planner Offer?</h2>
          <p>Click on the <strong>left panel</strong> to discover:</p>
          <ul>
            <li>📅 Weekly, Monthly & Yearly Planners</li>
            <li>📓 Daily Journal</li>
            <li>🔄 Routine Builder</li>
            <li>🍅 Pomodoro Timer</li>
            <li>...and more!</li>
          </ul>
          <p><br></p>
          <p><em>Sign in with Google to save your notes and access all features!</em></p>`;

const initialNoteData = { content: '' };

const CustomToolbar = ({ style }) => (
  <div id="notes-toolbar" style={style}>
    <span className="ql-formats">
      <Tooltip title="Bold (Cmd+B)" enterDelay={0} arrow>
        <button className="ql-bold" aria-label="Bold (Cmd+B)" />
      </Tooltip>
      <Tooltip title="Italic (Cmd+I)" enterDelay={0} arrow>
        <button className="ql-italic" aria-label="Italic (Cmd+I)" />
      </Tooltip>
      <Tooltip title="Strike (Cmd+Shift+S)" enterDelay={0} arrow>
        <button className="ql-strike" aria-label="Strike (Cmd+Shift+S)" />
      </Tooltip>
      <Tooltip title="Clear Formatting" enterDelay={0} arrow>
        <button className="ql-clean" aria-label="Clear Formatting" />
      </Tooltip>
    </span>
    <span className="ql-formats">
      <Tooltip title="Heading 1" enterDelay={0} arrow>
        <button className="ql-header" value="1" aria-label="Heading 1">H1</button>
      </Tooltip>
      <Tooltip title="Heading 2" enterDelay={0} arrow>
        <button className="ql-header" value="2" aria-label="Heading 2">H2</button>
      </Tooltip>
    </span>
    <span className="ql-formats">
      <Tooltip title="Ordered List" enterDelay={0} arrow>
        <button className="ql-list" value="ordered" aria-label="Ordered List" />
      </Tooltip>
      <Tooltip title="Bullet List" enterDelay={0} arrow>
        <button className="ql-list" value="bullet" aria-label="Bullet List" />
      </Tooltip>
    </span>
    <span className="ql-formats">
      <Tooltip title="Link" enterDelay={0} arrow>
        <button className="ql-link" aria-label="Link" />
      </Tooltip>
    </span>
  </div>
);

function NotesPanel({ selectedDate, onDateChange, sx = {}, customPath = null, title = "Notes", enableLock = false }) {
  const { currentUser } = useAuth();
  const currentDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  // Use date-based document path - each day is a separate small document
  // If customPath is provided, use it directly. Otherwise use the date-based path.
  // Use date-based document path - each day is a separate small document
  // If customPath is provided, use it directly. Otherwise use the date-based path.
  const docPath = customPath || `planner/daily/${currentDate}`;
  const [noteData, setNoteData, loading, saving, error] = useFirestoreDoc(docPath, initialNoteData);

  // Lock state: initialize with enableLock prop (default true for General Notes)
  const [isLocked, setIsLocked] = React.useState(enableLock);

  // Local state for immediate editor responsiveness
  // Initialize with persisted content or empty string (or demo content if logged out)
  const [editorContent, setEditorContent] = React.useState('');

  // Track the last path we successfully synced from the server
  // This prevents the "Echo Problem" where our own saves come back from the server
  // and overwrite our more recent local typing.
  const lastSyncedPath = React.useRef(null);
  const lastServerContent = React.useRef(initialNoteData.content);

  // Sync from server to local state ONLY when loading a new path
  React.useEffect(() => {
    // Wait for the hook to finish loading the new path's data
    if (loading) return;

    // Only update local state if we haven't synced this path yet
    if (docPath !== lastSyncedPath.current) {
      const contentToShow = currentUser
        ? (noteData?.content || '')
        : (noteData?.content || DEMO_CONTENT);

      setEditorContent(contentToShow);
      lastServerContent.current = contentToShow;
      lastSyncedPath.current = docPath;
    }
  }, [docPath, loading, noteData, currentUser]);

  // ... (rest of the component)

  const getSyncStatus = () => {
    if (loading) return { icon: <CloudUpload fontSize="small" sx={{ animation: 'spin 2s linear infinite' }} />, text: 'Loading...', color: 'text.secondary' };
    if (error) return { icon: <CloudOff fontSize="small" />, text: 'Error saving', color: 'error.main' };
    if (saving) return { icon: <CloudUpload fontSize="small" sx={{ animation: 'spin 2s linear infinite' }} />, text: 'Saving...', color: 'primary.main' };
    return { icon: <CloudDone fontSize="small" />, text: 'All changes saved', color: 'success.main' };
  };

  const status = getSyncStatus();

  // Debounced save to Firestore
  React.useEffect(() => {
    // Don't save if content hasn't changed from server version (prevents loops)
    if (editorContent === lastServerContent.current) return;

    // Direct call - useFirestoreDoc inside setNoteData handles the debouncing (800ms)
    // We simply pass the new content immediately to the hook.
    setNoteData({ content: editorContent });

    // Analytics
    import("../firebase").then(({ logAnalyticsEvent }) => {
      logAnalyticsEvent('note_updated', {
        date: currentDate || 'general',
        length: editorContent.length
      });
    });

  }, [editorContent, setNoteData, currentDate]);

  // Handle immediate local update
  const handleNoteChange = (content) => {
    setEditorContent(content);
  };

  // State for delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const quillRef = React.useRef(null);
  const [historyMenuAnchor, setHistoryMenuAnchor] = React.useState(null);
  const [availableDates, setAvailableDates] = React.useState([]);

  // Load available dates with notes from Firestore
  React.useEffect(() => {
    if (!currentUser) {
      setAvailableDates([]);
      return;
    }

    async function fetchAvailableDates() {
      try {
        const dailyPlannerRef = collection(db, 'users', currentUser.uid, 'planner_daily');
        const q = query(dailyPlannerRef, orderBy('__name__', 'desc'), limit(50));
        const snapshot = await getDocs(q);

        const dates = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          // Only include dates with actual content
          if (data.content && data.content.trim() && data.content !== '<p><br></p>') {
            dates.push(doc.id); // doc.id is the date in yyyy-MM-dd format
          }
        });

        // Sort in descending order and limit to 20
        setAvailableDates(dates.sort((a, b) => new Date(b) - new Date(a)).slice(0, 20));
      } catch (error) {
        console.error('Error fetching available dates:', error);
      }
    }

    fetchAvailableDates();
  }, [currentUser]);

  // Refresh available dates when content changes
  React.useEffect(() => {
    const hasContent = editorContent && editorContent.trim() && editorContent !== '<p><br></p>';
    if (currentUser && hasContent && !availableDates.includes(currentDate)) {
      setAvailableDates(prev => [currentDate, ...prev].sort((a, b) => new Date(b) - new Date(a)).slice(0, 20));
    }
  }, [editorContent, currentDate, currentUser, availableDates]);

  const handleHistoryMenuOpen = (event) => {
    setHistoryMenuAnchor(event.currentTarget);
  };

  const handleHistoryMenuClose = () => {
    setHistoryMenuAnchor(null);
  };

  const handleDateSelect = (dateKey) => {
    if (onDateChange) {
      onDateChange(new Date(dateKey));
    }
    handleHistoryMenuClose();
  };

  // Helper to open dialog
  const promptDeleteAll = () => {
    setShowDeleteConfirm(true);
  };

  // We need a stable reference to the prompt function for the Quill module
  const promptDeleteAllRef = React.useRef(promptDeleteAll);
  React.useEffect(() => {
    promptDeleteAllRef.current = promptDeleteAll;
  }, []);

  // Quill editor modules and formats
  const modules = React.useMemo(() => ({
    toolbar: {
      container: '#notes-toolbar',
    },
    keyboard: {
      bindings: {
        bold: {
          key: 'B',
          shortKey: true,
          handler: function (range, context) {
            this.quill.format('bold', !context.format.bold);
          }
        },
        italic: {
          key: 'I',
          shortKey: true,
          handler: function (range, context) {
            this.quill.format('italic', !context.format.italic);
          }
        },
        strike: {
          key: 'S',
          shortKey: true,
          shiftKey: true, // Cmd+Shift+S for strike
          handler: function (range, context) {
            this.quill.format('strike', !context.format.strike);
          }
        }
      }
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'strike',
    'list', 'bullet',
    'link'
  ];

  const handleConfirmDelete = () => {
    setEditorContent('');
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Intercept actions that would replace/delete the entire content
  const checkMassDeletion = (e) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return false;

    const length = editor.getLength(); // Length includes trailing newline
    const selection = editor.getSelection();

    // Check if entire content (excluding potential trailing newline difference) is selected
    // Quill document usually has length N+1 (newline). Selection of all text is length N or N+1.
    // We check if selection length covers at least length - 1
    if (selection && selection.length >= length - 1 && length > 1) {
      e.preventDefault();
      e.stopPropagation();
      setShowDeleteConfirm(true);
      return true;
    }
    return false;
  };

  const handleEditorKeyDown = (e) => {
    // Allow non-modifying keys (arrows, command, etc.)
    // We want to block:
    // 1. Printable characters (key length 1) UNLESS Ctrl/Meta/Alt is pressed (shortcuts)
    // 2. Backspace / Delete
    // 3. Enter

    // Shortcuts like Cmd+C (Copy), Cmd+A (Select All), Cmd+X (Cut - handled by onCut), Cmd+V (Paste - handled by onPaste), Cmd+B (Bold) should be allowed or handled separately.
    // Note: Cmd+X/Cmd+V might not fire keydown in all browsers or might need explicit handling. Browser usually fires 'cut'/'paste' events.

    const isShortcut = e.metaKey || e.ctrlKey || e.altKey;
    const isPrintable = e.key.length === 1 && !isShortcut;
    const isDelete = e.key === 'Backspace' || e.key === 'Delete';
    const isEnter = e.key === 'Enter';

    if (isPrintable || isDelete || isEnter) {
      checkMassDeletion(e);
    }
  };

  const handlePaste = (e) => {
    checkMassDeletion(e);
  };

  const handleCut = (e) => {
    checkMassDeletion(e);
  };

  return (
    <Paper
      className="notes-panel"
      sx={{
        height: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 0,
        boxShadow: 'none',
        ...sx,
      }}
    >
      <Box sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>


            {/* Lock Toggle */}
            {enableLock && (
              <Tooltip title={isLocked ? "Unlock to edit" : "Lock notes"}>
                <IconButton onClick={() => setIsLocked(!isLocked)} size="small" color={isLocked ? "default" : "primary"}>
                  {isLocked ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}

            {/* Sync Status Icon */}
            {currentUser && (
              <Tooltip title={status.text}>
                <Box sx={{ display: 'flex', alignItems: 'center', color: status.color, opacity: 0.7 }}>
                  {status.icon}
                </Box>
              </Tooltip>
            )}

            {/* Date Navigation */}
            {!customPath && onDateChange && selectedDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton onClick={() => onDateChange(subDays(selectedDate, 1))} size="small">
                  <NavigateBefore fontSize="small" />
                </IconButton>
                <Typography variant="caption" sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.75rem' }}>
                  {format(selectedDate, 'MMM d, yyyy')}
                </Typography>
                <IconButton onClick={() => onDateChange(addDays(selectedDate, 1))} size="small">
                  <NavigateNext fontSize="small" />
                </IconButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20 }} />
                <Tooltip title="Jump to date">
                  <IconButton onClick={handleHistoryMenuOpen} size="small">
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Menu
        anchorEl={historyMenuAnchor}
        open={Boolean(historyMenuAnchor)}
        onClose={handleHistoryMenuClose}
        PaperProps={{
          sx: {
            maxHeight: 350,
            width: 220,
            mt: 1
          }
        }}
      >
        {availableDates.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.875rem' }}>
              No notes yet
            </Typography>
          </MenuItem>
        ) : (
          availableDates.map(dateKey => (
            <MenuItem
              key={dateKey}
              onClick={() => handleDateSelect(dateKey)}
              selected={dateKey === currentDate}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                  {format(new Date(dateKey), 'MMM d, yyyy')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  {format(new Date(dateKey), 'EEEE')}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          backgroundColor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
        }}
        onKeyDownCapture={handleEditorKeyDown}
        onPasteCapture={handlePaste}
        onCutCapture={handleCut}
      >
        <CustomToolbar style={{ opacity: isLocked ? 0.6 : 1, pointerEvents: isLocked ? 'none' : 'auto' }} />
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={editorContent}
          onChange={handleNoteChange}
          modules={modules}
          formats={formats}
          readOnly={isLocked}
          placeholder={isLocked ? "Notes are locked." : "Start writing your notes for today..."}
          className={`notes-editor ${isLocked ? 'locked' : ''}`}
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Start fresh?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete all your notes for this day? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default NotesPanel;
