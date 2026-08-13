/**
 * Salibandyn Kentälliset & Taktiikkataulu - Advanced Logic & Interactive Engine
 * Täysi mobiili-kosketus- ja rullaustoimivuus (Touch & Scroll Optimized).
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

    const LINEUP_NAMES = {
        '1': '1. Kenttä',
        '2': '2. Kenttä',
        '3': '3. Kenttä',
        'yv': '⚡ Ylivoima (YV)',
        'av': '🛡️ Alivoima (AV)',
        '6v5': '🔥 6v5 (Ilman MV)',
        'custom': '📐 Taktiikkataulu (Vapaa)'
    };

    // Global State
    let teams = loadFromStorage('salibandy_teams_v1', DEFAULT_TEAMS);
    let currentTeamId = loadFromStorage('salibandy_active_team_id', 'team_edustus');

    let roster = loadFromStorage(`salibandy_roster_${currentTeamId}`, DEFAULT_ROSTER);
    let lineups = loadFromStorage(`salibandy_lineups_${currentTeamId}`, DEFAULT_LINEUPS);
    
    let lineupDrawings = loadFromStorage(`salibandy_drawings_${currentTeamId}`, {
        '1': [], '2': [], '3': [], 'yv': [], 'av': [], '6v5': [], 'custom': []
    });

    let lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});

    let activeLineupKey = '1';
    let activeFilter = 'all';
    let searchQuery = '';
    let drawingTool = 'select'; // 'select', 'pass', 'run', 'shot'
    let isDrawing = false;
    let currentPath = [];
    let labelMode = 'full'; // 'full', 'num', 'name'
    let orientationMode = window.innerWidth <= 600 ? 'vertical' : 'horizontal';

    // DOM Elements
    const teamSelect = document.getElementById('team-select');
    const rosterListContainer = document.getElementById('roster-list-container');
    const rosterSearchInput = document.getElementById('roster-search');
    const filterPillBtns = document.querySelectorAll('.pill-btn');
    const lineupTabBtns = document.querySelectorAll('.tab-btn');
    const activeLineupTitle = document.getElementById('active-lineup-title');
    const lineupSlotsContainer = document.getElementById('lineup-slots-container');
    const courtPlayersLayer = document.getElementById('court-players-layer');
    const floorballCourt = document.getElementById('floorball-court');
    const canvas = document.getElementById('tactic-canvas');
    const ctx = canvas.getContext('2d');
    const toastEl = document.getElementById('toast');

    // Main Sections
    const pitchPanelSection = document.getElementById('pitch-panel-section');
    const lineupPanelSection = document.getElementById('lineup-panel-section');
    const summaryViewPanel = document.getElementById('summary-view-panel');
    const summaryGridContainer = document.getElementById('summary-grid-container');

    // Counters
    const countMvEl = document.getElementById('count-mv');
    const countFieldEl = document.getElementById('count-field');
    const countLoanEl = document.getElementById('count-loan');

    // Modals
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

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function init() {
        renderTeamDropdown();
        applyOrientation();
        setupCanvas();
        bindEvents();
        updateRosterCounters();
        renderRoster();
        renderActiveLineupSlots();
        renderCourtPlayers();
        drawCanvasLines();
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

    function saveState() {
        try {
            localStorage.setItem('salibandy_teams_v1', JSON.stringify(teams));
            localStorage.setItem('salibandy_active_team_id', JSON.stringify(currentTeamId));
            localStorage.setItem(`salibandy_roster_${currentTeamId}`, JSON.stringify(roster));
            localStorage.setItem(`salibandy_lineups_${currentTeamId}`, JSON.stringify(lineups));
            localStorage.setItem(`salibandy_drawings_${currentTeamId}`, JSON.stringify(lineupDrawings));
            localStorage.setItem(`salibandy_positions_${currentTeamId}`, JSON.stringify(lineupCourtPositions));
        } catch (e) {
            console.error('LocalStorage save error', e);
        }
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
        saveState();
        
        roster = loadFromStorage(`salibandy_roster_${currentTeamId}`, DEFAULT_ROSTER);
        lineups = loadFromStorage(`salibandy_lineups_${currentTeamId}`, DEFAULT_LINEUPS);
        lineupDrawings = loadFromStorage(`salibandy_drawings_${currentTeamId}`, {
            '1': [], '2': [], '3': [], 'yv': [], 'av': [], '6v5': [], 'custom': []
        });
        lineupCourtPositions = loadFromStorage(`salibandy_positions_${currentTeamId}`, {});

        updateRosterCounters();
        renderRoster();
        if (activeLineupKey === 'summary') {
            renderSummaryView();
        } else {
            renderActiveLineupSlots();
            renderCourtPlayers();
            drawCanvasLines();
        }
        showToast(`Joukkue vaihdettu!`);
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
                <div class="player-card-info">
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
    // LINEUP SLOTS RENDER & DRAG DROP
    // ==========================================
    function renderActiveLineupSlots() {
        activeLineupTitle.textContent = LINEUP_NAMES[activeLineupKey] || 'Kentällinen';
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
                dropzoneContent = `<span class="slot-placeholder">+ Vedä ${slot.pos} tähän</span>`;
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
        if (!lineups[lineupKey]) lineups[lineupKey] = {};
        
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
        showToast(`Pelaaja sijoitettu paikkaan ${pos}`);
    }

    // ==========================================
    // SUMMARY VIEW
    // ==========================================
    function renderSummaryView() {
        summaryGridContainer.innerHTML = '';
        const lineupKeys = ['1', '2', '3', 'yv', 'av', '6v5'];
        const slotTypes = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];

        lineupKeys.forEach(lKey => {
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
                        <div class="summary-slot-row ${isMv ? 'is-mv' : 'is-field'}" data-lineup="${lKey}" data-pos="${pos}">
                            <span class="summary-pos-tag">${pos}</span>
                            <span class="summary-player-val">#${player.number} ${escapeHtml(player.name)} ${player.isLoan ? '⭐' : ''}</span>
                            <button class="mini-action-btn delete-btn" data-action="remove-summary-slot" data-lineup="${lKey}" data-pos="${pos}">✕</button>
                        </div>
                    `;
                } else {
                    rowsHtml += `
                        <div class="summary-slot-row ${isMv ? 'is-mv' : 'is-field'}" data-lineup="${lKey}" data-pos="${pos}">
                            <span class="summary-pos-tag">${pos}</span>
                            <span class="summary-player-val empty-val">+ Tyhjä (${pos})</span>
                        </div>
                    `;
                }
            });

            card.innerHTML = `
                <div class="summary-card-header">
                    <h3>${LINEUP_NAMES[lKey]}</h3>
                    <button class="btn-xs btn-outline" data-action="clear-summary-lineup" data-lineup="${lKey}">Tyhjennä</button>
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
            const lKey = removeBtn.dataset.lineup;
            const pos = removeBtn.dataset.pos;
            if (lineups[lKey]) lineups[lKey][pos] = '';
            saveState();
            renderSummaryView();
            return;
        }

        const clearBtn = e.target.closest('[data-action="clear-summary-lineup"]');
        if (clearBtn) {
            const lKey = clearBtn.dataset.lineup;
            if (confirm(`Tyhjennetäänkö ${LINEUP_NAMES[lKey]}?`)) {
                lineups[lKey] = { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };
                saveState();
                renderSummaryView();
                showToast(`${LINEUP_NAMES[lKey]} tyhjennetty.`);
            }
        }
    });

    // ==========================================
    // TACTICAL COURT & DYNAMIC LINEUP PLAYERS (COMPACT MOBILE NODES)
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

            let defaultCoords = DEFAULT_POS_COORDS[orientationMode][pos];
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
    }

    function setupNodeTouchDragging(node, coords, posKeyStore) {
        let isDragging = false;

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

            node.style.left = newX + '%';
            node.style.top = newY + '%';
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
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
    // CANVAS TACTICAL DRAWING SYSTEM (TOUCH & MOBILE PAGE SCROLL SAFETY)
    // ==========================================
    function setupCanvas() {
        window.addEventListener('resize', resizeCanvas);
        setTimeout(resizeCanvas, 100);

        canvas.addEventListener('pointerdown', (e) => {
            if (drawingTool === 'select' || activeLineupKey === 'summary') return;
            isDrawing = true;
            e.preventDefault(); // Prevents page from scrolling while drawing arrows!
            canvas.setPointerCapture(e.pointerId);
            const rect = canvas.getBoundingClientRect();
            currentPath = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }];
        });

        canvas.addEventListener('pointermove', (e) => {
            if (!isDrawing) return;
            e.preventDefault(); // Prevents page from scrolling while drawing arrows!
            const rect = canvas.getBoundingClientRect();
            currentPath.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            drawCanvasLines();
            drawPreviewPath(currentPath);
        });

        canvas.addEventListener('pointerup', (e) => {
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
        saveState();
        renderTeamDropdown();
        switchTeam(newTeamId);
        closeModal();
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

        Object.keys(LINEUP_NAMES).forEach(key => {
            const name = LINEUP_NAMES[key];
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
        document.getElementById('btn-new-team').addEventListener('click', () => {
            teamNameInput.value = '';
            teamModal.classList.add('active');
        });

        document.getElementById('btn-close-team-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel-team-modal').addEventListener('click', closeModal);

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

        lineupTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                lineupTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeLineupKey = btn.dataset.lineup;

                if (activeLineupKey === 'summary') {
                    pitchPanelSection.style.display = 'none';
                    lineupPanelSection.style.display = 'none';
                    summaryViewPanel.style.display = 'flex';
                    renderSummaryView();
                } else {
                    pitchPanelSection.style.display = 'flex';
                    lineupPanelSection.style.display = 'flex';
                    summaryViewPanel.style.display = 'none';
                    renderActiveLineupSlots();
                    renderCourtPlayers();
                    setTimeout(resizeCanvas, 60);
                }
            });
        });

        rosterListContainer.addEventListener('click', (e) => {
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
                const pos = removeBtn.dataset.pos;
                lineups[activeLineupKey][pos] = '';
                saveState();
                renderActiveLineupSlots();
                renderCourtPlayers();
            }
        });

        courtPlayersLayer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-action="remove-lineup-player"]');
            if (removeBtn) {
                const pos = removeBtn.dataset.pos;
                if (lineups[activeLineupKey]) lineups[activeLineupKey][pos] = '';
                saveState();
                renderActiveLineupSlots();
                renderCourtPlayers();
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
            if (confirm(`Tyhjennetäänkö ${LINEUP_NAMES[activeLineupKey]} kentältä?`)) {
                lineups[activeLineupKey] = { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };
                lineupDrawings[activeLineupKey] = [];
                saveState();
                renderActiveLineupSlots();
                renderCourtPlayers();
                drawCanvasLines();
                showToast('Kentällinen tyhjennetty.');
            }
        });

        document.getElementById('btn-clear-lineup').addEventListener('click', () => {
            if (confirm(`Tyhjennetäänkö valittu ${LINEUP_NAMES[activeLineupKey]}?`)) {
                lineups[activeLineupKey] = { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };
                lineupDrawings[activeLineupKey] = [];
                saveState();
                renderActiveLineupSlots();
                renderCourtPlayers();
                drawCanvasLines();
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
