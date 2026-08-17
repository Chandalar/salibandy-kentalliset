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
        { 
            id: 'team_edustus', 
            name: 'Edustusjoukkue',
            logo: '🦁',
            primaryColor: '#2563eb',
            mvColor: '#10b981',
            tokenStyle: 'circle',
            arenaName: 'Kotiareena',
            rinkColor: 'black',
            showCourtLogo: true,
            matchInfo: { opponent: '', time: '', meta: '', showBanner: false }
        },
        { 
            id: 'team_junnut', 
            name: 'A-Juniorit',
            logo: '⚡',
            primaryColor: '#dc2626',
            mvColor: '#eab308',
            tokenStyle: 'circle',
            arenaName: 'Junnuareena',
            rinkColor: 'black',
            showCourtLogo: true,
            matchInfo: { opponent: '', time: '', meta: '', showBanner: false }
        }
    ];

    const DEFAULT_ROSTER = [
        // 🟢 Maalivahdit (Vihreät laput)
        { id: 'p_mv23', name: 'Matias V', number: 23, position: 'MV', isLoan: false, notes: 'In 👍' },
        { id: 'p_mv45', name: 'Jussi V', number: 45, position: 'MV', isLoan: false, notes: 'In 👍' },
        { id: 'p_mv7', name: 'Sami P', number: 7, position: 'MV', isLoan: false, notes: 'Out 👎' },
        { id: 'p_mv3', name: 'Mika A', number: 3, position: 'MV', isLoan: false, notes: '?' },

        // 🔵 Kenttäpelaajat (Siniset laput - In 👍)
        { id: 'p_19', name: 'Aaltonen', number: 19, position: 'VP', isLoan: false, notes: 'In 👍' },
        { id: 'p_20', name: 'Veikka', number: 20, position: 'OP', isLoan: false, notes: 'In 👍' },
        { id: 'p_42', name: 'Henri K', number: 42, position: 'KH', isLoan: false, notes: 'In 👍' },
        { id: 'p_64', name: 'Onni V', number: 64, position: 'VH', isLoan: false, notes: 'In 👍' },
        { id: 'p_71', name: 'Masto', number: 71, position: 'VP', isLoan: false, notes: 'In 👍' },
        { id: 'p_4', name: 'Joona R', number: 4, position: 'OP', isLoan: false, notes: 'In 👍' },
        { id: 'p_55', name: 'Vesa H', number: 55, position: 'KH', isLoan: false, notes: 'In 👍' },
        { id: 'p_11', name: 'Juki', number: 11, position: 'VH', isLoan: false, notes: 'In 👍' },
        { id: 'p_2', name: 'Nikou', number: 2, position: 'OH', isLoan: false, notes: 'In 👍' },
        { id: 'p_88', name: 'Jerker B', number: 88, position: 'OH', isLoan: false, notes: 'In 👍' },

        // 🔵 Kenttäpelaajat (Siniset laput - Out 👎)
        { id: 'p_21', name: 'Niko A', number: 21, position: 'VH', isLoan: false, notes: 'Out 👎' },
        { id: 'p_13', name: 'Joni V', number: 13, position: 'OH', isLoan: false, notes: 'Out 👎' },
        { id: 'p_10', name: 'Eino A', number: 10, position: 'KH', isLoan: false, notes: 'Out 👎' },
        { id: 'p_15', name: 'Akseli', number: 15, position: 'VH', isLoan: false, notes: 'Out 👎' },
        { id: 'p_22', name: 'Petri V', number: 22, position: 'VP', isLoan: false, notes: 'Out 👎' },
        { id: 'p_87', name: 'Heikki H', number: 87, position: 'OH', isLoan: false, notes: 'Out 👎' },

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
        { id: 'custom', name: '📐 Taktiikka', type: 'preset' },
        { id: 'freeform', name: '🎨 Vapaapiirto', type: 'preset' }
    ];

    const DEFAULT_LINEUPS = {
        '1': { MV: 'p_mv23', VP: 'p_19', OP: 'p_20', VH: 'p_64', KH: 'p_42', OH: 'p_88', VM: '' },
        '2': { MV: 'p_mv45', VP: 'p_71', OP: 'p_4', VH: 'p_11', KH: 'p_55', OH: 'p_2', VM: '' },
        '3': { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '', VM: '' },
        'yv': { MV: 'p_mv23', VP: 'p_19', OP: 'p_42', VH: 'p_64', KH: 'p_55', OH: 'p_88', VM: '' },
        'av': { MV: 'p_mv23', VP: 'p_20', OP: 'p_71', VH: '', KH: 'p_42', OH: '', VM: '' },
        '6v5': { MV: '', VP: 'p_19', OP: 'p_20', VH: 'p_64', KH: 'p_42', OH: 'p_88', VM: '' },
        'custom': { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '', VM: '' },
        'freeform': { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '', VM: '' }
    };

    const DEFAULT_POS_COORDS = {
        horizontal: {
            MV: { x: 12, y: 50 },
            VP: { x: 28, y: 30 },
            OP: { x: 28, y: 70 },
            VH: { x: 65, y: 25 },
            KH: { x: 60, y: 50 },
            OH: { x: 65, y: 75 },
            VM: { x: 50, y: 92 }
        },
        vertical: {
            MV: { x: 50, y: 88 },
            VP: { x: 30, y: 72 },
            OP: { x: 70, y: 72 },
            VH: { x: 25, y: 35 },
            KH: { x: 50, y: 40 },
            OH: { x: 75, y: 35 },
            VM: { x: 90, y: 50 }
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

    if (Array.isArray(teams)) {
        teams.forEach(t => {
            if (!t.logo) {
                t.logo = (t.id === 'team_edustus') ? '🦁' : ((t.id === 'team_junnut') ? '⚡' : '🏑');
            }
            if (!t.primaryColor) t.primaryColor = (t.id === 'team_junnut') ? '#dc2626' : '#2563eb';
            if (!t.mvColor) t.mvColor = (t.id === 'team_junnut') ? '#eab308' : '#10b981';
            if (!t.tokenStyle) t.tokenStyle = 'circle';
            if (!t.rinkColor) t.rinkColor = 'black';
            if (t.showCourtLogo === undefined) t.showCourtLogo = true;
        });
    }

    cleanCorruptedUserTeams();

    let roster = loadRosterForTeam(currentTeamId);
    let lineupConfigs = loadLineupConfigs(currentTeamId);
    let lineups = loadLineupsForTeam(currentTeamId, lineupConfigs);
    let lineupReserves = loadFromStorage(`salibandy_reserves_${currentTeamId}`, {});
    
    let lineupDrawings = loadFromStorage(`salibandy_drawings_${currentTeamId}`, {});
    lineupDrawings = sanitizeDrawings(lineupDrawings);

    let lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});
    let lineupBalls = loadFromStorage(`salibandy_balls_${currentTeamId}`, { '1_p1_c1': [{ id: 'ball_default', x: 55, y: 50 }] });
    let lineupCones = loadFromStorage(`salibandy_cones_${currentTeamId}`, {});
    let lineupOpponents = loadFromStorage(`salibandy_opponents_${currentTeamId}`, {});
    let lineupExtraPlayers = loadFromStorage(`salibandy_extra_players_${currentTeamId}`, {});
    let lineupTextNotes = loadFromStorage(`salibandy_text_notes_${currentTeamId}`, {});
    let lineupGridPaper = loadFromStorage(`salibandy_grid_paper_${currentTeamId}`, {});
    let lineupPages = loadFromStorage(`salibandy_pages_${currentTeamId}`, {});

    let activeLineupKey = '1';
    let activePageId = 'p1';
    let activeFilters = new Set(['all']);
    let activeFilter = 'all';
    let searchQuery = '';
    let labelMode = loadFromStorage('salibandy_label_mode', 'full');
    let appTheme = loadFromStorage('salibandy_theme', 'dark');
    let courtColor = loadFromStorage('salibandy_court_color', 'blue');
    let orientationMode = (typeof window !== 'undefined' && window.innerWidth <= 600) ? 'vertical' : 'horizontal';
    let activeSelectedElementId = null;

    let isViewerMode = false;
    let currentSharedTeamId = null;
    let unsubscribeSharedTeam = null;

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

    function renderCourtWatermarkHtml(curTeam) {
        if (!curTeam || curTeam.showCourtLogo === false || !curTeam.logo) return '';
        if (curTeam.logo.startsWith('data:image') || curTeam.logo.startsWith('http')) {
            return `<img src="${escapeHtml(curTeam.logo)}" alt="Logo watermark">`;
        }
        return `<span class="watermark-emoji">${escapeHtml(curTeam.logo)}</span>`;
    }

    function applyThemeAndSettings() {
        if (typeof document === 'undefined') return;

        // Theme
        if (appTheme === 'system') {
            const prefersDark = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', appTheme);
        }

        // Court Color
        document.body.setAttribute('data-court-color', courtColor);
        document.querySelectorAll('.pitch-container').forEach(c => {
            c.setAttribute('data-court-color', courtColor);
        });

        // Label mode toolbar button text
        const labelModeText = document.getElementById('label-mode-text');
        if (labelModeText) {
            const labelsMap = {
                photo: 'Kuva 📷',
                full: 'Nimi & #',
                num: '# Vain',
                name: 'Nimi vain'
            };
            labelModeText.textContent = labelsMap[labelMode] || 'Nimi & #';
        }

        const curTeam = teams.find(t => t.id === currentTeamId) || {};

        // Dynamic Team Jersey Colors
        document.documentElement.style.setProperty('--team-primary-color', curTeam.primaryColor || '#2563eb');
        document.documentElement.style.setProperty('--team-mv-color', curTeam.mvColor || '#10b981');

        // Header Team Logo
        const logoWrapper = document.getElementById('header-team-logo-wrapper');
        if (logoWrapper) {
            if (curTeam.logo) {
                if (curTeam.logo.startsWith('data:image') || curTeam.logo.startsWith('http')) {
                    logoWrapper.innerHTML = `<img src="${escapeHtml(curTeam.logo)}" class="header-team-logo-img" alt="Logo">`;
                } else {
                    logoWrapper.innerHTML = `<span class="header-team-logo-emoji">${escapeHtml(curTeam.logo)}</span>`;
                }
            } else {
                logoWrapper.innerHTML = `<div class="logo-icon">🏑</div>`;
            }
        }

        // Match Info Banner
        const matchBanner = document.getElementById('match-info-banner');
        const matchTitle = document.getElementById('match-title-text');
        const matchMeta = document.getElementById('match-meta-text');
        const mInfo = curTeam.matchInfo || {};
        if (matchBanner) {
            if (mInfo.showBanner && (mInfo.opponent || mInfo.time || mInfo.meta)) {
                matchBanner.style.display = 'flex';
                if (matchTitle) matchTitle.textContent = mInfo.opponent ? mInfo.opponent : 'Ottelu';
                if (matchMeta) {
                    const parts = [];
                    if (mInfo.time) parts.push(mInfo.time);
                    if (mInfo.meta) parts.push(mInfo.meta);
                    matchMeta.textContent = parts.join(' • ') || (curTeam.arenaName || '');
                }
            } else {
                matchBanner.style.display = 'none';
            }
        }

        // Update settings modal buttons
        document.querySelectorAll('.theme-opt-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.theme === appTheme);
        });
        document.querySelectorAll('.color-swatch-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.courtColor === courtColor);
        });
        document.querySelectorAll('.label-opt-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.label === labelMode);
        });
    }

    function openSettingsModal() {
        applyThemeAndSettings();
        document.getElementById('settings-modal')?.classList.add('active');
    }

    function exportBackupJson() {
        const backupData = {
            version: 'salibandy_v27.0',
            exportDate: new Date().toISOString(),
            teams: teams,
            currentTeamId: currentTeamId,
            theme: appTheme,
            courtColor: courtColor,
            labelMode: labelMode,
            data: {}
        };

        teams.forEach(t => {
            const tId = t.id;
            backupData.data[tId] = {
                roster: (tId === currentTeamId) ? roster : loadRosterForTeam(tId),
                lineupConfigs: (tId === currentTeamId) ? lineupConfigs : loadLineupConfigs(tId),
                lineups: (tId === currentTeamId) ? lineups : loadLineupsForTeam(tId, loadLineupConfigs(tId)),
                reserves: (tId === currentTeamId) ? lineupReserves : loadFromStorage(`salibandy_reserves_${tId}`, {}),
                drawings: (tId === currentTeamId) ? lineupDrawings : loadFromStorage(`salibandy_drawings_${tId}`, {}),
                positions: (tId === currentTeamId) ? lineupCourtPositions : loadFromStorage(`salibandy_positions_${tId}`, {}),
                balls: (tId === currentTeamId) ? lineupBalls : loadFromStorage(`salibandy_balls_${tId}`, {}),
                cones: (tId === currentTeamId) ? lineupCones : loadFromStorage(`salibandy_cones_${tId}`, {}),
                opponents: (tId === currentTeamId) ? lineupOpponents : loadFromStorage(`salibandy_opponents_${tId}`, {}),
                extraPlayers: (tId === currentTeamId) ? lineupExtraPlayers : loadFromStorage(`salibandy_extra_players_${tId}`, {}),
                textNotes: (tId === currentTeamId) ? lineupTextNotes : loadFromStorage(`salibandy_text_notes_${tId}`, {}),
                pages: (tId === currentTeamId) ? lineupPages : loadFromStorage(`salibandy_pages_${tId}`, {})
            };
        });

        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `Salibandy_Kentalliset_Varmuuskopio_${dStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Varmuuskopio ladattu onnistuneesti! 💾');
    }

    function restoreBackupJson(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.teams || !Array.isArray(data.teams)) {
                    alert('Tiedosto ei ole kelvollinen Salibandyn Kentälliset -varmuuskopio.');
                    return;
                }

                if (confirm(`Palautetaanko varmuuskopio (${data.teams.length} joukkuetta)? Nykyiset tiedot korvataan.`)) {
                    teams = data.teams;
                    currentTeamId = data.currentTeamId || teams[0].id;
                    if (data.theme) appTheme = data.theme;
                    if (data.courtColor) courtColor = data.courtColor;
                    if (data.labelMode) labelMode = data.labelMode;

                    localStorage.setItem('salibandy_teams_v1', JSON.stringify(teams));
                    localStorage.setItem('salibandy_active_team_id', JSON.stringify(currentTeamId));
                    localStorage.setItem('salibandy_theme', JSON.stringify(appTheme));
                    localStorage.setItem('salibandy_court_color', JSON.stringify(courtColor));
                    localStorage.setItem('salibandy_label_mode', JSON.stringify(labelMode));

                    if (data.data) {
                        Object.keys(data.data).forEach(tId => {
                            const tObj = data.data[tId];
                            if (tObj.roster) localStorage.setItem(`salibandy_roster_${tId}`, JSON.stringify(tObj.roster));
                            if (tObj.lineupConfigs) localStorage.setItem(`salibandy_lineup_configs_${tId}`, JSON.stringify(tObj.lineupConfigs));
                            if (tObj.lineups) localStorage.setItem(`salibandy_lineups_${tId}`, JSON.stringify(tObj.lineups));
                            if (tObj.reserves) localStorage.setItem(`salibandy_reserves_${tId}`, JSON.stringify(tObj.reserves));
                            if (tObj.drawings) localStorage.setItem(`salibandy_drawings_${tId}`, JSON.stringify(tObj.drawings));
                            if (tObj.positions) localStorage.setItem(`salibandy_positions_${tId}`, JSON.stringify(tObj.positions));
                            if (tObj.balls) localStorage.setItem(`salibandy_balls_${tId}`, JSON.stringify(tObj.balls));
                            if (tObj.cones) localStorage.setItem(`salibandy_cones_${tId}`, JSON.stringify(tObj.cones));
                            if (tObj.opponents) localStorage.setItem(`salibandy_opponents_${tId}`, JSON.stringify(tObj.opponents));
                            if (tObj.extraPlayers) localStorage.setItem(`salibandy_extra_players_${tId}`, JSON.stringify(tObj.extraPlayers));
                            if (tObj.textNotes) localStorage.setItem(`salibandy_text_notes_${tId}`, JSON.stringify(tObj.textNotes));
                            if (tObj.pages) localStorage.setItem(`salibandy_pages_${tId}`, JSON.stringify(tObj.pages));
                        });
                    }

                    applyThemeAndSettings();
                    switchTeam(currentTeamId);
                    closeModal();
                    showToast('Varmuuskopio palautettu onnistuneesti! 🎉');
                }
            } catch (err) {
                console.error('Backup restore error:', err);
                alert('Virhe varmuuskopion lukemisessa: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    function getShareIdForCurrentTeam() {
        let curTeam = teams.find(t => t.id === currentTeamId);
        if (!curTeam) return 'team_share_' + currentTeamId;
        if (!curTeam.shareId) {
            curTeam.shareId = 'st_' + currentTeamId.replace(/[^a-zA-Z0-9]/g, '') + '_' + Math.random().toString(36).substr(2, 6);
            saveStateLocalOnly();
        }
        return curTeam.shareId;
    }

    function openShareModal() {
        const curTeam = teams.find(t => t.id === currentTeamId);
        const teamName = curTeam ? curTeam.name : 'Joukkue';
        const shareId = getShareIdForCurrentTeam();

        const teamLabel = document.getElementById('share-team-name-label');
        if (teamLabel) teamLabel.textContent = teamName;

        const baseUrl = (typeof window !== 'undefined') ? `${window.location.origin}${window.location.pathname}` : 'https://kokoonpano.web.app/';
        const coachUrl = `${baseUrl}?teamShare=${shareId}&role=coach`;
        const viewerUrl = `${baseUrl}?teamShare=${shareId}&role=viewer`;

        const coachInput = document.getElementById('share-link-coach');
        const viewerInput = document.getElementById('share-link-viewer');
        if (coachInput) coachInput.value = coachUrl;
        if (viewerInput) viewerInput.value = viewerUrl;

        pushSharedTeamToCloud(shareId, curTeam);

        document.getElementById('share-modal')?.classList.add('active');
    }

    function pushSharedTeamToCloud(shareId, teamObj) {
        if (typeof window !== 'undefined' && window.SalibandyFirebase && window.SalibandyFirebase.isReady()) {
            const db = window.SalibandyFirebase.getDb();
            const serverTs = (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue) ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date();
            const payload = {
                shareId: shareId,
                teamId: currentTeamId,
                teamName: teamObj ? teamObj.name : 'Joukkue',
                updatedAt: serverTs,
                roster: roster,
                lineupConfigs: lineupConfigs,
                lineups: lineups,
                drawings: lineupDrawings,
                positions: lineupCourtPositions,
                balls: lineupBalls,
                cones: lineupCones,
                opponents: lineupOpponents,
                extraPlayers: lineupExtraPlayers,
                pages: lineupPages
            };
            db.collection('shared_teams').doc(shareId).set(payload, { merge: true }).catch(err => {
                console.warn('Share Firestore write warning:', err);
            });
        }
    }

    function checkUrlSharing() {
        if (typeof window === 'undefined' || !window.location.search) return;
        const params = new URLSearchParams(window.location.search);
        const teamShareId = params.get('teamShare');
        const role = params.get('role') || 'coach';

        if (teamShareId) {
            currentSharedTeamId = teamShareId;
            isViewerMode = (role === 'viewer');

            if (isViewerMode) {
                const banner = document.getElementById('viewer-mode-banner');
                if (banner) banner.style.display = 'block';
                document.body.classList.add('viewer-mode');
            }

            listenToSharedTeamFirestore(teamShareId);
        }
    }

    function listenToSharedTeamFirestore(shareId) {
        if (!window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) {
            setTimeout(() => listenToSharedTeamFirestore(shareId), 500);
            return;
        }

        const db = window.SalibandyFirebase.getDb();
        if (unsubscribeSharedTeam) unsubscribeSharedTeam();

        unsubscribeSharedTeam = db.collection('shared_teams').doc(shareId).onSnapshot(doc => {
            if (!doc.exists) {
                showToast('Jaettua joukkuetta ei löytynyt pilvestä.');
                return;
            }
            const data = doc.data();
            if (!data) return;

            const sharedTeamName = data.teamName || 'Jaettu joukkue';
            let foundTeam = teams.find(t => t.id === 'shared_' + shareId);
            if (!foundTeam) {
                foundTeam = { id: 'shared_' + shareId, name: '🤝 ' + sharedTeamName, shareId: shareId };
                teams.push(foundTeam);
            } else {
                foundTeam.name = '🤝 ' + sharedTeamName;
            }
            currentTeamId = foundTeam.id;

            if (data.roster) roster = data.roster;
            if (data.lineupConfigs) lineupConfigs = data.lineupConfigs;
            if (data.lineups) lineups = data.lineups;
            if (data.drawings) lineupDrawings = sanitizeDrawings(data.drawings);
            if (data.positions) lineupCourtPositions = data.positions;
            if (data.balls) lineupBalls = data.balls;
            if (data.cones) lineupCones = data.cones;
            if (data.opponents) lineupOpponents = data.opponents;
            if (data.extraPlayers) lineupExtraPlayers = data.extraPlayers;
            if (data.pages) lineupPages = data.pages;

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
            showToast(`Joukkue '${sharedTeamName}' synkronoitu reaaliajassa! ⚡`);
        }, err => {
            console.warn('Shared team listener error:', err);
        });
    }

    // ==========================================
    // INITIALIZATION & REAL-TIME FIREBASE SYNC SETUP
    // ==========================================
    function init() {
        applyThemeAndSettings();

        renderTeamDropdown();
        renderTabs();
        renderTacticalPageBadges();
        bindEvents();
        initFirebaseAuth();
        checkUrlSharing();
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
            
            auth.getRedirectResult().then((result) => {
                if (result && result.user) {
                    currentUser = result.user;
                    updateAuthUI();
                    showToast(`Kirjauduttu sisään Google-tilillä: ${result.user.email} 🎉`);
                    listenToCloudFirestore(result.user);
                }
            }).catch((error) => {
                console.warn('Redirect auth result error:', error);
            });

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
        const reservesMap = {};
        const drawingsMap = {};
        const positionsMap = {};
        const ballsMap = {};
        const conesMap = {};
        const opponentsMap = {};
        const extraPlayersMap = {};
        const textNotesMap = {};
        const gridPaperMap = {};
        const pagesMap = {};

        teams.forEach(t => {
            const tId = t.id;
            rostersMap[tId] = (tId === currentTeamId) ? roster : loadRosterForTeam(tId);
            configsMap[tId] = (tId === currentTeamId) ? lineupConfigs : loadLineupConfigs(tId);
            lineupsMap[tId] = (tId === currentTeamId) ? lineups : loadLineupsForTeam(tId, configsMap[tId]);
            reservesMap[tId] = (tId === currentTeamId) ? lineupReserves : loadFromStorage(`salibandy_reserves_${tId}`, {});
            drawingsMap[tId] = (tId === currentTeamId) ? lineupDrawings : loadFromStorage(`salibandy_drawings_${tId}`, {});
            positionsMap[tId] = (tId === currentTeamId) ? lineupCourtPositions : loadFromStorage(`salibandy_positions_${tId}`, {});
            ballsMap[tId] = (tId === currentTeamId) ? lineupBalls : loadFromStorage(`salibandy_balls_${tId}`, {});
            conesMap[tId] = (tId === currentTeamId) ? lineupCones : loadFromStorage(`salibandy_cones_${tId}`, {});
            opponentsMap[tId] = (tId === currentTeamId) ? lineupOpponents : loadFromStorage(`salibandy_opponents_${tId}`, {});
            extraPlayersMap[tId] = (tId === currentTeamId) ? lineupExtraPlayers : loadFromStorage(`salibandy_extra_players_${tId}`, {});
            textNotesMap[tId] = (tId === currentTeamId) ? lineupTextNotes : loadFromStorage(`salibandy_text_notes_${tId}`, {});
            gridPaperMap[tId] = (tId === currentTeamId) ? lineupGridPaper : loadFromStorage(`salibandy_grid_paper_${tId}`, {});
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
            reserves: reservesMap,
            drawings: drawingsMap,
            positions: positionsMap,
            balls: ballsMap,
            cones: conesMap,
            opponents: opponentsMap,
            extraPlayers: extraPlayersMap,
            textNotes: textNotesMap,
            gridPaper: gridPaperMap,
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
            if (cloudData.reserves) {
                Object.keys(cloudData.reserves).forEach(tId => {
                    localStorage.setItem(`salibandy_reserves_${tId}`, JSON.stringify(cloudData.reserves[tId]));
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
            if (cloudData.extraPlayers) {
                Object.keys(cloudData.extraPlayers).forEach(tId => {
                    localStorage.setItem(`salibandy_extra_players_${tId}`, JSON.stringify(cloudData.extraPlayers[tId]));
                });
            }
            if (cloudData.textNotes) {
                Object.keys(cloudData.textNotes).forEach(tId => {
                    localStorage.setItem(`salibandy_text_notes_${tId}`, JSON.stringify(cloudData.textNotes[tId]));
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
            lineupReserves = loadFromStorage(`salibandy_reserves_${currentTeamId}`, {});
            lineupDrawings = loadFromStorage(`salibandy_drawings_${currentTeamId}`, {});
            lineupDrawings = sanitizeDrawings(lineupDrawings);
            lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});
            lineupBalls = loadFromStorage(`salibandy_balls_${currentTeamId}`, {});
            lineupCones = loadFromStorage(`salibandy_cones_${currentTeamId}`, {});
            lineupOpponents = loadFromStorage(`salibandy_opponents_${currentTeamId}`, {});
            lineupExtraPlayers = loadFromStorage(`salibandy_extra_players_${currentTeamId}`, {});
            lineupTextNotes = loadFromStorage(`salibandy_text_notes_${currentTeamId}`, {});
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
        return (stored && Array.isArray(stored)) ? stored : [];
    }

    function createEmptyLineupSlots() {
        return { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '', VM: '' };
    }

    function loadLineupsForTeam(teamId, configs) {
        const stored = loadFromStorage(`salibandy_lineups_${teamId}`, null);
        if (stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
            if (configs && Array.isArray(configs)) {
                configs.forEach(c => {
                    if (!stored[c.id]) {
                        stored[c.id] = createEmptyLineupSlots();
                    } else if (stored[c.id].VM === undefined) {
                        stored[c.id].VM = '';
                    }
                });
            }
            return stored;
        }

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
        } else {
            // Ensure preset tab freeform exists
            if (!configs.some(c => c.id === 'freeform')) {
                configs.push({ id: 'freeform', name: '🎨 Vapaapiirto', type: 'preset' });
                localStorage.setItem(`salibandy_lineup_configs_${teamId}`, JSON.stringify(configs));
            }
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
            localStorage.setItem(`salibandy_reserves_${currentTeamId}`, JSON.stringify(lineupReserves));
            localStorage.setItem(`salibandy_drawings_${currentTeamId}`, JSON.stringify(lineupDrawings));
            localStorage.setItem(`salibandy_positions_${currentTeamId}`, JSON.stringify(lineupCourtPositions));
            localStorage.setItem(`salibandy_balls_${currentTeamId}`, JSON.stringify(lineupBalls));
            localStorage.setItem(`salibandy_cones_${currentTeamId}`, JSON.stringify(lineupCones));
            localStorage.setItem(`salibandy_opponents_${currentTeamId}`, JSON.stringify(lineupOpponents));
            localStorage.setItem(`salibandy_extra_players_${currentTeamId}`, JSON.stringify(lineupExtraPlayers));
            localStorage.setItem(`salibandy_text_notes_${currentTeamId}`, JSON.stringify(lineupTextNotes));
            localStorage.setItem(`salibandy_grid_paper_${currentTeamId}`, JSON.stringify(lineupGridPaper));
            localStorage.setItem(`salibandy_pages_${currentTeamId}`, JSON.stringify(lineupPages));
        } catch (e) {
            console.error('LocalStorage save error', e);
        }
    }

    function getPosReserves(lineupKey, pos) {
        if (!lineupReserves) lineupReserves = {};
        if (!lineupReserves[lineupKey]) lineupReserves[lineupKey] = {};
        if (!Array.isArray(lineupReserves[lineupKey][pos])) lineupReserves[lineupKey][pos] = [];
        return lineupReserves[lineupKey][pos];
    }

    function addPosReserve(lineupKey, pos, playerId) {
        if (!playerId) return;
        const list = getPosReserves(lineupKey, pos);
        if (!list.includes(playerId)) {
            list.push(playerId);
            saveState();
        }
    }

    function removePosReserve(lineupKey, pos, playerId) {
        const list = getPosReserves(lineupKey, pos);
        const idx = list.indexOf(playerId);
        if (idx >= 0) {
            list.splice(idx, 1);
            saveState();
        }
    }

    function getGeneralReserves(lineupKey) {
        if (!lineupReserves) lineupReserves = {};
        if (!lineupReserves[lineupKey]) lineupReserves[lineupKey] = {};
        if (!Array.isArray(lineupReserves[lineupKey].general)) lineupReserves[lineupKey].general = [];
        return lineupReserves[lineupKey].general;
    }

    function addGeneralReserve(lineupKey, playerId) {
        if (!playerId) return;
        const list = getGeneralReserves(lineupKey);
        if (!list.includes(playerId)) {
            list.push(playerId);
            saveState();
        }
    }

    function removeGeneralReserve(lineupKey, playerId) {
        const list = getGeneralReserves(lineupKey);
        const idx = list.indexOf(playerId);
        if (idx >= 0) {
            list.splice(idx, 1);
            saveState();
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
        lineupReserves = loadFromStorage(`salibandy_reserves_${currentTeamId}`, {});
        lineupDrawings = loadFromStorage(`salibandy_drawings_${currentTeamId}`, {});
        lineupDrawings = sanitizeDrawings(lineupDrawings);
        lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});
        lineupBalls = loadFromStorage(`salibandy_balls_${currentTeamId}`, {});
        lineupCones = loadFromStorage(`salibandy_cones_${currentTeamId}`, {});
        lineupOpponents = loadFromStorage(`salibandy_opponents_${currentTeamId}`, {});
        lineupExtraPlayers = loadFromStorage(`salibandy_extra_players_${currentTeamId}`, {});
        lineupTextNotes = loadFromStorage(`salibandy_text_notes_${currentTeamId}`, {});
        lineupGridPaper = loadFromStorage(`salibandy_grid_paper_${currentTeamId}`, {});
        lineupPages = loadFromStorage(`salibandy_pages_${currentTeamId}`, {});

        activePageId = 'p1';

        if (activeLineupKey !== 'summary' && !lineupConfigs.some(c => c.id === activeLineupKey)) {
            activeLineupKey = lineupConfigs[0] ? lineupConfigs[0].id : '1';
        }

        saveState();

        applyThemeAndSettings();
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
            localStorage.removeItem(`salibandy_reserves_${deleteId}`);
            localStorage.removeItem(`salibandy_drawings_${deleteId}`);
            localStorage.removeItem(`salibandy_positions_${deleteId}`);
            localStorage.removeItem(`salibandy_balls_${deleteId}`);
            localStorage.removeItem(`salibandy_cones_${deleteId}`);
            localStorage.removeItem(`salibandy_opponents_${deleteId}`);
            localStorage.removeItem(`salibandy_extra_players_${deleteId}`);
            localStorage.removeItem(`salibandy_text_notes_${deleteId}`);
            localStorage.removeItem(`salibandy_grid_paper_${deleteId}`);
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
            if (config.id === 'freeform') btn.classList.add('highlight-freeform');

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
        const mainWorkspace = document.querySelector('.main-workspace');

        const isDrawingOnlyTab = (activeLineupKey === 'custom' || activeLineupKey === 'freeform');

        if (activeLineupKey === 'summary') {
            if (rosterPanelSection) rosterPanelSection.style.display = 'none';
            if (pitchPanelSection) pitchPanelSection.style.display = 'none';
            if (lineupPanelSection) lineupPanelSection.style.display = 'none';
            if (summaryViewPanel) summaryViewPanel.style.display = 'flex';
            if (mainWorkspace) mainWorkspace.classList.remove('no-right-panel');
            renderSummaryView();
        } else {
            if (rosterPanelSection) rosterPanelSection.style.display = 'flex';
            if (pitchPanelSection) pitchPanelSection.style.display = 'flex';
            if (summaryViewPanel) summaryViewPanel.style.display = 'none';

            if (isDrawingOnlyTab) {
                if (lineupPanelSection) lineupPanelSection.style.display = 'none';
                if (mainWorkspace) mainWorkspace.classList.add('no-right-panel');
            } else {
                if (lineupPanelSection) lineupPanelSection.style.display = 'flex';
                if (mainWorkspace) mainWorkspace.classList.remove('no-right-panel');
                renderActiveLineupSlots();
            }

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
                { id: 'p1', name: 'Sivu 1', courts: [{ id: 'c1', title: 'Kuvio 1' }] }
            ];
        }
        lineupPages[activeLineupKey].forEach((p, idx) => {
            if (!p.courts || !Array.isArray(p.courts) || p.courts.length === 0) {
                p.courts = [{ id: 'c1', title: 'Kuvio 1' }];
            }
        });
        return lineupPages[activeLineupKey];
    }

    function getCurrentPage() {
        const pages = getPagesForActiveLineup();
        let page = pages.find(p => p.id === activePageId);
        if (!page) {
            page = pages[0] || { id: 'p1', name: 'Sivu 1', courts: [{ id: 'c1', title: 'Kuvio 1' }] };
            activePageId = page.id;
        }
        if (!page.courts || !Array.isArray(page.courts) || page.courts.length === 0) {
            page.courts = [{ id: 'c1', title: 'Kuvio 1' }];
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
            courts: [{ id: 'c1', title: 'Kuvio 1' }]
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
    // VERTICALLY STACKED COURTS / PATTERNS ENGINE (`renderCourtBoards`)
    // ==========================================
    function addCourtToActivePage() {
        const page = getCurrentPage();
        if (!page.courts || !Array.isArray(page.courts)) {
            page.courts = [{ id: 'c1', title: 'Kuvio 1' }];
        }
        const nextNum = page.courts.length + 1;
        const newCourtId = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        page.courts.push({
            id: newCourtId,
            title: `Kuvio ${nextNum}`
        });

        saveState();
        renderCourtBoards();

        requestAnimationFrame(() => {
            const addedCard = document.querySelector(`.court-board-card[data-court-id="${newCourtId}"]`);
            if (addedCard && addedCard.scrollIntoView) {
                addedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        showToast(`Uusi kuvio lisätty alapuolelle! 🏒`);
    }

    function duplicateLastCourtToActivePage() {
        const page = getCurrentPage();
        if (!page.courts || !Array.isArray(page.courts) || page.courts.length === 0) {
            page.courts = [{ id: 'c1', title: 'Kuvio 1' }];
        }

        const sourceCourt = page.courts[page.courts.length - 1];
        duplicateCourtBoard(sourceCourt.id);
    }

    function duplicateCourtBoard(sourceCourtId) {
        const page = getCurrentPage();
        if (!page.courts || !Array.isArray(page.courts)) return;

        const sourceCourt = page.courts.find(c => c.id === sourceCourtId);
        if (!sourceCourt) return;

        const sourceIndex = page.courts.indexOf(sourceCourt);
        const sourceCourtKey = getCourtKey(sourceCourtId);

        const newCourtId = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newCourtKey = getCourtKey(newCourtId);

        const nextNum = page.courts.length + 1;
        const sourceTitle = sourceCourt.title || `Kuvio ${sourceIndex + 1}`;
        const newTitle = sourceTitle.includes('Kuvio') 
            ? `Kuvio ${nextNum} (Vaihe ${nextNum})` 
            : `${sourceTitle} (Kopio)`;

        page.courts.splice(sourceIndex + 1, 0, {
            id: newCourtId,
            title: newTitle,
            description: sourceCourt.description || ''
        });

        // Deep copy drawings
        if (lineupDrawings[sourceCourtKey]) {
            lineupDrawings[newCourtKey] = JSON.parse(JSON.stringify(lineupDrawings[sourceCourtKey])).map(d => {
                d.id = 'd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                return d;
            });
        }

        // Deep copy extra players
        if (lineupExtraPlayers[sourceCourtKey]) {
            lineupExtraPlayers[newCourtKey] = JSON.parse(JSON.stringify(lineupExtraPlayers[sourceCourtKey])).map(p => {
                p.id = 'p_ext_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                return p;
            });
        }

        // Deep copy opponents
        if (lineupOpponents[sourceCourtKey]) {
            lineupOpponents[newCourtKey] = JSON.parse(JSON.stringify(lineupOpponents[sourceCourtKey])).map(o => {
                o.id = 'opp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                return o;
            });
        }

        // Deep copy text notes
        if (lineupTextNotes[sourceCourtKey]) {
            lineupTextNotes[newCourtKey] = JSON.parse(JSON.stringify(lineupTextNotes[sourceCourtKey])).map(t => {
                t.id = 'text_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                return t;
            });
        }

        // Deep copy balls
        if (lineupBalls[sourceCourtKey]) {
            lineupBalls[newCourtKey] = JSON.parse(JSON.stringify(lineupBalls[sourceCourtKey])).map(b => {
                b.id = 'ball_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                return b;
            });
        }

        // Deep copy cones
        if (lineupCones[sourceCourtKey]) {
            lineupCones[newCourtKey] = JSON.parse(JSON.stringify(lineupCones[sourceCourtKey])).map(c => {
                c.id = 'cone_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                return c;
            });
        }

        // Deep copy custom court positions
        if (lineupCourtPositions[sourceCourtKey]) {
            lineupCourtPositions[newCourtKey] = JSON.parse(JSON.stringify(lineupCourtPositions[sourceCourtKey]));
        }

        // Copy grid paper setting
        if (lineupGridPaper[sourceCourtKey] !== undefined) {
            lineupGridPaper[newCourtKey] = lineupGridPaper[sourceCourtKey];
        }

        saveState();
        renderCourtBoards();

        requestAnimationFrame(() => {
            const addedCard = document.querySelector(`.court-board-card[data-court-id="${newCourtId}"]`);
            if (addedCard && addedCard.scrollIntoView) {
                addedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        showToast(`Kuvio kopioitu suoraan alapuolelle! 📋✨`);
    }

    function deleteCourtFromActivePage(courtId) {
        const page = getCurrentPage();
        if (!page.courts || page.courts.length <= 1) {
            showToast('Et voi poistaa ainoaa kuviota sivulta.');
            return;
        }

        const courtObj = page.courts.find(c => c.id === courtId);
        const cTitle = courtObj ? courtObj.title : 'kuvio';

        if (confirm(`Poistetaanko kuvio '${cTitle}'?`)) {
            const courtKey = getCourtKey(courtId);
            delete lineupDrawings[courtKey];
            delete lineupBalls[courtKey];
            delete lineupCones[courtKey];
            delete lineupOpponents[courtKey];
            delete lineupExtraPlayers[courtKey];
            delete lineupTextNotes[courtKey];
            delete lineupCourtPositions[courtKey];

            page.courts = page.courts.filter(c => c.id !== courtId);

            saveState();
            renderCourtBoards();
            showToast(`Kuvio '${cTitle}' poistettu.`);
        }
    }

    function renameCourtBoard(courtId) {
        const page = getCurrentPage();
        const courtObj = page.courts.find(c => c.id === courtId);
        if (!courtObj) return;

        const newTitle = prompt('Syötä kuvion / vaiheen otsikko (esim. Kuvio 1: Karvaus 2-2-1):', courtObj.title || '');
        if (newTitle !== null && newTitle.trim() !== '') {
            courtObj.title = newTitle.trim();
            saveState();
            renderCourtBoards();
            showToast(`Kuvion otsikko päivitetty: '${courtObj.title}' ✏️`);
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
            const isGridPaper = (lineupGridPaper[courtKey] !== undefined) 
                ? !!lineupGridPaper[courtKey] 
                : (activeLineupKey === 'freeform');

            const isFreeform = (activeLineupKey === 'freeform');
            const curTeam = teams.find(t => t.id === currentTeamId) || {};
            const rinkWhiteClass = (curTeam.rinkColor === 'white') ? 'rink-white' : '';

            const card = document.createElement('div');
            card.className = 'court-board-card';
            card.dataset.courtId = courtId;

            card.innerHTML = `
                <div class="court-board-header">
                    <div class="court-board-title">
                        <span>🏒 ${courts.length > 1 ? '#' + (idx + 1) + ' ' : ''}${escapeHtml(court.title || ('Kuvio ' + (idx + 1)))}</span>
                        <button class="btn-xs btn-outline" data-action="rename-court" data-court-id="${courtId}">✏️ Nimeä</button>
                    </div>
                    <div class="court-header-actions">
                        <button class="btn-xs btn-outline highlight-fullscreen" data-action="toggle-fullscreen-court" data-court-id="${courtId}" title="Avaa kuvio koko ruudulle">⛶ Koko ruutu</button>
                        <button class="btn-xs btn-outline" data-action="open-tactical-presets" data-court-id="${courtId}" title="Käytä valmista salibandykuviota (2-2-1, 2-1-2, YV)">⚡ Valmiit kuviot</button>
                        <button class="btn-xs btn-outline" data-action="export-court-png" data-court-id="${courtId}" title="Lataa kuvio terävänä PNG-kuvatiedostona">📸 Lataa kuva</button>
                        <button class="btn-xs btn-outline" data-action="duplicate-court" data-court-id="${courtId}" title="Monista tämä kuvio suoraan alapuolelle">📋 Kopioi kuvio</button>
                        <button class="btn-xs btn-outline" data-action="clear-court-drawings" data-court-id="${courtId}">🧹 Tyhjennä</button>
                        ${courts.length > 1 ? `<button class="btn-xs btn-outline danger-text" data-action="delete-court" data-court-id="${courtId}">🗑️ Poista kuvio</button>` : ''}
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
                        <button class="tool-btn tool-text ${activeTool === 'text' ? 'active' : ''}" data-tool="text" data-court-id="${courtId}" title="Lisää vapaateksti tai taktinen ohje kentälle">
                            📝 Teksti
                        </button>
                    </div>

                    <div class="toolbar-group">
                        <button class="tool-btn highlight-all-players" data-action="populate-all-players" data-court-id="${courtId}" title="Tuo kaikki pelaajaringin pelaajat kentälle">
                            👥 + Kaikki pelaajat
                        </button>
                        <button class="tool-btn highlight-extra-player" data-action="add-extra-player" data-court-id="${courtId}" title="Lisää oma pelaaja kentälle">
                            🔵 + Oma pelaaja
                        </button>
                        <button class="tool-btn highlight-opponent" data-action="add-opponent" data-court-id="${courtId}" title="Lisää vastustaja kentälle">
                            🔴 + Vastustaja
                        </button>
                        <button class="tool-btn highlight-ball" data-action="add-ball" data-court-id="${courtId}" title="Lisää pallo kentälle">
                            <img src="ball.png?v=22.0" width="18" height="18" alt="Pallo" style="vertical-align: middle; display: inline-block;"> + Pallo
                        </button>
                        <button class="tool-btn highlight-cone" data-action="add-cone" data-court-id="${courtId}" title="Lisää harjoitustötterö kentälle">
                            🔶 + Tötterö
                        </button>
                        <button class="tool-btn highlight-grid-paper ${isGridPaper ? 'active' : ''}" data-action="toggle-grid-paper" data-court-id="${courtId}" title="Vaihda ruutupaperipohja / normaali kenttä">
                            📐 Ruutupaperi
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
                    <div class="pitch-container ${orientationMode === 'vertical' ? 'mode-vertical' : 'mode-horizontal'} ${isGridPaper ? 'mode-grid-paper' : ''} ${isFreeform ? 'mode-pure-canvas' : ''} ${rinkWhiteClass}" id="floorball-court-${courtId}">
                        <div class="court-surface"></div>
                        <div class="court-center-line"></div>
                        <div class="center-spot-pink"></div>
                        <div class="center-line-tick tick-left"></div>
                        <div class="center-line-tick tick-right"></div>

                        <div class="court-center-logo-watermark" id="court-logo-watermark-${courtId}">
                            ${renderCourtWatermarkHtml(curTeam)}
                        </div>
                        <div class="court-arena-name-badge" id="court-arena-badge-${courtId}">
                            ${escapeHtml(curTeam.arenaName || '')}
                        </div>

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

                <div class="court-notes-section">
                    <div class="court-notes-header">
                        <span class="court-notes-title">📝 Taktiset ohjeet / Kuvion selite:</span>
                        <span class="court-notes-hint">Kirjoita mitä tässä kuviossa tapahtuu</span>
                    </div>
                    <textarea class="court-notes-textarea" data-action="court-description-input" data-court-id="${courtId}" placeholder="Kirjoita kuvion ohjeet, esim: 1. Sentteri hakee pallon maalin takaa... 2. Pakit levittävät laitoihin...">${escapeHtml(court.description || '')}</textarea>
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
        setCourtDrawingTool(courtId, courtDrawingTools[courtId] || 'select');

        // Drag & drop receiver from left roster panel
        courtContainer.ondragover = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            courtContainer.classList.add('drag-hover-active');
        };

        courtContainer.ondragleave = (e) => {
            if (!courtContainer.contains(e.relatedTarget)) {
                courtContainer.classList.remove('drag-hover-active');
            }
        };

        courtContainer.ondrop = (e) => {
            e.preventDefault();
            courtContainer.classList.remove('drag-hover-active');

            let playerId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
            if (!playerId) return;

            const player = roster.find(p => p.id === playerId);
            if (!player) return;

            const rect = courtContainer.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            let dropPctX = ((e.clientX - rect.left) / rect.width) * 100;
            let dropPctY = ((e.clientY - rect.top) / rect.height) * 100;

            dropPctX = Math.max(4, Math.min(96, Math.round(dropPctX * 10) / 10));
            dropPctY = Math.max(4, Math.min(96, Math.round(dropPctY * 10) / 10));

            const courtKey = getCourtKey(courtId);
            if (!lineupExtraPlayers[courtKey]) lineupExtraPlayers[courtKey] = [];

            const isMv = player.position === 'MV';
            lineupExtraPlayers[courtKey].push({
                id: 'p_ext_' + player.id + '_' + Date.now(),
                playerId: player.id,
                label: '#' + player.number,
                fullName: player.name,
                position: player.position,
                isMv: isMv,
                x: dropPctX,
                y: dropPctY
            });

            saveState();
            renderCourtBoards();
            showToast(`Pelaaja #${player.number} ${player.name} asetettu kentälle! 🏑`);
        };
    }

    function renderCourtNodesForInstance(courtId, layersEl) {
        layersEl.innerHTML = '';
        renderLineupPlayerNodesForInstance(courtId, layersEl);
        renderCourtExtraPlayersForInstance(courtId, layersEl);
        renderCourtBallsForInstance(courtId, layersEl);
        renderCourtConesForInstance(courtId, layersEl);
        renderCourtOpponentsForInstance(courtId, layersEl);
        renderCourtTextNotesForInstance(courtId, layersEl);
        renderCourtRectanglesForInstance(courtId, layersEl);
        renderCourtLineNodesForInstance(courtId, layersEl);
    }

    function renderLineupPlayerNodesForInstance(courtId, layersEl) {
        const currentLineup = lineups[activeLineupKey] || {};
        const posKeys = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH', 'VM'];
        const courtKey = getCourtKey(courtId);
        const curTeam = teams.find(t => t.id === currentTeamId) || {};
        const tokenStyleClass = (curTeam.tokenStyle === 'jersey') ? 'token-style-jersey' : (curTeam.tokenStyle === 'pill' ? 'token-style-pill' : 'token-style-circle');

        posKeys.forEach(pos => {
            const playerId = currentLineup[pos];
            if (!playerId) return;

            const player = roster.find(p => p.id === playerId);
            if (!player) return;

            let defaultCoords = DEFAULT_POS_COORDS[orientationMode][pos] || { x: 50, y: 50 };
            let posKeyStore = `${courtKey}_${pos}_${orientationMode}`;
            let fallbackKeyStore = `${activeLineupKey}_${pos}_${orientationMode}`;
            let coords = lineupCourtPositions[posKeyStore] || lineupCourtPositions[fallbackKeyStore] || defaultCoords;

            const isMv = isPlayerMv(player);
            const isVm = pos === 'VM';
            const node = document.createElement('div');
            node.className = `court-player-node ${isMv ? 'is-mv' : (isVm ? 'is-vm pos-node-vm' : 'is-field')} ${activeSelectedElementId === posKeyStore ? 'is-selected' : ''} ${tokenStyleClass}`;
            node.style.left = coords.x + '%';
            node.style.top = coords.y + '%';

            let labelText = `#${player.number} ${player.name}`;
            if (labelMode === 'num') labelText = '';
            if (labelMode === 'name' || labelMode === 'photo') labelText = player.name;
            if (isVm && labelText) labelText = `🪑 ${labelText}`;

            const showPhoto = (labelMode !== 'num') && !!player.photo;

            let circleInnerHtml = '';
            if (showPhoto) {
                circleInnerHtml = `
                    <div class="node-circle has-player-photo" style="background-image: url('${player.photo}') !important;" title="${escapeHtml(player.name)} - Kaksoisklikkaa muokataksesi">
                        <span class="node-num-tag">#${player.number}</span>
                        <button class="node-remove-btn" data-action="remove-lineup-player" data-pos="${pos}">✕</button>
                    </div>
                `;
            } else {
                circleInnerHtml = `
                    <div class="node-circle" title="${escapeHtml(player.name)} - Kaksoisklikkaa muokataksesi">
                        ${player.number}
                        <button class="node-remove-btn" data-action="remove-lineup-player" data-pos="${pos}">✕</button>
                    </div>
                `;
            }

            node.innerHTML = `
                ${circleInnerHtml}
                ${labelText ? `<div class="node-label">${player.isLoan ? '⭐' : ''} ${escapeHtml(labelText)}</div>` : ''}
            `;

            node.addEventListener('dblclick', (e) => {
                if (e.target.closest('button')) return;
                e.stopPropagation();
                openModal(player);
            });

            setupNodeTouchDragging(node, coords, posKeyStore, courtId, player);
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
                <div class="ball-circle" title="Salibandypallo (Reikäpallo)">
                    <span style="font-size: 0.95rem; line-height: 1;">⚪</span>
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

    function renderCourtExtraPlayersForInstance(courtId, layersEl) {
        const courtKey = getCourtKey(courtId);
        const extraPlayers = lineupExtraPlayers[courtKey] || lineupExtraPlayers[activeLineupKey] || [];
        const curTeam = teams.find(t => t.id === currentTeamId) || {};
        const tokenStyleClass = (curTeam.tokenStyle === 'jersey') ? 'token-style-jersey' : (curTeam.tokenStyle === 'pill' ? 'token-style-pill' : 'token-style-circle');

        extraPlayers.forEach(extraP => {
            const isSelected = activeSelectedElementId === extraP.id;
            let player = null;
            if (extraP.playerId) {
                player = roster.find(p => p.id === extraP.playerId);
            }
            if (!player && extraP.label) {
                const cleanNum = parseInt(String(extraP.label).replace('#', '').trim(), 10);
                if (!isNaN(cleanNum)) {
                    player = roster.find(p => p.number === cleanNum);
                }
            }

            const isMv = player ? isPlayerMv(player) : (extraP.isMv || (extraP.position === 'MV'));
            const extraNode = document.createElement('div');
            extraNode.className = `court-extra-player-node ${isMv ? 'is-mv' : 'is-field'} ${isSelected ? 'is-selected' : ''} ${tokenStyleClass}`;
            extraNode.style.left = extraP.x + '%';
            extraNode.style.top = extraP.y + '%';

            let displayName = '';
            const fullName = player ? player.name : extraP.fullName;
            if (fullName && labelMode !== 'num') {
                displayName = `<span class="extra-player-subname">${escapeHtml(fullName)}</span>`;
            }

            const showPhoto = (labelMode !== 'num') && ((player && player.photo) || extraP.photo);
            const photoUrl = showPhoto ? ((player && player.photo) || extraP.photo) : '';
            let circleInnerHtml = '';
            if (photoUrl) {
                circleInnerHtml = `
                    <div class="extra-player-circle has-player-photo ${isMv ? 'is-mv-circle' : ''}" style="background-image: url('${photoUrl}') !important;" title="${escapeHtml(fullName || 'Oma pelaaja')} - Kaksoisklikkaa muokataksesi">
                        <span class="node-num-tag">${escapeHtml(extraP.label || (player ? '#' + player.number : 'P'))}</span>
                        <button class="extra-player-remove-btn" data-action="remove-extra-player" data-extra-id="${extraP.id}" data-court-id="${courtId}">✕</button>
                    </div>
                `;
            } else {
                circleInnerHtml = `
                    <div class="extra-player-circle ${isMv ? 'is-mv-circle' : ''}" title="${escapeHtml(fullName || 'Oma pelaaja')} - Kaksoisklikkaa muokataksesi">
                        ${escapeHtml(extraP.label || (player ? String(player.number) : 'P'))}
                        <button class="extra-player-remove-btn" data-action="remove-extra-player" data-extra-id="${extraP.id}" data-court-id="${courtId}">✕</button>
                    </div>
                `;
            }

            extraNode.innerHTML = `
                ${circleInnerHtml}
                ${displayName}
            `;

            setupExtraPlayerTouchDragging(extraNode, extraP, courtId, player);
            layersEl.appendChild(extraNode);
        });
    }

    function renderCourtTextNotesForInstance(courtId, layersEl) {
        const courtKey = getCourtKey(courtId);
        const textNotes = lineupTextNotes[courtKey] || lineupTextNotes[activeLineupKey] || [];
        textNotes.forEach(textObj => {
            const isSelected = activeSelectedElementId === textObj.id;
            const textNode = document.createElement('div');
            textNode.className = `court-text-node ${isSelected ? 'is-selected' : ''}`;
            textNode.style.left = textObj.x + '%';
            textNode.style.top = textObj.y + '%';

            textNode.innerHTML = `
                <div class="court-text-box" title="Kaksoisklikkaa muokataksesi. Siirrä vetämällä.">
                    <span class="court-text-content">${escapeHtml(textObj.text)}</span>
                    <button class="text-edit-btn" data-action="edit-text" data-text-id="${textObj.id}" data-court-id="${courtId}" title="Muokkaa tekstiä">✏️</button>
                    <button class="text-remove-btn" data-action="remove-text" data-text-id="${textObj.id}" data-court-id="${courtId}" title="Poista teksti">✕</button>
                </div>
            `;

            setupTextTouchDragging(textNode, textObj, courtId);
            layersEl.appendChild(textNode);
        });
    }

    function setupTextTouchDragging(textNode, textObj, courtId) {
        let isDragging = false;
        let rafId = null;

        const onPointerDown = (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool !== 'select' && tool !== 'text') return;
            selectCourtElement(textObj.id, textNode);
            if (e.target.closest('button')) return;

            isDragging = true;
            try {
                textNode.setPointerCapture(e.pointerId);
            } catch (err) {}

            textNode.addEventListener('pointermove', onPointerMove);
            textNode.addEventListener('pointerup', onPointerUp);
            textNode.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const courtContainer = document.getElementById(`floorball-court-${courtId}`);
            if (!courtContainer) return;

            const rect = courtContainer.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            let newX = ((e.clientX - rect.left) / rect.width) * 100;
            let newY = ((e.clientY - rect.top) / rect.height) * 100;

            newX = Math.max(2, Math.min(98, newX));
            newY = Math.max(2, Math.min(98, newY));

            textObj.x = Math.round(newX * 10) / 10;
            textObj.y = Math.round(newY * 10) / 10;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                textNode.style.left = textObj.x + '%';
                textNode.style.top = textObj.y + '%';
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            textNode.removeEventListener('pointermove', onPointerMove);
            textNode.removeEventListener('pointerup', onPointerUp);
            textNode.removeEventListener('pointercancel', onPointerUp);
            saveState();
        };

        textNode.addEventListener('pointerdown', onPointerDown);
        textNode.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            editCourtTextNote(courtId, textObj.id);
        });
    }

    function editCourtTextNote(courtId, textId) {
        const courtKey = getCourtKey(courtId);
        const list = lineupTextNotes[courtKey] || [];
        const textObj = list.find(t => t.id === textId);
        if (!textObj) return;

        const newText = prompt('Muokkaa tekstiä:', textObj.text);
        if (newText !== null && newText.trim() !== '') {
            textObj.text = newText.trim();
            saveState();
            renderCourtBoards();
            showToast('Teksti päivitetty! ✏️');
        }
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

    function getDrawingStepNum(drawing, drawingIndex, drawingsList) {
        if (drawing.stepNum !== undefined && drawing.stepNum !== null && drawing.stepNum !== '') {
            return String(drawing.stepNum);
        }
        let sameTypeDrawings = (drawingsList || []).filter(d => d.type === drawing.type);
        let idx = sameTypeDrawings.indexOf(drawing);
        return String(idx >= 0 ? (idx + 1) : (drawingIndex + 1));
    }

    function editLineStepNumber(courtId, lineId) {
        const courtKey = getCourtKey(courtId);
        const drawings = lineupDrawings[courtKey] || [];
        const lineObj = drawings.find(d => d.id === lineId);
        if (!lineObj) return;

        const currentNum = getDrawingStepNum(lineObj, 0, drawings);
        const typeLabel = lineObj.type === 'pass' ? 'Syötön' : (lineObj.type === 'shot' ? 'Vedon' : 'Liikkeen');
        const newNum = prompt(`Muokkaa ${typeLabel} numeroa (esim. 1, 2, 3... tai jätä tyhjäksi):`, currentNum);
        if (newNum !== null) {
            lineObj.stepNum = newNum.trim();
            saveState();
            renderCourtBoards();
            showToast(`${typeLabel} numero päivitetty: #${lineObj.stepNum || '-'} ✏️`);
        }
    }

    function renderCourtLineNodesForInstance(courtId, layersEl) {
        const courtKey = getCourtKey(courtId);
        const drawings = lineupDrawings[courtKey] || lineupDrawings[activeLineupKey] || [];
        const lineDrawings = drawings.filter(d => d.type === 'pass' || d.type === 'shot' || d.type === 'run');

        lineDrawings.forEach((lineObj, idx) => {
            const pts = lineObj.pointsPct;
            if (!pts || pts.length < 2) return;

            const stepNum = getDrawingStepNum(lineObj, idx, drawings);
            if (!lineObj.stepNum) lineObj.stepNum = stepNum;

            const startPct = pts[0];
            const endPct = pts[pts.length - 1];
            
            let midPct;
            if (lineObj.type === 'run' && pts.length > 2) {
                const midIdx = Math.floor(pts.length / 2);
                midPct = pts[midIdx];
            } else {
                midPct = {
                    x: (startPct.x + endPct.x) / 2,
                    y: (startPct.y + endPct.y) / 2
                };
            }

            let handleClass = 'pass-handle';
            if (lineObj.type === 'shot') { handleClass = 'shot-handle'; }
            if (lineObj.type === 'run') { handleClass = 'run-handle'; }

            const isSelected = activeSelectedElementId === lineObj.id;

            const lineNode = document.createElement('div');
            lineNode.className = `court-line-node ${isSelected ? 'is-selected' : ''}`;
            lineNode.style.left = midPct.x + '%';
            lineNode.style.top = midPct.y + '%';

            lineNode.innerHTML = `
                <div class="line-number-handle ${handleClass}" title="Vaihe #${stepNum} - Kaksoisklikkaa muokataksesi numeroa. Siirrä vetämällä.">
                    <span class="line-step-num">${escapeHtml(stepNum)}</span>
                    <button class="line-remove-btn" data-action="remove-line" data-line-id="${lineObj.id}" data-court-id="${courtId}" title="Poista viiva">✕</button>
                </div>
            `;

            lineNode.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                editLineStepNumber(courtId, lineObj.id);
            });

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
        document.querySelectorAll('.court-player-node, .court-ball-node, .court-cone-node, .court-opponent-node, .court-text-node, .court-rect-node, .court-line-node, .line-endpoint-handle')
            .forEach(el => el.classList.remove('is-selected'));

        if (elementNode) {
            elementNode.classList.add('is-selected');
        }
    }

    function setupCourtCanvasDrawing(courtId, courtContainer, canvasEl, ctxEl) {
        canvasEl.addEventListener('pointerdown', (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool === 'select') return;

            if (tool === 'text') {
                e.preventDefault();
                const courtRect = courtContainer.getBoundingClientRect();
                let xPct = Math.max(4, Math.min(94, Math.round((((e.clientX - courtRect.left) / courtRect.width) * 100) * 10) / 10));
                let yPct = Math.max(4, Math.min(94, Math.round((((e.clientY - courtRect.top) / courtRect.height) * 100) * 10) / 10));

                const userText = prompt('Kirjoita teksti / ohje kentälle (esim. Karvaus 2-2-1, Apuheitto, Veto):', '');
                if (userText !== null && userText.trim() !== '') {
                    const courtKey = getCourtKey(courtId);
                    if (!lineupTextNotes[courtKey]) lineupTextNotes[courtKey] = [];
                    lineupTextNotes[courtKey].push({
                        id: 'text_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        text: userText.trim(),
                        x: xPct,
                        y: yPct
                    });
                    saveState();
                    renderCourtBoards();
                    showToast('Teksti lisätty kentälle! 📝');
                }
                return;
            }

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

        canvasEl.addEventListener('pointerup', (e) => {
            if (!courtIsDrawingMap[courtId]) return;
            courtIsDrawingMap[courtId] = false;

            try {
                if (canvasEl.hasPointerCapture && canvasEl.hasPointerCapture(e.pointerId)) {
                    canvasEl.releasePointerCapture(e.pointerId);
                }
            } catch (err) {}

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

                    saveState();
                    drawCanvasLinesForInstance(courtId, canvasEl, ctxEl);
                    const layersEl = document.getElementById(`court-players-layer-${courtId}`);
                    if (layersEl) renderCourtNodesForInstance(courtId, layersEl);
                    setCourtDrawingTool(courtId, tool);
                    showToast('Taktinen alue luotu! Työkalu pysyy aktiivisena 🔲');
                } else {
                    let color = '#38bdf8';
                    if (tool === 'pass') color = '#eab308';
                    if (tool === 'shot') color = '#ec4899';

                    const sameTypeLines = (lineupDrawings[courtKey] || []).filter(d => d.type === tool);
                    const nextStepNum = sameTypeLines.length + 1;

                    lineupDrawings[courtKey].push({
                        id: 'draw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        type: tool,
                        stepNum: nextStepNum,
                        pointsPct: [...pathPct],
                        color: color
                    });

                    saveState();
                    drawCanvasLinesForInstance(courtId, canvasEl, ctxEl);
                    const layersEl = document.getElementById(`court-players-layer-${courtId}`);
                    if (layersEl) renderCourtNodesForInstance(courtId, layersEl);
                    setCourtDrawingTool(courtId, tool);
                    showToast(`${tool === 'pass' ? 'Syöttö' : (tool === 'shot' ? 'Veto' : 'Liike')} #${nextStepNum} piirretty! Työkalu pysyy aktiivisena 🏒`);
                }
            }
            courtPathPctMap[courtId] = [];
            drawCanvasLinesForInstance(courtId, canvasEl, ctxEl);
        });

        canvasEl.addEventListener('pointercancel', (e) => {
            courtIsDrawingMap[courtId] = false;
            try {
                if (canvasEl.hasPointerCapture && canvasEl.hasPointerCapture(e.pointerId)) {
                    canvasEl.releasePointerCapture(e.pointerId);
                }
            } catch (err) {}
            courtPathPctMap[courtId] = [];
            drawCanvasLinesForInstance(courtId, canvasEl, ctxEl);
        });
    }

    function drawCanvasLinesForInstance(courtId, canvasEl, ctxEl) {
        ctxEl.clearRect(0, 0, canvasEl.width, canvasEl.height);
        const courtKey = getCourtKey(courtId);
        const currentDrawings = lineupDrawings[courtKey] || lineupDrawings[activeLineupKey] || [];
        currentDrawings.forEach((draw, idx) => {
            if (draw.type !== 'rect') {
                if (!draw.stepNum) {
                    draw.stepNum = getDrawingStepNum(draw, idx, currentDrawings);
                }
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
            let midX, midY;
            if (lineObj.type === 'run' && lineObj.pointsPct.length > 2) {
                const midIdx = Math.floor(lineObj.pointsPct.length / 2);
                midX = lineObj.pointsPct[midIdx].x;
                midY = lineObj.pointsPct[midIdx].y;
            } else {
                midX = (startPct.x + endPct.x) / 2;
                midY = (startPct.y + endPct.y) / 2;
            }

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

    function setupExtraPlayerTouchDragging(extraNode, extraObj, courtId, boundPlayer = null) {
        let isDragging = false;
        let hasMoved = false;
        let startX = 0;
        let startY = 0;
        let rafId = null;
        let lastTapTime = 0;

        const handleEdit = () => {
            let p = boundPlayer;
            if (!p && extraObj.playerId) {
                p = roster.find(item => item.id === extraObj.playerId);
            }
            if (!p && extraObj.label) {
                const cleanNum = parseInt(String(extraObj.label).replace('#', '').trim(), 10);
                if (!isNaN(cleanNum)) {
                    p = roster.find(item => item.number === cleanNum);
                }
            }

            if (p) {
                openModal(p);
            } else {
                const newLabel = prompt('Syötä pelaajan numero tai tunnus (esim. 19, P1, OP):', extraObj.label || 'P');
                if (newLabel !== null && newLabel.trim() !== '') {
                    extraObj.label = newLabel.trim();
                    saveState();
                    renderCourtBoards();
                }
            }
        };

        const onPointerDown = (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool !== 'select') return;
            selectCourtElement(extraObj.id, extraNode);
            if (e.target.classList.contains('extra-player-remove-btn')) return;

            const now = Date.now();
            if (now - lastTapTime < 350) {
                lastTapTime = 0;
                handleEdit();
                return;
            }
            lastTapTime = now;

            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            extraNode.setPointerCapture(e.pointerId);

            extraNode.addEventListener('pointermove', onPointerMove);
            extraNode.addEventListener('pointerup', onPointerUp);
            extraNode.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            if (Math.abs(e.clientX - startX) > 4 || Math.abs(e.clientY - startY) > 4) {
                hasMoved = true;
            }
            e.preventDefault();

            const courtContainer = document.getElementById(`floorball-court-${courtId}`);
            if (!courtContainer) return;

            const rect = courtContainer.getBoundingClientRect();
            let newX = ((e.clientX - rect.left) / rect.width) * 100;
            let newY = ((e.clientY - rect.top) / rect.height) * 100;

            newX = Math.max(3, Math.min(97, newX));
            newY = Math.max(3, Math.min(97, newY));

            extraObj.x = Math.round(newX * 10) / 10;
            extraObj.y = Math.round(newY * 10) / 10;

            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                extraNode.style.left = extraObj.x + '%';
                extraNode.style.top = extraObj.y + '%';
            });
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            if (rafId) cancelAnimationFrame(rafId);
            extraNode.removeEventListener('pointermove', onPointerMove);
            extraNode.removeEventListener('pointerup', onPointerUp);
            extraNode.removeEventListener('pointercancel', onPointerUp);
            if (hasMoved) {
                saveState();
            }
        };

        extraNode.addEventListener('pointerdown', onPointerDown);

        extraNode.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('extra-player-remove-btn')) return;
            e.stopPropagation();
            handleEdit();
        });
    }

    function addExtraPlayerToCourt(courtId) {
        const courtKey = getCourtKey(courtId);
        if (!lineupExtraPlayers[courtKey]) lineupExtraPlayers[courtKey] = [];
        const nextNum = lineupExtraPlayers[courtKey].length + 1;
        const newExtraPlayer = {
            id: 'p_extra_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            label: 'P' + nextNum,
            x: 45,
            y: 50
        };
        lineupExtraPlayers[courtKey].push(newExtraPlayer);
        saveState();
        renderCourtBoards();
        showToast('Oma pelaaja lisätty kentälle! 🔵');
    }

    function populateAllPlayersToCourt(courtId) {
        if (!roster || roster.length === 0) {
            showToast('Pelaajaringissä ei ole pelaajia. Lisää ensin pelaajia vasemmalta!');
            return;
        }

        const courtKey = getCourtKey(courtId);
        if (!lineupExtraPlayers[courtKey]) lineupExtraPlayers[courtKey] = [];

        lineupExtraPlayers[courtKey] = [];

        const isVert = orientationMode === 'vertical';

        roster.forEach((player, idx) => {
            const isMv = player.position === 'MV';
            let x, y;

            if (isVert) {
                // Vertical layout spacing: 4 columns
                const cols = 4;
                const colIdx = idx % cols;
                const rowIdx = Math.floor(idx / cols);
                x = 16 + (colIdx * 23);
                y = 12 + (rowIdx * 12);
            } else {
                // Horizontal layout spacing: 5 columns
                const cols = 5;
                const colIdx = idx % cols;
                const rowIdx = Math.floor(idx / cols);
                x = 12 + (colIdx * 19);
                y = 16 + (rowIdx * 18);
            }

            x = Math.max(6, Math.min(94, x));
            y = Math.max(6, Math.min(94, y));

            lineupExtraPlayers[courtKey].push({
                id: 'p_ext_' + player.id + '_' + Date.now() + '_' + idx,
                playerId: player.id,
                label: '#' + player.number,
                fullName: player.name,
                position: player.position,
                isMv: isMv,
                x: Math.round(x * 10) / 10,
                y: Math.round(y * 10) / 10
            });
        });

        saveState();
        renderCourtBoards();
        showToast(`🎉 Kaikki ${roster.length} pelaajaa tuotu kentälle! Voit siirtää kaikkia vapaasti.`);
    }

    function toggleGridPaperForCourt(courtId) {
        const courtKey = getCourtKey(courtId);
        const currentVal = (lineupGridPaper[courtKey] !== undefined) ? lineupGridPaper[courtKey] : (activeLineupKey === 'freeform');
        lineupGridPaper[courtKey] = !currentVal;
        saveState();
        renderCourtBoards();
        showToast(lineupGridPaper[courtKey] ? '📐 Ruutupaperipohja aktivoitu!' : '🏟️ Vakiokenttäpohja aktivoitu!');
    }

    function rotateCoord(pt, toVertical) {
        if (!pt || typeof pt.x !== 'number' || typeof pt.y !== 'number') return { x: 50, y: 50 };
        let newX, newY;
        if (toVertical) {
            // Horizontal (40x20) -> Vertical (20x40):
            // (x, y) where own goal was left (x=12, y=50) -> own goal is bottom (x=50, y=88)
            newX = pt.y;
            newY = 100 - pt.x;
        } else {
            // Vertical (20x40) -> Horizontal (40x20):
            // (x, y) where own goal was bottom (x=50, y=88) -> own goal is left (x=12, y=50)
            newX = 100 - pt.y;
            newY = pt.x;
        }
        return {
            x: Math.max(2, Math.min(98, Math.round(newX * 10) / 10)),
            y: Math.max(2, Math.min(98, Math.round(newY * 10) / 10))
        };
    }

    function toggleCourtOrientation() {
        const oldMode = orientationMode;
        const newMode = (oldMode === 'horizontal') ? 'vertical' : 'horizontal';
        const toVertical = (newMode === 'vertical');

        const transformCourtData = (courtKey) => {
            // 1. Extra players
            if (lineupExtraPlayers && lineupExtraPlayers[courtKey] && Array.isArray(lineupExtraPlayers[courtKey])) {
                lineupExtraPlayers[courtKey].forEach(p => {
                    const rot = rotateCoord(p, toVertical);
                    p.x = rot.x;
                    p.y = rot.y;
                });
            }

            // 2. Opponents
            if (lineupOpponents && lineupOpponents[courtKey] && Array.isArray(lineupOpponents[courtKey])) {
                lineupOpponents[courtKey].forEach(o => {
                    const rot = rotateCoord(o, toVertical);
                    o.x = rot.x;
                    o.y = rot.y;
                });
            }

            // 3. Balls
            if (lineupBalls && lineupBalls[courtKey] && Array.isArray(lineupBalls[courtKey])) {
                lineupBalls[courtKey].forEach(b => {
                    const rot = rotateCoord(b, toVertical);
                    b.x = rot.x;
                    b.y = rot.y;
                });
            }

            // 4. Cones
            if (lineupCones && lineupCones[courtKey] && Array.isArray(lineupCones[courtKey])) {
                lineupCones[courtKey].forEach(c => {
                    const rot = rotateCoord(c, toVertical);
                    c.x = rot.x;
                    c.y = rot.y;
                });
            }

            // 5. Text Notes
            if (lineupTextNotes && lineupTextNotes[courtKey] && Array.isArray(lineupTextNotes[courtKey])) {
                lineupTextNotes[courtKey].forEach(t => {
                    const rot = rotateCoord(t, toVertical);
                    t.x = rot.x;
                    t.y = rot.y;
                });
            }

            // 6. Tactical Drawings & Lines & Rectangles
            if (lineupDrawings && lineupDrawings[courtKey] && Array.isArray(lineupDrawings[courtKey])) {
                lineupDrawings[courtKey].forEach(d => {
                    if (d.type === 'rect') {
                        let newX, newY, newW, newH;
                        if (toVertical) {
                            newX = d.y;
                            newY = 100 - (d.x + d.w);
                            newW = d.h;
                            newH = d.w;
                        } else {
                            newX = 100 - (d.y + d.h);
                            newY = d.x;
                            newW = d.h;
                            newH = d.w;
                        }
                        d.x = Math.max(2, Math.min(96, Math.round(newX * 10) / 10));
                        d.y = Math.max(2, Math.min(96, Math.round(newY * 10) / 10));
                        d.w = Math.max(4, Math.round(newW * 10) / 10);
                        d.h = Math.max(4, Math.round(newH * 10) / 10);
                    } else if (d.pointsPct && Array.isArray(d.pointsPct)) {
                        d.pointsPct = d.pointsPct.map(p => rotateCoord(p, toVertical));
                    }
                });
            }

            // 7. Lineup Court Positions (if custom dragged)
            const posKeys = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH', 'VM'];
            posKeys.forEach(pos => {
                const oldKeyStore = `${courtKey}_${pos}_${oldMode}`;
                const newKeyStore = `${courtKey}_${pos}_${newMode}`;
                if (lineupCourtPositions && lineupCourtPositions[oldKeyStore]) {
                    const rot = rotateCoord(lineupCourtPositions[oldKeyStore], toVertical);
                    lineupCourtPositions[newKeyStore] = rot;
                }
            });
        };

        // Run on all courts of the active page and the general activeLineupKey
        const page = getCurrentPage();
        if (page && page.courts) {
            page.courts.forEach(c => transformCourtData(getCourtKey(c.id)));
        }
        transformCourtData(activeLineupKey);

        orientationMode = newMode;
        saveState();
        renderCourtBoards();
        showToast(`Kentän asento vaihdettu: ${toVertical ? 'Pysty (20x40m) 📐' : 'Vaaka (40x20m) 🏟️'}`);
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

    function setupNodeTouchDragging(node, coords, posKeyStore, courtId, player = null) {
        let isDragging = false;
        let hasMoved = false;
        let startX = 0;
        let startY = 0;
        let rafId = null;
        let lastTapTime = 0;

        const onPointerDown = (e) => {
            const tool = courtDrawingTools[courtId] || 'select';
            if (tool !== 'select') return;
            selectCourtElement(posKeyStore, node);
            if (e.target.classList.contains('node-remove-btn')) return;
            
            const now = Date.now();
            if (now - lastTapTime < 350) {
                lastTapTime = 0;
                if (player) openModal(player);
                return;
            }
            lastTapTime = now;

            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            node.setPointerCapture(e.pointerId);

            node.addEventListener('pointermove', onPointerMove);
            node.addEventListener('pointerup', onPointerUp);
            node.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            if (Math.abs(e.clientX - startX) > 4 || Math.abs(e.clientY - startY) > 4) {
                hasMoved = true;
            }
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
            if (hasMoved) {
                saveState();
            }
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
        const mvCount = roster.filter(p => isPlayerMv(p)).length;
        const fieldCount = roster.filter(p => !isPlayerMv(p)).length;
        const loanCount = roster.filter(p => p.isLoan).length;

        const countMvEl = document.getElementById('count-mv');
        const countFieldEl = document.getElementById('count-field');
        const countLoanEl = document.getElementById('count-loan');

        if (countMvEl) countMvEl.textContent = `${mvCount} MV`;
        if (countFieldEl) countFieldEl.textContent = `${fieldCount} KENTTÄ`;
        if (countLoanEl) countLoanEl.textContent = `${loanCount} LAINA`;
    }

    function getPlayerPositions(player) {
        if (!player) return ['H'];
        if (Array.isArray(player.positions) && player.positions.length > 0) {
            return player.positions;
        }
        if (player.position) {
            const parts = String(player.position).split(/[,/ ]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
            if (parts.length > 0) return parts;
        }
        return ['H'];
    }

    function isPlayerMv(player) {
        const posList = getPlayerPositions(player);
        return posList.includes('MV');
    }

    function getPosLabel(playerOrPos) {
        if (!playerOrPos) return '🔵 Kenttä';
        if (typeof playerOrPos === 'string') {
            const pos = playerOrPos.toUpperCase().trim();
            const labels = {
                MV: '🟢 MV',
                VP: '🔵 VP',
                OP: '🔵 OP',
                P: '🔵 Pakki',
                VH: '🔵 VH',
                KH: '🔵 KH',
                OH: '🔵 OH',
                H: '🔵 Hyökkääjä',
                VM: '🪑 Varamies'
            };
            if (labels[pos]) return labels[pos];
            const parts = pos.split(/[,/ ]+/).map(s => s.trim()).filter(Boolean);
            if (parts.length > 1) {
                const hasMv = parts.includes('MV');
                return (hasMv ? '🟢 ' : '🔵 ') + parts.join(' • ');
            }
            return pos;
        }

        const player = playerOrPos;
        const posList = getPlayerPositions(player);
        if (posList.length === 1) {
            return getPosLabel(posList[0]);
        }
        const hasMv = posList.includes('MV');
        return (hasMv ? '🟢 ' : '🔵 ') + posList.join(' • ');
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

            if (!activeFilters || activeFilters.has('all') || activeFilters.size === 0) {
                return true;
            }

            const pPositions = getPlayerPositions(player);

            for (let filter of activeFilters) {
                if (filter === 'loan' && player.isLoan) return true;
                if (filter === 'mv' && pPositions.includes('MV')) return true;
                if (filter === 'vp' && (pPositions.includes('VP') || pPositions.includes('P'))) return true;
                if (filter === 'op' && (pPositions.includes('OP') || pPositions.includes('P'))) return true;
                if (filter === 'p' && (pPositions.includes('P') || pPositions.includes('VP') || pPositions.includes('OP'))) return true;
                if (filter === 'vh' && (pPositions.includes('VH') || pPositions.includes('H'))) return true;
                if (filter === 'kh' && (pPositions.includes('KH') || pPositions.includes('H'))) return true;
                if (filter === 'oh' && (pPositions.includes('OH') || pPositions.includes('H'))) return true;
                if (filter === 'h' && (pPositions.includes('H') || pPositions.includes('VH') || pPositions.includes('KH') || pPositions.includes('OH'))) return true;
                if (filter === 'field' && !pPositions.includes('MV')) return true;
            }

            return false;
        });

        // Sort: MV first, then number
        filtered.sort((a, b) => {
            const aMv = isPlayerMv(a);
            const bMv = isPlayerMv(b);
            if (aMv && !bMv) return -1;
            if (!aMv && bMv) return 1;
            return a.number - b.number;
        });

        filtered.forEach(player => {
            const card = document.createElement('div');
            const isMv = isPlayerMv(player);
            card.className = `player-card ${isMv ? 'is-mv' : 'is-field'}`;
            card.dataset.id = player.id;
            card.setAttribute('draggable', 'true');

            card.addEventListener('dragstart', (e) => {
                if (e.dataTransfer) {
                    e.dataTransfer.setData('text/plain', player.id);
                    e.dataTransfer.setData('application/json', JSON.stringify(player));
                    e.dataTransfer.effectAllowed = 'copy';
                }
                card.classList.add('is-dragging-from-roster');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('is-dragging-from-roster');
            });

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
                <div class="player-card-main" data-action="tap-assign" data-id="${player.id}" title="Klikkaa sijoittaaksesi kenttään. Kaksoisklikkaa muokataksesi pelaajaa.">
                    <div class="player-card-avatar-wrap">
                        ${player.photo ? `<img src="${player.photo}" class="player-card-photo" alt="${escapeHtml(player.name)}">` : ''}
                        <div class="player-number-badge">${player.number}</div>
                    </div>
                    <div class="player-info-block">
                        <div class="player-name-row">
                            <span class="player-name">${escapeHtml(player.name)}</span>
                            ${player.isLoan ? '<span class="loan-pill">LAINA</span>' : ''}
                        </div>
                        <div class="player-meta-row">
                            <span class="pos-badge">${getPosLabel(player)}</span>
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

            card.addEventListener('dblclick', (e) => {
                if (e.target.closest('.mini-action-btn')) return;
                e.stopPropagation();
                openModal(player);
            });

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
            const posClass = isMv ? 'slot-mv' : 'slot-field';

            const group = document.createElement('div');
            group.className = 'lineup-slot-item-group';

            const slot = document.createElement('div');
            slot.className = `lineup-slot ${posClass} ${player ? 'is-filled' : 'is-empty'}`;
            slot.dataset.position = pos;

            if (player) {
                const avatarHtml = player.photo ? `<img src="${player.photo}" class="slot-player-avatar" alt="${escapeHtml(player.name)}">` : '';
                slot.innerHTML = `
                    <div class="slot-pos-tag">${pos}</div>
                    <div class="slot-player-info" title="Kaksoisklikkaa muokataksesi pelaajaa">
                        ${avatarHtml}
                        <span class="slot-player-num">#${player.number}</span>
                        <span class="slot-player-name">${escapeHtml(player.name)}</span>
                        ${player.isLoan ? '<span class="loan-pill-tiny">⭐</span>' : ''}
                    </div>
                    <button class="slot-add-reserve-btn" data-action="open-add-reserve" data-pos="${pos}" title="Lisää varamies tälle paikalle">+ 🪑 Varamies</button>
                    <button class="slot-remove-btn" data-action="remove-slot" data-pos="${pos}" title="Poista paikalta">✕</button>
                `;

                slot.addEventListener('dblclick', (e) => {
                    if (e.target.closest('button')) return;
                    e.stopPropagation();
                    openModal(player);
                });
            } else {
                slot.innerHTML = `
                    <div class="slot-pos-tag">${pos}</div>
                    <div class="slot-empty-prompt">+ Valitse pelaaja</div>
                    <button class="slot-add-reserve-btn" data-action="open-add-reserve" data-pos="${pos}" title="Lisää varamies tälle paikalle">+ 🪑 Varamies</button>
                `;
            }

            group.appendChild(slot);

            // Indented reserves for this position
            const posReserves = getPosReserves(activeLineupKey, pos);
            if (posReserves && posReserves.length > 0) {
                const resListEl = document.createElement('div');
                resListEl.className = 'pos-reserve-list';

                posReserves.forEach(rId => {
                    const rPlayer = roster.find(p => p.id === rId);
                    if (!rPlayer) return;

                    const resRow = document.createElement('div');
                    resRow.className = 'pos-reserve-row';
                    resRow.innerHTML = `
                        <div class="reserve-info-left">
                            <span class="reserve-indent-icon">↳</span>
                            <span class="reserve-tag-pill">VARAMIES</span>
                            <span class="reserve-player-num">#${rPlayer.number}</span>
                            <span class="reserve-player-name">${escapeHtml(rPlayer.name)}</span>
                            ${rPlayer.isLoan ? '<span class="loan-pill-tiny">⭐</span>' : ''}
                        </div>
                        <button class="reserve-remove-btn" data-action="remove-reserve" data-pos="${pos}" data-reserve-id="${rPlayer.id}" title="Poista varamies">✕</button>
                    `;
                    resListEl.appendChild(resRow);
                });

                group.appendChild(resListEl);
            }

            lineupSlotsContainer.appendChild(group);
        });

        // General reserves / Extra Bench Section
        const generalReserves = getGeneralReserves(activeLineupKey);
        const genSection = document.createElement('div');
        genSection.className = 'general-reserves-section';

        let genRowsHtml = '';
        if (generalReserves && generalReserves.length > 0) {
            generalReserves.forEach(rId => {
                const rPlayer = roster.find(p => p.id === rId);
                if (!rPlayer) return;
                genRowsHtml += `
                    <div class="pos-reserve-row" style="margin-bottom: 0.22rem;">
                        <div class="reserve-info-left">
                            <span class="reserve-tag-pill">VARAMIES</span>
                            <span class="reserve-player-num">#${rPlayer.number}</span>
                            <span class="reserve-player-name">${escapeHtml(rPlayer.name)}</span>
                            ${rPlayer.isLoan ? '<span class="loan-pill-tiny">⭐</span>' : ''}
                        </div>
                        <button class="reserve-remove-btn" data-action="remove-reserve" data-pos="general" data-reserve-id="${rPlayer.id}" title="Poista varamies">✕</button>
                    </div>
                `;
            });
        }

        genSection.innerHTML = `
            <div class="general-reserves-title">
                <span>🪑 Vaihtopenkki / Varamiehet</span>
                <span style="font-size:0.68rem; color:var(--text-muted);">${generalReserves.length} kpl</span>
            </div>
            ${genRowsHtml}
            <button class="btn-add-general-reserve" data-action="open-add-general-reserve">+ Lisää varamies kentälliseen</button>
        `;

        lineupSlotsContainer.appendChild(genSection);
    }

    // ==========================================
    // SUMMARY VIEW (Kaikki kentälliset rinnakkain)
    // ==========================================
    function renderSummaryView() {
        const summaryGridContainer = document.getElementById('summary-grid-container');
        if (!summaryGridContainer) return;
        summaryGridContainer.innerHTML = '';

        const posKeys = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];
        const displayConfigs = lineupConfigs.filter(c => c.id !== 'custom' && c.id !== 'freeform' && c.type !== 'drawing_only');

        displayConfigs.forEach(cConfig => {
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
                const rowClass = isMv ? 'is-mv' : 'is-field';

                if (player) {
                    slotsHtml += `
                        <div class="summary-slot-row ${rowClass}" data-lineup="${lKey}" data-pos="${pos}">
                            <span class="summary-pos-tag">${pos}</span>
                            <span class="summary-p-num">#${player.number}</span>
                            <span class="summary-p-name">${escapeHtml(player.name)}</span>
                            ${player.isLoan ? '<span class="loan-pill-tiny">⭐</span>' : ''}
                            <button class="summary-remove-slot" data-action="summary-remove-slot" data-lineup="${lKey}" data-pos="${pos}" title="Poista paikalta">✕</button>
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

                // Indented reserves for this position in summary
                const posReserves = getPosReserves(lKey, pos);
                if (posReserves && posReserves.length > 0) {
                    posReserves.forEach(rId => {
                        const rPlayer = roster.find(p => p.id === rId);
                        if (!rPlayer) return;
                        slotsHtml += `
                            <div class="summary-slot-row summary-reserve-row" data-lineup="${lKey}" data-pos="${pos}">
                                <span class="summary-pos-tag">↳ VM</span>
                                <span class="summary-p-num">#${rPlayer.number}</span>
                                <span class="summary-p-name">${escapeHtml(rPlayer.name)}</span>
                                <button class="summary-remove-slot" data-action="summary-remove-reserve" data-lineup="${lKey}" data-pos="${pos}" data-reserve-id="${rPlayer.id}" title="Poista varamies">✕</button>
                            </div>
                        `;
                    });
                }
            });

            // General reserves in summary
            const genReserves = getGeneralReserves(lKey);
            if (genReserves && genReserves.length > 0) {
                genReserves.forEach(rId => {
                    const rPlayer = roster.find(p => p.id === rId);
                    if (!rPlayer) return;
                    slotsHtml += `
                        <div class="summary-slot-row summary-reserve-row" data-lineup="${lKey}" data-pos="general">
                            <span class="summary-pos-tag">🪑 VM</span>
                            <span class="summary-p-num">#${rPlayer.number}</span>
                            <span class="summary-p-name">${escapeHtml(rPlayer.name)}</span>
                            <button class="summary-remove-slot" data-action="summary-remove-reserve" data-lineup="${lKey}" data-pos="general" data-reserve-id="${rPlayer.id}" title="Poista varamies">✕</button>
                        </div>
                    `;
                });
            }

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
                if (e.target.dataset.action === 'summary-remove-reserve') {
                    const lk = e.target.dataset.lineup;
                    const pos = e.target.dataset.pos;
                    const rId = e.target.dataset.reserveId;
                    if (pos === 'general') {
                        removeGeneralReserve(lk, rId);
                    } else {
                        removePosReserve(lk, pos, rId);
                    }
                    saveState();
                    renderSummaryView();
                    return;
                }
                const lk = row.dataset.lineup;
                const pos = row.dataset.pos;
                if (lk && pos && pos !== 'general') openSlotPickerModal(lk, pos);
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

    function openSlotPickerModal(lineupKey, pos, isReserve = false) {
        selectedSlotTarget = { lineupKey, pos, isReserve };
        const isMv = pos === 'MV';
        const lineupName = getLineupName(lineupKey);
        const posTitle = (pos === 'general') ? 'Yleinen varamies' : (isReserve ? `Varamies (${pos})` : pos);

        const slotPickerTitle = document.getElementById('slot-picker-title');
        const slotPickerInfo = document.getElementById('slot-picker-info');
        const slotPickerPlayerList = document.getElementById('slot-picker-player-list');

        if (slotPickerTitle) slotPickerTitle.textContent = isReserve 
            ? `Valitse varamies: ${lineupName} - ${posTitle}` 
            : `Valitse pelaaja: ${lineupName} - ${posTitle}`;
        if (slotPickerInfo) slotPickerInfo.textContent = `Valitse pelaaja ringistä:`;

        const currentOccupantId = isReserve ? null : (lineups[lineupKey] || {})[pos];
        const currentReserves = isReserve ? (pos === 'general' ? getGeneralReserves(lineupKey) : getPosReserves(lineupKey, pos)) : [];

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
                const isAssignedToThis = isReserve ? currentReserves.includes(player.id) : (player.id === currentOccupantId);
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
                    if (isReserve) {
                        if (pos === 'general') {
                            addGeneralReserve(lineupKey, player.id);
                        } else {
                            addPosReserve(lineupKey, pos, player.id);
                        }
                        showToast(`Pelaaja #${player.number} ${player.name} lisätty varamieheksi (${posTitle})! 🪑`);
                    } else {
                        assignPlayerToLineupSlot(lineupKey, pos, player.id);
                    }
                    saveState();
                    renderActiveLineupSlots();
                    if (activeLineupKey === 'summary') renderSummaryView();
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
        if (assignModalPlayerInfo) {
            assignModalPlayerInfo.innerHTML = `
                <div class="assign-player-header-card">
                    <span class="assign-player-badge ${player.position === 'MV' ? 'badge-mv' : 'badge-field'}">#${player.number} ${escapeHtml(player.name)}</span>
                    <span class="assign-player-pos-hint">(${player.position})</span>
                </div>
                <div class="assign-legend-bar">
                    <span class="legend-item legend-active"><span class="legend-dot active-dot"></span> <strong>Sijoitettu tähän (valaistu)</strong></span>
                    <span class="legend-item legend-empty"><span class="legend-dot empty-dot"></span> Vapaa paikka</span>
                    <span class="legend-item legend-occ"><span class="legend-dot occ-dot"></span> Toinen pelaaja</span>
                </div>
            `;
        }

        const slotTypes = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];
        if (assignOptionsGrid) {
            assignOptionsGrid.innerHTML = '';
            lineupConfigs.forEach(cConfig => {
                const lKey = cConfig.id;
                const lName = cConfig.name;
                const curL = lineups[lKey] || {};

                // Check if this player is in this lineup as starter or reserve
                let currentAssignedPosInThisLineup = null;
                slotTypes.forEach(pos => {
                    if (curL[pos] === player.id) {
                        currentAssignedPosInThisLineup = pos;
                    }
                });
                if (!currentAssignedPosInThisLineup) {
                    slotTypes.forEach(pos => {
                        if (getPosReserves(lKey, pos).includes(player.id)) {
                            currentAssignedPosInThisLineup = `Varamies (${pos})`;
                        }
                    });
                    if (!currentAssignedPosInThisLineup && getGeneralReserves(lKey).includes(player.id)) {
                        currentAssignedPosInThisLineup = `Varamies`;
                    }
                }

                const isGeneralReserve = getGeneralReserves(lKey).includes(player.id);

                const section = document.createElement('div');
                section.className = `assign-lineup-group ${currentAssignedPosInThisLineup ? 'has-assigned-player' : ''}`;
                
                section.innerHTML = `
                    <div class="assign-lineup-header">
                        <span class="assign-lineup-title">${escapeHtml(lName)}</span>
                        ${currentAssignedPosInThisLineup ? `<span class="assigned-in-lineup-pill">🟢 Kentässä: <strong>${currentAssignedPosInThisLineup}</strong></span>` : '<span class="not-in-lineup-pill">Ei sijoitettu</span>'}
                    </div>
                `;

                const btnGrid = document.createElement('div');
                btnGrid.className = 'assign-slots-row';

                slotTypes.forEach(pos => {
                    const isMv = pos === 'MV';
                    const isSelectedHere = curL[pos] === player.id;
                    const occupantId = curL[pos];
                    const occupant = (occupantId && occupantId !== player.id) ? roster.find(p => p.id === occupantId) : null;
                    const isOccupiedOther = Boolean(occupant);

                    const btn = document.createElement('button');
                    btn.className = `assign-slot-btn ${isMv ? 'is-mv-slot' : 'is-field-slot'} ${isSelectedHere ? 'is-assigned-current' : ''} ${isOccupiedOther ? 'is-occupied-other' : ''} ${!isSelectedHere && !isOccupiedOther ? 'is-empty-slot' : ''}`;
                    
                    if (isSelectedHere) {
                        btn.innerHTML = `
                            <span class="slot-pos-main">${pos}</span>
                            <span class="slot-status-glow">✓ Sijoitettu</span>
                        `;
                        btn.title = `${lName} - ${pos}: Sijoitettu pelaajalle #${player.number} ${player.name}. Klikkaa poistaaksesi sijoitus.`;
                    } else if (occupant) {
                        btn.innerHTML = `
                            <span class="slot-pos-main">${pos}</span>
                            <span class="slot-occupant-badge">#${occupant.number} ${escapeHtml(occupant.name.split(' ')[0])}</span>
                        `;
                        btn.title = `${lName} - ${pos}: Paikalla on #${occupant.number} ${occupant.name}. Klikkaa korvataksesi hänet.`;
                    } else {
                        btn.innerHTML = `
                            <span class="slot-pos-main">${pos}</span>
                            <span class="slot-empty-label">+ Valitse</span>
                        `;
                        btn.title = `${lName} - ${pos}: Vapaa paikka. Klikkaa sijoittaaksesi tähän.`;
                    }

                    btn.addEventListener('click', () => {
                        if (isSelectedHere) {
                            lineups[lKey][pos] = '';
                            showToast(`Poistettu paikasta: ${lName} - ${pos} ✕`);
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

                // Extra button for general reserve in lineup
                const vmBtn = document.createElement('button');
                vmBtn.className = `assign-slot-btn is-vm-slot ${isGeneralReserve ? 'is-assigned-current' : 'is-empty-slot'}`;
                if (isGeneralReserve) {
                    vmBtn.innerHTML = `
                        <span class="slot-pos-main">🪑 VM</span>
                        <span class="slot-status-glow">✓ Varamies</span>
                    `;
                } else {
                    vmBtn.innerHTML = `
                        <span class="slot-pos-main">🪑 VM</span>
                        <span class="slot-empty-label">+ Varamies</span>
                    `;
                }

                vmBtn.addEventListener('click', () => {
                    if (isGeneralReserve) {
                        removeGeneralReserve(lKey, player.id);
                        showToast(`Poistettu varamiehistä: ${lName} ✕`);
                    } else {
                        addGeneralReserve(lKey, player.id);
                        showToast(`Lisätty varamieheksi kentälliseen: ${lName}! 🪑`);
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

                btnGrid.appendChild(vmBtn);
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

    function updatePositionPillsSelection(posList) {
        const container = document.getElementById('form-position-pills');
        if (!container) return;
        const normalized = (posList || []).map(p => String(p).trim().toUpperCase());
        container.querySelectorAll('.pos-select-pill').forEach(btn => {
            const p = (btn.dataset.pos || '').toUpperCase();
            if (normalized.includes(p)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        const hiddenPosInput = document.getElementById('form-position');
        if (hiddenPosInput) hiddenPosInput.value = normalized.join(', ');
    }

    function setPlayerPhotoPreview(dataUrl) {
        const photoDataInput = document.getElementById('form-photo-data');
        const photoImg = document.getElementById('form-photo-img');
        const placeholder = document.getElementById('form-photo-placeholder');
        const removeBtn = document.getElementById('btn-remove-photo');

        if (photoDataInput) photoDataInput.value = dataUrl || '';

        if (dataUrl) {
            if (photoImg) {
                photoImg.src = dataUrl;
                photoImg.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';
        } else {
            if (photoImg) {
                photoImg.src = '';
                photoImg.style.display = 'none';
            }
            if (placeholder) placeholder.style.display = 'block';
            if (removeBtn) removeBtn.style.display = 'none';
        }
    }

    function openModal(editPlayer = null) {
        const modalTitle = document.getElementById('modal-title');
        const formPlayerId = document.getElementById('form-player-id');
        const formName = document.getElementById('form-name');
        const formNumber = document.getElementById('form-number');
        const formIsLoan = document.getElementById('form-is-loan');
        const formNotes = document.getElementById('form-notes');
        const playerForm = document.getElementById('player-form');
        const photoFileInput = document.getElementById('form-photo-input');
        if (photoFileInput) photoFileInput.value = '';

        let selectedPositions = ['H'];

        if (editPlayer) {
            if (modalTitle) modalTitle.textContent = 'Muokkaa pelaajaa';
            if (formPlayerId) formPlayerId.value = editPlayer.id;
            if (formName) formName.value = editPlayer.name;
            if (formNumber) formNumber.value = editPlayer.number;
            if (formIsLoan) formIsLoan.checked = editPlayer.isLoan;
            if (formNotes) formNotes.value = editPlayer.notes || '';
            selectedPositions = getPlayerPositions(editPlayer);
            setPlayerPhotoPreview(editPlayer.photo || '');
        } else {
            if (modalTitle) modalTitle.textContent = 'Lisää uusi pelaaja / Laina';
            playerForm?.reset();
            if (formPlayerId) formPlayerId.value = '';
            if (formIsLoan) formIsLoan.checked = false;
            selectedPositions = ['H'];
            setPlayerPhotoPreview('');
        }

        updatePositionPillsSelection(selectedPositions);
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

    function generateLineupsExportText(specificLineupKey = null) {
        const curTeam = teams.find(t => t.id === currentTeamId);
        const teamName = curTeam ? curTeam.name : 'Joukkue';
        let text = `🏑 ${teamName.toUpperCase()} - KENTÄLLISET\n`;

        if (curTeam && curTeam.matchInfo) {
            const m = curTeam.matchInfo;
            if (m.opponent) text += `⚔️ Ottelu: ${m.opponent}\n`;
            if (m.time) text += `📅 Aika: ${m.time}\n`;
            if (m.meta) text += `🏟️ Paikka/Sarja: ${m.meta}\n`;
        }
        text += `\n`;

        const targetConfigs = specificLineupKey 
            ? lineupConfigs.filter(c => c.id === specificLineupKey)
            : lineupConfigs.filter(c => c.id !== 'custom' && c.id !== 'freeform' && c.type !== 'drawing_only');

        let totalFound = 0;
        targetConfigs.forEach(cConfig => {
            const key = cConfig.id;
            const name = cConfig.name;
            const lineup = lineups[key] || {};
            const posOrder = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];
            const hasPlayers = Object.values(lineup).some(val => val !== '');
            const posResAny = posOrder.some(pos => {
                const r = getPosReserves(key, pos);
                return r && r.length > 0;
            });
            const genRes = getGeneralReserves(key) || [];

            if (hasPlayers || posResAny || genRes.length > 0) {
                totalFound++;
                text += `📌 ${name.toUpperCase()}:\n`;
                posOrder.forEach(pos => {
                    const pid = lineup[pos];
                    const player = roster.find(p => p.id === pid);
                    const icon = pos === 'MV' ? '🟢' : '🔵';
                    if (player) {
                        text += `  ${icon} ${pos}: #${player.number} ${player.name}${player.isLoan ? ' (LAINA)' : ''}\n`;
                    }
                    const posRes = getPosReserves(key, pos);
                    if (posRes && posRes.length > 0) {
                        posRes.forEach(rId => {
                            const rPlayer = roster.find(p => p.id === rId);
                            if (rPlayer) {
                                text += `     ↳ 🪑 Varamies (${pos}): #${rPlayer.number} ${rPlayer.name}${rPlayer.isLoan ? ' (LAINA)' : ''}\n`;
                            }
                        });
                    }
                });

                if (genRes.length > 0) {
                    text += `  🪑 VAIHTOPENKKI / VARAMIEHET:\n`;
                    genRes.forEach(rId => {
                        const rPlayer = roster.find(p => p.id === rId);
                        if (rPlayer) {
                            text += `     • #${rPlayer.number} ${rPlayer.name}${rPlayer.isLoan ? ' (LAINA)' : ''}\n`;
                        }
                    });
                }
                text += `\n`;
            }
        });

        if (totalFound === 0) {
            text += `(Ei vielä sijoitettuja pelaajia kentällisissä)\n`;
        }

        return text.trim();
    }

    function openExportTextModal(specificLineupKey = null) {
        const text = generateLineupsExportText(specificLineupKey);
        const textarea = document.getElementById('export-modal-textarea');
        const titleEl = document.getElementById('export-modal-title');
        
        if (textarea) {
            textarea.value = text;
        }

        if (titleEl) {
            if (specificLineupKey) {
                const config = lineupConfigs.find(c => c.id === specificLineupKey);
                titleEl.textContent = `📋 ${config ? config.name : 'Kentällinen'} tekstinä (Esikatselu)`;
            } else {
                titleEl.textContent = `📋 Kaikki kentälliset tekstinä (Esikatselu)`;
            }
        }

        document.getElementById('export-modal')?.classList.add('active');
    }

    function exportLineupsToClipboard(specificLineupKey = null) {
        openExportTextModal(specificLineupKey);
    }

    // ==========================================
    // TEAM CUSTOMIZATION & BRANDING (v37.0)
    // ==========================================
    let tempTeamLogo = null;
    let tempPrimaryColor = '#2563eb';
    let tempMvColor = '#10b981';
    let tempTokenStyle = 'circle';
    let tempRinkColor = 'black';

    function openTeamCustomizeModal() {
        const curTeam = teams.find(t => t.id === currentTeamId);
        if (!curTeam) return;

        tempTeamLogo = curTeam.logo || '🏑';
        tempPrimaryColor = curTeam.primaryColor || '#2563eb';
        tempMvColor = curTeam.mvColor || '#10b981';
        tempTokenStyle = curTeam.tokenStyle || 'circle';
        tempRinkColor = curTeam.rinkColor || 'black';

        updateLogoPreviewDisplay();

        const primaryInput = document.getElementById('cust-primary-color');
        const primaryText = document.getElementById('cust-primary-color-text');
        if (primaryInput) primaryInput.value = tempPrimaryColor;
        if (primaryText) primaryText.textContent = tempPrimaryColor;

        const mvInput = document.getElementById('cust-mv-color');
        const mvText = document.getElementById('cust-mv-color-text');
        if (mvInput) mvInput.value = tempMvColor;
        if (mvText) mvText.textContent = tempMvColor;

        const arenaInput = document.getElementById('cust-arena-name');
        if (arenaInput) arenaInput.value = curTeam.arenaName || '';

        const courtLogoCheck = document.getElementById('cust-show-court-logo');
        if (courtLogoCheck) courtLogoCheck.checked = (curTeam.showCourtLogo !== false);

        document.querySelectorAll('.token-style-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.style === tempTokenStyle);
        });

        document.querySelectorAll('.rink-style-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.rink === tempRinkColor);
        });

        document.getElementById('team-customize-modal')?.classList.add('active');
    }

    function updateLogoPreviewDisplay() {
        const previewEl = document.getElementById('cust-logo-preview');
        if (!previewEl) return;
        if (!tempTeamLogo) {
            previewEl.innerHTML = '🏑';
            return;
        }
        if (tempTeamLogo.startsWith('data:image') || tempTeamLogo.startsWith('http')) {
            previewEl.innerHTML = `<img src="${escapeHtml(tempTeamLogo)}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="Logo preview">`;
        } else {
            previewEl.innerHTML = escapeHtml(tempTeamLogo);
        }
    }

    function saveTeamCustomize() {
        const curTeam = teams.find(t => t.id === currentTeamId);
        if (!curTeam) return;

        curTeam.logo = tempTeamLogo;
        curTeam.primaryColor = tempPrimaryColor;
        curTeam.mvColor = tempMvColor;
        curTeam.tokenStyle = tempTokenStyle;
        curTeam.rinkColor = tempRinkColor;

        const arenaInput = document.getElementById('cust-arena-name');
        if (arenaInput) curTeam.arenaName = arenaInput.value.trim();

        const courtLogoCheck = document.getElementById('cust-show-court-logo');
        if (courtLogoCheck) curTeam.showCourtLogo = courtLogoCheck.checked;

        saveState();
        applyThemeAndSettings();
        renderCourtBoards();
        renderActiveLineupSlots();
        if (activeLineupKey === 'summary') renderSummaryView();

        document.getElementById('team-customize-modal')?.classList.remove('active');
        showToast('Joukkueen kustomointi tallennettu! ✨');
    }

    // ==========================================
    // MATCH & EVENT INFO BANNER (v37.0)
    // ==========================================
    function openMatchModal() {
        const curTeam = teams.find(t => t.id === currentTeamId);
        const mInfo = (curTeam && curTeam.matchInfo) ? curTeam.matchInfo : {};

        const oppInput = document.getElementById('match-input-opponent');
        const timeInput = document.getElementById('match-input-time');
        const metaInput = document.getElementById('match-input-meta');
        const showCheck = document.getElementById('match-input-show-banner');

        if (oppInput) oppInput.value = mInfo.opponent || '';
        if (timeInput) timeInput.value = mInfo.time || '';
        if (metaInput) metaInput.value = mInfo.meta || (curTeam?.arenaName ? curTeam.arenaName : '');
        if (showCheck) showCheck.checked = (mInfo.showBanner !== false);

        document.getElementById('match-info-modal')?.classList.add('active');
    }

    function saveMatchInfo(e) {
        if (e) e.preventDefault();
        const curTeam = teams.find(t => t.id === currentTeamId);
        if (!curTeam) return;

        const oppInput = document.getElementById('match-input-opponent');
        const timeInput = document.getElementById('match-input-time');
        const metaInput = document.getElementById('match-input-meta');
        const showCheck = document.getElementById('match-input-show-banner');

        curTeam.matchInfo = {
            opponent: oppInput ? oppInput.value.trim() : '',
            time: timeInput ? timeInput.value.trim() : '',
            meta: metaInput ? metaInput.value.trim() : '',
            showBanner: showCheck ? showCheck.checked : true
        };

        saveState();
        applyThemeAndSettings();
        document.getElementById('match-info-modal')?.classList.remove('active');
        showToast('Peli-info tallennettu! 🏆');
    }

    function clearMatchInfo() {
        const curTeam = teams.find(t => t.id === currentTeamId);
        if (curTeam) {
            curTeam.matchInfo = { opponent: '', time: '', meta: '', showBanner: false };
            saveState();
            applyThemeAndSettings();
            document.getElementById('match-info-modal')?.classList.remove('active');
            showToast('Peli-info tyhjennetty.');
        }
    }

    // ==========================================
    // TACTICAL PRESETS (v37.0)
    // ==========================================
    let targetCourtIdForPreset = null;

    function openTacticalPresetsModal(courtId) {
        targetCourtIdForPreset = courtId;
        document.getElementById('tactical-presets-modal')?.classList.add('active');
    }

    function applyTacticalPreset(courtId, presetType) {
        if (!courtId) courtId = targetCourtIdForPreset;
        const courtKey = getCourtKey(courtId);
        const page = getCurrentPage();
        const court = page.courts.find(c => c.id === courtId);
        if (!court) return;

        // Clear existing drawings for this court
        lineupDrawings[courtKey] = [];
        if (!lineupCourtPositions) lineupCourtPositions = {};

        if (presetType === '2-2-1') {
            court.title = '2-2-1 Korkea Karvaus';
            court.description = `2-2-1 Korkea Karvaus:\n• Kärkipelaajat (VH & OH) antavat aktiivisen paineen ja ohjaavat vastustajan avauksen laitaan.\n• Sentteri (KH) peittää keskustan syöttölinjat.\n• Puolustajat (VP & OP) katkovat rännikiekot ja puolustavat eteenpäin.`;
            
            lineupCourtPositions[`${courtKey}_MV_${orientationMode}`] = { x: 12, y: 50 };
            lineupCourtPositions[`${courtKey}_VP_${orientationMode}`] = { x: 34, y: 30 };
            lineupCourtPositions[`${courtKey}_OP_${orientationMode}`] = { x: 34, y: 70 };
            lineupCourtPositions[`${courtKey}_KH_${orientationMode}`] = { x: 55, y: 50 };
            lineupCourtPositions[`${courtKey}_VH_${orientationMode}`] = { x: 74, y: 24 };
            lineupCourtPositions[`${courtKey}_OH_${orientationMode}`] = { x: 74, y: 76 };

            // Add pressing run arrows
            lineupDrawings[courtKey].push({
                id: 'preset_run_1',
                type: 'run',
                stepNum: 1,
                color: '#38bdf8',
                pointsPct: [{ x: 74, y: 24 }, { x: 86, y: 20 }]
            });
            lineupDrawings[courtKey].push({
                id: 'preset_run_2',
                type: 'run',
                stepNum: 2,
                color: '#38bdf8',
                pointsPct: [{ x: 74, y: 76 }, { x: 86, y: 80 }]
            });
        } 
        else if (presetType === '2-1-2') {
            court.title = '2-1-2 Noppavitonen / Trappi';
            court.description = `2-1-2 Noppavitonen / Keskialueen Trappi:\n• Klassinen 5-nopparyhmitys. Annetaan vastustajan pakkien syötellä rauhassa.\n• Kun pallo pelataan puolenkentän yli, koko viisikko iskee samanaikaisesti syöttösuuntiin kiinni.\n• Tavoitteena nopea riisto ja suora vastaisku.`;

            lineupCourtPositions[`${courtKey}_MV_${orientationMode}`] = { x: 12, y: 50 };
            lineupCourtPositions[`${courtKey}_VP_${orientationMode}`] = { x: 30, y: 30 };
            lineupCourtPositions[`${courtKey}_OP_${orientationMode}`] = { x: 30, y: 70 };
            lineupCourtPositions[`${courtKey}_KH_${orientationMode}`] = { x: 50, y: 50 };
            lineupCourtPositions[`${courtKey}_VH_${orientationMode}`] = { x: 65, y: 25 };
            lineupCourtPositions[`${courtKey}_OH_${orientationMode}`] = { x: 65, y: 75 };

            lineupDrawings[courtKey].push({
                id: 'preset_rect_1',
                type: 'rect',
                x: 40,
                y: 18,
                w: 22,
                h: 64
            });
        }
        else if (presetType === '1-2-2') {
            court.title = '1-2-2 Puolustusblokki';
            court.description = `1-2-2 Matalampi Puolustusblokki:\n• Sentteri/kärki ohjaa hyökkäystä laitaan.\n• Laiturit (VH & OH) ja pakit (VP & OP) muodostavat kaksi tiivistä linjaa.\n• Keskusta pidetään täysin tukossa ja peitetään vedot sektorista.`;

            lineupCourtPositions[`${courtKey}_MV_${orientationMode}`] = { x: 12, y: 50 };
            lineupCourtPositions[`${courtKey}_VP_${orientationMode}`] = { x: 26, y: 34 };
            lineupCourtPositions[`${courtKey}_OP_${orientationMode}`] = { x: 26, y: 66 };
            lineupCourtPositions[`${courtKey}_VH_${orientationMode}`] = { x: 44, y: 26 };
            lineupCourtPositions[`${courtKey}_OH_${orientationMode}`] = { x: 44, y: 74 };
            lineupCourtPositions[`${courtKey}_KH_${orientationMode}`] = { x: 62, y: 50 };
        }
        else if (presetType === 'corner-freekick') {
            court.title = 'Kulmavapari & Suora Veto';
            court.description = `Hyökkäyspään Kulmavapari:\n1. Pallo kulmasta (VH) nopealla maanuoliaisella suoraan keskelle slottiin (KH).\n2. KH vetää suoraan syötöstä (one-timer) takayläkulmaan.\n3. OH tekee kovan maskin vastustajan maalivahdille ja siivoaa reboundin.`;

            lineupCourtPositions[`${courtKey}_MV_${orientationMode}`] = { x: 12, y: 50 };
            lineupCourtPositions[`${courtKey}_VH_${orientationMode}`] = { x: 88, y: 16 };
            lineupCourtPositions[`${courtKey}_KH_${orientationMode}`] = { x: 70, y: 46 };
            lineupCourtPositions[`${courtKey}_OH_${orientationMode}`] = { x: 85, y: 50 };
            lineupCourtPositions[`${courtKey}_OP_${orientationMode}`] = { x: 58, y: 70 };
            lineupCourtPositions[`${courtKey}_VP_${orientationMode}`] = { x: 52, y: 28 };

            // Ball at corner
            lineupBalls[courtKey] = [{ id: 'b_corner_' + Date.now(), x: 89, y: 16 }];

            // Pass from corner to slot (Step 1)
            lineupDrawings[courtKey].push({
                id: 'preset_pass_1',
                type: 'pass',
                stepNum: 1,
                color: '#eab308',
                pointsPct: [{ x: 88, y: 16 }, { x: 71, y: 46 }]
            });
            // Shot from slot to net (Step 2)
            lineupDrawings[courtKey].push({
                id: 'preset_shot_2',
                type: 'shot',
                stepNum: 2,
                color: '#ec4899',
                pointsPct: [{ x: 70, y: 46 }, { x: 88, y: 49 }]
            });
        }
        else if (presetType === 'powerplay') {
            court.title = '5v4 Ylivoimakuvio (Sateenvarjo & Siivet)';
            court.description = `5v4 Ylivoimakuvio (Sateenvarjo & Siivet):\n• Nopea pallonliike vasemman ja oikean siiven sekä viivamiesten välillä.\n• Etsitään poikkisyöttöä takatolpalle tai viivalta laukausta slottiohjauksella.\n• Keskipelaaja (KH) valmiina ohjauksiin ja irtopalloihin.`;

            lineupCourtPositions[`${courtKey}_MV_${orientationMode}`] = { x: 12, y: 50 };
            lineupCourtPositions[`${courtKey}_VP_${orientationMode}`] = { x: 50, y: 28 };
            lineupCourtPositions[`${courtKey}_OP_${orientationMode}`] = { x: 50, y: 72 };
            lineupCourtPositions[`${courtKey}_VH_${orientationMode}`] = { x: 76, y: 18 };
            lineupCourtPositions[`${courtKey}_OH_${orientationMode}`] = { x: 76, y: 82 };
            lineupCourtPositions[`${courtKey}_KH_${orientationMode}`] = { x: 68, y: 50 };

            // Ball with left wing
            lineupBalls[courtKey] = [{ id: 'b_pp_' + Date.now(), x: 77, y: 18 }];

            // Pass arrows (Steps 1, 2, 3)
            lineupDrawings[courtKey].push({
                id: 'preset_pp_1',
                type: 'pass',
                stepNum: 1,
                color: '#eab308',
                pointsPct: [{ x: 76, y: 18 }, { x: 51, y: 28 }]
            });
            lineupDrawings[courtKey].push({
                id: 'preset_pp_2',
                type: 'pass',
                stepNum: 2,
                color: '#eab308',
                pointsPct: [{ x: 50, y: 28 }, { x: 50, y: 72 }]
            });
            lineupDrawings[courtKey].push({
                id: 'preset_pp_3',
                type: 'pass',
                stepNum: 3,
                color: '#eab308',
                pointsPct: [{ x: 50, y: 72 }, { x: 76, y: 82 }]
            });
        }

        saveState();
        renderCourtBoards();
        document.getElementById('tactical-presets-modal')?.classList.remove('active');
        showToast(`Kuvio asetettu: ${court.title}! 🏒✨`);
    }

    // ==========================================
    // EXPORT COURT TO PNG IMAGE (v37.0)
    // ==========================================
    function exportCourtToPng(courtId) {
        const page = getCurrentPage();
        const court = page.courts.find(c => c.id === courtId);
        if (!court) return;

        const courtKey = getCourtKey(courtId);
        const curTeam = teams.find(t => t.id === currentTeamId) || {};
        const lineup = lineups[activeLineupKey] || {};
        const drawings = lineupDrawings[courtKey] || lineupDrawings[activeLineupKey] || [];
        const balls = lineupBalls[courtKey] || lineupBalls[activeLineupKey] || [];
        const cones = lineupCones[courtKey] || lineupCones[activeLineupKey] || [];
        const opponents = lineupOpponents[courtKey] || lineupOpponents[activeLineupKey] || [];
        const extraPlayers = lineupExtraPlayers[courtKey] || lineupExtraPlayers[activeLineupKey] || [];
        const textNotes = lineupTextNotes[courtKey] || lineupTextNotes[activeLineupKey] || [];
        const isGridPaper = (lineupGridPaper[courtKey] !== undefined) 
            ? !!lineupGridPaper[courtKey] 
            : (activeLineupKey === 'freeform');

        // Create high-res export canvas
        const isVert = orientationMode === 'vertical';
        const exportCanvas = document.createElement('canvas');
        const width = isVert ? 1100 : 1600;
        const height = isVert ? 1600 : 1000;
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d');

        // 1. Overall Dark Background
        ctx.fillStyle = '#080c14';
        ctx.fillRect(0, 0, width, height);

        // 2. Top Header Bar
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, 80);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 80);
        ctx.lineTo(width, 80);
        ctx.stroke();

        // Team Title & Lineup
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Outfit", sans-serif';
        const teamName = (curTeam.name || 'Salibandy').toUpperCase();
        const lineupTitle = `${teamName} • ${getLineupName(activeLineupKey)} - ${court.title || 'Taktiikkakuva'}`;
        ctx.fillText(`🏑 ${lineupTitle}`, 30, 50);

        // Match Info in Header
        if (curTeam.matchInfo && (curTeam.matchInfo.opponent || curTeam.matchInfo.time)) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
            const mText = `⚔️ ${curTeam.matchInfo.opponent || ''} ${curTeam.matchInfo.time ? '• ' + curTeam.matchInfo.time : ''}`;
            const mWidth = ctx.measureText(mText).width;
            ctx.fillText(mText, width - mWidth - 30, 50);
        }

        // 3. Court Area Dimensions
        const courtX = 40;
        const courtY = 100;
        const courtW = width - 80;
        const courtH = height - 200;

        // Court Surface Color
        let floorColor = '#1e3a8a'; // classic blue
        if (courtColor === 'graphite') floorColor = '#1e293b';
        if (courtColor === 'wood') floorColor = '#78350f';
        if (courtColor === 'green') floorColor = '#064e3b';
        if (isGridPaper) floorColor = '#131b2e';

        ctx.fillStyle = floorColor;
        ctx.beginPath();
        ctx.roundRect(courtX, courtY, courtW, courtH, 24);
        ctx.fill();

        // Rink Board
        ctx.strokeStyle = (curTeam.rinkColor === 'white') ? '#f8fafc' : '#020617';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Grid pattern if gridpaper
        if (isGridPaper) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            for (let x = courtX; x <= courtX + courtW; x += 30) {
                ctx.beginPath();
                ctx.moveTo(x, courtY);
                ctx.lineTo(x, courtY + courtH);
                ctx.stroke();
            }
            for (let y = courtY; y <= courtY + courtH; y += 30) {
                ctx.beginPath();
                ctx.moveTo(courtX, y);
                ctx.lineTo(courtX + courtW, y);
                ctx.stroke();
            }
        } else {
            // Court Lines (White)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 3;

            if (isVert) {
                // Center Line (Horizontal in vertical mode)
                ctx.beginPath();
                ctx.moveTo(courtX, courtY + courtH / 2);
                ctx.lineTo(courtX + courtW, courtY + courtH / 2);
                ctx.stroke();

                // Center Circle & Spot
                ctx.beginPath();
                ctx.arc(courtX + courtW / 2, courtY + courtH / 2, 70, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#ec4899';
                ctx.beginPath();
                ctx.arc(courtX + courtW / 2, courtY + courtH / 2, 8, 0, Math.PI * 2);
                ctx.fill();

                // Goal Areas Top & Bottom
                const goalW = 160;
                const goalH = 100;
                // Top Goal
                ctx.strokeRect(courtX + courtW / 2 - goalW / 2, courtY + 70, goalW, goalH);
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(courtX + courtW / 2 - 36, courtY + 90, 72, 24);

                // Bottom Goal
                ctx.strokeRect(courtX + courtW / 2 - goalW / 2, courtY + courtH - 70 - goalH, goalW, goalH);
                ctx.fillRect(courtX + courtW / 2 - 36, courtY + courtH - 90 - 24, 72, 24);
            } else {
                // Center Line
                ctx.beginPath();
                ctx.moveTo(courtX + courtW / 2, courtY);
                ctx.lineTo(courtX + courtW / 2, courtY + courtH);
                ctx.stroke();

                // Center Circle & Spot
                ctx.beginPath();
                ctx.arc(courtX + courtW / 2, courtY + courtH / 2, 70, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#ec4899';
                ctx.beginPath();
                ctx.arc(courtX + courtW / 2, courtY + courtH / 2, 8, 0, Math.PI * 2);
                ctx.fill();

                // Goal Areas Left & Right
                const goalW = 120;
                const goalH = 160;
                // Left Goal
                ctx.strokeRect(courtX + 80, courtY + courtH / 2 - goalH / 2, goalW, goalH);
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(courtX + 110, courtY + courtH / 2 - 36, 24, 72);

                // Right Goal
                ctx.strokeRect(courtX + courtW - 80 - goalW, courtY + courtH / 2 - goalH / 2, goalW, goalH);
                ctx.fillRect(courtX + courtW - 110 - 24, courtY + courtH / 2 - 36, 24, 72);
            }
        }

        // Center Watermark / Logo
        if (curTeam.showCourtLogo !== false && curTeam.logo) {
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '110px sans-serif';
            ctx.fillText(curTeam.logo, courtX + courtW / 2, courtY + courtH / 2);
            ctx.restore();
        }

        // Arena Name in Corner
        if (curTeam.arenaName) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = 'bold 16px "Outfit", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(curTeam.arenaName.toUpperCase(), courtX + courtW - 20, courtY + courtH - 20);
        }

        // Draw Drawings (Passes, Runs, Shots, Areas)
        drawings.forEach(d => {
            if (d.type === 'rect') {
                const rx = courtX + (d.x / 100) * courtW;
                const ry = courtY + (d.y / 100) * courtH;
                const rw = (d.w / 100) * courtW;
                const rh = (d.h / 100) * courtH;
                ctx.fillStyle = 'rgba(59, 130, 246, 0.22)';
                ctx.fillRect(rx, ry, rw, rh);
                ctx.strokeStyle = '#60a5fa';
                ctx.lineWidth = 3;
                ctx.strokeRect(rx, ry, rw, rh);
            } else if (d.pointsPct && d.pointsPct.length >= 2) {
                const pts = d.pointsPct.map(p => ({
                    x: courtX + (p.x / 100) * courtW,
                    y: courtY + (p.y / 100) * courtH
                }));
                const start = pts[0];
                const end = pts[pts.length - 1];

                ctx.save();
                if (d.type === 'pass') {
                    ctx.strokeStyle = d.color || '#eab308';
                    ctx.lineWidth = 4.5;
                    ctx.setLineDash([12, 8]);
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.stroke();

                    const angle = Math.atan2(end.y - start.y, end.x - start.x);
                    ctx.setLineDash([]);
                    ctx.fillStyle = d.color || '#eab308';
                    ctx.beginPath();
                    ctx.moveTo(end.x, end.y);
                    ctx.lineTo(end.x - 18 * Math.cos(angle - Math.PI / 5), end.y - 18 * Math.sin(angle - Math.PI / 5));
                    ctx.lineTo(end.x - 18 * Math.cos(angle + Math.PI / 5), end.y - 18 * Math.sin(angle + Math.PI / 5));
                    ctx.closePath();
                    ctx.fill();
                } else if (d.type === 'shot') {
                    ctx.strokeStyle = d.color || '#ec4899';
                    ctx.lineWidth = 5.5;
                    ctx.setLineDash([12, 6]);
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.stroke();

                    const angle = Math.atan2(end.y - start.y, end.x - start.x);
                    ctx.setLineDash([]);
                    ctx.fillStyle = d.color || '#ec4899';
                    ctx.beginPath();
                    ctx.moveTo(end.x, end.y);
                    ctx.lineTo(end.x - 18 * Math.cos(angle - Math.PI / 5), end.y - 18 * Math.sin(angle - Math.PI / 5));
                    ctx.lineTo(end.x - 18 * Math.cos(angle + Math.PI / 5), end.y - 18 * Math.sin(angle + Math.PI / 5));
                    ctx.closePath();
                    ctx.fill();

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(end.x, end.y, 8, 0, 2 * Math.PI);
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = d.color || '#38bdf8';
                    ctx.lineWidth = 4.5;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    ctx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                    ctx.stroke();

                    const prev = pts[Math.max(0, pts.length - 4)];
                    const angle = Math.atan2(end.y - prev.y, end.x - prev.x);
                    ctx.fillStyle = d.color || '#38bdf8';
                    ctx.beginPath();
                    ctx.moveTo(end.x, end.y);
                    ctx.lineTo(end.x - 18 * Math.cos(angle - Math.PI / 5), end.y - 18 * Math.sin(angle - Math.PI / 5));
                    ctx.lineTo(end.x - 18 * Math.cos(angle + Math.PI / 5), end.y - 18 * Math.sin(angle + Math.PI / 5));
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();

                const stepNum = getDrawingStepNum(d, 0, drawings);
                if (stepNum) {
                    let midX, midY;
                    if (d.type === 'pass' || d.type === 'shot') {
                        midX = (start.x + end.x) / 2;
                        midY = (start.y + end.y) / 2;
                    } else {
                        const midIdx = Math.floor(pts.length / 2);
                        midX = pts[midIdx].x;
                        midY = pts[midIdx].y;
                    }
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(midX, midY, 16, 0, Math.PI * 2);
                    ctx.fillStyle = '#0f172a';
                    ctx.fill();
                    ctx.strokeStyle = d.color || '#38bdf8';
                    ctx.lineWidth = 3.5;
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 15px "Outfit", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(String(stepNum), midX, midY);
                    ctx.restore();
                }
            }
        });

        // Draw Lineup Players
        const posKeys = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH', 'VM'];
        posKeys.forEach(pos => {
            const pid = lineup[pos];
            if (!pid) return;
            const player = roster.find(p => p.id === pid);
            if (!player) return;

            let defaultCoords = DEFAULT_POS_COORDS[orientationMode][pos] || { x: 50, y: 50 };
            let posKeyStore = `${courtKey}_${pos}_${orientationMode}`;
            let fallbackKeyStore = `${activeLineupKey}_${pos}_${orientationMode}`;
            let coords = lineupCourtPositions[posKeyStore] || lineupCourtPositions[fallbackKeyStore] || defaultCoords;

            const px = courtX + (coords.x / 100) * courtW;
            const py = courtY + (coords.y / 100) * courtH;

            const isMv = player.position === 'MV';
            ctx.fillStyle = isMv ? (curTeam.mvColor || '#10b981') : (curTeam.primaryColor || '#2563eb');
            ctx.beginPath();
            ctx.arc(px, py, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Number
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(player.number), px, py);

            // Name label below
            if (labelMode !== 'num') {
                ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 4;
                ctx.fillText(player.name, px, py + 34);
                ctx.shadowBlur = 0;
            }
        });

        // Draw Extra Players
        extraPlayers.forEach(extraP => {
            const px = courtX + (extraP.x / 100) * courtW;
            const py = courtY + (extraP.y / 100) * courtH;
            const isMv = extraP.isMv || (extraP.position === 'MV');
            ctx.fillStyle = isMv ? (curTeam.mvColor || '#10b981') : (curTeam.primaryColor || '#2563eb');
            ctx.beginPath();
            ctx.arc(px, py, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(extraP.label || 'P', px, py);
        });

        // Draw Opponents
        opponents.forEach(opp => {
            const ox = courtX + (opp.x / 100) * courtW;
            const oy = courtY + (opp.y / 100) * courtH;
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(ox, oy, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(opp.label || 'V', ox, oy);
        });

        // Draw Balls
        balls.forEach(b => {
            const bx = courtX + (b.x / 100) * courtW;
            const by = courtY + (b.y / 100) * courtH;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bx, by, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw Cones
        cones.forEach(c => {
            const cx = courtX + (c.x / 100) * courtW;
            const cy = courtY + (c.y / 100) * courtH;
            ctx.font = '22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔶', cx, cy);
        });

        // Draw Text Notes
        textNotes.forEach(tNode => {
            const tx = courtX + (tNode.x / 100) * courtW;
            const ty = courtY + (tNode.y / 100) * courtH;
            ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
            const tWidth = ctx.measureText(tNode.text).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(tx - 6, ty - 14, tWidth + 12, 28);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tx - 6, ty - 14, tWidth + 12, 28);
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(tNode.text, tx, ty);
        });

        // 4. Bottom Footer with Tactical Notes
        if (court.description) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, height - 90, width, 90);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, height - 90);
            ctx.lineTo(width, height - 90);
            ctx.stroke();

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 14px "Outfit", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('📝 TAKTISET OHJEET:', 30, height - 60);

            ctx.fillStyle = '#f8fafc';
            ctx.font = '15px "Plus Jakarta Sans", sans-serif';
            const shortDesc = court.description.replace(/\n/g, '  |  ');
            ctx.fillText(shortDesc, 30, height - 32);
        }

        // Trigger Download
        const link = document.createElement('a');
        const safeName = (teamName + '_' + (court.title || 'Taktiikka')).replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, '_');
        link.download = `${safeName}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
        showToast('📸 Kenttäkuva ladattu laitteellesi (PNG)!');
    }

    let activeFullscreenCourtId = null;

    function toggleFullscreenCourt(courtId) {
        const card = document.querySelector(`.court-board-card[data-court-id="${courtId}"]`);
        if (!card) return;

        const isFullscreen = card.classList.toggle('is-fullscreen-court');
        activeFullscreenCourtId = isFullscreen ? courtId : null;

        const btn = card.querySelector('[data-action="toggle-fullscreen-court"]');
        if (btn) {
            if (isFullscreen) {
                btn.innerHTML = '✕ Poistu kokoruudusta (Esc)';
                btn.className = 'btn-xs btn-primary highlight-fullscreen';
            } else {
                btn.innerHTML = '⛶ Koko ruutu';
                btn.className = 'btn-xs btn-outline highlight-fullscreen';
            }
        }

        // Re-scale canvas dimensions and re-draw lines
        setTimeout(() => {
            const canvasEl = document.getElementById(`tactic-canvas-${courtId}`);
            const courtContainer = document.getElementById(`floorball-court-${courtId}`);
            if (canvasEl && courtContainer) {
                const rect = courtContainer.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    canvasEl.width = rect.width;
                    canvasEl.height = rect.height;
                    const ctxEl = canvasEl.getContext('2d');
                    if (ctxEl) drawCanvasLinesForInstance(courtId, canvasEl, ctxEl);
                }
            }
        }, 60);

        if (isFullscreen) {
            showToast('Koko ruudun piirtotila aktivoitu! ⛶ (Paina Esc poistuaksesi)');
        }
    }

    function openPhotoModal() {
        const fileDropArea = document.getElementById('file-drop-area');
        const ocrStatus = document.getElementById('ocr-status');
        const photoPreviewStep = document.getElementById('photo-preview-step');
        const fileInput = document.getElementById('photo-file-input');

        if (fileDropArea) fileDropArea.style.display = 'block';
        if (ocrStatus) ocrStatus.style.display = 'none';
        if (photoPreviewStep) photoPreviewStep.style.display = 'none';
        if (fileInput) fileInput.value = '';

        document.getElementById('photo-modal')?.classList.add('active');
    }

    function processPhotoFile(file) {
        if (!file) return;
        const fileDropArea = document.getElementById('file-drop-area');
        const ocrStatus = document.getElementById('ocr-status');
        const ocrStatusText = document.getElementById('ocr-status-text');
        const photoPreviewStep = document.getElementById('photo-preview-step');

        if (fileDropArea) fileDropArea.style.display = 'none';
        if (photoPreviewStep) photoPreviewStep.style.display = 'none';
        if (ocrStatus) ocrStatus.style.display = 'flex';
        if (ocrStatusText) ocrStatusText.textContent = 'Luetaan tekstiä valokuvasta...';

        if (typeof window !== 'undefined' && window.Tesseract && window.Tesseract.recognize) {
            window.Tesseract.recognize(file, 'fin+eng', {
                logger: m => {
                    if (m.status === 'recognizing text' && ocrStatusText) {
                        const pct = Math.round((m.progress || 0) * 100);
                        ocrStatusText.textContent = `Tunnistetaan tekstiä... ${pct}%`;
                    }
                }
            }).then(result => {
                const text = result?.data?.text || '';
                parseOcrTextToPlayers(text);
            }).catch(err => {
                console.warn('Tesseract OCR error, falling back to manual entry:', err);
                parseOcrTextToPlayers('');
                showToast('Tekstintunnistus valmis. Voit tarkistaa ja täydentää pelaajat!');
            });
        } else {
            setTimeout(() => {
                parseOcrTextToPlayers('');
                showToast('Valokuvalukija valmis. Muokkaa tunnistettuja tietoja ja tallenna!');
            }, 600);
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
        document.getElementById('cloud-sync-badge')?.addEventListener('click', forceCloudSync);
        document.getElementById('cloudSyncBadge')?.addEventListener('click', forceCloudSync);

        // Firebase Auth Modal & Google Sign-In
        document.getElementById('btn-google-login')?.addEventListener('click', () => {
            if (!window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) {
                showToast('Pilvipalvelua alustetaan... Yritä hetken kuluttua.');
                return;
            }
            const auth = window.SalibandyFirebase.getAuth();
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            auth.signInWithPopup(provider)
                .then((result) => {
                    currentUser = result.user;
                    updateAuthUI();
                    document.getElementById('auth-modal')?.classList.remove('active');
                    showToast(`Kirjauduttu sisään Google-tilillä: ${result.user.email} 🎉`);
                    listenToCloudFirestore(result.user);
                })
                .catch((error) => {
                    console.warn('Google Popup sign-in error, trying redirect:', error);
                    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
                        auth.signInWithRedirect(provider).catch(e => {
                            showToast('Kirjautumisvirhe: ' + e.message);
                        });
                    } else {
                        showToast('Google-kirjautumisvirhe: ' + error.message);
                    }
                });
        });

        // Email Login
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value.trim();
            const password = document.getElementById('login-password')?.value;
            if (!email || !password) return;

            if (!window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) {
                showToast('Pilvipalvelu ei ole valmis.');
                return;
            }
            const auth = window.SalibandyFirebase.getAuth();
            auth.signInWithEmailAndPassword(email, password)
                .then((result) => {
                    currentUser = result.user;
                    updateAuthUI();
                    document.getElementById('auth-modal')?.classList.remove('active');
                    showToast(`Kirjauduttu sisään: ${result.user.email} 👍`);
                    listenToCloudFirestore(result.user);
                })
                .catch((err) => {
                    showToast('Kirjautuminen epäonnistui: ' + err.message);
                });
        });

        // Email Register
        document.getElementById('register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email')?.value.trim();
            const password = document.getElementById('reg-password')?.value;
            if (!email || !password) return;

            if (!window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) {
                showToast('Pilvipalvelu ei ole valmis.');
                return;
            }
            const auth = window.SalibandyFirebase.getAuth();
            auth.createUserWithEmailAndPassword(email, password)
                .then((result) => {
                    currentUser = result.user;
                    updateAuthUI();
                    document.getElementById('auth-modal')?.classList.remove('active');
                    showToast(`Tili luotu onnistuneesti: ${result.user.email} 🎉`);
                    listenToCloudFirestore(result.user);
                })
                .catch((err) => {
                    showToast('Tilin luonti epäonnistui: ' + err.message);
                });
        });

        // Auth Tabs
        document.getElementById('auth-tab-login')?.addEventListener('click', () => {
            document.getElementById('auth-tab-login')?.classList.add('active');
            document.getElementById('auth-tab-register')?.classList.remove('active');
            const lForm = document.getElementById('login-form');
            const rForm = document.getElementById('register-form');
            if (lForm) lForm.style.display = 'block';
            if (rForm) rForm.style.display = 'none';
        });

        document.getElementById('auth-tab-register')?.addEventListener('click', () => {
            document.getElementById('auth-tab-register')?.classList.add('active');
            document.getElementById('auth-tab-login')?.classList.remove('active');
            const lForm = document.getElementById('login-form');
            const rForm = document.getElementById('register-form');
            if (lForm) lForm.style.display = 'none';
            if (rForm) rForm.style.display = 'block';
        });

        document.getElementById('btn-close-auth-modal')?.addEventListener('click', () => {
            document.getElementById('auth-modal')?.classList.remove('active');
        });

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

            const duplicateLastBtn = e.target.closest('#btn-duplicate-court-board, [data-action="duplicate-last-court"]');
            if (duplicateLastBtn) {
                e.preventDefault();
                duplicateLastCourtToActivePage();
                return;
            }

            const duplicateCourtBtn = e.target.closest('[data-action="duplicate-court"]');
            if (duplicateCourtBtn) {
                e.preventDefault();
                duplicateCourtBoard(duplicateCourtBtn.dataset.courtId);
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

            const toggleFullscreenBtn = e.target.closest('[data-action="toggle-fullscreen-court"]');
            if (toggleFullscreenBtn) {
                e.preventDefault();
                toggleFullscreenCourt(toggleFullscreenBtn.dataset.courtId);
                return;
            }

            const openPresetsBtn = e.target.closest('[data-action="open-tactical-presets"]');
            if (openPresetsBtn) {
                e.preventDefault();
                openTacticalPresetsModal(openPresetsBtn.dataset.courtId);
                return;
            }

            const exportPngBtn = e.target.closest('[data-action="export-court-png"]');
            if (exportPngBtn) {
                e.preventDefault();
                exportCourtToPng(exportPngBtn.dataset.courtId);
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
                lineupExtraPlayers[courtKey] = [];
                lineupTextNotes[courtKey] = [];
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

            const populateAllBtn = e.target.closest('[data-action="populate-all-players"]');
            if (populateAllBtn) {
                e.preventDefault();
                populateAllPlayersToCourt(populateAllBtn.dataset.courtId);
                return;
            }

            const toggleGridPaperBtn = e.target.closest('[data-action="toggle-grid-paper"]');
            if (toggleGridPaperBtn) {
                e.preventDefault();
                toggleGridPaperForCourt(toggleGridPaperBtn.dataset.courtId);
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

            const addExtraPlayerBtn = e.target.closest('[data-action="add-extra-player"]');
            if (addExtraPlayerBtn) {
                e.preventDefault();
                addExtraPlayerToCourt(addExtraPlayerBtn.dataset.courtId);
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
                toggleCourtOrientation();
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

            const removeExtraPlayerBtn = e.target.closest('[data-action="remove-extra-player"]');
            if (removeExtraPlayerBtn) {
                e.preventDefault();
                const extraId = removeExtraPlayerBtn.dataset.extraId;
                const courtId = removeExtraPlayerBtn.dataset.courtId;
                const courtKey = getCourtKey(courtId);
                if (lineupExtraPlayers[courtKey]) {
                    lineupExtraPlayers[courtKey] = lineupExtraPlayers[courtKey].filter(p => p.id !== extraId);
                    saveState();
                    renderCourtBoards();
                    showToast('Oma pelaaja poistettu.');
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

            const editLineNumberBtn = e.target.closest('[data-action="edit-line-number"]');
            if (editLineNumberBtn) {
                e.preventDefault();
                e.stopPropagation();
                editLineStepNumber(editLineNumberBtn.dataset.courtId, editLineNumberBtn.dataset.lineId);
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

            const removeTextBtn = e.target.closest('[data-action="remove-text"]');
            if (removeTextBtn) {
                e.preventDefault();
                const textId = removeTextBtn.dataset.textId;
                const courtId = removeTextBtn.dataset.courtId;
                const courtKey = getCourtKey(courtId);
                if (lineupTextNotes[courtKey]) {
                    lineupTextNotes[courtKey] = lineupTextNotes[courtKey].filter(t => t.id !== textId);
                    saveState();
                    renderCourtBoards();
                    showToast('Teksti poistettu.');
                }
                return;
            }

            const editTextBtn = e.target.closest('[data-action="edit-text"]');
            if (editTextBtn) {
                e.preventDefault();
                const textId = editTextBtn.dataset.textId;
                const courtId = editTextBtn.dataset.courtId;
                editCourtTextNote(courtId, textId);
                return;
            }
        });

        let descDebounceTimer = null;
        document.getElementById('courts-vertical-list')?.addEventListener('input', (e) => {
            const descInput = e.target.closest('[data-action="court-description-input"]');
            if (descInput) {
                const courtId = descInput.dataset.courtId;
                const page = getCurrentPage();
                const courtObj = page.courts.find(c => c.id === courtId);
                if (courtObj) {
                    courtObj.description = descInput.value;
                    if (descDebounceTimer) clearTimeout(descDebounceTimer);
                    descDebounceTimer = setTimeout(() => {
                        saveState();
                    }, 500);
                }
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

        // Multi-select position pills toggle in modal
        document.getElementById('form-position-pills')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.pos-select-pill');
            if (!btn) return;
            e.preventDefault();
            btn.classList.toggle('active');

            const activePills = document.querySelectorAll('#form-position-pills .pos-select-pill.active');
            if (activePills.length === 0) {
                btn.classList.add('active');
            }

            const selected = Array.from(document.querySelectorAll('#form-position-pills .pos-select-pill.active'))
                .map(b => (b.dataset.pos || '').toUpperCase());
            const hiddenPosInput = document.getElementById('form-position');
            if (hiddenPosInput) hiddenPosInput.value = selected.join(', ');
        });

        // Photo upload listener
        document.getElementById('form-photo-input')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = 160;
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    const minDim = Math.min(img.width, img.height);
                    const sx = (img.width - minDim) / 2;
                    const sy = (img.height - minDim) / 2;
                    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    setPlayerPhotoPreview(dataUrl);
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('btn-remove-photo')?.addEventListener('click', () => {
            const fileInput = document.getElementById('form-photo-input');
            if (fileInput) fileInput.value = '';
            setPlayerPhotoPreview('');
        });

        document.getElementById('player-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const formPlayerId = document.getElementById('form-player-id');
            const formName = document.getElementById('form-name');
            const formNumber = document.getElementById('form-number');
            const formIsLoan = document.getElementById('form-is-loan');
            const formNotes = document.getElementById('form-notes');
            const formPhotoData = document.getElementById('form-photo-data');

            const activePills = Array.from(document.querySelectorAll('#form-position-pills .pos-select-pill.active'))
                .map(b => (b.dataset.pos || '').toUpperCase());
            const positions = activePills.length > 0 ? activePills : ['H'];
            const position = positions.join(', ');

            const id = (formPlayerId && formPlayerId.value) ? formPlayerId.value : ('p_' + Date.now());
            const name = formName ? formName.value.trim() : '';
            const number = formNumber ? parseInt(formNumber.value, 10) : NaN;
            const isLoan = formIsLoan ? formIsLoan.checked : false;
            const notes = formNotes ? formNotes.value.trim() : '';
            const photo = formPhotoData ? formPhotoData.value : '';

            if (!name || isNaN(number)) return;

            const existingIndex = roster.findIndex(p => p.id === id);
            const playerData = { id, name, number, position, positions, isLoan, notes, photo };

            if (existingIndex >= 0) {
                roster[existingIndex] = playerData;
                showToast('Pelaajan tiedot, pelipaikat ja kuva päivitetty!');
            } else {
                roster.push(playerData);
                showToast('Uusi pelaaja lisätty rinkiin!');
            }

            // Sync updated photo and name to all placed extra players on courts
            Object.keys(lineupExtraPlayers).forEach(ck => {
                if (Array.isArray(lineupExtraPlayers[ck])) {
                    lineupExtraPlayers[ck].forEach(ep => {
                        if (ep.playerId === id || (ep.label && (ep.label === '#' + number || ep.label === String(number)))) {
                            ep.playerId = id;
                            ep.fullName = name;
                            ep.label = '#' + number;
                            ep.photo = photo;
                            ep.position = position;
                        }
                    });
                }
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

        // Photo Modal Event Listeners
        document.getElementById('btn-import-photo')?.addEventListener('click', openPhotoModal);
        document.getElementById('btn-photo-add')?.addEventListener('click', openPhotoModal);
        document.getElementById('btn-close-photo-modal')?.addEventListener('click', () => {
            document.getElementById('photo-modal')?.classList.remove('active');
        });

        const photoFileInput = document.getElementById('photo-file-input');
        photoFileInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) processPhotoFile(file);
        });

        const fileDropArea = document.getElementById('file-drop-area');
        if (fileDropArea) {
            fileDropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileDropArea.classList.add('drag-active');
            });
            fileDropArea.addEventListener('dragleave', () => {
                fileDropArea.classList.remove('drag-active');
            });
            fileDropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileDropArea.classList.remove('drag-active');
                const file = e.dataTransfer?.files?.[0];
                if (file) processPhotoFile(file);
            });
        }

        document.getElementById('btn-reselect-photo')?.addEventListener('click', () => {
            const fDrop = document.getElementById('file-drop-area');
            const oStatus = document.getElementById('ocr-status');
            const pPreview = document.getElementById('photo-preview-step');
            const fInput = document.getElementById('photo-file-input');

            if (fDrop) fDrop.style.display = 'block';
            if (oStatus) oStatus.style.display = 'none';
            if (pPreview) pPreview.style.display = 'none';
            if (fInput) fInput.value = '';
        });

        document.getElementById('btn-confirm-ocr-import')?.addEventListener('click', () => {
            const ocrRows = document.querySelectorAll('#ocr-results-list .ocr-item-row');
            let addedCount = 0;

            ocrRows.forEach(row => {
                const numInput = row.querySelector('.ocr-num-input');
                const nameInput = row.querySelector('.ocr-name-input');
                const posInput = row.querySelector('.ocr-pos-input');

                const number = numInput ? parseInt(numInput.value, 10) : NaN;
                const name = nameInput ? nameInput.value.trim() : '';
                const position = posInput ? posInput.value : 'H';

                if (name && !isNaN(number)) {
                    roster.push({
                        id: 'p_ocr_' + Date.now() + '_' + (addedCount++),
                        name: name,
                        number: number,
                        position: position,
                        positions: [position],
                        isLoan: false,
                        notes: 'Tuotu kuvasta 📷'
                    });
                }
            });

            if (addedCount > 0) {
                saveState();
                updateRosterCounters();
                renderRoster();
                closeModal();
                showToast(`${addedCount} pelaajaa tuotu valokuvasta rinkiin! 🎉`);
            } else {
                showToast('Ei lisättäviä pelaajia.');
            }
        });

        document.getElementById('roster-search')?.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderRoster();
        });

        // Multi-select Roster Filter Pills
        const filterContainer = document.getElementById('roster-filter-pills');
        if (filterContainer) {
            filterContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.pill-btn');
                if (!btn) return;
                const filterKey = btn.dataset.filter;
                if (!filterKey) return;

                if (filterKey === 'all') {
                    activeFilters.clear();
                    activeFilters.add('all');
                } else {
                    activeFilters.delete('all');
                    if (activeFilters.has(filterKey)) {
                        activeFilters.delete(filterKey);
                    } else {
                        activeFilters.add(filterKey);
                    }
                    if (activeFilters.size === 0) {
                        activeFilters.add('all');
                    }
                }

                filterContainer.querySelectorAll('.pill-btn').forEach(b => {
                    const k = b.dataset.filter;
                    if (activeFilters.has(k)) {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });

                renderRoster();
            });
        }

        let rosterCardClickTimer = null;
        let lastRosterClickId = null;
        let lastRosterClickTime = 0;

        document.getElementById('roster-list-container')?.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.mini-action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const id = actionBtn.dataset.id;
                if (action === 'edit') {
                    const player = roster.find(p => p.id === id);
                    if (player) openModal(player);
                } else if (action === 'delete') {
                    deletePlayer(id);
                }
                return;
            }

            const tapAssignTrigger = e.target.closest('[data-action="tap-assign"]');
            if (tapAssignTrigger) {
                const id = tapAssignTrigger.dataset.id;
                const player = roster.find(p => p.id === id);
                if (!player) return;

                const now = Date.now();
                if (lastRosterClickId === id && (now - lastRosterClickTime < 380)) {
                    // Double click / double tap detected!
                    if (rosterCardClickTimer) clearTimeout(rosterCardClickTimer);
                    lastRosterClickTime = 0;
                    lastRosterClickId = null;
                    openModal(player);
                } else {
                    // First click, wait 260ms before opening assign modal to allow double click
                    lastRosterClickId = id;
                    lastRosterClickTime = now;
                    if (rosterCardClickTimer) clearTimeout(rosterCardClickTimer);
                    rosterCardClickTimer = setTimeout(() => {
                        openAssignModal(player);
                    }, 260);
                }
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

            const removeReserveBtn = e.target.closest('[data-action="remove-reserve"]');
            if (removeReserveBtn) {
                e.stopPropagation();
                const pos = removeReserveBtn.dataset.pos;
                const rId = removeReserveBtn.dataset.reserveId;
                if (pos === 'general') {
                    removeGeneralReserve(activeLineupKey, rId);
                } else {
                    removePosReserve(activeLineupKey, pos, rId);
                }
                saveState();
                renderActiveLineupSlots();
                showToast('Varamies poistettu.');
                return;
            }

            const addPosReserveBtn = e.target.closest('[data-action="open-add-reserve"]');
            if (addPosReserveBtn) {
                e.stopPropagation();
                const pos = addPosReserveBtn.dataset.pos;
                openSlotPickerModal(activeLineupKey, pos, true);
                return;
            }

            const addGenReserveBtn = e.target.closest('[data-action="open-add-general-reserve"]');
            if (addGenReserveBtn) {
                e.stopPropagation();
                openSlotPickerModal(activeLineupKey, 'general', true);
                return;
            }

            const slotEl = e.target.closest('.lineup-slot');
            if (slotEl) {
                const pos = slotEl.dataset.position;
                if (pos) openSlotPickerModal(activeLineupKey, pos, false);
            }
        });

        document.addEventListener('pointerdown', (e) => {
            if (!e.target.closest('.court-player-node, .court-extra-player-node, .court-ball-node, .court-cone-node, .court-opponent-node, .court-rect-node, .court-line-node, .line-endpoint-handle, button')) {
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
            if (labelMode === 'photo') {
                labelMode = 'full';
            } else if (labelMode === 'full') {
                labelMode = 'num';
            } else if (labelMode === 'num') {
                labelMode = 'name';
            } else {
                labelMode = 'photo';
            }
            localStorage.setItem('salibandy_label_mode', labelMode);
            applyThemeAndSettings();
            renderCourtBoards();
        });

        document.getElementById('btn-export-text')?.addEventListener('click', () => openExportTextModal(null));
        document.getElementById('btn-copy-this-lineup')?.addEventListener('click', () => openExportTextModal(activeLineupKey));
        document.getElementById('btn-copy-all-summary')?.addEventListener('click', () => openExportTextModal(null));

        // EXPORT PREVIEW MODAL EVENTS
        document.getElementById('btn-close-export-modal')?.addEventListener('click', () => {
            document.getElementById('export-modal')?.classList.remove('active');
        });
        document.getElementById('btn-close-export-modal-bottom')?.addEventListener('click', () => {
            document.getElementById('export-modal')?.classList.remove('active');
        });

        document.getElementById('btn-copy-export-modal')?.addEventListener('click', () => {
            const textarea = document.getElementById('export-modal-textarea');
            if (textarea && textarea.value) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textarea.value).then(() => {
                        showToast('Kentälliset kopioitu leikepöydälle! 📋');
                    }).catch(() => {
                        textarea.select();
                        document.execCommand('copy');
                        showToast('Kentälliset kopioitu leikepöydälle! 📋');
                    });
                } else {
                    textarea.select();
                    document.execCommand('copy');
                    showToast('Kentälliset kopioitu leikepöydälle! 📋');
                }
            }
        });

        document.getElementById('btn-wa-export-modal')?.addEventListener('click', () => {
            const textarea = document.getElementById('export-modal-textarea');
            if (textarea && textarea.value) {
                const text = encodeURIComponent(textarea.value);
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            }
        });

        // SHARE MODAL EVENTS
        document.getElementById('btn-open-share-modal')?.addEventListener('click', openShareModal);
        document.getElementById('btn-close-share-modal')?.addEventListener('click', () => {
            document.getElementById('share-modal')?.classList.remove('active');
        });
        document.getElementById('btn-close-share-modal-bottom')?.addEventListener('click', () => {
            document.getElementById('share-modal')?.classList.remove('active');
        });

        document.getElementById('btn-copy-coach-link')?.addEventListener('click', () => {
            const input = document.getElementById('share-link-coach');
            if (input && input.value) {
                navigator.clipboard.writeText(input.value);
                showToast('Valmentajalinki kopioitu leikepöydälle! 📋');
            }
        });

        document.getElementById('btn-copy-viewer-link')?.addEventListener('click', () => {
            const input = document.getElementById('share-link-viewer');
            if (input && input.value) {
                navigator.clipboard.writeText(input.value);
                showToast('Katselulinkki kopioitu leikepöydälle! 📋');
            }
        });

        document.getElementById('btn-wa-coach-link')?.addEventListener('click', () => {
            const input = document.getElementById('share-link-coach');
            const curTeam = teams.find(t => t.id === currentTeamId);
            const tName = curTeam ? curTeam.name : 'Joukkue';
            if (input && input.value) {
                const text = encodeURIComponent(`Tässä ${tName} -valmentajalinki (muokkausoikeus): ${input.value}`);
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            }
        });

        document.getElementById('btn-wa-viewer-link')?.addEventListener('click', () => {
            const input = document.getElementById('share-link-viewer');
            const curTeam = teams.find(t => t.id === currentTeamId);
            const tName = curTeam ? curTeam.name : 'Joukkue';
            if (input && input.value) {
                const text = encodeURIComponent(`Tässä ${tName} -kentälliset ja taktiikat (katselulinkki): ${input.value}`);
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            }
        });

        document.getElementById('btn-regenerate-share-link')?.addEventListener('click', () => {
            const curTeam = teams.find(t => t.id === currentTeamId);
            if (curTeam && confirm('Luodaanko uusi jakotunniste? Vanhat jakolinkit lakkaavat toimimasta.')) {
                curTeam.shareId = 'st_' + currentTeamId.replace(/[^a-zA-Z0-9]/g, '') + '_' + Math.random().toString(36).substr(2, 6);
                saveState();
                openShareModal();
                showToast('Uusi jakotunniste luotu! 🔄');
            }
        });

        // SETTINGS MODAL EVENTS
        document.getElementById('btn-open-settings-modal')?.addEventListener('click', openSettingsModal);
        document.getElementById('btn-close-settings-modal')?.addEventListener('click', () => {
            document.getElementById('settings-modal')?.classList.remove('active');
        });
        document.getElementById('btn-close-settings-done')?.addEventListener('click', () => {
            document.getElementById('settings-modal')?.classList.remove('active');
        });

        // Theme selector buttons
        document.querySelectorAll('.theme-opt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                appTheme = btn.dataset.theme;
                localStorage.setItem('salibandy_theme', appTheme);
                applyThemeAndSettings();
                showToast(`Teema asetettu: ${appTheme === 'dark' ? 'Tumma 🌙' : appTheme === 'light' ? 'Vaalea ☀️' : 'Automaatti 💻'}`);
            });
        });

        // Court color swatches
        document.querySelectorAll('.color-swatch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                courtColor = btn.dataset.courtColor;
                localStorage.setItem('salibandy_court_color', courtColor);
                applyThemeAndSettings();
                showToast(`Pelialustan väri asetettu! 🏟️`);
            });
        });

        // Label mode buttons
        document.querySelectorAll('.label-opt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                labelMode = btn.dataset.label;
                localStorage.setItem('salibandy_label_mode', labelMode);
                applyThemeAndSettings();
                renderCourtBoards();
                showToast(`Pelaajatunnisteen esitys päivitetty: ${labelMode}`);
            });
        });

        // Backup and Restore
        document.getElementById('btn-export-backup-json')?.addEventListener('click', exportBackupJson);
        document.getElementById('btn-trigger-restore-json')?.addEventListener('click', () => {
            document.getElementById('backup-file-input')?.click();
        });
        document.getElementById('backup-file-input')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                restoreBackupJson(file);
                e.target.value = '';
            }
        });

        // ==========================================
        // TEAM CUSTOMIZATION LISTENERS (v37.0)
        // ==========================================
        document.getElementById('btn-customize-team')?.addEventListener('click', openTeamCustomizeModal);
        document.getElementById('header-team-logo-wrapper')?.addEventListener('click', openTeamCustomizeModal);
        document.getElementById('btn-close-team-customize-modal')?.addEventListener('click', () => {
            document.getElementById('team-customize-modal')?.classList.remove('active');
        });
        document.getElementById('btn-save-team-customize')?.addEventListener('click', saveTeamCustomize);

        document.getElementById('btn-upload-team-logo')?.addEventListener('click', () => {
            document.getElementById('team-logo-file-input')?.click();
        });

        document.getElementById('team-logo-file-input')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    tempTeamLogo = evt.target.result;
                    updateLogoPreviewDisplay();
                };
                reader.readAsDataURL(file);
                e.target.value = '';
            }
        });

        document.getElementById('btn-remove-team-logo')?.addEventListener('click', () => {
            tempTeamLogo = '🏑';
            updateLogoPreviewDisplay();
        });

        document.querySelectorAll('.logo-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                tempTeamLogo = btn.dataset.icon;
                updateLogoPreviewDisplay();
            });
        });

        const custPrimaryColorInput = document.getElementById('cust-primary-color');
        const custPrimaryColorText = document.getElementById('cust-primary-color-text');
        custPrimaryColorInput?.addEventListener('input', (e) => {
            tempPrimaryColor = e.target.value;
            if (custPrimaryColorText) custPrimaryColorText.textContent = tempPrimaryColor;
        });

        const custMvColorInput = document.getElementById('cust-mv-color');
        const custMvColorText = document.getElementById('cust-mv-color-text');
        custMvColorInput?.addEventListener('input', (e) => {
            tempMvColor = e.target.value;
            if (custMvColorText) custMvColorText.textContent = tempMvColor;
        });

        document.querySelectorAll('#chips-primary-color .color-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                tempPrimaryColor = chip.dataset.color;
                if (custPrimaryColorInput) custPrimaryColorInput.value = tempPrimaryColor;
                if (custPrimaryColorText) custPrimaryColorText.textContent = tempPrimaryColor;
            });
        });

        document.querySelectorAll('#chips-mv-color .color-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                tempMvColor = chip.dataset.color;
                if (custMvColorInput) custMvColorInput.value = tempMvColor;
                if (custMvColorText) custMvColorText.textContent = tempMvColor;
            });
        });

        document.querySelectorAll('.token-style-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.token-style-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                tempTokenStyle = btn.dataset.style;
            });
        });

        document.querySelectorAll('.rink-style-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.rink-style-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                tempRinkColor = btn.dataset.rink;
            });
        });

        // ==========================================
        // MATCH INFO LISTENERS (v37.0)
        // ==========================================
        document.getElementById('btn-open-match-modal')?.addEventListener('click', openMatchModal);
        document.getElementById('btn-close-match-modal')?.addEventListener('click', () => {
            document.getElementById('match-info-modal')?.classList.remove('active');
        });
        document.getElementById('match-info-form')?.addEventListener('submit', saveMatchInfo);
        document.getElementById('btn-clear-match-info')?.addEventListener('click', clearMatchInfo);
        document.getElementById('btn-toggle-match-banner')?.addEventListener('click', () => {
            const curTeam = teams.find(t => t.id === currentTeamId);
            if (curTeam) {
                if (!curTeam.matchInfo) curTeam.matchInfo = {};
                curTeam.matchInfo.showBanner = !curTeam.matchInfo.showBanner;
                saveState();
                applyThemeAndSettings();
            }
        });

        // ==========================================
        // TACTICAL PRESETS LISTENERS (v37.0)
        // ==========================================
        document.getElementById('btn-close-tactical-presets-modal')?.addEventListener('click', () => {
            document.getElementById('tactical-presets-modal')?.classList.remove('active');
        });
        document.getElementById('btn-close-tactical-presets-bottom')?.addEventListener('click', () => {
            document.getElementById('tactical-presets-modal')?.classList.remove('active');
        });

        document.getElementById('tactical-presets-grid')?.addEventListener('click', (e) => {
            const applyBtn = e.target.closest('[data-action="apply-preset"]');
            if (applyBtn) {
                const preset = applyBtn.dataset.preset;
                applyTacticalPreset(targetCourtIdForPreset, preset);
            }
        });

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => {
                const page = getCurrentPage();
                if (page && page.courts) {
                    page.courts.forEach(court => {
                        initCourtBoardInstance(court.id);
                    });
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && activeFullscreenCourtId) {
                    toggleFullscreenCourt(activeFullscreenCourtId);
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
