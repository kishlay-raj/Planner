import { useState, useEffect, useRef } from 'react';
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
            if (docSnap.exists()) {
                isRemoteUpdate.current = true;
                const rawData = docSnap.data();
                // Unwrap array if it was wrapped
                if (rawData && rawData._isArray && Array.isArray(rawData.items)) {
                    setData(rawData.items);
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

    // Ref for write debounce
    const timeoutRef = useRef(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const saveData = (newDataOrFn) => {
        if (isDev) console.log("saveData called for:", location);

        // Support functional updates like React's setState
        const newData = typeof newDataOrFn === 'function' ? newDataOrFn(data) : newDataOrFn;

        // 1. Update local state immediately for responsiveness
        setData(newData);

        // 2. Debounce the write to Firestore
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            if (currentUser) {
                const docPath = `users/${currentUser.uid}/userData/${Array.isArray(location) ? location.join('_') : location}`;
                if (isDev) console.log("⏳ Starting Firestore write...");
                if (isDev) console.log("📍 Document path:", docPath);
                const docRef = doc(db, 'users', currentUser.uid, 'userData', Array.isArray(location) ? location.join('_') : location);
                try {
                    // Wrap arrays in an object since Firestore requires objects at root
                    const dataToSave = Array.isArray(newData)
                        ? { _isArray: true, items: newData }
                        : newData;

                    // Safety check for undefined/null data
                    if (dataToSave === undefined || dataToSave === null) {
                        if (isDev) console.warn("⚠️ Skipping Firestore write - data is undefined or null for:", location);
                        return;
                    }

                    const dataPreview = JSON.stringify(dataToSave) || '';
                    if (isDev) console.log("📦 Data to save:", dataPreview.substring(0, 200) + (dataPreview.length > 200 ? "..." : ""));
                    const writeStartTime = Date.now();
                    await setDoc(docRef, dataToSave, { merge });
                    const writeEndTime = Date.now();
                    if (isDev) console.log(`✅ Firestore write SUCCESS for "${location}" (took ${writeEndTime - writeStartTime}ms)`);
                } catch (e) {
                    console.error("❌ Error saving to Firestore:", e.code, e.message);
                    console.error("Full error:", e);
                }
            } else {
                if (isDev) console.log("Writing to LocalStorage (No User):", location);
                const localKey = Array.isArray(location) ? location.join('_') : location;
                localStorage.setItem(localKey, JSON.stringify(newData));
            }
        }, 1000); // 1 second debounce
    };

    return [data, saveData, loading];
}

