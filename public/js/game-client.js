// public/js/game-client.js
import { createCanvasRenderer } from './render/canvasRenderer.js';
import { createHudRenderer } from './render/hudRenderer.js';
import { loadGameAssets } from './assets/assetLoader.js';
import { initInput, getInputState } from './input/inputManager.js';
import { createGameState } from './state/gameState.js';
import { createFeedbackManager } from './feedback/feedbackManager.js';
import { createAudioManager } from './audio/audioManager.js';
import { CAMERA_ZOOM } from './render/cameraConfig.js';

const canvas = document.getElementById('game-canvas');
canvas.width = 1920;
canvas.height = 1080;

const hud = document.getElementById('game-hud');
const damageOverlay = document.getElementById('damage-overlay');
const canvasRenderer = createCanvasRenderer(canvas);
const hudRenderer = createHudRenderer(hud);
const audioManager = createAudioManager();
const feedbackManager = createFeedbackManager({ overlayElement: damageOverlay, audioManager });

const INPUT_SEND_INTERVAL_MS = 1000 / 30;
const INTERPOLATION_DELAY_MS = 100;
const MAX_STATE_BUFFER_SIZE = 8;

initInput(canvas);
let gameState = createGameState();
let socket;
let isConnected = false;
let activeExplosions = [];
let stateBuffer = [];
const myUsername = sessionStorage.getItem('username') || 'Misafir';
const gameUrlParams = new URLSearchParams(window.location.search);
const roomId = gameUrlParams.get('roomId') || sessionStorage.getItem('roomId');
const gameId = gameUrlParams.get('gameId') || sessionStorage.getItem('gameId');
let previousLocalHealth = null;
let previousLocalShotTime = null;
let lastFrameTime = performance.now();
let lastInputSendTime = 0;
let lastSentInputKey = '';
let lastHudKey = '';

function findLocalPlayer(state) {
    if (!state || !Array.isArray(state.players)) return null;
    return state.players.find(player => player.username === myUsername) || null;
}

