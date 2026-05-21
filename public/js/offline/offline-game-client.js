import { createCanvasRenderer } from '../render/canvasRenderer.js';
import { createHudRenderer } from '../render/hudRenderer.js';
import { loadGameAssets } from '../assets/assetLoader.js';
import { createAudioManager } from '../audio/audioManager.js';

const canvas = document.getElementById('game-canvas');
canvas.width = 1920;
canvas.height = 1080;

const hud = document.getElementById('game-hud');
const statusElement = document.getElementById('offline-status');
const canvasRenderer = createCanvasRenderer(canvas, { cameraMode: 'full-map' });
const hudRenderer = createHudRenderer(hud);
const audioManager = createAudioManager();

const PLAYER_COLORS = ['blue', 'red', 'green', 'grey'];
const PLAYER_NAMES = ['Oyuncu 1', 'Oyuncu 2', 'Oyuncu 3', 'Oyuncu 4'];
const PLAYER_SPAWNS = [
    { x: 560, y: 220, rotation: 0 },
    { x: 1360, y: 220, rotation: Math.PI },
    { x: 660, y: 840, rotation: 0 },
    { x: 1260, y: 840, rotation: Math.PI }
];

const WORLD = { width: 1920, height: 1080 };
const TANK_WIDTH = 42;
const TANK_HEIGHT = 32;
const TANK_SPEED = 270;
const BULLET_SPEED = 720;
const BULLET_RADIUS = 5;
const FIRE_RATE_MS = 330;
const MAX_AMMO = 7;
const RELOAD_DURATION_MS = 1000;
const RESPAWN_DELAY_MS = 1200;
const SCORE_LIMIT = 5;
const POWERUP_DURATION_MS = 8000;
const ITEM_SPAWN_INTERVAL_MS = 9000;
const INITIAL_ITEM_COUNT = 2;
const ITEM_TYPES = ['HOMING_MISSILE', 'RAPID_FIRE', 'TURBO_DRIVE', 'AOE_EXPLOSION', 'CLUSTER_BOMB', 'BOUNCING_BULLET', 'GHOST_BULLET', 'SHIELD'];
const POWERUP_BULLET_TYPES = ['GHOST_BULLET', 'HOMING_MISSILE', 'AOE_EXPLOSION', 'CLUSTER_BOMB', 'BOUNCING_BULLET'];

const OBSTACLES = [
    { x: 0, y: 0, width: 1920, height: 20 },
    { x: 0, y: 1060, width: 1920, height: 20 },
    { x: 0, y: 0, width: 20, height: 1080 },
    { x: 1900, y: 0, width: 20, height: 1080 },
    { x: 860, y: 400, width: 200, height: 280 },
    { x: 200, y: 250, width: 400, height: 40 },
    { x: 1320, y: 250, width: 400, height: 40 },
    { x: 200, y: 790, width: 400, height: 40 },
    { x: 1320, y: 790, width: 400, height: 40 },
    { x: 400, y: 350, width: 40, height: 380 },
    { x: 1480, y: 350, width: 40, height: 380 },
    { x: 700, y: 100, width: 40, height: 200 },
    { x: 1180, y: 100, width: 40, height: 200 },
    { x: 700, y: 780, width: 40, height: 200 },
    { x: 1180, y: 780, width: 40, height: 200 },
    { x: 940, y: 150, width: 40, height: 150 },
    { x: 940, y: 780, width: 40, height: 150 },
    { x: 200, y: 520, width: 150, height: 40 },
    { x: 1570, y: 520, width: 150, height: 40 }
];

const CONTROL_PROFILES = [
    {
        up: ['KeyW'],
        down: ['KeyS'],
        left: ['KeyA'],
        right: ['KeyD'],
        fire: ['Space']
    },
    {
        up: ['ArrowUp'],
        down: ['ArrowDown'],
        left: ['ArrowLeft'],
        right: ['ArrowRight'],
        fire: ['Enter', 'NumpadEnter']
    },
    {
        up: ['KeyI'],
        down: ['KeyK'],
        left: ['KeyJ'],
        right: ['KeyL'],
        fire: ['KeyC', 'Semicolon']
    },
    {
        up: ['Digit8', 'Numpad8'],
        down: ['Digit5', 'Numpad5'],
        left: ['Digit4', 'Numpad4'],
        right: ['Digit6', 'Numpad6'],
        fire: ['Equal', 'NumpadAdd']
    }
];

