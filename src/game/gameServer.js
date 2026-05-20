// src/game/gameServer.js
import { WebSocketServer } from 'ws';
import { activeSessions, rooms } from '../data/store.js';

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

const FIRE_RATE = 300; 
const BULLET_SPEED = 10;
const BULLET_RADIUS = 4;

function startGameLoop(roomId, room) {
    if (room.gameInterval) return;

    console.log(`[SİSTEM] Oda ${roomId} için 60 FPS Oyun Döngüsü başlatıldı.`);
    
    room.gameInterval = setInterval(() => {
        const now = Date.now();

        Object.values(room.gameState.players).forEach(player => {
            if (player.health <= 0) return; 

            if (!player.input) return;

            const speed = 4;
            let moveX = 0;
            let moveY = 0;

            if (player.input.up) moveY -= 1;
            if (player.input.down) moveY += 1;
            if (player.input.left) moveX -= 1;
            if (player.input.right) moveX += 1;

            if (moveX !== 0 && moveY !== 0) {
                const length = Math.sqrt(moveX * moveX + moveY * moveY);
                moveX /= length;
                moveY /= length;
            }

            player.x += moveX * speed;
            const rectX = { x: player.x - 20, y: player.y - 15, width: 40, height: 30 };
            for (const obs of room.gameState.obstacles) {
                if (checkCollision(rectX, obs)) {
                    player.x -= moveX * speed;
                    break;
                }
            }

            player.y += moveY * speed;
            const rectY = { x: player.x - 20, y: player.y - 15, width: 40, height: 30 };
            for (const obs of room.gameState.obstacles) {
                if (checkCollision(rectY, obs)) {
                    player.y -= moveY * speed;
                    break;
                }
            }

            if (moveX !== 0 || moveY !== 0) {
                player.rotation = Math.atan2(moveY, moveX);
            }

            const dx = player.input.mouseX - player.x;
            const dy = player.input.mouseY - player.y;
            player.turretRotation = Math.atan2(dy, dx);

            if (player.input.isShooting && (now - player.lastShotTime > FIRE_RATE)) {
                const barrelOffsetX = Math.cos(player.turretRotation) * 40;
                const barrelOffsetY = Math.sin(player.turretRotation) * 40;

                room.gameState.bullets.push({
                    id: Math.random().toString(36).substr(2, 9),
                    ownerId: player.username, 
                    x: player.x + barrelOffsetX,
                    y: player.y + barrelOffsetY,
                    rotation: player.turretRotation,
                    speed: BULLET_SPEED,
                    radius: BULLET_RADIUS,
                    color: '#f1c40f'
                });
                
                player.lastShotTime = now;
            }
        });

        for (let i = room.gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = room.gameState.bullets[i];
            
            bullet.x += Math.cos(bullet.rotation) * bullet.speed;
            bullet.y += Math.sin(bullet.rotation) * bullet.speed;

            let isDestroyed = (
                bullet.x < 0 || bullet.x > room.gameState.world.width ||
                bullet.y < 0 || bullet.y > room.gameState.world.height
            );

            const bulletRect = { 
                x: bullet.x - bullet.radius, 
                y: bullet.y - bullet.radius, 
                width: bullet.radius * 2, 
                height: bullet.radius * 2 
            };

            if (!isDestroyed) {
                for (const obs of room.gameState.obstacles) {
                    if (checkCollision(bulletRect, obs)) {
                        isDestroyed = true;
                        break;
                    }
                }
            }

            if (!isDestroyed) {
                for (const targetName in room.gameState.players) {
                    const target = room.gameState.players[targetName];
                    
                    if (target.username !== bullet.ownerId && target.health > 0) {
                        const targetRect = { x: target.x - 20, y: target.y - 15, width: 40, height: 30 };
                        
                        if (checkCollision(bulletRect, targetRect)) {
                            isDestroyed = true;
                            target.health -= 25; 
                            
                            if (target.health <= 0) {
                                if (room.gameState.players[bullet.ownerId]) {
                                    room.gameState.players[bullet.ownerId].score += 10;
                                }
                                
                                console.log(`[SAVAŞ] ${bullet.ownerId}, ${target.username} adlı komutanı yok etti!`);
                                
                                setTimeout(() => {
                                    if (room.gameState.players[targetName]) {
                                        const p = room.gameState.players[targetName];
                                        p.health = 100;
                                        p.x = 480 + (Math.random() * 400 - 200);
                                        p.y = 270 + (Math.random() * 200 - 100);
                                        console.log(`[SAVAŞ] ${target.username} savaş alanına geri döndü!`);
                                    }
                                }, 3000);
                            }
                            break; 
                        }
                    }
                }
            }

            if (isDestroyed) {
                room.gameState.bullets.splice(i, 1);
            }
        }

        const stateToSend = {
            players: Object.values(room.gameState.players),
            bullets: room.gameState.bullets,
            obstacles: room.gameState.obstacles,
            world: room.gameState.world
        };

        const stateUpdate = JSON.stringify({
            type: 'GAME_STATE_UPDATE',
            state: stateToSend
        });

        room.clients.forEach(client => {
            if (client.readyState === 1) { 
                client.send(stateUpdate);
            }
        });

    }, 1000 / 60);
}

