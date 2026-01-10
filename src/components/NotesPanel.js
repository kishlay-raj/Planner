import React from 'react';
import { Paper, Typography, Box, Tooltip } from '@mui/material';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './NotesPanel.css';
import { useFirestoreDoc } from '../hooks/useFirestoreNew';
import { useAuth } from '../contexts/AuthContext';

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

const CustomToolbar = () => (
  <div id="notes-toolbar">
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

function NotesPanel({ selectedDate }) {
  const { currentUser } = useAuth();
  const currentDate = format(selectedDate, 'yyyy-MM-dd');

  // Use date-based document path - each day is a separate small document
  const [noteData, setNoteData] = useFirestoreDoc(`planner/daily/${currentDate}`, initialNoteData);

  // Local state for immediate editor responsiveness
  // Initialize with persisted content or empty string (or demo content if logged out)
  const [editorContent, setEditorContent] = React.useState('');

  // Track initialization to prevent overwriting local edits with stale server data
  const isInitialized = React.useRef(false);
  const lastServerContent = React.useRef('');

  // Sync from server to local state ONLY on mount or when switching dates
  React.useEffect(() => {
    // Determine what content to show
    const contentToShow = currentUser
      ? (noteData?.content || '')
      : (noteData?.content || DEMO_CONTENT);

    // Simple approach: On date change (key), reset local state
    setEditorContent(contentToShow);
    lastServerContent.current = contentToShow;

  }, [currentDate, currentUser, noteData?.content]); // Depend on currentDate to reset on day switch

  // Debounced save to Firestore
  React.useEffect(() => {
    // Don't save if content hasn't changed from server version (prevents loops)
    if (editorContent === lastServerContent.current) return;

    const handler = setTimeout(() => {
      setNoteData({ content: editorContent });
      lastServerContent.current = editorContent;
    }, 1000); // 1-second debounce

    return () => clearTimeout(handler);
  }, [editorContent, setNoteData]);

  // Handle immediate local update
  const handleNoteChange = (content) => {
    setEditorContent(content);
  };

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
      }}
    >
      <Box sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'white',
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Notes for {format(selectedDate, 'MMMM d, yyyy')}
        </Typography>
      </Box>

      <Box sx={{
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <CustomToolbar />
        <ReactQuill
          theme="snow"
          value={editorContent}
          onChange={handleNoteChange}
          modules={modules}
          formats={formats}
          placeholder="Start writing your notes for today..."
          className="notes-editor"
        />
      </Box>
    </Paper>
  );
}

export default NotesPanel;
