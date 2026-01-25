import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
    console.log("Initializing Firebase with config:", {
        apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId
    });
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Initialize Analytics (only in production or when measurementId is present)
let analytics = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    try {
        analytics = getAnalytics(app);
    } catch (error) {
        console.warn("Firebase Analytics failed to initialize", error);
    }
}
export { analytics };

// Helper function to log custom events
export const logAnalyticsEvent = (eventName, eventParams = {}) => {
    if (analytics) {
        logEvent(analytics, eventName, eventParams);
    }
};

try {
    // enableIndexedDbPersistence is deprecated in favor of initializeFirestore with cache settings
    // checking if we can use the new API or just suppress for now
    enableIndexedDbPersistence(db)
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one tab at a time.
                // Silently ignore or warn if needed
                console.warn('Persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                // The current browser does not support all of the features required to enable persistence
                // Silently ignore
            }
        });
} catch (e) {
    console.warn("Error enabling persistence", e);
}

