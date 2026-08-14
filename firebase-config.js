/**
 * Firebase Config & Cloud Services Initialization
 * Salibandyn Kentälliset & Taktiikkataulu
 */

// Global Firebase Instance Holder
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
    let auth = null;
    let db = null;

    function initFirebase() {
        if (typeof firebase !== 'undefined' && firebase.initializeApp) {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                auth = firebase.auth();
                db = firebase.firestore();

                // Enable Firestore Offline Persistence
                db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
                    if (err.code === 'failed-precondition') {
                        console.warn('Firestore persistence failed: Multiple tabs open');
                    } else if (err.code === 'unimplemented') {
                        console.warn('Firestore persistence unsupported in browser');
                    }
                });

                isInitialized = true;
                console.log('🔥 Firebase Auth & Cloud Firestore Initialized Successfully for line-up-a773b');
            } catch (err) {
                console.warn('Firebase initialization error, fallback to LocalStorage:', err);
            }
        } else {
            console.warn('Firebase SDK not loaded, operating in LocalStorage offline mode');
        }
    }

    // Try initializing immediately
    initFirebase();

    return {
        getAuth: () => auth,
        getDb: () => db,
        isReady: () => isInitialized && auth !== null && db !== null
    };
})();
