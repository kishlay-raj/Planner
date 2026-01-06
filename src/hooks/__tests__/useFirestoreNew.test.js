import { renderHook, act } from '@testing-library/react';
import { useFirestoreDoc } from '../useFirestoreNew';
import * as firestore from 'firebase/firestore';
import * as AuthContext from '../../contexts/AuthContext';

// Mock Firebase dependencies
jest.mock('firebase/firestore');
jest.mock('../../firebase', () => ({
    db: {}
}));
jest.mock('../../contexts/AuthContext');

describe('useFirestoreDoc', () => {
    const mockCurrentUser = { uid: 'test-uid' };
    const mockOnSnapshot = jest.fn();
    const mockUnsubscribe = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mocks
        AuthContext.useAuth.mockReturnValue({ currentUser: mockCurrentUser });

        firestore.doc.mockReturnValue('mock-doc-ref');

        mockOnSnapshot.mockImplementation((ref, successCb) => {
            // Return unsubscribe function
            return mockUnsubscribe;
        });
        firestore.onSnapshot.mockImplementation(mockOnSnapshot);
    });

    it('should initialize with default value and loading true', () => {
        const { result } = renderHook(() => useFirestoreDoc('test/path', { foo: 'bar' }));

        expect(result.current[0]).toEqual({ foo: 'bar' }); // data
        expect(result.current[2]).toBe(true); // loading state
    });

    it('should update data when snapshot is received', () => {
        const { result } = renderHook(() => useFirestoreDoc('test/path', { foo: 'bar' }));

        // Simulate Firestore snapshot update
        const mockSnap = {
            exists: () => true,
            data: () => ({ foo: 'updated', baz: 'qux' })
        };

        act(() => {
            // Find the success callback passed to onSnapshot and call it
            const successCallback = mockOnSnapshot.mock.calls[0][1];
            successCallback(mockSnap);
        });

        expect(result.current[0]).toEqual({ foo: 'updated', baz: 'qux' });
        expect(result.current[2]).toBe(false); // Loading should be false
    });

    it('should use initial value if document does not exist', () => {
        const { result } = renderHook(() => useFirestoreDoc('test/path', { default: 'value' }));

        const mockSnap = {
            exists: () => false
        };

        act(() => {
            const successCallback = mockOnSnapshot.mock.calls[0][1];
            successCallback(mockSnap);
        });

        expect(result.current[0]).toEqual({ default: 'value' });
        expect(result.current[2]).toBe(false);
    });

    it('should NOT reset data to initialValue immediately when path changes', () => {
        // This tests the specific bug fix for "flashing" blank content on date change
        const initialProps = { path: 'path/1', initialValue: { content: 'loading...' } };
        const { result, rerender } = renderHook(
            ({ path, initialValue }) => useFirestoreDoc(path, initialValue),
            { initialProps }
        );

        // 1. Simulate data load for path 1
        const mockSnap1 = { exists: () => true, data: () => ({ content: 'Data 1' }) };
        act(() => {
            mockOnSnapshot.mock.calls[0][1](mockSnap1);
        });
        expect(result.current[0]).toEqual({ content: 'Data 1' });

        // 2. Change path
        rerender({ path: 'path/2', initialValue: { content: 'loading...' } });

        // Expect loading to be true
        expect(result.current[2]).toBe(true);

        // CRITICAL EXPECTATION: Data should still be 'Data 1' (stale data) rather than 'loading...' (initialValue)
        // while we wait for the new snapshot. This prevents the "blank flash".
        expect(result.current[0]).toEqual({ content: 'Data 1' });

        // 3. Simulate data load for path 2
        const mockSnap2 = { exists: () => true, data: () => ({ content: 'Data 2' }) };
        act(() => {
            // The SECOND call to onSnapshot (since re-subscribed)
            mockOnSnapshot.mock.calls[1][1](mockSnap2);
        });

        expect(result.current[0]).toEqual({ content: 'Data 2' });
        expect(result.current[2]).toBe(false);
    });
});