const pressedCodes = new Set();
const pressedKeys = new Set();
const urlParams = new URLSearchParams(window.location.search);
const playerCount = Math.max(2, Math.min(4, parseInt(urlParams.get('players'), 10) || 2));
let gameState = createInitialState(playerCount);
let activeExplosions = [];
let lastFrameTime = performance.now();
let gameOver = false;

function createInitialState(count) {
    return {
        players: Array.from({ length: count }, (_, index) => createPlayer(index)),
        bullets: [],
        activeItems: createInitialPowerUps(INITIAL_ITEM_COUNT),
        lastItemSpawnTime: performance.now(),
        obstacles: OBSTACLES.map(obstacle => ({ ...obstacle })),
        world: { ...WORLD }
    };
}

function createPlayer(index) {
    const spawn = PLAYER_SPAWNS[index];

    return {
        id: `offline-player-${index + 1}`,
        username: PLAYER_NAMES[index],
        x: spawn.x,
        y: spawn.y,
        rotation: spawn.rotation,
        turretRotation: spawn.rotation,
        health: 100,
        score: 0,
        powerUp: null,
        color: PLAYER_COLORS[index],
        ammo: MAX_AMMO,
        maxAmmo: MAX_AMMO,
        isReloading: false,
        reloadEndsAt: 0,
        lastShotTime: 0,
        respawnAt: 0,
        isAlive: true
    };
}

function getPlayerInput(playerIndex) {
    const profile = CONTROL_PROFILES[playerIndex];

    return {
        up: isPressed(profile.up),
        down: isPressed(profile.down),
        left: isPressed(profile.left),
        right: isPressed(profile.right),
        isShooting: isPressed(profile.fire) || (playerIndex === 2 && pressedKeys.has('ç')) || (playerIndex === 3 && pressedKeys.has('+'))
    };
}

function isPressed(codes) {
    return codes.some(code => pressedCodes.has(code));
}

function normalizeKey(key) {
    return String(key || '').toLocaleLowerCase('tr-TR');
}

function shouldCaptureKey(event) {
    return CONTROL_PROFILES.some(profile => {
        return [...profile.up, ...profile.down, ...profile.left, ...profile.right, ...profile.fire].includes(event.code);
    }) || [' ', 'enter', 'ç', '+'].includes(normalizeKey(event.key));
}

function intersects(rectA, rectB) {
    return (
        rectA.x < rectB.x + rectB.width &&
        rectA.x + rectA.width > rectB.x &&
        rectA.y < rectB.y + rectB.height &&
        rectA.y + rectA.height > rectB.y
    );
}

function getTankRect(player) {
    return {
        x: player.x - TANK_WIDTH / 2,
        y: player.y - TANK_HEIGHT / 2,
        width: TANK_WIDTH,
        height: TANK_HEIGHT
    };
}

function createInitialPowerUps(count) {
    return Array.from({ length: count }, (_, index) => {
        const position = getSafeItemPosition();

        return {
            id: `offline-start-item-${index}`,
            type: ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)],
            x: position.x,
            y: position.y,
            radius: position.radius
        };
    });
}

function getSafeItemPosition() {
    const radius = 15;
    let spawnX = radius * 2;
    let spawnY = radius * 2;
    let isSafe = false;

    for (let attempt = 0; attempt < 50 && !isSafe; attempt++) {
        spawnX = Math.random() * (WORLD.width - radius * 4) + radius * 2;
        spawnY = Math.random() * (WORLD.height - radius * 4) + radius * 2;

        const itemRect = {
            x: spawnX - radius,
            y: spawnY - radius,
            width: radius * 2,
            height: radius * 2
        };

        isSafe = !OBSTACLES.some(obstacle => intersects(itemRect, obstacle));
    }

    return { x: spawnX, y: spawnY, radius };
}

function spawnPowerUpIfNeeded(now) {
    if (now - gameState.lastItemSpawnTime < ITEM_SPAWN_INTERVAL_MS) return;

    const position = getSafeItemPosition();
    gameState.activeItems.push({
        id: `offline-item-${now}-${Math.random().toString(36).slice(2)}`,
        type: ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)],
        x: position.x,
        y: position.y,
        radius: position.radius
    });

    gameState.lastItemSpawnTime = now;
}

function collectPowerUps(player, now) {
    const playerRect = getTankRect(player);

    for (let index = gameState.activeItems.length - 1; index >= 0; index--) {
        const item = gameState.activeItems[index];
        const itemRect = {
            x: item.x - item.radius,
            y: item.y - item.radius,
            width: item.radius * 2,
            height: item.radius * 2
        };

        if (!intersects(playerRect, itemRect)) continue;

        player.powerUp = {
            type: item.type,
            expiresAt: now + POWERUP_DURATION_MS
        };
        gameState.activeItems.splice(index, 1);
    }
}

