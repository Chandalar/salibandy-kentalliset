/**
 * Firebase Config & Cloud Services Initialization
 * Salibandyn Kentälliset & Taktiikkataulu
 */

// Global Firebase Instance Holder
window.SalibandyFirebase = (function() {
    'use strict';

    // Standard Firebase App Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyB-DemoSalibandyAppKeyForFirestore100",
        authDomain: "salibandy-kentalliset.firebaseapp.com",
        projectId: "salibandy-kentalliset",
        storageBucket: "salibandy-kentalliset.appspot.com",
        messagingSenderId: "987654321012",
        appId: "1:987654321012:web:a1b2c3d4e5f6g7h8i9j0"
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
                console.log('🔥 Firebase Auth & Cloud Firestore Initialized Successfully');
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
