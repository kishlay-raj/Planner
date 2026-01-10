import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { doc, collection, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for a single Firestore document with real-time updates
 * 
 * @param {string} path - Path relative to users/{uid}/, e.g. 'profile/settings' or 'planner/daily/2024-01-01'
 * @param {any} initialValue - Default value when document doesn't exist
 * @returns {[data, setData, loading]} - Current data, setter function, loading state
 */
export function useFirestoreDoc(path, initialValue) {
    const { currentUser } = useAuth();
    const [data, setData] = useState(initialValue);
    const [loading, setLoading] = useState(true);
    const timeoutRef = useRef(null);

    // Store initialValue in a ref to avoid dependency issues
    const initialValueRef = useRef(initialValue);
    initialValueRef.current = initialValue;

    const isTyping = useRef(false);

    // Track the current path to detect changes
    const currentPathRef = useRef(path);

    // Build full path: users/{uid}/{path}
    // Firestore requires document refs to have even segments (collection/doc/collection/doc)
    // For paths like 'planner/daily/2026-01-01' (3 segments), we flatten to 'planner_daily/2026-01-01' (2 segments)
    // This converts: users/{uid}/planner/daily/2026-01-01 (5 segments, invalid)
    // To: users/{uid}/planner_daily/2026-01-01 (4 segments, valid)
    const getDocRef = useCallback(() => {
        if (!currentUser || !path) return null;
        const segments = path.split('/').filter(Boolean);

        // If we have an odd number of segments, flatten the first n-1 segments into one collection name
        // e.g. ['planner', 'daily', '2026-01-01'] -> ['planner_daily', '2026-01-01']
        if (segments.length % 2 !== 0) {
            const docId = segments.pop(); // Last segment is always the document ID
            const collectionName = segments.join('_'); // Join remaining as collection name
            return doc(db, 'users', currentUser.uid, collectionName, docId);
        }

        return doc(db, 'users', currentUser.uid, ...segments);
    }, [currentUser, path]);

    // Subscribe to real-time updates
    useEffect(() => {
        // Check if path actually changed
        const pathChanged = currentPathRef.current !== path;
        currentPathRef.current = path;

        // Reset state when path changes to ensure we load fresh data and don't show stale data
        if (pathChanged) {
            isTyping.current = false;
            setLoading(true);
            // Don't reset data immediately - let Firestore provide the new data
            // This prevents the "blank flash" when switching dates
        }

        if (!currentUser) {
            // Fallback to localStorage when not logged in
            try {
                const localKey = `firestore_${path}`;
                const saved = localStorage.getItem(localKey);
                if (saved) {
                    setData(JSON.parse(saved));
                } else {
                    setData(initialValueRef.current);
                }
            } catch (e) {
                console.warn('localStorage read error:', e);
                setData(initialValueRef.current);
            }
            setLoading(false);
            return;
        }

        const docRef = getDocRef();
        if (!docRef) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(
            docRef,
            (snap) => {
                // If the user is currently typing/saving, DO NOT overwrite local state with Firestore data
                // This prevents the "cursor jump" or "input reset" issues during the debounce delay
                if (isTyping.current) return;

                if (snap.exists()) {
                    setData(snap.data());
                } else {
                    // Document doesn't exist, use initial value
                    setData(initialValueRef.current);
                }
                setLoading(false);
            },
            (error) => {
                console.error(`Firestore error for ${path}:`, error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser, path, getDocRef]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Save function with debounce
    const saveData = useCallback((newData) => {
        // Mark as typing immediately so incoming snapshots don't overwrite us
        isTyping.current = true;
        setData(newData);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            if (currentUser) {
                const docRef = getDocRef();
                if (!docRef || newData === undefined || newData === null) {
                    isTyping.current = false;
                    return;
                }

                try {
                    await setDoc(docRef, newData, { merge: true });
                    console.log(`✅ Saved: ${path}`);
                } catch (e) {
                    console.error(`❌ Save failed for ${path}:`, e);
                } finally {
                    // Release the lock after write is confirmed
                    isTyping.current = false;
                }
            } else {
                // Save to localStorage as fallback
                const localKey = `firestore_${path}`;
                localStorage.setItem(localKey, JSON.stringify(newData));
                isTyping.current = false;
            }
        }, 800);
    }, [currentUser, path, getDocRef]);

    return [data, saveData, loading];
}

/**
 * Hook for a Firestore collection with real-time updates
 * Returns documents as an array with their IDs
 * 
 * @param {string} collectionPath - Path relative to users/{uid}/, e.g. 'tasks/active'
 * @param {string} orderByField - Optional field to order by
 * @returns {[items, addItem, updateItem, deleteItem, loading]}
 */
export function useFirestoreCollection(collectionPath, orderByField = null) {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Build collection reference
    // Firestore requires collection refs to have odd segments (collection/doc/collection)
    // For paths like 'tasks/active' (2 segments), we flatten to 'tasks_active' (1 segment)
    // This converts: users/{uid}/tasks/active (4 segments, invalid for collection)
    // To: users/{uid}/tasks_active (3 segments, valid)
    const getCollectionRef = useCallback(() => {
        if (!currentUser || !collectionPath) return null;
        const segments = collectionPath.split('/').filter(Boolean);

        // If we have an even number of segments, flatten them all into one collection name
        // e.g. ['tasks', 'active'] -> ['tasks_active']
        if (segments.length % 2 === 0) {
            const collectionName = segments.join('_');
            return collection(db, 'users', currentUser.uid, collectionName);
        }

        return collection(db, 'users', currentUser.uid, ...segments);
    }, [currentUser, collectionPath]);

    // Subscribe to collection
    useEffect(() => {
        if (!currentUser) {
            try {
                const localKey = `firestore_collection_${collectionPath}`;
                const saved = localStorage.getItem(localKey);
                if (saved) setItems(JSON.parse(saved));
            } catch (e) {
                console.warn('localStorage read error:', e);
            }
            setLoading(false);
            return;
        }

        const colRef = getCollectionRef();
        if (!colRef) {
            setLoading(false);
            return;
        }

        const q = orderByField ? query(colRef, orderBy(orderByField)) : colRef;

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const docs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setItems(docs);
                setLoading(false);
            },
            (error) => {
                console.error(`Firestore collection error for ${collectionPath}:`, error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser, collectionPath, getCollectionRef, orderByField]);

    // Add new item
    const addItem = useCallback(async (itemData, customId = null) => {
        if (!currentUser) {
            // localStorage fallback
            const newItem = { id: customId || Date.now().toString(), ...itemData };
            const updated = [...items, newItem];
            setItems(updated);
            localStorage.setItem(`firestore_collection_${collectionPath}`, JSON.stringify(updated));
            return newItem.id;
        }

        const colRef = getCollectionRef();
        if (!colRef) return null;

        const id = customId || Date.now().toString();
        const docRef = doc(colRef, id);

        const newItem = { id, ...itemData, createdAt: itemData.createdAt || Date.now() };

        // Optimistic update
        setItems(prev => [...prev, newItem]);

        try {
            await setDoc(docRef, { ...itemData, createdAt: newItem.createdAt });
            console.log(`✅ Added to ${collectionPath}: ${id}`);
            return id;
        } catch (e) {
            console.error(`❌ Add failed:`, e);
            // Revert optimistic update on error
            setItems(prev => prev.filter(item => item.id !== id));
            return null;
        }
    }, [currentUser, collectionPath, getCollectionRef, items]);

    // Update existing item
    const updateItem = useCallback(async (id, updates) => {
        if (!currentUser) {
            const updated = items.map(item =>
                item.id === id ? { ...item, ...updates } : item
            );
            setItems(updated);
            localStorage.setItem(`firestore_collection_${collectionPath}`, JSON.stringify(updated));
            return;
        }

        // Optimistic update
        const timestamp = Date.now();
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates, updatedAt: timestamp } : item
        ));

        const colRef = getCollectionRef();
        if (!colRef) return;

        const docRef = doc(colRef, id);
        try {
            await setDoc(docRef, { ...updates, updatedAt: timestamp }, { merge: true });
            console.log(`✅ Updated ${collectionPath}/${id}`);
        } catch (e) {
            console.error(`❌ Update failed:`, e);
            // We might want to revert here, but tricky without previous state.
            // Simplified: rely on snapshot to fix eventually, or could capture prev item.
        }
    }, [currentUser, collectionPath, getCollectionRef, items]);

    // Delete item
    const deleteItemFn = useCallback(async (id) => {
        if (!currentUser) {
            const updated = items.filter(item => item.id !== id);
            setItems(updated);
            localStorage.setItem(`firestore_collection_${collectionPath}`, JSON.stringify(updated));
            return;
        }

        // Optimistic update
        setItems(prev => prev.filter(item => item.id !== id));

        const colRef = getCollectionRef();
        if (!colRef) return;

        const docRef = doc(colRef, id);
        try {
            await deleteDoc(docRef);
            console.log(`✅ Deleted ${collectionPath}/${id}`);
        } catch (e) {
            console.error(`❌ Delete failed:`, e);
            // Revert on error? Requires fetching or restoring.
        }
    }, [currentUser, collectionPath, getCollectionRef, items]);

    return [items, addItem, updateItem, deleteItemFn, loading];
}

// Re-export old hook for backward compatibility during migration
export { useFirestore } from './useFirestore';