function movePlayer(player, input, deltaSeconds) {
    let moveX = 0;
    let moveY = 0;

    if (input.up) moveY -= 1;
    if (input.down) moveY += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
        const length = Math.hypot(moveX, moveY);
        moveX /= length;
        moveY /= length;
    }

    if (moveX !== 0 || moveY !== 0) {
        player.rotation = Math.atan2(moveY, moveX);
        player.turretRotation = player.rotation;
    }

    const speed = player.powerUp?.type === 'TURBO_DRIVE' ? TANK_SPEED * 1.45 : TANK_SPEED;

    moveAxis(player, moveX * speed * deltaSeconds, 0);
    moveAxis(player, 0, moveY * speed * deltaSeconds);
}

function moveAxis(player, deltaX, deltaY) {
    if (deltaX === 0 && deltaY === 0) return;

    player.x = Math.max(TANK_WIDTH / 2, Math.min(WORLD.width - TANK_WIDTH / 2, player.x + deltaX));
    player.y = Math.max(TANK_HEIGHT / 2, Math.min(WORLD.height - TANK_HEIGHT / 2, player.y + deltaY));

    const rect = getTankRect(player);
    if (OBSTACLES.some(obstacle => intersects(rect, obstacle))) {
        player.x -= deltaX;
        player.y -= deltaY;
    }
}

function updateAmmo(player, now) {
    if (player.isReloading && now >= player.reloadEndsAt) {
        player.ammo = player.maxAmmo;
        player.isReloading = false;
        player.reloadEndsAt = 0;
    }
}

function updatePowerUp(player, now) {
    if (player.powerUp && now > player.powerUp.expiresAt) {
        player.powerUp = null;
    }
}

function startReload(player, now) {
    if (player.isReloading || player.ammo >= player.maxAmmo) return;

    player.isReloading = true;
    player.reloadEndsAt = now + RELOAD_DURATION_MS;
}

function tryShoot(player, input, now) {
    if (!input.isShooting || player.isReloading || player.ammo <= 0) return;

    const fireRate = player.powerUp?.type === 'RAPID_FIRE' ? FIRE_RATE_MS * 0.65 : FIRE_RATE_MS;
    if (now - player.lastShotTime < fireRate) return;

    const barrelOffsetX = Math.cos(player.turretRotation) * 40;
    const barrelOffsetY = Math.sin(player.turretRotation) * 40;
    const bulletType = POWERUP_BULLET_TYPES.includes(player.powerUp?.type) ? player.powerUp.type : 'NORMAL';

    gameState.bullets.push({
        id: `offline-bullet-${now}-${Math.random().toString(36).slice(2)}`,
        ownerId: player.username,
        type: bulletType,
        x: player.x + barrelOffsetX,
        y: player.y + barrelOffsetY,
        rotation: player.turretRotation,
        speed: BULLET_SPEED,
        radius: BULLET_RADIUS,
        lifeTime: 3000,
        color: bulletType === 'NORMAL' ? '#f1c40f' : '#ff4757'
    });

    player.lastShotTime = now;
    player.ammo -= 1;
    audioManager.playShoot();

    if (player.ammo <= 0) {
        player.ammo = 0;
        startReload(player, now);
    }
}

