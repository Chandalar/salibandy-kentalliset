/**
 * KENTÄLLISET SIMPLE (Kevytversio) – Engine v2.0
 * Multi-engine Nimenhuuto & myClub fetching (Jina Reader, AllOrigins, iCal)
 * High-speed live attendees integration & responsive multi-column lineup builder
 */

(function() {
    'use strict';

    // State
    let deletedTeamIds = [];
    try {
        const rawDel = localStorage.getItem('salibandy_deleted_team_ids');
        deletedTeamIds = rawDel ? JSON.parse(rawDel) : [];
    } catch(e) { deletedTeamIds = []; }
    let teams = [];
    let currentTeamId = null;
    let roster = [];
    let lineups = {};
    let lineupConfigs = [];
    let teamEvents = [];
    let activeEventId = null;
    let lineupReserves = {}; // Map of lineupKey -> array of playerIds
    let activeLineupTab = 'all'; // Default to 'all' so multiple lines are visible at once!
    let activeRosterFilter = 'all';
    let simpleDensity = localStorage.getItem('salibandy_simple_density') || '2col';
    let rosterDensity = localStorage.getItem('salibandy_roster_density') || '2col';
    let rosterSearchQuery = '';

    function isPlayerIn1to4(playerId) {
        if (!playerId) return false;
        const lines1to4 = ['1', '2', '3', '4'];
        for (let i = 0; i < lines1to4.length; i++) {
            const lk = lines1to4[i];
            const line = lineups[lk];
            if (line) {
                for (let j = 0; j < POS_ORDER.length; j++) {
                    if (line[POS_ORDER[j]] === playerId) return true;
                }
            }
        }
        return false;
    }

    function updateRosterDensityUI() {
        const list = document.getElementById('simple-roster-list');
        const btn = document.getElementById('btn-toggle-roster-density');
        if (!list) return;
        if (rosterDensity === '2col') {
            list.classList.add('density-2col');
            list.classList.remove('density-1col');
            if (btn) btn.innerHTML = '▦ 2-sarake';
        } else {
            list.classList.add('density-1col');
            list.classList.remove('density-2col');
            if (btn) btn.innerHTML = '▤ 1-sarake';
        }
    }

    // Firebase & Cloud State
    const clientInstanceId = 'simple_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    let currentUser = null;
    let unsubscribeFirestore = null;
    let unsubscribeSharedTeam = null;
    let currentSharedTeamId = null;
    let isCloudLoading = false;
    let lastLoadedCloudPayloadString = '';
    let cloudSyncDebounceTimer = null;
    let sharedTeamSyncDebounceTimer = null;

    // Test & diagnostic helper
    if (typeof window !== 'undefined') {
        window.__getSimpleState = () => ({ lineups, roster, teams, currentTeamId, clientInstanceId, currentSharedTeamId });
    }

    // DOM Elements
    const teamSelect = document.getElementById('simple-team-select');
    const eventSelect = document.getElementById('simple-event-select');
    const teamLogoBadge = document.getElementById('team-logo-badge');
    const statsBar = document.getElementById('simple-stats-bar');
    const lineupNavBar = document.getElementById('lineup-nav-bar');
    const lineupCardContainer = document.getElementById('lineup-card-container');
    const rosterListContainer = document.getElementById('simple-roster-list');
    const toastEl = document.getElementById('simple-toast');
    const modalEl = document.getElementById('simple-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('btn-modal-close');

    // Cloud & Share DOM Elements
    const btnSimpleCloud = document.getElementById('btn-simple-cloud');
    const btnSimpleShare = document.getElementById('btn-simple-share');
    const cloudModal = document.getElementById('simple-cloud-modal');
    const cloudModalBody = document.getElementById('simple-cloud-modal-body');
    const btnCloseCloudModal = document.getElementById('btn-close-cloud-modal');
    const shareModal = document.getElementById('simple-share-modal');
    const shareModalBody = document.getElementById('simple-share-modal-body');
    const btnCloseShareModal = document.getElementById('btn-close-share-modal');

    // Sync Modal
    const syncModal = document.getElementById('event-sync-modal');
    const syncUrlInput = document.getElementById('input-sync-url');
    const btnCloseSyncModal = document.getElementById('btn-close-sync-modal');
    const btnOpenSyncModal = document.getElementById('btn-open-sync-modal');
    const btnOpenSyncSettings = document.getElementById('btn-open-sync-settings');
    const btnDoFetchEvents = document.getElementById('btn-do-fetch-events');
    const btnDoPasteAttendance = document.getElementById('btn-do-paste-attendance');
    const inputPasteAttendance = document.getElementById('input-paste-attendance');

    // Positions
    const POS_ORDER = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];
    const POS_ORDER_6V5 = ['VP', 'OP', 'VH', 'KH', 'OH', '6P'];
    const POS_LABELS = {
        'MV': 'Maalivahti',
        'VP': 'Vasen pakki',
        'OP': 'Oikea pakki',
        'VH': 'Vasen hyökkääjä',
        'KH': 'Sentteri (C)',
        'OH': 'Oikea hyökkääjä',
        '6P': '6. Pelaaja',
        'VM': '6. Pelaaja'
    };

    // Canonical lineup configurations for Simple mode:
    // Only 1-4 standard lines, 2x YV & 2x AV, and 2x 6vs5 lines!
    const SIMPLE_LINEUP_CONFIGS = [
        { id: '1', name: '1. Kenttä', shortName: '1. K.', group: 'standard', icon: '🏒' },
        { id: '2', name: '2. Kenttä', shortName: '2. K.', group: 'standard', icon: '🏒' },
        { id: '3', name: '3. Kenttä', shortName: '3. K.', group: 'standard', icon: '🏒' },
        { id: '4', name: '4. Kenttä', shortName: '4. K.', group: 'standard', icon: '🏒' },
        { id: 'yv1', name: '1. Ylivoima (YV)', shortName: '1. YV', group: 'yv_av', icon: '⚡' },
        { id: 'yv2', name: '2. Ylivoima (YV)', shortName: '2. YV', group: 'yv_av', icon: '⚡' },
        { id: 'av1', name: '1. Alivoima (AV)', shortName: '1. AV', group: 'yv_av', icon: '🛡️' },
        { id: 'av2', name: '2. Alivoima (AV)', shortName: '2. AV', group: 'yv_av', icon: '🛡️' },
        { id: '6v5_1', name: '1. 6vs5 (Ilman MV)', shortName: '1. 6v5', group: '6v5', icon: '🔥' },
        { id: '6v5_2', name: '2. 6vs5 (Ilman MV)', shortName: '2. 6v5', group: '6v5', icon: '🔥' }
    ];

    const DEFAULT_TEAMS = [
        { id: 'default_team', name: 'SekTa', logo: '🏑', primaryColor: '#2563eb', mvColor: '#10b981', eventsUrl: 'https://sekta.nimenhuuto.com/events', nimenhuutoUrl: 'https://sekta.nimenhuuto.com/events' },
        { id: 'team_akatemia', name: 'FBC Akatemia', logo: '🦅', primaryColor: '#dc2626', mvColor: '#10b981' },
        { id: 'team_edustus', name: 'Edustusjoukkue', logo: '🦁', primaryColor: '#2563eb', mvColor: '#10b981' },
        { id: 'team_junnut', name: 'A-Juniorit', logo: '⚡', primaryColor: '#dc2626', mvColor: '#eab308' }
    ];

    const DEFAULT_AKATEMIA_ROSTER = [
        // 🟢 Maalivahdit
        { id: 'p_ocr_1786787489945_1', name: 'Sivil Daniel', number: 33, position: 'MV', notes: 'In 👍' },

        // 🔵 Kenttäpelaajat
        { id: 'p_ocr_1786787489945_7', name: 'Pelllä Jooa', number: 7, position: 'VP', notes: 'In 👍' },
        { id: 'p_ocr_1786787489945_8', name: 'Männistö Juho', number: 4, position: 'OP', notes: 'In 👍' },
        { id: 'p_ocr_1786787489945_0', name: 'Laine Nico', number: 44, position: 'VH', notes: 'In 👍' },
        { id: 'p_ocr_1786787489945_2', name: 'Tiihonen Henri', number: 2, position: 'KH', notes: 'In 👍' },
        { id: 'p_ocr_1786787489945_6', name: 'Sinkkonen Aleksi', number: 12, position: 'OH', notes: 'In 👍' },
        { id: 'p_ocr_1786787489945_3', name: 'Lehtonen Elias', number: 2, position: 'VP', notes: 'In 👍' },
        { id: 'p_ocr_1786787489945_4', name: 'Lehtovirta Valtteri', number: 2, position: 'OP', notes: 'In 👍' },
        { id: 'p_ocr_1786787489945_5', name: 'Vuorenpää Vil', number: 19, position: 'VH', notes: 'In 👍' },
        { id: 'p_ocr_1786787489945_9', name: 'Rantasalo Elsa', number: 4, position: 'KH', notes: 'In 👍' },
        { id: 'p_ocr_1786787489945_10', name: 'Kallio Luukas', number: 2, position: 'OH', notes: 'In 👍' },
        { id: 'p_1789731527753', name: 'Vesku', number: 99, position: 'H', notes: 'In 👍' }
    ];

    const DEFAULT_SEKTA_EVENTS = [
        {
            id: 'event_20207056',
            title: 'Matsi · Harkkapeli VS CAMPUS',
            date: 'Ma 28.9. klo 20:00',
            location: 'leaf areena, turku 2 kenttä Lisätiedot:Valkoinen paita',
            source: 'nimenhuuto',
            attendees: {
                p_mv23: { status: 'in', reason: '' },
                p_19: { status: 'in', reason: '' },
                p_20: { status: 'in', reason: '' },
                p_42: { status: 'in', reason: '' },
                p_64: { status: 'in', reason: '' },
                p_71: { status: 'out', reason: '' },
                p_4: { status: 'in', reason: '' },
                p_11: { status: 'in', reason: '' },
                p_88: { status: 'in', reason: '' },
                p_10: { status: 'in', reason: '' },
                p_22: { status: 'in', reason: '' },
                p_66: { status: 'in', reason: '' }
            }
        },
        {
            id: 'event_20106918',
            title: 'Harkka · SekTa - TVV',
            date: 'Ke 30.9. klo 20:00',
            location: 'leaf areena, turku Lisätiedot:Kenttä 1. Valkoinen paita',
            source: 'nimenhuuto',
            attendees: {
                p_mv23: { status: 'in', reason: '' },
                p_19: { status: 'in', reason: '' },
                p_20: { status: 'in', reason: '' },
                p_42: { status: 'in', reason: '' },
                p_64: { status: 'in', reason: '' },
                p_88: { status: 'out', reason: '' }
            }
        },
        {
            id: 'event_20329753',
            title: 'Matsi · SekTa - SBS Wirmo 2',
            date: 'Su 4.10. klo 11:30',
            location: 'SB-Areena, Raunistulantie 15, 20300 Turku Viimeisin kommentti: Heikki 6 päivää sitten Lisätiedot:https://tulospalvelu.salibandy.fi/match/933793',
            source: 'nimenhuuto',
            attendees: {
                p_mv7: { status: 'in', reason: '' },
                p_19: { status: 'in', reason: '' },
                p_42: { status: 'in', reason: '' },
                p_4: { status: 'in', reason: '' },
                p_21: { status: 'in', reason: '' },
                p_15: { status: 'out', reason: '' },
                p_87: { status: 'out', reason: '' },
                p_66: { status: 'out', reason: '' }
            }
        },
        {
            id: 'event_20329754',
            title: 'Matsi · Airisto SB - SekTa',
            date: 'Su 4.10. klo 14:00',
            location: 'SB-Areena, Raunistulantie 15, 20300 Turku Lisätiedot:https://tulospalvelu.salibandy.fi/match/933794',
            source: 'nimenhuuto',
            attendees: {
                p_mv7: { status: 'in', reason: '' },
                p_19: { status: 'in', reason: '' },
                p_42: { status: 'in', reason: '' },
                p_4: { status: 'in', reason: '' },
                p_21: { status: 'in', reason: '' },
                p_15: { status: 'out', reason: '' },
                p_87: { status: 'out', reason: '' },
                p_66: { status: 'out', reason: '' }
            }
        },
        {
            id: 'event_20207058',
            title: 'Harkka · Omat harkat',
            date: 'Ma 5.10. klo 21:00',
            location: 'Kupittaan palloiluhalli kenttä 3',
            source: 'nimenhuuto',
            attendees: {
                p_19: { status: 'in', reason: '' }
            }
        },
        {
            id: 'event_20106919',
            title: 'Harkka · SekTa - TVV',
            date: 'Ke 7.10. klo 20:00',
            location: 'leaf areena, turku Lisätiedot:Kenttä 1. Valkoinen paita',
            source: 'nimenhuuto',
            attendees: {
                p_19: { status: 'in', reason: '' }
            }
        },
        {
            id: 'event_20207059',
            title: 'Harkka · Omat harkat',
            date: 'Ma 12.10. klo 21:00',
            location: 'Kupittaan palloiluhalli kenttä 3',
            source: 'nimenhuuto',
            attendees: {
                p_19: { status: 'in', reason: '' }
            }
        },
        {
            id: 'event_20106920',
            title: 'Harkka · SekTa - TVV',
            date: 'Ke 14.10. klo 20:00',
            location: 'leaf areena, turku Lisätiedot:Kenttä 1. Valkoinen paita',
            source: 'nimenhuuto',
            attendees: {
                p_19: { status: 'in', reason: '' }
            }
        },
        {
            id: 'event_20207060',
            title: 'Harkka · Omat harkat',
            date: 'Ma 19.10. klo 21:00',
            location: 'Kupittaan palloiluhalli kenttä 3',
            source: 'nimenhuuto',
            attendees: {
                p_19: { status: 'in', reason: '' }
            }
        },
        {
            id: 'event_20106921',
            title: 'Harkka · SekTa - TVV',
            date: 'Ke 21.10. klo 20:00',
            location: 'leaf areena, turku Lisätiedot:Kenttä 1. Valkoinen paita',
            source: 'nimenhuuto',
            attendees: {
                p_19: { status: 'in', reason: '' }
            }
        }
    ];

    function showToast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.style.display = 'flex';
        clearTimeout(toastEl._timer);
        toastEl._timer = setTimeout(() => {
            toastEl.style.display = 'none';
        }, 2500);
    }

    // ── RENDER SCHEDULER ─────────────────────────────────────────────
    // Batch multiple render calls into a single requestAnimationFrame tick.
    // This prevents DOM thrashing and paint artifacts on mobile (black areas).
    let _renderScheduled = false;
    let _renderFlags = { header: false, eventBar: false, tabs: false, cards: false, roster: false };

    function scheduleRender(flags = {}) {
        Object.assign(_renderFlags, flags);
        if (_renderScheduled) return;
        _renderScheduled = true;
        requestAnimationFrame(() => {
            _renderScheduled = false;
            const f = _renderFlags;
            _renderFlags = { header: false, eventBar: false, tabs: false, cards: false, roster: false };
            if (f.header) renderTeamHeader();
            if (f.eventBar) renderEventBar();
            if (f.tabs) renderLineupTabs();
            if (f.cards) renderLineupCards();
            if (f.roster) renderRosterList();
        });
    }

    function renderAll(immediate = false) {
        if (immediate) {
            _renderScheduled = false;
            _renderFlags = { header: false, eventBar: false, tabs: false, cards: false, roster: false };
            renderTeamHeader();
            renderEventBar();
            renderLineupTabs();
            renderLineupCards();
            renderRosterList();
            return;
        }
        scheduleRender({ header: true, eventBar: true, tabs: true, cards: true, roster: true });
    }

    function loadState(targetTeamId) {
        try {
            const rawDel = localStorage.getItem('salibandy_deleted_team_ids');
            deletedTeamIds = rawDel ? JSON.parse(rawDel) : [];
            if (Array.isArray(deletedTeamIds)) {
                deletedTeamIds = deletedTeamIds.filter(id => {
                    if (!id) return false;
                    const low = String(id).toLowerCase();
                    const isSekta = low === 'team_sekta' || low === 'default_team' || low.includes('sekta');
                    const isAkatemia = low === 'team_akatemia' || low === 'team_fbc_akatemia' || low === 'team_1786787084772' || low.includes('akatemia');
                    return !isSekta && !isAkatemia;
                });
                localStorage.setItem('salibandy_deleted_team_ids', JSON.stringify(deletedTeamIds));
            }

            const rawTeams = localStorage.getItem('salibandy_teams_v1');
            teams = rawTeams ? JSON.parse(rawTeams) : JSON.parse(JSON.stringify(DEFAULT_TEAMS));

            // Filter out deleted teams, clean corrupt names/IDs, and deduplicate by ID
            const seenTeamIds = new Set();
            const validTeams = [];
            teams.forEach(t => {
                if (!t || !t.id || deletedTeamIds.includes(t.id)) return;
                if (!seenTeamIds.has(t.id)) {
                    seenTeamIds.add(t.id);
                    if (!t.name || t.name.startsWith('data:') || t.name.length > 40) {
                        t.name = 'SekTa';
                    }
                    if (t.id && (t.id.startsWith('data:') || t.id.length > 50)) {
                        t.id = 'team_sekta';
                    }
                    validTeams.push(t);
                }
            });
            teams = validTeams.length > 0 ? validTeams : JSON.parse(JSON.stringify(DEFAULT_TEAMS));

            const hasSekTa = teams.some(t => t && (t.id === 'default_team' || t.id === 'team_sekta' || (t.name && t.name.toLowerCase().includes('sekta'))));
            if (!hasSekTa) {
                teams.unshift(JSON.parse(JSON.stringify(DEFAULT_TEAMS[0])));
            }

            const hasAkatemia = teams.some(t => t && (t.id === 'team_akatemia' || t.id === 'team_fbc_akatemia' || t.id === 'team_1786787084772' || (t.name && t.name.toLowerCase().includes('akatemia'))));
            if (!hasAkatemia) {
                const sektaIdx = teams.findIndex(t => t && (t.id === 'default_team' || t.id === 'team_sekta' || (t.name && t.name.toLowerCase().includes('sekta'))));
                if (sektaIdx !== -1) {
                    teams.splice(sektaIdx + 1, 0, JSON.parse(JSON.stringify(DEFAULT_TEAMS[1])));
                } else {
                    teams.push(JSON.parse(JSON.stringify(DEFAULT_TEAMS[1])));
                }
            }

            localStorage.setItem('salibandy_teams_v1', JSON.stringify(teams));

            // Check if URL has ?teamShare=
            const urlParams = (typeof window !== 'undefined' && window.location.search) ? new URLSearchParams(window.location.search) : null;
            const urlShareId = urlParams ? urlParams.get('teamShare') : null;

            if (urlShareId) {
                currentSharedTeamId = urlShareId;
                const existing = teams.find(t => t.id === 'shared_' + urlShareId || (t.shareId && t.shareId === urlShareId));
                if (existing) {
                    currentTeamId = existing.id;
                } else {
                    const placeholderTeam = { id: 'shared_' + urlShareId, name: '🤝 Jaettu joukkue', shareId: urlShareId };
                    teams.push(placeholderTeam);
                    currentTeamId = placeholderTeam.id;
                }
            } else if (targetTeamId && teams.some(t => t.id === targetTeamId)) {
                currentTeamId = targetTeamId;
            } else {
                const rawActiveTeam = localStorage.getItem('salibandy_active_team_id');
                let storedId = null;
                try { storedId = rawActiveTeam ? JSON.parse(rawActiveTeam) : null; } catch(e){}
                if (storedId && teams.some(t => t.id === storedId)) {
                    currentTeamId = storedId;
                } else if (currentTeamId && teams.some(t => t.id === currentTeamId)) {
                    // Keep in-memory
                } else {
                    currentTeamId = teams[0].id;
                }
            }

            if (!teams.some(t => t.id === currentTeamId) || (typeof currentTeamId === 'string' && currentTeamId.startsWith('data:'))) {
                currentTeamId = teams[0].id;
            }
            localStorage.setItem('salibandy_active_team_id', JSON.stringify(currentTeamId));

            const curTeam = teams.find(t => t.id === currentTeamId);
            const isSektaTeam = currentTeamId === 'default_team' || currentTeamId === 'team_sekta' || (curTeam && (curTeam.name || '').toLowerCase().includes('sekta'));
            const isAkatemiaTeam = currentTeamId === 'team_akatemia' || currentTeamId === 'team_fbc_akatemia' || currentTeamId === 'team_1786787084772' || (curTeam && (curTeam.name || '').toLowerCase().includes('akatemia'));

            // Default Sekta events URL if team name matches
            teams.forEach(t => {
                if (t && (t.id === 'default_team' || t.id === 'team_sekta' || (t.name || '').toLowerCase().includes('sekta'))) {
                    if (!t.eventsUrl) t.eventsUrl = 'https://sekta.nimenhuuto.com/events';
                    if (!t.nimenhuutoUrl) t.nimenhuutoUrl = 'https://sekta.nimenhuuto.com/events';
                }
            });
            if (curTeam && !curTeam.eventsUrl && !curTeam.nimenhuutoUrl) {
                if (isSektaTeam) {
                    curTeam.eventsUrl = 'https://sekta.nimenhuuto.com/events';
                    curTeam.nimenhuutoUrl = 'https://sekta.nimenhuuto.com/events';
                }
            }
            try {
                localStorage.setItem('salibandy_teams_v1', JSON.stringify(teams));
            } catch(e){}

            const rawRoster = localStorage.getItem('salibandy_roster_' + currentTeamId);
            roster = rawRoster ? JSON.parse(rawRoster) : [];

            // ONLY provide default SekTa/Akatemia roster if current team matches and roster is empty!
            if (!roster || roster.length === 0) {
                if (isSektaTeam) {
                    const altRoster1 = localStorage.getItem('salibandy_roster_default_team');
                    const altRoster2 = localStorage.getItem('salibandy_roster_team_sekta');
                    if (altRoster1 && JSON.parse(altRoster1).length > 0) {
                        roster = JSON.parse(altRoster1);
                    } else if (altRoster2 && JSON.parse(altRoster2).length > 0) {
                        roster = JSON.parse(altRoster2);
                    } else {
                        roster = [
                            { id: 'p_mv23', name: 'Matias V', number: 23, position: 'MV' },
                            { id: 'p_mv45', name: 'Jussi V', number: 45, position: 'MV' },
                            { id: 'p_mv7', name: 'Sami P', number: 7, position: 'MV' },
                            { id: 'p_mv3', name: 'Mika A', number: 3, position: 'MV' },
                            { id: 'p_19', name: 'Aaltonen', number: 19, position: 'VP' },
                            { id: 'p_20', name: 'Veikka', number: 20, position: 'OP' },
                            { id: 'p_42', name: 'Henri K', number: 42, position: 'KH' },
                            { id: 'p_64', name: 'Onni V', number: 64, position: 'VH' },
                            { id: 'p_71', name: 'Masto', number: 71, position: 'VP' },
                            { id: 'p_4', name: 'Joona R', number: 4, position: 'OP' },
                            { id: 'p_55', name: 'Vesa H', number: 55, position: 'KH' },
                            { id: 'p_11', name: 'Juki', number: 11, position: 'VH' },
                            { id: 'p_2', name: 'Nikou', number: 2, position: 'OH' },
                            { id: 'p_88', name: 'Jerker B', number: 88, position: 'OH' },
                            { id: 'p_21', name: 'Niko A', number: 21, position: 'VH' },
                            { id: 'p_13', name: 'Joni V', number: 13, position: 'OH' },
                            { id: 'p_10', name: 'Eino A', number: 10, position: 'KH' },
                            { id: 'p_15', name: 'Akseli', number: 15, position: 'VH' },
                            { id: 'p_22', name: 'Petri V', number: 22, position: 'VP' },
                            { id: 'p_87', name: 'Heikki H', number: 87, position: 'OH' },
                            { id: 'p_44', name: 'Jesse', number: 44, position: 'H' },
                            { id: 'p_62', name: 'Ilmari O', number: 62, position: 'H' },
                            { id: 'p_66', name: 'Miika', number: 66, position: 'H' }
                        ];
                    }
                    localStorage.setItem('salibandy_roster_' + currentTeamId, JSON.stringify(roster));
                } else if (isAkatemiaTeam) {
                    const altKeys = ['salibandy_roster_team_akatemia', 'salibandy_roster_team_fbc_akatemia', 'salibandy_roster_team_1786787084772'];
                    for (const k of altKeys) {
                        if (k === 'salibandy_roster_' + currentTeamId) continue;
                        const alt = localStorage.getItem(k);
                        if (alt) {
                            try {
                                const parsed = JSON.parse(alt);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    roster = parsed;
                                    break;
                                }
                            } catch(e){}
                        }
                    }
                    if (!roster || roster.length === 0) {
                        roster = JSON.parse(JSON.stringify(DEFAULT_AKATEMIA_ROSTER));
                    }
                    localStorage.setItem('salibandy_roster_' + currentTeamId, JSON.stringify(roster));
                } else {
                    roster = [];
                }
            }

            const rawLineups = localStorage.getItem('salibandy_lineups_' + currentTeamId);
            lineups = rawLineups ? JSON.parse(rawLineups) : {};
            
            const rawReserves = localStorage.getItem('salibandy_reserves_' + currentTeamId);
            lineupReserves = rawReserves ? JSON.parse(rawReserves) : {};

            // Ensure all canonical lineups exist
            SIMPLE_LINEUP_CONFIGS.forEach(cfg => {
                const is6v5 = cfg.group === '6v5';
                if (!lineups[cfg.id]) {
                    lineups[cfg.id] = is6v5 
                        ? { VP: '', OP: '', VH: '', KH: '', OH: '', '6P': '' }
                        : { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };
                }
            });

            // Backwards compatibility migration from single 'yv', 'av', '6v5'
            if (lineups['yv'] && !Object.values(lineups['yv1'] || {}).some(Boolean)) {
                lineups['yv1'] = { ...lineups['yv'] };
            }
            if (lineups['av'] && !Object.values(lineups['av1'] || {}).some(Boolean)) {
                lineups['av1'] = { ...lineups['av'] };
            }
            if (lineups['6v5'] && !Object.values(lineups['6v5_1'] || {}).some(Boolean)) {
                lineups['6v5_1'] = {
                    VP: lineups['6v5'].VP || '',
                    OP: lineups['6v5'].OP || '',
                    VH: lineups['6v5'].VH || '',
                    KH: lineups['6v5'].KH || '',
                    OH: lineups['6v5'].OH || '',
                    '6P': lineups['6v5']['6P'] || lineups['6v5']['VM'] || ''
                };
            }

            if (lineupReserves['yv'] && !lineupReserves['yv1']) lineupReserves['yv1'] = [...lineupReserves['yv']];
            if (lineupReserves['av'] && !lineupReserves['av1']) lineupReserves['av1'] = [...lineupReserves['av']];
            if (lineupReserves['6v5'] && !lineupReserves['6v5_1']) lineupReserves['6v5_1'] = [...lineupReserves['6v5']];

            // If completely empty lineups, seed with initial realistic starters & bench
            const isAnyAssigned = Object.values(lineups).some(l => Object.values(l).some(Boolean));
            if (!isAnyAssigned && roster.length >= 12 && isSektaTeam) {
                lineups['1'] = { MV: 'p_mv23', VP: 'p_19', OP: 'p_20', VH: 'p_11', KH: 'p_42', OH: 'p_64' };
                lineups['2'] = { MV: 'p_mv45', VP: 'p_71', OP: 'p_4', VH: 'p_21', KH: 'p_55', OH: 'p_2' };
                if (!lineupReserves['1']) lineupReserves['1'] = ['p_88'];
                localStorage.setItem('salibandy_lineups_' + currentTeamId, JSON.stringify(lineups));
            } else if (!isAnyAssigned && isAkatemiaTeam) {
                const altKeys = ['salibandy_lineups_team_akatemia', 'salibandy_lineups_team_fbc_akatemia', 'salibandy_lineups_team_1786787084772'];
                for (const k of altKeys) {
                    if (k === 'salibandy_lineups_' + currentTeamId) continue;
                    const alt = localStorage.getItem(k);
                    if (alt) {
                        try {
                            const parsed = JSON.parse(alt);
                            if (parsed && parsed['1'] && Object.values(parsed['1']).some(Boolean)) {
                                lineups = parsed;
                                break;
                            }
                        } catch(e){}
                    }
                }
                if (!Object.values(lineups['1'] || {}).some(Boolean)) {
                    lineups['1'] = {
                        MV: 'p_ocr_1786787489945_1',
                        VP: 'p_ocr_1786787489945_7',
                        OP: 'p_ocr_1786787489945_8',
                        VH: 'p_ocr_1786787489945_0',
                        KH: 'p_ocr_1786787489945_2',
                        OH: 'p_ocr_1786787489945_6'
                    };
                    lineups['2'] = {
                        MV: '',
                        VP: 'p_ocr_1786787489945_3',
                        OP: 'p_ocr_1786787489945_4',
                        VH: 'p_ocr_1786787489945_5',
                        KH: 'p_ocr_1786787489945_9',
                        OH: 'p_ocr_1786787489945_10'
                    };
                    lineups['yv1'] = {
                        MV: '',
                        VP: 'p_ocr_1786787489945_7',
                        OP: 'p_ocr_1786787489945_8',
                        VH: 'p_ocr_1786787489945_0',
                        KH: 'p_ocr_1786787489945_2',
                        OH: 'p_ocr_1786787489945_6'
                    };
                    if (!lineupReserves['1']) lineupReserves['1'] = ['p_1789731527753'];
                }
                localStorage.setItem('salibandy_lineups_' + currentTeamId, JSON.stringify(lineups));
            }

            // In Simple mode: ONLY canonical lineups exist (1-4, 2x YV, 2x AV, 2x 6vs5).
            // Drawing boards and tactical custom tabs are excluded.
            lineupConfigs = SIMPLE_LINEUP_CONFIGS;

            const rawEvents = localStorage.getItem('salibandy_events_' + currentTeamId);
            teamEvents = rawEvents ? JSON.parse(rawEvents) : [];
            const isDummy = (evs) => !Array.isArray(evs) || evs.length === 0 || (evs.length === 1 && (evs[0].id === 'default_event_1' || (evs[0].title || '').includes('Seuraava')));

            if (isDummy(teamEvents)) {
                if (isSektaTeam) {
                    const altEvents1 = localStorage.getItem('salibandy_events_default_team');
                    const altEvents2 = localStorage.getItem('salibandy_events_team_sekta');
                    const p1 = altEvents1 ? JSON.parse(altEvents1) : null;
                    const p2 = altEvents2 ? JSON.parse(altEvents2) : null;
                    if (Array.isArray(p1) && !isDummy(p1)) {
                        teamEvents = p1;
                    } else if (Array.isArray(p2) && !isDummy(p2)) {
                        teamEvents = p2;
                    } else {
                        teamEvents = JSON.parse(JSON.stringify(DEFAULT_SEKTA_EVENTS));
                    }
                    try {
                        localStorage.setItem('salibandy_events_' + currentTeamId, JSON.stringify(teamEvents));
                    } catch(e){}
                } else if (isAkatemiaTeam) {
                    const altKeys = ['salibandy_events_team_akatemia', 'salibandy_events_team_fbc_akatemia', 'salibandy_events_team_1786787084772'];
                    for (const ak of altKeys) {
                        if (ak === 'salibandy_events_' + currentTeamId) continue;
                        const alt = localStorage.getItem(ak);
                        if (alt) {
                            try {
                                const parsed = JSON.parse(alt);
                                if (Array.isArray(parsed) && !isDummy(parsed)) {
                                    teamEvents = parsed;
                                    break;
                                }
                            } catch(e){}
                        }
                    }
                }
            }

            if (isDummy(teamEvents)) {
                if (isSektaTeam) {
                    teamEvents = JSON.parse(JSON.stringify(DEFAULT_SEKTA_EVENTS));
                } else {
                    teamEvents = [
                        {
                            id: 'event_' + Date.now(),
                            title: 'Seuraava Tapahtuma',
                            date: 'Klo 19:00',
                            location: 'Kotiareena',
                            attendees: {}
                        }
                    ];
                }
                try {
                    localStorage.setItem('salibandy_events_' + currentTeamId, JSON.stringify(teamEvents));
                } catch(e){}
            }

            let rawActiveEvent = localStorage.getItem('salibandy_active_event_id_' + currentTeamId);
            if (!rawActiveEvent && isSektaTeam) {
                rawActiveEvent = localStorage.getItem('salibandy_active_event_id_team_sekta') || localStorage.getItem('salibandy_active_event_id_default_team');
            }
            try {
                const parsedAct = rawActiveEvent ? JSON.parse(rawActiveEvent) : null;
                activeEventId = (parsedAct && teamEvents.some(e => e.id === parsedAct)) ? parsedAct : (teamEvents[0]?.id || null);
            } catch(e) {
                activeEventId = teamEvents[0]?.id || null;
            }
            if (!activeEventId && teamEvents.length > 0) {
                activeEventId = teamEvents[0].id;
            }
            try {
                localStorage.setItem('salibandy_active_event_id_' + currentTeamId, JSON.stringify(activeEventId));
            } catch(e){}

            // Auto-fetch upcoming events in background silently if team has eventsUrl and stale (> 2 min)
            const teamUrl = curTeam ? (curTeam.eventsUrl || curTeam.nimenhuutoUrl || curTeam.myclubUrl || '') : '';
            if (teamUrl) {
                const lastFetch = parseInt(localStorage.getItem('salibandy_events_last_fetch_' + currentTeamId) || '0', 10);
                if (Date.now() - lastFetch > 2 * 60 * 1000) {
                    setTimeout(() => {
                        fetchAndSyncEvents(teamUrl, true);
                    }, 100);
                }
            }

        } catch (e) {
            console.error('Error loading state:', e);
        }
    }

    function loadFromStorage(key, defaultVal) {
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    function saveToStorageLocalOnly() {
        try {
            // Keep legacy keys in sync for advanced mode compatibility
            if (lineups['yv1']) lineups['yv'] = { ...lineups['yv1'] };
            if (lineups['av1']) lineups['av'] = { ...lineups['av1'] };
            if (lineups['6v5_1']) {
                lineups['6v5'] = {
                    VP: lineups['6v5_1'].VP || '',
                    OP: lineups['6v5_1'].OP || '',
                    VH: lineups['6v5_1'].VH || '',
                    KH: lineups['6v5_1'].KH || '',
                    OH: lineups['6v5_1'].OH || '',
                    VM: lineups['6v5_1']['6P'] || lineups['6v5_1']['VM'] || ''
                };
            }

            localStorage.setItem('salibandy_teams_v1', JSON.stringify(teams));
            localStorage.setItem('salibandy_active_team_id', JSON.stringify(currentTeamId));
            localStorage.setItem('salibandy_roster_' + currentTeamId, JSON.stringify(roster));
            localStorage.setItem('salibandy_lineups_' + currentTeamId, JSON.stringify(lineups));
            localStorage.setItem('salibandy_reserves_' + currentTeamId, JSON.stringify(lineupReserves));
            localStorage.setItem('salibandy_events_' + currentTeamId, JSON.stringify(teamEvents));
            if (activeEventId) {
                localStorage.setItem('salibandy_active_event_id_' + currentTeamId, JSON.stringify(activeEventId));
            }
            if (currentTeamId === 'default_team' || currentTeamId === 'team_sekta') {
                const altKey = currentTeamId === 'default_team' ? 'team_sekta' : 'default_team';
                localStorage.setItem('salibandy_events_' + altKey, JSON.stringify(teamEvents));
                if (activeEventId) {
                    localStorage.setItem('salibandy_active_event_id_' + altKey, JSON.stringify(activeEventId));
                }
            } else if (currentTeamId === 'team_akatemia' || currentTeamId === 'team_fbc_akatemia' || currentTeamId === 'team_1786787084772') {
                const altKeys = ['team_akatemia', 'team_fbc_akatemia', 'team_1786787084772'];
                altKeys.forEach(ak => {
                    if (ak !== currentTeamId) {
                        localStorage.setItem('salibandy_events_' + ak, JSON.stringify(teamEvents));
                        if (activeEventId) {
                            localStorage.setItem('salibandy_active_event_id_' + ak, JSON.stringify(activeEventId));
                        }
                    }
                });
            }
        } catch (e) {
            console.error('Error saving local state:', e);
        }
    }

    function buildFullCloudPayload() {
        const rostersMap = {};
        const configsMap = {};
        const lineupsMap = {};
        const reservesMap = {};
        const eventsMap = {};

        teams.forEach(t => {
            if (!t || !t.id || deletedTeamIds.includes(t.id)) return;
            const tId = t.id;
            rostersMap[tId] = (tId === currentTeamId) ? roster : loadFromStorage(`salibandy_roster_${tId}`, []);
            configsMap[tId] = loadFromStorage(`salibandy_lineup_configs_${tId}`, SIMPLE_LINEUP_CONFIGS);
            lineupsMap[tId] = (tId === currentTeamId) ? lineups : loadFromStorage(`salibandy_lineups_${tId}`, {});
            reservesMap[tId] = (tId === currentTeamId) ? lineupReserves : loadFromStorage(`salibandy_reserves_${tId}`, {});
            eventsMap[tId] = (tId === currentTeamId) ? teamEvents : loadFromStorage(`salibandy_events_${tId}`, []);
        });

        const serverTs = (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue)
            ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date();

        return {
            email: currentUser ? currentUser.email : '',
            updatedAt: serverTs,
            _lastModifiedBy: clientInstanceId,
            _lastModifiedAt: Date.now(),
            deletedTeamIds: deletedTeamIds,
            teams: teams.filter(t => t && t.id && !deletedTeamIds.includes(t.id)),
            currentTeamId: currentTeamId,
            rosters: rostersMap,
            lineupConfigs: configsMap,
            lineups: lineupsMap,
            reserves: reservesMap,
            events: eventsMap
        };
    }

    function pushSharedTeamToCloud(shareId, teamObj) {
        if (!shareId) return;
        if (typeof window === 'undefined' || !window.SalibandyFirebase) return;

        const writeNow = () => {
            const db = window.SalibandyFirebase.getDb();
            if (!db) return;
            const serverTs = (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue)
                ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date();
            const cleanTeamName = teamObj ? (teamObj.name || 'Joukkue').replace(/^🤝\s*/, '') : 'Joukkue';

            // Complete team visuals & branding metadata
            const teamMeta = {
                name: cleanTeamName,
                logo: (teamObj && teamObj.logo) ? teamObj.logo : '🏑',
                primaryColor: (teamObj && teamObj.primaryColor) ? teamObj.primaryColor : '#2563eb',
                secondaryColor: (teamObj && teamObj.secondaryColor) ? teamObj.secondaryColor : '#1e40af',
                mvColor: (teamObj && teamObj.mvColor) ? teamObj.mvColor : '#10b981',
                arena: (teamObj && (teamObj.arena || teamObj.arenaName)) ? (teamObj.arena || teamObj.arenaName) : 'Kotiareena',
                arenaName: (teamObj && (teamObj.arenaName || teamObj.arena)) ? (teamObj.arenaName || teamObj.arena) : 'Kotiareena',
                rinkColor: (teamObj && teamObj.rinkColor) ? teamObj.rinkColor : 'black',
                tokenStyle: (teamObj && teamObj.tokenStyle) ? teamObj.tokenStyle : 'circle',
                showCourtLogo: (teamObj && typeof teamObj.showCourtLogo === 'boolean') ? teamObj.showCourtLogo : true,
                courtColor: (teamObj && teamObj.courtColor) ? teamObj.courtColor : 'default'
            };

            // Mirror canonical Simple mode keys to Advanced mode keys for full cross-compatibility
            if (lineups['yv1']) lineups['yv'] = { ...lineups['yv1'] };
            if (lineups['av1']) lineups['av'] = { ...lineups['av1'] };
            if (lineups['6v5_1']) {
                lineups['6v5'] = {
                    VP: lineups['6v5_1'].VP || '',
                    OP: lineups['6v5_1'].OP || '',
                    VH: lineups['6v5_1'].VH || '',
                    KH: lineups['6v5_1'].KH || '',
                    OH: lineups['6v5_1'].OH || '',
                    VM: lineups['6v5_1']['6P'] || lineups['6v5_1']['VM'] || ''
                };
            }
            if (lineupReserves['yv1']) lineupReserves['yv'] = [...lineupReserves['yv1']];
            if (lineupReserves['av1']) lineupReserves['av'] = [...lineupReserves['av1']];
            if (lineupReserves['6v5_1']) lineupReserves['6v5'] = [...lineupReserves['6v5_1']];

            const payload = {
                shareId: shareId,
                teamId: currentTeamId,
                teamName: cleanTeamName,
                teamMeta: teamMeta,
                _lastModifiedBy: clientInstanceId,
                _lastModifiedAt: Date.now(),
                updatedAt: serverTs,
                roster: roster,
                lineups: lineups,
                reserves: lineupReserves,
                events: teamEvents
            };
            db.collection('shared_teams').doc(shareId).set(payload, { merge: true }).then(() => {
                console.log(`[Simple][${clientInstanceId}] Shared team '${cleanTeamName}' synced to cloud (${shareId})`);
            }).catch(err => {
                console.warn(`[Simple][${clientInstanceId}] Share Firestore write warning:`, err);
            });
        };

        if (window.SalibandyFirebase.isReady()) {
            writeNow();
        } else if (window.SalibandyFirebase.whenReady) {
            window.SalibandyFirebase.whenReady().then(writeNow);
        }
    }

    function listenToSharedTeamFirestore(shareId) {
        if (!shareId) return;
        if (!window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) {
            if (window.SalibandyFirebase && window.SalibandyFirebase.whenReady) {
                window.SalibandyFirebase.whenReady().then(() => listenToSharedTeamFirestore(shareId));
            } else {
                setTimeout(() => listenToSharedTeamFirestore(shareId), 500);
            }
            return;
        }

        const db = window.SalibandyFirebase.getDb();
        if (unsubscribeSharedTeam) unsubscribeSharedTeam();

        unsubscribeSharedTeam = db.collection('shared_teams').doc(shareId).onSnapshot(doc => {
            if (!doc.exists) {
                console.log(`[Simple][${clientInstanceId}] Shared team doc does not exist yet on cloud (${shareId}).`);
                return;
            }
            const data = doc.data();
            if (!data) return;

            console.log(`[Simple][${clientInstanceId}] Snapshot received for ${shareId}. DocModifiedBy: ${data._lastModifiedBy}, MyId: ${clientInstanceId}`);

            // Skip snapshot from this exact client instance to prevent stutter
            if (data._lastModifiedBy === clientInstanceId) {
                console.log(`[Simple][${clientInstanceId}] Ignoring snapshot from self.`);
                return;
            }
            console.log(`[Simple][${clientInstanceId}] Applying remote update from ${data._lastModifiedBy}!`);

            const meta = data.teamMeta || {};
            const sharedTeamName = meta.name || data.teamName || 'Jaettu joukkue';
            let foundTeam = teams.find(t => t.id === 'shared_' + shareId || (t.shareId && t.shareId === shareId));
            if (!foundTeam) {
                foundTeam = { 
                    id: 'shared_' + shareId, 
                    name: '🤝 ' + sharedTeamName, 
                    shareId: shareId,
                    logo: meta.logo || '🏑',
                    primaryColor: meta.primaryColor || '#2563eb',
                    secondaryColor: meta.secondaryColor || '#1e40af',
                    mvColor: meta.mvColor || '#10b981',
                    arena: meta.arena || 'Kotiareena',
                    arenaName: meta.arenaName || meta.arena || 'Kotiareena',
                    rinkColor: meta.rinkColor || 'black',
                    tokenStyle: meta.tokenStyle || 'circle',
                    showCourtLogo: meta.showCourtLogo !== false
                };
                teams.push(foundTeam);
            } else {
                foundTeam.name = '🤝 ' + sharedTeamName;
                foundTeam.shareId = shareId;
                if (meta.logo) foundTeam.logo = meta.logo;
                if (meta.primaryColor) foundTeam.primaryColor = meta.primaryColor;
                if (meta.secondaryColor) foundTeam.secondaryColor = meta.secondaryColor;
                if (meta.mvColor) foundTeam.mvColor = meta.mvColor;
                if (meta.arena || meta.arenaName) {
                    foundTeam.arena = meta.arena || meta.arenaName;
                    foundTeam.arenaName = meta.arenaName || meta.arena;
                }
                if (meta.rinkColor) foundTeam.rinkColor = meta.rinkColor;
                if (meta.tokenStyle) foundTeam.tokenStyle = meta.tokenStyle;
                if (typeof meta.showCourtLogo === 'boolean') foundTeam.showCourtLogo = meta.showCourtLogo;
            }
            currentTeamId = foundTeam.id;

            if (data.roster) roster = data.roster;
            if (data.lineups) {
                lineups = data.lineups;
                // Lineup bridging: if incoming came from Advanced mode (yv/av/6v5) and Simple keys are empty
                if (lineups['yv'] && (!lineups['yv1'] || !Object.values(lineups['yv1']).some(Boolean))) {
                    lineups['yv1'] = { ...lineups['yv'] };
                }
                if (lineups['av'] && (!lineups['av1'] || !Object.values(lineups['av1']).some(Boolean))) {
                    lineups['av1'] = { ...lineups['av'] };
                }
                if (lineups['6v5'] && (!lineups['6v5_1'] || !Object.values(lineups['6v5_1']).some(Boolean))) {
                    lineups['6v5_1'] = {
                        VP: lineups['6v5'].VP || '',
                        OP: lineups['6v5'].OP || '',
                        VH: lineups['6v5'].VH || '',
                        KH: lineups['6v5'].KH || '',
                        OH: lineups['6v5'].OH || '',
                        '6P': lineups['6v5']['6P'] || lineups['6v5']['VM'] || ''
                    };
                }
                // Ensure all 10 canonical Simple lineups exist
                SIMPLE_LINEUP_CONFIGS.forEach(cfg => {
                    if (!lineups[cfg.id]) {
                        lineups[cfg.id] = cfg.group === '6v5'
                            ? { VP: '', OP: '', VH: '', KH: '', OH: '', '6P': '' }
                            : { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };
                    }
                });
            }
            if (data.reserves) {
                lineupReserves = data.reserves;
                if (lineupReserves['yv'] && !lineupReserves['yv1']) lineupReserves['yv1'] = [...lineupReserves['yv']];
                if (lineupReserves['av'] && !lineupReserves['av1']) lineupReserves['av1'] = [...lineupReserves['av']];
                if (lineupReserves['6v5'] && !lineupReserves['6v5_1']) lineupReserves['6v5_1'] = [...lineupReserves['6v5']];
            }
            if (data.events) teamEvents = data.events;

            // Apply primary color to CSS
            if (foundTeam.primaryColor) {
                document.documentElement.style.setProperty('--color-primary', foundTeam.primaryColor);
                document.documentElement.style.setProperty('--team-primary-color', foundTeam.primaryColor);
            }
            if (foundTeam.mvColor) {
                document.documentElement.style.setProperty('--team-mv-color', foundTeam.mvColor);
            }

            saveToStorageLocalOnly();
            renderAll(true);
            updateCloudButtonUI(true);
            showToast(`Joukkue '${sharedTeamName}' synkronoitu reaaliajassa! ⚡`);
        }, err => {
            console.warn('[Simple] Shared team listener error:', err);
        });
    }

    function listenToCloudFirestore(user) {
        if (!window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) return;
        const db = window.SalibandyFirebase.getDb();
        const userRef = db.collection('users').doc(user.uid);

        if (unsubscribeFirestore) unsubscribeFirestore();

        unsubscribeFirestore = userRef.onSnapshot({ includeMetadataChanges: true }, (doc) => {
            if (doc.metadata && doc.metadata.hasPendingWrites) return;
            if (isCloudLoading) return;

            if (!doc.exists) {
                isCloudLoading = true;
                const initialPayload = buildFullCloudPayload();
                lastLoadedCloudPayloadString = JSON.stringify(initialPayload);
                userRef.set(initialPayload, { merge: true }).then(() => {
                    updateCloudButtonUI(true);
                    isCloudLoading = false;
                }).catch(err => {
                    console.warn('[Simple] First-time Firestore doc error:', err);
                    isCloudLoading = false;
                });
                return;
            }

            const cloudData = doc.data();
            if (!cloudData) return;

            if (cloudData._lastModifiedBy === clientInstanceId) {
                updateCloudButtonUI(true);
                return;
            }

            const incomingStr = JSON.stringify(cloudData);
            if (incomingStr === lastLoadedCloudPayloadString) return;
            lastLoadedCloudPayloadString = incomingStr;

            // 1. Merge deletedTeamIds
            if (cloudData.deletedTeamIds && Array.isArray(cloudData.deletedTeamIds)) {
                deletedTeamIds = Array.from(new Set([...deletedTeamIds, ...cloudData.deletedTeamIds])).filter(id => {
                    if (!id) return false;
                    const low = String(id).toLowerCase();
                    const isSekta = low === 'team_sekta' || low === 'default_team' || low.includes('sekta');
                    const isAkatemia = low === 'team_akatemia' || low === 'team_fbc_akatemia' || low === 'team_1786787084772' || low.includes('akatemia');
                    return !isSekta && !isAkatemia;
                });
                localStorage.setItem('salibandy_deleted_team_ids', JSON.stringify(deletedTeamIds));
            }

            if (cloudData.teams && Array.isArray(cloudData.teams)) {
                const cleanCloudTeams = cloudData.teams.filter(t => t && t.id && !deletedTeamIds.includes(t.id));
                const mergedMap = new Map();
                cleanCloudTeams.forEach(t => {
                    if (!mergedMap.has(t.id)) mergedMap.set(t.id, t);
                });

                teams.forEach(localT => {
                    if (!localT || !localT.id || deletedTeamIds.includes(localT.id)) return;
                    if (!mergedMap.has(localT.id)) {
                        mergedMap.set(localT.id, localT);
                    } else {
                        const existing = mergedMap.get(localT.id);
                        if (!existing.shareId && localT.shareId) existing.shareId = localT.shareId;
                        if (!existing.eventsUrl && localT.eventsUrl) existing.eventsUrl = localT.eventsUrl;
                        if (!existing.nimenhuutoUrl && localT.nimenhuutoUrl) existing.nimenhuutoUrl = localT.nimenhuutoUrl;
                    }
                });
                teams = Array.from(mergedMap.values());
                const hasSekTa = teams.some(t => t && (t.id === 'default_team' || t.id === 'team_sekta' || (t.name && t.name.toLowerCase().includes('sekta'))));
                if (!hasSekTa) {
                    teams.unshift(JSON.parse(JSON.stringify(DEFAULT_TEAMS[0])));
                }
                const hasAkatemia = teams.some(t => t && (t.id === 'team_akatemia' || t.id === 'team_fbc_akatemia' || t.id === 'team_1786787084772' || (t.name && t.name.toLowerCase().includes('akatemia'))));
                if (!hasAkatemia) {
                    const sektaIdx = teams.findIndex(t => t && (t.id === 'default_team' || t.id === 'team_sekta' || (t.name && t.name.toLowerCase().includes('sekta'))));
                    if (sektaIdx !== -1) {
                        teams.splice(sektaIdx + 1, 0, JSON.parse(JSON.stringify(DEFAULT_TEAMS[1])));
                    } else {
                        teams.push(JSON.parse(JSON.stringify(DEFAULT_TEAMS[1])));
                    }
                }
                if (teams.length === 0) {
                    teams = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
                }
                if (cloudData.currentTeamId && teams.some(t => t.id === cloudData.currentTeamId)) {
                    currentTeamId = cloudData.currentTeamId;
                } else if (!teams.some(t => t.id === currentTeamId)) {
                    currentTeamId = teams[0].id;
                }
            }

            if (cloudData.rosters) {
                Object.keys(cloudData.rosters).forEach(tId => {
                    if (deletedTeamIds.includes(tId)) {
                        localStorage.removeItem(`salibandy_roster_${tId}`);
                        return;
                    }
                    localStorage.setItem(`salibandy_roster_${tId}`, JSON.stringify(cloudData.rosters[tId]));
                });
            }
            if (cloudData.lineups) {
                Object.keys(cloudData.lineups).forEach(tId => {
                    if (deletedTeamIds.includes(tId)) {
                        localStorage.removeItem(`salibandy_lineups_${tId}`);
                        return;
                    }
                    localStorage.setItem(`salibandy_lineups_${tId}`, JSON.stringify(cloudData.lineups[tId]));
                });
            }
            if (cloudData.reserves) {
                Object.keys(cloudData.reserves).forEach(tId => {
                    if (deletedTeamIds.includes(tId)) {
                        localStorage.removeItem(`salibandy_reserves_${tId}`);
                        return;
                    }
                    localStorage.setItem(`salibandy_reserves_${tId}`, JSON.stringify(cloudData.reserves[tId]));
                });
            }
            if (cloudData.events) {
                Object.keys(cloudData.events).forEach(tId => {
                    if (deletedTeamIds.includes(tId)) {
                        localStorage.removeItem(`salibandy_events_${tId}`);
                        return;
                    }
                    localStorage.setItem(`salibandy_events_${tId}`, JSON.stringify(cloudData.events[tId]));
                });
            }

            loadState();
            renderAll(true);
            updateCloudButtonUI(true);
            setTimeout(() => { isCloudLoading = false; }, 300);
        }, (err) => {
            console.warn('[Simple] Cloud snapshot error:', err);
            updateCloudButtonUI(false);
            isCloudLoading = false;
        });
    }

    function updateCloudButtonUI(isSynced) {
        if (!btnSimpleCloud) return;
        if (currentUser) {
            const shortName = currentUser.email ? currentUser.email.split('@')[0] : 'Käyttäjä';
            btnSimpleCloud.innerHTML = `👤 ${escapeHtml(shortName)}`;
            btnSimpleCloud.classList.add('highlight');
            btnSimpleCloud.title = `Kirjautuneena: ${currentUser.email} (Klikkaa asetuksia tai synkronointia varten)`;
        } else {
            btnSimpleCloud.innerHTML = `☁️ Pilvi`;
            btnSimpleCloud.classList.remove('highlight');
            btnSimpleCloud.title = 'Kirjaudu Google-tilillä tai aloita pilvisynkronointi';
        }
    }

    function forceCloudSync() {
        if (!currentUser || !window.SalibandyFirebase || !window.SalibandyFirebase.isReady()) {
            showToast('Kirjaudu ensin Google-tilillä.');
            openCloudModal();
            return;
        }

        const db = window.SalibandyFirebase.getDb();
        const payload = buildFullCloudPayload();
        db.collection('users').doc(currentUser.uid).set(payload)
            .then(() => {
                updateCloudButtonUI(true);
                showToast(`🎉 Kaikki ${teams.length} joukkuetta tallennettu pilveen!`);
            })
            .catch(err => {
                console.error('[Simple] Force sync error:', err);
                showToast('Pilvitallennusvirhe: ' + err.message);
            });
    }

    function handleLogout() {
        if (window.SalibandyFirebase) {
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }
            window.SalibandyFirebase.logout().then(() => {
                currentUser = null;
                updateCloudButtonUI(false);
                showToast('Kirjauduttu ulos pilvipalvelusta.');
            }).catch(err => {
                console.warn('Logout error:', err);
            });
        }
    }

    function getShareIdForCurrentTeam() {
        let curTeam = teams.find(t => t.id === currentTeamId);
        if (!curTeam) return 'st_' + (currentTeamId || 'team').replace(/[^a-zA-Z0-9_]/g, '');
        if (!curTeam.shareId) {
            const cleanId = (curTeam.id || 'team').replace(/[^a-zA-Z0-9_]/g, '');
            curTeam.shareId = 'st_' + cleanId;
            saveState();
        }
        return curTeam.shareId;
    }

    function openShareModal() {
        if (!shareModal || !shareModalBody) return;
        const curTeam = teams.find(t => t.id === currentTeamId) || { name: 'Joukkue' };
        const teamName = (curTeam.name || 'Joukkue').replace(/^🤝\s*/, '');
        const shareId = getShareIdForCurrentTeam();
        pushSharedTeamToCloud(shareId, curTeam);
        // Start listening immediately so Coach A receives changes made by Coach B live!
        listenToSharedTeamFirestore(shareId);

        const baseUrl = window.location.origin + window.location.pathname.replace(/[^\/]*$/, '');
        const simpleUrl = `${baseUrl}simple.html?teamShare=${shareId}&role=coach`;
        const advUrl = `${baseUrl}index.html?mode=advanced&teamShare=${shareId}&role=coach`;

        shareModalBody.innerHTML = `
            <div style="margin-bottom: 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 8px; padding: 10px 12px;">
                <div style="font-size: 0.72rem; color: #93c5fd; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 2px;">Jaettava joukkue</div>
                <div style="font-size: 1.15rem; font-weight: 800; color: #fff; display: flex; align-items: center; justify-content: space-between;">
                    <span>${escapeHtml(teamName)}</span>
                    <span style="font-size: 0.72rem; padding: 3px 8px; border-radius: 999px; background: rgba(16,185,129,0.2); color: #10b981; font-weight: 600;">⚡ Pysyvä linkki</span>
                </div>
            </div>

            <p style="color: var(--text-secondary); font-size: 0.82rem; line-height: 1.4; margin-bottom: 14px;">
                Tämä linkki pysyy samana tälle joukkueelle, joten voit lähettää sen kerran toiselle valmentajalle tai joukkueelle. Kaikki kentälliset ja pelaajat synkronoituvat reaaliajassa laitteiden välillä!
            </p>

            <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label style="font-size: 0.78rem; font-weight: 600; color: #60a5fa;">📱 Kevytversio (Kännykkä & Tabletti)</label>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">Suositeltu</span>
                </div>
                <input type="text" id="input-simple-share-url" value="${escapeHtml(simpleUrl)}" readonly style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; color: #fff; font-size: 0.8rem; margin-bottom: 8px;">
                <div style="display: flex; gap: 6px;">
                    <button class="btn-tool primary" id="btn-copy-simple-link" style="flex: 1; padding: 9px 12px; font-size: 0.84rem;">📋 Kopioi linkki</button>
                    <button class="btn-header highlight" id="btn-wa-simple-link" style="padding: 9px 14px; font-size: 0.84rem; background: #22c55e; color: #fff;">💬 WhatsApp</button>
                </div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
                <label style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;">💻 Taktinen fläppitaulu (Advanced / Läppäri)</label>
                <div style="display: flex; gap: 6px;">
                    <input type="text" id="input-adv-share-url" value="${escapeHtml(advUrl)}" readonly style="flex: 1; background: #0b1120; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 8px; color: #fff; font-size: 0.75rem;">
                    <button class="btn-header" id="btn-copy-adv-link" style="padding: 6px 12px; font-size: 0.78rem;">📋 Kopioi</button>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px;">
                <button type="button" id="btn-simple-regenerate-link" style="background: none; border: none; color: #ef4444; font-size: 0.75rem; cursor: pointer; padding: 4px 0; text-decoration: underline;">
                    🔄 Luo uusi jakotunniste (jos haluat mitätöidä vanhan)
                </button>
            </div>
        `;

        document.getElementById('btn-copy-simple-link')?.addEventListener('click', () => {
            navigator.clipboard.writeText(simpleUrl).then(() => showToast('Kevytversion jakolinkki kopioitu! 📋'));
        });
        document.getElementById('btn-wa-simple-link')?.addEventListener('click', () => {
            const text = encodeURIComponent(`Tässä joukkueen ${teamName} kokoonpanot ja kentälliset reaaliaikaisena:\n${simpleUrl}`);
            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
        });
        document.getElementById('btn-copy-adv-link')?.addEventListener('click', () => {
            navigator.clipboard.writeText(advUrl).then(() => showToast('Fläppitaulun jakolinkki kopioitu! 📋'));
        });
        document.getElementById('btn-simple-regenerate-link')?.addEventListener('click', () => {
            if (confirm(`Haluatko luoda uuden jakotunnisteen joukkueelle '${teamName}'? Vanhat jakolinkit lakkaavat toimimasta.`)) {
                curTeam.shareId = 'st_' + (curTeam.id || 'team').replace(/[^a-zA-Z0-9_]/g, '') + '_' + Math.random().toString(36).substr(2, 6);
                saveState();
                openShareModal();
                showToast('Uusi jakotunniste luotu! 🔗');
            }
        });

        shareModal.classList.add('active');
    }

    function openCloudModal() {
        if (!cloudModal || !cloudModalBody) return;

        if (currentUser) {
            cloudModalBody.innerHTML = `
                <div style="text-align: center; padding: 10px 0 16px;">
                    <div style="font-size: 2rem; margin-bottom: 6px;">👤</div>
                    <div style="font-weight: 700; font-size: 1rem; color: #fff; margin-bottom: 2px;">${escapeHtml(currentUser.email)}</div>
                    <div style="font-size: 0.75rem; color: #10b981;">● Kirjautuneena Google-tilillä (Pilvisynkronointi aktiivinen)</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="btn-tool primary" id="btn-cloud-force-sync" style="width: 100%; padding: 12px; font-size: 0.9rem;">
                        ☁️ Synkronoi kaikki joukkueet nyt pilveen
                    </button>
                    <button class="btn-tool" id="btn-cloud-open-share" style="width: 100%; padding: 10px; font-size: 0.85rem; background: rgba(255,255,255,0.08);">
                        🔗 Jaa nykyinen joukkue linkillä
                    </button>
                    <button class="btn-tool" id="btn-cloud-logout" style="width: 100%; padding: 10px; font-size: 0.85rem; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); margin-top: 8px;">
                        🔴 Kirjaudu ulos
                    </button>
                </div>
            `;

            document.getElementById('btn-cloud-force-sync')?.addEventListener('click', () => {
                forceCloudSync();
            });
            document.getElementById('btn-cloud-open-share')?.addEventListener('click', () => {
                cloudModal.classList.remove('active');
                openShareModal();
            });
            document.getElementById('btn-cloud-logout')?.addEventListener('click', () => {
                handleLogout();
                cloudModal.classList.remove('active');
            });
        } else {
            cloudModalBody.innerHTML = `
                <div style="text-align: center; padding: 8px 0 16px;">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">☁️</div>
                    <div style="font-weight: 700; font-size: 1.05rem; color: #fff; margin-bottom: 6px;">Google-pilvisynkronointi</div>
                    <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">
                        Kirjaudu Google-tililläsi, niin joukkueesi, kentällisesi ja pelaajasi tallentuvat automaattisesti pilveen ja pysyvät aina synkassa puhelimen, tabletin ja tietokoneen välillä.
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn-tool primary" id="btn-do-google-login" style="width: 100%; padding: 12px; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt="Google">
                        <span>Kirjaudu Google-tilillä</span>
                    </button>
                </div>
            `;

            document.getElementById('btn-do-google-login')?.addEventListener('click', async () => {
                showToast('Avataan Google-kirjautuminen...');
                try {
                    const user = await window.SalibandyFirebase.loginWithGoogle();
                    if (user) {
                        currentUser = user;
                        updateCloudButtonUI(true);
                        cloudModal.classList.remove('active');
                        showToast(`Kirjauduttu: ${user.email} 🎉`);
                        listenToCloudFirestore(user);
                    }
                } catch (err) {
                    console.error('Login error:', err);
                    showToast('Kirjautumisvirhe: ' + err.message);
                }
            });
        }

        cloudModal.classList.add('active');
    }

    function checkUrlSharing() {
        if (typeof window === 'undefined') return;
        const params = (window.location && window.location.search) ? new URLSearchParams(window.location.search) : null;
        const teamShareId = params ? params.get('teamShare') : null;
        if (teamShareId) {
            currentSharedTeamId = teamShareId;
            listenToSharedTeamFirestore(teamShareId);
        } else {
            const curTeam = teams.find(t => t.id === currentTeamId);
            if (curTeam && curTeam.shareId) {
                currentSharedTeamId = curTeam.shareId;
                listenToSharedTeamFirestore(curTeam.shareId);
            }
        }
    }

    function initSimpleFirebase() {
        if (typeof window === 'undefined' || !window.SalibandyFirebase) return;

        window.SalibandyFirebase.whenReady().then(({ auth }) => {
            // Check mobile redirect result
            window.SalibandyFirebase.handleRedirectResult().then(redirectUser => {
                if (redirectUser) {
                    currentUser = redirectUser;
                    updateCloudButtonUI(true);
                    showToast(`Kirjauduttu sisään Google-tilillä: ${redirectUser.email} 🎉`);
                    listenToCloudFirestore(redirectUser);
                }
            });

            // Listen to auth state
            auth.onAuthStateChanged(user => {
                currentUser = user;
                updateCloudButtonUI(!!user);
                if (user) {
                    listenToCloudFirestore(user);
                } else {
                    if (unsubscribeFirestore) {
                        unsubscribeFirestore();
                        unsubscribeFirestore = null;
                    }
                }
            });

            // Check shared team URL
            checkUrlSharing();
        });
    }

    function saveState() {
        saveToStorageLocalOnly();

        // 1. Sync to User's Personal Cloud if logged in
        if (currentUser && window.SalibandyFirebase && window.SalibandyFirebase.isReady()) {
            if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
            cloudSyncDebounceTimer = setTimeout(() => {
                if (isCloudLoading) return;
                const db = window.SalibandyFirebase.getDb();
                const payload = buildFullCloudPayload();
                lastLoadedCloudPayloadString = JSON.stringify(payload);
                db.collection('users').doc(currentUser.uid).set(payload, { merge: true })
                    .then(() => {
                        updateCloudButtonUI(true);
                    })
                    .catch(err => {
                        console.warn('[Simple] Cloud save error:', err);
                    });
            }, 1000);
        }

        // 2. Sync to Shared Team Cloud if team is shared
        const curTeam = teams.find(t => t.id === currentTeamId);
        const activeShareId = (curTeam && curTeam.shareId) ? curTeam.shareId : currentSharedTeamId;
        if (activeShareId && window.SalibandyFirebase && window.SalibandyFirebase.isReady()) {
            if (sharedTeamSyncDebounceTimer) clearTimeout(sharedTeamSyncDebounceTimer);
            sharedTeamSyncDebounceTimer = setTimeout(() => {
                pushSharedTeamToCloud(activeShareId, curTeam);
            }, 800);
        }
    }

    function deleteActiveTeam() {
        if (teams.length <= 1) {
            showToast('Et voi poistaa ainoaa joukkuetta.');
            return;
        }

        const team = teams.find(t => t.id === currentTeamId);
        if (!team) return;

        if (currentTeamId === 'team_sekta' || currentTeamId === 'default_team' || (team.name && team.name.toLowerCase().includes('sekta'))) {
            showToast('SekTa-pääjoukkuetta ei voi poistaa.', 'warning');
            return;
        }

        if (currentTeamId === 'team_akatemia' || currentTeamId === 'team_fbc_akatemia' || currentTeamId === 'team_1786787084772' || (team.name && team.name.toLowerCase().includes('akatemia'))) {
            showToast('⚠️ Joukkuetta "FBC Akatemia" ei voi poistaa!', 'warning');
            return;
        }

        if (confirm(`Haluatko varmasti poistaa joukkueen '${team.name}' kaikkine pelaajineen ja kentällisineen?`)) {
            const deleteId = currentTeamId;

            // 1. Stop shared listener
            if (unsubscribeSharedTeam && (team.shareId || currentSharedTeamId === team.shareId)) {
                unsubscribeSharedTeam();
                unsubscribeSharedTeam = null;
            }

            // 2. Add to deletedTeamIds
            if (!deletedTeamIds.includes(deleteId)) {
                deletedTeamIds.push(deleteId);
            }
            if (team.shareId) {
                if (!deletedTeamIds.includes('shared_' + team.shareId)) {
                    deletedTeamIds.push('shared_' + team.shareId);
                }
                if (!deletedTeamIds.includes(team.shareId)) {
                    deletedTeamIds.push(team.shareId);
                }
            }
            localStorage.setItem('salibandy_deleted_team_ids', JSON.stringify(deletedTeamIds));

            // 3. Filter teams
            teams = teams.filter(t => t.id !== deleteId && !deletedTeamIds.includes(t.id));
            if (teams.length === 0) {
                teams = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
            }

            // 4. Remove localStorage items
            localStorage.removeItem(`salibandy_roster_${deleteId}`);
            localStorage.removeItem(`salibandy_lineups_${deleteId}`);
            localStorage.removeItem(`salibandy_reserves_${deleteId}`);
            localStorage.removeItem(`salibandy_events_${deleteId}`);
            localStorage.removeItem(`salibandy_active_event_id_${deleteId}`);

            // 5. Select next team
            const nextTeamId = teams[0].id;
            currentTeamId = nextTeamId;
            localStorage.setItem('salibandy_active_team_id', JSON.stringify(currentTeamId));
            loadState(currentTeamId);

            // 6. Cancel pending debounce
            if (cloudSyncDebounceTimer) {
                clearTimeout(cloudSyncDebounceTimer);
                cloudSyncDebounceTimer = null;
            }

            // 7. Write to Firestore immediately without merge: true
            if (currentUser && window.SalibandyFirebase && window.SalibandyFirebase.isReady()) {
                const db = window.SalibandyFirebase.getDb();
                const payload = buildFullCloudPayload();
                lastLoadedCloudPayloadString = JSON.stringify(payload);
                db.collection('users').doc(currentUser.uid).set(payload)
                    .then(() => updateCloudButtonUI(true))
                    .catch(err => console.warn('[Simple] Immediate Firestore delete write error:', err));
            }

            // 8. Re-render
            renderAll(true);
            const activeTeam = teams.find(t => t.id === currentTeamId);
            if (activeTeam && activeTeam.shareId) {
                listenToSharedTeamFirestore(activeTeam.shareId);
            }

            showToast(`Joukkue '${team.name}' poistettu pysyvästi.`);
        }
    }

    function openTeamCustomizeModal() {
        if (!modalEl || !modalBody || !modalTitle) return;
        const curTeam = teams.find(t => t.id === currentTeamId) || teams[0];
        if (!curTeam) return;

        modalTitle.textContent = 'Joukkueen ilme & kustomointi';

        let tempLogo = curTeam.logo || '🏑';
        let tempPrimaryColor = curTeam.primaryColor || '#2563eb';
        let tempMvColor = curTeam.mvColor || '#10b981';

        const emojiPresets = ['🏑', '🦁', '⚡', '🦅', '🐻', '🐺', '🦈', '👑', '🔥', '⚔️', '🦉', '🐯'];
        const colorPresets = [
            { name: 'Sininen', hex: '#2563eb' },
            { name: 'Punainen', hex: '#dc2626' },
            { name: 'Vihreä', hex: '#16a34a' },
            { name: 'Oranssi', hex: '#ea580c' },
            { name: 'Violetti', hex: '#7c3aed' },
            { name: 'Musta/Tumma', hex: '#1e293b' },
            { name: 'Kulta', hex: '#d97706' },
            { name: 'Navy', hex: '#1e3a8a' }
        ];

        modalBody.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #94a3b8; margin-bottom: 4px;">Joukkueen nimi</label>
                    <input type="text" id="cust-simple-team-name" value="${escapeHtml((curTeam.name || '').replace(/^🤝\s*/, ''))}" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 10px; color: #fff; font-size: 0.9rem; font-weight: 600;">
                </div>

                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #94a3b8; margin-bottom: 6px;">Joukkueen logo / tunnus</label>
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                        <div id="cust-simple-logo-preview" style="width: 52px; height: 52px; border-radius: 10px; background: #0b1120; border: 2px solid var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; overflow: hidden; flex-shrink: 0;">
                            ${(tempLogo.startsWith('data:') || tempLogo.startsWith('http')) ? `<img src="${tempLogo}" style="width:100%;height:100%;object-fit:cover;">` : tempLogo}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px; flex: 1;">
                            <button type="button" class="btn-tool primary" id="btn-cust-simple-upload" style="padding: 6px 12px; font-size: 0.8rem;">📁 Lataa joukkueen kuva...</button>
                            <input type="file" id="cust-simple-file-input" accept="image/*" style="display: none;">
                            <button type="button" class="btn-tool" id="btn-cust-simple-reset-logo" style="padding: 4px 8px; font-size: 0.72rem; background: rgba(255,255,255,0.06);">Palauta peruslogo</button>
                        </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${emojiPresets.map(em => `<button type="button" class="cust-emoji-btn" data-emoji="${em}" style="width: 34px; height: 34px; border-radius: 6px; background: #0b1120; border: 1px solid var(--border-color); font-size: 1.15rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">${em}</button>`).join('')}
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #94a3b8; margin-bottom: 6px;">Pelipaidan pääväri</label>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <input type="color" id="cust-simple-primary-color" value="${tempPrimaryColor}" style="width: 40px; height: 34px; border: none; border-radius: 6px; cursor: pointer; background: none;">
                        <span id="cust-simple-color-label" style="font-family: monospace; font-size: 0.85rem; color: #fff;">${tempPrimaryColor}</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${colorPresets.map(c => `<button type="button" class="cust-color-swatch" data-color="${c.hex}" style="width: 28px; height: 28px; border-radius: 50%; background: ${c.hex}; border: 2px solid ${c.hex === tempPrimaryColor ? '#fff' : 'transparent'}; cursor: pointer;" title="${c.name}"></button>`).join('')}
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #94a3b8; margin-bottom: 4px;">Kotiareena / Halli</label>
                    <input type="text" id="cust-simple-arena" value="${escapeHtml(curTeam.arena || curTeam.arenaName || 'Kotiareena')}" placeholder="esim. Kotiareena, Kupittaa" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 10px; color: #fff; font-size: 0.85rem;">
                </div>

                <div style="display: flex; gap: 8px; margin-top: 6px;">
                    <button type="button" class="btn-tool" id="btn-cust-simple-delete" style="padding: 10px 14px; font-size: 0.85rem; background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.4);" title="Poista tämä joukkue">🗑️ Poista</button>
                    <button type="button" class="btn-tool primary" id="btn-cust-simple-save" style="flex: 1; padding: 10px; font-size: 0.9rem;">💾 Tallenna muutokset</button>
                    <button type="button" class="btn-tool" id="btn-cust-simple-cancel" style="padding: 10px 14px; font-size: 0.85rem;">Peruuta</button>
                </div>
            </div>
        `;

        const previewEl = document.getElementById('cust-simple-logo-preview');
        const colorInput = document.getElementById('cust-simple-primary-color');
        const colorLabel = document.getElementById('cust-simple-color-label');
        const fileInput = document.getElementById('cust-simple-file-input');

        document.querySelectorAll('.cust-emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                tempLogo = btn.dataset.emoji;
                if (previewEl) previewEl.innerHTML = tempLogo;
            });
        });

        document.getElementById('btn-cust-simple-upload')?.addEventListener('click', () => {
            fileInput?.click();
        });

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const size = 200;
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        const minDim = Math.min(img.width, img.height);
                        const sx = (img.width - minDim) / 2;
                        const sy = (img.height - minDim) / 2;
                        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
                        tempLogo = canvas.toDataURL('image/jpeg', 0.85);
                        if (previewEl) previewEl.innerHTML = `<img src="${tempLogo}" style="width:100%;height:100%;object-fit:cover;">`;
                    };
                    img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
                e.target.value = '';
            }
        });

        document.getElementById('btn-cust-simple-reset-logo')?.addEventListener('click', () => {
            tempLogo = '🏑';
            if (previewEl) previewEl.innerHTML = tempLogo;
        });

        colorInput?.addEventListener('input', (e) => {
            tempPrimaryColor = e.target.value;
            if (colorLabel) colorLabel.textContent = tempPrimaryColor;
            if (previewEl) previewEl.style.borderColor = tempPrimaryColor;
        });

        document.querySelectorAll('.cust-color-swatch').forEach(btn => {
            btn.addEventListener('click', () => {
                tempPrimaryColor = btn.dataset.color;
                if (colorInput) colorInput.value = tempPrimaryColor;
                if (colorLabel) colorLabel.textContent = tempPrimaryColor;
                if (previewEl) previewEl.style.borderColor = tempPrimaryColor;
                document.querySelectorAll('.cust-color-swatch').forEach(b => {
                    b.style.borderColor = (b.dataset.color === tempPrimaryColor) ? '#fff' : 'transparent';
                });
            });
        });

        document.getElementById('btn-cust-simple-cancel')?.addEventListener('click', () => {
            modalEl.classList.remove('active');
        });

        document.getElementById('btn-cust-simple-delete')?.addEventListener('click', () => {
            modalEl.classList.remove('active');
            deleteActiveTeam();
        });

        document.getElementById('btn-cust-simple-save')?.addEventListener('click', () => {
            const nameInput = document.getElementById('cust-simple-team-name');
            const arenaInput = document.getElementById('cust-simple-arena');
            const newName = nameInput ? nameInput.value.trim() : '';
            if (newName) {
                const prefix = curTeam.name.startsWith('🤝') ? '🤝 ' : '';
                curTeam.name = prefix + newName;
            }
            curTeam.logo = tempLogo;
            curTeam.primaryColor = tempPrimaryColor;
            if (arenaInput) {
                curTeam.arena = arenaInput.value.trim() || 'Kotiareena';
                curTeam.arenaName = curTeam.arena;
            }

            saveState();
            renderAll();
            modalEl.classList.remove('active');
            showToast('Joukkueen ilme ja värit päivitetty! 🎨');
        });

        modalEl.classList.add('active');
    }

    function renderTeamHeader() {
        if (!teamSelect) return;
        teamSelect.innerHTML = '';
        teams.forEach(t => {
            if (!t || !t.id || deletedTeamIds.includes(t.id)) return;
            const opt = document.createElement('option');
            opt.value = t.id;
            
            let safeName = t.name || 'Joukkue';
            if (safeName.startsWith('data:') || safeName.length > 40) {
                safeName = 'SekTa';
                t.name = 'SekTa';
            }

            const isBase64 = (t.logo && (t.logo.startsWith('data:') || t.logo.length > 20));
            const emojiPrefix = (!isBase64 && t.logo) ? (t.logo + ' ') : '';
            opt.textContent = emojiPrefix + safeName;

            if (t.id === currentTeamId) opt.selected = true;
            teamSelect.appendChild(opt);
        });

        const addOpt = document.createElement('option');
        addOpt.value = '__new_team__';
        addOpt.textContent = '➕ Uusi joukkue...';
        teamSelect.appendChild(addOpt);

        const curTeam = teams.find(t => t.id === currentTeamId) || teams[0];
        if (curTeam) {
            if (curTeam.primaryColor) {
                document.documentElement.style.setProperty('--color-primary', curTeam.primaryColor);
                document.documentElement.style.setProperty('--team-primary-color', curTeam.primaryColor);
            }
            if (curTeam.mvColor) {
                document.documentElement.style.setProperty('--team-mv-color', curTeam.mvColor);
            }
        }
        if (teamLogoBadge) {
            teamLogoBadge.style.cursor = 'pointer';
            teamLogoBadge.title = 'Muokkaa joukkueen ilmettä ja värejä 🎨';
            const isBase64 = (curTeam.logo && (curTeam.logo.startsWith('data:') || curTeam.logo.startsWith('http')));
            if (isBase64) {
                teamLogoBadge.innerHTML = `<img src="${curTeam.logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">`;
            } else {
                teamLogoBadge.textContent = curTeam.logo || '🏑';
            }
            if (!teamLogoBadge._hasCustListener) {
                teamLogoBadge._hasCustListener = true;
                teamLogoBadge.addEventListener('click', openTeamCustomizeModal);
            }
        }
    }

    function renderEventBar() {
        if (!eventSelect) return;
        eventSelect.innerHTML = '';

        if (!teamEvents || teamEvents.length === 0) {
            const curTeam = teams.find(t => t.id === currentTeamId);
            const isSektaTeam = currentTeamId === 'default_team' || currentTeamId === 'team_sekta' || (curTeam && (curTeam.name || '').toLowerCase().includes('sekta'));
            if (isSektaTeam) {
                teamEvents = JSON.parse(JSON.stringify(DEFAULT_SEKTA_EVENTS));
                activeEventId = teamEvents[0]?.id || null;
            }
        }

        if (!teamEvents || teamEvents.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Ei tapahtumia (Paina 🔄 Hae)';
            eventSelect.appendChild(opt);
            renderStatsBar({});
            return;
        }

        teamEvents.forEach(ev => {
            const opt = document.createElement('option');
            opt.value = ev.id;
            opt.textContent = `${ev.title} (${ev.date || 'Ei pvm'})`;
            if (ev.id === activeEventId) opt.selected = true;
            eventSelect.appendChild(opt);
        });

        const curEvent = teamEvents.find(e => e.id === activeEventId) || teamEvents[0];
        if (curEvent) {
            activeEventId = curEvent.id;
            renderStatsBar(curEvent.attendees || {});
        }
    }

    function renderStatsBar(attendeesMap) {
        if (!statsBar) return;
        let inCount = 0, outCount = 0, maybeCount = 0, unCount = 0;

        roster.forEach(p => {
            const att = attendeesMap[p.id] || { status: 'unanswered' };
            if (att.status === 'in') inCount++;
            else if (att.status === 'out') outCount++;
            else if (att.status === 'maybe') maybeCount++;
            else unCount++;
        });

        statsBar.innerHTML = `
            <div class="stat-chip in" data-filter="in">🟢 Mukana: ${inCount}</div>
            <div class="stat-chip out" data-filter="out">🔴 Poissa: ${outCount}</div>
            <div class="stat-chip maybe" data-filter="maybe">🟡 Ehkä: ${maybeCount}</div>
            <div class="stat-chip unanswered" data-filter="unanswered">⚪ Avoin: ${unCount}</div>
        `;

        statsBar.querySelectorAll('.stat-chip').forEach(chip => {
            const f = chip.dataset.filter;
            const targetFilter = (f === 'unanswered') ? 'open' : f;
            if (activeRosterFilter === targetFilter || (f === 'unanswered' && activeRosterFilter === 'unanswered')) {
                chip.classList.add('active');
            }
            chip.addEventListener('click', () => {
                activeRosterFilter = (activeRosterFilter === targetFilter || (f === 'unanswered' && activeRosterFilter === 'unanswered')) ? 'all' : targetFilter;
                renderStatsBar(attendeesMap);
                renderRosterList();
            });
        });
    }

    function updateLineupContainerDensity() {
        if (!lineupCardContainer) return;
        if (simpleDensity === '2col') {
            lineupCardContainer.classList.add('density-2col');
            lineupCardContainer.classList.remove('density-1col');
        } else {
            lineupCardContainer.classList.add('density-1col');
            lineupCardContainer.classList.remove('density-2col');
        }
    }

    function renderLineupTabs() {
        if (!lineupNavBar) return;
        lineupNavBar.innerHTML = '';

        const isAllActive = (activeLineupTab !== 'yv_av' && activeLineupTab !== 'special' && activeLineupTab !== '6v5');

        // Tab 1: 1.–4. Kentät (Default: shows lines 1, 2, 3, 4 together on the screen)
        const allTab = document.createElement('button');
        allTab.className = `lineup-tab ${isAllActive ? 'active' : ''}`;
        allTab.textContent = '👥 1.–4. Kentät';
        allTab.addEventListener('click', () => {
            activeLineupTab = 'all';
            scheduleRender({ tabs: true, cards: true });
        });
        lineupNavBar.appendChild(allTab);

        // Tab 2: YV & AV (Kaksi kentällistä molempia: 1. YV, 2. YV, 1. AV, 2. AV)
        const specialTab = document.createElement('button');
        specialTab.className = `lineup-tab ${(activeLineupTab === 'yv_av' || activeLineupTab === 'special') ? 'active' : ''}`;
        specialTab.textContent = '⚡ YV & AV (4)';
        specialTab.addEventListener('click', () => {
            activeLineupTab = 'yv_av';
            scheduleRender({ tabs: true, cards: true });
        });
        lineupNavBar.appendChild(specialTab);

        // Tab 3: 6 vs 5 (Kaksi kentällistä: 1. 6vs5, 2. 6vs5)
        const sixTab = document.createElement('button');
        sixTab.className = `lineup-tab ${activeLineupTab === '6v5' ? 'active' : ''}`;
        sixTab.textContent = '🔥 6 vs 5 (2)';
        sixTab.addEventListener('click', () => {
            activeLineupTab = '6v5';
            scheduleRender({ tabs: true, cards: true });
        });
        lineupNavBar.appendChild(sixTab);

        // Density toggle button (2-sarake vs 1-sarake)
        const densityBtn = document.createElement('button');
        densityBtn.className = 'density-toggle-btn';
        densityBtn.title = 'Vaihda tiiviys: 2 saraketta (kaikki kentät mahtuu kerralla ruudulle) tai 1 sarake';
        densityBtn.innerHTML = simpleDensity === '2col' 
            ? '<span>📱📱 2-sarake</span>' 
            : '<span>📱 1-sarake</span>';
        densityBtn.addEventListener('click', () => {
            simpleDensity = (simpleDensity === '2col') ? '1col' : '2col';
            try { localStorage.setItem('salibandy_simple_density', simpleDensity); } catch(e){}
            updateLineupContainerDensity();
            renderLineupTabs();
            renderLineupCards();
            showToast(simpleDensity === '2col' ? '2 sarakkeen tiivis näkymä (kaikki kentät kerralla)' : '1 sarakkeen näkymä');
        });
        lineupNavBar.appendChild(densityBtn);
    }

    function getLineupReserves(lineupKey) {
        if (!lineupReserves) lineupReserves = {};
        const entry = lineupReserves[lineupKey];
        if (Array.isArray(entry)) return entry;
        if (entry && typeof entry === 'object' && Array.isArray(entry.general)) return entry.general;
        return [];
    }

    function addLineupReserve(lineupKey, playerId) {
        if (!playerId) return;
        if (!lineupReserves) lineupReserves = {};
        if (!lineupReserves[lineupKey]) {
            lineupReserves[lineupKey] = [];
        }
        if (Array.isArray(lineupReserves[lineupKey])) {
            if (!lineupReserves[lineupKey].includes(playerId)) {
                lineupReserves[lineupKey].push(playerId);
            }
        } else {
            if (!Array.isArray(lineupReserves[lineupKey].general)) lineupReserves[lineupKey].general = [];
            if (!lineupReserves[lineupKey].general.includes(playerId)) {
                lineupReserves[lineupKey].general.push(playerId);
            }
        }
        saveState();
    }

    function removeLineupReserve(lineupKey, playerId) {
        if (!lineupReserves || !lineupReserves[lineupKey]) return;
        if (Array.isArray(lineupReserves[lineupKey])) {
            lineupReserves[lineupKey] = lineupReserves[lineupKey].filter(id => id !== playerId);
        } else if (lineupReserves[lineupKey].general) {
            lineupReserves[lineupKey].general = lineupReserves[lineupKey].general.filter(id => id !== playerId);
        }
        saveState();
    }

    function renderLineupCards() {
        if (!lineupCardContainer) return;
        updateLineupContainerDensity();
        lineupCardContainer.innerHTML = '';

        let configsToShow = [];
        if (activeLineupTab === 'yv_av' || activeLineupTab === 'special') {
            // YV & AV: 2 kentällistä molempia! (1. YV, 2. YV, 1. AV, 2. AV)
            configsToShow = SIMPLE_LINEUP_CONFIGS.filter(c => ['yv1', 'yv2', 'av1', 'av2'].includes(c.id));
        } else if (activeLineupTab === '6v5') {
            // 6 vs 5: 2 kentällistä! (1. 6vs5, 2. 6vs5)
            configsToShow = SIMPLE_LINEUP_CONFIGS.filter(c => ['6v5_1', '6v5_2'].includes(c.id));
        } else {
            // Default: 1.–4. Kentät
            configsToShow = SIMPLE_LINEUP_CONFIGS.filter(c => ['1', '2', '3', '4'].includes(c.id));
        }

        const curEvent = teamEvents.find(e => e.id === activeEventId);
        const attendeesMap = curEvent ? (curEvent.attendees || {}) : {};

        configsToShow.forEach(cfg => {
            const card = document.createElement('div');
            card.className = 'lineup-card';

            const is6v5 = cfg.group === '6v5';
            const gridPositions = is6v5 
                ? ['VH', 'VP', 'KH', 'OP', 'OH', '6P'] 
                : ['VH', 'VP', 'KH', 'OP', 'OH', 'MV'];

            const lineSlots = lineups[cfg.id] || {};

            let slotsHtml = '';
            gridPositions.forEach(pos => {
                const playerId = lineSlots[pos] || (pos === '6P' ? lineSlots['VM'] : '');
                const player = roster.find(p => p.id === playerId);
                const att = player ? (attendeesMap[player.id] || { status: 'unanswered' }) : null;

                const posLabel = (pos === 'KH') ? 'C' : pos;

                let posClass = 'pos-h';
                if (pos === 'MV') posClass = 'pos-mv';
                else if (pos === 'VP') posClass = 'pos-vp';
                else if (pos === 'OP') posClass = 'pos-op';
                else if (pos === 'KH') posClass = 'pos-c';
                else if (pos === 'VH') posClass = 'pos-vh';
                else if (pos === 'OH') posClass = 'pos-oh';
                else if (pos === '6P' || pos === 'VM') posClass = 'pos-6p';

                if (player) {
                    let badgeDot = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '⚪';
                    const photoHtml = player.photo 
                        ? `<div class="slot-photo-thumb" style="width: 20px; height: 20px; border-radius: 50%; background-image: url('${player.photo}'); background-size: cover; background-position: center; flex-shrink: 0; margin-right: 4px; border: 1px solid rgba(255,255,255,0.25);"></div>` 
                        : '';

                    slotsHtml += `
                        <div class="slot-item" data-lineup="${cfg.id}" data-pos="${pos}">
                            <div class="slot-left">
                                <span class="pos-tag ${posClass}">${posLabel}</span>
                                ${photoHtml}
                                <div class="slot-player-name" title="${escapeHtml(player.name)}">#${player.number} ${escapeHtml(player.name)}</div>
                            </div>
                            <div class="slot-right">
                                <span class="compact-status" title="${att.status.toUpperCase()}">${badgeDot}</span>
                                <button class="btn-slot-remove" data-action="clear-slot" data-lineup="${cfg.id}" data-pos="${pos}" title="Poista kentällisestä">✕</button>
                            </div>
                        </div>
                    `;
                } else {
                    slotsHtml += `
                        <div class="slot-item is-empty" data-lineup="${cfg.id}" data-pos="${pos}">
                            <div class="slot-left">
                                <span class="pos-tag ${posClass}">${posLabel}</span>
                                <div class="slot-player-empty-label">+ ${posLabel}</div>
                            </div>
                            <div class="slot-right"></div>
                        </div>
                    `;
                }
            });

            // ── Varapelaajat / Vaihtopenkki ──
            const lineReserves = getLineupReserves(cfg.id);
            let reservesChipsHtml = '';
            if (lineReserves.length > 0) {
                lineReserves.forEach(pId => {
                    const p = roster.find(r => r.id === pId);
                    if (p) {
                        const att = attendeesMap[p.id] || { status: 'unanswered' };
                        const badgeDot = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '⚪';
                        reservesChipsHtml += `
                            <div class="reserve-chip">
                                <span class="reserve-dot">${badgeDot}</span>
                                <span class="reserve-name" title="${escapeHtml(p.name)}">#${p.number} ${escapeHtml(p.name)}</span>
                                <button class="btn-remove-reserve" data-lineup="${cfg.id}" data-player="${p.id}" title="Poista varamies">✕</button>
                            </div>
                        `;
                    }
                });
            }

            let reservesSectionHtml = '';
            if (lineReserves.length > 0) {
                reservesSectionHtml = `
                    <div class="lineup-reserves-section">
                        <div class="reserves-header-row">
                            <span class="reserves-label">🪑 Varalla (${lineReserves.length}):</span>
                            <button class="btn-add-reserve" data-lineup="${cfg.id}" title="Lisää varamies kentälliseen">+ Varamies</button>
                        </div>
                        <div class="reserves-chips-row">
                            ${reservesChipsHtml}
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="lineup-card-header">
                    <div class="lineup-title">${cfg.icon || '🏒'} ${escapeHtml(cfg.name)}</div>
                    <div class="lineup-actions">
                        <button class="btn-lineup-action btn-add-reserve" data-lineup="${cfg.id}" title="Lisää varapelaaja kentälliseen">🪑+</button>
                        <button class="btn-lineup-action" data-action="clear-lineup" data-lineup="${cfg.id}">Tyhjennä</button>
                    </div>
                </div>
                <div class="slots-container compact-grid">
                    ${slotsHtml}
                </div>
                ${reservesSectionHtml}
            `;

            // Bind slot clicks
            card.querySelectorAll('.slot-item').forEach(slot => {
                slot.addEventListener('click', (e) => {
                    const clearBtn = e.target.closest('[data-action="clear-slot"]');
                    if (clearBtn) {
                        const lk = clearBtn.dataset.lineup;
                        const p = clearBtn.dataset.pos;
                        if (lineups[lk]) {
                            lineups[lk][p] = '';
                            if (p === '6P' && lineups[lk]['VM']) lineups[lk]['VM'] = '';
                        }
                        saveState();
                        scheduleRender({ cards: true, roster: true });
                        showToast('Pelaaja poistettu kentällisestä');
                        return;
                    }

                    const lk = slot.dataset.lineup;
                    const pos = slot.dataset.pos;
                    openSlotPicker(lk, pos);
                });
            });

            // Bind clear lineup
            card.querySelector('[data-action="clear-lineup"]')?.addEventListener('click', (e) => {
                const lk = e.target.dataset.lineup;
                gridPositions.forEach(p => { if (lineups[lk]) lineups[lk][p] = ''; });
                if (lineups[lk] && lineups[lk]['VM']) lineups[lk]['VM'] = '';
                saveState();
                scheduleRender({ cards: true, roster: true });
                showToast(`${cfg.name} tyhjennetty`);
            });

            // Bind add reserve (both header 🪑+ button and reserves section button)
            card.querySelectorAll('.btn-add-reserve').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const lk = e.currentTarget.dataset.lineup;
                    openReservePicker(lk);
                });
            });

            // Bind remove reserve
            card.querySelectorAll('.btn-remove-reserve').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const lk = e.currentTarget.dataset.lineup;
                    const pId = e.currentTarget.dataset.player;
                    removeLineupReserve(lk, pId);
                    saveState();
                    scheduleRender({ cards: true, roster: true });
                    showToast('Varapelaaja poistettu');
                });
            });

            lineupCardContainer.appendChild(card);
        });
    }

    function openPlayerEditModal(player) {
        if (!modalEl || !modalBody || !modalTitle) return;
        const isNew = !player;
        const pData = player ? { ...player } : { id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4), name: '', number: '', position: 'H', photo: '' };
        
        modalTitle.textContent = isNew ? 'Lisää uusi pelaaja' : `Muokkaa pelaajaa #${pData.number ?? ''} ${pData.name || ''}`;

        let tempPhoto = pData.photo || '';
        let activePos = (pData.position || 'H').toUpperCase();

        const posList = ['VH', 'KH', 'OH', 'VP', 'OP', 'MV', 'H'];

        modalBody.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 2;">
                        <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #94a3b8; margin-bottom: 4px;">Pelaajan nimi</label>
                        <input type="text" id="cust-player-name" value="${escapeHtml(pData.name || '')}" placeholder="esim. Matti Meikäläinen" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 10px; color: #fff; font-size: 0.9rem;">
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #94a3b8; margin-bottom: 4px;">Numero</label>
                        <input type="number" id="cust-player-num" value="${pData.number !== undefined ? pData.number : ''}" placeholder="19" style="width: 100%; background: #0b1120; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 10px; color: #fff; font-size: 0.9rem;">
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #94a3b8; margin-bottom: 6px;">Pelipaikka</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${posList.map(pos => `<button type="button" class="cust-pos-btn ${pos === activePos ? 'active' : ''}" data-pos="${pos}" style="padding: 6px 12px; border-radius: 6px; background: ${pos === activePos ? 'var(--color-primary)' : '#0b1120'}; color: #fff; border: 1px solid var(--border-color); font-weight: 700; font-size: 0.82rem; cursor: pointer;">${pos}</button>`).join('')}
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #94a3b8; margin-bottom: 6px;">Pelaajan kuva</label>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div id="cust-player-photo-preview" style="width: 48px; height: 48px; border-radius: 50%; background: #0b1120; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; overflow: hidden; flex-shrink: 0; background-size: cover; background-position: center; ${tempPhoto ? `background-image: url('${tempPhoto}');` : ''}">
                            ${!tempPhoto ? '👤' : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px; flex: 1;">
                            <button type="button" class="btn-tool primary" id="btn-cust-photo-upload" style="padding: 6px 12px; font-size: 0.8rem;">📷 Valitse kuva...</button>
                            <input type="file" id="cust-player-file-input" accept="image/*" style="display: none;">
                            <button type="button" class="btn-tool" id="btn-cust-photo-remove" style="padding: 4px 8px; font-size: 0.72rem; background: rgba(255,255,255,0.06); ${!tempPhoto ? 'display:none;' : ''}">Poista kuva</button>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button class="btn-tool primary" id="btn-cust-player-save" style="flex: 1; padding: 10px; font-size: 0.9rem;">💾 Tallenna</button>
                    ${!isNew ? '<button class="btn-tool" id="btn-cust-player-delete" style="padding: 10px 12px; font-size: 0.85rem; background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);">🗑️ Poista</button>' : ''}
                    <button class="btn-tool" id="btn-cust-player-cancel" style="padding: 10px 12px; font-size: 0.85rem;">Peruuta</button>
                </div>
            </div>
        `;

        const photoPreview = document.getElementById('cust-player-photo-preview');
        const fileInput = document.getElementById('cust-player-file-input');
        const removePhotoBtn = document.getElementById('btn-cust-photo-remove');

        document.querySelectorAll('.cust-pos-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activePos = btn.dataset.pos;
                document.querySelectorAll('.cust-pos-btn').forEach(b => {
                    b.style.background = (b.dataset.pos === activePos) ? 'var(--color-primary)' : '#0b1120';
                });
            });
        });

        document.getElementById('btn-cust-photo-upload')?.addEventListener('click', () => {
            fileInput?.click();
        });

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
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
                        tempPhoto = canvas.toDataURL('image/jpeg', 0.85);
                        if (photoPreview) {
                            photoPreview.style.backgroundImage = `url('${tempPhoto}')`;
                            photoPreview.textContent = '';
                        }
                        if (removePhotoBtn) removePhotoBtn.style.display = 'block';
                    };
                    img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
                e.target.value = '';
            }
        });

        removePhotoBtn?.addEventListener('click', () => {
            tempPhoto = '';
            if (photoPreview) {
                photoPreview.style.backgroundImage = 'none';
                photoPreview.textContent = '👤';
            }
            if (removePhotoBtn) removePhotoBtn.style.display = 'none';
        });

        document.getElementById('btn-cust-player-cancel')?.addEventListener('click', () => {
            modalEl.classList.remove('active');
        });

        document.getElementById('btn-cust-player-delete')?.addEventListener('click', () => {
            if (confirm(`Poistetaanko pelaaja ${pData.name} ringistä?`)) {
                roster = roster.filter(p => p.id !== pData.id);
                Object.keys(lineups).forEach(k => {
                    Object.keys(lineups[k] || {}).forEach(pos => {
                        if (lineups[k][pos] === pData.id) lineups[k][pos] = '';
                    });
                });
                saveState();
                renderAll();
                modalEl.classList.remove('active');
                showToast(`Pelaaja ${pData.name} poistettu!`);
            }
        });

        document.getElementById('btn-cust-player-save')?.addEventListener('click', () => {
            const nameInput = document.getElementById('cust-player-name');
            const numInput = document.getElementById('cust-player-num');
            const name = nameInput ? nameInput.value.trim() : '';
            const num = numInput ? parseInt(numInput.value, 10) : 0;

            if (!name) {
                showToast('Syötä pelaajan nimi.');
                return;
            }

            pData.name = name;
            pData.number = isNaN(num) ? 0 : num;
            pData.position = activePos;
            pData.photo = tempPhoto;

            if (isNew) {
                roster.push(pData);
                showToast(`Pelaaja #${pData.number} ${pData.name} lisätty! 🎉`);
            } else {
                const idx = roster.findIndex(p => p.id === pData.id);
                if (idx >= 0) roster[idx] = pData;
                showToast(`Pelaajan tiedot tallennettu! 👍`);
            }

            saveState();
            renderAll();
            modalEl.classList.remove('active');
        });

        modalEl.classList.add('active');
    }

    function renderRosterList() {
        if (!rosterListContainer) return;
        rosterListContainer.innerHTML = '';
        updateRosterDensityUI();

        const curEvent = teamEvents.find(e => e.id === activeEventId);
        const attendeesMap = curEvent ? (curEvent.attendees || {}) : {};

        // Find assignments across all 10 canonical lineups
        const assignments = {};
        SIMPLE_LINEUP_CONFIGS.forEach(cfg => {
            const line = lineups[cfg.id] || {};
            const positions = cfg.group === '6v5' ? POS_ORDER_6V5 : POS_ORDER;
            positions.forEach(pos => {
                const pId = line[pos] || (pos === '6P' ? line['VM'] : '');
                if (pId) {
                    if (!assignments[pId]) assignments[pId] = [];
                    const displayPos = (pos === 'KH') ? 'C' : pos;
                    assignments[pId].push(`${cfg.shortName}: ${displayPos}`);
                }
            });
            const reserves = getLineupReserves(cfg.id);
            reserves.forEach(pId => {
                if (!assignments[pId]) assignments[pId] = [];
                assignments[pId].push(`${cfg.shortName}: Varamies 🪑`);
            });
        });

        // Compute pill counters
        const cntAll = roster.length;
        let cntFreeIn = 0, cntIn = 0, cntPlaced = 0, cntOut = 0, cntOpen = 0, cntMv = 0;

        roster.forEach(p => {
            const att = attendeesMap[p.id] || { status: 'unanswered' };
            const isPlaced = isPlayerIn1to4(p.id);
            if (att.status === 'in') {
                cntIn++;
                if (!isPlaced) cntFreeIn++;
            } else if (att.status === 'out') {
                cntOut++;
            } else if (att.status === 'unanswered') {
                cntOpen++;
            }
            if (isPlaced) {
                cntPlaced++;
            }
            if ((p.position || '').toUpperCase() === 'MV') {
                cntMv++;
            }
        });

        const setPillCnt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setPillCnt('pill-cnt-all', cntAll);
        setPillCnt('pill-cnt-free-in', cntFreeIn);
        setPillCnt('pill-cnt-in', cntIn);
        setPillCnt('pill-cnt-placed', cntPlaced);
        setPillCnt('pill-cnt-out', cntOut);
        setPillCnt('pill-cnt-open', cntOpen);
        setPillCnt('pill-cnt-mv', cntMv);

        // Update active class on filter pill buttons
        document.querySelectorAll('.roster-filter-pill').forEach(btn => {
            const f = btn.dataset.filter;
            const isActive = (f === activeRosterFilter) || (f === 'open' && activeRosterFilter === 'unanswered');
            btn.classList.toggle('active', isActive);
        });

        // Filter players
        let filtered = roster.filter(p => {
            const att = attendeesMap[p.id] || { status: 'unanswered' };
            const isPlaced = isPlayerIn1to4(p.id);

            if (activeRosterFilter === 'free-in') {
                if (att.status !== 'in' || isPlaced) return false;
            } else if (activeRosterFilter === 'in') {
                if (att.status !== 'in') return false;
            } else if (activeRosterFilter === 'placed') {
                if (!isPlaced) return false;
            } else if (activeRosterFilter === 'out') {
                if (att.status !== 'out') return false;
            } else if (activeRosterFilter === 'open' || activeRosterFilter === 'unanswered') {
                if (att.status !== 'unanswered') return false;
            } else if (activeRosterFilter === 'maybe') {
                if (att.status !== 'maybe') return false;
            } else if (activeRosterFilter === 'free') {
                if ((assignments[p.id] || []).length > 0) return false;
            } else if (activeRosterFilter === 'mv') {
                if ((p.position || '').toUpperCase() !== 'MV') return false;
            }

            if (rosterSearchQuery) {
                const q = rosterSearchQuery.toLowerCase();
                const nameMatch = (p.name || '').toLowerCase().includes(q);
                const numMatch = String(p.number ?? '').includes(q);
                const posMatch = (p.position || '').toLowerCase().includes(q);
                if (!nameMatch && !numMatch && !posMatch) return false;
            }

            return true;
        });

        // Sort: Placed in 1-4 sink to the bottom! Unplaced come first, sorted by IN status, then jersey number
        filtered.sort((a, b) => {
            const placedA = isPlayerIn1to4(a.id);
            const placedB = isPlayerIn1to4(b.id);
            if (placedA !== placedB) {
                return placedA ? 1 : -1; // Unplaced (false) comes first (top), placed (true) sinks to bottom
            }
            const attA = attendeesMap[a.id] || { status: 'unanswered' };
            const attB = attendeesMap[b.id] || { status: 'unanswered' };
            const weight = s => s === 'in' ? 0 : s === 'maybe' ? 1 : s === 'unanswered' ? 2 : 3;
            if (weight(attA.status) !== weight(attB.status)) {
                return weight(attA.status) - weight(attB.status);
            }
            return (a.number || 0) - (b.number || 0);
        });

        if (filtered.length === 0) {
            rosterListContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Ei pelaajia valitulla suodattimella.</div>';
            return;
        }

        filtered.forEach(player => {
            const att = attendeesMap[player.id] || { status: 'unanswered' };
            const pAssigns = assignments[player.id] || [];
            const isAssigned = pAssigns.length > 0;
            const isPlaced = isPlayerIn1to4(player.id);
            const isFreeIn = (att.status === 'in' && !isPlaced);

            const row = document.createElement('div');
            row.className = `player-row ${isPlaced ? 'is-placed' : ''} ${isFreeIn ? 'is-unassigned-in' : ''}`;

            let attBtnClass = att.status;
            let attBtnText = att.status === 'in' ? '🟢 IN' : att.status === 'out' ? '🔴 OUT' : att.status === 'maybe' ? '🟡 EHKÄ' : '⚪ AVOIN';

            let assignHtml = '';
            if (isAssigned) {
                assignHtml = pAssigns.map(a => `<span class="player-assigned-badge" title="${escapeHtml(a)}">${escapeHtml(a)}</span>`).join('');
            }

            const photoHtml = player.photo 
                ? `<div class="roster-photo-thumb" style="width: 24px; height: 24px; border-radius: 50%; background-image: url('${player.photo}'); background-size: cover; background-position: center; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.25);"></div>` 
                : '';

            const pPos = player.position || 'H';
            let pPosClass = 'pos-h';
            if (pPos === 'MV') pPosClass = 'pos-mv';
            else if (pPos === 'VP' || pPos === 'OP' || pPos === 'P') pPosClass = 'pos-p';
            else if (pPos === 'KH' || pPos === 'C') pPosClass = 'pos-c';
            else if (pPos === 'VH' || pPos === 'OH') pPosClass = 'pos-h';
            const pPosLabel = (pPos === 'KH') ? 'C' : pPos;

            row.innerHTML = `
                <div class="player-row-header">
                    <div class="player-header-left" data-action="edit-player" data-player-id="${player.id}" title="Klikkaa muokataksesi pelaajaa">
                        ${photoHtml}
                        <span class="player-num">#${player.number}</span>
                        <span class="player-name-text" title="${escapeHtml(player.name)}">${escapeHtml(player.name)}</span>
                        <span class="player-pos-badge ${pPosClass}">${pPosLabel}</span>
                    </div>
                    <button class="status-toggle-btn ${attBtnClass}" data-action="toggle-status" data-player-id="${player.id}" title="Klikkaa vaihtaaksesi statusta">${attBtnText}</button>
                </div>
                <div class="player-row-footer">
                    <div class="player-assigned-badges">
                        ${assignHtml || '<span class="player-unassigned-tag">Vapaa</span>'}
                    </div>
                    <button class="btn-assign-quick ${isAssigned ? 'is-assigned' : ''}" data-action="assign-player" data-player-id="${player.id}">${isAssigned ? 'Muuta' : '+ Sijoita'}</button>
                </div>
            `;

            // Click left side to edit player
            row.querySelector('.player-header-left')?.addEventListener('click', () => {
                openPlayerEditModal(player);
            });

            // Toggle attendance status on click
            row.querySelector('[data-action="toggle-status"]')?.addEventListener('click', () => {
                togglePlayerStatus(player.id);
            });

            // Assign player
            row.querySelector('[data-action="assign-player"]')?.addEventListener('click', () => {
                openPlayerAssignTargetPicker(player);
            });

            rosterListContainer.appendChild(row);
        });
    }

    function togglePlayerStatus(playerId) {
        if (!activeEventId) {
            showToast('Valitse ensin tapahtuma ylhäältä!');
            return;
        }
        const curEvent = teamEvents.find(e => e.id === activeEventId);
        if (!curEvent) return;
        if (!curEvent.attendees) curEvent.attendees = {};

        const curStatus = curEvent.attendees[playerId]?.status || 'unanswered';
        let nextStatus = 'in';
        if (curStatus === 'in') nextStatus = 'out';
        else if (curStatus === 'out') nextStatus = 'maybe';
        else if (curStatus === 'maybe') nextStatus = 'in';

        curEvent.attendees[playerId] = { status: nextStatus, reason: '' };
        saveState();
        renderStatsBar(curEvent.attendees);
        scheduleRender({ cards: true, roster: true });
        showToast(`Status päivitetty: ${nextStatus.toUpperCase()}`);
    }

    function openSlotPicker(lineupKey, pos) {
        if (!modalEl) return;
        const cfg = SIMPLE_LINEUP_CONFIGS.find(c => c.id === lineupKey);
        const lineName = cfg ? cfg.name : lineupKey;
        const posLabel = POS_LABELS[pos] || pos;

        modalTitle.textContent = `Valitse ${posLabel} (${lineName})`;
        modalBody.innerHTML = '';

        const curEvent = teamEvents.find(e => e.id === activeEventId);
        const attendeesMap = curEvent ? (curEvent.attendees || {}) : {};

        // Sort players: matching position first, then IN status
        const sorted = [...roster].sort((a, b) => {
            const attA = attendeesMap[a.id] || { status: 'unanswered' };
            const attB = attendeesMap[b.id] || { status: 'unanswered' };
            const isMatchA = (pos === 'MV' && a.position === 'MV') 
                || (pos.includes('P') && pos !== '6P' && a.position === 'P') 
                || (pos.includes('H') && a.position === 'H')
                || (pos === '6P' && a.position !== 'MV');
            const isMatchB = (pos === 'MV' && b.position === 'MV') 
                || (pos.includes('P') && pos !== '6P' && b.position === 'P') 
                || (pos.includes('H') && b.position === 'H')
                || (pos === '6P' && b.position !== 'MV');
            if (isMatchA !== isMatchB) return isMatchB ? 1 : -1;
            const weight = s => s === 'in' ? 0 : s === 'maybe' ? 1 : s === 'unanswered' ? 2 : 3;
            if (weight(attA.status) !== weight(attB.status)) return weight(attA.status) - weight(attB.status);
            return (a.number || 0) - (b.number || 0);
        });

        sorted.forEach(p => {
            const att = attendeesMap[p.id] || { status: 'unanswered' };
            const item = document.createElement('div');
            item.className = `picker-player-item ${att.status === 'in' ? 'is-in' : att.status === 'out' ? 'is-out' : ''}`;

            const attText = att.status === 'in' ? '🟢 IN' : att.status === 'out' ? '🔴 OUT' : att.status === 'maybe' ? '🟡 EHKÄ' : '⚪ AVOIN';

            const pPos = p.position || 'H';
            let pPosClass = 'pos-h';
            if (pPos === 'MV') pPosClass = 'pos-mv';
            else if (pPos === 'VP' || pPos === 'OP' || pPos === 'P') pPosClass = 'pos-p';
            else if (pPos === 'KH' || pPos === 'C') pPosClass = 'pos-c';
            else if (pPos === 'VH' || pPos === 'OH') pPosClass = 'pos-h';
            const pPosLabel = (pPos === 'KH') ? 'C' : pPos;

            item.innerHTML = `
                <div>
                    <strong style="color: #93c5fd; font-size: 1rem;">#${p.number}</strong>
                    <span style="font-weight: 700; margin-left: 6px;">${escapeHtml(p.name)}</span>
                    <span class="player-pos-badge ${pPosClass}" style="margin-left: 6px;">${pPosLabel}</span>
                </div>
                <div>
                    <span class="status-badge-mini ${att.status}">${attText}</span>
                </div>
            `;

            item.addEventListener('click', () => {
                if (!lineups[lineupKey]) lineups[lineupKey] = {};
                lineups[lineupKey][pos] = p.id;
                if (pos === '6P') lineups[lineupKey]['VM'] = p.id;
                saveState();
                scheduleRender({ cards: true, roster: true });
                modalEl.classList.remove('active');
                const toastPos = (pos === 'KH') ? 'C' : pos;
                showToast(`#${p.number} ${p.name} asetettu paikkaan ${lineName} - ${toastPos} 👍`);
            });

            modalBody.appendChild(item);
        });

        modalEl.classList.add('active');
    }

    function openReservePicker(lineupKey) {
        if (!modalEl) return;
        const cfg = SIMPLE_LINEUP_CONFIGS.find(c => c.id === lineupKey);
        const lineName = cfg ? cfg.name : lineupKey;

        modalTitle.textContent = `Lisää varamies (${lineName})`;
        modalBody.innerHTML = '';

        const curEvent = teamEvents.find(e => e.id === activeEventId);
        const attendeesMap = curEvent ? (curEvent.attendees || {}) : {};
        const currentReserves = getLineupReserves(lineupKey);

        // Players not already in this line's reserves
        const availablePlayers = roster.filter(p => !currentReserves.includes(p.id));

        if (availablePlayers.length === 0) {
            modalBody.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-weight: 600;">Kaikki pelaajat on jo lisätty varamiehiksi tähän kentälliseen.</div>';
            modalEl.classList.add('active');
            return;
        }

        // Sort: IN first, then MAYBE, then UNANSWERED, then OUT; then by jersey number
        const sorted = [...availablePlayers].sort((a, b) => {
            const attA = attendeesMap[a.id] || { status: 'unanswered' };
            const attB = attendeesMap[b.id] || { status: 'unanswered' };
            const weight = s => s === 'in' ? 0 : s === 'maybe' ? 1 : s === 'unanswered' ? 2 : 3;
            if (weight(attA.status) !== weight(attB.status)) {
                return weight(attA.status) - weight(attB.status);
            }
            return (a.number || 0) - (b.number || 0);
        });

        sorted.forEach(p => {
            const att = attendeesMap[p.id] || { status: 'unanswered' };
            const item = document.createElement('div');
            item.className = `picker-player-item ${att.status === 'in' ? 'is-in' : att.status === 'out' ? 'is-out' : ''}`;

            const attText = att.status === 'in' ? '🟢 IN' : att.status === 'out' ? '🔴 OUT' : att.status === 'maybe' ? '🟡 EHKÄ' : '⚪ AVOIN';

            item.innerHTML = `
                <div>
                    <strong style="color: #93c5fd; font-size: 1rem;">#${p.number}</strong>
                    <span style="font-weight: 700; margin-left: 6px;">${escapeHtml(p.name)}</span>
                    <span class="player-pos-badge" style="margin-left: 6px;">${p.position || 'H'}</span>
                </div>
                <div>
                    <span class="status-badge-mini ${att.status}">${attText}</span>
                </div>
            `;

            item.addEventListener('click', () => {
                addLineupReserve(lineupKey, p.id);
                scheduleRender({ cards: true, roster: true });
                modalEl.classList.remove('active');
                showToast(`#${p.number} ${p.name} lisätty varamieheksi (${lineName}) 🪑`);
            });

            modalBody.appendChild(item);
        });

        modalEl.classList.add('active');
    }

    function openPlayerAssignTargetPicker(player) {
        if (!modalEl) return;
        modalTitle.textContent = `Sijoita: #${player.number} ${player.name}`;
        modalBody.innerHTML = '';

        const groups = [
            { title: '🏒 1.–4. Kentät', configs: SIMPLE_LINEUP_CONFIGS.filter(c => c.group === 'standard') },
            { title: '⚡ Ylivoima & Alivoima (YV / AV)', configs: SIMPLE_LINEUP_CONFIGS.filter(c => c.group === 'yv_av') },
            { title: '🔥 6 vs 5 (Ilman MV)', configs: SIMPLE_LINEUP_CONFIGS.filter(c => c.group === '6v5') }
        ];

        groups.forEach(grp => {
            const grpHeader = document.createElement('div');
            grpHeader.style.cssText = 'font-weight: 800; font-size: 0.85rem; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.05em; margin: 12px 0 6px; padding-left: 2px;';
            grpHeader.textContent = grp.title;
            modalBody.appendChild(grpHeader);

            grp.configs.forEach(cfg => {
                const lineBox = document.createElement('div');
                lineBox.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 8px 10px; margin-bottom: 8px;';

                const title = document.createElement('div');
                title.style.cssText = 'font-weight: 700; font-size: 0.85rem; color: #fff; margin-bottom: 6px;';
                title.textContent = (cfg.icon || '🏒') + ' ' + cfg.name;
                lineBox.appendChild(title);

                const btnGrid = document.createElement('div');
                btnGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;';

                const is6v5 = cfg.group === '6v5';
                const positions = is6v5 ? POS_ORDER_6V5 : POS_ORDER;

                positions.forEach(pos => {
                    const currentOccupant = lineups[cfg.id] ? (lineups[cfg.id][pos] || (pos === '6P' ? lineups[cfg.id]['VM'] : '')) : '';
                    const occPlayer = roster.find(p => p.id === currentOccupant);
                    const isThisPlayer = currentOccupant === player.id;
                    const displayPos = (pos === 'KH') ? 'C' : pos;
                    const btn = document.createElement('button');
                    btn.className = 'btn-header';
                    btn.style.cssText = `justify-content: center; padding: 6px 2px; font-size: 0.75rem; text-align: center; ${isThisPlayer ? 'background: rgba(16,185,129,0.25); border-color: #10b981; color: #34d399;' : ''}`;
                    btn.innerHTML = `<strong>${displayPos}</strong><br><span style="font-size:0.62rem; color:${isThisPlayer ? '#34d399' : 'var(--text-muted)'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px; display:inline-block;">${occPlayer ? '#' + occPlayer.number + ' ' + occPlayer.name.split(' ')[0] : 'Vapaa'}</span>`;

                    btn.addEventListener('click', () => {
                        if (!lineups[cfg.id]) {
                            lineups[cfg.id] = is6v5 
                                ? { VP: '', OP: '', VH: '', KH: '', OH: '', '6P': '', VM: '' }
                                : { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };
                        }
                        lineups[cfg.id][pos] = player.id;
                        if (pos === '6P') lineups[cfg.id]['VM'] = player.id;
                        saveState();
                        scheduleRender({ cards: true, roster: true });
                        modalEl.classList.remove('active');
                        showToast(`Sijoitettu: ${cfg.shortName} - ${displayPos} 👍`);
                    });

                    btnGrid.appendChild(btn);
                });

                lineBox.appendChild(btnGrid);

                // Reserve button
                const isAlreadyReserve = getLineupReserves(cfg.id).includes(player.id);
                const reserveBtn = document.createElement('button');
                reserveBtn.className = 'btn-header';
                reserveBtn.style.cssText = `width: 100%; margin-top: 6px; justify-content: center; padding: 6px; font-size: 0.75rem; ${isAlreadyReserve ? 'background: rgba(59, 130, 246, 0.25); border-color: #3b82f6; color: #93c5fd;' : 'background: rgba(255,255,255,0.05); color: #cbd5e1;'}`;
                reserveBtn.innerHTML = isAlreadyReserve ? `✓ On jo varamiehenä (${cfg.shortName})` : `🪑 Lisää varamieheksi (${cfg.shortName})`;
                reserveBtn.addEventListener('click', () => {
                    if (!isAlreadyReserve) {
                        addLineupReserve(cfg.id, player.id);
                        saveState();
                        scheduleRender({ cards: true, roster: true });
                        showToast(`#${player.number} ${player.name} asetettu varamieheksi (${cfg.shortName}) 🪑`);
                    } else {
                        removeLineupReserve(cfg.id, player.id);
                        saveState();
                        scheduleRender({ cards: true, roster: true });
                        showToast(`#${player.number} ${player.name} poistettu varamiehistä (${cfg.shortName})`);
                    }
                    modalEl.classList.remove('active');
                });
                lineBox.appendChild(reserveBtn);

                modalBody.appendChild(lineBox);
            });
        });

        modalEl.classList.add('active');
    }

    function matchPlayerFromRoster(rawText) {
        if (!rawText || !rawText.trim()) return null;
        const text = rawText.trim();
        const numMatch = text.match(/#(\d+)/);
        if (numMatch) {
            const num = parseInt(numMatch[1], 10);
            const found = roster.find(p => p.number === num);
            if (found) return found;
        }
        const cleanName = text.replace(/^[#\d\.\-\*/\s]+/, '').replace(/\(.*?\)/, '').trim().toLowerCase();
        if (cleanName.length >= 2) {
            const found = roster.find(p => {
                const pName = (p.name || '').toLowerCase();
                return pName && (cleanName.includes(pName) || pName.includes(cleanName) || cleanName.split(' ').some(part => part.length >= 3 && pName.includes(part)));
            });
            if (found) return found;
        }
        return null;
    }

    function findOrAddPlayerToRoster(rawText) {
        if (!rawText || !rawText.trim()) return null;
        const match = matchPlayerFromRoster(rawText);
        if (match) return match;

        const text = rawText.trim();
        const numMatch = text.match(/#(\d+)/);
        const num = numMatch ? parseInt(numMatch[1], 10) : (roster.length + 1);
        const cleanName = text.replace(/^[#\d\.\-\*/\s]+/, '').replace(/\(.*?\)/, '').trim() || `Pelaaja ${num}`;

        const newPlayer = {
            id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: cleanName,
            number: num,
            position: 'H'
        };
        roster.push(newPlayer);
        return newPlayer;
    }

    function parseJinaNimenhuuto(text) {
        const events = [];
        const idRegex = /https:\/\/[^\/]+\/events\/(\d+)/g;
        const ids = [];
        let m;
        while ((m = idRegex.exec(text)) !== null) {
            if (!ids.includes(m[1])) ids.push(m[1]);
        }

        ids.forEach(id => {
            const startPos = text.indexOf('/events/' + id);
            if (startPos === -1) return;
            
            const nextPositions = ids.filter(oId => oId !== id)
                .map(oId => text.indexOf('/events/' + oId, startPos + 30))
                .filter(p => p > startPos);
            const endPos = nextPositions.length > 0 ? Math.min(...nextPositions) : text.length;
            const chunk = text.substring(Math.max(0, startPos - 120), endPos);

            let title = 'Tapahtuma';
            const titleMatches = [...chunk.matchAll(/\[([^\]]+)\]\(https:\/\/[^\/]+\/events\/\d+\)/g)];
            for (const tm of titleMatches) {
                const cand = tm[1].trim();
                if (!cand.match(/^(TAMMI|HELMI|MAALIS|HUHTI|TOUKO|KESÄ|HEINÄ|ELO|SYYS|LOKA|MARRAS|JOULU)\s+\d+/i) && cand !== 'IN OUT' && !cand.match(/^In\s+\d+/i) && !cand.match(/^Out\s+\d+/i)) {
                    title = cand.replace(/&middot;/g, '·').trim();
                    break;
                }
            }

            let dateStr = '';
            let location = '';
            const dateMatch = chunk.match(/####\s*\[(.*?)\]/);
            if (dateMatch) {
                const fullDate = dateMatch[1].trim();
                if (fullDate.includes(' klo ')) {
                    const parts = fullDate.split(/(?=klo\s*\d+)/i);
                    const timeAndRest = parts[1] || '';
                    const timeMatch = timeAndRest.match(/(klo\s*\d+:\d+)(.*)/i);
                    if (timeMatch) {
                        dateStr = (parts[0] + timeMatch[1]).trim();
                        location = timeMatch[2].replace(/^[\s,]+/, '').trim();
                    } else {
                        dateStr = fullDate;
                    }
                } else {
                    dateStr = fullDate;
                }
            }

            const inPlayerNames = [];
            const outPlayerNames = [];

            const tabOutMatch = chunk.match(/\*\s*\[Out\s*(\d+)\][^\n]*\n+([\s\S]*?)(?=\n\[|\n\*|\n####|$)/i);
            if (tabOutMatch) {
                const outCount = parseInt(tabOutMatch[1], 10);
                const afterTabs = tabOutMatch[2].trim();
                const paragraphs = afterTabs.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

                const inCountMatch = chunk.match(/\*\s*\[In\s*(\d+)\]/i);
                const inCount = inCountMatch ? parseInt(inCountMatch[1], 10) : 0;

                if (inCount > 0 && paragraphs.length > 0) {
                    const inRaw = paragraphs[0];
                    if (!inRaw.includes('Ei ketään')) {
                        const pList = inRaw.split(/(?=#\d+)/).map(s => s.trim()).filter(s => s.startsWith('#'));
                        inPlayerNames.push(...pList);
                    }
                }

                if (outCount > 0) {
                    const outIndex = (inCount > 0) ? 1 : 0;
                    if (paragraphs.length > outIndex) {
                        const outRaw = paragraphs[outIndex];
                        if (!outRaw.includes('Ei ketään')) {
                            const pList = outRaw.split(/(?=#\d+)/).map(s => s.trim()).filter(s => s.startsWith('#'));
                            outPlayerNames.push(...pList);
                        }
                    }
                }
            }

            const attendees = {};
            roster.forEach(p => { attendees[p.id] = { status: 'unanswered', reason: '' }; });
            inPlayerNames.forEach(raw => {
                const p = findOrAddPlayerToRoster(raw);
                if (p) attendees[p.id] = { status: 'in', reason: '' };
            });
            outPlayerNames.forEach(raw => {
                const p = findOrAddPlayerToRoster(raw);
                if (p) attendees[p.id] = { status: 'out', reason: '' };
            });

            events.push({
                id: 'event_' + id,
                title: title,
                date: dateStr,
                location: location,
                source: 'nimenhuuto',
                attendees: attendees
            });
        });

        return events;
    }

    function parseNimenhuutoEventsHtml(htmlText) {
        const events = [];
        const eventBlocks = htmlText.split(/id=["'](event_\d+)["']/g);
        for (let i = 1; i < eventBlocks.length; i += 2) {
            const id = eventBlocks[i];
            const block = eventBlocks[i + 1] || '';

            let title = 'Tapahtuma';
            const titleMatch = block.match(/class=["']event-title-link["'][^>]*>([\s\S]*?)<\/a>/i);
            if (titleMatch) {
                title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/&middot;/g, '·').replace(/\s+/g, ' ').trim();
            }

            let dateStr = '';
            const dateMatch = block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
            if (dateMatch) {
                dateStr = dateMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            }

            let location = '';
            const locMatch = block.match(/<\/h4>[\s\r\n]*<div>(.*?)<\/div>/i);
            if (locMatch) {
                location = locMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            }

            const inPlayerNames = [];
            const inMatch = block.match(/id=["']tab_in_\d+["'][^>]*>([\s\S]*?)<\/div>/i);
            if (inMatch) {
                const pMatches = inMatch[1].matchAll(/class=["']player_label[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi);
                for (const pm of pMatches) {
                    const pText = pm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                    if (pText) inPlayerNames.push(pText);
                }
            }

            const outPlayerNames = [];
            const outMatch = block.match(/id=["']tab_out_\d+["'][^>]*>([\s\S]*?)<\/div>/i);
            if (outMatch) {
                const pMatches = outMatch[1].matchAll(/class=["']player_label[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi);
                for (const pm of pMatches) {
                    const pText = pm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                    if (pText) outPlayerNames.push(pText);
                }
            }

            const attendees = {};
            roster.forEach(p => { attendees[p.id] = { status: 'unanswered', reason: '' }; });
            inPlayerNames.forEach(raw => {
                const m = matchPlayerFromRoster(raw);
                if (m) attendees[m.id] = { status: 'in', reason: '' };
            });
            outPlayerNames.forEach(raw => {
                const m = matchPlayerFromRoster(raw);
                if (m) attendees[m.id] = { status: 'out', reason: '' };
            });

            events.push({
                id: id,
                title: title,
                date: dateStr,
                location: location,
                source: 'nimenhuuto',
                attendees: attendees
            });
        }
        return events;
    }

    async function fetchAndSyncEvents(targetUrl, isSilent = false) {
        const curTeam = teams.find(t => t.id === currentTeamId);
        if (!targetUrl) {
            targetUrl = curTeam ? (curTeam.eventsUrl || curTeam.nimenhuutoUrl || curTeam.myclubUrl || '') : '';
        }

        if (!targetUrl) {
            if (syncUrlInput && syncUrlInput.value.trim()) {
                targetUrl = syncUrlInput.value.trim();
            } else {
                if (!isSilent) openSyncModal();
                return false;
            }
        }

        targetUrl = targetUrl.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }
        if (!targetUrl.includes('/events') && targetUrl.includes('nimenhuuto.com')) {
            targetUrl = targetUrl.replace(/\/+$/, '') + '/events';
        }

        if (!isSilent) {
            showToast('Haetaan tapahtumia verkosta... ⏳');
        }

        // Multi-engine proxies: Jina Reader as #1, AllOrigins as #2, CORS proxy as #3
        const proxyUrls = [
            `https://r.jina.ai/${targetUrl}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            targetUrl
        ];

        let rawText = '';
        let ok = false;
        let isJina = false;

        for (const pUrl of proxyUrls) {
            try {
                const isAllOrigins = pUrl.includes('allorigins.win/get');
                const isJinaReader = pUrl.includes('r.jina.ai');
                const headers = isJinaReader ? { 'Accept': 'text/html' } : {};

                const res = await fetch(pUrl, { cache: 'no-cache', headers: headers });
                if (res.ok) {
                    if (isAllOrigins) {
                        const json = await res.json();
                        if (json && json.contents) {
                            rawText = json.contents;
                            ok = true;
                            break;
                        }
                    } else {
                        const txt = await res.text();
                        if (txt && (txt.includes('event_') || txt.includes('events/') || txt.includes('Nimenhuuto') || txt.includes('myClub') || txt.includes('VCALENDAR'))) {
                            rawText = txt;
                            ok = true;
                            if (isJinaReader) isJina = true;
                            break;
                        }
                    }
                }
            } catch (e) {
                console.warn('Proxy attempt error:', pUrl, e);
            }
        }

        if (!ok || !rawText) {
            if (!isSilent) {
                showToast('Verkkohaku ei onnistunut. Voit liittää osallistujat tekstinä!');
                openSyncModal();
            }
            return false;
        }

        let events = [];
        if (isJina) {
            events = parseJinaNimenhuuto(rawText);
        } else {
            events = parseNimenhuutoEventsHtml(rawText);
            if (events.length === 0) events = parseJinaNimenhuuto(rawText);
        }

        if (events.length === 0) {
            if (!isSilent) {
                showToast('Sivulta ei löytynyt tapahtumia.');
                openSyncModal();
            }
            return false;
        }

        teamEvents = events;
        if (!teamEvents.some(e => e.id === activeEventId)) {
            activeEventId = teamEvents[0]?.id || null;
        }
        if (curTeam) {
            curTeam.eventsUrl = targetUrl;
            curTeam.nimenhuutoUrl = targetUrl;
        }

        try {
            localStorage.setItem('salibandy_events_last_fetch_' + currentTeamId, Date.now().toString());
            localStorage.setItem('salibandy_events_' + currentTeamId, JSON.stringify(teamEvents));
            if (activeEventId) {
                localStorage.setItem('salibandy_active_event_id_' + currentTeamId, JSON.stringify(activeEventId));
            }
            localStorage.setItem('salibandy_teams_v1', JSON.stringify(teams));
        } catch(e){}

        saveState();
        scheduleRender({ eventBar: true, cards: true, roster: true });
        closeSyncModal();
        if (!isSilent) {
            showToast(`Haettu ${teamEvents.length} tapahtumaa onnistuneesti! 🎉`);
        }
        return true;
    }

    function parsePastedAttendance(rawText) {
        if (!rawText || !rawText.trim()) return;
        const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
        const attendees = {};
        roster.forEach(p => { attendees[p.id] = { status: 'unanswered', reason: '' }; });

        let currentStatus = 'in';

        lines.forEach(line => {
            const lp = line.toLowerCase();
            if (lp.startsWith('in') || lp.startsWith('mukana') || lp.startsWith('kyllä') || lp.startsWith('osallistuu')) {
                currentStatus = 'in';
            } else if (lp.startsWith('out') || lp.startsWith('poissa') || lp.startsWith('ei')) {
                currentStatus = 'out';
            } else if (lp.startsWith('ehkä') || lp.startsWith('maybe')) {
                currentStatus = 'maybe';
            }

            // Extract numbers or names
            const pMatches = line.matchAll(/#?(\d+)\s*([^,\n;\t]+)?/g);
            for (const pm of pMatches) {
                const num = parseInt(pm[1], 10);
                const p = roster.find(r => r.number === num);
                if (p) {
                    attendees[p.id] = { status: currentStatus, reason: '' };
                }
            }
        });

        let curEvent = teamEvents.find(e => e.id === activeEventId);
        if (!curEvent) {
            curEvent = {
                id: 'ev_' + Date.now(),
                title: 'Ottelu / Tapahtuma',
                date: 'Tänään',
                location: '',
                attendees: attendees
            };
            teamEvents.unshift(curEvent);
            activeEventId = curEvent.id;
        } else {
            curEvent.attendees = attendees;
        }

        saveState();
        scheduleRender({ eventBar: true, cards: true, roster: true });
        closeSyncModal();
        showToast('Liitetyt osallistujat tallennettu! 👍');
    }

    function copyWhatsAppText() {
        const curTeam = teams.find(t => t.id === currentTeamId) || teams[0];
        const curEvent = teamEvents.find(e => e.id === activeEventId);
        const attendeesMap = curEvent ? (curEvent.attendees || {}) : {};

        let text = `🏑 ${curTeam.name} - KOKOONPANO\n`;
        if (curEvent) {
            text += `📅 ${curEvent.title} (${curEvent.date || ''})\n\n`;
        } else {
            text += '\n';
        }

        // 1. Tasakentälliset (1.–4. Kentät)
        text += `━━━ TASAKENTÄLLISET ━━━\n`;
        ['1', '2', '3', '4'].forEach(id => {
            const cfg = SIMPLE_LINEUP_CONFIGS.find(c => c.id === id);
            if (!cfg) return;
            const line = lineups[id] || {};
            const reserves = getLineupReserves(id);
            const hasPlayers = POS_ORDER.some(p => Boolean(line[p])) || reserves.length > 0;
            if (!hasPlayers && (id === '3' || id === '4')) return;

            text += `*🏒 ${cfg.name}:*\n`;
            POS_ORDER.forEach(pos => {
                const pId = line[pos];
                const p = roster.find(r => r.id === pId);
                const displayPos = (pos === 'KH') ? 'C' : pos;
                if (p) {
                    const att = attendeesMap[p.id] || { status: 'unanswered' };
                    const attIcon = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '';
                    text += `${displayPos}: #${p.number} ${p.name} ${attIcon}\n`;
                } else {
                    text += `${displayPos}: -\n`;
                }
            });
            if (reserves.length > 0) {
                const reserveNames = reserves.map(pId => {
                    const p = roster.find(r => r.id === pId);
                    if (!p) return null;
                    const att = attendeesMap[p.id] || { status: 'unanswered' };
                    const attIcon = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '';
                    return `#${p.number} ${p.name} ${attIcon}`.trim();
                }).filter(Boolean);
                if (reserveNames.length > 0) {
                    text += `Varalla: ${reserveNames.join(', ')}\n`;
                }
            }
            text += '\n';
        });

        // 2. Ylivoima & Alivoima (vain jos pelaajia asetettu)
        const yvAvConfigs = SIMPLE_LINEUP_CONFIGS.filter(c => c.group === 'yv_av');
        const anyYvAv = yvAvConfigs.some(cfg => {
            const line = lineups[cfg.id] || {};
            return POS_ORDER.some(p => Boolean(line[p])) || getLineupReserves(cfg.id).length > 0;
        });

        if (anyYvAv) {
            text += `━━━ YLIVOIMA & ALIVOIMA ━━━\n`;
            yvAvConfigs.forEach(cfg => {
                const line = lineups[cfg.id] || {};
                const reserves = getLineupReserves(cfg.id);
                const hasPlayers = POS_ORDER.some(p => Boolean(line[p])) || reserves.length > 0;
                if (!hasPlayers) return;

                const icon = cfg.id.startsWith('yv') ? '⚡' : '🛡️';
                text += `*${icon} ${cfg.name}:*\n`;
                POS_ORDER.forEach(pos => {
                    const pId = line[pos];
                    const p = roster.find(r => r.id === pId);
                    const displayPos = (pos === 'KH') ? 'C' : pos;
                    if (p) {
                        const att = attendeesMap[p.id] || { status: 'unanswered' };
                        const attIcon = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '';
                        text += `${displayPos}: #${p.number} ${p.name} ${attIcon}\n`;
                    } else {
                        text += `${displayPos}: -\n`;
                    }
                });
                if (reserves.length > 0) {
                    const reserveNames = reserves.map(pId => {
                        const p = roster.find(r => r.id === pId);
                        if (!p) return null;
                        const att = attendeesMap[p.id] || { status: 'unanswered' };
                        const attIcon = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '';
                        return `#${p.number} ${p.name} ${attIcon}`.trim();
                    }).filter(Boolean);
                    if (reserveNames.length > 0) {
                        text += `Varalla: ${reserveNames.join(', ')}\n`;
                    }
                }
                text += '\n';
            });
        }

        // 3. 6 vs 5 (vain jos pelaajia asetettu)
        const sixConfigs = SIMPLE_LINEUP_CONFIGS.filter(c => c.group === '6v5');
        const anySix = sixConfigs.some(cfg => {
            const line = lineups[cfg.id] || {};
            return POS_ORDER_6V5.some(p => Boolean(line[p] || (p === '6P' && line['VM']))) || getLineupReserves(cfg.id).length > 0;
        });

        if (anySix) {
            text += `━━━ 6 vs 5 (ILMAN MAALIVAHTIA) ━━━\n`;
            sixConfigs.forEach(cfg => {
                const line = lineups[cfg.id] || {};
                const reserves = getLineupReserves(cfg.id);
                const hasPlayers = POS_ORDER_6V5.some(p => Boolean(line[p] || (p === '6P' && line['VM']))) || reserves.length > 0;
                if (!hasPlayers) return;

                text += `*🔥 ${cfg.name}:*\n`;
                POS_ORDER_6V5.forEach(pos => {
                    const pId = line[pos] || (pos === '6P' ? line['VM'] : '');
                    const p = roster.find(r => r.id === pId);
                    const displayPos = (pos === 'KH') ? 'C' : pos;
                    if (p) {
                        const att = attendeesMap[p.id] || { status: 'unanswered' };
                        const attIcon = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '';
                        text += `${displayPos}: #${p.number} ${p.name} ${attIcon}\n`;
                    } else {
                        text += `${displayPos}: -\n`;
                    }
                });
                if (reserves.length > 0) {
                    const reserveNames = reserves.map(pId => {
                        const p = roster.find(r => r.id === pId);
                        if (!p) return null;
                        const att = attendeesMap[p.id] || { status: 'unanswered' };
                        const attIcon = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '';
                        return `#${p.number} ${p.name} ${attIcon}`.trim();
                    }).filter(Boolean);
                    if (reserveNames.length > 0) {
                        text += `Varalla: ${reserveNames.join(', ')}\n`;
                    }
                }
                text += '\n';
            });
        }

        navigator.clipboard.writeText(text.trim()).then(() => {
            showToast('📋 Kokoonpanoteksti kopioitu leikepöydälle!');
        }).catch(() => {
            showToast('Kopiointi epäonnistui');
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    function openSyncModal() {
        if (!syncModal) return;
        const curTeam = teams.find(t => t.id === currentTeamId);
        if (syncUrlInput) {
            syncUrlInput.value = (curTeam && (curTeam.eventsUrl || curTeam.nimenhuutoUrl)) ? (curTeam.eventsUrl || curTeam.nimenhuutoUrl) : '';
            if (!syncUrlInput.value && (curTeam?.name || '').toLowerCase().includes('sekta')) {
                syncUrlInput.value = 'https://sekta.nimenhuuto.com/events';
            }
        }
        syncModal.classList.add('active');
    }

    function closeSyncModal() {
        syncModal?.classList.remove('active');
    }

    // ============================================================
    // SIMPLE AI & GEMINI PLAYER IMPORT ENGINE (v59.0)
    // ============================================================
    let simpleParsedPlayers = [];
    let simpleActiveAiTab = 'text';

    function openSimpleAiModal() {
        const modal = document.getElementById('simple-ai-modal');
        if (!modal) return;
        const textInput = document.getElementById('simple-ai-text-input');
        const fileInput = document.getElementById('simple-photo-file-input');
        const keyInput = document.getElementById('simple-gemini-key-input');
        const statusEl = document.getElementById('simple-ai-status');
        const previewEl = document.getElementById('simple-ai-preview');

        if (textInput) textInput.value = '';
        if (fileInput) fileInput.value = '';
        if (statusEl) statusEl.style.display = 'none';
        if (previewEl) previewEl.style.display = 'none';

        const savedKey = (localStorage.getItem('salibandy_gemini_api_key') || '').trim();
        if (keyInput) keyInput.value = savedKey;

        switchSimpleAiTab(simpleActiveAiTab || 'text');
        modal.classList.add('active');
    }

    function closeSimpleAiModal() {
        document.getElementById('simple-ai-modal')?.classList.remove('active');
    }

    function switchSimpleAiTab(tab) {
        simpleActiveAiTab = tab;
        const textBtn = document.getElementById('simple-ai-tab-text-btn');
        const photoBtn = document.getElementById('simple-ai-tab-photo-btn');
        const textPanel = document.getElementById('simple-ai-text-panel');
        const photoPanel = document.getElementById('simple-ai-photo-panel');
        const previewEl = document.getElementById('simple-ai-preview');
        const statusEl = document.getElementById('simple-ai-status');

        if (previewEl) previewEl.style.display = 'none';
        if (statusEl) statusEl.style.display = 'none';

        if (tab === 'text') {
            textBtn?.classList.add('highlight');
            photoBtn?.classList.remove('highlight');
            if (textPanel) textPanel.style.display = 'block';
            if (photoPanel) photoPanel.style.display = 'none';
        } else {
            photoBtn?.classList.add('highlight');
            textBtn?.classList.remove('highlight');
            if (textPanel) textPanel.style.display = 'none';
            if (photoPanel) photoPanel.style.display = 'block';
        }
    }

    function smartParseTextToPlayers(text) {
        if (!text || typeof text !== 'string') return [];
        
        let cleaned = text
            .replace(/In\s*\(\d+\)\s*:/gi, '\n')
            .replace(/Out\s*\(\d+\)\s*:/gi, '\n')
            .replace(/Mukana\s*\(\d+\)\s*:/gi, '\n')
            .replace(/Poissa\s*\(\d+\)\s*:/gi, '\n')
            .replace(/Ehkä\s*\(\d+\)\s*:/gi, '\n')
            .replace(/Avoin\s*\(\d+\)\s*:/gi, '\n');

        const rawChunks = cleaned.split(/[\r\n,;•]+/);
        const results = [];
        const seenNames = new Set();
        let idCounter = 1;

        rawChunks.forEach(chunk => {
            let trimmed = chunk.trim();
            if (!trimmed || trimmed.length < 2) return;

            if (/^(in|out|ehkä|poissa|peli|ottelu|treenit|kokoonpano|pelaajat|valkku|valmentaja)\b/i.test(trimmed) && !trimmed.includes('#') && !/\d/.test(trimmed)) {
                return;
            }

            let pos = 'H';
            const low = trimmed.toLowerCase();
            if (/\b(mv|maalivahti|veskari|gk|goalie)\b/i.test(low)) pos = 'MV';
            else if (/\b(vp|vasen\s*pakki|vasen\s*puolustaja|ld)\b/i.test(low)) pos = 'VP';
            else if (/\b(op|oikea\s*pakki|oikea\s*puolustaja|rd)\b/i.test(low)) pos = 'OP';
            else if (/\b(p|pakki|puolustaja|def)\b/i.test(low)) pos = 'P';
            else if (/\b(vh|vasen\s*h|vasen\s*laita|lw)\b/i.test(low)) pos = 'VH';
            else if (/\b(kh|sentteri|keskushyökkääjä|c|center)\b/i.test(low)) pos = 'KH';
            else if (/\b(oh|oikea\s*h|oikea\s*laita|rw)\b/i.test(low)) pos = 'OH';
            else if (/\b(h|hyökkääjä|fwd)\b/i.test(low)) pos = 'H';

            let stripped = trimmed
                .replace(/\((mv|maalivahti|veskari|vp|op|p|vh|kh|oh|h|pakki|hyökkääjä|c)\)/gi, '')
                .replace(/\[(mv|maalivahti|veskari|vp|op|p|vh|kh|oh|h|pakki|hyökkääjä|c)\]/gi, '')
                .replace(/\b(mv|maalivahti|veskari|vp|op|vh|kh|oh)\b/gi, '')
                .trim();

            let number = null;
            let name = stripped;

            const numStartMatch = stripped.match(/^#?(\d{1,2})[\.\s\-:]+(.+)$/);
            const numParenMatch = stripped.match(/^(.+?)\s*\(#?(\d{1,2})\)$/);
            const numEndMatch = stripped.match(/^(.+?)[,\s#\-]+(\d{1,2})$/);

            if (numStartMatch) {
                number = parseInt(numStartMatch[1], 10);
                name = numStartMatch[2];
            } else if (numParenMatch) {
                name = numParenMatch[1];
                number = parseInt(numParenMatch[2], 10);
            } else if (numEndMatch && !/^\d+$/.test(numEndMatch[1])) {
                name = numEndMatch[1];
                number = parseInt(numEndMatch[2], 10);
            }

            name = name.replace(/^[#\d\s\.\-:]+/, '').replace(/[#\(\)\[\]]/g, '').trim();
            if (name.length < 2) return;
            if (/^(in|out|ehkä|poissa)\b/i.test(name)) return;

            const nameKey = name.toLowerCase();
            if (!seenNames.has(nameKey)) {
                seenNames.add(nameKey);
                results.push({
                    id: 'ai_' + Date.now() + '_' + (idCounter++),
                    name: name,
                    number: (number !== null && number >= 1 && number <= 99) ? number : 1,
                    position: pos
                });
            }
        });
        return results;
    }

    async function callGeminiVisionSimple(file, apiKey) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64Data = reader.result;
                    const mimeType = file.type || 'image/jpeg';
                    const cleanBase64 = String(base64Data).replace(/^data:[^;]+;base64,/, '');

                    const prompt = `You are an expert floorball and sports assistant. Analyze this image (roster, whiteboard, match sheet, paper, lineup, screenshot).
Extract all player names, jersey numbers, and positions.
Map positions to: "MV" (goalkeeper), "VP" (left defender), "OP" (right defender), "P" (defender), "VH" (left wing), "KH" (center), "OH" (right wing), "H" (forward). If position is unknown, default to "H".
Output MUST be a valid, raw JSON array of objects with NO markdown formatting, NO code blocks, like:
[{"number": 23, "name": "Matias V", "position": "MV"}]
If no number is visible, provide a number or null. Only return the JSON array.`;

                    const body = {
                        contents: [{
                            parts: [
                                { text: prompt },
                                { inline_data: { mime_type: mimeType, data: cleanBase64 } }
                            ]
                        }],
                        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
                    };

                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });

                    if (!response.ok) {
                        const errBody = await response.text();
                        throw new Error(`Gemini API error: ${errBody}`);
                    }

                    const json = await response.json();
                    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
                    const parsed = JSON.parse(cleanJson);
                    resolve(parsed);
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    async function processSimplePhotoFile(file) {
        if (!file) return;
        const statusEl = document.getElementById('simple-ai-status');
        const statusText = document.getElementById('simple-ai-status-text');
        const previewEl = document.getElementById('simple-ai-preview');
        const textPanel = document.getElementById('simple-ai-text-panel');
        const photoPanel = document.getElementById('simple-ai-photo-panel');

        if (textPanel) textPanel.style.display = 'none';
        if (photoPanel) photoPanel.style.display = 'none';
        if (previewEl) previewEl.style.display = 'none';
        if (statusEl) statusEl.style.display = 'flex';

        const apiKey = (localStorage.getItem('salibandy_gemini_api_key') || '').trim();

        if (apiKey) {
            if (statusText) statusText.textContent = '🤖 Gemini Vision AI analysoi kuvaa...';
            try {
                const geminiPlayers = await callGeminiVisionSimple(file, apiKey);
                if (Array.isArray(geminiPlayers) && geminiPlayers.length > 0) {
                    simpleParsedPlayers = geminiPlayers.map((p, idx) => ({
                        id: 'gemini_' + Date.now() + '_' + idx,
                        name: p.name || 'Pelaaja',
                        number: (p.number !== null && !isNaN(p.number)) ? parseInt(p.number, 10) : (idx + 1),
                        position: (p.position || 'H').toUpperCase()
                    }));
                    if (statusEl) statusEl.style.display = 'none';
                    renderSimpleOcrResults();
                    if (previewEl) previewEl.style.display = 'block';
                    showToast(`Gemini AI tunnisti ${simpleParsedPlayers.length} pelaajaa valokuvasta! ✨`);
                    return;
                }
            } catch (err) {
                console.warn('Gemini Vision API error:', err);
                showToast('Gemini API -virhe, käytetään varajärjestelmää.', 'warning');
            }
        }

        if (statusText) statusText.textContent = 'Valmistellaan optista lukijaa...';

        function loadTesseractOnDemand() {
            return new Promise((resolve, reject) => {
                if (typeof window !== 'undefined' && window.Tesseract) return resolve(window.Tesseract);
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js';
                script.onload = () => resolve(window.Tesseract);
                script.onerror = () => reject(new Error('Tesseract offline'));
                document.head.appendChild(script);
            });
        }

        loadTesseractOnDemand().then(tesseract => {
            if (statusText) statusText.textContent = 'Luetaan tekstiä kuvasta...';
            return tesseract.recognize(file, 'fin+eng', {
                logger: m => {
                    if (m.status === 'recognizing text' && statusText) {
                        const pct = Math.round((m.progress || 0) * 100);
                        statusText.textContent = `Tunnistetaan tekstiä... ${pct}%`;
                    }
                }
            }).then(result => {
                const text = result?.data?.text || '';
                const parsed = smartParseTextToPlayers(text);
                simpleParsedPlayers = parsed.length > 0 ? parsed : [
                    { id: 'ocr_1', name: 'Pelaaja 1', number: 10, position: 'H' }
                ];
                if (statusEl) statusEl.style.display = 'none';
                renderSimpleOcrResults();
                if (previewEl) previewEl.style.display = 'block';
                if (!apiKey) showToast('Vinkki: Lisää Gemini API-avain huipputarkkaan valokuvantunnistukseen!');
            }).catch(err => {
                console.warn('OCR error:', err);
                simpleParsedPlayers = [{ id: 'ocr_1', name: 'Pelaaja 1', number: 1, position: 'H' }];
                if (statusEl) statusEl.style.display = 'none';
                renderSimpleOcrResults();
                if (previewEl) previewEl.style.display = 'block';
            });
        }).catch(err => {
            console.warn('Could not load OCR:', err);
            simpleParsedPlayers = [{ id: 'ocr_1', name: 'Pelaaja 1', number: 1, position: 'H' }];
            if (statusEl) statusEl.style.display = 'none';
            renderSimpleOcrResults();
            if (previewEl) previewEl.style.display = 'block';
        });
    }

    function renderSimpleOcrResults() {
        const listEl = document.getElementById('simple-ocr-results-list');
        const badge = document.getElementById('simple-ocr-count');
        if (badge) badge.textContent = simpleParsedPlayers.length;
        if (!listEl) return;
        listEl.innerHTML = '';

        if (simpleParsedPlayers.length === 0) {
            listEl.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-secondary);">Ei pelaajia. Voit lisätä pelaajan "+ Lisää rivi".</div>';
            return;
        }

        simpleParsedPlayers.forEach((item, index) => {
            const row = document.createElement('div');
            row.style.cssText = 'display: grid; grid-template-columns: 50px 1fr 90px 30px; gap: 6px; align-items: center; background: #0b1120; border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 6px;';
            const pos = (item.position || 'H').toUpperCase();
            row.innerHTML = `
                <input type="number" value="${item.number !== undefined && item.number !== null ? item.number : ''}" class="simple-ocr-num" data-index="${index}" placeholder="#" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; text-align: center; padding: 4px;">
                <input type="text" value="${escapeHtml(item.name || '')}" class="simple-ocr-name" data-index="${index}" placeholder="Nimi" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; padding: 4px 6px;">
                <select class="simple-ocr-pos" data-index="${index}" style="background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #fff; padding: 4px; font-size: 0.8rem;">
                    <option value="MV" ${pos === 'MV' ? 'selected' : ''}>🟢 MV</option>
                    <option value="VP" ${pos === 'VP' ? 'selected' : ''}>🛡️ VP</option>
                    <option value="OP" ${pos === 'OP' ? 'selected' : ''}>🛡️ OP</option>
                    <option value="P" ${pos === 'P' ? 'selected' : ''}>🛡️ P</option>
                    <option value="VH" ${pos === 'VH' ? 'selected' : ''}>⚡ VH</option>
                    <option value="KH" ${pos === 'KH' ? 'selected' : ''}>⚡ KH</option>
                    <option value="OH" ${pos === 'OH' ? 'selected' : ''}>⚡ OH</option>
                    <option value="H" ${pos === 'H' ? 'selected' : ''}>⚡ H</option>
                </select>
                <button type="button" class="simple-ocr-del" data-index="${index}" style="background: none; border: none; color: #ef4444; font-size: 1rem; cursor: pointer;">🗑️</button>
            `;
            listEl.appendChild(row);
        });

        listEl.querySelectorAll('.simple-ocr-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                if (!isNaN(idx) && idx >= 0 && idx < simpleParsedPlayers.length) {
                    simpleParsedPlayers.splice(idx, 1);
                    renderSimpleOcrResults();
                }
            });
        });
    }

    function init() {
        loadState();

        // Initial render – wait one RAF tick so browser has laid out DOM
        requestAnimationFrame(() => {
            renderTeamHeader();
            renderEventBar();
            renderLineupTabs();
            renderLineupCards();
            renderRosterList();
        });

        // Team change
        teamSelect?.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === '__new_team__') {
                teamSelect.value = currentTeamId;
                const name = prompt('Anna uuden joukkueen nimi:');
                if (name && name.trim()) {
                    saveToStorageLocalOnly();
                    const newTeamId = 'team_' + Date.now();
                    const cleanName = name.trim();
                    const newTeam = {
                        id: newTeamId,
                        name: cleanName,
                        logo: '🏑',
                        primaryColor: '#2563eb',
                        shareId: 'st_' + newTeamId
                    };
                    teams.push(newTeam);
                    currentTeamId = newTeamId;
                    roster = [];
                    lineups = {};
                    SIMPLE_LINEUP_CONFIGS.forEach(cfg => {
                        lineups[cfg.id] = cfg.group === '6v5'
                            ? { VP: '', OP: '', VH: '', KH: '', OH: '', '6P': '' }
                            : { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };
                    });
                    lineupReserves = {};
                    teamEvents = [
                        {
                            id: 'event_' + Date.now(),
                            title: 'Seuraava Ottelu',
                            date: 'Klo 19:00',
                            location: 'Kotiareena',
                            attendees: {}
                        }
                    ];
                    activeEventId = teamEvents[0].id;
                    saveState();
                    renderAll();
                    showToast(`Uusi joukkue '${cleanName}' luotu! 🎉`);
                }
                return;
            }

            // Save previous team state first
            saveToStorageLocalOnly();

            currentTeamId = val;
            localStorage.setItem('salibandy_active_team_id', JSON.stringify(currentTeamId));
            loadState(currentTeamId);
            renderAll();

            const selectedTeam = teams.find(t => t.id === currentTeamId);
            if (selectedTeam && selectedTeam.shareId) {
                listenToSharedTeamFirestore(selectedTeam.shareId);
            } else if (unsubscribeSharedTeam) {
                unsubscribeSharedTeam();
                unsubscribeSharedTeam = null;
            }
            showToast('Joukkue vaihdettu: ' + (selectedTeam?.name || ''));
        });

        document.getElementById('btn-simple-delete-team')?.addEventListener('click', deleteActiveTeam);

        // Event change
        eventSelect?.addEventListener('change', (e) => {
            activeEventId = e.target.value;
            saveState();
            scheduleRender({ eventBar: true, cards: true, roster: true });
        });

        // Open Sync Modal
        btnOpenSyncModal?.addEventListener('click', () => {
            const curTeam = teams.find(t => t.id === currentTeamId);
            const url = curTeam ? (curTeam.eventsUrl || curTeam.nimenhuutoUrl) : '';
            if (url) {
                fetchAndSyncEvents(url);
            } else {
                openSyncModal();
            }
        });

        btnOpenSyncSettings?.addEventListener('click', openSyncModal);
        btnCloseSyncModal?.addEventListener('click', closeSyncModal);

        btnDoFetchEvents?.addEventListener('click', () => {
            const url = syncUrlInput ? syncUrlInput.value.trim() : '';
            if (!url) {
                showToast('Syötä ensin osoite!');
                return;
            }
            fetchAndSyncEvents(url);
        });

        btnDoPasteAttendance?.addEventListener('click', () => {
            const text = inputPasteAttendance ? inputPasteAttendance.value.trim() : '';
            if (!text) {
                showToast('Liitä ensin tekstiä laatikkoon!');
                return;
            }
            parsePastedAttendance(text);
        });

        // Copy WhatsApp
        document.getElementById('btn-copy-wa')?.addEventListener('click', copyWhatsAppText);

        // Refresh button – force full re-render in next RAF tick
        document.getElementById('btn-simple-refresh')?.addEventListener('click', () => {
            loadState();
            renderAll();
            showToast('Päivitetty!');
        });

        // Close modal
        modalClose?.addEventListener('click', () => {
            modalEl.classList.remove('active');
        });
        modalEl?.addEventListener('click', (e) => {
            if (e.target === modalEl) modalEl.classList.remove('active');
        });
        syncModal?.addEventListener('click', (e) => {
            if (e.target === syncModal) closeSyncModal();
        });

        // Cloud & Share Modals
        btnSimpleCloud?.addEventListener('click', openCloudModal);
        btnSimpleShare?.addEventListener('click', openShareModal);
        btnCloseCloudModal?.addEventListener('click', () => cloudModal?.classList.remove('active'));
        cloudModal?.addEventListener('click', (e) => {
            if (e.target === cloudModal) cloudModal.classList.remove('active');
        });
        btnCloseShareModal?.addEventListener('click', () => shareModal?.classList.remove('active'));
        shareModal?.addEventListener('click', (e) => {
            if (e.target === shareModal) shareModal.classList.remove('active');
        });

        // Add Player to Roster
        document.getElementById('btn-simple-add-player')?.addEventListener('click', () => {
            openPlayerEditModal(null);
        });

        // Roster Density Toggle (2-sarake vs 1-sarake)
        document.getElementById('btn-toggle-roster-density')?.addEventListener('click', () => {
            rosterDensity = (rosterDensity === '2col') ? '1col' : '2col';
            try { localStorage.setItem('salibandy_roster_density', rosterDensity); } catch(e) {}
            updateRosterDensityUI();
            showToast(rosterDensity === '2col' ? '2 sarakkeen tiivis pelaajalista ▦' : '1 sarakkeen pelaajalista ▤');
        });

        // Roster Filter Pills
        document.querySelectorAll('.roster-filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                activeRosterFilter = pill.dataset.filter || 'all';
                renderRosterList();
            });
        });

        // Roster Search Input
        document.getElementById('roster-search-input')?.addEventListener('input', (e) => {
            rosterSearchQuery = (e.target.value || '').trim();
            renderRosterList();
        });

        // AI & Gemini Player Import (v59.0)
        document.getElementById('btn-simple-ai-import')?.addEventListener('click', openSimpleAiModal);
        document.getElementById('btn-close-simple-ai-modal')?.addEventListener('click', closeSimpleAiModal);
        document.getElementById('simple-ai-modal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('simple-ai-modal')) closeSimpleAiModal();
        });

        document.getElementById('simple-ai-tab-text-btn')?.addEventListener('click', () => switchSimpleAiTab('text'));
        document.getElementById('simple-ai-tab-photo-btn')?.addEventListener('click', () => switchSimpleAiTab('photo'));

        document.getElementById('btn-simple-save-gemini-key')?.addEventListener('click', () => {
            const input = document.getElementById('simple-gemini-key-input');
            const val = (input?.value || '').trim();
            if (val) {
                localStorage.setItem('salibandy_gemini_api_key', val);
                showToast('Gemini API-avain tallennettu! ✨');
            } else {
                localStorage.removeItem('salibandy_gemini_api_key');
                showToast('Gemini API-avain poistettu.');
            }
        });

        document.getElementById('btn-simple-parse-text')?.addEventListener('click', () => {
            const text = (document.getElementById('simple-ai-text-input')?.value || '').trim();
            if (!text) {
                showToast('Liitä ensin pelaajalistaa kenttään!');
                return;
            }
            const parsed = smartParseTextToPlayers(text);
            if (parsed.length === 0) {
                showToast('Tekstistä ei löytynyt tunnistettavia pelaajia.');
                return;
            }
            simpleParsedPlayers = parsed;
            const textPanel = document.getElementById('simple-ai-text-panel');
            const photoPanel = document.getElementById('simple-ai-photo-panel');
            const previewEl = document.getElementById('simple-ai-preview');
            if (textPanel) textPanel.style.display = 'none';
            if (photoPanel) photoPanel.style.display = 'none';
            renderSimpleOcrResults();
            if (previewEl) previewEl.style.display = 'block';
            showToast(`${parsed.length} pelaajaa tunnistettu tekstistä! 🎉`);
        });

        document.getElementById('btn-simple-add-ocr-row')?.addEventListener('click', () => {
            simpleParsedPlayers.push({
                id: 'ocr_manual_' + Date.now(),
                name: '',
                number: 1,
                position: 'H'
            });
            renderSimpleOcrResults();
        });

        document.getElementById('simple-photo-file-input')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) processSimplePhotoFile(file);
        });

        document.getElementById('btn-simple-reselect-ai')?.addEventListener('click', () => {
            const previewEl = document.getElementById('simple-ai-preview');
            const statusEl = document.getElementById('simple-ai-status');
            const textPanel = document.getElementById('simple-ai-text-panel');
            const photoPanel = document.getElementById('simple-ai-photo-panel');

            if (previewEl) previewEl.style.display = 'none';
            if (statusEl) statusEl.style.display = 'none';
            if (simpleActiveAiTab === 'text') {
                if (textPanel) textPanel.style.display = 'block';
                if (photoPanel) photoPanel.style.display = 'none';
            } else {
                if (textPanel) textPanel.style.display = 'none';
                if (photoPanel) photoPanel.style.display = 'block';
            }
        });

        document.getElementById('btn-simple-confirm-ai')?.addEventListener('click', () => {
            const listEl = document.getElementById('simple-ocr-results-list');
            if (!listEl) return;
            const rows = listEl.children;
            let addedCount = 0;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const numInput = row.querySelector('.simple-ocr-num');
                const nameInput = row.querySelector('.simple-ocr-name');
                const posInput = row.querySelector('.simple-ocr-pos');

                const number = numInput ? parseInt(numInput.value, 10) : NaN;
                const name = nameInput ? nameInput.value.trim() : '';
                const position = posInput ? posInput.value : 'H';

                if (name && !isNaN(number)) {
                    const existingIdx = roster.findIndex(p => p.number === number && p.name.toLowerCase() === name.toLowerCase());
                    if (existingIdx >= 0) {
                        roster[existingIdx].position = position;
                        roster[existingIdx].positions = [position];
                    } else {
                        roster.push({
                            id: 'p_ai_' + Date.now() + '_' + (addedCount++),
                            name: name,
                            number: number,
                            position: position,
                            positions: [position],
                            isLoan: false,
                            notes: 'Tuotu tekoälyllä ✨'
                        });
                    }
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                saveState();
                renderRosterList();
                updatePlayerCounters();
                closeSimpleAiModal();
                showToast(`${addedCount} pelaajaa tallennettu rinkiin! 🎉`);
            } else {
                showToast('Ei lisättäviä pelaajia. Tarkista että jokaisella on nimi ja numero.');
            }
        });

        // Initialize Firebase Auth & Real-Time Sync
        initSimpleFirebase();

        // ── MOBILE FOREGROUND RESUME FIX ─────────────────────────────────
        // On foldable/tablet: when app comes back from background, browser
        // often shows a black/stale paint. Force full re-render on resume.
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Two-tick delay: first tick resets any GPU state, second
                // tick re-paints actual content.
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        loadState();
                        renderAll();
                    });
                });
            }
        });

        // Also handle BFCache restore (back/forward navigation on mobile)
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        loadState();
                        renderAll();
                    });
                });
            }
        });

        // Handle screen fold/unfold – Z Fold 5 fires 'resize' when unfolding
        let _lastWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            const newWidth = window.innerWidth;
            if (Math.abs(newWidth - _lastWidth) > 100) {
                // Major width change = fold/unfold event
                _lastWidth = newWidth;
                requestAnimationFrame(() => {
                    renderLineupCards();
                    renderRosterList();
                });
            }
        });

        console.log('⚡ Kentälliset Simple v2.0 Initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
