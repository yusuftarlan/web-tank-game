// public/js/render/canvasRenderer.js
import { getImage } from '../assets/assetLoader.js'; 
import { CAMERA_ZOOM } from './cameraConfig.js';

const ITEM_VISUALS = {
    'HOMING_MISSILE': { emoji: '🎯', color: '#ff4757' },
    'RAPID_FIRE': { emoji: '🔫', color: '#ffa502' },
    'GHOST_BULLET': { emoji: '👻', color: '#747d8c' },
    'TURBO_DRIVE': { emoji: '⚡', color: '#1e90ff' },
    'AOE_EXPLOSION': { emoji: '💣', color: '#ff6348' },
    'CLUSTER_BOMB': { emoji: '💥', color: '#ff7f50' },
    'BOUNCING_BULLET': { emoji: '🪃', color: '#2ed573' },
    'SHIELD': { emoji: '🛡️', color: '#3498db'}
};

const SPRITE_UP_TO_RIGHT_OFFSET = Math.PI / 2;
const ROTATION_SMOOTHING = 0.35;

function normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function smoothAngle(current, target) {
    if (!Number.isFinite(current)) return target;
    return normalizeAngle(current + normalizeAngle(target - current) * ROTATION_SMOOTHING);
}

export function createCanvasRenderer(canvas, options = {}) {
    const context = canvas.getContext('2d');
    const playerRenderAngles = new Map();
    let wallPattern = null;
    let wallPatternImage = null;
    const cameraMode = options.cameraMode || 'follow-player';

    function getWallPattern(wallImg) {
        if (!wallImg || !wallImg.complete || wallImg.naturalWidth === 0) return null;
        if (wallPattern && wallPatternImage === wallImg) return wallPattern;

        wallPattern = context.createPattern(wallImg, 'repeat');
        wallPatternImage = wallImg;
        return wallPattern;
    }

    return {
        render(gameState, activeExplosions = [], localPlayerUsername, feedback = {}) {
            if (!gameState) return;

            const players = Array.isArray(gameState.players) ? gameState.players : [];
            const bullets = Array.isArray(gameState.bullets) ? gameState.bullets : [];
            const obstacles = Array.isArray(gameState.obstacles) ? gameState.obstacles : [];
            const activeItems = Array.isArray(gameState.activeItems) ? gameState.activeItems : [];
            const world = gameState.world || { width: canvas.width, height: canvas.height };

            context.clearRect(0, 0, canvas.width, canvas.height);

            // Yerel oyuncuyu bul (Kamera odağı için)
            const localPlayer = players.find(p => p.username === localPlayerUsername);
            const cameraShake = feedback.cameraShake || { x: 0, y: 0 };
            
            context.save();
            
            if (cameraMode === 'full-map') {
                context.scale(canvas.width / world.width, canvas.height / world.height);
            } else if (localPlayer) {
                // Kamerayı oyuncunun üzerine merkezle
                context.translate(canvas.width / 2 + cameraShake.x, canvas.height / 2 + cameraShake.y);
                context.scale(CAMERA_ZOOM, CAMERA_ZOOM);
                context.translate(-localPlayer.x, -localPlayer.y);
            }

            // Arka planı Full Dünya boyutunda çiz
            context.fillStyle = '#2b2b2b';
            context.fillRect(0, 0, world.width, world.height);

            // 1. ENGELLERİ (DUVARLARI) ASSET İLE ÇİZ
            if (obstacles.length > 0) {
                const pattern = getWallPattern(getImage('wall'));
                obstacles.forEach(obs => {
                    if (pattern) {
                        context.save();
                        context.translate(obs.x, obs.y);
                        context.fillStyle = pattern;
                        context.fillRect(0, 0, obs.width, obs.height);
                        context.restore();

                        context.strokeStyle = '#111';
                        context.lineWidth = 2;
                        context.strokeRect(obs.x, obs.y, obs.width, obs.height);
                    } else {
                        context.fillStyle = obs.color || '#555';
                        context.fillRect(obs.x, obs.y, obs.width, obs.height);
                    }
                });
            }

            // 2. YERDEKİ ÖZEL GÜÇLERİ ÇİZ
            if (activeItems.length > 0) {
                activeItems.forEach(item => {
                    const visual = ITEM_VISUALS[item.type] || { emoji: '❓', color: '#ffffff' };
                    const radius = item.radius || 15;

                    context.beginPath();
                    context.arc(item.x, item.y, radius, 0, Math.PI * 2);
                    context.fillStyle = visual.color;
                    context.fill();
                    context.strokeStyle = '#2f3542';
                    context.lineWidth = 2;
                    context.stroke();
                    context.closePath();

                    context.font = `${radius}px Arial`;
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText(visual.emoji, item.x, item.y + 1); 
                });
            }

            // 3. OYUNCULARI (TANKLARI) ÇİZ
            const visiblePlayerKeys = new Set();

            players.forEach(player => {
                const playerKey = player.username || player.id;
                visiblePlayerKeys.add(playerKey);

                const previousAngles = playerRenderAngles.get(playerKey) || {};
                const displayBodyRotation = smoothAngle(previousAngles.rotation, player.rotation || 0);
                const displayTurretRotation = smoothAngle(previousAngles.turretRotation, player.turretRotation || 0);

                playerRenderAngles.set(playerKey, {
                    rotation: displayBodyRotation,
                    turretRotation: displayTurretRotation
                });

                context.save();
                context.translate(player.x, player.y);

                if (player.powerUp) {
                    if (player.powerUp.type === 'SHIELD') {
                        context.beginPath();
                        context.arc(0, 0, 35, 0, Math.PI * 2);
                        context.fillStyle = 'rgba(52, 152, 219, 0.3)';
                        context.fill();
                        context.strokeStyle = '#3498db';
                        context.lineWidth = 2;
                        context.stroke();
                    } else if (player.powerUp.type === 'TURBO_DRIVE') {
                        context.beginPath();
                        context.arc(0, 0, 32, 0, Math.PI * 2);
                        context.strokeStyle = 'rgba(230, 126, 34, 0.8)';
                        context.lineWidth = 3;
                        context.setLineDash([10, 15]); 
                        context.stroke();
                        context.setLineDash([]); 
                    } else if (player.powerUp.type === 'RAPID_FIRE') {
                        context.beginPath();
                        context.arc(0, 0, 28, 0, Math.PI * 2);
                        context.shadowBlur = 20;
                        context.shadowColor = '#f1c40f';
                        context.strokeStyle = '#f1c40f';
                        context.lineWidth = 2;
                        context.stroke();
                        context.shadowBlur = 0; 
                    }
                }

                // Tank Gövdesi
                context.save();
                const tankImg = getImage(`tank-${player.color}`);
                if (tankImg && tankImg.complete && tankImg.naturalWidth !== 0) {
                    context.rotate(displayBodyRotation + SPRITE_UP_TO_RIGHT_OFFSET);
                    context.drawImage(tankImg, -25, -25, 50, 50);
                } else {
                    context.rotate(displayBodyRotation);
                    context.fillStyle = player.color || '#3498db';
                    context.fillRect(-20, -15, 40, 30);
                }
                context.restore();

                // Namlu (Gun_01_A)
                context.save();
                context.rotate(displayTurretRotation + SPRITE_UP_TO_RIGHT_OFFSET);
                context.beginPath();
                context.arc(0, 0, 10, 0, Math.PI * 2); // Namlunun döndüğü yere küçük bir gri kapak
                context.fillStyle = '#7f8c8d'; // Tankın gövde tonuna yakın bir gri
                context.fill(); 
                const turretImg = getImage('turret');
                if (turretImg && turretImg.complete && turretImg.naturalWidth !== 0) {
                    context.drawImage(turretImg, -6, -31, 12, 37);
                } else {
                    context.fillStyle = '#7f8c8d';
                    context.fillRect(-4, 0, 8, -35);
                }
                context.restore();
                context.restore();

                // İsim ve Can barları dünya koordinatlarında tankın üstünde kalır
                context.fillStyle = '#ecf0f1';
                context.font = '14px Arial';
                context.textAlign = 'center';
                context.fillText(player.username, player.x, player.y - 45);

                context.fillStyle = '#e74c3c';
                context.fillRect(player.x - 20, player.y - 35, 40, 5);
                context.fillStyle = '#2ecc71';
                context.fillRect(player.x - 20, player.y - 35, 40 * (player.health / 100), 5);
            });

            playerRenderAngles.forEach((_, playerKey) => {
                if (!visiblePlayerKeys.has(playerKey)) {
                    playerRenderAngles.delete(playerKey);
                }
            });

            // 4. MERMİLERİ ÇİZ
            bullets.forEach(bullet => {
                context.save();
                context.translate(bullet.x, bullet.y);
                context.rotate(bullet.rotation + SPRITE_UP_TO_RIGHT_OFFSET);

                let bulletImg = getImage(`bullet-${bullet.type}`);
                if (!bulletImg) bulletImg = getImage('bullet-NORMAL');

                let isGhost = (bullet.type === 'GHOST_BULLET');
                if (isGhost) context.globalAlpha = 0.5;

                if (bulletImg && bulletImg.complete && bulletImg.naturalWidth !== 0) {
                    let size = (bullet.type === 'AOE_EXPLOSION') ? 24 : 16;
                    context.drawImage(bulletImg, -size/2, -size/2, size, size);
                } else {
                    context.fillStyle = bullet.color || '#fff';
                    context.beginPath();
                    context.arc(0, 0, bullet.radius, 0, Math.PI * 2);
                    context.fill();
                }
                context.restore();
            });

            // 5. PATLAMALAR
            activeExplosions.forEach(exp => {
                let expImg;
                if (exp.type === 'AOE' || exp.type === 'CLUSTER') {
                    expImg = getImage('effect-aoe-cluster');
                } else {
                    if (exp.frame < 10) expImg = getImage('explosion-1');
                    else if (exp.frame < 20) expImg = getImage('explosion-2');
                    else expImg = getImage('explosion-3');
                }

                if (expImg && expImg.complete && expImg.naturalWidth !== 0) {
                    context.save();
                    context.translate(exp.x, exp.y);
                    const size = (exp.type === 'AOE') ? 240 : 120;
                    context.drawImage(expImg, -size/2, -size/2, size, size);
                    context.restore();
                }
            });

            context.restore(); // Kamerayı sıfırla
        }
    };
}
