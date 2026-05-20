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
const POWERUP_DURATION = 8000; // YENİ: Özellikler tam 8 saniye sürecek

const ITEM_TYPES = ['HOMING_MISSILE', 'RAPID_FIRE', 'TURBO_DRIVE', 'AOE_EXPLOSION', 'CLUSTER_BOMB', 'BOUNCING_BULLET', 'GHOST_BULLET', 'SHIELD'];
const ITEM_SPAWN_INTERVAL = 15000;

function startGameLoop(roomId, room) {
    if (room.gameInterval) return;

    console.log(`[SİSTEM] Oda ${roomId} için 60 FPS Oyun Döngüsü başlatıldı.`);
    
    room.gameInterval = setInterval(() => {
        const now = Date.now();

        // 1. ÖZEL GÜÇ ÜRETME SİSTEMİ
        if (now - room.gameState.lastItemSpawnTime > ITEM_SPAWN_INTERVAL) {
            let isSafe = false;
            let spawnX, spawnY;
            const radius = 15;
            const itemRect = { width: radius * 2, height: radius * 2 };
            
            let attempts = 0;
            while (!isSafe && attempts < 50) {
                spawnX = Math.random() * (room.gameState.world.width - radius * 4) + radius * 2;
                spawnY = Math.random() * (room.gameState.world.height - radius * 4) + radius * 2;
                itemRect.x = spawnX - radius;
                itemRect.y = spawnY - radius;

                isSafe = true;
                for (const obs of room.gameState.obstacles) {
                    if (checkCollision(itemRect, obs)) {
                        isSafe = false;
                        break;
                    }
                }
                attempts++;
            }

            if (isSafe) {
                const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
                room.gameState.activeItems.push({
                    id: `item_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                    type: type,
                    x: spawnX,
                    y: spawnY,
                    radius: radius
                });
                console.log(`[SİSTEM] Haritada yeni özellik belirdi: ${type}`);
            }
            room.gameState.lastItemSpawnTime = now;
        }

        // 2. OYUNCU (TANK) HAREKET VE ATEŞLEME KONTROLLERİ
        Object.values(room.gameState.players).forEach(player => {
            if (player.health <= 0) return; 
            if (!player.input) return;

            // --- YENİ: GÜÇ SÜRESİ KONTROLÜ (8 Saniye doldu mu?) ---
            if (player.powerUp && now > player.powerUp.expiresAt) {
                console.log(`[SİSTEM] ${player.username} komutanın ${player.powerUp.type} özelliği bitti.`);
                player.powerUp = null; 
            }

            // --- YENİ: TURBO_DRIVE Hızlandırması ---
            let speed = 4;
            if (player.powerUp && player.powerUp.type === 'TURBO_DRIVE') {
                speed = 6; // %50 artış
            }

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

            // --- YENİ: RAPID_FIRE Seri Ateşleme ---
            let currentFireRate = FIRE_RATE;
            if (player.powerUp && player.powerUp.type === 'RAPID_FIRE') {
                currentFireRate = FIRE_RATE * 0.25; // %75 bekleme süresi azalır
            }

            if (player.input.isShooting && (now - player.lastShotTime > currentFireRate)) {
                const barrelOffsetX = Math.cos(player.turretRotation) * 40;
                const barrelOffsetY = Math.sin(player.turretRotation) * 40;

                // Mermiye tankın mevcut gücünü (özelliğini) aktar
                let bulletType = 'NORMAL';
                if (player.powerUp && ['GHOST_BULLET', 'HOMING_MISSILE', 'AOE_EXPLOSION', 'CLUSTER_BOMB', 'BOUNCING_BULLET'].includes(player.powerUp.type)) {
                    bulletType = player.powerUp.type;
                }

                room.gameState.bullets.push({
                    id: Math.random().toString(36).substr(2, 9),
                    ownerId: player.username,
                    type: bulletType, // Mermi tipi eklendi
                    x: player.x + barrelOffsetX,
                    y: player.y + barrelOffsetY,
                    rotation: player.turretRotation,
                    speed: BULLET_SPEED,
                    radius: BULLET_RADIUS,
                    color: bulletType === 'NORMAL' ? '#f1c40f' : '#ff4757' // Özel mermiler kırmızı görünsün
                });
                
                player.lastShotTime = now;
            }

            // ÖZEL GÜÇ TOPLAMA (ÇARPIŞMA)
            const playerRectForItems = { x: player.x - 20, y: player.y - 15, width: 40, height: 30 };
            for (let i = room.gameState.activeItems.length - 1; i >= 0; i--) {
                const item = room.gameState.activeItems[i];
                const itemRect = { x: item.x - item.radius, y: item.y - item.radius, width: item.radius * 2, height: item.radius * 2 };
                
                if (checkCollision(playerRectForItems, itemRect)) {
                    console.log(`[GÜÇ] ${player.username}, ${item.type} özelliğini aldı! (8 saniye)`);
                    
                    // --- YENİ: GÜCÜ TANKA AKTAR VE SÜRE BAŞLAT ---
                    player.powerUp = {
                        type: item.type,
                        expiresAt: now + POWERUP_DURATION
                    };
                    
                    room.gameState.activeItems.splice(i, 1);
                }
            }
        });

        // 3. MERMİ FİZİĞİ VE GÜÇ ETKİLERİ
        for (let i = room.gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = room.gameState.bullets[i];
            
            // --- YENİ: HOMING_MISSILE (Güdümlü Füze) Yönelme Mantığı ---
            if (bullet.type === 'HOMING_MISSILE') {
                let nearestDist = Infinity;
                let targetPlayer = null;
                for (const pName in room.gameState.players) {
                    const p = room.gameState.players[pName];
                    if (p.username !== bullet.ownerId && p.health > 0) {
                        const dist = Math.hypot(p.x - bullet.x, p.y - bullet.y);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            targetPlayer = p;
                        }
                    }
                }
                if (targetPlayer) {
                    const desiredRotation = Math.atan2(targetPlayer.y - bullet.y, targetPlayer.x - bullet.x);
                    // Mermi hedefe doğru yavaşça kavis çizer (0.05 katsayısı)
                    const angleDiff = Math.atan2(Math.sin(desiredRotation - bullet.rotation), Math.cos(desiredRotation - bullet.rotation));
                    bullet.rotation += angleDiff * 0.05; 
                }
            }

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

            // --- YENİ: DUVAR ÇARPIŞMASI (GHOST VE BOUNCING) ---
            if (!isDestroyed && bullet.type !== 'GHOST_BULLET') { // Ghost duvarı pas geçer
                for (const obs of room.gameState.obstacles) {
                    if (checkCollision(bulletRect, obs)) {
                        if (bullet.type === 'BOUNCING_BULLET') {
                            // Sekme Fiziği (Basit AABB yansıması)
                            const overlapX = Math.min(bulletRect.x + bulletRect.width - obs.x, obs.x + obs.width - bulletRect.x);
                            const overlapY = Math.min(bulletRect.y + bulletRect.height - obs.y, obs.y + obs.height - bulletRect.y);
                            
                            let vx = Math.cos(bullet.rotation) * bullet.speed;
                            let vy = Math.sin(bullet.rotation) * bullet.speed;
                            
                            if (overlapX < overlapY) vx *= -1; // X ekseninde sek
                            else vy *= -1; // Y ekseninde sek
                            
                            bullet.rotation = Math.atan2(vy, vx);
                            bullet.x += vx; // Duvara sıkışmayı engellemek için it
                            bullet.y += vy;
                        } else {
                            isDestroyed = true;
                        }
                        break;
                    }
                }
            }

            // TANK ÇARPIŞMASI
            if (!isDestroyed) {
                for (const targetName in room.gameState.players) {
                    const target = room.gameState.players[targetName];
                    
                    if (target.username !== bullet.ownerId && target.health > 0) {
                        const targetRect = { x: target.x - 20, y: target.y - 15, width: 40, height: 30 };
                        
                        if (checkCollision(bulletRect, targetRect)) {
                            isDestroyed = true;
                            
                            // --- YENİ: SHIELD (Kalkan) KONTROLÜ ---
                            if (target.powerUp && target.powerUp.type === 'SHIELD') {
                                console.log(`[SAVAŞ] ${target.username} kalkanı sayesinde hasar almadı! Kalkan kırıldı.`);
                                target.powerUp = null; // Hasar alma, ama kalkan kırılsın
                            } else {
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
                                            p.powerUp = null; // Ölünce üstündeki gücü temizle
                                            p.x = 480 + (Math.random() * 400 - 200);
                                            p.y = 270 + (Math.random() * 200 - 100);
                                        }
                                    }, 3000);
                                }
                            }
                            break; 
                        }
                    }
                }
            }

            // --- YENİ: AOE_EXPLOSION (Alan Hasarı) ---
            if (isDestroyed) {
                if (bullet.type === 'AOE_EXPLOSION') {
                    const explosionRadius = 80;
                    for (const pName in room.gameState.players) {
                        const p = room.gameState.players[pName];
                        if (p.health > 0) {
                            const dist = Math.hypot(p.x - bullet.x, p.y - bullet.y);
                            if (dist < explosionRadius) {
                                // Merkeze yakın olan daha çok hasar alır
                                const aoeDamage = 35 * (1 - dist / explosionRadius);
                                if (p.powerUp && p.powerUp.type === 'SHIELD') {
                                    p.powerUp = null; // Kalkana çarptıysa kalkan kırılır
                                } else {
                                    p.health -= aoeDamage;
                                }
                            }
                        }
                    }
                }
                
                room.gameState.bullets.splice(i, 1);
            }
        }

        const stateToSend = {
            players: Object.values(room.gameState.players),
            bullets: room.gameState.bullets,
            obstacles: room.gameState.obstacles,
            activeItems: room.gameState.activeItems, 
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
        const clientUsername = url.searchParams.get('username') || 'Misafir'; 

        if (!token) {
            ws.close();
            return;
        }

        if (!activeSessions.has(token)) {
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
                activeItems: [], 
                lastItemSpawnTime: Date.now(), 
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
            powerUp: null, // Tank doğduğunda güç sıfırlanır
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
            room.clients.delete(ws);
            delete room.gameState.players[username];
            
            if (room.clients.size === 0 && room.gameInterval) {
                clearInterval(room.gameInterval);
                room.gameInterval = null;
            }
        });
    });
}