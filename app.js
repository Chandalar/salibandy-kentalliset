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
    let isCloudLoading = false;

    // Global State
    let teams = loadFromStorage('salibandy_teams_v1', DEFAULT_TEAMS);
    let currentTeamId = loadFromStorage('salibandy_active_team_id', 'team_edustus');

    cleanCorruptedUserTeams();

    let roster = loadRosterForTeam(currentTeamId);
    let lineupConfigs = loadLineupConfigs(currentTeamId);
    let lineups = loadLineupsForTeam(currentTeamId, lineupConfigs);
    
    let lineupDrawings = loadFromStorage(`salibandy_drawings_${currentTeamId}`, {});
    lineupDrawings = sanitizeDrawings(lineupDrawings);

    let lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});
    let lineupBalls = loadFromStorage(`salibandy_balls_${currentTeamId}`, { '1_p1_c1': [{ id: 'ball_default', x: 55, y: 50 }] });
    let lineupCones = loadFromStorage(`salibandy_cones_${currentTeamId}`, {});
    let lineupOpponents = loadFromStorage(`salibandy_opponents_${currentTeamId}`, {});
    let lineupPages = loadFromStorage(`salibandy_pages_${currentTeamId}`, {});

    let activeLineupKey = '1';
    let activePageId = 'p1';
    let activeFilter = 'all';
    let searchQuery = '';
    let labelMode = 'full';
    let orientationMode = window.innerWidth <= 600 ? 'vertical' : 'horizontal';

    // Per-court state maps
    let courtDrawingTools = {};
    let courtIsDrawingMap = {};
    let courtPathPctMap = {};

    // DOM Elements
    const teamSelect = document.getElementById('team-select');
    const btnDeleteTeam = document.getElementById('btn-delete-team');
    const rosterListContainer = document.getElementById('roster-list-container');
    const rosterSearchInput = document.getElementById('roster-search');
    const filterPillBtns = document.querySelectorAll('.pill-btn');
    const tabsScrollContainer = document.getElementById('tabs-scroll-container');
    const activeLineupTitle = document.getElementById('active-lineup-title');
    const lineupSlotsContainer = document.getElementById('lineup-slots-container');

    const pagesScrollContainer = document.getElementById('pages-scroll-container');
    const btnAddTacticPage = document.getElementById('btn-add-tactic-page');
    const btnDeleteTacticPage = document.getElementById('btn-delete-tactic-page');
    const courtsVerticalList = document.getElementById('courts-vertical-list');
    const btnAddCourtBoard = document.getElementById('btn-add-court-board');

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

    function getCourtKey(courtId) {
        return `${activeLineupKey}_${activePageId}_${courtId}`;
    }

    // ==========================================
    // INITIALIZATION & REAL-TIME FIREBASE SYNC SETUP
    // ==========================================
    function init() {
        if (currentTeamId === 'team_edustus' && (!roster || !Array.isArray(roster) || roster.length === 0)) {
            roster = JSON.parse(JSON.stringify(DEFAULT_ROSTER));
            lineups = JSON.parse(JSON.stringify(DEFAULT_LINEUPS));
            saveStateLocalOnly();
        }

        renderTeamDropdown();
        renderTabs();
        renderTacticalPageBadges();
        bindEvents();
        initFirebaseAuth();
        updateRosterCounters();
        renderRoster();
        renderActiveLineupSlots();
        renderCourtBoards();
    }

    function sanitizeDrawings(drawingsObj) {
        if (!drawingsObj || typeof drawingsObj !== 'object') return {};
        Object.keys(drawingsObj).forEach(lk => {
            if (Array.isArray(drawingsObj[lk])) {
                drawingsObj[lk].forEach(draw => {
                    if (!draw.id) draw.id = 'draw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
                    if (!draw.pointsPct && draw.points && Array.isArray(draw.points)) {
                        const courtWidth = 800;
                        const courtHeight = 400;
                        draw.pointsPct = draw.points.map(p => ({
                            x: Math.round(((p.x / courtWidth) * 100) * 10) / 10,
                            y: Math.round(((p.y / courtHeight) * 100) * 10) / 10
                        }));
                    }
                });
            }
        });
        return drawingsObj;
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
            cloudSyncBadge.innerHTML = '☁️ Synkronoi nyt';
            cloudSyncBadge.title = 'Klikkaa tästä tallentaaksesi kaikki koneen joukkueet ja kentälliset pilveen!';
            cloudSyncBadge.style.cursor = 'pointer';
        } else {
            cloudSyncBadge.className = 'cloud-sync-badge is-offline';
            cloudSyncBadge.innerHTML = '💻 Paikallinen';
            cloudSyncBadge.title = 'Kirjaudu sisään synkronoidaksesi pilveen';
            cloudSyncBadge.style.cursor = 'pointer';
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
        const conesMap = {};
        const opponentsMap = {};
        const pagesMap = {};

        teams.forEach(t => {
            const tId = t.id;
            rostersMap[tId] = (tId === currentTeamId) ? roster : loadRosterForTeam(tId);
            configsMap[tId] = (tId === currentTeamId) ? lineupConfigs : loadLineupConfigs(tId);
            lineupsMap[tId] = (tId === currentTeamId) ? lineups : loadLineupsForTeam(tId, configsMap[tId]);
            drawingsMap[tId] = (tId === currentTeamId) ? lineupDrawings : loadFromStorage(`salibandy_drawings_${tId}`, {});
            positionsMap[tId] = (tId === currentTeamId) ? lineupCourtPositions : loadFromStorage(`salibandy_positions_${tId}`, {});
            ballsMap[tId] = (tId === currentTeamId) ? lineupBalls : loadFromStorage(`salibandy_balls_${tId}`, {});
            conesMap[tId] = (tId === currentTeamId) ? lineupCones : loadFromStorage(`salibandy_cones_${tId}`, {});
            opponentsMap[tId] = (tId === currentTeamId) ? lineupOpponents : loadFromStorage(`salibandy_opponents_${tId}`, {});
            pagesMap[tId] = (tId === currentTeamId) ? lineupPages : loadFromStorage(`salibandy_pages_${tId}`, {});
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
            balls: ballsMap,
            cones: conesMap,
            opponents: opponentsMap,
            pages: pagesMap
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

        let totalPlayersCount = 0;
        teams.forEach(t => {
            const r = (t.id === currentTeamId) ? roster : loadRosterForTeam(t.id);
            totalPlayersCount += r.length;
        });

        db.collection('users').doc(currentUser.uid).set(payload, { merge: true })
            .then(() => {
                updateCloudSyncBadge(true);
                showToast(`🎉 Kaikki ${teams.length} joukkuetta, ${totalPlayersCount} pelaajaa ja kentälliset tallennettu pilveen!`);
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

            if (!cloudData.rosters || !cloudData.lineups) {
                console.log('🔥 Upgrading Firestore doc with full rosters, lineups, drawings, positions, balls, cones, opponents, and pages...');
                const fullPayload = buildFullCloudPayload();
                userRef.set(fullPayload, { merge: true });
            }

            isCloudLoading = true;
            let needCloudUpdateBack = false;

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

            if (cloudData.rosters) {
                Object.keys(cloudData.rosters).forEach(tId => {
                    let cloudRoster = cloudData.rosters[tId] || [];
                    let localRoster = loadFromStorage(`salibandy_roster_${tId}`, []);
                    
                    if (tId === 'team_edustus' && cloudRoster.length === 0 && localRoster.length === 0) {
                        cloudRoster = JSON.parse(JSON.stringify(DEFAULT_ROSTER));
                        needCloudUpdateBack = true;
                    }

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

                teams.forEach(t => {
                    if (!cloudData.rosters[t.id]) {
                        const localRoster = loadFromStorage(`salibandy_roster_${t.id}`, []);
                        cloudData.rosters[t.id] = localRoster;
                        needCloudUpdateBack = true;
                    }
                });
            } else {
                needCloudUpdateBack = true;
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
                    const sanitized = sanitizeDrawings({ [tId]: cloudData.drawings[tId] });
                    localStorage.setItem(`salibandy_drawings_${tId}`, JSON.stringify(sanitized[tId]));
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
            if (cloudData.cones) {
                Object.keys(cloudData.cones).forEach(tId => {
                    localStorage.setItem(`salibandy_cones_${tId}`, JSON.stringify(cloudData.cones[tId]));
                });
            }
            if (cloudData.opponents) {
                Object.keys(cloudData.opponents).forEach(tId => {
                    localStorage.setItem(`salibandy_opponents_${tId}`, JSON.stringify(cloudData.opponents[tId]));
                });
            }
            if (cloudData.pages) {
                Object.keys(cloudData.pages).forEach(tId => {
                    localStorage.setItem(`salibandy_pages_${tId}`, JSON.stringify(cloudData.pages[tId]));
                });
            }

            roster = loadRosterForTeam(currentTeamId);
            lineupConfigs = loadLineupConfigs(currentTeamId);
            lineups = loadLineupsForTeam(currentTeamId, lineupConfigs);
            lineupDrawings = loadFromStorage(`salibandy_drawings_${currentTeamId}`, {});
            lineupDrawings = sanitizeDrawings(lineupDrawings);
            lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});
            lineupBalls = loadFromStorage(`salibandy_balls_${currentTeamId}`, {});
            lineupCones = loadFromStorage(`salibandy_cones_${currentTeamId}`, {});
            lineupOpponents = loadFromStorage(`salibandy_opponents_${currentTeamId}`, {});
            lineupPages = loadFromStorage(`salibandy_pages_${currentTeamId}`, {});

            saveStateLocalOnly();

            renderTeamDropdown();
            renderTabs();
            renderTacticalPageBadges();
            updateRosterCounters();
            renderRoster();
            if (activeLineupKey === 'summary') {
                renderSummaryView();
            } else {
                renderActiveLineupSlots();
                renderCourtBoards();
            }

            updateCloudSyncBadge(true);

            if (needCloudUpdateBack) {
                const mergedPayload = buildFullCloudPayload();
                userRef.set(mergedPayload, { merge: true }).then(() => {
                    console.log('☁️ Auto-upgraded and merged local data into Cloud Firestore!');
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
        const stored = loadFromStorage(`salibandy_roster_${teamId}`, null);
        if (teamId === 'team_edustus') {
            if (!stored || !Array.isArray(stored) || stored.length === 0) {
                return JSON.parse(JSON.stringify(DEFAULT_ROSTER));
            }
            return stored;
        }
        return stored || [];
    }

    function createEmptyLineupSlots() {
        return { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };
    }

    function loadLineupsForTeam(teamId, configs) {
        const stored = loadFromStorage(`salibandy_lineups_${teamId}`, null);
        if (stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
            if (configs && Array.isArray(configs)) {
                configs.forEach(c => {
                    if (!stored[c.id]) stored[c.id] = createEmptyLineupSlots();
                });
            }
            return stored;
        }

        if (teamId === 'team_edustus') return JSON.parse(JSON.stringify(DEFAULT_LINEUPS));

        const emptyLineups = {};
        if (configs && Array.isArray(configs)) {
            configs.forEach(c => {
                emptyLineups[c.id] = createEmptyLineupSlots();
            });
        }
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
            localStorage.setItem(`salibandy_cones_${currentTeamId}`, JSON.stringify(lineupCones));
            localStorage.setItem(`salibandy_opponents_${currentTeamId}`, JSON.stringify(lineupOpponents));
            localStorage.setItem(`salibandy_pages_${currentTeamId}`, JSON.stringify(lineupPages));
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
        }, 3200);
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
        lineupDrawings = sanitizeDrawings(lineupDrawings);
        lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});
        lineupBalls = loadFromStorage(`salibandy_balls_${currentTeamId}`, {});
        lineupCones = loadFromStorage(`salibandy_cones_${currentTeamId}`, {});
        lineupOpponents = loadFromStorage(`salibandy_opponents_${currentTeamId}`, {});
        lineupPages = loadFromStorage(`salibandy_pages_${currentTeamId}`, {});

        activePageId = 'p1';

        if (activeLineupKey !== 'summary' && !lineupConfigs.some(c => c.id === activeLineupKey)) {
            activeLineupKey = lineupConfigs[0] ? lineupConfigs[0].id : '1';
        }

        saveState();

        renderTabs();
        renderTacticalPageBadges();
        updateRosterCounters();
        renderRoster();
        if (activeLineupKey === 'summary') {
            renderSummaryView();
        } else {
            renderActiveLineupSlots();
            renderCourtBoards();
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
            localStorage.removeItem(`salibandy_cones_${deleteId}`);
            localStorage.removeItem(`salibandy_opponents_${deleteId}`);
            localStorage.removeItem(`salibandy_pages_${deleteId}`);

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
        activePageId = 'p1';
        renderTabs();
        renderTacticalPageBadges();

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
            renderCourtBoards();
        }
    }

    // ==========================================
    // MULTIPLE TACTICAL PAGES & TAB RENAMING
    // ==========================================
    function getPagesForActiveLineup() {
        if (!lineupPages[activeLineupKey] || !Array.isArray(lineupPages[activeLineupKey])) {
            lineupPages[activeLineupKey] = [
                { id: 'p1', name: 'Sivu 1', courts: [{ id: 'c1', title: 'Kenttä 1' }] }
            ];
        }
        return lineupPages[activeLineupKey];
    }

    function getCurrentPage() {
        const pages = getPagesForActiveLineup();
        let page = pages.find(p => p.id === activePageId);
        if (!page) {
            page = pages[0] || { id: 'p1', name: 'Sivu 1', courts: [{ id: 'c1', title: 'Kenttä 1' }] };
            activePageId = page.id;
        }
        if (!page.courts || !Array.isArray(page.courts) || page.courts.length === 0) {
            page.courts = [{ id: 'c1', title: 'Kenttä 1' }];
        }
        return page;
    }

    function renderTacticalPageBadges() {
        if (!pagesScrollContainer) return;
        pagesScrollContainer.innerHTML = '';

        if (activeLineupKey === 'summary') return;

        const pages = getPagesForActiveLineup();

        if (!pages.some(p => p.id === activePageId)) {
            activePageId = pages[0] ? pages[0].id : 'p1';
        }

        pages.forEach((page, index) => {
            const isCurrent = page.id === activePageId;
            const badge = document.createElement('button');
            badge.className = `page-badge-btn ${isCurrent ? 'active' : ''}`;
            
            badge.innerHTML = `
                <span>📄 ${escapeHtml(page.name || ('Sivu ' + (index + 1)))}</span>
                <span class="page-rename-icon" title="Uudelleennimeä taktiikkasivu" data-action="rename-page" data-page-id="${page.id}">✏️</span>
            `;
            
            badge.addEventListener('click', (e) => {
                if (e.target.classList.contains('page-rename-icon')) return;
                activePageId = page.id;
                renderTacticalPageBadges();
                renderCourtBoards();
            });

            pagesScrollContainer.appendChild(badge);
        });

        if (btnDeleteTacticPage) {
            btnDeleteTacticPage.style.display = pages.length > 1 ? 'inline-block' : 'none';
        }
    }

    function renameTacticalPage(pageId) {
        const pages = getPagesForActiveLineup();
        const page = pages.find(p => p.id === pageId);
        if (!page) return;

        const newName = prompt('Syötä taktiikkasivun uusi nimi (esim. YV 5v4 Timantti):', page.name || '');
        if (newName !== null && newName.trim() !== '') {
            page.name = newName.trim();
            saveState();
            renderTacticalPageBadges();
            showToast(`Taktiikkasivu nimettiin uudelleen: '${page.name}' ✏️`);
        }
    }

    function addTacticalPage() {
        const pages = getPagesForActiveLineup();
        const nextNum = pages.length + 1;
        const newPageId = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        pages.push({
            id: newPageId,
            name: `Sivu ${nextNum}`,
            courts: [{ id: 'c1', title: 'Kenttä 1' }]
        });

        activePageId = newPageId;
        saveState();
        renderTacticalPageBadges();
        renderCourtBoards();
        showToast(`Uusi taktiikkasivu 'Sivu ${nextNum}' luotu! 📄`);
    }

    function deleteTacticalPage() {
        const pages = getPagesForActiveLineup();
        if (pages.length <= 1) {
            showToast('Et voi poistaa ainoaa taktiikkasivua.');
            return;
        }

        const curPage = pages.find(p => p.id === activePageId);
        const pName = curPage ? curPage.name : 'sivu';

        if (confirm(`Haluatko varmasti poistaa taktiikkasivun '${pName}'?`)) {
            lineupPages[activeLineupKey] = pages.filter(p => p.id !== activePageId);
            activePageId = lineupPages[activeLineupKey][0].id;

            saveState();
            renderTacticalPageBadges();
            renderCourtBoards();
            showToast(`Taktiikkasivu '${pName}' poistettu.`);
        }
    }

    // ==========================================
    // VERTICALLY STACKED COURTS ENGINE (`renderCourtBoards`)
    // ==========================================
    function addCourtToActivePage() {
        const page = getCurrentPage();
        const nextNum = page.courts.length + 1;
        const newCourtId = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        page.courts.push({
            id: newCourtId,
            title: `Kenttä ${nextNum}`
        });

        saveState();
        renderCourtBoards();
        showToast(`Uusi piirtoalusta / kenttä lisätty alapuolelle! 🏒`);
    }

    function deleteCourtFromActivePage(courtId) {
        const page = getCurrentPage();
        if (page.courts.length <= 1) {
            showToast('Et voi poistaa ainoaa piirtoalustaa sivulta.');
            return;
        }

        const courtObj = page.courts.find(c => c.id === courtId);
        const cTitle = courtObj ? courtObj.title : 'kenttä';

        if (confirm(`Poistetaanko piirtoalusta '${cTitle}'?`)) {
            const courtKey = getCourtKey(courtId);
            delete lineupDrawings[courtKey];
            delete lineupBalls[courtKey];
            delete lineupCones[courtKey];
            delete lineupOpponents[courtKey];
            delete lineupCourtPositions[courtKey];

            page.courts = page.courts.filter(c => c.id !== courtId);

            saveState();
            renderCourtBoards();
            showToast(`Piirtoalusta '${cTitle}' poistettu.`);
        }
    }

    function renameCourtBoard(courtId) {
        const page = getCurrentPage();
        const courtObj = page.courts.find(c => c.id === courtId);
        if (!courtObj) return;

        const newTitle = prompt('Syötä kentän / vaiheen otsikko (esim. Vaihe 1: Avaus):', courtObj.title || '');
        if (newTitle !== null && newTitle.trim() !== '') {
            courtObj.title = newTitle.trim();
            saveState();
            renderCourtBoards();
            showToast(`Kentän otsikko päivitetty: '${courtObj.title}' ✏️`);
        }
    }

    function renderCourtBoards() {
        if (!courtsVerticalList) return;
        courtsVerticalList.innerHTML = '';

        if (activeLineupKey === 'summary') return;

        const page = getCurrentPage();
        const courts = page.courts;

        courts.forEach((court, idx) => {
            const courtId = court.id;
            const courtKey = getCourtKey(courtId);
            const activeTool = courtDrawingTools[courtId] || 'select';

            const card = document.createElement('div');
            card.className = 'court-board-card';
            card.dataset.courtId = courtId;

            card.innerHTML = `
                <div class="court-board-header">
                    <div class="court-board-title">
                        <span>🏒 ${courts.length > 1 ? '#' + (idx + 1) + ' ' : ''}${escapeHtml(court.title || ('Kenttä ' + (idx + 1)))}</span>
                        <button class="btn-xs btn-outline" data-action="rename-court" data-court-id="${courtId}">✏️ Nimeä</button>
                    </div>
                    <div class="court-header-actions">
                        <button class="btn-xs btn-outline" data-action="clear-court-drawings" data-court-id="${courtId}">🧹 Tyhjennä</button>
                        ${courts.length > 1 ? `<button class="btn-xs btn-outline danger-text" data-action="delete-court" data-court-id="${courtId}">🗑️ Poista kenttä</button>` : ''}
                    </div>
                </div>

                <div class="pitch-toolbar">
                    <div class="toolbar-group">
                        <button class="tool-btn ${activeTool === 'select' ? 'active' : ''}" data-tool="select" data-court-id="${courtId}" title="Liikuta sormella/hiirellä">
                            👆 Liikuta
                        </button>
                        <button class="tool-btn tool-pass ${activeTool === 'pass' ? 'active' : ''}" data-tool="pass" data-court-id="${courtId}" title="Piirrä suora syöttöviiva">
                            ↗️ Syöttö
                        </button>
                        <button class="tool-btn tool-run ${activeTool === 'run' ? 'active' : ''}" data-tool="run" data-court-id="${courtId}" title="Piirrä vapaa juoksuviiva">
                            🏃 Juoksu
                        </button>
                        <button class="tool-btn tool-shot ${activeTool === 'shot' ? 'active' : ''}" data-tool="shot" data-court-id="${courtId}" title="Piirrä laukaus maalia kohti">
                            💥 Veto
                        </button>
                        <button class="tool-btn tool-rect ${activeTool === 'rect' ? 'active' : ''}" data-tool="rect" data-court-id="${courtId}" title="Piirrä taktinen alue">
                            🔲 Alue
                        </button>
                    </div>

                    <div class="toolbar-group">
                        <button class="tool-btn highlight-ball" data-action="add-ball" data-court-id="${courtId}" title="Lisää pallo kentälle">
                            <img src="ball.png?v=18.0" width="18" height="18" alt="Pallo" style="vertical-align: middle; display: inline-block;"> + Pallo
                        </button>
                        <button class="tool-btn highlight-cone" data-action="add-cone" data-court-id="${courtId}" title="Lisää harjoitustötterö kentälle">
                            🔶 + Tötterö
                        </button>
                        <button class="tool-btn highlight-opponent" data-action="add-opponent" data-court-id="${courtId}" title="Lisää vastustaja kentälle">
                            🔴 + Vastustaja
                        </button>
                        <button class="tool-btn" data-action="undo-drawing" data-court-id="${courtId}" title="Kumoa piirros">
                            ↩️ Kumoa
                        </button>
                        <button class="tool-btn highlight-orient" data-action="toggle-orientation" data-court-id="${courtId}" title="Vaihda kentän asentoa">
                            🔄 Asento
                        </button>
                    </div>
                </div>

                <div class="pitch-outer-wrapper">
                    <div class="pitch-container ${orientationMode === 'vertical' ? 'mode-vertical' : 'mode-horizontal'}" id="floorball-court-${courtId}">
                        <div class="court-surface"></div>
                        <div class="court-center-line"></div>
                        <div class="center-spot-pink"></div>
                        <div class="center-line-tick tick-left"></div>
                        <div class="center-line-tick tick-right"></div>

                        <div class="goal-area-container goal-1">
                            <div class="goal-outer-box"></div>
                            <div class="goal-inner-crease"></div>
                            <div class="goal-net-frame"></div>
                        </div>
                        <div class="goal-area-container goal-2">
                            <div class="goal-outer-box"></div>
                            <div class="goal-inner-crease"></div>
                            <div class="goal-net-frame"></div>
                        </div>

                        <div class="faceoff-dot dot-tl"></div>
                        <div class="faceoff-dot dot-tr"></div>
                        <div class="faceoff-dot dot-bl"></div>
                        <div class="faceoff-dot dot-br"></div>

                        <canvas id="tactic-canvas-${courtId}"></canvas>
                        <div id="court-players-layer-${courtId}"></div>
                    </div>
                </div>
            `;

            courtsVerticalList.appendChild(card);

            setTimeout(() => {
                initCourtBoardInstance(courtId);
            }, 30);
        });
    }

    function initCourtBoardInstance(courtId) {
        const courtKey = getCourtKey(courtId);
        const courtContainer = document.getElementById(`floorball-court-${courtId}`);
        const canvasEl = document.getElementById(`tactic-canvas-${courtId}`);
        const layersEl = document.getElementById(`court-players-layer-${courtId}`);

        if (!courtContainer || !canvasEl || !layersEl) return;

        const ctxEl = canvasEl.getContext('2d');
        let courtRect = courtContainer.getBoundingClientRect();

        if (courtRect.width === 0 || courtRect.height === 0) {
            setTimeout(() => initCourtBoardInstance(courtId), 60);
            return;
        }

        canvasEl.width = courtRect.width;
        canvasEl.height = courtRect.height;

        renderCourtNodesForInstance(courtId, layersEl);
        drawCanvasLinesForInstance(courtId, canvasEl, ctxEl);

        setupCourtCanvasDrawing(courtId, courtContainer, canvasEl, ctxEl);
    }

    function renderCourtNodesForInstance(courtId, layersEl) {
        layersEl.innerHTML = '';
        const courtKey = getCourtKey(courtId);

        renderLineupPlayerNodesForInstance(courtId, layersEl);
        renderCourtBallsForInstance(courtId, layersEl);
        renderCourtConesForInstance(courtId, layersEl);
        renderCourtOpponentsForInstance(courtId, layersEl);
        renderCourtRectanglesForInstance(courtId, layersEl);
        renderCourtLineNodesForInstance(courtId, layersEl);
    }

    function renderLineupPlayerNodesForInstance(courtId, layersEl) {
        const currentLineup = lineups[activeLineupKey] || {};
        const posKeys = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];
        const courtKey = getCourtKey(courtId);

        posKeys.forEach(pos => {
            const playerId = currentLineup[pos];
            if (!playerId) return;

            const player = roster.find(p => p.id === playerId);
            if (!player) return;

            let defaultCoords = DEFAULT_POS_COORDS[orientationMode][pos] || { x: 50, y: 50 };
            let posKeyStore = `${courtKey}_${pos}_${orientationMode}`;
            let fallbackKeyStore = `${activeLineupKey}_${pos}_${orientationMode}`;
            let coords = lineupCourtPositions[posKeyStore] || lineupCourtPositions[fallbackKeyStore] || defaultCoords;

            const isMv = player.position === 'MV';
            const node = document.createElement('div');
            node.className = `court-player-node ${isMv ? 'is-mv' : 'is-field'} ${activeSelectedElementId === posKeyStore ? 'is-selected' : ''}`;
            node.style.left = coords.x + '%';
            node.style.top = coords.y + '%';

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

            setupNodeTouchDragging(node, coords, posKeyStore, courtId);
            layersEl.appendChild(node);
        });
    }

    function renderCourtBallsForInstance(courtId, layersEl) {
        const courtKey = getCourtKey(courtId);
        const balls = lineupBalls[courtKey] || lineupBalls[activeLineupKey] || [];
        balls.forEach(ball => {
            const isSelected = activeSelectedElementId === ball.id;
            const ballNode = document.createElement('div');
            ballNode.className = `court-ball-node ${isSelected ? 'is-selected' : ''}`;
            ballNode.style.left = ball.x + '%';
            ballNode.style.top = ball.y + '%';

            ballNode.innerHTML = `
                <div class="ball-circle" title="Salibandypallo">
                    <img src="ball.png?v=18.0" class="floorball-png-icon" alt="Pallo">
                    <button class="ball-remove-btn" data-action="remove-ball" data-ball-id="${ball.id}" data-court-id="${courtId}">✕</button>
                </div>
            `;

            setupBallTouchDragging(ballNode, ball, courtId);
            layersEl.appendChild(ballNode);
        });
    }

    function renderCourtConesForInstance(courtId, layersEl) {
        const courtKey = getCourtKey(courtId);
        const cones = lineupCones[courtKey] || lineupCones[activeLineupKey] || [];
        cones.forEach(cone => {
            const isSelected = activeSelectedElementId === cone.id;
            const coneNode = document.createElement('div');
            coneNode.className = `court-cone-node ${isSelected ? 'is-selected' : ''}`;
            coneNode.style.left = cone.x + '%';
            coneNode.style.top = cone.y + '%';

            coneNode.innerHTML = `
                <div class="cone-circle" title="Harjoitustötterö / Kartio">
                    <span style="font-size: 0.95rem; line-height: 1;">🔶</span>
                    <button class="cone-remove-btn" data-action="remove-cone" data-cone-id="${cone.id}" data-court-id="${courtId}">✕</button>
                </div>
            `;

            setupConeTouchDragging(coneNode, cone, courtId);
            layersEl.appendChild(coneNode);
        });
    }

    function renderCourtOpponentsForInstance(courtId, layersEl) {
        const courtKey = getCourtKey(courtId);
        const opponents = lineupOpponents[courtKey] || lineupOpponents[activeLineupKey] || [];
        opponents.forEach(opp => {
            const isSelected = activeSelectedElementId === opp.id;
            const oppNode = document.createElement('div');
            oppNode.className = `court-opponent-node ${isSelected ? 'is-selected' : ''}`;
            oppNode.style.left = opp.x + '%';
            oppNode.style.top = opp.y + '%';

            oppNode.innerHTML = `
                <div class="opponent-circle" title="Vastustajan pelaaja">
                    ${escapeHtml(opp.label || 'V')}
                    <button class="opponent-remove-btn" data-action="remove-opponent" data-opp-id="${opp.id}" data-court-id="${courtId}">✕</button>
                </div>
            `;

            setupOpponentTouchDragging(oppNode, opp, courtId);
            layersEl.appendChild(oppNode);
        });
    }

    function renderCourtRectanglesForInstance(courtId, layersEl) {
        const courtKey = getCourtKey(courtId);
        const drawings = lineupDrawings[courtKey] || lineupDrawings[activeLineupKey] || [];
        const rects = drawings.filter(d => d.type === 'rect');

        rects.forEach(rectObj => {
            const isSelected = activeSelectedElementId === rectObj.id;
            const rectNode = document.createElement('div');
            rectNode.className = `court-rect-node ${isSelected ? 'is-selected' : ''}`;
            rectNode.style.left = rectObj.x + '%';
            rectNode.style.top = rectObj.y + '%';
            rectNode.style.width = rectObj.w + '%';
            rectNode.style.height = rectObj.h + '%';

            rectNode.innerHTML = `
                <div class="rect-border-box" title="Siirrettävä taktinen alue">
                    <button class="rect-remove-btn" data-action="remove-rect" data-rect-id="${rectObj.id}" data-court-id="${courtId}">✕</button>
                </div>
            `;

            setupRectTouchDragging(rectNode, rectObj, courtId);
            layersEl.appendChild(rectNode);
        });
    }

    function renderCourtLineNodesForInstance(courtId, layersEl) {
        const courtKey = getCourtKey(courtId);
        const drawings = lineupDrawings[courtKey] || lineupDrawings[activeLineupKey] || [];
        const lineDrawings = drawings.filter(d => d.type === 'pass' || d.type === 'shot' || d.type === 'run');

        lineDrawings.forEach(lineObj => {
            const pts = lineObj.pointsPct;
            if (!pts || pts.length < 2) return;

            const startPct = pts[0];
            const endPct = pts[pts.length - 1];
            const midPct = {
                x: (startPct.x + endPct.x) / 2,
                y: (startPct.y + endPct.y) / 2
            };

            let icon = '↗️';
            let handleClass = 'pass-handle';
            if (lineObj.type === 'shot') { icon = '💥'; handleClass = 'shot-handle'; }
            if (lineObj.type === 'run') { icon = '🏃'; handleClass = 'run-handle'; }

            const isSelected = activeSelectedElementId === lineObj.id;

            const lineNode = document.createElement('div');
            lineNode.className = `court-line-node ${isSelected ? 'is-selected' : ''}`;
            lineNode.style.left = midPct.x + '%';
            lineNode.style.top = midPct.y + '%';

            lineNode.innerHTML = `
                <div class="line-mid-handle ${handleClass}" title="Siirrä koko viivaa sormella/hiirellä">
                    <span style="font-size: 0.72rem; line-height: 1;">${icon}</span>
                    <button class="line-remove-btn" data-action="remove-line" data-line-id="${lineObj.id}" data-court-id="${courtId}">✕</button>
                </div>
            `;

            setupLineMidpointDragging(lineNode, lineObj, courtId);
            layersEl.appendChild(lineNode);

            if (lineObj.type === 'pass' || lineObj.type === 'shot') {
                const endpointNode = document.createElement('div');
                endpointNode.className = `line-endpoint-handle ${lineObj.type === 'shot' ? 'shot-endpoint' : 'pass-endpoint'} ${isSelected ? 'is-selected' : ''}`;
                endpointNode.style.left = endPct.x + '%';
                endpointNode.style.top = endPct.y + '%';
                endpointNode.title = 'Käännä tai säädä suuntaa sormella/hiirellä';

                setupLineEndpointDragging(endpointNode, lineObj, courtId);
                layersEl.appendChild(endpointNode);
            }
        });
    }

    function addBallToCourt(courtId) {
        const courtKey = getCourtKey(courtId);
        if (!lineupBalls || typeof lineupBalls !== 'object') lineupBalls = {};
        if (!lineupBalls[courtKey] || !Array.isArray(lineupBalls[courtKey])) {
            lineupBalls[courtKey] = [];
        }

        lineupBalls[courtKey].push({
            id: 'ball_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            x: 55,
            y: 50
        });

        setCourtDrawingTool(courtId, 'select');
        saveState();
        renderCourtBoards();
        showToast('Salibandypallo lisätty kentälle! ⚪');
    }

    function addConeToCourt(courtId) {
        const courtKey = getCourtKey(courtId);
        if (!lineupCones || typeof lineupCones !== 'object') lineupCones = {};
        if (!lineupCones[courtKey] || !Array.isArray(lineupCones[courtKey])) {
            lineupCones[courtKey] = [];
        }

        lineupCones[courtKey].push({
            id: 'cone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            x: 45,
            y: 50
        });

        setCourtDrawingTool(courtId, 'select');
        saveState();
        renderCourtBoards();
        showToast('Harjoitustötterö lisätty kentälle! 🔶');
    }

    function addOpponentToCourt(courtId) {
        const courtKey = getCourtKey(courtId);
        if (!lineupOpponents || typeof lineupOpponents !== 'object') lineupOpponents = {};
        if (!lineupOpponents[courtKey] || !Array.isArray(lineupOpponents[courtKey])) {
            lineupOpponents[courtKey] = [];
        }

        const count = lineupOpponents[courtKey].length + 1;
        lineupOpponents[courtKey].push({
            id: 'opp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            label: `V${count}`,
            x: 50,
            y: 35
        });

        setCourtDrawingTool(courtId, 'select');
        saveState();
        renderCourtBoards();
        showToast('Vastustaja lisätty kentälle! 🔴');
    }

    function setCourtDrawingTool(courtId, tool) {
        courtDrawingTools[courtId] = tool;
        const courtCard = document.querySelector(`.court-board-card[data-court-id="${courtId}"]`);
        if (!courtCard) return;

        courtCard.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = courtCard.querySelector(`.tool-btn[data-tool="${tool}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        const canvasEl = document.getElementById(`tactic-canvas-${courtId}`);
        const courtContainer = document.getElementById(`floorball-court-${courtId}`);
        if (canvasEl && courtContainer) {
            if (tool === 'select') {
                canvasEl.style.pointerEvents = 'none';
                canvasEl.style.touchAction = 'auto';
                courtContainer.classList.remove('drawing-active');
            } else {
                canvasEl.style.pointerEvents = 'auto';
                canvasEl.style.touchAction = 'none';
                courtContainer.classList.add('drawing-active');
            }
        }
    }

    function selectCourtElement(elementId, elementNode = null) {
        activeSelectedElementId = elementId;
        document.querySelectorAll('.court-player-node, .court-ball-node, .court-cone-node, .court-opponent-node, .court-rect-node, .court-line-node, .line-endpoint-handle')
            .forEach(el => el.classList.remove('is-selected'));

        if (elementNode) {
            elementNode.classList.add('is-selected');
        }
    }

    function setupCourtCanvasDrawing(courtId, courtContainer, canvasEl, ctxEl) {
        canvasEl.addEventListener('pointerdown', (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool === 'select') return;

            courtIsDrawingMap[courtId] = true;
            e.preventDefault();
            canvasEl.setPointerCapture(e.pointerId);

            const courtRect = courtContainer.getBoundingClientRect();
            const ptPct = {
                x: Math.max(0, Math.min(100, ((e.clientX - courtRect.left) / courtRect.width) * 100)),
                y: Math.max(0, Math.min(100, ((e.clientY - courtRect.top) / courtRect.height) * 100))
            };

            if (tool === 'pass' || tool === 'shot' || tool === 'rect') {
                courtPathPctMap[courtId] = [ptPct, ptPct];
            } else {
                courtPathPctMap[courtId] = [ptPct];
            }
        });

        canvasEl.addEventListener('pointermove', (e) => {
            if (!courtIsDrawingMap[courtId]) return;
            e.preventDefault();

            const tool = courtDrawingTools[courtId] || 'select';
            const courtRect = courtContainer.getBoundingClientRect();
            const ptPct = {
                x: Math.max(0, Math.min(100, ((e.clientX - courtRect.left) / courtRect.width) * 100)),
                y: Math.max(0, Math.min(100, ((e.clientY - courtRect.top) / courtRect.height) * 100))
            };

            let pathPct = courtPathPctMap[courtId] || [];
            if (tool === 'pass' || tool === 'shot' || tool === 'rect') {
                pathPct = [pathPct[0], ptPct];
            } else {
                pathPct.push(ptPct);
            }
            courtPathPctMap[courtId] = pathPct;

            drawCanvasLinesForInstance(courtId, canvasEl, ctxEl);
            drawPreviewPathForInstance(ctxEl, canvasEl, pathPct, tool);
        });

        canvasEl.addEventListener('pointerup', () => {
            if (!courtIsDrawingMap[courtId]) return;
            courtIsDrawingMap[courtId] = false;

            const tool = courtDrawingTools[courtId] || 'select';
            const courtKey = getCourtKey(courtId);
            const pathPct = courtPathPctMap[courtId] || [];

            if (pathPct.length >= 2 || (tool === 'run' && pathPct.length > 1)) {
                if (!lineupDrawings[courtKey]) lineupDrawings[courtKey] = [];

                if (tool === 'rect') {
                    const p1 = pathPct[0];
                    const p2 = pathPct[pathPct.length - 1];

                    const xPct = Math.min(p1.x, p2.x);
                    const yPct = Math.min(p1.y, p2.y);
                    const wPct = Math.abs(p2.x - p1.x);
                    const hPct = Math.abs(p2.y - p1.y);

                    lineupDrawings[courtKey].push({
                        id: 'rect_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        type: 'rect',
                        x: Math.round(xPct * 10) / 10,
                        y: Math.round(yPct * 10) / 10,
                        w: Math.max(4, Math.round(wPct * 10) / 10),
                        h: Math.max(4, Math.round(hPct * 10) / 10)
                    });

                    setCourtDrawingTool(courtId, 'select');
                    saveState();
                    renderCourtBoards();
                    showToast('Taktinen alue luotu! Voit siirtää sitä sormella/hiirellä 🔲');
                } else {
                    let color = '#38bdf8';
                    if (tool === 'pass') color = '#eab308';
                    if (tool === 'shot') color = '#ec4899';

                    lineupDrawings[courtKey].push({
                        id: 'draw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        type: tool,
                        pointsPct: [...pathPct],
                        color: color
                    });

                    setCourtDrawingTool(courtId, 'select');
                    saveState();
                    renderCourtBoards();
                    showToast(`${tool === 'pass' ? 'Syöttöviiva' : (tool === 'shot' ? 'Vetoviiva' : 'Juoksuviiva')} piirretty! Voit siirtää sitä 👆`);
                }
            }
            courtPathPctMap[courtId] = [];
            drawCanvasLinesForInstance(courtId, canvasEl, ctxEl);
        });

        canvasEl.addEventListener('pointercancel', () => {
            courtIsDrawingMap[courtId] = false;
            courtPathPctMap[courtId] = [];
            drawCanvasLinesForInstance(courtId, canvasEl, ctxEl);
        });
    }

    function drawCanvasLinesForInstance(courtId, canvasEl, ctxEl) {
        ctxEl.clearRect(0, 0, canvasEl.width, canvasEl.height);
        const courtKey = getCourtKey(courtId);
        const currentDrawings = lineupDrawings[courtKey] || lineupDrawings[activeLineupKey] || [];
        currentDrawings.forEach(draw => {
            if (draw.type !== 'rect') {
                renderPathOnCtx(ctxEl, canvasEl, draw, draw.type, draw.color);
            }
        });
    }

    function drawPreviewPathForInstance(ctxEl, canvasEl, pointsPct, tool) {
        let color = '#38bdf8';
        if (tool === 'pass') color = '#eab308';
        if (tool === 'shot') color = '#ec4899';
        if (tool === 'rect') color = '#60a5fa';
        renderPathOnCtx(ctxEl, canvasEl, { pointsPct: pointsPct }, tool, color);
    }

    function renderPathOnCtx(ctxEl, canvasEl, drawObj, type, color) {
        const ptsPct = drawObj.pointsPct;
        if (!ptsPct || ptsPct.length < 2) return;

        const canvasW = canvasEl.width;
        const canvasH = canvasEl.height;

        const points = ptsPct.map(p => ({
            x: (p.x / 100) * canvasW,
            y: (p.y / 100) * canvasH
        }));

        if (type === 'rect') {
            const start = points[0];
            const end = points[points.length - 1];
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const w = Math.abs(end.x - start.x);
            const h = Math.abs(end.y - start.y);

            ctxEl.save();
            ctxEl.fillStyle = 'rgba(59, 130, 246, 0.22)';
            ctxEl.strokeStyle = '#60a5fa';
            ctxEl.lineWidth = 2;
            ctxEl.setLineDash([6, 4]);
            ctxEl.fillRect(x, y, w, h);
            ctxEl.strokeRect(x, y, w, h);
            ctxEl.restore();
            return;
        }

        if (type === 'pass') {
            const start = points[0];
            const end = points[points.length - 1];
            ctxEl.save();
            ctxEl.strokeStyle = color || '#eab308';
            ctxEl.lineWidth = 3.5;
            ctxEl.lineCap = 'round';
            ctxEl.setLineDash([8, 6]);

            ctxEl.beginPath();
            ctxEl.moveTo(start.x, start.y);
            ctxEl.lineTo(end.x, end.y);
            ctxEl.stroke();

            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            ctxEl.setLineDash([]);
            ctxEl.fillStyle = color || '#eab308';
            ctxEl.beginPath();
            ctxEl.moveTo(end.x, end.y);
            ctxEl.lineTo(end.x - 16 * Math.cos(angle - Math.PI / 5), end.y - 16 * Math.sin(angle - Math.PI / 5));
            ctxEl.lineTo(end.x - 16 * Math.cos(angle + Math.PI / 5), end.y - 16 * Math.sin(angle + Math.PI / 5));
            ctxEl.closePath();
            ctxEl.fill();
            ctxEl.restore();
            return;
        }

        if (type === 'shot') {
            const start = points[0];
            const end = points[points.length - 1];
            ctxEl.save();
            ctxEl.strokeStyle = color || '#ec4899';
            ctxEl.lineWidth = 4.5;
            ctxEl.lineCap = 'round';
            ctxEl.setLineDash([10, 4]);

            ctxEl.beginPath();
            ctxEl.moveTo(start.x, start.y);
            ctxEl.lineTo(end.x, end.y);
            ctxEl.stroke();

            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            ctxEl.setLineDash([]);
            ctxEl.fillStyle = color || '#ec4899';
            ctxEl.beginPath();
            ctxEl.moveTo(end.x, end.y);
            ctxEl.lineTo(end.x - 16 * Math.cos(angle - Math.PI / 5), end.y - 16 * Math.sin(angle - Math.PI / 5));
            ctxEl.lineTo(end.x - 16 * Math.cos(angle + Math.PI / 5), end.y - 16 * Math.sin(angle + Math.PI / 5));
            ctxEl.closePath();
            ctxEl.fill();

            ctxEl.strokeStyle = '#ffffff';
            ctxEl.lineWidth = 2;
            ctxEl.beginPath();
            ctxEl.arc(end.x, end.y, 7, 0, 2 * Math.PI);
            ctxEl.stroke();
            ctxEl.restore();
            return;
        }

        ctxEl.save();
        ctxEl.strokeStyle = color || '#38bdf8';
        ctxEl.lineWidth = 3.5;
        ctxEl.lineCap = 'round';
        ctxEl.lineJoin = 'round';
        ctxEl.setLineDash([]);

        ctxEl.beginPath();
        ctxEl.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctxEl.lineTo(points[i].x, points[i].y);
        }
        ctxEl.stroke();

        const end = points[points.length - 1];
        const prev = points[Math.max(0, points.length - 4)];
        const angle = Math.atan2(end.y - prev.y, end.x - prev.x);

        ctxEl.fillStyle = color || '#38bdf8';
        ctxEl.beginPath();
        ctxEl.moveTo(end.x, end.y);
        ctxEl.lineTo(end.x - 16 * Math.cos(angle - Math.PI / 5), end.y - 16 * Math.sin(angle - Math.PI / 5));
        ctxEl.lineTo(end.x - 16 * Math.cos(angle + Math.PI / 5), end.y - 16 * Math.sin(angle + Math.PI / 5));
        ctxEl.closePath();
        ctxEl.fill();

        ctxEl.restore();
    }

    function setupLineMidpointDragging(lineNode, lineObj, courtId) {
        let isDragging = false;
        let startPointer = { x: 0, y: 0 };
        let initialPts = [];
        let rafId = null;

        const onPointerDown = (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool !== 'select') return;
            selectCourtElement(lineObj.id, lineNode);
            if (e.target.classList.contains('line-remove-btn')) return;

            isDragging = true;
            startPointer = { x: e.clientX, y: e.clientY };
            initialPts = JSON.parse(JSON.stringify(lineObj.pointsPct));
            lineNode.setPointerCapture(e.pointerId);

            lineNode.addEventListener('pointermove', onPointerMove);
            lineNode.addEventListener('pointerup', onPointerUp);
            lineNode.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const courtContainer = document.getElementById(`floorball-court-${courtId}`);
            if (!courtContainer) return;

            const courtRect = courtContainer.getBoundingClientRect();
            const deltaPctX = ((e.clientX - startPointer.x) / courtRect.width) * 100;
            const deltaPctY = ((e.clientY - startPointer.y) / courtRect.height) * 100;

            for (let i = 0; i < lineObj.pointsPct.length; i++) {
                let nX = initialPts[i].x + deltaPctX;
                let nY = initialPts[i].y + deltaPctY;
                lineObj.pointsPct[i].x = Math.round(nX * 10) / 10;
                lineObj.pointsPct[i].y = Math.round(nY * 10) / 10;
            }

            const startPct = lineObj.pointsPct[0];
            const endPct = lineObj.pointsPct[lineObj.pointsPct.length - 1];
            const midX = (startPct.x + endPct.x) / 2;
            const midY = (startPct.y + endPct.y) / 2;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                lineNode.style.left = midX + '%';
                lineNode.style.top = midY + '%';
                const canvasEl = document.getElementById(`tactic-canvas-${courtId}`);
                if (canvasEl) drawCanvasLinesForInstance(courtId, canvasEl, canvasEl.getContext('2d'));
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            lineNode.removeEventListener('pointermove', onPointerMove);
            lineNode.removeEventListener('pointerup', onPointerUp);
            lineNode.removeEventListener('pointercancel', onPointerUp);
            saveState();
            renderCourtBoards();
        };

        lineNode.addEventListener('pointerdown', onPointerDown);
    }

    function setupLineEndpointDragging(endpointNode, lineObj, courtId) {
        let isDragging = false;
        let rafId = null;

        const onPointerDown = (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool !== 'select') return;
            selectCourtElement(lineObj.id, endpointNode);

            isDragging = true;
            endpointNode.setPointerCapture(e.pointerId);

            endpointNode.addEventListener('pointermove', onPointerMove);
            endpointNode.addEventListener('pointerup', onPointerUp);
            endpointNode.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const courtContainer = document.getElementById(`floorball-court-${courtId}`);
            if (!courtContainer) return;

            const courtRect = courtContainer.getBoundingClientRect();
            let newX = ((e.clientX - courtRect.left) / courtRect.width) * 100;
            let newY = ((e.clientY - courtRect.top) / courtRect.height) * 100;

            newX = Math.max(1, Math.min(99, newX));
            newY = Math.max(1, Math.min(99, newY));

            lineObj.pointsPct[1] = {
                x: Math.round(newX * 10) / 10,
                y: Math.round(newY * 10) / 10
            };

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                endpointNode.style.left = lineObj.pointsPct[1].x + '%';
                endpointNode.style.top = lineObj.pointsPct[1].y + '%';
                const canvasEl = document.getElementById(`tactic-canvas-${courtId}`);
                if (canvasEl) drawCanvasLinesForInstance(courtId, canvasEl, canvasEl.getContext('2d'));
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            endpointNode.removeEventListener('pointermove', onPointerMove);
            endpointNode.removeEventListener('pointerup', onPointerUp);
            endpointNode.removeEventListener('pointercancel', onPointerUp);
            saveState();
            renderCourtBoards();
        };

        endpointNode.addEventListener('pointerdown', onPointerDown);
    }

    function setupConeTouchDragging(coneNode, coneObj, courtId) {
        let isDragging = false;
        let rafId = null;

        const onPointerDown = (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool !== 'select') return;
            selectCourtElement(coneObj.id, coneNode);
            if (e.target.classList.contains('cone-remove-btn')) return;
            
            isDragging = true;
            coneNode.setPointerCapture(e.pointerId);

            coneNode.addEventListener('pointermove', onPointerMove);
            coneNode.addEventListener('pointerup', onPointerUp);
            coneNode.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const courtContainer = document.getElementById(`floorball-court-${courtId}`);
            if (!courtContainer) return;

            const rect = courtContainer.getBoundingClientRect();
            let newX = ((e.clientX - rect.left) / rect.width) * 100;
            let newY = ((e.clientY - rect.top) / rect.height) * 100;

            newX = Math.max(3, Math.min(97, newX));
            newY = Math.max(3, Math.min(97, newY));

            coneObj.x = Math.round(newX * 10) / 10;
            coneObj.y = Math.round(newY * 10) / 10;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                coneNode.style.left = coneObj.x + '%';
                coneNode.style.top = coneObj.y + '%';
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            coneNode.removeEventListener('pointermove', onPointerMove);
            coneNode.removeEventListener('pointerup', onPointerUp);
            coneNode.removeEventListener('pointercancel', onPointerUp);
            saveState();
        };

        coneNode.addEventListener('pointerdown', onPointerDown);
    }

    function setupOpponentTouchDragging(oppNode, oppObj, courtId) {
        let isDragging = false;
        let rafId = null;

        const onPointerDown = (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool !== 'select') return;
            selectCourtElement(oppObj.id, oppNode);
            if (e.target.classList.contains('opponent-remove-btn')) return;
            
            isDragging = true;
            oppNode.setPointerCapture(e.pointerId);

            oppNode.addEventListener('pointermove', onPointerMove);
            oppNode.addEventListener('pointerup', onPointerUp);
            oppNode.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const courtContainer = document.getElementById(`floorball-court-${courtId}`);
            if (!courtContainer) return;

            const rect = courtContainer.getBoundingClientRect();
            let newX = ((e.clientX - rect.left) / rect.width) * 100;
            let newY = ((e.clientY - rect.top) / rect.height) * 100;

            newX = Math.max(3, Math.min(97, newX));
            newY = Math.max(3, Math.min(97, newY));

            oppObj.x = Math.round(newX * 10) / 10;
            oppObj.y = Math.round(newY * 10) / 10;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                oppNode.style.left = oppObj.x + '%';
                oppNode.style.top = oppObj.y + '%';
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            oppNode.removeEventListener('pointermove', onPointerMove);
            oppNode.removeEventListener('pointerup', onPointerUp);
            oppNode.removeEventListener('pointercancel', onPointerUp);
            saveState();
        };

        oppNode.addEventListener('pointerdown', onPointerDown);
    }

    function setupRectTouchDragging(rectNode, rectObj, courtId) {
        let isDragging = false;
        let startPointer = { x: 0, y: 0 };
        let startRectPos = { x: rectObj.x, y: rectObj.y };
        let rafId = null;

        const onPointerDown = (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool !== 'select') return;
            selectCourtElement(rectObj.id, rectNode);
            if (e.target.classList.contains('rect-remove-btn')) return;

            isDragging = true;
            startPointer = { x: e.clientX, y: e.clientY };
            startRectPos = { x: rectObj.x, y: rectObj.y };
            rectNode.setPointerCapture(e.pointerId);

            rectNode.addEventListener('pointermove', onPointerMove);
            rectNode.addEventListener('pointerup', onPointerUp);
            rectNode.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const courtContainer = document.getElementById(`floorball-court-${courtId}`);
            if (!courtContainer) return;

            const courtRect = courtContainer.getBoundingClientRect();
            const deltaPctX = ((e.clientX - startPointer.x) / courtRect.width) * 100;
            const deltaPctY = ((e.clientY - startPointer.y) / courtRect.height) * 100;

            let newX = startRectPos.x + deltaPctX;
            let newY = startRectPos.y + deltaPctY;

            newX = Math.max(0, Math.min(100 - rectObj.w, newX));
            newY = Math.max(0, Math.min(100 - rectObj.h, newY));

            rectObj.x = Math.round(newX * 10) / 10;
            rectObj.y = Math.round(newY * 10) / 10;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                rectNode.style.left = rectObj.x + '%';
                rectNode.style.top = rectObj.y + '%';
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            rectNode.removeEventListener('pointermove', onPointerMove);
            rectNode.removeEventListener('pointerup', onPointerUp);
            rectNode.removeEventListener('pointercancel', onPointerUp);
            saveState();
        };

        rectNode.addEventListener('pointerdown', onPointerDown);
    }

    function setupBallTouchDragging(ballNode, ballObj, courtId) {
        let isDragging = false;
        let rafId = null;

        const onPointerDown = (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool !== 'select') return;
            selectCourtElement(ballObj.id, ballNode);
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

            const courtContainer = document.getElementById(`floorball-court-${courtId}`);
            if (!courtContainer) return;

            const rect = courtContainer.getBoundingClientRect();
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

    function setupNodeTouchDragging(node, coords, posKeyStore, courtId) {
        let isDragging = false;
        let rafId = null;

        const onPointerDown = (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool !== 'select') return;
            selectCourtElement(posKeyStore, node);
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

            const courtContainer = document.getElementById(`floorball-court-${courtId}`);
            if (!courtContainer) return;

            const rect = courtContainer.getBoundingClientRect();
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

    function undoLastDrawingForCourt(courtId) {
        const courtKey = getCourtKey(courtId);
        const currentDrawings = lineupDrawings[courtKey] || lineupDrawings[activeLineupKey] || [];
        if (currentDrawings.length > 0) {
            currentDrawings.pop();
            saveState();
            renderCourtBoards();
            showToast('Viimeisin piirros kumottu ↩️');
        } else {
            showToast('Ei piirroksia kumottavaksi tässä kentässä.');
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
            renderCourtBoards();
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
            renderCourtBoards();
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

        btnAddTacticPage?.addEventListener('click', addTacticalPage);
        btnDeleteTacticPage?.addEventListener('click', deleteTacticalPage);
        btnAddCourtBoard?.addEventListener('click', addCourtToActivePage);

        pagesScrollContainer?.addEventListener('click', (e) => {
            const renameIcon = e.target.closest('[data-action="rename-page"]');
            if (renameIcon) {
                const pageId = renameIcon.dataset.pageId;
                renameTacticalPage(pageId);
            }
        });

        courtsVerticalList?.addEventListener('click', (e) => {
            const renameCourtBtn = e.target.closest('[data-action="rename-court"]');
            if (renameCourtBtn) {
                renameCourtBoard(renameCourtBtn.dataset.courtId);
                return;
            }

            const clearCourtBtn = e.target.closest('[data-action="clear-court-drawings"]');
            if (clearCourtBtn) {
                const courtId = clearCourtBtn.dataset.courtId;
                const courtKey = getCourtKey(courtId);
                lineupDrawings[courtKey] = [];
                lineupBalls[courtKey] = [];
                lineupCones[courtKey] = [];
                lineupOpponents[courtKey] = [];
                saveState();
                renderCourtBoards();
                showToast('Piirtoalusta tyhjennetty.');
                return;
            }

            const deleteCourtBtn = e.target.closest('[data-action="delete-court"]');
            if (deleteCourtBtn) {
                deleteCourtFromActivePage(deleteCourtBtn.dataset.courtId);
                return;
            }

            const toolBtn = e.target.closest('.tool-btn[data-tool]');
            if (toolBtn) {
                const courtId = toolBtn.dataset.courtId;
                const tool = toolBtn.dataset.tool;
                setCourtDrawingTool(courtId, tool);
                return;
            }

            const addBallBtn = e.target.closest('[data-action="add-ball"]');
            if (addBallBtn) {
                addBallToCourt(addBallBtn.dataset.courtId);
                return;
            }

            const addConeBtn = e.target.closest('[data-action="add-cone"]');
            if (addConeBtn) {
                addConeToCourt(addConeBtn.dataset.courtId);
                return;
            }

            const addOpponentBtn = e.target.closest('[data-action="add-opponent"]');
            if (addOpponentBtn) {
                addOpponentToCourt(addOpponentBtn.dataset.courtId);
                return;
            }

            const undoBtn = e.target.closest('[data-action="undo-drawing"]');
            if (undoBtn) {
                undoLastDrawingForCourt(undoBtn.dataset.courtId);
                return;
            }

            const toggleOrientBtn = e.target.closest('[data-action="toggle-orientation"]');
            if (toggleOrientBtn) {
                orientationMode = (orientationMode === 'horizontal') ? 'vertical' : 'horizontal';
                renderCourtBoards();
                showToast(`Kentän asento vaihtoi: ${orientationMode === 'vertical' ? 'Pysty (20x40m)' : 'Vaaka (40x20m)'}`);
                return;
            }

            const removePlayerBtn = e.target.closest('[data-action="remove-lineup-player"]');
            if (removePlayerBtn) {
                const pos = removePlayerBtn.dataset.pos;
                if (lineups[activeLineupKey]) lineups[activeLineupKey][pos] = '';
                saveState();
                renderActiveLineupSlots();
                renderCourtBoards();
                return;
            }

            const removeBallBtn = e.target.closest('[data-action="remove-ball"]');
            if (removeBallBtn) {
                const ballId = removeBallBtn.dataset.ballId;
                const courtId = removeBallBtn.dataset.courtId;
                const courtKey = getCourtKey(courtId);
                if (lineupBalls[courtKey]) {
                    lineupBalls[courtKey] = lineupBalls[courtKey].filter(b => b.id !== ballId);
                    saveState();
                    renderCourtBoards();
                    showToast('Pallo poistettu.');
                }
                return;
            }

            const removeConeBtn = e.target.closest('[data-action="remove-cone"]');
            if (removeConeBtn) {
                const coneId = removeConeBtn.dataset.coneId;
                const courtId = removeConeBtn.dataset.courtId;
                const courtKey = getCourtKey(courtId);
                if (lineupCones[courtKey]) {
                    lineupCones[courtKey] = lineupCones[courtKey].filter(c => c.id !== coneId);
                    saveState();
                    renderCourtBoards();
                    showToast('Tötterö poistettu.');
                }
                return;
            }

            const removeOpponentBtn = e.target.closest('[data-action="remove-opponent"]');
            if (removeOpponentBtn) {
                const oppId = removeOpponentBtn.dataset.oppId;
                const courtId = removeOpponentBtn.dataset.courtId;
                const courtKey = getCourtKey(courtId);
                if (lineupOpponents[courtKey]) {
                    lineupOpponents[courtKey] = lineupOpponents[courtKey].filter(o => o.id !== oppId);
                    saveState();
                    renderCourtBoards();
                    showToast('Vastustaja poistettu.');
                }
                return;
            }

            const removeRectBtn = e.target.closest('[data-action="remove-rect"]');
            if (removeRectBtn) {
                const rectId = removeRectBtn.dataset.rectId;
                const courtId = removeRectBtn.dataset.courtId;
                const courtKey = getCourtKey(courtId);
                if (lineupDrawings[courtKey]) {
                    lineupDrawings[courtKey] = lineupDrawings[courtKey].filter(d => d.id !== rectId);
                    saveState();
                    renderCourtBoards();
                    showToast('Taktinen alue poistettu.');
                }
                return;
            }

            const removeLineBtn = e.target.closest('[data-action="remove-line"]');
            if (removeLineBtn) {
                const lineId = removeLineBtn.dataset.lineId;
                const courtId = removeLineBtn.dataset.courtId;
                const courtKey = getCourtKey(courtId);
                if (lineupDrawings[courtKey]) {
                    lineupDrawings[courtKey] = lineupDrawings[courtKey].filter(d => d.id !== lineId);
                    saveState();
                    renderCourtBoards();
                    showToast('Viiva poistettu.');
                }
                return;
            }
        });

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

        document.getElementById('btn-reset-defaults')?.addEventListener('click', () => {
            if (confirm('Haluatko palauttaa 19 oletuspelaajaa ja valmiit 1., 2. & YV/AV-kentälliset?')) {
                roster = JSON.parse(JSON.stringify(DEFAULT_ROSTER));
                lineups = JSON.parse(JSON.stringify(DEFAULT_LINEUPS));
                saveState();
                updateRosterCounters();
                renderRoster();
                renderActiveLineupSlots();
                renderCourtBoards();
                showToast('Oletuspelaajat ja kentälliset palautettu! 🎉');
            }
        });

        document.getElementById('btn-add-lineup-summary')?.addEventListener('click', () => openLineupConfigModal());
        document.getElementById('btn-manage-lineups-summary')?.addEventListener('click', () => openManageLineupsModal());
        
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
                renderCourtBoards();
                return;
            }

            const slotEl = e.target.closest('.lineup-slot');
            if (slotEl) {
                const pos = slotEl.dataset.position;
                if (pos) openSlotPickerModal(activeLineupKey, pos);
            }
        });

        document.addEventListener('pointerdown', (e) => {
            if (!e.target.closest('.court-player-node, .court-ball-node, .court-cone-node, .court-opponent-node, .court-rect-node, .court-line-node, .line-endpoint-handle, button')) {
                selectCourtElement(null);
            }
        });

        document.getElementById('btn-clear-pitch').addEventListener('click', () => {
            const lName = getLineupName(activeLineupKey);
            if (confirm(`Tyhjennetäänkö ${lName} kaikilta alustoilta?`)) {
                lineups[activeLineupKey] = createEmptyLineupSlots();
                saveState();
                renderActiveLineupSlots();
                renderCourtBoards();
                showToast('Kentällinen tyhjennetty.');
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
            renderCourtBoards();
        });

        document.getElementById('btn-export-text').addEventListener('click', exportLineupsToClipboard);
        document.getElementById('btn-copy-this-lineup').addEventListener('click', exportLineupsToClipboard);
        document.getElementById('btn-copy-all-summary')?.addEventListener('click', exportLineupsToClipboard);
    }

    document.addEventListener('DOMContentLoaded', init);

})();
