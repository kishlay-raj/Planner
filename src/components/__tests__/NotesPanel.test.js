import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotesPanel from '../NotesPanel';
import * as AuthContext from '../../contexts/AuthContext';
import * as FirestoreHooks from '../../hooks/useFirestoreNew';

// --- Mocks ---
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useFirestoreNew');

// Mock ReactQuill to support ref and toolbar simulation
jest.mock('react-quill', () => {
    const React = require('react');
    return React.forwardRef(({ value, onChange, placeholder }, ref) => {
        // Expose a fake editor instance via ref
        React.useImperativeHandle(ref, () => ({
            getEditor: () => ({
                getModule: (moduleName) => {
                    if (moduleName === 'toolbar') {
                        return {
                            // Use global.document to bypass Jest static analysis check
                            container: global.document.querySelector('.ql-toolbar')
                        };
                    }
                    return null;
                }
            })
        }));

        return (
            <div data-testid="react-quill">
                {/* Fake Toolbar for testing tooltips */}
                <div className="ql-toolbar">
                    <button className="ql-bold"></button>
                    <button className="ql-italic"></button>
                    <button className="ql-strike"></button>
                    <div className="ql-formats"></div> {/* For H1/H2 container */}
                    <div className="ql-formats"></div> {/* Second container */}
                </div>
                <textarea
                    aria-label="Editor"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                />
                <div data-testid="content-display">{value}</div>
            </div>
        );
    });
});

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

    it('updates content locally immediately but debounces persistence', () => {
        jest.useFakeTimers();
        render(
            <NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />
        );

        const editor = screen.getByLabelText('Editor');

        // Type something
        fireEvent.change(editor, { target: { value: 'New content typed' } });

        // 1. Verify local update is immediate (optimistic UI)
        expect(screen.getByTestId('content-display')).toHaveTextContent('New content typed');

        // 2. Verify persistence is NOT called immediately
        expect(mockSetNoteData).not.toHaveBeenCalled();

        // 3. Fast-forward time by 1000ms (debounce delay)
        jest.advanceTimersByTime(1000);

        // 4. Verify persistence IS called now
        expect(mockSetNoteData).toHaveBeenCalledWith({ content: 'New content typed' });

        jest.useRealTimers();
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
        const contentDisplay = screen.getByTestId('content-display');
        expect(contentDisplay).toHaveTextContent(/Welcome to Flow Planner Demo/i);
    });

    it('sets correct tooltips (aria-labels) on custom toolbar buttons', () => {
        render(
            <NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />
        );

        // With MUI Tooltip, the child element gets an aria-label
        // We can query by class name because Quill uses specific classes
        const boldBtn = document.querySelector('.ql-bold');
        const italicBtn = document.querySelector('.ql-italic');
        const strikeBtn = document.querySelector('.ql-strike');

        expect(boldBtn).toHaveAttribute('aria-label', 'Bold (Cmd+B)');
        expect(italicBtn).toHaveAttribute('aria-label', 'Italic (Cmd+I)');
        expect(strikeBtn).toHaveAttribute('aria-label', 'Strike (Cmd+Shift+S)');
    });
});
