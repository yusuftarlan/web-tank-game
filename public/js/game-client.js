// public/js/game-client.js
import { createGameState } from './state/gameState.js';
import { createCanvasRenderer } from './render/canvasRenderer.js';
import { createHudRenderer } from './render/hudRenderer.js';
import { loadGameAssets } from './assets/assetLoader.js';
import { initInput, getInputState } from './input/inputManager.js';

const canvas = document.getElementById('game-canvas');
const hud = document.getElementById('game-hud');

const gameState = createGameState();
const canvasRenderer = createCanvasRenderer(canvas);
const hudRenderer = createHudRenderer(hud);

initInput(canvas);

let lastShotTime = 0;
const FIRE_RATE = 300; 

// --- YENİ: WebSocket Ağ Katmanı İskeleti ---
let socket;
let isConnected = false;

function initNetwork() {
    const token = sessionStorage.getItem('token');
    // Eğer lobi üzerinden giriş yapılmamışsa (token yoksa) uyar
    if (!token) {
        console.warn("Kullanıcı girişi bulunamadı. Ağ bağlantısı atlanıyor, yerel modda devam edilecek.");
        return;
    }

    // Mevcut host üzerinden WebSocket URL'sini oluştur
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/?token=${token}`;

    try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("WebSocket sunucusuna başarıyla bağlanıldı!");
            isConnected = true;
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            // Sunucudan (Authoritative Server) gelen oyun durumu güncellemeleri
            if (message.type === 'GAME_STATE_UPDATE') {
                // İleride arka uç Game Server tamamlandığında:
                // Yerel fizik hesaplamalarını bırakıp doğrudan sunucunun gönderdiği
                // oyuncu ve mermi koordinatlarını gameState üzerine yazacağız.
                // Örn: gameState.players = message.state.players;
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

// Basit Çarpışma Kontrolü Fonksiyonu (AABB)
// İki dikdörtgenin birbiriyle kesişip kesişmediğini kontrol eder
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

async function startGame() {
    await loadGameAssets();
    
    // Ağ bağlantısını başlat (Arka uç henüz hazır olmasa da bağlantı denenecek)
    initNetwork();
    
    function gameLoop(timestamp) {
        const input = getInputState();
        const player = gameState.players[0];

        // --- YENİ: Oyuncu Girdilerini (Input) Sunucuya Gönder ---
        if (isConnected && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'PLAYER_INPUT',
                payload: input
            }));
        }

        // --- 1. TANK HAREKETİ VE ÇARPIŞMA (COLLISION) ---
        // NOT: İleride bu yerel fizik kodları "Client-Side Prediction" 
        // (İstemci Tahmini) için kullanılacak, nihai kararı sunucu verecek.
        const speed = 4;
        let moveX = 0;
        let moveY = 0;

        if (input.up) moveY -= 1;
        if (input.down) moveY += 1;
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;

        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }

        // Önce X Ekseninde Hareket Et ve Duvara Çarptı Mı Diye Bak
        player.x += moveX * speed;
        const playerRectX = { x: player.x - 20, y: player.y - 15, width: 40, height: 30 };
        for (const obs of gameState.obstacles) {
            if (checkCollision(playerRectX, obs)) {
                player.x -= moveX * speed; // Çarpışma varsa tankı eski X pozisyonuna geri it
                break;
            }
        }

        // Sonra Y Ekseninde Hareket Et ve Duvara Çarptı Mı Diye Bak
        player.y += moveY * speed;
        const playerRectY = { x: player.x - 20, y: player.y - 15, width: 40, height: 30 };
        for (const obs of gameState.obstacles) {
            if (checkCollision(playerRectY, obs)) {
                player.y -= moveY * speed; // Çarpışma varsa tankı eski Y pozisyonuna geri it
                break;
            }
        }

        if (moveX !== 0 || moveY !== 0) {
            player.rotation = Math.atan2(moveY, moveX);
        }

        const dx = input.mouseX - player.x;
        const dy = input.mouseY - player.y;
        player.turretRotation = Math.atan2(dy, dx);

        // --- 2. ATEŞ ETME MANTIĞI ---
        if (input.isShooting && (timestamp - lastShotTime > FIRE_RATE)) {
            const barrelOffsetX = Math.cos(player.turretRotation) * 40;
            const barrelOffsetY = Math.sin(player.turretRotation) * 40;

            const newBullet = {
                id: Math.random().toString(36).substr(2, 9),
                ownerId: player.id,
                x: player.x + barrelOffsetX,
                y: player.y + barrelOffsetY,
                rotation: player.turretRotation,
                speed: 10,
                radius: 4,
                color: '#f1c40f'
            };
            
            gameState.bullets.push(newBullet);
            lastShotTime = timestamp;
        }

        // --- 3. MERMİLERİ HAREKET ETTİR VE DUVARLARA ÇARPIŞMA KONTROLÜ ---
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = gameState.bullets[i];
            
            bullet.x += Math.cos(bullet.rotation) * bullet.speed;
            bullet.y += Math.sin(bullet.rotation) * bullet.speed;

            // Önce harita dışına çıkıp çıkmadığına bak
            let isDestroyed = (
                bullet.x < 0 || bullet.x > gameState.world.width ||
                bullet.y < 0 || bullet.y > gameState.world.height
            );

            // Harita dışına çıkmadıysa, duvarlara çarpmış mı kontrol et
            if (!isDestroyed) {
                const bulletRect = { 
                    x: bullet.x - bullet.radius, 
                    y: bullet.y - bullet.radius, 
                    width: bullet.radius * 2, 
                    height: bullet.radius * 2 
                };
                for (const obs of gameState.obstacles) {
                    if (checkCollision(bulletRect, obs)) {
                        isDestroyed = true;
                        break; // Çarptıysa diğer duvarları kontrol etmeye gerek yok
                    }
                }
            }

            // Mermi yok olması gerekiyorsa (duvara çarptı veya haritadan çıktı) sil
            if (isDestroyed) {
                gameState.bullets.splice(i, 1);
            }
        }

        // --- 4. ÇİZİM ---
        canvasRenderer.render(gameState);
        hudRenderer.render(gameState);

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}

startGame();