import React, { useContext, useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loginWithGoogle() {
        try {
            await signInWithRedirect(auth, googleProvider);
            // Page will redirect, no return value needed immediately
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    function logout() {
        return signOut(auth);
    }

    // Handle Auth State Changes & Redirect Results
    useEffect(() => {
        // Check for redirect result (from signInWithRedirect)
        getRedirectResult(auth).then(async (result) => {
            if (result) {
                const { getAdditionalUserInfo } = await import("firebase/auth");
                const { logAnalyticsEvent } = await import("../firebase");

                const additionalUserInfo = getAdditionalUserInfo(result);
                if (additionalUserInfo?.isNewUser) {
                    logAnalyticsEvent('sign_up', { method: 'google' });
                }
                logAnalyticsEvent('login', { method: 'google' });
            }
        }).catch((error) => {
            console.error("Redirect auth error:", error);
        });

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
