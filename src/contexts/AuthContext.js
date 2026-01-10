import React, { useContext, useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const { getAdditionalUserInfo } = await import("firebase/auth");
            const { logAnalyticsEvent } = await import("../firebase");

            const additionalUserInfo = getAdditionalUserInfo(result);
            if (additionalUserInfo?.isNewUser) {
                logAnalyticsEvent('sign_up', { method: 'google' });
            }
            logAnalyticsEvent('login', { method: 'google' });

            return result;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
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
