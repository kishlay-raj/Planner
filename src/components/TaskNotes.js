import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Code
} from '@mui/icons-material';
import { IconButton, Paper, Divider, Box } from '@mui/material';

function TaskNotes({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Add notes about this task...',
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const MenuBar = () => {
    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 0.5, 
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
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
      </Box>
    );
  };

  return (
    <Paper variant="outlined" sx={{ mt: 2 }}>
      <MenuBar />
      <Box sx={{ 
        p: 2,
        minHeight: 200,
        '& .ProseMirror': {
          outline: 'none',
          height: '100%',
          '& p.is-editor-empty:first-child::before': {
            content: 'attr(data-placeholder)',
            float: 'left',
            color: 'grey.400',
            pointerEvents: 'none',
            height: 0
          }
        }
      }}>
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
}

export default TaskNotes; 