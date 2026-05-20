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
// YENİ: Harita boyutunu genişlettik (720p HD)
canvas.width = 1920;
canvas.height = 1080;

const hud = document.getElementById('game-hud');
const damageOverlay = document.getElementById('damage-overlay');
const canvasRenderer = createCanvasRenderer(canvas);
const hudRenderer = createHudRenderer(hud);
const audioManager = createAudioManager();
const feedbackManager = createFeedbackManager({ overlayElement: damageOverlay, audioManager });

initInput(canvas);
let gameState = createGameState(); 
let socket;
let isConnected = false;
let activeExplosions = []; 
const myUsername = sessionStorage.getItem('username') || 'Misafir';
const gameUrlParams = new URLSearchParams(window.location.search);
const roomId = gameUrlParams.get('roomId') || sessionStorage.getItem('roomId');
const gameId = gameUrlParams.get('gameId') || sessionStorage.getItem('gameId');
let previousLocalHealth = null;
let previousLocalShotTime = null;
let lastFrameTime = performance.now();

function findLocalPlayer(state) {
    if (!state || !Array.isArray(state.players)) return null;
    return state.players.find(player => player.username === myUsername) || null;
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
                gameState = message.state; 
            }
            else if (message.type === 'EXPLOSION') {
                audioManager.playExplosion();
                activeExplosions.push({
                    x: message.payload.x,
                    y: message.payload.y,
                    type: message.payload.expType || 'NORMAL', 
                    frame: 0,
                    maxFrames: 30
                });
            }
            // --- YENİ: HARİTA DEĞİŞİMİNİ DİNLE ---
            else if (message.type === 'MAP_CHANGED') {
                // Sunucudan gelen yeni harita verilerini state'e işle
                gameState.obstacles = message.payload.obstacles;
                gameState.world = message.payload.world;
                previousLocalHealth = null;
                previousLocalShotTime = null;
                feedbackManager.reset();
                console.log("Yeni harita yüklendi!");
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

    await loadGameAssets();
    initNetwork();
    
    function gameLoop() {
        const now = performance.now();
        const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;
        const myPlayer = findLocalPlayer(gameState);

        if (isConnected && socket.readyState === WebSocket.OPEN) {
            const input = toWorldMouseInput(getInputState(), myPlayer);
            socket.send(JSON.stringify({ type: 'PLAYER_INPUT', payload: input }));
        }

        activeExplosions.forEach(exp => exp.frame++);
        activeExplosions = activeExplosions.filter(exp => exp.frame < exp.maxFrames);

        const feedbackState = feedbackManager.update(myPlayer, deltaSeconds);

        canvasRenderer.render(gameState, activeExplosions, myUsername, feedbackState);

        if (myPlayer) hudRenderer.render({ players: [myPlayer] }); 

        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}
startGame();
