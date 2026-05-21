// src/game/gameServer.js
import { WebSocketServer } from 'ws';
import { activeSessions, rooms } from '../data/store.js';
import { MAPS } from './maps.js';

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function getSafeSpawnPosition(room) {
    let isSafe = false;
    let safeX, safeY;
    let attempts = 0;
    
    while (!isSafe && attempts < 100) {
        safeX = Math.random() * (room.gameState.world.width - 150) + 75;
        safeY = Math.random() * (room.gameState.world.height - 150) + 75;
        isSafe = true;
        
        const playerRect = { x: safeX - 20, y: safeY - 15, width: 40, height: 30 };
        for (const obs of room.gameState.obstacles) {
            if (checkCollision(playerRect, obs)) {
                isSafe = false;
                break;
            }
        }
        attempts++;
    }
    return { x: safeX, y: safeY };
}

function changeMap(room) {
    // 1. Rastgele harita seç
    const mapNames = Object.keys(MAPS);
    const randomName = mapNames[Math.floor(Math.random() * mapNames.length)];
    const selectedMap = MAPS[randomName];
    
    // 2. Harita verilerini güncelle
    room.gameState.obstacles = JSON.parse(JSON.stringify(selectedMap.obstacles)); // Derin kopya al ki orijinalleri bozulmasın
    room.gameState.world = selectedMap.world;
    
    // 3. KRİTİK: Harita değişince mermileri ve yerdeki item'ları temizle
    room.gameState.bullets = []; 
    room.gameState.activeItems = [];
    room.gameState.lastItemSpawnTime = Date.now(); // Bir sonraki spawn zamanını sıfırla

    // 4. Oyuncuları güvenli yere ışınla ve güçlerini sıfırla (Map değişince güçler gitsin)
    Object.values(room.gameState.players).forEach(p => {
        const spawnPos = getSafeSpawnPosition(room);
        p.x = spawnPos.x;
        p.y = spawnPos.y;
        p.health = 100;
        p.powerUp = null; // Harita değiştiğinde güçler sıfırlanmalı
        resetAmmo(p);
    });

    // 5. Herkese bilgi gönder
    const updateMsg = JSON.stringify({ 
        type: 'MAP_CHANGED', 
        payload: {
            obstacles: room.gameState.obstacles,
            world: room.gameState.world
        } 
    });
    room.clients.forEach(c => { if(c.readyState === 1) c.send(updateMsg); });
    
    console.log(`[SİSTEM] Harita ${randomName} olarak değiştirildi.`);
}

const FIRE_RATE = 300; 
const BULLET_SPEED = 10;
const BULLET_RADIUS = 4;
const POWERUP_DURATION = 8000;
const MAX_AMMO = 7;
const RELOAD_DURATION = 1000;
const STATE_BROADCAST_INTERVAL = 1000 / 30;

const ITEM_TYPES = ['HOMING_MISSILE', 'RAPID_FIRE', 'TURBO_DRIVE', 'AOE_EXPLOSION', 'CLUSTER_BOMB', 'BOUNCING_BULLET', 'GHOST_BULLET', 'SHIELD'];
const ITEM_SPAWN_INTERVAL = 15000;

function ensureAmmoState(player) {
    if (!Number.isFinite(player.maxAmmo)) player.maxAmmo = MAX_AMMO;
    if (!Number.isFinite(player.ammo)) player.ammo = player.maxAmmo;
    if (typeof player.isReloading !== 'boolean') player.isReloading = false;
    if (!Number.isFinite(player.reloadEndsAt)) player.reloadEndsAt = 0;
}

function resetAmmo(player) {
    player.maxAmmo = MAX_AMMO;
    player.ammo = MAX_AMMO;
    player.isReloading = false;
    player.reloadEndsAt = 0;
}

function startReload(player, now) {
    ensureAmmoState(player);
    if (player.isReloading || player.ammo >= player.maxAmmo) return;

    player.isReloading = true;
    player.reloadEndsAt = now + RELOAD_DURATION;
}

