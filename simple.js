/**
 * KENTÄLLISET SIMPLE (Kevytversio) – Engine v2.0
 * Multi-engine Nimenhuuto & myClub fetching (Jina Reader, AllOrigins, iCal)
 * High-speed live attendees integration & responsive multi-column lineup builder
 */

(function() {
    'use strict';

    // State
    let teams = [];
    let currentTeamId = 'default_team';
    let roster = [];
    let lineups = {};
    let lineupConfigs = [];
    let teamEvents = [];
    let activeEventId = null;
    let lineupReserves = {}; // Map of lineupKey -> array of playerIds
    let activeLineupTab = 'all'; // Default to 'all' so multiple lines are visible at once!
    let activeRosterFilter = 'all';

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
        'KH': 'Sentteri',
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

    function renderAll() {
        scheduleRender({ header: true, eventBar: true, tabs: true, cards: true, roster: true });
    }

    function loadState() {
        try {
            const rawTeams = localStorage.getItem('salibandy_teams_v1');
            teams = rawTeams ? JSON.parse(rawTeams) : [
                { id: 'default_team', name: 'SekTa', logo: '🏑', primaryColor: '#2563eb' }
            ];

            // Clean any base64 image data that was accidentally saved as team name or id
            let teamsCleaned = false;
            teams.forEach(t => {
                if (!t.name || t.name.startsWith('data:') || t.name.length > 40) {
                    t.name = 'SekTa';
                    teamsCleaned = true;
                }
                if (t.id && (t.id.startsWith('data:') || t.id.length > 50)) {
                    t.id = 'team_sekta';
                    teamsCleaned = true;
                }
            });
            if (teamsCleaned) {
                localStorage.setItem('salibandy_teams_v1', JSON.stringify(teams));
            }

            const rawActiveTeam = localStorage.getItem('salibandy_active_team_id');
            currentTeamId = rawActiveTeam ? JSON.parse(rawActiveTeam) : teams[0].id;
            if (!teams.some(t => t.id === currentTeamId) || (typeof currentTeamId === 'string' && currentTeamId.startsWith('data:'))) {
                currentTeamId = teams[0].id;
            }

            const curTeam = teams.find(t => t.id === currentTeamId);
            // Default Sekta events URL if team name matches
            if (curTeam && !curTeam.eventsUrl && !curTeam.nimenhuutoUrl) {
                if ((curTeam.name || '').toLowerCase().includes('sekta')) {
                    curTeam.eventsUrl = 'https://sekta.nimenhuuto.com/events';
                    curTeam.nimenhuutoUrl = 'https://sekta.nimenhuuto.com/events';
                }
            }

            const rawRoster = localStorage.getItem('salibandy_roster_' + currentTeamId);
            roster = rawRoster ? JSON.parse(rawRoster) : [];

            // If current team roster is empty, try default_team or team_sekta or fallback to DEFAULT_ROSTER
            if (!roster || roster.length === 0) {
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
            if (!isAnyAssigned && roster.length >= 12) {
                lineups['1'] = { MV: 'p_mv23', VP: 'p_19', OP: 'p_20', VH: 'p_11', KH: 'p_42', OH: 'p_64' };
                lineups['2'] = { MV: 'p_mv45', VP: 'p_71', OP: 'p_4', VH: 'p_21', KH: 'p_55', OH: 'p_2' };
                if (!lineupReserves['1']) lineupReserves['1'] = ['p_88'];
            }

            // In Simple mode: ONLY canonical lineups exist (1-4, 2x YV, 2x AV, 2x 6vs5).
            // Drawing boards and tactical custom tabs are excluded.
            lineupConfigs = SIMPLE_LINEUP_CONFIGS;

            const rawEvents = localStorage.getItem('salibandy_events_' + currentTeamId);
            teamEvents = rawEvents ? JSON.parse(rawEvents) : [];
            if (!teamEvents || teamEvents.length === 0) {
                const altEvents1 = localStorage.getItem('salibandy_events_default_team');
                const altEvents2 = localStorage.getItem('salibandy_events_team_sekta');
                if (altEvents1 && JSON.parse(altEvents1).length > 0) {
                    teamEvents = JSON.parse(altEvents1);
                } else if (altEvents2 && JSON.parse(altEvents2).length > 0) {
                    teamEvents = JSON.parse(altEvents2);
                }
            }

            // Default event with attendees if empty
            if (teamEvents.length === 0) {
                const sampleAttendees = {};
                roster.forEach((p, idx) => {
                    const st = idx < 12 ? 'in' : (idx < 17 ? 'out' : 'maybe');
                    sampleAttendees[p.id] = { status: st, reason: '' };
                });
                teamEvents = [
                    {
                        id: 'default_event_1',
                        title: 'SekTa - Seuraava Ottelu',
                        date: 'Klo 19:00',
                        location: 'Kotiareena',
                        attendees: sampleAttendees
                    }
                ];
            }

            const rawActiveEvent = localStorage.getItem('salibandy_active_event_id_' + currentTeamId);
            activeEventId = rawActiveEvent ? JSON.parse(rawActiveEvent) : (teamEvents[0]?.id || null);

        } catch (e) {
            console.error('Error loading state:', e);
        }
    }

    function saveState() {
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

            // Sync with Firebase if available
            if (window.SalibandyFirebase && window.SalibandyFirebase.isReady()) {
                const db = window.SalibandyFirebase.getDb();
                const auth = window.SalibandyFirebase.getAuth();
                const user = auth.currentUser;
                if (user && db) {
                    db.collection('users').doc(user.uid).collection('teams').doc(currentTeamId).set({
                        roster: roster,
                        lineups: lineups,
                        events: teamEvents,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true }).catch(err => console.warn('Cloud save error:', err));
                }
            }
        } catch (e) {
            console.error('Error saving state:', e);
        }
    }

    function renderTeamHeader() {
        if (!teamSelect) return;
        teamSelect.innerHTML = '';
        teams.forEach(t => {
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

        const curTeam = teams.find(t => t.id === currentTeamId) || teams[0];
        if (teamLogoBadge) {
            const isBase64 = (curTeam.logo && (curTeam.logo.startsWith('data:') || curTeam.logo.startsWith('http')));
            if (isBase64) {
                teamLogoBadge.innerHTML = `<img src="${curTeam.logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">`;
            } else {
                teamLogoBadge.textContent = curTeam.logo || '🏑';
            }
        }
    }

    function renderEventBar() {
        if (!eventSelect) return;
        eventSelect.innerHTML = '';

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
            chip.addEventListener('click', () => {
                const f = chip.dataset.filter;
                activeRosterFilter = (activeRosterFilter === f) ? 'all' : f;
                scheduleRender({ roster: true });
            });
        });
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

                let posClass = 'pos-h';
                if (pos === 'MV') posClass = 'pos-mv';
                else if (pos === 'VP' || pos === 'OP') posClass = 'pos-p';
                else if (pos === '6P' || pos === 'VM') posClass = 'pos-6p';

                if (player) {
                    let badgeDot = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '⚪';

                    slotsHtml += `
                        <div class="slot-item" data-lineup="${cfg.id}" data-pos="${pos}">
                            <div class="slot-left">
                                <span class="pos-tag ${posClass}">${pos}</span>
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
                                <span class="pos-tag ${posClass}">${pos}</span>
                                <div class="slot-player-empty-label">+ ${pos}</div>
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

            const reservesSectionHtml = `
                <div class="lineup-reserves-section">
                    <div class="reserves-header-row">
                        <span class="reserves-label">🪑 Varalla${lineReserves.length > 0 ? ` (${lineReserves.length})` : ''}:</span>
                        <button class="btn-add-reserve" data-lineup="${cfg.id}" title="Lisää varamies kentälliseen">+ Varamies</button>
                    </div>
                    <div class="reserves-chips-row">
                        ${reservesChipsHtml || '<span class="reserves-empty-note">Ei varapelaajia</span>'}
                    </div>
                </div>
            `;

            card.innerHTML = `
                <div class="lineup-card-header">
                    <div class="lineup-title">${cfg.icon || '🏒'} ${escapeHtml(cfg.name)}</div>
                    <div class="lineup-actions">
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

            // Bind add reserve
            card.querySelector('.btn-add-reserve')?.addEventListener('click', (e) => {
                const lk = e.currentTarget.dataset.lineup;
                openReservePicker(lk);
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

    function renderRosterList() {
        if (!rosterListContainer) return;
        rosterListContainer.innerHTML = '';

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
                    assignments[pId].push(`${cfg.shortName}: ${pos}`);
                }
            });
            const reserves = getLineupReserves(cfg.id);
            reserves.forEach(pId => {
                if (!assignments[pId]) assignments[pId] = [];
                assignments[pId].push(`${cfg.shortName}: Varamies 🪑`);
            });
        });

        let filtered = roster.filter(p => {
            const att = attendeesMap[p.id] || { status: 'unanswered' };
            if (activeRosterFilter === 'in') return att.status === 'in';
            if (activeRosterFilter === 'out') return att.status === 'out';
            if (activeRosterFilter === 'maybe') return att.status === 'maybe';
            if (activeRosterFilter === 'unanswered') return att.status === 'unanswered';
            if (activeRosterFilter === 'free') return (assignments[p.id] || []).length === 0;
            return true;
        });

        // Sort: IN first, then unassigned, then by number
        filtered.sort((a, b) => {
            const attA = attendeesMap[a.id] || { status: 'unanswered' };
            const attB = attendeesMap[b.id] || { status: 'unanswered' };
            const weight = s => s === 'in' ? 0 : s === 'maybe' ? 1 : s === 'unanswered' ? 2 : 3;
            if (weight(attA.status) !== weight(attB.status)) return weight(attA.status) - weight(attB.status);
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

            const row = document.createElement('div');
            row.className = 'player-row';

            let attBtnClass = att.status;
            let attBtnText = att.status === 'in' ? '🟢 IN' : att.status === 'out' ? '🔴 OUT' : att.status === 'maybe' ? '🟡 EHKÄ' : '⚪ AVOIN';

            let assignHtml = '';
            if (isAssigned) {
                assignHtml = `<div class="player-assigned-badges">${pAssigns.map(a => `<span class="player-assigned-badge">${escapeHtml(a)}</span>`).join('')}</div>`;
            }

            row.innerHTML = `
                <div class="player-row-left">
                    <span class="player-num">#${player.number}</span>
                    <span class="player-name-text">${escapeHtml(player.name)}</span>
                    <span class="player-pos-badge">${player.position || 'H'}</span>
                    ${assignHtml}
                </div>
                <div class="player-row-right">
                    <button class="status-toggle-btn ${attBtnClass}" data-action="toggle-status" data-player-id="${player.id}">${attBtnText}</button>
                    <button class="btn-assign-quick" data-action="assign-player" data-player-id="${player.id}">+ Sijoita</button>
                </div>
            `;

            // Toggle attendance status on click
            row.querySelector('[data-action="toggle-status"]').addEventListener('click', () => {
                togglePlayerStatus(player.id);
            });

            // Assign player
            row.querySelector('[data-action="assign-player"]').addEventListener('click', () => {
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
                if (!lineups[lineupKey]) lineups[lineupKey] = {};
                lineups[lineupKey][pos] = p.id;
                if (pos === '6P') lineups[lineupKey]['VM'] = p.id;
                saveState();
                scheduleRender({ cards: true, roster: true });
                modalEl.classList.remove('active');
                showToast(`#${p.number} ${p.name} asetettu paikkaan ${lineName} - ${posLabel} 👍`);
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
                    const btn = document.createElement('button');
                    btn.className = 'btn-header';
                    btn.style.cssText = `justify-content: center; padding: 6px 2px; font-size: 0.75rem; text-align: center; ${isThisPlayer ? 'background: rgba(16,185,129,0.25); border-color: #10b981; color: #34d399;' : ''}`;
                    btn.innerHTML = `<strong>${pos}</strong><br><span style="font-size:0.62rem; color:${isThisPlayer ? '#34d399' : 'var(--text-muted)'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px; display:inline-block;">${occPlayer ? '#' + occPlayer.number + ' ' + occPlayer.name.split(' ')[0] : 'Vapaa'}</span>`;

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
                        showToast(`Sijoitettu: ${cfg.shortName} - ${pos} 👍`);
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
            const chunk = text.substring(Math.max(0, startPos - 100), endPos);

            let title = 'Tapahtuma';
            const titleMatch = chunk.match(/\[([A-ZÅÄÖa-zåäö0-9\s\.\-·]+)\]\(https:\/\/[^\/]+\/events\/\d+\)/);
            if (titleMatch && !titleMatch[1].startsWith('SYYS') && !titleMatch[1].startsWith('LOKA') && !titleMatch[1].startsWith('MARRAS') && !titleMatch[1].startsWith('TAMMI') && !titleMatch[1].startsWith('HELMI') && !titleMatch[1].startsWith('MAALIS') && !titleMatch[1].startsWith('HUHTI') && !titleMatch[1].startsWith('TOUKO') && !titleMatch[1].startsWith('KESÄ') && !titleMatch[1].startsWith('HEINÄ') && !titleMatch[1].startsWith('ELO') && !titleMatch[1].startsWith('JOULU')) {
                title = titleMatch[1].replace(/&middot;/g, '·').trim();
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

    async function fetchAndSyncEvents(targetUrl) {
        const curTeam = teams.find(t => t.id === currentTeamId);
        if (!targetUrl) {
            targetUrl = curTeam ? (curTeam.eventsUrl || curTeam.nimenhuutoUrl || curTeam.myclubUrl || '') : '';
        }

        if (!targetUrl) {
            if (syncUrlInput && syncUrlInput.value.trim()) {
                targetUrl = syncUrlInput.value.trim();
            } else {
                openSyncModal();
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

        showToast('Haetaan tapahtumia verkosta... ⏳');

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
            showToast('Verkkohaku ei onnistunut. Voit liittää osallistujat tekstinä!');
            openSyncModal();
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
            showToast('Sivulta ei löytynyt tapahtumia.');
            openSyncModal();
            return false;
        }

        teamEvents = events;
        activeEventId = teamEvents[0]?.id || null;
        if (curTeam) {
            curTeam.eventsUrl = targetUrl;
            curTeam.nimenhuutoUrl = targetUrl;
        }

        saveState();
        scheduleRender({ eventBar: true, cards: true, roster: true });
        closeSyncModal();
        showToast(`Haettu ${teamEvents.length} tapahtumaa onnistuneesti! 🎉`);
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
                if (p) {
                    const att = attendeesMap[p.id] || { status: 'unanswered' };
                    const attIcon = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '';
                    text += `${pos}: #${p.number} ${p.name} ${attIcon}\n`;
                } else {
                    text += `${pos}: -\n`;
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
                    if (p) {
                        const att = attendeesMap[p.id] || { status: 'unanswered' };
                        const attIcon = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '';
                        text += `${pos}: #${p.number} ${p.name} ${attIcon}\n`;
                    } else {
                        text += `${pos}: -\n`;
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
                    if (p) {
                        const att = attendeesMap[p.id] || { status: 'unanswered' };
                        const attIcon = att.status === 'in' ? '🟢' : att.status === 'out' ? '🔴' : att.status === 'maybe' ? '🟡' : '';
                        text += `${pos}: #${p.number} ${p.name} ${attIcon}\n`;
                    } else {
                        text += `${pos}: -\n`;
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
            currentTeamId = e.target.value;
            loadState();
            renderAll();
            showToast('Joukkue vaihdettu');
        });

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
