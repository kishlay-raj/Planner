import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Divider, IconButton } from '@mui/material';
import { format } from 'date-fns';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Code,
  Title,
  Link as LinkIcon,
  CheckBox,
  Highlight as HighlightIcon
} from '@mui/icons-material';
import './NotesPanel.css';

function NotesPanel({ selectedDate }) {
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('dailyNotes');
    return savedNotes ? JSON.parse(savedNotes) : {};
  });

  const currentDate = format(selectedDate, 'yyyy-MM-dd');
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your notes for today...',
      }),
      Highlight,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'note-link',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: notes[currentDate] || '',
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      const updatedNotes = { ...notes, [currentDate]: content };
      setNotes(updatedNotes);
      localStorage.setItem('dailyNotes', JSON.stringify(updatedNotes));
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(notes[currentDate] || '');
    }
  }, [currentDate, editor, notes]);

  const MenuBar = () => {
    if (!editor) return null;

    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 0.5, 
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        flexWrap: 'wrap'
      }}>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        >
          <Title fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
        >
          <FormatBold fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
        >
          <FormatItalic fontSize="small" />
        </IconButton>
        <Divider orientation="vertical" flexItem />
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
        >
          <FormatListBulleted fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
        >
          <FormatListNumbered fontSize="small" />
        </IconButton>
        <Divider orientation="vertical" flexItem />
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
        >
          <FormatQuote fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
        >
          <Code fontSize="small" />
        </IconButton>
        <Divider orientation="vertical" flexItem />
        <IconButton
          size="small"
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={editor.isActive('link') ? 'is-active' : ''}
        >
          <LinkIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? 'is-active' : ''}
        >
          <HighlightIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={editor.isActive('taskList') ? 'is-active' : ''}
        >
          <CheckBox fontSize="small" />
        </IconButton>
      </Box>
    );
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
      <MenuBar />
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#ffffff',
        p: '20px 24px',
        '& .ProseMirror': {
          maxWidth: '100%',
          width: '100%',
          minHeight: '100%',
        }
      }}>
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
}

export default NotesPanel; 