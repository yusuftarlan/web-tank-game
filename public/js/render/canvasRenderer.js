// public/js/render/canvasRenderer.js
import { getImage } from '../assets/assetLoader.js'; // Görselleri alabilmek için import ettik

const ITEM_VISUALS = {
    'HOMING_MISSILE': { emoji: '🎯', color: '#ff4757' },
    'RAPID_FIRE': { emoji: '🔫', color: '#ffa502' },
    'GHOST_BULLET': { emoji: '👻', color: '#747d8c' },
    'TURBO_DRIVE': { emoji: '⚡', color: '#1e90ff' },
    'AOE_EXPLOSION': { emoji: '💣', color: '#ff6348' },
    'CLUSTER_BOMB': { emoji: '💥', color: '#ff7f50' },
    'BOUNCING_BULLET': { emoji: '🪃', color: '#2ed573' },
    'SHIELD': { emoji: '🛡️', color: '#3742fa' }
};

export function createCanvasRenderer(canvas) {
    const context = canvas.getContext('2d');

    return {
        render(gameState) {
            // Arka planı temizle ve çiz
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#2b2b2b';
            context.fillRect(0, 0, canvas.width, canvas.height);

            // 1. ENGELLERİ (DUVARLARI) ÇİZ
            if (gameState.obstacles) {
                gameState.obstacles.forEach(obs => {
                    context.fillStyle = obs.color || '#555';
                    context.fillRect(obs.x, obs.y, obs.width, obs.height);
                    context.strokeStyle = '#222';
                    context.lineWidth = 2;
                    context.strokeRect(obs.x, obs.y, obs.width, obs.height);
                });
            }

            // 2. ÖZEL GÜÇLERİ VE MERMİLERİ ÇİZ (ITEMS)
            if (gameState.activeItems) {
                gameState.activeItems.forEach(item => {
                    const visual = ITEM_VISUALS[item.type] || { emoji: '❓', color: '#ffffff' };
                    const radius = item.radius || 15;

                    context.beginPath();
                    context.arc(item.x, item.y, radius, 0, Math.PI * 2);
                    context.fillStyle = visual.color;
                    context.fill();
                    
                    context.lineWidth = 2;
                    context.strokeStyle = '#2f3542';
                    context.stroke();
                    context.closePath();

                    context.font = `${radius}px Arial`;
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText(visual.emoji, item.x, item.y + 1); 
                });
            }

            // 3. OYUNCULARI (TANKLARI) ÇİZ
            gameState.players.forEach(player => {
                context.save();
                context.translate(player.x, player.y);

                // -- TANK GÖVDESİ --
                context.save();
                context.rotate(player.rotation);
                
                // Asset Loader'dan yüklediğimiz görseli çekiyoruz
                const tankImg = getImage('tankBody');
                
                // Görsel başarıyla yüklenmişse görseli çiz
                if (tankImg && tankImg.complete && tankImg.naturalWidth !== 0) {
                    // Resim varsa, merkezden hizalayarak çiz (-20, -20 konumuna 40x40 boyutlarında)
                    context.drawImage(tankImg, -20, -20, 40, 40);
                } else {
                    // RESİM BULUNAMAZSA (Fallback): Mavi kutu çiz
                    context.fillStyle = player.color || '#3498db';
                    context.fillRect(-20, -15, 40, 30);
                    context.fillStyle = '#111';
                    context.fillRect(-22, -18, 44, 6);
                    context.fillRect(-22, 12, 44, 6);
                }
                context.restore();

                // -- NAMLU (Turret) --
                // Namluyu ayrı çiziyoruz ki tankın gövdesinden bağımsız olarak fareye dönebilsin
                context.save();
                context.rotate(player.turretRotation);
                context.fillStyle = '#7f8c8d';
                context.fillRect(0, -4, 35, 8);
                context.beginPath();
                context.arc(0, 0, 12, 0, Math.PI * 2);
                context.fill();
                context.restore();

                context.restore();

                // -- OYUNCU İSMİ --
                context.fillStyle = '#ecf0f1';
                context.font = '14px Arial';
                context.textAlign = 'center';
                context.fillText(player.username, player.x, player.y - 30);
            });

            // 4. MERMİLERİ ÇİZ
            gameState.bullets.forEach(bullet => {
                context.save();
                context.translate(bullet.x, bullet.y);
                context.rotate(bullet.rotation);

                context.fillStyle = bullet.color || '#fff';
                context.beginPath();
                context.arc(0, 0, bullet.radius, 0, Math.PI * 2);
                context.fill();
                
                context.shadowBlur = 10;
                context.shadowColor = bullet.color || '#fff';
                context.fill();

                context.restore();
            });
        }
    };
}