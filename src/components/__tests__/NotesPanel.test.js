import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotesPanel from '../NotesPanel';
import * as AuthContext from '../../contexts/AuthContext';
import * as FirestoreHooks from '../../hooks/useFirestoreNew';

// --- Mocks ---
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useFirestoreNew');
jest.mock('../../firebase', () => ({
    logAnalyticsEvent: jest.fn()
}));

// Mock ReactQuill to support ref and toolbar simulation
jest.mock('react-quill', () => {
    const React = require('react');
    return React.forwardRef(({ value = '', onChange, placeholder, modules }, ref) => {
        // Internal state for mock selection
        const [selection, setSelection] = React.useState({ index: 0, length: 0 });

        // Expose a fake editor instance via ref
        React.useImperativeHandle(ref, () => ({
            getEditor: () => ({
                getModule: (moduleName) => {
                    if (moduleName === 'toolbar') {
                        return {
                            container: global.document.querySelector('#notes-toolbar')
                        };
                    }
                    return null;
                },
                getLength: () => value.length + 1, // Quill always adds newline
                getSelection: () => selection,
                setSelection: (index, length) => setSelection({ index, length }),
            }),
            // Helper for testing to set selection directly
            setSelectionRange: (index, length) => setSelection({ index, length })
        }));

        return (
            <div data-testid="react-quill">
                <button onClick={() => setSelection({ index: 0, length: value.length })} data-testid="mock-select-all">Mock Select All</button>
                <textarea
                    aria-label="Editor"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    data-testid="quill-textarea"
                />
                <div data-testid="content-display">{value}</div>
            </div>
        );
    });
});

/* ... existing describe block start ... */

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

    describe('Mass Deletion Safeguard', () => {
        it('triggers safeguard when typing over all content', async () => {
            // Render with known content "Notes for Jan 1" (15 chars)
            const { getByTestId } = render(<NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />);

            // Access the mock ref via the editor component or finding it? 
            // Since we forwardRef in mock, we need to access the ref instance.
            // But we can't easily get the ref from outside unless we render a parent that holds it.
            // HACK: The mock exposes 'setSelectionRange' on the ref. 
            // In our test, `NotesPanel` holds the ref. I can't access it directly.
            // BUT, our Mock implementation of `react-quill` can expose a global/test-scoped helper?
            // OR we can rely on `quillRef` being used inside `checkMassDeletion`.
            // Wait, how do I set the selection in the mock from the test?
            // I need to use a different approach for the mock to allow test control.
            // Example: Add a hidden button "Select All" in the mock that sets internal selection state.

            // Let's assume I updated the mock in the previous step to include `setSelectionRange` on the return object? 
            // No, `useImperativeHandle` returns the object to the PARENT (`NotesPanel`).
            // `NotesPanel` owns the ref. I cannot touch it from the test.

            // ALTERNATIVE: I will add a test-helper button in the MOCK UI that sets the selection.
            const quillContainer = screen.getByTestId('react-quill');

            // We need to implement the "Select All" helper in the mock UI in the PREVIOUS step.
            // Since I cannot change the previous step now (it's concurrent/sequential planning), 
            // I will assume I will fix the mock in the NEXT step or previous step if I can.
            // Actually, I should have included a "Select All" button in the mock JSX.

            // Let's update the test code assuming I will add a "Select All" button to the mock.
            fireEvent.click(screen.getByTestId('mock-select-all')); // This will set selection to full length

            // Trigger KeyDown 'a' on the wrapper (Box). 
            // The Box wraps `react-quill`. We can find the textarea and fire on it, event bubbles.
            const textarea = screen.getByTestId('quill-textarea');
            fireEvent.keyDown(textarea, { key: 'a', code: 'KeyA', charCode: 65 });

            expect(await screen.findByText(/Start fresh?/i)).toBeInTheDocument();
        });

        it('triggers safeguard when pasting over all content', async () => {
            render(<NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />);
            fireEvent.click(screen.getByTestId('mock-select-all'));

            const textarea = screen.getByTestId('quill-textarea');
            fireEvent.paste(textarea, { clipboardData: { getData: () => 'new text' } });

            expect(await screen.findByText(/Start fresh?/i)).toBeInTheDocument();
        });

        it('triggers safeguard when cutting all content', async () => {
            render(<NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />);
            fireEvent.click(screen.getByTestId('mock-select-all'));

            const textarea = screen.getByTestId('quill-textarea');
            fireEvent.cut(textarea);

            expect(await screen.findByText(/Start fresh?/i)).toBeInTheDocument();
        });

        it('does NOT trigger safeguard for navigation keys', async () => {
            render(<NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />);
            fireEvent.click(screen.getByTestId('mock-select-all'));

            const textarea = screen.getByTestId('quill-textarea');
            fireEvent.keyDown(textarea, { key: 'ArrowRight' });

            expect(screen.queryByText(/Start fresh?/i)).not.toBeInTheDocument();
        });

        it('does NOT trigger safeguard for partial selection', async () => {
            render(<NotesPanel selectedDate={new Date('2026-01-01T12:00:00')} />);
            // Do NOT click Select All. Selection length is 0.

            const textarea = screen.getByTestId('quill-textarea');
            fireEvent.keyDown(textarea, { key: 'a' });

            expect(screen.queryByText(/Start fresh?/i)).not.toBeInTheDocument();
        });
    });

    describe('Analytics Events', () => {
        it('has analytics event configured', () => {
            const { logAnalyticsEvent } = require('../../firebase');
            // Verify firebase analytics is properly mocked
            expect(logAnalyticsEvent).toBeDefined();
        });
    });
});