function updateBullets(deltaSeconds, now) {
    for (let index = gameState.bullets.length - 1; index >= 0; index--) {
        const bullet = gameState.bullets[index];
        let isDestroyed = false;

        if (Number.isFinite(bullet.lifeTime)) {
            bullet.lifeTime -= deltaSeconds * 1000;
            if (bullet.lifeTime <= 0) isDestroyed = true;
        }

        if (!isDestroyed && bullet.type === 'HOMING_MISSILE') {
            const target = findNearestTarget(bullet);
            if (target) {
                const desiredRotation = Math.atan2(target.y - bullet.y, target.x - bullet.x);
                const angleDiff = Math.atan2(Math.sin(desiredRotation - bullet.rotation), Math.cos(desiredRotation - bullet.rotation));
                bullet.rotation += angleDiff * 0.09;
            }
        }

        if (isDestroyed) {
            destroyBullet(index);
            continue;
        }

        bullet.x += Math.cos(bullet.rotation) * bullet.speed * deltaSeconds;
        bullet.y += Math.sin(bullet.rotation) * bullet.speed * deltaSeconds;

        const bulletRect = {
            x: bullet.x - bullet.radius,
            y: bullet.y - bullet.radius,
            width: bullet.radius * 2,
            height: bullet.radius * 2
        };

        if (bullet.x < 0 || bullet.x > WORLD.width || bullet.y < 0 || bullet.y > WORLD.height) {
            destroyBullet(index);
            continue;
        }

        if (bullet.type !== 'GHOST_BULLET') {
            const hitObstacle = OBSTACLES.find(obstacle => intersects(bulletRect, obstacle));

            if (hitObstacle) {
                if (bullet.type === 'BOUNCING_BULLET') {
                    bounceBullet(bullet, bulletRect, hitObstacle);
                } else {
                    destroyBullet(index);
                    continue;
                }
            }
        }

        const target = gameState.players.find(player => {
            return player.isAlive && player.username !== bullet.ownerId && intersects(bulletRect, getTankRect(player));
        });

        if (!target) continue;

        destroyBullet(index);

        if (bullet.type === 'AOE_EXPLOSION' || bullet.type === 'CLUSTER_BOMB') {
            continue;
        }

        if (target.powerUp?.type === 'SHIELD') {
            target.powerUp = null;
            continue;
        }

        target.health = Math.max(0, target.health - 25);

        if (target.health <= 0 && target.isAlive) {
            knockOutPlayer(target, bullet.ownerId, now);
        }
    }
}

function destroyBullet(index) {
    const bullet = gameState.bullets[index];
    activeExplosions.push({
        x: bullet.x,
        y: bullet.y,
        type: 'NORMAL',
        frame: 0,
        maxFrames: 20
    });
    applyBulletExplosion(bullet);
    gameState.bullets.splice(index, 1);
}

function findNearestTarget(bullet) {
    let nearestTarget = null;
    let nearestDistance = Infinity;

    gameState.players.forEach(player => {
        if (!player.isAlive || player.username === bullet.ownerId) return;

        const distance = Math.hypot(player.x - bullet.x, player.y - bullet.y);
        if (distance < nearestDistance) {
            nearestTarget = player;
            nearestDistance = distance;
        }
    });

    return nearestTarget;
}

function bounceBullet(bullet, bulletRect, obstacle) {
    const overlapX = Math.min(bulletRect.x + bulletRect.width - obstacle.x, obstacle.x + obstacle.width - bulletRect.x);
    const overlapY = Math.min(bulletRect.y + bulletRect.height - obstacle.y, obstacle.y + obstacle.height - bulletRect.y);
    let velocityX = Math.cos(bullet.rotation) * bullet.speed;
    let velocityY = Math.sin(bullet.rotation) * bullet.speed;

    if (overlapX < overlapY) velocityX *= -1;
    else velocityY *= -1;

    bullet.rotation = Math.atan2(velocityY, velocityX);
    bullet.x += Math.cos(bullet.rotation) * bullet.radius * 2;
    bullet.y += Math.sin(bullet.rotation) * bullet.radius * 2;
}

function applyBulletExplosion(bullet) {
    if (bullet.type === 'AOE_EXPLOSION') {
        damagePlayersInRadius(bullet, 120, 45);
        return;
    }

    if (bullet.type === 'CLUSTER_BOMB') {
        for (let index = 0; index < 8; index++) {
            gameState.bullets.push({
                id: `offline-cluster-${performance.now()}-${index}`,
                ownerId: bullet.ownerId,
                type: 'NORMAL',
                x: bullet.x,
                y: bullet.y,
                rotation: (Math.PI / 4) * index,
                speed: BULLET_SPEED * 0.8,
                radius: BULLET_RADIUS,
                lifeTime: 1800,
                color: '#e67e22'
            });
        }
    }
}

function damagePlayersInRadius(bullet, radius, maxDamage) {
    gameState.players.forEach(player => {
        if (!player.isAlive) return;

        const distance = Math.hypot(player.x - bullet.x, player.y - bullet.y);
        if (distance >= radius) return;

        if (player.powerUp?.type === 'SHIELD') {
            player.powerUp = null;
            return;
        }

        const damage = maxDamage * (1 - distance / radius);
        player.health = Math.max(0, player.health - damage);

        if (player.health <= 0 && player.isAlive) {
            knockOutPlayer(player, bullet.ownerId, performance.now());
        }
    });
}

function knockOutPlayer(target, ownerId, now) {
    target.isAlive = false;
    target.respawnAt = now + RESPAWN_DELAY_MS;
    activeExplosions.push({
        x: target.x,
        y: target.y,
        type: 'NORMAL',
        frame: 0,
        maxFrames: 30
    });
    audioManager.playExplosion();

    const scorer = gameState.players.find(player => player.username === ownerId);
    if (scorer) {
        scorer.score += 10;
        const kills = Math.floor(scorer.score / 10);

        if (kills >= SCORE_LIMIT) {
            finishMatch(scorer);
        }
    }
}

