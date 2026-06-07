import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Only show logs in development mode
const isDev = process.env.NODE_ENV === 'development';

export function useFirestore(location, initialValue, merge = true) {
    const { currentUser } = useAuth();

    // location can be a string (docId for root collections) or array [collection, docId]
    // We'll standardize on path segments relative to `users/{uid}/`
    // E.g. useFirestore('settings/navigation') -> users/{uid}/settings/navigation

    const [data, setData] = useState(initialValue);
    const [loading, setLoading] = useState(true);

    // Use a ref to prevent writing back data we just received from a snapshot (loops)
    const isRemoteUpdate = useRef(false);
    const isTyping = useRef(false);

    useEffect(() => {
        // Fallback to localStorage if no user
        if (!currentUser) {
            const localKey = Array.isArray(location) ? location.join('_') : location;
            // Map old keys to support legacy data if possible?
            // For now, let's just use the location as key.
            try {
                const saved = localStorage.getItem(localKey);
                if (saved) {
                    setData(JSON.parse(saved));
                }
            } catch (e) {
                if (isDev) console.warn("Error reading localStorage", e);
            }
            setLoading(false);
            return;
        }

        const pathSegments = Array.isArray(location) ? location : location.split('/');
        // Construct doc path: users/{uid}/{...segments}
        // If segments has odd length (collection), throw error? 
        // Firestore structure: Collection/Doc/Collection/Doc
        // users/{uid} is a Doc. 
        // If location is "tasks", path is users/{uid}/data/tasks ? Or users/{uid} (doc) -> field?
        // Let's use subcollections for scalability.
        // users/{uid}/tasks/list (doc)? Or users/{uid}/appData/tasks (doc)?
        // Let's go with: users/{uid}/{collection}/{docId}
        // If location provided is single string like 'tasks', we treat it as a doc in a default 'app' collection?
        // No, better to be explicit.

        // Simplification: We will store most things as documents in a 'userData' subcollection.
        // users/{uid}/userData/{location} 
        // e.g. location="tasks" -> users/{uid}/userData/tasks

        const docRef = doc(db, 'users', currentUser.uid, 'userData', Array.isArray(location) ? location.join('_') : location);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (isTyping.current) return;
            if (docSnap.exists()) {
                isRemoteUpdate.current = true;
                const rawData = docSnap.data();
                // Unwrap array if it was wrapped
                if (rawData && rawData._isArray && Array.isArray(rawData.items)) {
                    setData(rawData.items);
                } else if (rawData && rawData._isPrimitive && 'value' in rawData) {
                    // Unwrap primitive (string, number, boolean) that was wrapped for Firestore
                    setData(rawData.value);
                } else {
                    setData(rawData);
                }
            } else {
                // Document doesn't exist, use initial value
            }
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, location]);

    // Ref for write debounce and pending data
    const timeoutRef = useRef(null);
    const pendingDataRef = useRef(null);

    // Keep active references to prevent closure stale problems in cleanup
    const currentUserRef = useRef(currentUser);
    const locationRef = useRef(location);
    const dataRef = useRef(data);

    useEffect(() => {
        currentUserRef.current = currentUser;
        locationRef.current = location;
        dataRef.current = data;
    }, [currentUser, location, data]);

    const performWrite = useCallback(async (dataToWrite, user, loc) => {
        if (!user) {
            const localKey = Array.isArray(loc) ? loc.join('_') : loc;
            localStorage.setItem(localKey, JSON.stringify(dataToWrite));
            return;
        }

        const docRef = doc(db, 'users', user.uid, 'userData', Array.isArray(loc) ? loc.join('_') : loc);
        try {
            let dataToSave;
            if (Array.isArray(dataToWrite)) {
                dataToSave = { _isArray: true, items: dataToWrite };
            } else if (dataToWrite !== null && typeof dataToWrite !== 'object') {
                dataToSave = { _isPrimitive: true, value: dataToWrite };
            } else {
                dataToSave = dataToWrite;
            }

            if (dataToSave === undefined || dataToSave === null) {
                return;
            }

            await setDoc(docRef, dataToSave, { merge });
            if (isDev) console.log(`✅ Firestore write SUCCESS (flush) for "${loc}"`);
        } catch (e) {
            console.error("❌ Error saving to Firestore (flush):", e);
        }
    }, [merge]);

    // Cleanup timeout and flush on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (pendingDataRef.current !== null) {
                if (isDev) console.log(`⚠️ Flushing pending write for ${locationRef.current} on unmount`);
                performWrite(pendingDataRef.current, currentUserRef.current, locationRef.current).catch(err =>
                    console.error("Flush failed on unmount:", err)
                );
            }
        };
    }, [performWrite]);

    const [saving, setSaving] = useState(false);

    const saveData = (newDataOrFn) => {
        if (isDev) console.log("saveData called for:", location);

        isTyping.current = true;

        // Support functional updates like React's setState
        const currentData = pendingDataRef.current !== null ? pendingDataRef.current : data;
        const newData = typeof newDataOrFn === 'function' ? newDataOrFn(currentData) : newDataOrFn;

        // 1. Update local state immediately for responsiveness
        setData(newData);
        setSaving(true);
        pendingDataRef.current = newData;

        // 2. Debounce the write to Firestore
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            const dataToWrite = pendingDataRef.current;
            pendingDataRef.current = null;
            timeoutRef.current = null;

            if (currentUser) {
                const docPath = `users/${currentUser.uid}/userData/${Array.isArray(location) ? location.join('_') : location}`;
                if (isDev) console.log("⏳ Starting Firestore write...");
                if (isDev) console.log("📍 Document path:", docPath);
                const docRef = doc(db, 'users', currentUser.uid, 'userData', Array.isArray(location) ? location.join('_') : location);
                try {
                    // Wrap arrays and primitives since Firestore requires objects at root
                    let dataToSave;
                    if (Array.isArray(dataToWrite)) {
                        dataToSave = { _isArray: true, items: dataToWrite };
                    } else if (dataToWrite !== null && typeof dataToWrite !== 'object') {
                        // String, number, boolean — wrap in an object for Firestore
                        dataToSave = { _isPrimitive: true, value: dataToWrite };
                    } else {
                        dataToSave = dataToWrite;
                    }

                    // Safety check for undefined/null data
                    if (dataToSave === undefined || dataToSave === null) {
                        if (isDev) console.warn("⚠️ Skipping Firestore write - data is undefined or null for:", location);
                        setSaving(false);
                        return;
                    }

                    const dataPreview = JSON.stringify(dataToSave) || '';
                    if (isDev) console.log("📦 Data to save:", dataPreview.substring(0, 200) + (dataPreview.length > 200 ? "..." : ""));
                    
                    await setDoc(docRef, dataToSave, { merge });
                    if (isDev) console.log(`✅ Firestore write SUCCESS for "${location}"`);
                    setSaving(false);
                } catch (e) {
                    console.error("❌ Error saving to Firestore:", e.code, e.message);
                    setSaving(false);
                }
            } else {
                if (isDev) console.log("Writing to LocalStorage (No User):", location);
                const localKey = Array.isArray(location) ? location.join('_') : location;
                localStorage.setItem(localKey, JSON.stringify(dataToWrite));
                setSaving(false);
            }
            isTyping.current = false;
        }, 1000); // 1 second debounce
    };

    return [data, saveData, loading, saving];
}

