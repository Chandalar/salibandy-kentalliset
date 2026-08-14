/**
 * Salibandyn Kentälliset & Taktiikkataulu - Advanced Logic & Interactive Engine
 * Sisältää täysileveän rinnakkaisen yhteenvetonäkymän, pystypinotut taktiikkakentät ja reaaliaikaisen Firebase-pilvisynkronoinnin.
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

    // Helper: Escape HTML
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

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
    let orientationMode = (typeof window !== 'undefined' && window.innerWidth <= 600) ? 'vertical' : 'horizontal';
    let activeSelectedElementId = null;

    // Per-court state maps
    let courtDrawingTools = {};
    let courtIsDrawingMap = {};
    let courtPathPctMap = {};

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
        if (typeof window !== 'undefined' && window.SalibandyFirebase && window.SalibandyFirebase.isReady()) {
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
        const userAuthStatusWrapper = document.getElementById('user-auth-status');
        if (!userAuthStatusWrapper) return;
        if (currentUser) {
            userAuthStatusWrapper.innerHTML = `
                <div class="user-profile-badge">
                    <span>👤</span>
                    <span class="user-email-text" title="${escapeHtml(currentUser.email)}">${escapeHtml(currentUser.email)}</span>
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
                document.getElementById('auth-modal')?.classList.add('active');
            });
            updateCloudSyncBadge(false);
        }
    }

    function updateCloudSyncBadge(isCloudActive) {
        const cloudSyncBadge = document.getElementById('cloud-sync-badge');
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
        if (typeof window !== 'undefined' && window.SalibandyFirebase && window.SalibandyFirebase.isReady()) {
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
    // COMPLETE REAL-TIME BI-DIRECTIONAL CLOUD SYNC
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

        const serverTs = (typeof window !== 'undefined' && window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue)
            ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date();

        return {
            email: currentUser ? currentUser.email : '',
            updatedAt: serverTs,
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
            document.getElementById('auth-modal')?.classList.add('active');
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

        if (currentUser && typeof window !== 'undefined' && window.SalibandyFirebase && window.SalibandyFirebase.isReady() && !isCloudLoading) {
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
        const toastEl = document.getElementById('toast');
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3200);
    }

    function renderTeamDropdown() {
        const teamSelect = document.getElementById('team-select');
        if (!teamSelect) return;
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
        const tabsScrollContainer = document.getElementById('tabs-scroll-container');
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

        const rosterPanelSection = document.getElementById('roster-panel-section');
        const pitchPanelSection = document.getElementById('pitch-panel-section');
        const lineupPanelSection = document.getElementById('lineup-panel-section');
        const summaryViewPanel = document.getElementById('summary-view-panel');

        if (activeLineupKey === 'summary') {
            if (rosterPanelSection) rosterPanelSection.style.display = 'none';
            if (pitchPanelSection) pitchPanelSection.style.display = 'none';
            if (lineupPanelSection) lineupPanelSection.style.display = 'none';
            if (summaryViewPanel) summaryViewPanel.style.display = 'flex';
            renderSummaryView();
        } else {
            if (rosterPanelSection) rosterPanelSection.style.display = 'flex';
            if (pitchPanelSection) pitchPanelSection.style.display = 'flex';
            if (lineupPanelSection) lineupPanelSection.style.display = 'flex';
            if (summaryViewPanel) summaryViewPanel.style.display = 'none';
            renderActiveLineupSlots();
            renderCourtBoards();
        }
    }

    // ==========================================
    // MULTIPLE TACTICAL PAGES & TAB RENAMING
    // ==========================================
    function getPagesForActiveLineup() {
        if (!lineupPages || typeof lineupPages !== 'object') lineupPages = {};
        if (!lineupPages[activeLineupKey] || !Array.isArray(lineupPages[activeLineupKey]) || lineupPages[activeLineupKey].length === 0) {
            lineupPages[activeLineupKey] = [
                { id: 'p1', name: 'Sivu 1', courts: [{ id: 'c1', title: 'Kenttä 1' }] }
            ];
        }
        lineupPages[activeLineupKey].forEach((p, idx) => {
            if (!p.courts || !Array.isArray(p.courts) || p.courts.length === 0) {
                p.courts = [{ id: 'c1', title: 'Kenttä 1' }];
            }
        });
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
        const pagesScrollContainer = document.getElementById('pages-scroll-container');
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

        const btnDeleteTacticPage = document.getElementById('btn-delete-tactic-page');
        if (btnDeleteTacticPage && btnDeleteTacticPage.style) {
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
        if (!page.courts || !Array.isArray(page.courts)) {
            page.courts = [{ id: 'c1', title: 'Kenttä 1' }];
        }
        const nextNum = page.courts.length + 1;
        const newCourtId = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        page.courts.push({
            id: newCourtId,
            title: `Kenttä ${nextNum}`
        });

        saveState();
        renderCourtBoards();

        requestAnimationFrame(() => {
            const addedCard = document.querySelector(`.court-board-card[data-court-id="${newCourtId}"]`);
            if (addedCard && addedCard.scrollIntoView) {
                addedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        showToast(`Uusi piirtoalusta / kenttä lisätty alapuolelle! 🏒`);
    }

    function deleteCourtFromActivePage(courtId) {
        const page = getCurrentPage();
        if (!page.courts || page.courts.length <= 1) {
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
        const courtsVerticalList = document.getElementById('courts-vertical-list');
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
                            <img src="ball.png?v=22.0" width="18" height="18" alt="Pallo" style="vertical-align: middle; display: inline-block;"> + Pallo
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

            requestAnimationFrame(() => {
                initCourtBoardInstance(courtId);
            });
        });
    }

    function initCourtBoardInstance(courtId) {
        const courtKey = getCourtKey(courtId);
        const courtContainer = document.getElementById(`floorball-court-${courtId}`);
        const canvasEl = document.getElementById(`tactic-canvas-${courtId}`);
        const layersEl = document.getElementById(`court-players-layer-${courtId}`);

        if (!courtContainer || !canvasEl || !layersEl) return;
        if (typeof canvasEl.getContext !== 'function') return;

        const ctxEl = canvasEl.getContext('2d');
        if (!ctxEl) return;
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
                    <img src="ball.png?v=22.0" class="floorball-png-icon" alt="Pallo">
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

    // ==========================================
    // ROSTER & LINEUP SLOTS RENDERING
    // ==========================================
    function updateRosterCounters() {
        if (!roster || !Array.isArray(roster)) return;
        const mvCount = roster.filter(p => p.position === 'MV').length;
        const fieldCount = roster.filter(p => p.position !== 'MV').length;
        const loanCount = roster.filter(p => p.isLoan).length;

        const countMvEl = document.getElementById('count-mv');
        const countFieldEl = document.getElementById('count-field');
        const countLoanEl = document.getElementById('count-loan');

        if (countMvEl) countMvEl.textContent = `${mvCount} MV`;
        if (countFieldEl) countFieldEl.textContent = `${fieldCount} KENTTÄ`;
        if (countLoanEl) countLoanEl.textContent = `${loanCount} LAINA`;
    }

    function getPosLabel(pos) {
        const labels = {
            MV: '🟢 MV',
            VP: '🔵 VP',
            OP: '🔵 OP',
            VH: '🔵 VH',
            KH: '🔵 KH',
            OH: '🔵 OH',
            H: '🔵 Kenttä',
            P: '🔵 Pakki'
        };
        return labels[pos] || pos;
    }

    function renderRoster() {
        const rosterListContainer = document.getElementById('roster-list-container');
        if (!rosterListContainer) return;
        rosterListContainer.innerHTML = '';

        if (!roster || !Array.isArray(roster) || roster.length === 0) {
            rosterListContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 1.5rem 0.5rem;">
                    <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">🏑</p>
                    <p>Ei pelaajia ringissä.</p>
                    <button class="btn-xs btn-outline" id="btn-empty-restore-roster" style="margin-top: 0.5rem;">🔄 Palauta oletuspelaajat</button>
                </div>
            `;
            document.getElementById('btn-empty-restore-roster')?.addEventListener('click', () => {
                roster = JSON.parse(JSON.stringify(DEFAULT_ROSTER));
                lineups = JSON.parse(JSON.stringify(DEFAULT_LINEUPS));
                saveState();
                updateRosterCounters();
                renderRoster();
                renderActiveLineupSlots();
                renderCourtBoards();
                showToast('Oletuspelaajat palautettu! 🎉');
            });
            return;
        }

        const filtered = roster.filter(player => {
            const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  player.number.toString().includes(searchQuery);

            if (!matchesSearch) return false;
            if (activeFilter === 'mv') return player.position === 'MV';
            if (activeFilter === 'field') return player.position !== 'MV';
            if (activeFilter === 'loan') return player.isLoan;
            return true;
        });

        // Sort: MV first, then number
        filtered.sort((a, b) => {
            if (a.position === 'MV' && b.position !== 'MV') return -1;
            if (a.position !== 'MV' && b.position === 'MV') return 1;
            return a.number - b.number;
        });

        filtered.forEach(player => {
            const card = document.createElement('div');
            const isMv = player.position === 'MV';
            card.className = `player-card ${isMv ? 'is-mv' : 'is-field'}`;
            card.dataset.id = player.id;

            let assignedInfo = '';
            const assignments = [];
            lineupConfigs.forEach(c => {
                const lk = c.id;
                const lObj = lineups[lk] || {};
                Object.keys(lObj).forEach(pos => {
                    if (lObj[pos] === player.id) {
                        assignments.push(`${c.name} (${pos})`);
                    }
                });
            });

            if (assignments.length > 0) {
                assignedInfo = `<div class="assigned-badge-line" title="${assignments.join(', ')}">📍 ${escapeHtml(assignments.join(', '))}</div>`;
            }

            card.innerHTML = `
                <div class="player-card-main" data-action="tap-assign" data-id="${player.id}">
                    <div class="player-number-badge">${player.number}</div>
                    <div class="player-info-block">
                        <div class="player-name-row">
                            <span class="player-name">${escapeHtml(player.name)}</span>
                            ${player.isLoan ? '<span class="loan-pill">LAINA</span>' : ''}
                        </div>
                        <div class="player-meta-row">
                            <span class="pos-badge">${getPosLabel(player.position)}</span>
                            ${player.notes ? `<span class="player-note-text">${escapeHtml(player.notes)}</span>` : ''}
                        </div>
                        ${assignedInfo}
                    </div>
                </div>
                <div class="player-card-actions">
                    <button class="mini-action-btn" data-action="edit" data-id="${player.id}" title="Muokkaa">✏️</button>
                    <button class="mini-action-btn danger-text" data-action="delete" data-id="${player.id}" title="Poista">🗑️</button>
                </div>
            `;

            rosterListContainer.appendChild(card);
        });
    }

    function renderActiveLineupSlots() {
        const activeLineupTitle = document.getElementById('active-lineup-title');
        const lineupSlotsContainer = document.getElementById('lineup-slots-container');
        if (!activeLineupTitle || !lineupSlotsContainer) return;
        activeLineupTitle.textContent = getLineupName(activeLineupKey);
        const currentLineup = lineups[activeLineupKey] || {};
        const posKeys = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];

        lineupSlotsContainer.innerHTML = '';

        posKeys.forEach(pos => {
            const playerId = currentLineup[pos];
            const player = roster.find(p => p.id === playerId);
            const isMv = pos === 'MV';

            const slot = document.createElement('div');
            slot.className = `lineup-slot ${isMv ? 'slot-mv' : 'slot-field'} ${player ? 'is-filled' : 'is-empty'}`;
            slot.dataset.position = pos;

            if (player) {
                slot.innerHTML = `
                    <div class="slot-pos-tag">${pos}</div>
                    <div class="slot-player-info">
                        <span class="slot-player-num">#${player.number}</span>
                        <span class="slot-player-name">${escapeHtml(player.name)}</span>
                        ${player.isLoan ? '<span class="loan-pill-tiny">⭐</span>' : ''}
                    </div>
                    <button class="slot-remove-btn" data-action="remove-slot" data-pos="${pos}" title="Poista paikalta">✕</button>
                `;
            } else {
                slot.innerHTML = `
                    <div class="slot-pos-tag">${pos}</div>
                    <div class="slot-empty-prompt">+ Valitse pelaaja</div>
                `;
            }

            lineupSlotsContainer.appendChild(slot);
        });
    }

    // ==========================================
    // SUMMARY VIEW (Kaikki kentälliset rinnakkain)
    // ==========================================
    function renderSummaryView() {
        const summaryGridContainer = document.getElementById('summary-grid-container');
        if (!summaryGridContainer) return;
        summaryGridContainer.innerHTML = '';

        const posKeys = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];

        lineupConfigs.forEach(cConfig => {
            const lKey = cConfig.id;
            const lName = cConfig.name;
            const curLineup = lineups[lKey] || {};

            const col = document.createElement('div');
            col.className = 'summary-lineup-card';

            let slotsHtml = '';
            posKeys.forEach(pos => {
                const pid = curLineup[pos];
                const player = roster.find(p => p.id === pid);
                const isMv = pos === 'MV';

                if (player) {
                    slotsHtml += `
                        <div class="summary-slot-row ${isMv ? 'is-mv' : 'is-field'}" data-lineup="${lKey}" data-pos="${pos}">
                            <span class="summary-pos-tag">${pos}</span>
                            <span class="summary-p-num">#${player.number}</span>
                            <span class="summary-p-name">${escapeHtml(player.name)}</span>
                            ${player.isLoan ? '<span class="loan-pill-tiny">⭐</span>' : ''}
                            <button class="summary-remove-slot" data-action="summary-remove-slot" data-lineup="${lKey}" data-pos="${pos}">✕</button>
                        </div>
                    `;
                } else {
                    slotsHtml += `
                        <div class="summary-slot-row is-empty" data-lineup="${lKey}" data-pos="${pos}">
                            <span class="summary-pos-tag">${pos}</span>
                            <span class="summary-empty-text">+ Valitse ${pos}</span>
                        </div>
                    `;
                }
            });

            col.innerHTML = `
                <div class="summary-card-header">
                    <div class="summary-card-title">${escapeHtml(lName)}</div>
                    <button class="btn-xs btn-outline" data-action="switch-to-lineup" data-lineup="${lKey}">Avaa 🏒</button>
                </div>
                <div class="summary-card-body">
                    ${slotsHtml}
                </div>
            `;

            summaryGridContainer.appendChild(col);
        });

        // Bind Summary clicks
        summaryGridContainer.querySelectorAll('[data-action="switch-to-lineup"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lk = e.currentTarget.dataset.lineup;
                switchTab(lk);
            });
        });

        summaryGridContainer.querySelectorAll('.summary-slot-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.dataset.action === 'summary-remove-slot') {
                    const lk = e.target.dataset.lineup;
                    const pos = e.target.dataset.pos;
                    if (lineups[lk]) lineups[lk][pos] = '';
                    saveState();
                    renderSummaryView();
                    return;
                }
                const lk = row.dataset.lineup;
                const pos = row.dataset.pos;
                if (lk && pos) openSlotPickerModal(lk, pos);
            });
        });
    }

    // ==========================================
    // MODALS & PICKERS
    // ==========================================
    function openImportPlayersModal() {
        const otherTeams = teams.filter(t => t.id !== currentTeamId);

        if (otherTeams.length === 0) {
            showToast('Ei muita joukkueita joista tuoda pelaajia. Luo ensin toinen joukkue! 🏑');
            return;
        }

        const importSourceTeamSelect = document.getElementById('import-source-team-select');
        if (importSourceTeamSelect) {
            importSourceTeamSelect.innerHTML = '';
            otherTeams.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.name;
                importSourceTeamSelect.appendChild(opt);
            });
        }

        renderImportChecklist(otherTeams[0].id);
        document.getElementById('import-players-modal')?.classList.add('active');
    }

    function renderImportChecklist(sourceTeamId) {
        const importPlayerChecklist = document.getElementById('import-player-checklist');
        if (!importPlayerChecklist) return;
        importPlayerChecklist.innerHTML = '';
        const sourceRoster = loadRosterForTeam(sourceTeamId);

        if (sourceRoster.length === 0) {
            importPlayerChecklist.innerHTML = '<div style="color: var(--text-muted); padding: 1rem; text-align: center;">Tässä joukkueessa ei ole vielä pelaajia.</div>';
            return;
        }

        sourceRoster.forEach(player => {
            const item = document.createElement('label');
            item.className = 'import-player-item';
            const isAlready = roster.some(p => p.number === player.number && p.name === player.name);

            item.innerHTML = `
                <input type="checkbox" value="${player.id}" class="import-checkbox" ${isAlready ? 'disabled' : 'checked'}>
                <span class="import-p-num">#${player.number}</span>
                <span class="import-p-name">${escapeHtml(player.name)}</span>
                <span class="pos-badge">${getPosLabel(player.position)}</span>
                ${isAlready ? '<span style="font-size:0.7rem; color:var(--text-muted);">(On jo ringissä)</span>' : ''}
            `;
            importPlayerChecklist.appendChild(item);
        });
    }

    function openManageLineupsModal() {
        renderReorderList();
        document.getElementById('manage-lineups-modal')?.classList.add('active');
    }

    function renderReorderList() {
        const reorderLineupsList = document.getElementById('reorder-lineups-list');
        if (!reorderLineupsList) return;
        reorderLineupsList.innerHTML = '';

        if (lineupConfigs.length === 0) {
            reorderLineupsList.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 1rem;">Ei kentällisiä.</div>';
            return;
        }

        lineupConfigs.forEach((c, idx) => {
            const row = document.createElement('div');
            row.className = 'reorder-item-row';
            row.innerHTML = `
                <div class="reorder-info">
                    <span class="reorder-num">${idx + 1}.</span>
                    <span class="reorder-name">${escapeHtml(c.name)}</span>
                </div>
                <div class="reorder-actions">
                    <button class="btn-xs btn-outline" data-action="move-up" data-index="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
                    <button class="btn-xs btn-outline" data-action="move-down" data-index="${idx}" ${idx === lineupConfigs.length - 1 ? 'disabled' : ''}>▼</button>
                    <button class="btn-xs btn-outline" data-action="edit-config" data-id="${c.id}">✏️</button>
                    <button class="btn-xs btn-outline danger-text" data-action="delete-config" data-id="${c.id}">🗑️</button>
                </div>
            `;
            reorderLineupsList.appendChild(row);
        });
    }

    function openLineupConfigModal(lineupConfig = null) {
        const lineupConfigModalTitle = document.getElementById('lineup-config-modal-title');
        const formLineupId = document.getElementById('form-lineup-id');
        const formLineupName = document.getElementById('form-lineup-name');
        const lineupConfigForm = document.getElementById('lineup-config-form');

        if (lineupConfig) {
            if (lineupConfigModalTitle) lineupConfigModalTitle.textContent = 'Muokkaa kentällisen nimeä';
            if (formLineupId) formLineupId.value = lineupConfig.id;
            if (formLineupName) formLineupName.value = lineupConfig.name;
        } else {
            if (lineupConfigModalTitle) lineupConfigModalTitle.textContent = 'Uusi kentällinen';
            lineupConfigForm?.reset();
            if (formLineupId) formLineupId.value = '';
        }
        document.getElementById('lineup-config-modal')?.classList.add('active');
    }

    function deleteLineupConfig(id) {
        if (lineupConfigs.length <= 1) {
            showToast('Et voi poistaa ainoaa kentällistä.');
            return;
        }
        const c = lineupConfigs.find(item => item.id === id);
        if (!c) return;

        if (confirm(`Haluatko varmasti poistaa kentällisen '${c.name}'?`)) {
            lineupConfigs = lineupConfigs.filter(item => item.id !== id);
            delete lineups[id];
            delete lineupDrawings[id];
            delete lineupCourtPositions[id];
            delete lineupBalls[id];
            delete lineupCones[id];
            delete lineupOpponents[id];
            delete lineupPages[id];

            if (activeLineupKey === id) {
                activeLineupKey = lineupConfigs[0].id;
            }

            saveState();
            renderTabs();
            renderTacticalPageBadges();
            renderReorderList();
            if (activeLineupKey === 'summary') {
                renderSummaryView();
            } else {
                renderActiveLineupSlots();
                renderCourtBoards();
            }
            showToast(`Kentällinen '${c.name}' poistettu.`);
        }
    }

    function openSlotPickerModal(lineupKey, pos) {
        selectedSlotTarget = { lineupKey, pos };
        const isMv = pos === 'MV';
        const lineupName = getLineupName(lineupKey);

        const slotPickerTitle = document.getElementById('slot-picker-title');
        const slotPickerInfo = document.getElementById('slot-picker-info');
        const slotPickerPlayerList = document.getElementById('slot-picker-player-list');

        if (slotPickerTitle) slotPickerTitle.textContent = `Valitse pelaaja: ${lineupName} - ${pos}`;
        if (slotPickerInfo) slotPickerInfo.textContent = `Valitse pelaaja ringistä paikkaan ${pos}:`;

        const currentOccupantId = (lineups[lineupKey] || {})[pos];

        const sortedRoster = [...roster].sort((a, b) => {
            if (isMv) {
                if (a.position === 'MV' && b.position !== 'MV') return -1;
                if (a.position !== 'MV' && b.position === 'MV') return 1;
            }
            return a.number - b.number;
        });

        if (slotPickerPlayerList) {
            slotPickerPlayerList.innerHTML = '';
            sortedRoster.forEach(player => {
                const item = document.createElement('div');
                const isAssignedToThis = player.id === currentOccupantId;
                item.className = `slot-picker-item ${player.position === 'MV' ? 'is-mv' : 'is-field'} ${isAssignedToThis ? 'is-current' : ''}`;

                item.innerHTML = `
                    <div class="slot-picker-num">#${player.number}</div>
                    <div class="slot-picker-info">
                        <span class="slot-picker-name">${escapeHtml(player.name)}</span>
                        <span class="pos-badge">${getPosLabel(player.position)}</span>
                        ${player.isLoan ? '<span class="loan-pill-tiny">LAINA</span>' : ''}
                    </div>
                    ${isAssignedToThis ? '<span style="font-size:0.75rem; color:var(--accent-field);">✓ Valittu</span>' : ''}
                `;

                item.addEventListener('click', () => {
                    assignPlayerToLineupSlot(lineupKey, pos, player.id);
                    closeModal();
                });

                slotPickerPlayerList.appendChild(item);
            });
        }

        document.getElementById('slot-picker-modal')?.classList.add('active');
    }

    function openAssignModal(player) {
        selectedPlayerForAssignment = player;
        const assignModalTitle = document.getElementById('assign-modal-title');
        const assignModalPlayerInfo = document.getElementById('assign-modal-player-info');
        const assignOptionsGrid = document.getElementById('assign-options-grid');

        if (assignModalTitle) assignModalTitle.textContent = 'Sijoita kentälliseen';
        if (assignModalPlayerInfo) assignModalPlayerInfo.innerHTML = `Valitse paikka pelaajalle <strong>#${player.number} ${escapeHtml(player.name)}</strong>:`;

        const slotTypes = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];
        if (assignOptionsGrid) {
            assignOptionsGrid.innerHTML = '';
            lineupConfigs.forEach(cConfig => {
                const lKey = cConfig.id;
                const lName = cConfig.name;
                const curL = lineups[lKey] || {};

                const section = document.createElement('div');
                section.className = 'assign-lineup-group';
                section.innerHTML = `<div class="assign-lineup-title">${escapeHtml(lName)}</div>`;

                const btnGrid = document.createElement('div');
                btnGrid.className = 'assign-slots-row';

                slotTypes.forEach(pos => {
                    const btn = document.createElement('button');
                    const isSelectedHere = curL[pos] === player.id;
                    btn.className = `assign-slot-btn ${isSelectedHere ? 'is-active' : ''}`;
                    btn.innerHTML = `<strong>${pos}</strong>`;

                    btn.addEventListener('click', () => {
                        if (isSelectedHere) {
                            lineups[lKey][pos] = '';
                            showToast(`Poistettu: ${lName} - ${pos}`);
                        } else {
                            assignPlayerToLineupSlot(lKey, pos, player.id);
                        }
                        saveState();
                        renderRoster();
                        if (activeLineupKey === 'summary') {
                            renderSummaryView();
                        } else {
                            renderActiveLineupSlots();
                            renderCourtBoards();
                        }
                        closeModal();
                    });

                    btnGrid.appendChild(btn);
                });

                section.appendChild(btnGrid);
                assignOptionsGrid.appendChild(section);
            });
        }

        document.getElementById('assign-modal')?.classList.add('active');
    }

    function assignPlayerToLineupSlot(lineupKey, pos, playerId) {
        if (!lineups[lineupKey]) lineups[lineupKey] = createEmptyLineupSlots();
        lineups[lineupKey][pos] = playerId;

        saveState();
        renderRoster();
        if (activeLineupKey === 'summary') {
            renderSummaryView();
        } else {
            renderActiveLineupSlots();
            renderCourtBoards();
        }
        showToast(`Pelaaja sijoitettu: ${getLineupName(lineupKey)} - ${pos} 👍`);
    }

    function openModal(editPlayer = null) {
        const modalTitle = document.getElementById('modal-title');
        const formPlayerId = document.getElementById('form-player-id');
        const formName = document.getElementById('form-name');
        const formNumber = document.getElementById('form-number');
        const formPosition = document.getElementById('form-position');
        const formIsLoan = document.getElementById('form-is-loan');
        const formNotes = document.getElementById('form-notes');
        const playerForm = document.getElementById('player-form');

        if (editPlayer) {
            if (modalTitle) modalTitle.textContent = 'Muokkaa pelaajaa';
            if (formPlayerId) formPlayerId.value = editPlayer.id;
            if (formName) formName.value = editPlayer.name;
            if (formNumber) formNumber.value = editPlayer.number;
            if (formPosition) formPosition.value = editPlayer.position;
            if (formIsLoan) formIsLoan.checked = editPlayer.isLoan;
            if (formNotes) formNotes.value = editPlayer.notes || '';
        } else {
            if (modalTitle) modalTitle.textContent = 'Lisää uusi pelaaja / Laina';
            playerForm?.reset();
            if (formPlayerId) formPlayerId.value = '';
            if (formPosition) formPosition.value = 'H';
            if (formIsLoan) formIsLoan.checked = false;
        }
        document.getElementById('player-modal')?.classList.add('active');
    }

    function closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    }

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

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Kentälliset kopioitu leikepöydälle! 📋');
            }).catch(() => {
                showToast('Kopiointi epäonnistui.');
            });
        }
    }

    function parseOcrTextToPlayers(text) {
        const ocrStatus = document.getElementById('ocr-status');
        const photoPreviewStep = document.getElementById('photo-preview-step');
        if (ocrStatus) ocrStatus.style.display = 'none';
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
        if (photoPreviewStep) photoPreviewStep.style.display = 'block';
    }

    function renderOcrResults() {
        const ocrResultsList = document.getElementById('ocr-results-list');
        if (!ocrResultsList) return;
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

    // ==========================================
    // GLOBAL EVENT BINDINGS
    // ==========================================
    function bindEvents() {
        document.getElementById('team-select')?.addEventListener('change', (e) => switchTeam(e.target.value));
        document.getElementById('btn-delete-team')?.addEventListener('click', deleteActiveTeam);
        document.getElementById('cloudSyncBadge')?.addEventListener('click', forceCloudSync);

        // Tactical Pages & Multi-court buttons
        document.getElementById('btn-add-tactic-page')?.addEventListener('click', addTacticalPage);
        document.getElementById('btn-delete-tactic-page')?.addEventListener('click', deleteTacticalPage);

        // Global delegated click handler for full robustness (single source of truth)
        document.addEventListener('click', (e) => {
            const addCourtBtn = e.target.closest('#btn-add-court-board, [data-action="add-court-board"]');
            if (addCourtBtn) {
                e.preventDefault();
                addCourtToActivePage();
                return;
            }

            const renamePageIcon = e.target.closest('[data-action="rename-page"]');
            if (renamePageIcon) {
                e.preventDefault();
                e.stopPropagation();
                renameTacticalPage(renamePageIcon.dataset.pageId);
                return;
            }

            const renameCourtBtn = e.target.closest('[data-action="rename-court"]');
            if (renameCourtBtn) {
                e.preventDefault();
                renameCourtBoard(renameCourtBtn.dataset.courtId);
                return;
            }

            const clearCourtBtn = e.target.closest('[data-action="clear-court-drawings"]');
            if (clearCourtBtn) {
                e.preventDefault();
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
                e.preventDefault();
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
                e.preventDefault();
                addBallToCourt(addBallBtn.dataset.courtId);
                return;
            }

            const addConeBtn = e.target.closest('[data-action="add-cone"]');
            if (addConeBtn) {
                e.preventDefault();
                addConeToCourt(addConeBtn.dataset.courtId);
                return;
            }

            const addOpponentBtn = e.target.closest('[data-action="add-opponent"]');
            if (addOpponentBtn) {
                e.preventDefault();
                addOpponentToCourt(addOpponentBtn.dataset.courtId);
                return;
            }

            const undoBtn = e.target.closest('[data-action="undo-drawing"]');
            if (undoBtn) {
                e.preventDefault();
                undoLastDrawingForCourt(undoBtn.dataset.courtId);
                return;
            }

            const toggleOrientBtn = e.target.closest('[data-action="toggle-orientation"]');
            if (toggleOrientBtn) {
                e.preventDefault();
                orientationMode = (orientationMode === 'horizontal') ? 'vertical' : 'horizontal';
                renderCourtBoards();
                showToast(`Kentän asento vaihtoi: ${orientationMode === 'vertical' ? 'Pysty (20x40m)' : 'Vaaka (40x20m)'}`);
                return;
            }

            const removePlayerBtn = e.target.closest('[data-action="remove-lineup-player"]');
            if (removePlayerBtn) {
                e.preventDefault();
                const pos = removePlayerBtn.dataset.pos;
                if (lineups[activeLineupKey]) lineups[activeLineupKey][pos] = '';
                saveState();
                renderActiveLineupSlots();
                renderCourtBoards();
                return;
            }

            const removeBallBtn = e.target.closest('[data-action="remove-ball"]');
            if (removeBallBtn) {
                e.preventDefault();
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
                e.preventDefault();
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
                e.preventDefault();
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
                e.preventDefault();
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
                e.preventDefault();
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

        // Other Modal and Button Handlers
        document.getElementById('btn-new-team')?.addEventListener('click', () => {
            const teamNameInput = document.getElementById('team-name-input');
            if (teamNameInput) teamNameInput.value = '';
            document.getElementById('team-modal')?.classList.add('active');
        });

        document.querySelectorAll('.close-btn, [data-action="close-modal"]').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });

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

        document.getElementById('import-source-team-select')?.addEventListener('change', (e) => {
            renderImportChecklist(e.target.value);
        });

        document.getElementById('btn-import-select-all')?.addEventListener('click', () => {
            document.querySelectorAll('#import-player-checklist .import-checkbox:not(:disabled)').forEach(cb => { cb.checked = true; });
        });

        document.getElementById('btn-import-deselect-all')?.addEventListener('click', () => {
            document.querySelectorAll('#import-player-checklist .import-checkbox:not(:disabled)').forEach(cb => { cb.checked = false; });
        });

        document.getElementById('btn-confirm-import-players')?.addEventListener('click', () => {
            const checkedBoxes = document.querySelectorAll('#import-player-checklist .import-checkbox:checked:not(:disabled)');
            const sourceTeamSelect = document.getElementById('import-source-team-select');
            if (!sourceTeamSelect) return;
            const sourceTeamId = sourceTeamSelect.value;
            const sourceRoster = loadRosterForTeam(sourceTeamId);

            let importCount = 0;
            checkedBoxes.forEach(cb => {
                const pId = cb.value;
                const pObj = sourceRoster.find(p => p.id === pId);
                if (pObj) {
                    const cloned = JSON.parse(JSON.stringify(pObj));
                    cloned.id = 'p_imp_' + Date.now() + '_' + (importCount++);
                    roster.push(cloned);
                }
            });

            saveState();
            updateRosterCounters();
            renderRoster();
            closeModal();
            showToast(`${importCount} pelaajaa tuotu onnistuneesti joukkueesta! 📥`);
        });

        document.getElementById('reorder-lineups-list')?.addEventListener('click', (e) => {
            const upBtn = e.target.closest('[data-action="move-up"]');
            if (upBtn) {
                const idx = parseInt(upBtn.dataset.index, 10);
                if (idx > 0) {
                    const temp = lineupConfigs[idx];
                    lineupConfigs[idx] = lineupConfigs[idx - 1];
                    lineupConfigs[idx - 1] = temp;
                    saveState();
                    renderTabs();
                    renderReorderList();
                }
                return;
            }

            const downBtn = e.target.closest('[data-action="move-down"]');
            if (downBtn) {
                const idx = parseInt(downBtn.dataset.index, 10);
                if (idx < lineupConfigs.length - 1) {
                    const temp = lineupConfigs[idx];
                    lineupConfigs[idx] = lineupConfigs[idx + 1];
                    lineupConfigs[idx + 1] = temp;
                    saveState();
                    renderTabs();
                    renderReorderList();
                }
                return;
            }

            const editBtn = e.target.closest('[data-action="edit-config"]');
            if (editBtn) {
                const c = lineupConfigs.find(item => item.id === editBtn.dataset.id);
                if (c) openLineupConfigModal(c);
                return;
            }

            const delBtn = e.target.closest('[data-action="delete-config"]');
            if (delBtn) {
                deleteLineupConfig(delBtn.dataset.id);
                return;
            }
        });

        document.getElementById('btn-reset-default-lineups')?.addEventListener('click', () => {
            if (confirm('Palautetaanko oletuskentälliset (1., 2., 3., YV, AV, 6v5)?')) {
                lineupConfigs = JSON.parse(JSON.stringify(DEFAULT_LINEUP_CONFIGS));
                saveState();
                renderTabs();
                renderReorderList();
                showToast('Oletuskentälliset palautettu.');
            }
        });

        document.getElementById('lineup-config-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const formLineupId = document.getElementById('form-lineup-id');
            const formLineupName = document.getElementById('form-lineup-name');
            const id = (formLineupId && formLineupId.value) ? formLineupId.value : ('lineup_' + Date.now());
            const name = formLineupName ? formLineupName.value.trim() : '';
            if (!name) return;

            const existingIdx = lineupConfigs.findIndex(c => c.id === id);
            if (existingIdx >= 0) {
                lineupConfigs[existingIdx].name = name;
                showToast('Kentällisen nimi päivitetty!');
            } else {
                lineupConfigs.push({ id, name, type: 'custom' });
                lineups[id] = createEmptyLineupSlots();
                activeLineupKey = id;
                showToast('Uusi kentällinen luotu!');
            }

            saveState();
            renderTabs();
            renderTacticalPageBadges();
            closeModal();
            if (activeLineupKey === 'summary') {
                renderSummaryView();
            } else {
                renderActiveLineupSlots();
                renderCourtBoards();
            }
        });

        document.getElementById('btn-clear-slot-picker')?.addEventListener('click', () => {
            if (selectedSlotTarget.lineupKey && selectedSlotTarget.pos) {
                if (lineups[selectedSlotTarget.lineupKey]) {
                    lineups[selectedSlotTarget.lineupKey][selectedSlotTarget.pos] = '';
                    saveState();
                    renderRoster();
                    if (activeLineupKey === 'summary') {
                        renderSummaryView();
                    } else {
                        renderActiveLineupSlots();
                        renderCourtBoards();
                    }
                    closeModal();
                    showToast('Paikka tyhjennetty.');
                }
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

        document.getElementById('player-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const formPlayerId = document.getElementById('form-player-id');
            const formName = document.getElementById('form-name');
            const formNumber = document.getElementById('form-number');
            const formPosition = document.getElementById('form-position');
            const formIsLoan = document.getElementById('form-is-loan');
            const formNotes = document.getElementById('form-notes');

            const id = (formPlayerId && formPlayerId.value) ? formPlayerId.value : ('p_' + Date.now());
            const name = formName ? formName.value.trim() : '';
            const number = formNumber ? parseInt(formNumber.value, 10) : NaN;
            const position = formPosition ? formPosition.value : 'H';
            const isLoan = formIsLoan ? formIsLoan.checked : false;
            const notes = formNotes ? formNotes.value.trim() : '';

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

        document.getElementById('team-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const teamNameInput = document.getElementById('team-name-input');
            const name = teamNameInput ? teamNameInput.value.trim() : '';
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

        document.getElementById('btn-add-player')?.addEventListener('click', () => openModal());
        document.getElementById('btn-quick-add')?.addEventListener('click', () => openModal());

        document.getElementById('roster-search')?.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderRoster();
        });

        document.querySelectorAll('.pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter;
                renderRoster();
            });
        });

        document.getElementById('roster-list-container')?.addEventListener('click', (e) => {
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

        document.getElementById('lineup-slots-container')?.addEventListener('click', (e) => {
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

        document.getElementById('btn-clear-pitch')?.addEventListener('click', () => {
            const lName = getLineupName(activeLineupKey);
            if (confirm(`Tyhjennetäänkö ${lName} kaikilta alustoilta?`)) {
                lineups[activeLineupKey] = createEmptyLineupSlots();
                saveState();
                renderActiveLineupSlots();
                renderCourtBoards();
                showToast('Kentällinen tyhjennetty.');
            }
        });

        document.getElementById('btn-toggle-labels')?.addEventListener('click', () => {
            const labelModeText = document.getElementById('label-mode-text');
            if (labelMode === 'full') {
                labelMode = 'num';
                if (labelModeText) labelModeText.textContent = '# Vain';
            } else if (labelMode === 'num') {
                labelMode = 'name';
                if (labelModeText) labelModeText.textContent = 'Nimi vain';
            } else {
                labelMode = 'full';
                if (labelModeText) labelModeText.textContent = 'Nimi & #';
            }
            renderCourtBoards();
        });

        document.getElementById('btn-export-text')?.addEventListener('click', exportLineupsToClipboard);
        document.getElementById('btn-copy-this-lineup')?.addEventListener('click', exportLineupsToClipboard);
        document.getElementById('btn-copy-all-summary')?.addEventListener('click', exportLineupsToClipboard);

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => {
                const page = getCurrentPage();
                if (page && page.courts) {
                    page.courts.forEach(court => {
                        initCourtBoardInstance(court.id);
                    });
                }
            });
        }
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

})();