export function initGameServer(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        const clientUsername = url.searchParams.get('username') || 'Misafir'; // YENİ EKLENDİ

        if (!token) {
            ws.close();
            return;
        }

        // YENİ: Oturum Kurtarma Mekanizması
        // Eğer sunucu yeniden başlatıldıysa ve eski bir token geldiyse, bağlantıyı kesmek yerine oturumu kurtar.
        if (!activeSessions.has(token)) {
            console.warn(`[UYARI] Sunucu sıfırlanmış. ${clientUsername} için oturum otomatik kurtarılıyor.`);
            activeSessions.set(token, {
                username: clientUsername,
                currentRoom: 'test-room'
            });
        }

        const session = activeSessions.get(token);
        const username = session.username;
        let roomId = session.currentRoom; 

        if (!roomId || !rooms.has(roomId)) {
            roomId = 'test-room';
            if (!rooms.has(roomId)) {
                rooms.set(roomId, {}); 
            }
            session.currentRoom = roomId;
        }

        const room = rooms.get(roomId);

        if (!room.gameState) {
            room.gameState = {
                players: {},
                bullets: [],
                obstacles: [
                    { x: 150, y: 150, width: 200, height: 40, color: '#555' },
                    { x: 650, y: 150, width: 40, height: 200, color: '#555' },
                    { x: 300, y: 400, width: 300, height: 40, color: '#555' }
                ],
                world: { width: 960, height: 540 }
            };
            room.clients = new Set();
        }

        room.clients.add(ws);
        
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6'];
        const colorIndex = Object.keys(room.gameState.players).length % colors.length;

        room.gameState.players[username] = {
            id: token,
            username: username,
            x: 480 + (Math.random() * 200 - 100),
            y: 270 + (Math.random() * 100 - 50),
            rotation: 0,
            turretRotation: 0,
            health: 100,
            score: 0,
            color: colors[colorIndex],
            lastShotTime: 0, 
            input: { up: false, down: false, left: false, right: false, mouseX: 0, mouseY: 0, isShooting: false }
        };

        console.log(`[WEBSOCKET] [Bağlandı]: Komutan ${username}, ${roomId} odasına katıldı!`);

        startGameLoop(roomId, room);

        ws.on('message', (messageAsString) => {
            try {
                const message = JSON.parse(messageAsString);
                
                if (message.type === 'PLAYER_INPUT') {
                    if (room.gameState.players[username]) {
                        room.gameState.players[username].input = message.payload;
                    }
                }
            } catch (error) {
                console.error('[WEBSOCKET] Mesaj işleme hatası:', error);
            }
        });

        ws.on('close', () => {
            console.log(`[WEBSOCKET] [Koptu]: Komutan ${username} ayrıldı.`);
            room.clients.delete(ws);
            delete room.gameState.players[username];
            
            if (room.clients.size === 0 && room.gameInterval) {
                clearInterval(room.gameInterval);
                room.gameInterval = null;
            }
        });
    });

    console.log('[SİSTEM] WebSocket (Game Server) başlatıldı ve bağlantıları bekliyor.');
}   