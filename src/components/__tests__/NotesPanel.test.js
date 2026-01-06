import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotesPanel from '../NotesPanel';
import * as AuthContext from '../../contexts/AuthContext';
import * as FirestoreHooks from '../../hooks/useFirestoreNew';

// --- Mocks ---
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useFirestoreNew');

// Mock ReactQuill because it needs specific DOM APIs
jest.mock('react-quill', () => ({ value, onChange, placeholder }) => (
    <div data-testid="react-quill">
        <textarea
            aria-label="Editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
        <div data-testid="content-display">{value}</div>
    </div>
));

// Mock date-fns to return consistent dates if needed, 
// strictly normally we can rely on real date-fns but formatting is important.

describe('NotesPanel Component', () => {
    const mockSetNoteData = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup Auth Mock
        AuthContext.useAuth.mockReturnValue({
            currentUser: { uid: 'test-user' }
        });

        // Setup Firestore Doc Mock
        FirestoreHooks.useFirestoreDoc.mockImplementation((path, initialValue) => {
            // Check path to simulate data
            if (path.includes('2026-01-01')) {
                return [{ content: 'Notes for Jan 1' }, mockSetNoteData, false];
            }
            if (path.includes('2026-01-02')) {
                return [{ content: 'Notes for Jan 2' }, mockSetNoteData, false];
            }
            // Default blank
            return [{ content: '' }, mockSetNoteData, false];
        });
    });

    it('renders with correct date header', () => {
        render(
            <NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />
        );
        expect(screen.getByText(/Notes for January 1, 2026/i)).toBeInTheDocument();
    });

    it('loads content from Firestore for the specific date', () => {
        render(
            <NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />
        );
        expect(screen.getByTestId('content-display')).toHaveTextContent('Notes for Jan 1');
    });

    it('updates content when typing', () => {
        render(
            <NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />
        );

        const editor = screen.getByLabelText('Editor');
        fireEvent.change(editor, { target: { value: 'New content typed' } });

        // NotesPanel calls setNoteData with object
        expect(mockSetNoteData).toHaveBeenCalledWith({ content: 'New content typed' });
    });

    it('changes content when date changes', () => {
        const { rerender } = render(
            <NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />
        );
        expect(screen.getByTestId('content-display')).toHaveTextContent('Notes for Jan 1');

        // Change date
        rerender(
            <NotesPanel selectedDate={new Date('2026-01-02T12:00:00')} />
        );

        expect(screen.getByText(/Notes for January 2, 2026/i)).toBeInTheDocument();
        // Since we mocked the hook to return 'Notes for Jan 2' for this path
        expect(screen.getByTestId('content-display')).toHaveTextContent('Notes for Jan 2');
    });

    it('renders demo content for logged-out user', () => {
        AuthContext.useAuth.mockReturnValue({ currentUser: null });
        FirestoreHooks.useFirestoreDoc.mockReturnValue([{ content: '' }, mockSetNoteData, false]);

        render(
            <NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />
        );

        // Check for some demo text
        // Check for some demo text in the display div
        const contentDisplay = screen.getByTestId('content-display');
        expect(contentDisplay).toHaveTextContent(/Welcome to Flow Planner Demo/i);
    });
});