function startGameLoop(roomId, room) {
    if (room.gameInterval) return;

    console.log(`[SİSTEM] Oda ${roomId} için 60 FPS Oyun Döngüsü başlatıldı.`);
    
    let lastStateBroadcastTime = 0;

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
            ensureAmmoState(player);
            if (player.health <= 0) return; 
            if (!player.input) return;

            if (player.isReloading && now >= player.reloadEndsAt) {
                resetAmmo(player);
            }

            if (player.input.reloadRequested && player.ammo > 0 && player.ammo < player.maxAmmo) {
                startReload(player, now);
            }

            // GÜÇ SÜRESİ KONTROLÜ
            if (player.powerUp && now > player.powerUp.expiresAt) {
                console.log(`[SİSTEM] ${player.username} komutanın ${player.powerUp.type} özelliği bitti.`);
                player.powerUp = null; 
            }

            // TURBO_DRIVE Hızlandırması
            let speed = 4;
            if (player.powerUp && player.powerUp.type === 'TURBO_DRIVE') {
                speed = 6;
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

            // HARİTA SINIRI KONTROLÜ (X EKSENİ)
            player.x += moveX * speed;
            player.x = Math.max(20, Math.min(room.gameState.world.width - 20, player.x));
            
            const rectX = { x: player.x - 20, y: player.y - 15, width: 40, height: 30 };
            for (const obs of room.gameState.obstacles) {
                if (checkCollision(rectX, obs)) {
                    player.x -= moveX * speed;
                    break;
                }
            }

            // HARİTA SINIRI KONTROLÜ (Y EKSENİ)
            player.y += moveY * speed;
            player.y = Math.max(20, Math.min(room.gameState.world.height - 20, player.y));
            
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

            // RAPID_FIRE Seri Ateşleme
            let currentFireRate = FIRE_RATE;
            if (player.powerUp && player.powerUp.type === 'RAPID_FIRE') {
                currentFireRate = FIRE_RATE * 0.65; 
            }

            if (player.input.isShooting && !player.isReloading && player.ammo > 0 && (now - player.lastShotTime > currentFireRate)) {
                const barrelOffsetX = Math.cos(player.turretRotation) * 40;
                const barrelOffsetY = Math.sin(player.turretRotation) * 40;

                let bulletType = 'NORMAL';
                if (player.powerUp && ['GHOST_BULLET', 'HOMING_MISSILE', 'AOE_EXPLOSION', 'CLUSTER_BOMB', 'BOUNCING_BULLET'].includes(player.powerUp.type)) {
                    bulletType = player.powerUp.type;
                }

                room.gameState.bullets.push({
                    id: Math.random().toString(36).substr(2, 9),
                    ownerId: player.username,
                    type: bulletType, 
                    x: player.x + barrelOffsetX,
                    y: player.y + barrelOffsetY,
                    rotation: player.turretRotation,
                    speed: BULLET_SPEED,
                    radius: BULLET_RADIUS,
                    lifeTime: 3000, // MERMİ YAŞAM SÜRESİ (5 saniye)
                    color: bulletType === 'NORMAL' ? '#f1c40f' : '#ff4757' 
                });
                
                player.lastShotTime = now;
                player.ammo -= 1;

                if (player.ammo <= 0) {
                    player.ammo = 0;
                    startReload(player, now);
                }
            }

            // ÖZEL GÜÇ TOPLAMA
            const playerRectForItems = { x: player.x - 20, y: player.y - 15, width: 40, height: 30 };
            for (let i = room.gameState.activeItems.length - 1; i >= 0; i--) {
                const item = room.gameState.activeItems[i];
                const itemRect = { x: item.x - item.radius, y: item.y - item.radius, width: item.radius * 2, height: item.radius * 2 };
                
                if (checkCollision(playerRectForItems, itemRect)) {
                    console.log(`[GÜÇ] ${player.username}, ${item.type} özelliğini aldı!`);
                    player.powerUp = { type: item.type, expiresAt: now + POWERUP_DURATION };
                    room.gameState.activeItems.splice(i, 1);
                }
            }
        });

        // 3. MERMİ FİZİĞİ VE GÜÇ ETKİLERİ
        let shouldChangeMap = false;
        for (let i = room.gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = room.gameState.bullets[i];
            if (!bullet) continue;

            let isDestroyed = false;

            // Mermi Ömrü
            if (bullet.lifeTime !== undefined) {
                bullet.lifeTime -= 16.6; 
                if (bullet.lifeTime <= 0) isDestroyed = true;
            }

            // HOMING_MISSILE Yönelme
            if (!isDestroyed && bullet.type === 'HOMING_MISSILE') {
                let nearestDist = Infinity;
                let targetPlayer = null;
                for (const pName in room.gameState.players) {
                    const p = room.gameState.players[pName];
                    if (p.username !== bullet.ownerId && p.health > 0) {
                        const dist = Math.hypot(p.x - bullet.x, p.y - bullet.y);
                        if (dist < nearestDist) { nearestDist = dist; targetPlayer = p; }
                    }
                }
                if (targetPlayer) {
                    const desiredRotation = Math.atan2(targetPlayer.y - bullet.y, targetPlayer.x - bullet.x);
                    const angleDiff = Math.atan2(Math.sin(desiredRotation - bullet.rotation), Math.cos(desiredRotation - bullet.rotation));
                    bullet.rotation += angleDiff * 0.09; 
                }
            }

            if (!isDestroyed) {
                bullet.x += Math.cos(bullet.rotation) * bullet.speed;
                bullet.y += Math.sin(bullet.rotation) * bullet.speed;

                if (bullet.x < 0 || bullet.x > room.gameState.world.width || bullet.y < 0 || bullet.y > room.gameState.world.height) {
                    isDestroyed = true;
                }
            }

            const bulletRect = { x: bullet.x - bullet.radius, y: bullet.y - bullet.radius, width: bullet.radius * 2, height: bullet.radius * 2 };

            // DUVAR ÇARPIŞMASI
            if (!isDestroyed && bullet.type !== 'GHOST_BULLET') { 
                for (const obs of room.gameState.obstacles) {
                    if (checkCollision(bulletRect, obs)) {
                        if (bullet.type === 'BOUNCING_BULLET') {
                            const overlapX = Math.min(bulletRect.x + bulletRect.width - obs.x, obs.x + obs.width - bulletRect.x);
                            const overlapY = Math.min(bulletRect.y + bulletRect.height - obs.y, obs.y + obs.height - bulletRect.y);
                            
                            let vx = Math.cos(bullet.rotation) * bullet.speed;
                            let vy = Math.sin(bullet.rotation) * bullet.speed;
                            
                            if (overlapX < overlapY) vx *= -1; 
                            else vy *= -1;
                            
                            bullet.rotation = Math.atan2(vy, vx);
                            bullet.x += vx; 
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
                            
                            if (bullet.type !== 'AOE_EXPLOSION' && bullet.type !== 'CLUSTER_BOMB') {
                                if (target.powerUp && target.powerUp.type === 'SHIELD') {
                                    target.powerUp = null; 
                                } else {
                                    target.health -= 25; 
                                    
                                    if (target.health <= 0) {
                                        if (room.gameState.players[bullet.ownerId]) room.gameState.players[bullet.ownerId].score += 10;
                                        
                                        const explosionEvent = JSON.stringify({
                                            type: 'EXPLOSION',
                                            payload: { x: target.x, y: target.y, expType: 'NORMAL' }
                                        });
                                        room.clients.forEach(c => { if (c.readyState === 1) c.send(explosionEvent); });

                                        console.log("[SİSTEM] Bir komutan düştü, harita değiştiriliyor...");
                                        shouldChangeMap = true;
                                    }
                                }
                            }
                            break; 
                        }
                    }
                }
            }

            // PATLAMA VE ŞARAPNEL
            if (isDestroyed) {
                if (bullet.type === 'AOE_EXPLOSION' || bullet.type === 'CLUSTER_BOMB') {
                    const expType = bullet.type === 'AOE_EXPLOSION' ? 'AOE' : 'CLUSTER';
                    const explosionEvent = JSON.stringify({ type: 'EXPLOSION', payload: { x: bullet.x, y: bullet.y, expType: expType } });
                    room.clients.forEach(c => { if (c.readyState === 1) c.send(explosionEvent); });
                }

                if (bullet.type === 'AOE_EXPLOSION') {
                    const explosionRadius = 120;
                    for (const pName in room.gameState.players) {
                        const p = room.gameState.players[pName];
                        if (p.health > 0) {
                            const dist = Math.hypot(p.x - bullet.x, p.y - bullet.y);
                            if (dist < explosionRadius) {
                                const aoeDamage = 45 * (1 - dist / explosionRadius);
                                if (p.powerUp && p.powerUp.type === 'SHIELD') p.powerUp = null; 
                                else {
                                    p.health -= aoeDamage;
                                    if(p.health <= 0 && room.gameState.players[bullet.ownerId]) {
                                        room.gameState.players[bullet.ownerId].score += 10;
                                        setTimeout(() => {
                                            if (room.gameState.players[pName]) {
                                                const rp = room.gameState.players[pName];
                                                const respawnPos = getSafeSpawnPosition(room);
                                                rp.health = 100; rp.powerUp = null;
                                                resetAmmo(rp);
                                                rp.x = respawnPos.x; rp.y = respawnPos.y;
                                            }
                                        }, 1000);
                                    }
                                }
                            }
                        }
                    }
                }

                if (bullet.type === 'CLUSTER_BOMB') {
                    for (let j = 0; j < 8; j++) {
                        let angle = (Math.PI / 4) * j; 
                        room.gameState.bullets.push({
                            id: Math.random().toString(36).substr(2, 9),
                            ownerId: bullet.ownerId, type: 'NORMAL', x: bullet.x, y: bullet.y,
                            rotation: angle, speed: BULLET_SPEED * 0.8, radius: BULLET_RADIUS, color: '#e67e22', lifeTime: 5000
                        });
                    }
                }
                
                room.gameState.bullets.splice(i, 1); 
            }
        }

        if (shouldChangeMap) {
            changeMap(room);
        }

        if (shouldChangeMap || now - lastStateBroadcastTime >= STATE_BROADCAST_INTERVAL) {
            lastStateBroadcastTime = now;

            const stateToSend = {
                players: Object.values(room.gameState.players),
                bullets: room.gameState.bullets,
                obstacles: room.gameState.obstacles,
                activeItems: room.gameState.activeItems,
                world: room.gameState.world,
                serverTime: now
            };

            room.clients.forEach(client => {
                if (client.readyState === 1) client.send(JSON.stringify({ type: 'GAME_STATE_UPDATE', state: stateToSend }));
            });
        }

    }, 1000 / 60);
}

