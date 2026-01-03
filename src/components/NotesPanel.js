import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './NotesPanel.css';
import { useFirestoreDoc } from '../hooks/useFirestoreNew';

// Import markdown shortcuts if available
// eslint-disable-next-line no-unused-vars
let MarkdownShortcuts;
try {
  MarkdownShortcuts = require('quill-markdown-shortcuts');
} catch (e) {
  console.warn('quill-markdown-shortcuts not available, markdown features disabled');
  console.warn('quill-markdown-shortcuts not available, markdown features disabled');
}

const initialNoteData = { content: '' };

function NotesPanel({ selectedDate }) {
  const currentDate = format(selectedDate, 'yyyy-MM-dd');

  // Use date-based document path - each day is a separate small document
  const [noteData, setNoteData] = useFirestoreDoc(`planner/daily/${currentDate}`, initialNoteData);

  // Save notes when they change
  const handleNoteChange = (content) => {
    setNoteData({ content });
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
          value={noteData?.content || ''}
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