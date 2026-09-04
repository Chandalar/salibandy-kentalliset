/**
 * KENTÄLLISET SIMPLE (Kevytversio) – Engine v1.1
 * Shared localStorage & Cloud Firestore sync with the main app
 * High-speed live attendees integration & one-tap lineup builder
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
    let activeLineupTab = '1';
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

    // Default line positions
    const POS_ORDER = ['MV', 'VP', 'OP', 'VH', 'KH', 'OH'];
    const POS_LABELS = {
        'MV': 'Maalivahti',
        'VP': 'Vasen pakki',
        'OP': 'Oikea pakki',
        'VH': 'Vasen hyökkääjä',
        'KH': 'Sentteri',
        'OH': 'Oikea hyökkääjä'
    };

    function showToast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.style.display = 'flex';
        clearTimeout(toastEl._timer);
        toastEl._timer = setTimeout(() => {
            toastEl.style.display = 'none';
        }, 2400);
    }

    function loadState() {
        try {
            const rawTeams = localStorage.getItem('salibandy_teams_v1');
            teams = rawTeams ? JSON.parse(rawTeams) : [
                { id: 'default_team', name: 'Edustusjoukkue', logo: '🦁', primaryColor: '#2563eb' }
            ];

            const rawActiveTeam = localStorage.getItem('salibandy_active_team_id');
            currentTeamId = rawActiveTeam ? JSON.parse(rawActiveTeam) : teams[0].id;
            if (!teams.some(t => t.id === currentTeamId)) currentTeamId = teams[0].id;

            const rawRoster = localStorage.getItem('salibandy_roster_' + currentTeamId);
            roster = rawRoster ? JSON.parse(rawRoster) : [];

            const rawLineups = localStorage.getItem('salibandy_lineups_' + currentTeamId);
            lineups = rawLineups ? JSON.parse(rawLineups) : {
                '1': { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' },
                '2': { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' },
                '3': { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' },
                'yv': { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' },
                'av': { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' }
            };

            const rawConfigs = localStorage.getItem('salibandy_lineup_configs_' + currentTeamId);
            lineupConfigs = rawConfigs ? JSON.parse(rawConfigs) : [
                { id: '1', name: '1. Kenttä', type: 'standard' },
                { id: '2', name: '2. Kenttä', type: 'standard' },
                { id: '3', name: '3. Kenttä', type: 'standard' },
                { id: 'yv', name: 'Ylivoima (YV)', type: 'standard' },
                { id: 'av', name: 'Alivoima (AV)', type: 'standard' }
            ];

            const rawEvents = localStorage.getItem('salibandy_events_' + currentTeamId);
            teamEvents = rawEvents ? JSON.parse(rawEvents) : [];

            const rawActiveEvent = localStorage.getItem('salibandy_active_event_id_' + currentTeamId);
            activeEventId = rawActiveEvent ? JSON.parse(rawActiveEvent) : (teamEvents[0]?.id || null);

        } catch (e) {
            console.error('Error loading state:', e);
        }
    }

    function saveState() {
        try {
            localStorage.setItem('salibandy_teams_v1', JSON.stringify(teams));
            localStorage.setItem('salibandy_active_team_id', JSON.stringify(currentTeamId));
            localStorage.setItem('salibandy_roster_' + currentTeamId, JSON.stringify(roster));
            localStorage.setItem('salibandy_lineups_' + currentTeamId, JSON.stringify(lineups));
            localStorage.setItem('salibandy_lineup_configs_' + currentTeamId, JSON.stringify(lineupConfigs));
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
            opt.textContent = (t.logo ? t.logo + ' ' : '') + t.name;
            if (t.id === currentTeamId) opt.selected = true;
            teamSelect.appendChild(opt);
        });

        const curTeam = teams.find(t => t.id === currentTeamId) || teams[0];
        if (teamLogoBadge) {
            teamLogoBadge.textContent = curTeam.logo || '🏑';
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
                renderRosterList();
            });
        });
    }

    function renderLineupTabs() {
        if (!lineupNavBar) return;
        lineupNavBar.innerHTML = '';

        // Tab: Kaikki kentät
        const allTab = document.createElement('button');
        allTab.className = `lineup-tab ${activeLineupTab === 'all' ? 'active' : ''}`;
        allTab.textContent = '📋 Kaikki kentät';
        allTab.addEventListener('click', () => {
            activeLineupTab = 'all';
            renderLineupTabs();
            renderLineupCards();
        });
        lineupNavBar.appendChild(allTab);

        lineupConfigs.forEach(cfg => {
            if (cfg.type === 'drawing_only') return;
            const btn = document.createElement('button');
            btn.className = `lineup-tab ${activeLineupTab === cfg.id ? 'active' : ''}`;
            btn.textContent = cfg.name;
            btn.addEventListener('click', () => {
                activeLineupTab = cfg.id;
                renderLineupTabs();
                renderLineupCards();
            });
            lineupNavBar.appendChild(btn);
        });
    }

    function renderLineupCards() {
        if (!lineupCardContainer) return;
        lineupCardContainer.innerHTML = '';

        const configsToShow = activeLineupTab === 'all'
            ? lineupConfigs.filter(c => c.type !== 'drawing_only')
            : lineupConfigs.filter(c => c.id === activeLineupTab);

        const curEvent = teamEvents.find(e => e.id === activeEventId);
        const attendeesMap = curEvent ? (curEvent.attendees || {}) : {};

        configsToShow.forEach(cfg => {
            const card = document.createElement('div');
            card.className = 'lineup-card';

            const lineSlots = lineups[cfg.id] || { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };

            let slotsHtml = '';
            POS_ORDER.forEach(pos => {
                const playerId = lineSlots[pos];
                const player = roster.find(p => p.id === playerId);
                const att = player ? (attendeesMap[player.id] || { status: 'unanswered' }) : null;

                let posClass = 'pos-h';
                if (pos === 'MV') posClass = 'pos-mv';
                else if (pos === 'VP' || pos === 'OP') posClass = 'pos-p';

                if (player) {
                    let badgeClass = att.status;
                    let badgeText = att.status === 'in' ? '🟢 IN' : att.status === 'out' ? '🔴 OUT' : att.status === 'maybe' ? '🟡 EHKÄ' : '⚪ AVOIN';

                    slotsHtml += `
                        <div class="slot-item" data-lineup="${cfg.id}" data-pos="${pos}">
                            <div class="slot-left">
                                <span class="pos-tag ${posClass}">${pos}</span>
                                <div class="slot-player-info">
                                    <div class="slot-player-name">#${player.number} ${escapeHtml(player.name)}</div>
                                </div>
                            </div>
                            <div class="slot-right">
                                <span class="status-badge-mini ${badgeClass}">${badgeText}</span>
                                <button class="btn-slot-remove" data-action="clear-slot" data-lineup="${cfg.id}" data-pos="${pos}" title="Poista kentällisestä">✕</button>
                            </div>
                        </div>
                    `;
                } else {
                    slotsHtml += `
                        <div class="slot-item is-empty" data-lineup="${cfg.id}" data-pos="${pos}">
                            <div class="slot-left">
                                <span class="pos-tag ${posClass}">${pos}</span>
                                <div class="slot-player-info">
                                    <div class="slot-player-empty-label">+ Valitse ${POS_LABELS[pos]}</div>
                                </div>
                            </div>
                            <div class="slot-right">
                                <span style="color: var(--text-muted); font-size: 0.8rem;">Tyhjä</span>
                            </div>
                        </div>
                    `;
                }
            });

            card.innerHTML = `
                <div class="lineup-card-header">
                    <div class="lineup-title">🏒 ${cfg.name}</div>
                    <div class="lineup-actions">
                        <button class="btn-lineup-action" data-action="clear-lineup" data-lineup="${cfg.id}">Tyhjennä</button>
                    </div>
                </div>
                <div class="slots-container">
                    ${slotsHtml}
                </div>
            `;

            // Bind click events on slots
            card.querySelectorAll('.slot-item').forEach(slot => {
                slot.addEventListener('click', (e) => {
                    if (e.target.dataset.action === 'clear-slot') {
                        const lk = e.target.dataset.lineup;
                        const p = e.target.dataset.pos;
                        lineups[lk][p] = '';
                        saveState();
                        renderLineupCards();
                        renderRosterList();
                        showToast('Pelaaja poistettu kentällisestä');
                        return;
                    }

                    const lk = slot.dataset.lineup;
                    const pos = slot.dataset.pos;
                    openSlotPicker(lk, pos);
                });
            });

            card.querySelector('[data-action="clear-lineup"]')?.addEventListener('click', (e) => {
                const lk = e.target.dataset.lineup;
                POS_ORDER.forEach(p => lineups[lk][p] = '');
                saveState();
                renderLineupCards();
                renderRosterList();
                showToast(`${cfg.name} tyhjennetty`);
            });

            lineupCardContainer.appendChild(card);
        });
    }

    function renderRosterList() {
        if (!rosterListContainer) return;
        rosterListContainer.innerHTML = '';

        const curEvent = teamEvents.find(e => e.id === activeEventId);
        const attendeesMap = curEvent ? (curEvent.attendees || {}) : {};

        // Find assignments
        const assignments = {};
        Object.keys(lineups).forEach(lk => {
            const line = lineups[lk] || {};
            const cfg = lineupConfigs.find(c => c.id === lk);
            const lineName = cfg ? cfg.name : lk;
            POS_ORDER.forEach(pos => {
                const pId = line[pos];
                if (pId) {
                    if (!assignments[pId]) assignments[pId] = [];
                    assignments[pId].push(`${lineName.replace('Kenttä', 'K.')}: ${pos}`);
                }
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
            return a.number - b.number;
        });

        if (filtered.length === 0) {
            rosterListContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Ei pelaajia valitulla suodattimella.</div>';
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
                assignHtml = `<span class="player-assigned-badge">${pAssigns.join(', ')}</span>`;
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
        renderLineupCards();
        renderRosterList();
        showToast(`Status päivitetty: ${nextStatus.toUpperCase()}`);
    }

    function openSlotPicker(lineupKey, pos) {
        if (!modalEl) return;
        const cfg = lineupConfigs.find(c => c.id === lineupKey);
        const lineName = cfg ? cfg.name : lineupKey;

        modalTitle.textContent = `Valitse ${POS_LABELS[pos]} (${lineName})`;
        modalBody.innerHTML = '';

        const curEvent = teamEvents.find(e => e.id === activeEventId);
        const attendeesMap = curEvent ? (curEvent.attendees || {}) : {};

        // Sort players: matching position first, then IN status
        const sorted = [...roster].sort((a, b) => {
            const attA = attendeesMap[a.id] || { status: 'unanswered' };
            const attB = attendeesMap[b.id] || { status: 'unanswered' };
            const isMatchA = (pos === 'MV' && a.position === 'MV') || (pos.includes('P') && a.position === 'P') || (pos.includes('H') && a.position === 'H');
            const isMatchB = (pos === 'MV' && b.position === 'MV') || (pos.includes('P') && b.position === 'P') || (pos.includes('H') && b.position === 'H');
            if (isMatchA !== isMatchB) return isMatchB ? 1 : -1;
            const weight = s => s === 'in' ? 0 : s === 'maybe' ? 1 : s === 'unanswered' ? 2 : 3;
            return weight(attA.status) - weight(attB.status);
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
                lineups[lineupKey][pos] = p.id;
                saveState();
                renderLineupCards();
                renderRosterList();
                modalEl.classList.remove('active');
                showToast(`#${p.number} ${p.name} asetettu paikkaan ${lineName} - ${pos} 👍`);
            });

            modalBody.appendChild(item);
        });

        modalEl.classList.add('active');
    }

    function openPlayerAssignTargetPicker(player) {
        if (!modalEl) return;
        modalTitle.textContent = `Sijoita: #${player.number} ${player.name}`;
        modalBody.innerHTML = '';

        lineupConfigs.forEach(cfg => {
            if (cfg.type === 'drawing_only') return;
            const lineBox = document.createElement('div');
            lineBox.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px; margin-bottom: 6px;';

            const title = document.createElement('div');
            title.style.cssText = 'font-weight: 800; font-size: 0.9rem; color: #fff; margin-bottom: 8px;';
            title.textContent = '🏒 ' + cfg.name;
            lineBox.appendChild(title);

            const btnGrid = document.createElement('div');
            btnGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;';

            POS_ORDER.forEach(pos => {
                const currentOccupant = lineups[cfg.id] ? lineups[cfg.id][pos] : '';
                const occPlayer = roster.find(p => p.id === currentOccupant);
                const btn = document.createElement('button');
                btn.className = 'btn-header';
                btn.style.cssText = 'justify-content: center; padding: 8px 4px; font-size: 0.78rem; text-align: center;';
                btn.innerHTML = `<strong>${pos}</strong><br><span style="font-size:0.65rem; color:var(--text-muted);">${occPlayer ? '#' + occPlayer.number : 'Vapaa'}</span>`;

                btn.addEventListener('click', () => {
                    if (!lineups[cfg.id]) lineups[cfg.id] = { MV: '', VP: '', OP: '', VH: '', KH: '', OH: '' };
                    lineups[cfg.id][pos] = player.id;
                    saveState();
                    renderLineupCards();
                    renderRosterList();
                    modalEl.classList.remove('active');
                    showToast(`Sijoitettu: ${cfg.name} - ${pos} 👍`);
                });

                btnGrid.appendChild(btn);
            });

            lineBox.appendChild(btnGrid);
            modalBody.appendChild(lineBox);
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
            targetUrl = prompt('Syötä joukkueesi Nimenhuuto- tai myClub-osoite\n(Esim: https://omatiimi.nimenhuuto.com/events):');
            if (!targetUrl || !targetUrl.trim()) return;
        }

        targetUrl = targetUrl.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }
        if (!targetUrl.includes('/events') && targetUrl.includes('nimenhuuto.com')) {
            targetUrl = targetUrl.replace(/\/+$/, '') + '/events';
        }

        showToast('Haetaan tapahtumia verkosta... ⏳');

        const proxyUrls = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            targetUrl
        ];

        let rawText = '';
        let ok = false;
        for (const pUrl of proxyUrls) {
            try {
                const res = await fetch(pUrl, { cache: 'no-cache' });
                if (res.ok) {
                    rawText = await res.text();
                    if (rawText && (rawText.includes('event_') || rawText.includes('Nimenhuuto') || rawText.includes('myClub') || rawText.includes('BEGIN:VCALENDAR'))) {
                        ok = true;
                        break;
                    }
                }
            } catch (e) {
                console.warn('Proxy failed:', pUrl, e);
            }
        }

        if (!ok || !rawText) {
            showToast('Tapahtumien haku epäonnistui. Tarkista osoite!');
            return;
        }

        const events = parseNimenhuutoEventsHtml(rawText);
        if (events.length === 0) {
            showToast('Sivulta ei löytynyt tapahtumia.');
            return;
        }

        teamEvents = events;
        activeEventId = teamEvents[0]?.id || null;
        if (curTeam) {
            curTeam.eventsUrl = targetUrl;
            curTeam.nimenhuutoUrl = targetUrl;
        }

        saveState();
        renderEventBar();
        renderLineupCards();
        renderRosterList();
        showToast(`Haettu ${teamEvents.length} tapahtumaa onnistuneesti! 🎉`);
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

        lineupConfigs.forEach(cfg => {
            if (cfg.type === 'drawing_only') return;
            text += `*🏒 ${cfg.name}:*\n`;
            const line = lineups[cfg.id] || {};
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
            text += '\n';
        });

        navigator.clipboard.writeText(text).then(() => {
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

    function init() {
        loadState();
        renderTeamHeader();
        renderEventBar();
        renderLineupTabs();
        renderLineupCards();
        renderRosterList();

        // Team change
        teamSelect?.addEventListener('change', (e) => {
            currentTeamId = e.target.value;
            loadState();
            renderTeamHeader();
            renderEventBar();
            renderLineupTabs();
            renderLineupCards();
            renderRosterList();
            showToast('Joukkue vaihdettu');
        });

        // Event change
        eventSelect?.addEventListener('change', (e) => {
            activeEventId = e.target.value;
            saveState();
            renderEventBar();
            renderLineupCards();
            renderRosterList();
        });

        // Fetch events from web
        document.getElementById('btn-simple-fetch-events')?.addEventListener('click', () => {
            fetchAndSyncEvents();
        });

        // Config events URL
        document.getElementById('btn-simple-config-events')?.addEventListener('click', () => {
            const curTeam = teams.find(t => t.id === currentTeamId);
            const oldUrl = curTeam ? (curTeam.eventsUrl || curTeam.nimenhuutoUrl || '') : '';
            const newUrl = prompt('Aseta joukkueen Nimenhuuto- tai myClub-osoite:\n(Esim. https://omatiimi.nimenhuuto.com/events)', oldUrl);
            if (newUrl !== null) {
                if (curTeam) {
                    curTeam.eventsUrl = newUrl.trim();
                    curTeam.nimenhuutoUrl = newUrl.trim();
                }
                saveState();
                showToast('Osoite tallennettu! Voit nyt painaa 🔄 Hae.');
            }
        });

        // Copy button
        document.getElementById('btn-copy-wa')?.addEventListener('click', copyWhatsAppText);

        // Refresh button
        document.getElementById('btn-simple-refresh')?.addEventListener('click', () => {
            loadState();
            renderTeamHeader();
            renderEventBar();
            renderLineupCards();
            renderRosterList();
            showToast('Päivitetty!');
        });

        // Close modal
        modalClose?.addEventListener('click', () => {
            modalEl.classList.remove('active');
        });
        modalEl?.addEventListener('click', (e) => {
            if (e.target === modalEl) modalEl.classList.remove('active');
        });

        console.log('⚡ Kentälliset Simple v1.1 Initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