export function initGameServer(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        const requestedRoomId = url.searchParams.get('roomId');
        const requestedGameId = url.searchParams.get('gameId');
        const clientUsername = url.searchParams.get('username') || 'Misafir'; 

        if (!token) { ws.close(); return; }

        if (!activeSessions.has(token)) {
            if (requestedRoomId || requestedGameId) {
                ws.close();
                return;
            }

            activeSessions.set(token, { username: clientUsername, currentRoom: 'test-room' });
        }

        const session = activeSessions.get(token);
        const username = session.username;
        let roomId = session.currentRoom;

        if (requestedRoomId || requestedGameId) {
            if (!requestedRoomId || !requestedGameId) {
                ws.close();
                return;
            }

            if (session.currentRoom !== requestedRoomId || !rooms.has(requestedRoomId)) {
                ws.close();
                return;
            }

            const requestedRoom = rooms.get(requestedRoomId);
            if (requestedRoom.status !== 'playing' || requestedRoom.gameId !== requestedGameId) {
                ws.close();
                return;
            }

            roomId = requestedRoomId;
        }

        if (!roomId || !rooms.has(roomId)) {
            roomId = 'test-room';
            if (!rooms.has(roomId)) rooms.set(roomId, {}); 
            session.currentRoom = roomId;
        }

        const room = rooms.get(roomId);

        if (!room.gameState) {
            room.gameState = {
                players: {}, bullets: [], activeItems: [], lastItemSpawnTime: Date.now(), 
                obstacles: [
                    // 1. DIŞ ÇERÇEVE (Harita Sınırları)
                    { x: 0, y: 0, width: 1920, height: 20 },
                    { x: 0, y: 1060, width: 1920, height: 20 },
                    { x: 0, y: 0, width: 20, height: 1080 },
                    { x: 1900, y: 0, width: 20, height: 1080 },
                    
                    // 2. MERKEZ ARENA (Kritik Çatışma Alanı)
                    { x: 860, y: 400, width: 200, height: 280 }, 
                    
                    // 3. YATAY KORİDORLAR
                    { x: 200, y: 250, width: 400, height: 40 },
                    { x: 1320, y: 250, width: 400, height: 40 },
                    { x: 200, y: 790, width: 400, height: 40 },
                    { x: 1320, y: 790, width: 400, height: 40 },
                    
                    // 4. DİKEY YOLLAR
                    { x: 400, y: 350, width: 40, height: 380 },
                    { x: 1480, y: 350, width: 40, height: 380 },
                    
                    // 5. BOĞAZ VE SİPER NOKTALARI
                    { x: 700, y: 100, width: 40, height: 200 },
                    { x: 1180, y: 100, width: 40, height: 200 },
                    { x: 700, y: 780, width: 40, height: 200 },
                    { x: 1180, y: 780, width: 40, height: 200 },
                    
                    // 6. EKSTRA LABİRENT BLOKLARI
                    { x: 940, y: 150, width: 40, height: 150 },
                    { x: 940, y: 780, width: 40, height: 150 },
                    { x: 200, y: 520, width: 150, height: 40 },
                    { x: 1570, y: 520, width: 150, height: 40 }
                ],
                world: { width: 1920, height: 1080 } 
            };
            room.clients = new Set();
        }

        room.clients.add(ws);
        
        const colors = ['blue', 'red', 'green', 'grey']; 
        const colorIndex = Object.keys(room.gameState.players).length % colors.length;
        const spawnPos = getSafeSpawnPosition(room);

        room.gameState.players[username] = {
            id: token, username: username, x: spawnPos.x, y: spawnPos.y, rotation: 0, turretRotation: 0, health: 100, score: 0, powerUp: null, color: colors[colorIndex], lastShotTime: 0, ammo: MAX_AMMO, maxAmmo: MAX_AMMO, isReloading: false, reloadEndsAt: 0, input: { up: false, down: false, left: false, right: false, mouseX: 0, mouseY: 0, isShooting: false, reloadRequested: false }
        };

        startGameLoop(roomId, room);

        ws.on('message', (messageAsString) => {
            try {
                const message = JSON.parse(messageAsString);
                if (message.type === 'PLAYER_INPUT' && room.gameState.players[username]) room.gameState.players[username].input = message.payload;
            } catch (error) {}
        });

        ws.on('close', () => {
            room.clients.delete(ws);
            delete room.gameState.players[username];
            if (room.clients.size === 0 && room.gameInterval) { clearInterval(room.gameInterval); room.gameInterval = null; }
        });
    });
}
