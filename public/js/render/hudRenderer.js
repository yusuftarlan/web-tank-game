function getHealthColor(health) {
    if (health < 30) return '#e74c3c';
    if (health < 60) return '#f39c12';
    return '#2ecc71';
}

function clampAmmo(player, maxAmmo) {
    const ammo = Number.isFinite(player.ammo) ? player.ammo : maxAmmo;
    return Math.max(0, Math.min(maxAmmo, ammo));
}

function getPlayerKey(player, index) {
    return player.id || player.username || `player-${index}`;
}

function createAmmoSlot() {
    const slot = document.createElement('span');
    slot.className = 'ammo-slot empty';
    return slot;
}

function createPanel(hudElement, index) {
    const panel = document.createElement('div');
    panel.className = `player-panel corner-${index}`;
    panel.innerHTML = `
        <div class="tank-avatar-container">
            <img class="tank-body-sprite" alt="">
            <img src="/assets/sprites/Gun_01_A.png" class="tank-turret-sprite" alt="">
        </div>

        <div class="panel-info">
            <div class="player-name"></div>
            <div class="health-bar-container">
                <div class="health-bar-fill"></div>
            </div>
            <div class="player-stats">
                <span class="health-text"></span>
                <span class="kills-text"></span>
            </div>
            <div class="ammo-row">
                <div class="ammo-slots"></div>
                <span class="ammo-text"></span>
            </div>
        </div>
    `;

    const bodyImg = panel.querySelector('.tank-body-sprite');
    bodyImg.addEventListener('error', () => {
        bodyImg.src = '/assets/sprites/tank-blue.png';
    });

    hudElement.appendChild(panel);

    return {
        panel,
        bodyImg,
        name: panel.querySelector('.player-name'),
        healthBar: panel.querySelector('.health-bar-fill'),
        healthText: panel.querySelector('.health-text'),
        killsText: panel.querySelector('.kills-text'),
        ammoRow: panel.querySelector('.ammo-row'),
        ammoSlots: panel.querySelector('.ammo-slots'),
        ammoText: panel.querySelector('.ammo-text'),
        ammoSlotElements: [],
        maxAmmo: 0,
        lastSnapshot: ''
    };
}

function ensureAmmoSlots(refs, maxAmmo) {
    if (refs.maxAmmo === maxAmmo) return;

    refs.maxAmmo = maxAmmo;
    refs.ammoSlotElements = Array.from({ length: maxAmmo }, createAmmoSlot);
    refs.ammoSlots.replaceChildren(...refs.ammoSlotElements);
}

function updatePanel(refs, player, index) {
    const health = Math.max(0, Number.isFinite(player.health) ? player.health : 0);
    const score = Number.isFinite(player.score) ? player.score : 0;
    const kills = Math.floor(score / 10) || 0;
    const maxAmmo = Number.isFinite(player.maxAmmo) ? player.maxAmmo : 7;
    const ammo = clampAmmo(player, maxAmmo);
    const isReloading = Boolean(player.isReloading);
    const color = player.color || 'blue';
    const ammoStatus = isReloading ? 'Yenileniyor' : `Mermi: ${ammo}/${maxAmmo}`;
    const snapshot = [
        index,
        player.username,
        color,
        Math.floor(health),
        kills,
        ammo,
        maxAmmo,
        isReloading
    ].join('|');

    if (refs.lastSnapshot === snapshot) return;
    refs.lastSnapshot = snapshot;

    refs.panel.className = `player-panel corner-${index}`;

    const bodySrc = `/assets/sprites/tank-${color}.png`;
    if (!refs.bodyImg.src.endsWith(bodySrc)) refs.bodyImg.src = bodySrc;

    refs.name.textContent = player.username || 'Oyuncu';
    refs.name.style.color = color;
    refs.healthBar.style.width = `${health}%`;
    refs.healthBar.style.backgroundColor = getHealthColor(health);
    refs.healthText.textContent = `Can: ${Math.floor(health)}`;
    refs.killsText.textContent = `Les: ${kills}`;

    ensureAmmoSlots(refs, maxAmmo);
    refs.ammoSlotElements.forEach((slot, slotIndex) => {
        slot.classList.toggle('loaded', slotIndex < ammo);
        slot.classList.toggle('empty', slotIndex >= ammo);
    });

    refs.ammoRow.classList.toggle('reloading', isReloading);
    refs.ammoRow.setAttribute('aria-label', ammoStatus);
    refs.ammoText.textContent = ammoStatus;
}

export function createHudRenderer(hudElement) {
    const panels = new Map();

    return {
        render(gameState) {
            if (!gameState || !Array.isArray(gameState.players)) return;

            const visibleKeys = new Set();
            const players = gameState.players.slice(0, 4);

            players.forEach((player, index) => {
                const key = getPlayerKey(player, index);
                visibleKeys.add(key);

                if (!panels.has(key)) {
                    panels.set(key, createPanel(hudElement, index));
                }

                updatePanel(panels.get(key), player, index);
            });

            panels.forEach((refs, key) => {
                if (!visibleKeys.has(key)) {
                    refs.panel.remove();
                    panels.delete(key);
                }
            });
        }
    };
}
