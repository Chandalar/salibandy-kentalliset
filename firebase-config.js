/**
 * Firebase Config & Cloud Services Initialization
 * Salibandy Kentälliset & Taktiikkataulu (v55.0)
 * 
 * Provides bulletproof initialization with auto-retry, event broadcasting,
 * and seamless Google Auth (popup on desktop, redirect fallback on mobile).
 */

window.SalibandyFirebase = (function() {
    'use strict';

    // Official Firebase Project Config for line-up-a773b
    const firebaseConfig = {
        apiKey: "AIzaSyC_Fy2MXyq7gg8BacS-W5c9Sq2R1EhPqhw",
        authDomain: "line-up-a773b.firebaseapp.com",
        projectId: "line-up-a773b",
        storageBucket: "line-up-a773b.firebasestorage.app",
        messagingSenderId: "54510547272",
        appId: "1:54510547272:web:35942078ab5037091ec37d",
        measurementId: "G-3Y14E074N2"
    };

    let isInitialized = false;
    let isInitializing = false;
    let auth = null;
    let db = null;
    let initAttempts = 0;
    const maxAttempts = 120; // 120 * 50ms = 6 seconds of retries
    const readyCallbacks = [];

    function notifyReady() {
        if (!isInitialized) return;
        while (readyCallbacks.length > 0) {
            const cb = readyCallbacks.shift();
            try {
                cb({ auth, db, firebase: window.firebase });
            } catch (err) {
                console.warn('[Firebase] Callback error:', err);
            }
        }
        try {
            window.dispatchEvent(new CustomEvent('salibandy-firebase-ready', {
                detail: { auth, db, firebase: window.firebase }
            }));
        } catch (e) {}
    }

    function tryInit() {
        if (isInitialized) return true;

        if (typeof window !== 'undefined' && typeof window.firebase !== 'undefined' && window.firebase.initializeApp) {
            try {
                if (!window.firebase.apps || !window.firebase.apps.length) {
                    window.firebase.initializeApp(firebaseConfig);
                }
                auth = window.firebase.auth();
                db = window.firebase.firestore();

                // Set Auth persistence to LOCAL so user stays logged in across sessions
                if (auth && window.firebase.auth.Auth && window.firebase.auth.Auth.Persistence) {
                    auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch(err => {
                        console.warn('[Firebase] Auth persistence warning:', err);
                    });
                }

                // Enable Firestore Offline Persistence
                if (db && typeof db.enablePersistence === 'function') {
                    db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
                        if (err.code === 'failed-precondition') {
                            console.warn('[Firebase] Firestore persistence failed: Multiple tabs open');
                        } else if (err.code === 'unimplemented') {
                            console.warn('[Firebase] Firestore persistence unsupported in browser');
                        }
                    });
                }

                isInitialized = true;
                isInitializing = false;
                console.log('🔥 [Firebase] Auth & Cloud Firestore Initialized Successfully for line-up-a773b');
                notifyReady();
                return true;
            } catch (err) {
                console.warn('[Firebase] Initialization error:', err);
            }
        }
        return false;
    }

    // Polling retry for deferred or asynchronous script loads
    function startInitPolling() {
        if (tryInit()) return;
        if (isInitializing) return;
        isInitializing = true;

        const timer = setInterval(() => {
            initAttempts++;
            if (tryInit() || initAttempts >= maxAttempts) {
                clearInterval(timer);
                isInitializing = false;
                if (!isInitialized) {
                    console.warn('[Firebase] SDK load timed out. Running in local mode.');
                }
            }
        }, 50);
    }

    // Hook to early DOM ready events
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryInit);
        }
        window.addEventListener('load', tryInit);
    }

    // Try immediately
    startInitPolling();

    // Promise that resolves when Firebase is ready
    function whenReady() {
        return new Promise((resolve) => {
            if (isInitialized && auth && db) {
                resolve({ auth, db, firebase: window.firebase });
            } else {
                readyCallbacks.push(resolve);
                startInitPolling();
            }
        });
    }

    function onReady(callback) {
        if (typeof callback !== 'function') return;
        if (isInitialized && auth && db) {
            callback({ auth, db, firebase: window.firebase });
        } else {
            readyCallbacks.push(callback);
            startInitPolling();
        }
    }

    // Helper: Google Sign-In with automatic fallback (popup on desktop, redirect on mobile/touch)
    async function loginWithGoogle() {
        const { auth, firebase } = await whenReady();
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        provider.setCustomParameters({ prompt: 'select_account' });

        const isMobileOrStandalone = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
                                     window.matchMedia('(display-mode: standalone)').matches ||
                                     window.navigator.standalone === true ||
                                     (window.innerWidth <= 768);

        if (!isMobileOrStandalone) {
            try {
                const result = await auth.signInWithPopup(provider);
                return result.user;
            } catch (error) {
                console.warn('[Firebase] Popup login failed, trying redirect:', error);
                if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
                    await auth.signInWithRedirect(provider);
                    return null; // Will redirect
                }
                throw error;
            }
        } else {
            try {
                // Try popup first even on mobile; if blocked, redirect immediately
                const result = await auth.signInWithPopup(provider);
                return result.user;
            } catch (err) {
                console.log('[Firebase] Mobile popup blocked, redirecting to Google auth...');
                await auth.signInWithRedirect(provider);
                return null; // Will redirect
            }
        }
    }

    async function handleRedirectResult() {
        try {
            const { auth } = await whenReady();
            const result = await auth.getRedirectResult();
            if (result && result.user) {
                return result.user;
            }
        } catch (err) {
            console.warn('[Firebase] Redirect result error:', err);
        }
        return null;
    }

    async function logout() {
        const { auth } = await whenReady();
        return await auth.signOut();
    }

    function getCurrentUser() {
        return auth ? auth.currentUser : null;
    }

    function onAuthStateChanged(callback) {
        whenReady().then(({ auth }) => {
            auth.onAuthStateChanged(callback);
        });
    }

    return {
        getAuth: () => auth,
        getDb: () => db,
        isReady: () => isInitialized && auth !== null && db !== null,
        whenReady,
        onReady,
        loginWithGoogle,
        logout,
        handleRedirectResult,
        getCurrentUser,
        onAuthStateChanged
    };
})();