function updateRespawns(now) {
    gameState.players.forEach((player, index) => {
        if (player.isAlive || now < player.respawnAt || gameOver) return;

        const spawn = PLAYER_SPAWNS[index];
        player.x = spawn.x;
        player.y = spawn.y;
        player.rotation = spawn.rotation;
        player.turretRotation = spawn.rotation;
        player.health = 100;
        player.ammo = player.maxAmmo;
        player.isReloading = false;
        player.reloadEndsAt = 0;
        player.isAlive = true;
    });
}

function finishMatch(winner) {
    gameOver = true;
    const kills = Math.floor(winner.score / 10);
    const standings = getStandings(gameState.players);

    showStatus(`
        <div class="offline-victory-panel">
            <div class="offline-victory-kicker">Offline savas bitti</div>
            <h1 class="offline-victory-title">${winner.username} kazandi</h1>
            <div class="offline-victory-meta">
                <div class="offline-victory-badge">Les: ${kills}</div>
                <div class="offline-victory-badge">Skor: ${winner.score}</div>
            </div>
            ${renderStandings(standings)}
            <div class="offline-victory-hint">R tusu ile yeniden baslat</div>
            <div class="match-end-actions">
                <button id="offline-restart-match" class="match-end-button" type="button">YENIDEN BASLAT</button>
                <a class="match-end-button secondary" href="/main-menu">ANA MENU</a>
            </div>
        </div>
    `);

    document.getElementById('offline-restart-match')?.addEventListener('click', resetMatch);
}

function getStandings(players) {
    return [...players]
        .sort((first, second) => {
            if (second.score !== first.score) return second.score - first.score;
            return first.username.localeCompare(second.username, 'tr');
        })
        .map((player, index) => ({
            rank: index + 1,
            username: player.username,
            score: player.score,
            kills: Math.floor(player.score / 10)
        }));
}

function renderStandings(standings) {
    return `
        <div class="match-standings">
            ${standings.map(player => `
                <div class="match-standing-row">
                    <span class="match-standing-rank">#${player.rank}</span>
                    <span>${player.username}</span>
                    <span class="match-standing-score">${player.kills} les</span>
                </div>
            `).join('')}
        </div>
    `;
}

function resetMatch() {
    gameState = createInitialState(playerCount);
    activeExplosions = [];
    gameOver = false;
    hideStatus();
}

function showStatus(message) {
    statusElement.innerHTML = message;
    statusElement.classList.remove('hidden');
}

function hideStatus() {
    statusElement.replaceChildren();
    statusElement.classList.add('hidden');
}

function update(deltaSeconds, now) {
    if (gameOver) return;

    spawnPowerUpIfNeeded(now);

    gameState.players.forEach((player, index) => {
        updateAmmo(player, now);
        updatePowerUp(player, now);

        if (!player.isAlive) return;

        const input = getPlayerInput(index);
        movePlayer(player, input, deltaSeconds);
        collectPowerUps(player, now);
        tryShoot(player, input, now);
    });

    updateBullets(deltaSeconds, now);
    updateRespawns(now);
}

function render() {
    const visiblePlayers = gameState.players.map(player => {
        if (player.isAlive) return player;

        return {
            ...player,
            x: -200,
            y: -200,
            health: 0
        };
    });

    canvasRenderer.render({ ...gameState, players: visiblePlayers }, activeExplosions, null);
    hudRenderer.render({ players: gameState.players });
}

function tick() {
    const now = performance.now();
    const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    update(deltaSeconds, now);
    activeExplosions.forEach(explosion => explosion.frame++);
    activeExplosions = activeExplosions.filter(explosion => explosion.frame < explosion.maxFrames);
    render();

    requestAnimationFrame(tick);
}

window.addEventListener('keydown', (event) => {
    if (shouldCaptureKey(event)) event.preventDefault();

    pressedCodes.add(event.code);
    pressedKeys.add(normalizeKey(event.key));

    if (gameOver && event.code === 'KeyR') {
        resetMatch();
    }
});

window.addEventListener('keyup', (event) => {
    if (shouldCaptureKey(event)) event.preventDefault();

    pressedCodes.delete(event.code);
    pressedKeys.delete(normalizeKey(event.key));
});

await Promise.allSettled([
    loadGameAssets(),
    audioManager.preload()
]);

requestAnimationFrame(tick);