function getEntityKey(entity, fallbackIndex) {
    return entity.id || entity.username || `${fallbackIndex}`;
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

function normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function lerpAngle(start, end, amount) {
    return normalizeAngle(start + normalizeAngle(end - start) * amount);
}

function interpolateNumber(previousValue, nextValue, amount) {
    if (!Number.isFinite(previousValue) || !Number.isFinite(nextValue)) return nextValue;
    return lerp(previousValue, nextValue, amount);
}

function interpolateAngle(previousValue, nextValue, amount) {
    if (!Number.isFinite(previousValue) || !Number.isFinite(nextValue)) return nextValue;
    return lerpAngle(previousValue, nextValue, amount);
}

function interpolateList(previousList = [], nextList = [], amount, fields) {
    const previousByKey = new Map(previousList.map((entity, index) => [getEntityKey(entity, index), entity]));

    return nextList.map((nextEntity, index) => {
        const previousEntity = previousByKey.get(getEntityKey(nextEntity, index));
        if (!previousEntity) return nextEntity;

        const interpolated = { ...nextEntity };
        fields.forEach(field => {
            interpolated[field] = interpolateNumber(previousEntity[field], nextEntity[field], amount);
        });

        if ('rotation' in nextEntity) {
            interpolated.rotation = interpolateAngle(previousEntity.rotation, nextEntity.rotation, amount);
        }

        if ('turretRotation' in nextEntity) {
            interpolated.turretRotation = interpolateAngle(previousEntity.turretRotation, nextEntity.turretRotation, amount);
        }

        return interpolated;
    });
}

function rememberServerState(nextState) {
    gameState = nextState;
    stateBuffer.push({ receivedAt: performance.now(), state: nextState });

    if (stateBuffer.length > MAX_STATE_BUFFER_SIZE) {
        stateBuffer = stateBuffer.slice(-MAX_STATE_BUFFER_SIZE);
    }
}

function getInterpolatedState(now) {
    if (stateBuffer.length < 2) return gameState;

    const renderTime = now - INTERPOLATION_DELAY_MS;
    const first = stateBuffer[0];
    const last = stateBuffer[stateBuffer.length - 1];

    if (renderTime <= first.receivedAt) return first.state;
    if (renderTime >= last.receivedAt) return last.state;

    let previous = first;
    let next = last;

    for (let i = 1; i < stateBuffer.length; i++) {
        if (stateBuffer[i].receivedAt >= renderTime) {
            previous = stateBuffer[i - 1];
            next = stateBuffer[i];
            break;
        }
    }

    const span = Math.max(1, next.receivedAt - previous.receivedAt);
    const amount = Math.max(0, Math.min(1, (renderTime - previous.receivedAt) / span));

    return {
        ...next.state,
        players: interpolateList(previous.state.players, next.state.players, amount, ['x', 'y']),
        bullets: interpolateList(previous.state.bullets, next.state.bullets, amount, ['x', 'y'])
    };
}

function processLocalHealthChange(nextState) {
    const localPlayer = findLocalPlayer(nextState);
    if (!localPlayer) return;

    const nextHealth = Number(localPlayer.health);
    if (!Number.isFinite(nextHealth)) return;

    if (previousLocalHealth !== null && nextHealth < previousLocalHealth) {
        feedbackManager.registerDamage(previousLocalHealth - nextHealth);
    }

    previousLocalHealth = nextHealth;
}

function processLocalShotChange(nextState) {
    const localPlayer = findLocalPlayer(nextState);
    if (!localPlayer) return;

    const nextShotTime = Number(localPlayer.lastShotTime);
    if (!Number.isFinite(nextShotTime)) return;

    if (previousLocalShotTime !== null && nextShotTime > previousLocalShotTime) {
        audioManager.playShoot();
    }

    previousLocalShotTime = nextShotTime;
}

function toWorldMouseInput(input, localPlayer) {
    if (!localPlayer) return input;

    return {
        ...input,
        mouseX: localPlayer.x + ((input.mouseX - canvas.width / 2) / CAMERA_ZOOM),
        mouseY: localPlayer.y + ((input.mouseY - canvas.height / 2) / CAMERA_ZOOM)
    };
}

function getInputKey(input) {
    return JSON.stringify(input);
}

function sendInputIfNeeded(now, localPlayer) {
    if (!isConnected || socket.readyState !== WebSocket.OPEN) return;
    if (now - lastInputSendTime < INPUT_SEND_INTERVAL_MS) return;

    const input = toWorldMouseInput(getInputState(), localPlayer);
    const inputKey = getInputKey(input);

    if (inputKey === lastSentInputKey && !input.reloadRequested) {
        lastInputSendTime = now;
        return;
    }

    socket.send(JSON.stringify({ type: 'PLAYER_INPUT', payload: input }));
    lastInputSendTime = now;
    lastSentInputKey = inputKey;
}

function getHudKey(player) {
    if (!player) return '';

    return [
        player.id,
        player.username,
        player.color,
        Math.floor(player.health || 0),
        player.score || 0,
        player.ammo,
        player.maxAmmo,
        Boolean(player.isReloading)
    ].join('|');
}

function renderHudIfNeeded(player) {
    if (!player) {
        if (lastHudKey) {
            lastHudKey = '';
            hudRenderer.render({ players: [] });
        }
        return;
    }

    const hudKey = getHudKey(player);
    if (hudKey === lastHudKey) return;

    lastHudKey = hudKey;
    hudRenderer.render({ players: [player] });
}

function resetInterpolationBuffer() {
    stateBuffer = [];
    if (gameState) {
        stateBuffer.push({ receivedAt: performance.now(), state: gameState });
    }
}

function initNetwork() {
    const token = sessionStorage.getItem('token');
    const username = myUsername;
    if (!token || !roomId || !gameId) {
        window.location.href = '/main-menu';
        return;
    }

    sessionStorage.setItem('roomId', roomId);
    sessionStorage.setItem('gameId', gameId);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/?token=${encodeURIComponent(token)}&username=${encodeURIComponent(username)}&roomId=${encodeURIComponent(roomId)}&gameId=${encodeURIComponent(gameId)}`;

    try {
        socket = new WebSocket(wsUrl);
        socket.onopen = () => { isConnected = true; };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'GAME_STATE_UPDATE') {
                processLocalHealthChange(message.state);
                processLocalShotChange(message.state);
                rememberServerState(message.state);
            } else if (message.type === 'EXPLOSION') {
                audioManager.playExplosion();
                activeExplosions.push({
                    x: message.payload.x,
                    y: message.payload.y,
                    type: message.payload.expType || 'NORMAL',
                    frame: 0,
                    maxFrames: 30
                });
            } else if (message.type === 'MAP_CHANGED') {
                gameState = {
                    ...gameState,
                    obstacles: message.payload.obstacles,
                    world: message.payload.world,
                    bullets: [],
                    activeItems: []
                };
                previousLocalHealth = null;
                previousLocalShotTime = null;
                lastHudKey = '';
                resetInterpolationBuffer();
                feedbackManager.reset();
                console.log('Yeni harita yuklendi!');
            }
        };
        socket.onclose = () => { isConnected = false; };
    } catch (error) {}
}

async function startGame() {
    if (!sessionStorage.getItem('token') || !roomId || !gameId) {
        window.location.href = '/main-menu';
        return;
    }

    await Promise.allSettled([
        loadGameAssets(),
        audioManager.preload()
    ]);
    initNetwork();

    function gameLoop() {
        const now = performance.now();
        const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;
        const latestLocalPlayer = findLocalPlayer(gameState);

        sendInputIfNeeded(now, latestLocalPlayer);

        activeExplosions.forEach(exp => exp.frame++);
        activeExplosions = activeExplosions.filter(exp => exp.frame < exp.maxFrames);

        const feedbackState = feedbackManager.update(latestLocalPlayer, deltaSeconds);
        const renderState = getInterpolatedState(now);
        const renderedLocalPlayer = findLocalPlayer(renderState);

        canvasRenderer.render(renderState, activeExplosions, myUsername, feedbackState);
        renderHudIfNeeded(renderedLocalPlayer || latestLocalPlayer);

        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}

startGame();
