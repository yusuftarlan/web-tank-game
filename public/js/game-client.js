// public/js/game-client.js
import { createCanvasRenderer } from './render/canvasRenderer.js';
import { createHudRenderer } from './render/hudRenderer.js';
import { loadGameAssets } from './assets/assetLoader.js';
import { initInput, getInputState } from './input/inputManager.js';
import { createGameState } from './state/gameState.js'; 

const canvas = document.getElementById('game-canvas');
// YENİ: Harita boyutunu genişlettik (720p HD)
canvas.width = 1920;
canvas.height = 1080;

const hud = document.getElementById('game-hud');
const canvasRenderer = createCanvasRenderer(canvas);
const hudRenderer = createHudRenderer(hud);

initInput(canvas);
let gameState = createGameState(); 
let socket;
let isConnected = false;
let activeExplosions = []; 

function initNetwork() {
    const token = sessionStorage.getItem('token');
    const username = sessionStorage.getItem('username') || 'Misafir'; 
    if (!token) {
        window.location.href = '/main-menu';
        return;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/?token=${token}&username=${encodeURIComponent(username)}`;

    try {
        socket = new WebSocket(wsUrl);
        socket.onopen = () => { isConnected = true; };
        
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'GAME_STATE_UPDATE') {
                gameState = message.state; 
            }
            else if (message.type === 'EXPLOSION') {
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
                console.log("Yeni harita yüklendi!");
            }
        };
        socket.onclose = () => { isConnected = false; };
    } catch (error) {}
}

async function startGame() {
    await loadGameAssets();
    initNetwork();
    
    function gameLoop() {
        if (isConnected && socket.readyState === WebSocket.OPEN) {
            const input = getInputState();
            socket.send(JSON.stringify({ type: 'PLAYER_INPUT', payload: input }));
        }

        activeExplosions.forEach(exp => exp.frame++);
        activeExplosions = activeExplosions.filter(exp => exp.frame < exp.maxFrames);

        canvasRenderer.render(gameState, activeExplosions);
        
        const myUsername = sessionStorage.getItem('username');
        const myPlayer = gameState.players.find(p => p.username === myUsername);
        if (myPlayer) hudRenderer.render({ players: [myPlayer] }); 

        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}
startGame();