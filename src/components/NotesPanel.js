import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
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

    // Only update local state if:
    // 1. We haven't initialized this date yet
    // 2. OR the server content changed significantly (e.g. from another device) AND it's different from our current local state
    //    (This is tricky with real-time collab, but for single user, just checking date switch is usually enough)

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
  const modules = {
    toolbar: [
      // Direct heading buttons instead of dropdown
      ['bold', 'italic', 'strike', 'clean'],
      ['h1', 'h2'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'strike',
    'list', 'bullet',
    'link'
  ];

  // Custom toolbar handler to register the heading buttons
  const handleToolbarInit = (toolbar) => {
    if (toolbar) {
      // First, check if buttons already exist to avoid duplicates
      const existingH1 = toolbar.container.querySelector('button.ql-header[value="1"]');
      const existingH2 = toolbar.container.querySelector('button.ql-header[value="2"]');

      // Only create buttons if they don't already exist
      if (existingH1 || existingH2) return;

      // Add H1 button
      const h1Button = document.createElement('button');
      h1Button.innerHTML = 'H1';
      h1Button.className = 'ql-header';
      h1Button.value = '1';
      h1Button.title = 'Heading 1';

      // Add H2 button
      const h2Button = document.createElement('button');
      h2Button.innerHTML = 'H2';
      h2Button.className = 'ql-header';
      h2Button.value = '2';
      h2Button.title = 'Heading 2';

      // Find the container for heading buttons
      const headingContainer = toolbar.container.querySelector('.ql-formats:nth-child(2)');
      if (headingContainer) {
        // Clear any existing buttons to avoid duplicates
        while (headingContainer.firstChild) {
          headingContainer.removeChild(headingContainer.firstChild);
        }
        headingContainer.appendChild(h1Button);
        headingContainer.appendChild(h2Button);
      }
    }
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
        <ReactQuill
          theme="snow"
          value={editorContent}
          onChange={handleNoteChange}
          modules={modules}
          formats={formats}
          placeholder="Start writing your notes for today..."
          className="notes-editor"
          ref={(el) => {
            if (el && el.getEditor()) {
              const toolbar = el.getEditor().getModule('toolbar');
              if (toolbar) handleToolbarInit(toolbar);
            }
          }}
        />
      </Box>
    </Paper>
  );
}

export default NotesPanel;
