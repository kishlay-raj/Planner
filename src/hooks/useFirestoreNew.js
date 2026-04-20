import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { doc, collection, onSnapshot, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
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
    // Buffer snapshots that arrive while we're typing so we don't lose remote changes
    const pendingSnapshotRef = useRef(null);
    // Track the updatedAt of the last thing we wrote, so we can compare with incoming snapshots
    const lastWriteTimestampRef = useRef(0);

    // Store initialValue in a ref to avoid dependency issues
    const initialValueRef = useRef(initialValue);
    initialValueRef.current = initialValue;
    
    // Track pending timeouts and active writes to ensure we don't release the lock prematurely
    const activeWriteCountRef = useRef(0);
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
            activeWriteCountRef.current = 0;
            pendingSnapshotRef.current = null;
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
                if (isTyping.current) {
                    // While we're actively typing/saving, buffer the incoming snapshot instead
                    // of discarding it. We'll apply it after our write settles.
                    pendingSnapshotRef.current = snap;
                    return;
                }

                if (snap.exists()) {
                    setData(snap.data());
                } else {
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

    // Keep track of pending data to save
    const pendingDataRef = useRef(null);
    const savePromiseRef = useRef(null);

    // Internal function to perform the actual Firestore write
    const performWrite = useCallback(async (dataToWrite) => {
        if (!currentUser) {
            const localKey = `firestore_${path}`;
            localStorage.setItem(localKey, JSON.stringify(dataToWrite));
            return;
        }

        const docRef = getDocRef();
        if (!docRef || dataToWrite === undefined || dataToWrite === null) return;

        try {
            // Always include a write timestamp so we can detect which device wrote last
            const writeTs = Date.now();
            lastWriteTimestampRef.current = writeTs;
            // Fire and forget so offline writes don't hang UI
            setDoc(docRef, { ...dataToWrite, _updatedAt: writeTs }, { merge: true })
                .then(() => console.log(`✅ Saved: ${path}`))
                .catch(e => console.error(`❌ Save failed async for ${path}:`, e));
        } catch (e) {
            console.error(`❌ Save preparation failed for ${path}:`, e);
            throw e; // Re-throw to be caught by saveData
        }
    }, [currentUser, path, getDocRef]);

    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Save function with debounce
    const saveData = useCallback((newData) => {
        // Mark as typing immediately so incoming snapshots don't overwrite us
        isTyping.current = true;
        setSaving(true);
        setError(null);
        setData(newData);
        pendingDataRef.current = newData;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        else activeWriteCountRef.current++; // New chain of updates starting

        timeoutRef.current = setTimeout(async () => {
            const dataToWrite = pendingDataRef.current;
            // Clear pending ref before writing to ensure we don't double write on cleanup if this finishes
            pendingDataRef.current = null;
            timeoutRef.current = null;

            try {
                await performWrite(dataToWrite);
                setSaving(false);
            } catch (err) {
                setError(err);
                setSaving(false);
            } finally {
                // Done with one write
                activeWriteCountRef.current--;
                // Only release lock if no more writes are starting/pending
                if (activeWriteCountRef.current <= 0) {
                    isTyping.current = false;
                    activeWriteCountRef.current = 0; // Guard against negatives
                }

                // If lock released, check for buffered remote updates
                if (!isTyping.current) {
                    const buffered = pendingSnapshotRef.current;
                    pendingSnapshotRef.current = null;
                    if (buffered) {
                        const remoteData = buffered.exists() ? buffered.data() : null;
                        const remoteTs = remoteData?._updatedAt || 0;
                        if (remoteTs > lastWriteTimestampRef.current) {
                            console.log(`🔄 Applying remote update from another device for ${path}`);
                            setData(remoteData || initialValueRef.current);
                        }
                    }
                }
            }
        }, 800);
    }, [performWrite]);

    // Cleanup: Flush any pending writes on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (pendingDataRef.current) {
                console.log(`⚠️ Flushing pending write for ${path} on unmount`);
                performWrite(pendingDataRef.current).catch(err => console.error("Flush failed:", err));
            }
        };
    }, [performWrite, path]);

    return [data, saveData, loading, saving, error];
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

    // Track items that are currently being updated locally to avoid snapshot flickering
    const updatingIdsRef = useRef(new Set());

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
                const docs = snapshot.docs.map(doc => {
                    const data = doc.data();
                    
                    // If this specific document was just updated locally, ignore its current
                    // remote state from the snapshot (it's likely old) and keep local state.
                    if (updatingIdsRef.current.has(doc.id)) {
                        // Return null to flag that we should keep the current local state for this item
                        return null; 
                    }

                    const { id: _, ...dataWithoutId } = data;
                    return {
                        id: doc.id,
                        ...dataWithoutId
                    };
                });

                setItems(prevItems => {
                    const newItems = [...prevItems];
                    docs.forEach((doc, index) => {
                        if (doc === null) return; // Keep existing local state for this item
                        
                        // Find if item already exists in our local state
                        const existingIndex = newItems.findIndex(item => item.id === snapshot.docs[index].id);
                        if (existingIndex > -1) {
                            newItems[existingIndex] = doc;
                        } else {
                            newItems.push(doc);
                        }
                    });

                    // Remove items that are no longer in the server snapshot 
                    // AND not currently being optimistically added/deleted
                    const serverIds = new Set(snapshot.docs.map(d => d.id));
                    return newItems.filter(item => serverIds.has(item.id) || updatingIdsRef.current.has(item.id));
                });
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
            setItems(prev => {
                const updated = [...prev, newItem];
                localStorage.setItem(`firestore_collection_${collectionPath}`, JSON.stringify(updated));
                return updated;
            });
            return newItem.id;
        }

        const colRef = getCollectionRef();
        if (!colRef) return null;

        // Safer ID generation to avoid millisecond collisions
        const id = customId || (Date.now().toString() + Math.random().toString(36).substring(2, 7));
        const docRef = doc(colRef, id);

        // Track that this ID is being updated/added
        updatingIdsRef.current.add(id);

        const { id: _, ...dataWithoutId } = itemData;
        const newItem = { id, ...dataWithoutId, createdAt: itemData.createdAt || Date.now() };

        setItems(prev => [...prev, newItem]);

        try {
            setDoc(docRef, { ...dataWithoutId, createdAt: newItem.createdAt })
                .then(() => console.log(`✅ Added to ${collectionPath}: ${id}`))
                .catch(e => console.error(`❌ Add failed async for ${collectionPath}:`, e));
            return id;
        } catch (e) {
            console.error(`❌ Add preparation failed:`, e);
            setItems(prev => prev.filter(item => item.id !== id));
            return null;
        } finally {
            updatingIdsRef.current.delete(id);
        }
    }, [currentUser, collectionPath, getCollectionRef]);

    // Update existing item
    const updateItem = useCallback(async (id, updates) => {
        if (!currentUser) {
            setItems(prev => {
                const updated = prev.map(item =>
                    item.id === id ? { ...item, ...updates } : item
                );
                localStorage.setItem(`firestore_collection_${collectionPath}`, JSON.stringify(updated));
                return updated;
            });
            return;
        }

        // Track that this ID is being updated
        updatingIdsRef.current.add(id);

        const timestamp = Date.now();
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates, updatedAt: timestamp } : item
        ));

        const colRef = getCollectionRef();
        if (!colRef) return;

        const docRef = doc(colRef, id);
        try {
            setDoc(docRef, { ...updates, updatedAt: timestamp }, { merge: true })
                .then(() => console.log(`✅ Updated ${collectionPath}/${id}`))
                .catch(e => console.error(`❌ Update failed async for ${collectionPath}:`, e));
        } catch (e) {
            console.error(`❌ Update preparation failed:`, e);
        } finally {
            // A bit of delay before removing from updatingIds to allow snapshots to settle
            setTimeout(() => updatingIdsRef.current.delete(id), 1000);
        }
    }, [currentUser, collectionPath, getCollectionRef]);

    // Delete item
    const deleteItemFn = useCallback(async (id) => {
        if (!currentUser) {
            setItems(prev => {
                const updated = prev.filter(item => item.id !== id);
                localStorage.setItem(`firestore_collection_${collectionPath}`, JSON.stringify(updated));
                return updated;
            });
            return;
        }

        updatingIdsRef.current.add(id);
        setItems(prev => prev.filter(item => item.id !== id));

        const colRef = getCollectionRef();
        if (!colRef) return;

        const docRef = doc(colRef, id);
        try {
            deleteDoc(docRef)
                .then(() => console.log(`✅ Deleted ${collectionPath}/${id}`))
                .catch(e => console.error(`❌ Delete failed async for ${collectionPath}:`, e));
        } catch (e) {
            console.error(`❌ Delete preparation failed:`, e);
        } finally {
            setTimeout(() => updatingIdsRef.current.delete(id), 1000);
        }
    }, [currentUser, collectionPath, getCollectionRef]);

    return [items, addItem, updateItem, deleteItemFn, loading];
}

// Re-export old hook for backward compatibility during migration
export { useFirestore } from './useFirestore';
