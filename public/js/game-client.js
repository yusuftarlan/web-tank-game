// public/js/game-client.js
import { createCanvasRenderer } from './render/canvasRenderer.js';
import { createHudRenderer } from './render/hudRenderer.js';
import { loadGameAssets } from './assets/assetLoader.js';
import { initInput, getInputState } from './input/inputManager.js';

const canvas = document.getElementById('game-canvas');
const hud = document.getElementById('game-hud');

const canvasRenderer = createCanvasRenderer(canvas);
const hudRenderer = createHudRenderer(hud);

initInput(canvas);

let gameState = {
    players: [],
    bullets: [],
    obstacles: [],
    world: { width: 960, height: 540 }
};

let socket;
let isConnected = false;

function initNetwork() {
    const token = sessionStorage.getItem('token');
    const username = sessionStorage.getItem('username') || 'Misafir'; // YENİ: Kullanıcı adını da alıyoruz
    
    if (!token) {
        console.warn("Kullanıcı girişi bulunamadı. Lobiye dönülüyor...");
        window.location.href = '/main-menu';
        return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // YENİ: Sunucuya token ile birlikte kullanıcı adımızı da gönderiyoruz ki sunucu bizi unutursa hatırlatabilelim.
    const wsUrl = `${protocol}//${window.location.host}/?token=${token}&username=${encodeURIComponent(username)}`;

    try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("WebSocket sunucusuna başarıyla bağlanıldı!");
            isConnected = true;
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'GAME_STATE_UPDATE') {
                gameState = message.state;
            }
        };

        socket.onclose = () => {
            console.log("WebSocket bağlantısı koptu.");
            isConnected = false;
        };
    } catch (error) {
        console.error("WebSocket bağlantı hatası:", error);
    }
}

async function startGame() {
    await loadGameAssets();
    
    initNetwork();
    
    function gameLoop() {
        if (isConnected && socket.readyState === WebSocket.OPEN) {
            const input = getInputState();
            socket.send(JSON.stringify({
                type: 'PLAYER_INPUT',
                payload: input
            }));
        }

        canvasRenderer.render(gameState);
        
        const myUsername = sessionStorage.getItem('username');
        const myPlayer = gameState.players.find(p => p.username === myUsername);
        
        if (myPlayer) {
            hudRenderer.render({ players: [myPlayer] }); 
        }

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}

startGame();