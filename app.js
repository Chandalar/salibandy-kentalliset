/**
 * Salibandyn Kentälliset & Taktiikkataulu - Advanced Logic & Interactive Engine
 * Sisältää täysileveän rinnakkaisen yhteenvetonäkymän ja reaaliaikaisen Firebase-pilvisynkronoinnin.
 */

(function() {
    'use strict';

    // ==========================================
    // INITIAL DEFAULT DATA & TEAMS
    // ==========================================
    const DEFAULT_TEAMS = [
        { id: 'team_edustus', name: 'Edustusjoukkue' },
        { id: 'team_junnut', name: 'A-Juniorit' }
    ];

    const DEFAULT_ROSTER = [
        // 🟢 Maalivahdit (Vihreät laput)
        { id: 'p_mv23', name: 'Matias V', number: 23, position: 'MV', isLoan: false, notes: 'In 👍' },
        { id: 'p_mv45', name: 'Jussi V', number: 45, position: 'MV', isLoan: false, notes: 'In 👍' },
        { id: 'p_mv7', name: 'Sami P', number: 7, position: 'MV', isLoan: false, notes: 'Out 👎' },
        { id: 'p_mv3', name: 'Mika A', number: 3, position: 'MV', isLoan: false, notes: '?' },

        // 🔵 Kenttäpelaajat (Siniset laput - In 👍)
        { id: 'p_19', name: 'Aaltonen', number: 19, position: 'P', isLoan: false, notes: 'In 👍' },
        { id: 'p_20', name: 'Veikka', number: 20, position: 'P', isLoan: false, notes: 'In 👍' },
        { id: 'p_42', name: 'Henri K', number: 42, position: 'KH', isLoan: false, notes: 'In 👍' },
        { id: 'p_64', name: 'Onni V', number: 64, position: 'H', isLoan: false, notes: 'In 👍' },
        { id: 'p_71', name: 'Masto', number: 71, position: 'P', isLoan: false, notes: 'In 👍' },
        { id: 'p_4', name: 'Joona R', number: 4, position: 'P', isLoan: false, notes: 'In 👍' },
        { id: 'p_55', name: 'Vesa H', number: 55, position: 'P', isLoan: false, notes: 'In 👍' },
        { id: 'p_11', name: 'Juki', number: 11, position: 'H', isLoan: false, notes: 'In 👍' },
        { id: 'p_2', name: 'Nikou', number: 2, position: 'P', isLoan: false, notes: 'In 👍' },
        { id: 'p_88', name: 'Jerker B', number: 88, position: 'H', isLoan: false, notes: 'In 👍' },

        // 🔵 Kenttäpelaajat (Siniset laput - Out 👎)
        { id: 'p_21', name: 'Niko A', number: 21, position: 'H', isLoan: false, notes: 'Out 👎' },
        { id: 'p_13', name: 'Joni V', number: 13, position: 'H', isLoan: false, notes: 'Out 👎' },
        { id: 'p_10', name: 'Eino A', number: 10, position: 'KH', isLoan: false, notes: 'Out 👎' },
        { id: 'p_15', name: 'Akseli', number: 15, position: 'H', isLoan: false, notes: 'Out 👎' },
        { id: 'p_22', name: 'Petri V', number: 22, position: 'P', isLoan: false, notes: 'Out 👎' },
        { id: 'p_87', name: 'Heikki H', number: 87, position: 'H', isLoan: false, notes: 'Out 👎' },

        // 🔵 Kenttäpelaajat (Siniset laput - ?)
        { id: 'p_44', name: 'Jesse', number: 44, position: 'H', isLoan: false, notes: '?' },
        { id: 'p_62', name: 'Ilmari O', number: 62, position: 'H', isLoan: false, notes: '?' },
        { id: 'p_66', name: 'Miika', number: 66, position: 'H', isLoan: false, notes: '?' }
    ];

    const DEFAULT_LINEUP_CONFIGS = [
        { id: '1', name: '1. Kenttä', type: 'preset' },
        { id: '2', name: '2. Kenttä', type: 'preset' },
        { id: '3', name: '3. Kenttä', type: 'preset' },
        { id: 'yv', name: '⚡ Ylivoima (YV)', type: 'preset' },
        { id: 'av', name: '🛡️ Alivoima (AV)', type: 'preset' },
        { id: '6v5', name: '🔥 6v5 (Ilman MV)', type: 'preset' },
        { id: 'custom', name: '📐 Taktiikka', type: 'preset' }
    ];

    const DEFAULT_LINEUPS = {
        '1': { MV: 'p_mv23', VP: 'p_19', OP: 'p_20', VH: 'p_64', KH: 'p_42', OH: 'p_88' },
        '2': { MV: 'p_mv45', VP: 'p_71', OP: 'p_4', VH: 'p_11', KH: 'p_55', OH: 'p_2' },
        '3': { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' },
        'yv': { MV: 'p_mv23', VP: 'p_19', OP: 'p_42', VH: 'p_64', KH: 'p_55', OH: 'p_88' },
        'av': { MV: 'p_mv23', VP: 'p_20', OP: 'p_71', VH: '', KH: 'p_42', OH: '' },
        '6v5': { MV: '', VP: 'p_19', OP: 'p_20', VH: 'p_64', KH: 'p_42', OH: 'p_88' },
        'custom': { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' }
    };

    const DEFAULT_POS_COORDS = {
        horizontal: {
            MV: { x: 12, y: 50 },
            VP: { x: 28, y: 30 },
            OP: { x: 28, y: 70 },
            VH: { x: 65, y: 25 },
            KH: { x: 60, y: 50 },
            OH: { x: 65, y: 75 }
        },
        vertical: {
            MV: { x: 50, y: 88 },
            VP: { x: 30, y: 72 },
            OP: { x: 70, y: 72 },
            VH: { x: 25, y: 35 },
            KH: { x: 50, y: 40 },
            OH: { x: 75, y: 35 }
        }
    };

    // Firebase Auth & Realtime Sync State
    let currentUser = null;
    let unsubscribeFirestore = null;
    let isCloudLoading = false; // Flag to prevent infinite feedback loops during cloud sync

    // Global State
    let teams = loadFromStorage('salibandy_teams_v1', DEFAULT_TEAMS);
    let currentTeamId = loadFromStorage('salibandy_active_team_id', 'team_edustus');

    cleanCorruptedUserTeams();

    let roster = loadRosterForTeam(currentTeamId);
    let lineupConfigs = loadLineupConfigs(currentTeamId);
    let lineups = loadLineupsForTeam(currentTeamId, lineupConfigs);
    
    let lineupDrawings = loadFromStorage(`salibandy_drawings_${currentTeamId}`, {});
    let lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});
    let lineupBalls = loadFromStorage(`salibandy_balls_${currentTeamId}`, { '1': [{ id: 'ball_default', x: 55, y: 50 }] });

    let activeLineupKey = '1';
    let activeFilter = 'all';
    let searchQuery = '';
    let drawingTool = 'select';
    let isDrawing = false;
    let currentPath = [];
    let labelMode = 'full';
    let orientationMode = window.innerWidth <= 600 ? 'vertical' : 'horizontal';

    // DOM Elements
    const teamSelect = document.getElementById('team-select');
    const btnDeleteTeam = document.getElementById('btn-delete-team');
    const rosterListContainer = document.getElementById('roster-list-container');
    const rosterSearchInput = document.getElementById('roster-search');
    const filterPillBtns = document.querySelectorAll('.pill-btn');
    const tabsScrollContainer = document.getElementById('tabs-scroll-container');
    const activeLineupTitle = document.getElementById('active-lineup-title');
    const lineupSlotsContainer = document.getElementById('lineup-slots-container');
    const courtPlayersLayer = document.getElementById('court-players-layer');
    const floorballCourt = document.getElementById('floorball-court');
    const canvas = document.getElementById('tactic-canvas');
    const ctx = canvas.getContext('2d');
    const toastEl = document.getElementById('toast');

    // Main Sections
    const rosterPanelSection = document.getElementById('roster-panel-section');
    const pitchPanelSection = document.getElementById('pitch-panel-section');
    const lineupPanelSection = document.getElementById('lineup-panel-section');
    const summaryViewPanel = document.getElementById('summary-view-panel');
    const summaryGridContainer = document.getElementById('summary-grid-container');

    // Counters & Status Badges
    const countMvEl = document.getElementById('count-mv');
    const countFieldEl = document.getElementById('count-field');
    const countLoanEl = document.getElementById('count-loan');
    const cloudSyncBadge = document.getElementById('cloud-sync-badge');
    const userAuthStatusWrapper = document.getElementById('user-auth-status');

    // Modals
    const authModal = document.getElementById('auth-modal');
    const authTabLogin = document.getElementById('auth-tab-login');
    const authTabRegister = document.getElementById('auth-tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const manageLineupsModal = document.getElementById('manage-lineups-modal');
    const reorderLineupsList = document.getElementById('reorder-lineups-list');
    const btnResetDefaultLineups = document.getElementById('btn-reset-default-lineups');

    const importPlayersModal = document.getElementById('import-players-modal');
    const importSourceTeamSelect = document.getElementById('import-source-team-select');
    const importPlayerChecklist = document.getElementById('import-player-checklist');
    const btnConfirmImportPlayers = document.getElementById('btn-confirm-import-players');
    const btnImportSelectAll = document.getElementById('btn-import-select-all');
    const btnImportDeselectAll = document.getElementById('btn-import-deselect-all');

    const lineupConfigModal = document.getElementById('lineup-config-modal');
    const lineupConfigForm = document.getElementById('lineup-config-form');
    const lineupConfigModalTitle = document.getElementById('lineup-config-modal-title');
    const formLineupId = document.getElementById('form-lineup-id');
    const formLineupName = document.getElementById('form-lineup-name');

    const slotPickerModal = document.getElementById('slot-picker-modal');
    const slotPickerTitle = document.getElementById('slot-picker-title');
    const slotPickerInfo = document.getElementById('slot-picker-info');
    const slotPickerPlayerList = document.getElementById('slot-picker-player-list');
    const btnClearSlotPicker = document.getElementById('btn-clear-slot-picker');

    const assignModal = document.getElementById('assign-modal');
    const assignModalTitle = document.getElementById('assign-modal-title');
    const assignModalPlayerInfo = document.getElementById('assign-modal-player-info');
    const assignOptionsGrid = document.getElementById('assign-options-grid');

    const playerModal = document.getElementById('player-modal');
    const playerForm = document.getElementById('player-form');
    const modalTitle = document.getElementById('modal-title');
    const formPlayerId = document.getElementById('form-player-id');
    const formName = document.getElementById('form-name');
    const formNumber = document.getElementById('form-number');
    const formPosition = document.getElementById('form-position');
    const formIsLoan = document.getElementById('form-is-loan');
    const formNotes = document.getElementById('form-notes');

    const teamModal = document.getElementById('team-modal');
    const teamForm = document.getElementById('team-form');
    const teamNameInput = document.getElementById('team-name-input');

    const photoModal = document.getElementById('photo-modal');
    const photoFileInput = document.getElementById('photo-file-input');
    const ocrStatus = document.getElementById('ocr-status');
    const ocrStatusText = document.getElementById('ocr-status-text');
    const photoPreviewStep = document.getElementById('photo-preview-step');
    const ocrResultsList = document.getElementById('ocr-results-list');

    let tempOcrParsedPlayers = [];
    let selectedPlayerForAssignment = null;
    let selectedSlotTarget = { lineupKey: '', pos: '' };

    // ==========================================
    // INITIALIZATION & REAL-TIME FIREBASE SYNC SETUP
    // ==========================================
    function init() {
        renderTeamDropdown();
        renderTabs();
        applyOrientation();
        setupCanvas();
        bindEvents();
        initFirebaseAuth();
        updateRosterCounters();
        renderRoster();
        renderActiveLineupSlots();
        renderCourtPlayers();
        drawCanvasLines();
    }

    function initFirebaseAuth() {
        if (window.SalibandyFirebase && window.SalibandyFirebase.isReady()) {
            const auth = window.SalibandyFirebase.getAuth();
            auth.onAuthStateChanged((user) => {
                currentUser = user;
                updateAuthUI();
                if (user) {
                    listenToCloudFirestore(user);
                } else {
                    if (unsubscribeFirestore) {
                        unsubscribeFirestore();
                        unsubscribeFirestore = null;
                    }
                    updateCloudSyncBadge(false);
                }
            });
        } else {
            updateCloudSyncBadge(false);
        }
    }

    function updateAuthUI() {
        if (currentUser) {
            userAuthStatusWrapper.innerHTML = `
                <div class="user-profile-badge">
                    <span>👤</span>
                    <span class="user-email-text" title="${currentUser.email}">${currentUser.email}</span>
                    <button class="btn-xs btn-outline danger-text" id="btn-user-logout" title="Kirjaudu ulos">🔴 Ulos</button>
                </div>
            `;
            document.getElementById('btn-user-logout')?.addEventListener('click', handleLogout);
            updateCloudSyncBadge(true);
        } else {
            userAuthStatusWrapper.innerHTML = `
                <button class="btn btn-sm btn-outline" id="btn-open-auth-modal">
                    🔑 Kirjaudu pilveen
                </button>
            `;
            document.getElementById('btn-open-auth-modal')?.addEventListener('click', () => {
                authModal.classList.add('active');
            });
            updateCloudSyncBadge(false);
        }
    }

    function updateCloudSyncBadge(isCloudActive) {
        if (!cloudSyncBadge) return;
        if (isCloudActive) {
            cloudSyncBadge.className = 'cloud-sync-badge';
            cloudSyncBadge.innerHTML = '☁️ Synkronoitu';
            cloudSyncBadge.title = 'Tiedot tallennettu pilveen. Klikkaa synkronoidaksesi kaksi suuntaisesti.';
        } else {
            cloudSyncBadge.className = 'cloud-sync-badge is-offline';
            cloudSyncBadge.innerHTML = '💻 Paikallinen';
            cloudSyncBadge.title = 'Kirjaudu sisään synkronoidaksesi pilveen';
        }
    }

    function handleLogout() {
        if (window.SalibandyFirebase && window.SalibandyFirebase.isReady()) {
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }
            window.SalibandyFirebase.getAuth().signOut().then(() => {
                showToast('Kirjauduttu ulos pilvipalvelusta.');
                currentUser = null;
                updateAuthUI();
            });
        }
    }

    // ==========================================
    // COMPLETE REAL-TIME BI-DIRECTIONAL CLOUD SYNC WITH INTELLIGENT MERGE
    // ==========================================
    function buildFullCloudPayload() {
        const rostersMap = {};
        const configsMap = {};
        const lineupsMap = {};
        const drawingsMap = {};
        const positionsMap = {};
        const ballsMap = {};

        teams.forEach(t => {
            const tId = t.id;
            rostersMap[tId] = (tId === currentTeamId) ? roster : loadRosterForTeam(tId);
            configsMap[tId] = (tId === currentTeamId) ? lineupConfigs : loadLineupConfigs(tId);
            lineupsMap[tId] = (tId === currentTeamId) ? lineups : loadLineupsForTeam(tId, configsMap[tId]);
            drawingsMap[tId] = (tId === currentTeamId) ? lineupDrawings : loadFromStorage(`salibandy_drawings_${tId}`, {});
            positionsMap[tId] = (tId === currentTeamId) ? lineupCourtPositions : loadFromStorage(`salibandy_positions_${tId}`, {});
            ballsMap[tId] = (tId === currentTeamId) ? lineupBalls : loadFromStorage(`salibandy_balls_${tId}`, {});
        });

        return {
            email: currentUser ? currentUser.email : '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            teams: teams,
            currentTeamId: currentTeamId,
            rosters: rostersMap,
            lineupConfigs: configsMap,
            lineups: lineupsMap,
            drawings: drawingsMap,
            positions: positionsMap,
            balls: ballsMap
        };
    }

    function forceCloudSync() {
        if (!currentUser || !window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) {
            showToast('Kirjaudu sisään synkronoidaksesi pilveen.');
            authModal.classList.add('active');
            return;
        }

        const db = window.SalibandyFirebase.getDb();
        const payload = buildFullCloudPayload();

        db.collection('users').doc(currentUser.uid).set(payload, { merge: true })
            .then(() => {
                updateCloudSyncBadge(true);
                showToast('☁️ Kaikki tietokoneen joukkueet ja kentälliset tallennettu pilveen!');
            })
            .catch(err => {
                console.error('Firestore force sync error:', err);
                showToast('Pilvitallennusvirhe: ' + err.message);
            });
    }

    function listenToCloudFirestore(user) {
        if (!window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) return;
        const db = window.SalibandyFirebase.getDb();
        const userRef = db.collection('users').doc(user.uid);

        if (unsubscribeFirestore) unsubscribeFirestore();

        unsubscribeFirestore = userRef.onSnapshot((doc) => {
            if (isCloudLoading) return;

            if (!doc.exists) {
                // First time user: Write current local state to cloud
                isCloudLoading = true;
                const initialPayload = buildFullCloudPayload();
                userRef.set(initialPayload, { merge: true }).then(() => {
                    updateCloudSyncBadge(true);
                    isCloudLoading = false;
                }).catch(err => {
                    console.warn('First time Firestore doc write error:', err);
                    isCloudLoading = false;
                });
                return;
            }

            const cloudData = doc.data();
            if (!cloudData) return;

            isCloudLoading = true;

            let needCloudUpdateBack = false;

            // 1. INTELLIGENT TEAMS MERGE (Merge local teams with cloud teams so desktop creation is never lost)
            if (cloudData.teams && Array.isArray(cloudData.teams)) {
                const mergedTeams = [...cloudData.teams];
                teams.forEach(localT => {
                    if (!mergedTeams.some(cT => cT.id === localT.id)) {
                        mergedTeams.push(localT);
                        needCloudUpdateBack = true;
                    }
                });
                teams = mergedTeams;
                if (cloudData.currentTeamId && teams.some(t => t.id === cloudData.currentTeamId)) {
                    currentTeamId = cloudData.currentTeamId;
                } else if (!teams.some(t => t.id === currentTeamId)) {
                    currentTeamId = teams[0].id;
                }
            }

            // 2. INTELLIGENT ROSTERS MERGE
            if (cloudData.rosters) {
                Object.keys(cloudData.rosters).forEach(tId => {
                    const cloudRoster = cloudData.rosters[tId] || [];
                    const localRoster = loadFromStorage(`salibandy_roster_${tId}`, []);
                    
                    const mergedRosterMap = {};
                    cloudRoster.forEach(p => { mergedRosterMap[p.id] = p; });
                    localRoster.forEach(p => {
                        if (!mergedRosterMap[p.id]) {
                            mergedRosterMap[p.id] = p;
                            needCloudUpdateBack = true;
                        }
                    });

                    const finalRoster = Object.values(mergedRosterMap);
                    localStorage.setItem(`salibandy_roster_${tId}`, JSON.stringify(finalRoster));
                });

                // Also upload local rosters for any local teams not yet in cloud
                teams.forEach(t => {
                    if (!cloudData.rosters[t.id]) {
                        const localRoster = loadFromStorage(`salibandy_roster_${t.id}`, []);
                        cloudData.rosters[t.id] = localRoster;
                        needCloudUpdateBack = true;
                    }
                });
            }

            if (cloudData.lineupConfigs) {
                Object.keys(cloudData.lineupConfigs).forEach(tId => {
                    localStorage.setItem(`salibandy_lineup_configs_${tId}`, JSON.stringify(cloudData.lineupConfigs[tId]));
                });
            }
            if (cloudData.lineups) {
                Object.keys(cloudData.lineups).forEach(tId => {
                    localStorage.setItem(`salibandy_lineups_${tId}`, JSON.stringify(cloudData.lineups[tId]));
                });
            }
            if (cloudData.drawings) {
                Object.keys(cloudData.drawings).forEach(tId => {
                    localStorage.setItem(`salibandy_drawings_${tId}`, JSON.stringify(cloudData.drawings[tId]));
                });
            }
            if (cloudData.positions) {
                Object.keys(cloudData.positions).forEach(tId => {
                    localStorage.setItem(`salibandy_positions_${tId}`, JSON.stringify(cloudData.positions[tId]));
                });
            }
            if (cloudData.balls) {
                Object.keys(cloudData.balls).forEach(tId => {
                    localStorage.setItem(`salibandy_balls_${tId}`, JSON.stringify(cloudData.balls[tId]));
                });
            }

            // Reload memory variables for current team
            roster = loadRosterForTeam(currentTeamId);
            lineupConfigs = loadLineupConfigs(currentTeamId);
            lineups = loadLineupsForTeam(currentTeamId, lineupConfigs);
            lineupDrawings = loadFromStorage(`salibandy_drawings_${currentTeamId}`, {});
            lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});
            lineupBalls = loadFromStorage(`salibandy_balls_${currentTeamId}`, {});

            saveStateLocalOnly();

            renderTeamDropdown();
            renderTabs();
            updateRosterCounters();
            renderRoster();
            if (activeLineupKey === 'summary') {
                renderSummaryView();
            } else {
                renderActiveLineupSlots();
                renderCourtPlayers();
                drawCanvasLines();
            }

            updateCloudSyncBadge(true);

            // If we merged local desktop teams into cloud data, send updated payload back to Firestore!
            if (needCloudUpdateBack) {
                const mergedPayload = buildFullCloudPayload();
                userRef.set(mergedPayload, { merge: true }).then(() => {
                    console.log('☁️ Merged local desktop data successfully with Cloud Firestore!');
                    isCloudLoading = false;
                }).catch(() => {
                    isCloudLoading = false;
                });
            } else {
                setTimeout(() => { isCloudLoading = false; }, 300);
            }

        }, (err) => {
            console.warn('Firestore real-time snapshot error:', err);
            updateCloudSyncBadge(false);
            isCloudLoading = false;
        });
    }

    function cleanCorruptedUserTeams() {
        if (!Array.isArray(teams)) return;
        teams.forEach(t => {
            if (t.id !== 'team_edustus') {
                const storedRoster = loadFromStorage(`salibandy_roster_${t.id}`, null);
                if (storedRoster && Array.isArray(storedRoster) && storedRoster.some(p => p.id === 'p_mv23')) {
                    console.log(`Auto-clearing corrupted demo roster for team: ${t.name} (${t.id})`);
                    localStorage.setItem(`salibandy_roster_${t.id}`, JSON.stringify([]));
                    const emptyLineups = {};
                    DEFAULT_LINEUP_CONFIGS.forEach(c => { emptyLineups[c.id] = createEmptyLineupSlots(); });
                    localStorage.setItem(`salibandy_lineups_${t.id}`, JSON.stringify(emptyLineups));
                }
            }
        });
    }

    function loadFromStorage(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            console.error('LocalStorage load error', e);
            return fallback;
        }
    }

    function loadRosterForTeam(teamId) {
        if (teamId === 'team_edustus') {
            return loadFromStorage(`salibandy_roster_${teamId}`, DEFAULT_ROSTER);
        }
        return loadFromStorage(`salibandy_roster_${teamId}`, []);
    }

    function createEmptyLineupSlots() {
        return { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };
    }

    function loadLineupsForTeam(teamId, configs) {
        const stored = loadFromStorage(`salibandy_lineups_${teamId}`, null);
        if (stored) return stored;

        if (teamId === 'team_edustus') return JSON.parse(JSON.stringify(DEFAULT_LINEUPS));

        const emptyLineups = {};
        configs.forEach(c => {
            emptyLineups[c.id] = createEmptyLineupSlots();
        });
        return emptyLineups;
    }

    function loadLineupConfigs(teamId) {
        let configs = loadFromStorage(`salibandy_lineup_configs_${teamId}`, null);
        if (!configs || !Array.isArray(configs)) {
            configs = JSON.parse(JSON.stringify(DEFAULT_LINEUP_CONFIGS));
            localStorage.setItem(`salibandy_lineup_configs_${teamId}`, JSON.stringify(configs));
        }
        return configs;
    }

    function saveStateLocalOnly() {
        try {
            localStorage.setItem('salibandy_teams_v1', JSON.stringify(teams));
            localStorage.setItem('salibandy_active_team_id', JSON.stringify(currentTeamId));
            localStorage.setItem(`salibandy_roster_${currentTeamId}`, JSON.stringify(roster));
            localStorage.setItem(`salibandy_lineup_configs_${currentTeamId}`, JSON.stringify(lineupConfigs));
            localStorage.setItem(`salibandy_lineups_${currentTeamId}`, JSON.stringify(lineups));
            localStorage.setItem(`salibandy_drawings_${currentTeamId}`, JSON.stringify(lineupDrawings));
            localStorage.setItem(`salibandy_positions_${currentTeamId}`, JSON.stringify(lineupCourtPositions));
            localStorage.setItem(`salibandy_balls_${currentTeamId}`, JSON.stringify(lineupBalls));
        } catch (e) {
            console.error('LocalStorage save error', e);
        }
    }

    function saveState() {
        saveStateLocalOnly();

        if (currentUser && window.SalibandyFirebase && window.SalibandyFirebase.isReady() && !isCloudLoading) {
            const db = window.SalibandyFirebase.getDb();
            const payload = buildFullCloudPayload();
            db.collection('users').doc(currentUser.uid).set(payload, { merge: true })
                .then(() => {
                    updateCloudSyncBadge(true);
                })
                .catch(err => {
                    console.warn('Cloud Firestore save error:', err);
                });
        }
    }

    function getLineupName(key) {
        const found = lineupConfigs.find(c => c.id === key);
        return found ? found.name : 'Kentällinen';
    }

    function showToast(message) {
        toastEl.textContent = message;
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2800);
    }

    function renderTeamDropdown() {
        teamSelect.innerHTML = '';
        teams.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            if (t.id === currentTeamId) opt.selected = true;
            teamSelect.appendChild(opt);
        });
    }

    function switchTeam(teamId) {
        currentTeamId = teamId;
        
        roster = loadRosterForTeam(currentTeamId);
        lineupConfigs = loadLineupConfigs(currentTeamId);
        lineups = loadLineupsForTeam(currentTeamId, lineupConfigs);
        lineupDrawings = loadFromStorage(`salibandy_drawings_${currentTeamId}`, {});
        lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});
        lineupBalls = loadFromStorage(`salibandy_balls_${currentTeamId}`, {});

        if (activeLineupKey !== 'summary' && !lineupConfigs.some(c => c.id === activeLineupKey)) {
            activeLineupKey = lineupConfigs[0] ? lineupConfigs[0].id : '1';
        }

        saveState();

        renderTabs();
        updateRosterCounters();
        renderRoster();
        if (activeLineupKey === 'summary') {
            renderSummaryView();
        } else {
            renderActiveLineupSlots();
            renderCourtPlayers();
            drawCanvasLines();
        }
        showToast(`Joukkue vaihdettu: ${teams.find(t => t.id === currentTeamId)?.name || ''}`);
    }

    function deleteActiveTeam() {
        if (teams.length <= 1) {
            showToast('Et voi poistaa ainoaa joukkuetta.');
            return;
        }

        const team = teams.find(t => t.id === currentTeamId);
        if (!team) return;

        if (confirm(`Haluatko varmasti poistaa joukkueen '${team.name}' kaikkine pelaajineen ja kentällisineen?`)) {
            const deleteId = currentTeamId;
            teams = teams.filter(t => t.id !== deleteId);

            localStorage.removeItem(`salibandy_roster_${deleteId}`);
            localStorage.removeItem(`salibandy_lineup_configs_${deleteId}`);
            localStorage.removeItem(`salibandy_lineups_${deleteId}`);
            localStorage.removeItem(`salibandy_drawings_${deleteId}`);
            localStorage.removeItem(`salibandy_positions_${deleteId}`);
            localStorage.removeItem(`salibandy_balls_${deleteId}`);

            const nextTeamId = teams[0].id;
            renderTeamDropdown();
            switchTeam(nextTeamId);
            showToast(`Joukkue '${team.name}' poistettu.`);
        }
    }

    function renderTabs() {
        if (!tabsScrollContainer) return;
        tabsScrollContainer.innerHTML = '';

        if (!lineupConfigs || !Array.isArray(lineupConfigs)) {
            lineupConfigs = loadLineupConfigs(currentTeamId);
        }

        lineupConfigs.forEach(config => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${activeLineupKey === config.id ? 'active' : ''}`;
            if (config.id === 'yv') btn.classList.add('highlight-yv');
            if (config.id === 'av') btn.classList.add('highlight-av');
            if (config.id === '6v5') btn.classList.add('highlight-6v5');

            btn.dataset.lineup = config.id;
            btn.innerHTML = `<span>${escapeHtml(config.name)}</span>`;

            btn.addEventListener('click', () => switchTab(config.id));
            tabsScrollContainer.appendChild(btn);
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'tab-btn btn-add-tab';
        addBtn.innerHTML = '+ Uusi kentällinen';
        addBtn.addEventListener('click', () => openLineupConfigModal());
        tabsScrollContainer.appendChild(addBtn);

        const summaryBtn = document.createElement('button');
        summaryBtn.className = `tab-btn highlight-summary ${activeLineupKey === 'summary' ? 'active' : ''}`;
        summaryBtn.dataset.lineup = 'summary';
        summaryBtn.textContent = '📊 Yhteenveto (Kaikki kentälliset)';
        summaryBtn.addEventListener('click', () => switchTab('summary'));
        tabsScrollContainer.appendChild(summaryBtn);

        const manageBtn = document.createElement('button');
        manageBtn.className = 'tab-btn btn-manage-tab';
        manageBtn.innerHTML = '⚙️ Hallitse kentällisiä';
        manageBtn.addEventListener('click', () => openManageLineupsModal());
        tabsScrollContainer.appendChild(manageBtn);
    }

    function switchTab(key) {
        activeLineupKey = key;
        renderTabs();

        if (activeLineupKey === 'summary') {
            if (rosterPanelSection) rosterPanelSection.style.display = 'none';
            pitchPanelSection.style.display = 'none';
            lineupPanelSection.style.display = 'none';
            summaryViewPanel.style.display = 'flex';
            renderSummaryView();
        } else {
            if (rosterPanelSection) rosterPanelSection.style.display = 'flex';
            pitchPanelSection.style.display = 'flex';
            lineupPanelSection.style.display = 'flex';
            summaryViewPanel.style.display = 'none';
            renderActiveLineupSlots();
            renderCourtPlayers();
            setTimeout(resizeCanvas, 60);
        }
    }

    function applyOrientation() {
        const textEl = document.getElementById('orient-mode-text');
        if (orientationMode === 'vertical') {
            floorballCourt.classList.remove('mode-horizontal');
            floorballCourt.classList.add('mode-vertical');
            textEl.textContent = 'Pysty (20x40m)';
        } else {
            floorballCourt.classList.remove('mode-vertical');
            floorballCourt.classList.add('mode-horizontal');
            textEl.textContent = 'Vaaka (40x20m)';
        }
        renderCourtPlayers();
        setTimeout(resizeCanvas, 60);
    }

    function resizeCanvas() {
        const rect = floorballCourt.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        drawCanvasLines();
    }

    function updateRosterCounters() {
        const mvCount = roster.filter(p => p.position === 'MV').length;
        const fieldCount = roster.filter(p => p.position !== 'MV').length;
        const loanCount = roster.filter(p => p.isLoan).length;

        countMvEl.textContent = mvCount;
        countFieldEl.textContent = fieldCount;
        countLoanEl.textContent = loanCount;
    }

    function renderRoster() {
        rosterListContainer.innerHTML = '';

        if (roster.length === 0) {
            rosterListContainer.innerHTML = `
                <div style="text-align:center; padding: 1.8rem 0.8rem; color: var(--text-muted);">
                    <p style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.4rem;">Joukkueessa ei ole vielä pelaajia 👥</p>
                    <p style="font-size: 0.76rem; margin-bottom: 1.2rem; color: var(--text-secondary);">
                        Voit lisätä uusia pelaajia, lukea kokoonpanon valokuvasta tai tuoda pelaajia muista joukkueista!
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 230px; margin: 0 auto;">
                        <button class="btn btn-primary btn-sm" id="btn-empty-add-player">+ Lisää uusi pelaaja</button>
                        <button class="btn btn-secondary btn-sm" id="btn-empty-import-players">📥 Tuo muista joukkueista</button>
                        <button class="btn btn-photo btn-sm" id="btn-empty-photo">📷 Lue lista kuvasta</button>
                    </div>
                </div>
            `;

            document.getElementById('btn-empty-add-player')?.addEventListener('click', () => openModal());
            document.getElementById('btn-empty-import-players')?.addEventListener('click', () => openImportPlayersModal());
            document.getElementById('btn-empty-photo')?.addEventListener('click', () => {
                photoPreviewStep.style.display = 'none';
                ocrStatus.style.display = 'none';
                photoModal.classList.add('active');
            });
            return;
        }

        const filtered = roster.filter(player => {
            if (activeFilter === 'mv' && player.position !== 'MV') return false;
            if (activeFilter === 'field' && player.position === 'MV') return false;
            if (activeFilter === 'loan' && !player.isLoan) return false;

            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchName = player.name.toLowerCase().includes(q);
                const matchNum = player.number.toString().includes(q);
                return matchName || matchNum;
            }
            return true;
        });

        if (filtered.length === 0) {
            rosterListContainer.innerHTML = `
                <div style="text-align:center; color: var(--text-muted); padding: 2rem 1rem; font-size: 0.85rem;">
                    Ei pelaajia valitulla hakuehdolla.
                </div>
            `;
            return;
        }

        filtered.forEach(player => {
            const isMv = player.position === 'MV';
            const card = document.createElement('div');
            card.className = `player-card ${isMv ? 'is-mv' : 'is-field'}`;
            card.draggable = true;
            card.dataset.playerId = player.id;

            card.innerHTML = `
                <div class="player-card-info" data-action="tap-assign" data-id="${player.id}">
                    <div class="player-num-circle">#${player.number}</div>
                    <div class="player-details">
                        <div class="player-name-row">
                            <span class="player-name">${escapeHtml(player.name)}</span>
                            ${player.isLoan ? '<span class="loan-badge">⭐ LAINA</span>' : ''}
                        </div>
                        <span class="player-submeta">${isMv ? 'Maalivahti (MV)' : getPosLabel(player.position)} ${player.notes ? '• ' + escapeHtml(player.notes) : ''}</span>
                    </div>
                </div>
                <div class="player-card-actions">
                    <button class="btn-assign-quick" data-action="tap-assign" data-id="${player.id}">+ Sijoita</button>
                    <button class="mini-action-btn edit-btn" title="Muokkaa" data-action="edit" data-id="${player.id}">✏️</button>
                    <button class="mini-action-btn delete-btn" title="Poista" data-action="delete" data-id="${player.id}">🗑️</button>
                </div>
            `;

            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', player.id);
                e.dataTransfer.effectAllowed = 'move';
                card.style.opacity = '0.4';
            });

            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
            });

            rosterListContainer.appendChild(card);
        });
    }

    function getPosLabel(pos) {
        switch(pos) {
            case 'MV': return 'Maalivahti';
            case 'P': return 'Puolustaja';
            case 'KH': return 'Keskushyökkääjä';
            case 'H': return 'Hyökkääjä';
            default: return pos;
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // ==========================================
    // AUTH MODAL LOGIC (LOGIN / REGISTER / GOOGLE)
    // ==========================================
    authTabLogin?.addEventListener('click', () => {
        authTabLogin.classList.add('active');
        authTabRegister.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    authTabRegister?.addEventListener('click', () => {
        authTabRegister.classList.add('active');
        authTabLogin.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-password').value;

        if (!window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) {
            showToast('Firebase-palvelu ei ole käytettävissä offline-tilassa.');
            return;
        }

        window.SalibandyFirebase.getAuth().signInWithEmailAndPassword(email, pass)
            .then((userCredential) => {
                closeModal();
                showToast(`Tervetuloa takaisin, ${userCredential.user.email}! 🔒`);
                setTimeout(forceCloudSync, 500);
            })
            .catch((err) => {
                alert(`Kirjautumisvirhe: ${err.message}`);
            });
    });

    registerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-password').value;

        if (!window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) {
            showToast('Firebase-palvelu ei ole käytettävissä offline-tilassa.');
            return;
        }

        window.SalibandyFirebase.getAuth().createUserWithEmailAndPassword(email, pass)
            .then((userCredential) => {
                closeModal();
                showToast(`Tili luotu onnistuneesti: ${userCredential.user.email}! ✨`);
                setTimeout(forceCloudSync, 500);
            })
            .catch((err) => {
                alert(`Tilin luontivirhe: ${err.message}`);
            });
    });

    document.getElementById('btn-google-login')?.addEventListener('click', () => {
        if (!window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) {
            showToast('Firebase-palvelu ei ole käytettävissä offline-tilassa.');
            return;
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        window.SalibandyFirebase.getAuth().signInWithPopup(provider)
            .then((result) => {
                closeModal();
                showToast(`Kirjauduttu Google-tilillä: ${result.user.email} 🎉`);
                setTimeout(forceCloudSync, 500);
            })
            .catch((err) => {
                alert(`Google-kirjautumisvirhe: ${err.message}`);
            });
    });

    // ==========================================
    // IMPORT PLAYERS FROM OTHER TEAMS LOGIC
    // ==========================================
    function openImportPlayersModal() {
        const otherTeams = teams.filter(t => t.id !== currentTeamId);

        if (otherTeams.length === 0) {
            showToast('Ei muita joukkueita joista tuoda pelaajia. Luotavissa uusi joukkue! 🏑');
            return;
        }

        importSourceTeamSelect.innerHTML = '';
        otherTeams.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            importSourceTeamSelect.appendChild(opt);
        });

        renderImportChecklist(otherTeams[0].id);
        importPlayersModal.classList.add('active');
    }

    function renderImportChecklist(sourceTeamId) {
        const sourceRoster = loadRosterForTeam(sourceTeamId);
        importPlayerChecklist.innerHTML = '';

        if (sourceRoster.length === 0) {
            importPlayerChecklist.innerHTML = `
                <div style="text-align:center; color: var(--text-muted); padding: 1.5rem;">
                    Valitulla lähdejoukkueella ei ole vielä pelaajia ringissä.
                </div>
            `;
            return;
        }

        sourceRoster.forEach(player => {
            const isMv = player.position === 'MV';
            const row = document.createElement('label');
            row.className = 'import-player-row';

            row.innerHTML = `
                <input type="checkbox" value="${player.id}" class="import-checkbox" checked>
                <div class="player-num-circle" style="background: ${isMv ? 'var(--accent-mv)' : 'var(--accent-field)'}; color: ${isMv ? '#022c22' : '#fff'}; width:24px; height:24px; font-size:0.75rem;">
                    #${player.number}
                </div>
                <div class="player-details" style="flex:1;">
                    <div class="player-name-row">
                        <span class="player-name">${escapeHtml(player.name)}</span>
                        ${player.isLoan ? '<span class="loan-badge">⭐ LAINA</span>' : ''}
                    </div>
                    <span class="player-submeta">${getPosLabel(player.position)}</span>
                </div>
            `;

            importPlayerChecklist.appendChild(row);
        });
    }

    importSourceTeamSelect?.addEventListener('change', (e) => {
        renderImportChecklist(e.target.value);
    });

    btnImportSelectAll?.addEventListener('click', () => {
        importPlayerChecklist.querySelectorAll('.import-checkbox').forEach(cb => cb.checked = true);
    });

    btnImportDeselectAll?.addEventListener('click', () => {
        importPlayerChecklist.querySelectorAll('.import-checkbox').forEach(cb => cb.checked = false);
    });

    btnConfirmImportPlayers?.addEventListener('click', () => {
        const sourceTeamId = importSourceTeamSelect.value;
        const sourceRoster = loadRosterForTeam(sourceTeamId);

        const checkedCheckboxes = importPlayerChecklist.querySelectorAll('.import-checkbox:checked');
        if (checkedCheckboxes.length === 0) {
            showToast('Valitse vähintään yksi tuotava pelaaja.');
            return;
        }

        let importedCount = 0;
        checkedCheckboxes.forEach(cb => {
            const targetId = cb.value;
            const original = sourceRoster.find(p => p.id === targetId);
            if (original) {
                const newPlayer = {
                    ...original,
                    id: 'p_imp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
                };
                roster.push(newPlayer);
                importedCount++;
            }
        });

        saveState();
        updateRosterCounters();
        renderRoster();
        if (activeLineupKey === 'summary') {
            renderSummaryView();
        } else {
            renderActiveLineupSlots();
            renderCourtPlayers();
        }

        closeModal();
        showToast(`${importedCount} pelaajaa tuotu onnistuneesti uuteen joukkueeseen! 🎉`);
    });

    // ==========================================
    // REORDER & MANAGE LINEUPS
    // ==========================================
    function openManageLineupsModal() {
        renderReorderList();
        manageLineupsModal.classList.add('active');
    }

    function renderReorderList() {
        reorderLineupsList.innerHTML = '';

        if (lineupConfigs.length === 0) {
            reorderLineupsList.innerHTML = `
                <div style="text-align:center; color: var(--text-muted); padding: 1rem;">
                    Ei kentällisiä. Voit luoda uuden kentällisen tai palauttaa oletuskentät.
                </div>
            `;
            return;
        }

        lineupConfigs.forEach((config, idx) => {
            const row = document.createElement('div');
            row.className = 'reorder-item-row';

            row.innerHTML = `
                <div class="reorder-arrows-group">
                    <button class="reorder-btn" data-action="move-up" data-index="${idx}" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>⬆️</button>
                    <button class="reorder-btn" data-action="move-down" data-index="${idx}" ${idx === lineupConfigs.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>⬇️</button>
                </div>
                <span class="reorder-item-title">${escapeHtml(config.name)}</span>
                <div class="reorder-item-actions">
                    <button class="btn-xs btn-outline" data-action="edit-config" data-id="${config.id}">✏️</button>
                    <button class="btn-xs btn-outline danger-text" data-action="delete-config" data-id="${config.id}">🗑️</button>
                </div>
            `;

            reorderLineupsList.appendChild(row);
        });
    }

    reorderLineupsList.addEventListener('click', (e) => {
        const moveUpBtn = e.target.closest('[data-action="move-up"]');
        if (moveUpBtn) {
            const idx = parseInt(moveUpBtn.dataset.index, 10);
            if (idx > 0) {
                const temp = lineupConfigs[idx];
                lineupConfigs[idx] = lineupConfigs[idx - 1];
                lineupConfigs[idx - 1] = temp;
                saveState();
                renderTabs();
                renderReorderList();
                if (activeLineupKey === 'summary') renderSummaryView();
            }
            return;
        }

        const moveDownBtn = e.target.closest('[data-action="move-down"]');
        if (moveDownBtn) {
            const idx = parseInt(moveDownBtn.dataset.index, 10);
            if (idx < lineupConfigs.length - 1) {
                const temp = lineupConfigs[idx];
                lineupConfigs[idx] = lineupConfigs[idx + 1];
                lineupConfigs[idx + 1] = temp;
                saveState();
                renderTabs();
                renderReorderList();
                if (activeLineupKey === 'summary') renderSummaryView();
            }
            return;
        }

        const editBtn = e.target.closest('[data-action="edit-config"]');
        if (editBtn) {
            const id = editBtn.dataset.id;
            const config = lineupConfigs.find(c => c.id === id);
            if (config) openLineupConfigModal(config);
            return;
        }

        const deleteBtn = e.target.closest('[data-action="delete-config"]');
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            deleteLineupConfig(id);
            renderReorderList();
            return;
        }
    });

    btnResetDefaultLineups?.addEventListener('click', () => {
        if (confirm('Palautetaanko standardit oletuskentät (1. Kenttä, 2. Kenttä, 3. Kenttä, YV, AV, 6v5, Taktiikka)?')) {
            lineupConfigs = JSON.parse(JSON.stringify(DEFAULT_LINEUP_CONFIGS));
            activeLineupKey = '1';
            saveState();
            renderTabs();
            renderReorderList();
            if (activeLineupKey === 'summary') renderSummaryView();
            else switchTab('1');
            showToast('Oletuskentät palautettu.');
        }
    });

    // ==========================================
    // LINEUP CONFIGURATION
    // ==========================================
    function openLineupConfigModal(lineupConfig = null) {
        if (lineupConfig) {
            lineupConfigModalTitle.textContent = 'Muokkaa kentällisen nimeä';
            formLineupId.value = lineupConfig.id;
            formLineupName.value = lineupConfig.name;
        } else {
            lineupConfigModalTitle.textContent = 'Uusi kentällinen';
            lineupConfigForm.reset();
            formLineupId.value = '';
        }
        lineupConfigModal.classList.add('active');
    }

    lineupConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = formLineupId.value || 'lineup_' + Date.now();
        const name = formLineupName.value.trim();

        if (!name) return;

        const existing = lineupConfigs.find(c => c.id === id);
        if (existing) {
            existing.name = name;
            showToast('Kentällisen nimi päivitetty!');
        } else {
            lineupConfigs.push({ id, name, type: 'user' });
            lineups[id] = createEmptyLineupSlots();
            activeLineupKey = id;
            showToast(`Uusi kentällinen '${name}' luotu!`);
        }

        saveState();
        renderTabs();
        renderReorderList();
        if (activeLineupKey === 'summary') {
            renderSummaryView();
        } else {
            switchTab(id);
        }
        closeModal();
    });

    function deleteLineupConfig(id) {
        const config = lineupConfigs.find(c => c.id === id);
        if (!config) return;

        if (confirm(`Haluatko varmasti poistaa kentällisen '${config.name}'?`)) {
            lineupConfigs = lineupConfigs.filter(c => c.id !== id);
            delete lineups[id];
            delete lineupDrawings[id];
            delete lineupBalls[id];

            if (activeLineupKey === id) {
                activeLineupKey = lineupConfigs[0] ? lineupConfigs[0].id : 'summary';
            }

            saveState();
            renderTabs();
            if (activeLineupKey === 'summary') {
                renderSummaryView();
            } else {
                switchTab(activeLineupKey);
            }
            showToast('Kentällinen poistettu.');
        }
    }

    // ==========================================
    // SLOT-PICKER PLAYER MODAL
    // ==========================================
    function openSlotPickerModal(lineupKey, pos) {
        selectedSlotTarget = { lineupKey, pos };
        const isMv = pos === 'MV';
        const lineupName = getLineupName(lineupKey);

        slotPickerTitle.textContent = `Valitse pelaaja: ${lineupName} - ${pos}`;
        slotPickerInfo.textContent = `Valitse pelaaja ringistä paikkaan ${pos}:`;

        const currentOccupantId = (lineups[lineupKey] || {})[pos];

        const sortedRoster = [...roster].sort((a, b) => {
            if (isMv) {
                if (a.position === 'MV' && b.position !== 'MV') return -1;
                if (a.position !== 'MV' && b.position === 'MV') return 1;
            } else {
                if (a.position !== 'MV' && b.position === 'MV') return -1;
                if (a.position === 'MV' && b.position !== 'MV') return 1;
            }
            return a.number - b.number;
        });

        slotPickerPlayerList.innerHTML = '';

        if (sortedRoster.length === 0) {
            slotPickerPlayerList.innerHTML = `
                <div style="text-align:center; color: var(--text-muted); padding: 1rem;">
                    Joukkueessa ei ole vielä pelaajia. Lisää ensin pelaajia rinkiin!
                </div>
            `;
            slotPickerModal.classList.add('active');
            return;
        }

        sortedRoster.forEach(player => {
            const isPlayerMv = player.position === 'MV';
            const isSelected = player.id === currentOccupantId;

            const row = document.createElement('div');
            row.className = `slot-picker-row ${isSelected ? 'is-selected' : ''}`;
            row.dataset.playerId = player.id;

            row.innerHTML = `
                <div class="player-card-info">
                    <div class="player-num-circle" style="background: ${isPlayerMv ? 'var(--accent-mv)' : 'var(--accent-field)'}; color: ${isPlayerMv ? '#022c22' : '#fff'}">#${player.number}</div>
                    <div class="player-details">
                        <div class="player-name-row">
                            <span class="player-name">${escapeHtml(player.name)}</span>
                            ${player.isLoan ? '<span class="loan-badge">⭐ LAINA</span>' : ''}
                        </div>
                        <span class="player-submeta">${getPosLabel(player.position)}</span>
                    </div>
                </div>
                <button class="btn-xs ${isSelected ? 'btn-primary' : 'btn-outline'}">${isSelected ? 'Valittu ✓' : '+ Valitse'}</button>
            `;

            row.addEventListener('click', () => {
                assignPlayerToLineupSlot(lineupKey, pos, player.id);
                slotPickerModal.classList.remove('active');
                showToast(`Pelaaja #${player.number} asetettu paikkaan ${lineupName} - ${pos}`);
            });

            slotPickerPlayerList.appendChild(row);
        });

        slotPickerModal.classList.add('active');
    }

    btnClearSlotPicker.addEventListener('click', () => {
        if (selectedSlotTarget.lineupKey && selectedSlotTarget.pos) {
            lineups[selectedSlotTarget.lineupKey][selectedSlotTarget.pos] = '';
            saveState();
            if (activeLineupKey === 'summary') {
                renderSummaryView();
            } else {
                renderActiveLineupSlots();
                renderCourtPlayers();
            }
            slotPickerModal.classList.remove('active');
            showToast('Paikka tyhjennetty.');
        }
    });

    // ==========================================
    // TAP-TO-ASSIGN MOBILE SELECTION MENU
    // ==========================================
    function openAssignModal(player) {
        selectedPlayerForAssignment = player;
        assignModalTitle.textContent = `Sijoita kentälliseen`;
        assignModalPlayerInfo.innerHTML = `Valitse paikka pelaajalle <strong>#${player.number} ${escapeHtml(player.name)}</strong>:`;

        const slotTypes = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];

        assignOptionsGrid.innerHTML = '';

        lineupConfigs.forEach(cConfig => {
            const lKey = cConfig.id;
            const groupCard = document.createElement('div');
            groupCard.className = 'assign-group-card';

            let btnsHtml = '';
            slotTypes.forEach(pos => {
                const isMv = pos === 'MV';
                const currentPid = (lineups[lKey] || {})[pos];
                const occupant = roster.find(p => p.id === currentPid);
                const isCurrent = currentPid === player.id;

                btnsHtml += `
                    <button class="assign-pos-btn ${isMv ? 'is-mv' : ''}" data-lineup="${lKey}" data-pos="${pos}">
                        ${pos} ${isCurrent ? '✓' : (occupant ? '(' + occupant.number + ')' : '+')}
                    </button>
                `;
            });

            groupCard.innerHTML = `
                <h4>${escapeHtml(cConfig.name)}</h4>
                <div class="assign-btn-row">
                    ${btnsHtml}
                </div>
            `;

            assignOptionsGrid.appendChild(groupCard);
        });

        assignModal.classList.add('active');
    }

    assignOptionsGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.assign-pos-btn');
        if (!btn || !selectedPlayerForAssignment) return;

        const lKey = btn.dataset.lineup;
        const pos = btn.dataset.pos;

        assignPlayerToLineupSlot(lKey, pos, selectedPlayerForAssignment.id);
        assignModal.classList.remove('active');
        showToast(`Pelaaja #${selectedPlayerForAssignment.number} sijoitettu: ${getLineupName(lKey)} - ${pos}`);
    });

    // ==========================================
    // LINEUP SLOTS RENDER & DRAG DROP
    // ==========================================
    function renderActiveLineupSlots() {
        activeLineupTitle.textContent = getLineupName(activeLineupKey);
        const currentLineup = lineups[activeLineupKey] || {};

        const slotTypes = [
            { pos: 'MV', title: 'Maalivahti', isMv: true },
            { pos: 'VP', title: 'Vasen Puolustaja', isMv: false },
            { pos: 'OP', title: 'Oikea Puolustaja', isMv: false },
            { pos: 'VH', title: 'Vasen Hyökkääjä', isMv: false },
            { pos: 'KH', title: 'Sentteri / KH', isMv: false },
            { pos: 'OH', title: 'Oikea Hyökkääjä', isMv: false }
        ];

        lineupSlotsContainer.innerHTML = '';

        slotTypes.forEach(slot => {
            const playerId = currentLineup[slot.pos] || '';
            const player = roster.find(p => p.id === playerId);

            const slotEl = document.createElement('div');
            slotEl.className = `lineup-slot ${slot.isMv ? 'slot-mv' : 'slot-field'}`;
            slotEl.dataset.position = slot.pos;

            let dropzoneContent = '';
            if (player) {
                const isMv = player.position === 'MV';
                dropzoneContent = `
                    <div class="player-card ${isMv ? 'is-mv' : 'is-field'}" style="width: 100%; border-left: none;" draggable="true" data-player-id="${player.id}">
                        <div class="player-card-info">
                            <div class="player-num-circle">#${player.number}</div>
                            <div class="player-details">
                                <div class="player-name-row">
                                    <span class="player-name">${escapeHtml(player.name)}</span>
                                    ${player.isLoan ? '<span class="loan-badge">⭐ LAINA</span>' : ''}
                                </div>
                            </div>
                        </div>
                        <button class="mini-action-btn delete-btn" title="Poista paikalta" data-action="remove-slot" data-pos="${slot.pos}">✕</button>
                    </div>
                `;
            } else {
                dropzoneContent = `<span class="slot-placeholder">+ Täppää tai vedä ${slot.pos} tähän</span>`;
            }

            slotEl.innerHTML = `
                <div class="slot-badge">${slot.isMv ? '🟢' : '🔵'} ${slot.pos}</div>
                <div class="slot-title">${slot.title}</div>
                <div class="slot-dropzone" id="slot-zone-${slot.pos}">${dropzoneContent}</div>
            `;

            slotEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                slotEl.classList.add('drag-over');
            });

            slotEl.addEventListener('dragleave', () => {
                slotEl.classList.remove('drag-over');
            });

            slotEl.addEventListener('drop', (e) => {
                e.preventDefault();
                slotEl.classList.remove('drag-over');
                const droppedPlayerId = e.dataTransfer.getData('text/plain');
                if (droppedPlayerId) {
                    assignPlayerToLineupSlot(activeLineupKey, slot.pos, droppedPlayerId);
                }
            });

            lineupSlotsContainer.appendChild(slotEl);
        });
    }

    function assignPlayerToLineupSlot(lineupKey, pos, playerId) {
        if (!lineups[lineupKey]) lineups[lineupKey] = createEmptyLineupSlots();
        
        Object.keys(lineups[lineupKey]).forEach(k => {
            if (lineups[lineupKey][k] === playerId) {
                lineups[lineupKey][k] = '';
            }
        });

        lineups[lineupKey][pos] = playerId;
        saveState();
        if (activeLineupKey === 'summary') {
            renderSummaryView();
        } else {
            renderActiveLineupSlots();
            renderCourtPlayers();
        }
    }

    // ==========================================
    // SUMMARY VIEW
    // ==========================================
    function renderSummaryView() {
        summaryGridContainer.innerHTML = '';
        const slotTypes = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];

        lineupConfigs.forEach(cConfig => {
            const lKey = cConfig.id;
            const card = document.createElement('div');
            card.className = 'summary-lineup-card';
            const lineup = lineups[lKey] || {};

            let rowsHtml = '';
            slotTypes.forEach(pos => {
                const pid = lineup[pos];
                const player = roster.find(p => p.id === pid);
                const isMv = pos === 'MV';

                if (player) {
                    rowsHtml += `
                        <div class="summary-slot-row ${isMv ? 'is-mv' : 'is-field'}" data-action="pick-summary-slot" data-lineup="${lKey}" data-pos="${pos}">
                            <span class="summary-pos-tag">${pos}</span>
                            <span class="summary-player-val">#${player.number} ${escapeHtml(player.name)} ${player.isLoan ? '⭐' : ''}</span>
                            <button class="mini-action-btn delete-btn" data-action="remove-summary-slot" data-lineup="${lKey}" data-pos="${pos}">✕</button>
                        </div>
                    `;
                } else {
                    rowsHtml += `
                        <div class="summary-slot-row ${isMv ? 'is-mv' : 'is-field'}" data-action="pick-summary-slot" data-lineup="${lKey}" data-pos="${pos}">
                            <span class="summary-pos-tag">${pos}</span>
                            <span class="summary-player-val empty-val">+ Täppää valitaksesi (${pos})</span>
                        </div>
                    `;
                }
            });

            card.innerHTML = `
                <div class="summary-card-header">
                    <h3>${escapeHtml(cConfig.name)}</h3>
                    <div class="summary-card-header-actions">
                        <button class="btn-xs btn-outline" data-action="edit-summary-lineup-name" data-lineup="${lKey}" title="Muokkaa nimeä">✏️</button>
                        <button class="btn-xs btn-outline danger-text" data-action="delete-summary-lineup" data-lineup="${lKey}" title="Poista kentällinen">🗑️</button>
                        <button class="btn-xs btn-outline" data-action="clear-summary-lineup" data-lineup="${lKey}" title="Tyhjennä pelaajat">Tyhjennä</button>
                    </div>
                </div>
                <div class="summary-slots-list">
                    ${rowsHtml}
                </div>
            `;

            card.querySelectorAll('.summary-slot-row').forEach(row => {
                row.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    row.style.background = 'rgba(59, 130, 246, 0.2)';
                });
                row.addEventListener('dragleave', () => {
                    row.style.background = '';
                });
                row.addEventListener('drop', (e) => {
                    e.preventDefault();
                    row.style.background = '';
                    const droppedPlayerId = e.dataTransfer.getData('text/plain');
                    const targetLineup = row.dataset.lineup;
                    const targetPos = row.dataset.pos;
                    if (droppedPlayerId && targetLineup && targetPos) {
                        assignPlayerToLineupSlot(targetLineup, targetPos, droppedPlayerId);
                    }
                });
            });

            summaryGridContainer.appendChild(card);
        });
    }

    summaryGridContainer?.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-action="remove-summary-slot"]');
        if (removeBtn) {
            e.stopPropagation();
            const lKey = removeBtn.dataset.lineup;
            const pos = removeBtn.dataset.pos;
            if (lineups[lKey]) lineups[lKey][pos] = '';
            saveState();
            renderSummaryView();
            return;
        }

        const pickSlotRow = e.target.closest('[data-action="pick-summary-slot"]');
        if (pickSlotRow) {
            const lKey = pickSlotRow.dataset.lineup;
            const pos = pickSlotRow.dataset.pos;
            openSlotPickerModal(lKey, pos);
            return;
        }

        const editNameBtn = e.target.closest('[data-action="edit-summary-lineup-name"]');
        if (editNameBtn) {
            const lKey = editNameBtn.dataset.lineup;
            const config = lineupConfigs.find(c => c.id === lKey);
            if (config) openLineupConfigModal(config);
            return;
        }

        const deleteLineupBtn = e.target.closest('[data-action="delete-summary-lineup"]');
        if (deleteLineupBtn) {
            const lKey = deleteLineupBtn.dataset.lineup;
            deleteLineupConfig(lKey);
            return;
        }

        const clearBtn = e.target.closest('[data-action="clear-summary-lineup"]');
        if (clearBtn) {
            const lKey = clearBtn.dataset.lineup;
            const lName = getLineupName(lKey);
            if (confirm(`Tyhjennetäänkö ${lName}?`)) {
                lineups[lKey] = createEmptyLineupSlots();
                saveState();
                renderSummaryView();
                showToast(`${lName} tyhjennetty.`);
            }
        }
    });

    // ==========================================
    // TACTICAL COURT & DYNAMIC LINEUP PLAYERS & BALLS
    // ==========================================
    function renderCourtPlayers() {
        courtPlayersLayer.innerHTML = '';
        if (activeLineupKey === 'summary') return;

        const currentLineup = lineups[activeLineupKey] || {};
        const posKeys = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];

        posKeys.forEach(pos => {
            const playerId = currentLineup[pos];
            if (!playerId) return;

            const player = roster.find(p => p.id === playerId);
            if (!player) return;

            let defaultCoords = DEFAULT_POS_COORDS[orientationMode][pos] || { x: 50, y: 50 };
            let posKeyStore = `${activeLineupKey}_${pos}_${orientationMode}`;
            let coords = lineupCourtPositions[posKeyStore] || defaultCoords;

            const isMv = player.position === 'MV';
            const node = document.createElement('div');
            node.className = `court-player-node ${isMv ? 'is-mv' : 'is-field'}`;
            node.style.left = coords.x + '%';
            node.style.top = coords.y + '%';
            node.dataset.posKey = posKeyStore;

            let labelText = `#${player.number} ${player.name}`;
            if (labelMode === 'num') labelText = `#${player.number}`;
            if (labelMode === 'name') labelText = player.name;

            node.innerHTML = `
                <div class="node-circle">
                    ${player.number}
                    <button class="node-remove-btn" data-action="remove-lineup-player" data-pos="${pos}">✕</button>
                </div>
                <div class="node-label">
                    ${player.isLoan ? '⭐' : ''} ${escapeHtml(labelText)}
                </div>
            `;

            setupNodeTouchDragging(node, coords, posKeyStore);
            courtPlayersLayer.appendChild(node);
        });

        renderCourtBalls();
    }

    function addBallToActiveLineup() {
        if (!lineupBalls || typeof lineupBalls !== 'object') lineupBalls = {};
        if (!lineupBalls[activeLineupKey] || !Array.isArray(lineupBalls[activeLineupKey])) {
            lineupBalls[activeLineupKey] = [];
        }

        const newBall = {
            id: 'ball_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            x: 50,
            y: 50
        };

        lineupBalls[activeLineupKey].push(newBall);
        
        setDrawingTool('select', document.getElementById('tool-select'));

        saveState();
        renderCourtPlayers();
        showToast('Salibandypallo lisätty kentälle! ⚪');
    }

    function renderCourtBalls() {
        if (!lineupBalls || typeof lineupBalls !== 'object') return;
        const balls = lineupBalls[activeLineupKey] || [];
        balls.forEach(ball => {
            const ballNode = document.createElement('div');
            ballNode.className = 'court-ball-node';
            ballNode.style.left = ball.x + '%';
            ballNode.style.top = ball.y + '%';
            ballNode.dataset.ballId = ball.id;

            ballNode.innerHTML = `
                <div class="ball-circle" title="Salibandypallo">
                    <img src="ball.png?v=12.0" class="floorball-png-icon" alt="Pallo">
                    <button class="ball-remove-btn" data-action="remove-ball" data-ball-id="${ball.id}">✕</button>
                </div>
            `;

            setupBallTouchDragging(ballNode, ball);
            courtPlayersLayer.appendChild(ballNode);
        });
    }

    function setupBallTouchDragging(ballNode, ballObj) {
        let isDragging = false;
        let rafId = null;

        const onPointerDown = (e) => {
            if (drawingTool !== 'select') return;
            if (e.target.classList.contains('ball-remove-btn')) return;
            
            isDragging = true;
            ballNode.setPointerCapture(e.pointerId);

            ballNode.addEventListener('pointermove', onPointerMove);
            ballNode.addEventListener('pointerup', onPointerUp);
            ballNode.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const rect = floorballCourt.getBoundingClientRect();
            let newX = ((e.clientX - rect.left) / rect.width) * 100;
            let newY = ((e.clientY - rect.top) / rect.height) * 100;

            newX = Math.max(3, Math.min(97, newX));
            newY = Math.max(3, Math.min(97, newY));

            ballObj.x = newX;
            ballObj.y = newY;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                ballNode.style.left = newX + '%';
                ballNode.style.top = newY + '%';
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            ballNode.removeEventListener('pointermove', onPointerMove);
            ballNode.removeEventListener('pointerup', onPointerUp);
            ballNode.removeEventListener('pointercancel', onPointerUp);
            saveState();
        };

        ballNode.addEventListener('pointerdown', onPointerDown);
    }

    function setupNodeTouchDragging(node, coords, posKeyStore) {
        let isDragging = false;
        let rafId = null;

        const onPointerDown = (e) => {
            if (drawingTool !== 'select') return;
            if (e.target.classList.contains('node-remove-btn')) return;
            
            isDragging = true;
            node.setPointerCapture(e.pointerId);

            node.addEventListener('pointermove', onPointerMove);
            node.addEventListener('pointerup', onPointerUp);
            node.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const rect = floorballCourt.getBoundingClientRect();
            let newX = ((e.clientX - rect.left) / rect.width) * 100;
            let newY = ((e.clientY - rect.top) / rect.height) * 100;

            newX = Math.max(3, Math.min(97, newX));
            newY = Math.max(3, Math.min(97, newY));

            coords.x = newX;
            coords.y = newY;
            lineupCourtPositions[posKeyStore] = { x: newX, y: newY };

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                node.style.left = newX + '%';
                node.style.top = newY + '%';
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            node.removeEventListener('pointermove', onPointerMove);
            node.removeEventListener('pointerup', onPointerUp);
            node.removeEventListener('pointercancel', onPointerUp);
            saveState();
        };

        node.addEventListener('pointerdown', onPointerDown);
    }

    floorballCourt.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    floorballCourt.addEventListener('drop', (e) => {
        e.preventDefault();
        const playerId = e.dataTransfer.getData('text/plain');
        if (!playerId) return;

        const player = roster.find(p => p.id === playerId);
        if (!player) return;

        let targetPos = player.position === 'MV' ? 'MV' : 'KH';
        const lineup = lineups[activeLineupKey] || {};
        
        if (player.position !== 'MV') {
            if (!lineup['KH']) targetPos = 'KH';
            else if (!lineup['VH']) targetPos = 'VH';
            else if (!lineup['OH']) targetPos = 'OH';
            else if (!lineup['VP']) targetPos = 'VP';
            else if (!lineup['OP']) targetPos = 'OP';
        }

        assignPlayerToLineupSlot(activeLineupKey, targetPos, playerId);
    });

    // ==========================================
    // CANVAS TACTICAL DRAWING SYSTEM
    // ==========================================
    function setupCanvas() {
        window.addEventListener('resize', resizeCanvas);
        setTimeout(resizeCanvas, 100);

        canvas.addEventListener('pointerdown', (e) => {
            if (drawingTool === 'select' || activeLineupKey === 'summary') return;
            isDrawing = true;
            e.preventDefault();
            canvas.setPointerCapture(e.pointerId);
            const rect = canvas.getBoundingClientRect();
            currentPath = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }];
        });

        canvas.addEventListener('pointermove', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            currentPath.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            drawCanvasLines();
            drawPreviewPath(currentPath);
        });

        canvas.addEventListener('pointerup', () => {
            if (!isDrawing) return;
            isDrawing = false;
            if (currentPath.length > 1) {
                let color = '#38bdf8';
                if (drawingTool === 'pass') color = '#eab308';
                if (drawingTool === 'shot') color = '#ec4899';

                if (!lineupDrawings[activeLineupKey]) lineupDrawings[activeLineupKey] = [];
                lineupDrawings[activeLineupKey].push({
                    type: drawingTool,
                    points: [...currentPath],
                    color: color
                });
                saveState();
            }
            currentPath = [];
            drawCanvasLines();
        });

        canvas.addEventListener('pointercancel', () => {
            isDrawing = false;
            currentPath = [];
            drawCanvasLines();
        });
    }

    function drawCanvasLines() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (activeLineupKey === 'summary') return;

        const currentDrawings = lineupDrawings[activeLineupKey] || [];
        currentDrawings.forEach(draw => {
            renderPath(draw.points, draw.type, draw.color);
        });
    }

    function drawPreviewPath(points) {
        let color = '#38bdf8';
        if (drawingTool === 'pass') color = '#eab308';
        if (drawingTool === 'shot') color = '#ec4899';
        renderPath(points, drawingTool, color);
    }

    function renderPath(points, type, color) {
        if (points.length < 2) return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = (type === 'shot') ? 4.5 : 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (type === 'pass') {
            ctx.setLineDash([8, 6]);
        } else if (type === 'shot') {
            ctx.setLineDash([10, 4]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        const end = points[points.length - 1];
        const prev = points[Math.max(0, points.length - 4)];
        const angle = Math.atan2(end.y - prev.y, end.x - prev.x);

        ctx.setLineDash([]);
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - 16 * Math.cos(angle - Math.PI / 5), end.y - 16 * Math.sin(angle - Math.PI / 5));
        ctx.lineTo(end.x - 16 * Math.cos(angle + Math.PI / 5), end.y - 16 * Math.sin(angle + Math.PI / 5));
        ctx.closePath();
        ctx.fill();

        if (type === 'shot') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(end.x, end.y, 6, 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.restore();
    }

    function undoLastDrawing() {
        const currentDrawings = lineupDrawings[activeLineupKey] || [];
        if (currentDrawings.length > 0) {
            currentDrawings.pop();
            saveState();
            drawCanvasLines();
            showToast('Viimeisin piirros kumottu ↩️');
        } else {
            showToast('Ei piirroksia kumottavaksi tässä kentällisessä.');
        }
    }

    function openModal(editPlayer = null) {
        if (editPlayer) {
            modalTitle.textContent = 'Muokkaa pelaajaa';
            formPlayerId.value = editPlayer.id;
            formName.value = editPlayer.name;
            formNumber.value = editPlayer.number;
            formPosition.value = editPlayer.position;
            formIsLoan.checked = editPlayer.isLoan;
            formNotes.value = editPlayer.notes || '';
        } else {
            modalTitle.textContent = 'Lisää uusi pelaaja / Laina';
            playerForm.reset();
            formPlayerId.value = '';
            formPosition.value = 'H';
            formIsLoan.checked = false;
        }
        playerModal.classList.add('active');
    }

    function closeModal() {
        playerModal.classList.remove('active');
        teamModal.classList.remove('active');
        photoModal.classList.remove('active');
        assignModal.classList.remove('active');
        slotPickerModal.classList.remove('active');
        lineupConfigModal.classList.remove('active');
        manageLineupsModal.classList.remove('active');
        importPlayersModal.classList.remove('active');
        authModal?.classList.remove('active');
    }

    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = formPlayerId.value || 'p_' + Date.now();
        const name = formName.value.trim();
        const number = parseInt(formNumber.value, 10);
        const position = formPosition.value;
        const isLoan = formIsLoan.checked;
        const notes = formNotes.value.trim();

        if (!name || isNaN(number)) return;

        const existingIndex = roster.findIndex(p => p.id === id);
        const playerData = { id, name, number, position, isLoan, notes };

        if (existingIndex >= 0) {
            roster[existingIndex] = playerData;
            showToast('Pelaajan tiedot päivitetty!');
        } else {
            roster.push(playerData);
            showToast('Uusi pelaaja lisätty rinkiin!');
        }

        saveState();
        updateRosterCounters();
        renderRoster();
        if (activeLineupKey === 'summary') {
            renderSummaryView();
        } else {
            renderActiveLineupSlots();
            renderCourtPlayers();
        }
        closeModal();
    });

    function deletePlayer(id) {
        if (!confirm('Haluatko varmasti poistaa pelaajan ringistä?')) return;
        roster = roster.filter(p => p.id !== id);
        
        Object.keys(lineups).forEach(lk => {
            Object.keys(lineups[lk]).forEach(pos => {
                if (lineups[lk][pos] === id) lineups[lk][pos] = '';
            });
        });

        saveState();
        updateRosterCounters();
        renderRoster();
        if (activeLineupKey === 'summary') {
            renderSummaryView();
        } else {
            renderActiveLineupSlots();
            renderCourtPlayers();
        }
        showToast('Pelaaja poistettu.');
    }

    teamForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = teamNameInput.value.trim();
        if (!name) return;
        const newTeamId = 'team_' + Date.now();
        teams.push({ id: newTeamId, name: name });

        localStorage.setItem(`salibandy_roster_${newTeamId}`, JSON.stringify([]));
        
        const emptyLineups = {};
        DEFAULT_LINEUP_CONFIGS.forEach(c => {
            emptyLineups[c.id] = createEmptyLineupSlots();
        });
        localStorage.setItem(`salibandy_lineups_${newTeamId}`, JSON.stringify(emptyLineups));

        renderTeamDropdown();
        closeModal();
        switchTeam(newTeamId);
        showToast(`Uusi tyhjä joukkue '${name}' luotu!`);
    });

    photoFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        ocrStatus.style.display = 'flex';
        ocrStatusText.textContent = 'Luetaan tekstiä valokuvasta...';
        photoPreviewStep.style.display = 'none';

        const reader = new FileReader();
        reader.onload = function(event) {
            const imgData = event.target.result;
            
            if (window.Tesseract) {
                Tesseract.recognize(imgData, 'fin+eng', { logger: m => console.log(m) })
                    .then(({ data: { text } }) => {
                        parseOcrTextToPlayers(text);
                    })
                    .catch(err => {
                        console.error('OCR Error:', err);
                        parseOcrTextToPlayers("Sample #10 Juho\n#23 Matias (MV)\n#88 Eero");
                    });
            } else {
                parseOcrTextToPlayers("Sample #10 Juho\n#23 Matias (MV)\n#88 Eero");
            }
        };
        reader.readAsDataURL(file);
    });

    function parseOcrTextToPlayers(text) {
        ocrStatus.style.display = 'none';
        tempOcrParsedPlayers = [];

        const lines = text.split(/\r?\n/);
        let idCounter = 1;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const numMatch = trimmed.match(/#?(\d{1,2})\s*([^#\d]+)/);
            if (numMatch) {
                const number = parseInt(numMatch[1], 10);
                let name = numMatch[2].replace(/[\(\)\[\]]/g, '').trim();
                let position = 'H';

                if (trimmed.toLowerCase().includes('mv') || trimmed.toLowerCase().includes('maalivahti')) {
                    position = 'MV';
                    name = name.replace(/mv|maalivahti/gi, '').trim();
                }

                if (name.length >= 2 && number > 0) {
                    tempOcrParsedPlayers.push({
                        id: 'ocr_' + Date.now() + '_' + (idCounter++),
                        name: name,
                        number: number,
                        position: position
                    });
                }
            }
        });

        if (tempOcrParsedPlayers.length === 0) {
            tempOcrParsedPlayers = [
                { id: 'ocr_1', name: 'Matti Meikäläinen', number: 10, position: 'H' },
                { id: 'ocr_2', name: 'Jussi Maalivahti', number: 31, position: 'MV' }
            ];
        }

        renderOcrResults();
        photoPreviewStep.style.display = 'block';
    }

    function renderOcrResults() {
        ocrResultsList.innerHTML = '';
        tempOcrParsedPlayers.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'ocr-item-row';
            row.innerHTML = `
                <input type="number" value="${item.number}" class="form-input ocr-num-input" data-index="${index}">
                <input type="text" value="${escapeHtml(item.name)}" class="form-input ocr-name-input" data-index="${index}">
                <select class="form-input ocr-pos-input" data-index="${index}">
                    <option value="MV" ${item.position === 'MV' ? 'selected' : ''}>🟢 MV</option>
                    <option value="H" ${item.position !== 'MV' ? 'selected' : ''}>🔵 Kenttä</option>
                </select>
            `;
            ocrResultsList.appendChild(row);
        });
    }

    document.getElementById('btn-confirm-ocr-import').addEventListener('click', () => {
        const rows = ocrResultsList.querySelectorAll('.ocr-item-row');
        let count = 0;

        rows.forEach(row => {
            const numVal = parseInt(row.querySelector('.ocr-num-input').value, 10);
            const nameVal = row.querySelector('.ocr-name-input').value.trim();
            const posVal = row.querySelector('.ocr-pos-input').value;

            if (nameVal && !isNaN(numVal)) {
                roster.push({
                    id: 'p_photo_' + Date.now() + '_' + (count++),
                    name: nameVal,
                    number: numVal,
                    position: posVal,
                    isLoan: false,
                    notes: 'Tuotu valokuvasta 📷'
                });
            }
        });

        saveState();
        updateRosterCounters();
        renderRoster();
        closeModal();
        showToast(`${count} uutta pelaajaa tuotu kuvasta rinkiin! 🎉`);
    });

    function exportLineupsToClipboard() {
        let text = `🏑 ${teams.find(t => t.id === currentTeamId)?.name || 'SALIBANDY'} - KENTÄLLISET\n\n`;

        lineupConfigs.forEach(cConfig => {
            const key = cConfig.id;
            const name = cConfig.name;
            const lineup = lineups[key] || {};
            const hasPlayers = Object.values(lineup).some(val => val !== '');

            if (hasPlayers) {
                text += `📌 ${name.toUpperCase()}:\n`;
                const posOrder = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];
                posOrder.forEach(pos => {
                    const pid = lineup[pos];
                    const player = roster.find(p => p.id === pid);
                    const icon = pos === 'MV' ? '🟢' : '🔵';
                    if (player) {
                        text += `  ${icon} ${pos}: #${player.number} ${player.name}${player.isLoan ? ' (LAINA)' : ''}\n`;
                    }
                });
                text += `\n`;
            }
        });

        navigator.clipboard.writeText(text).then(() => {
            showToast('Kentälliset kopioitu leikepöydälle! 📋');
        }).catch(err => {
            console.error('Kopiointivirhe:', err);
            showToast('Kopiointi epäonnistui.');
        });
    }

    function bindEvents() {
        teamSelect.addEventListener('change', (e) => switchTeam(e.target.value));
        btnDeleteTeam?.addEventListener('click', deleteActiveTeam);
        cloudSyncBadge?.addEventListener('click', forceCloudSync);

        document.getElementById('btn-new-team').addEventListener('click', () => {
            teamNameInput.value = '';
            teamModal.classList.add('active');
        });

        document.getElementById('btn-close-team-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel-team-modal').addEventListener('click', closeModal);
        document.getElementById('btn-close-assign-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-close-slot-picker-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-close-lineup-config-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-lineup-config-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-close-manage-lineups-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-close-manage-done')?.addEventListener('click', closeModal);
        document.getElementById('btn-close-import-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-import-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-close-auth-modal')?.addEventListener('click', closeModal);

        document.getElementById('btn-open-import-modal')?.addEventListener('click', openImportPlayersModal);

        document.getElementById('btn-add-lineup-summary')?.addEventListener('click', () => openLineupConfigModal());
        document.getElementById('btn-manage-lineups-summary')?.addEventListener('click', () => openManageLineupsModal());
        
        document.getElementById('btn-add-ball')?.addEventListener('click', addBallToActiveLineup);

        document.getElementById('btn-edit-active-lineup-name')?.addEventListener('click', () => {
            const config = lineupConfigs.find(c => c.id === activeLineupKey);
            if (config) openLineupConfigModal(config);
        });

        document.getElementById('btn-delete-active-lineup')?.addEventListener('click', () => {
            deleteLineupConfig(activeLineupKey);
        });

        document.getElementById('btn-import-photo').addEventListener('click', () => {
            photoPreviewStep.style.display = 'none';
            ocrStatus.style.display = 'none';
            photoModal.classList.add('active');
        });
        document.getElementById('btn-photo-add').addEventListener('click', () => {
            photoPreviewStep.style.display = 'none';
            ocrStatus.style.display = 'none';
            photoModal.classList.add('active');
        });
        document.getElementById('btn-close-photo-modal').addEventListener('click', closeModal);
        document.getElementById('btn-reselect-photo').addEventListener('click', () => {
            photoPreviewStep.style.display = 'none';
        });

        document.getElementById('btn-add-player').addEventListener('click', () => openModal());
        document.getElementById('btn-quick-add').addEventListener('click', () => openModal());
        document.getElementById('btn-close-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

        rosterSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderRoster();
        });

        filterPillBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterPillBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter;
                renderRoster();
            });
        });

        rosterListContainer.addEventListener('click', (e) => {
            const tapAssignTrigger = e.target.closest('[data-action="tap-assign"]');
            if (tapAssignTrigger) {
                const id = tapAssignTrigger.dataset.id;
                const player = roster.find(p => p.id === id);
                if (player) openAssignModal(player);
                return;
            }

            const actionBtn = e.target.closest('.mini-action-btn');
            if (!actionBtn) return;
            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.id;
            
            if (action === 'edit') {
                const player = roster.find(p => p.id === id);
                if (player) openModal(player);
            } else if (action === 'delete') {
                deletePlayer(id);
            }
        });

        lineupSlotsContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-action="remove-slot"]');
            if (removeBtn) {
                e.stopPropagation();
                const pos = removeBtn.dataset.pos;
                lineups[activeLineupKey][pos] = '';
                saveState();
                renderActiveLineupSlots();
                renderCourtPlayers();
                return;
            }

            const slotEl = e.target.closest('.lineup-slot');
            if (slotEl) {
                const pos = slotEl.dataset.position;
                if (pos) openSlotPickerModal(activeLineupKey, pos);
            }
        });

        courtPlayersLayer.addEventListener('click', (e) => {
            const removePlayerBtn = e.target.closest('[data-action="remove-lineup-player"]');
            if (removePlayerBtn) {
                const pos = removePlayerBtn.dataset.pos;
                if (lineups[activeLineupKey]) lineups[activeLineupKey][pos] = '';
                saveState();
                renderActiveLineupSlots();
                renderCourtPlayers();
                return;
            }

            const removeBallBtn = e.target.closest('[data-action="remove-ball"]');
            if (removeBallBtn) {
                const ballId = removeBallBtn.dataset.ballId;
                if (lineupBalls[activeLineupKey]) {
                    lineupBalls[activeLineupKey] = lineupBalls[activeLineupKey].filter(b => b.id !== ballId);
                    saveState();
                    renderCourtPlayers();
                    showToast('Pallo poistettu.');
                }
            }
        });

        document.getElementById('tool-select').addEventListener('click', (e) => setDrawingTool('select', e.currentTarget));
        document.getElementById('tool-pass').addEventListener('click', (e) => setDrawingTool('pass', e.currentTarget));
        document.getElementById('tool-run').addEventListener('click', (e) => setDrawingTool('run', e.currentTarget));
        document.getElementById('tool-shot').addEventListener('click', (e) => setDrawingTool('shot', e.currentTarget));

        document.getElementById('tool-undo').addEventListener('click', undoLastDrawing);

        document.getElementById('tool-clear-drawings').addEventListener('click', () => {
            lineupDrawings[activeLineupKey] = [];
            saveState();
            drawCanvasLines();
            showToast('Piirrokset tyhjennetty tästä kentällisestä.');
        });

        document.getElementById('btn-toggle-orientation').addEventListener('click', () => {
            orientationMode = (orientationMode === 'horizontal') ? 'vertical' : 'horizontal';
            applyOrientation();
            showToast(`Kentän asento vaihtoi: ${orientationMode === 'vertical' ? 'Pysty (20x40m)' : 'Vaaka (40x20m)'}`);
        });

        document.getElementById('btn-clear-pitch').addEventListener('click', () => {
            const lName = getLineupName(activeLineupKey);
            if (confirm(`Tyhjennetäänkö ${lName} kentältä?`)) {
                lineups[activeLineupKey] = createEmptyLineupSlots();
                lineupDrawings[activeLineupKey] = [];
                lineupBalls[activeLineupKey] = [];
                saveState();
                renderActiveLineupSlots();
                renderCourtPlayers();
                drawCanvasLines();
                showToast('Kentällinen ja pallot tyhjennetty.');
            }
        });

        document.getElementById('btn-toggle-labels').addEventListener('click', () => {
            if (labelMode === 'full') {
                labelMode = 'num';
                document.getElementById('label-mode-text').textContent = '# Vain';
            } else if (labelMode === 'num') {
                labelMode = 'name';
                document.getElementById('label-mode-text').textContent = 'Nimi vain';
            } else {
                labelMode = 'full';
                document.getElementById('label-mode-text').textContent = 'Nimi & #';
            }
            renderCourtPlayers();
        });

        document.getElementById('btn-export-text').addEventListener('click', exportLineupsToClipboard);
        document.getElementById('btn-copy-this-lineup').addEventListener('click', exportLineupsToClipboard);
        document.getElementById('btn-copy-all-summary')?.addEventListener('click', exportLineupsToClipboard);
    }

    function setDrawingTool(tool, btn) {
        drawingTool = tool;
        document.querySelectorAll('.toolbar-group .tool-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        
        if (tool === 'select') {
            canvas.style.pointerEvents = 'none';
            canvas.style.touchAction = 'auto';
            floorballCourt.classList.remove('drawing-active');
        } else {
            canvas.style.pointerEvents = 'auto';
            canvas.style.touchAction = 'none';
            floorballCourt.classList.add('drawing-active');
        }
    }

    document.addEventListener('DOMContentLoaded', init);

})();
