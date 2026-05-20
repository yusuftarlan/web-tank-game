// public/js/render/hudRenderer.js
export function createHudRenderer(hudElement) {
    return {
        render(gameState) {
            if (!gameState || !gameState.players) return;
            
            hudElement.innerHTML = ''; 
            
            const players = gameState.players.slice(0, 4);
            
            players.forEach((player, index) => {
                const panel = document.createElement('div');
                panel.className = `player-panel corner-${index}`;
                
                // Asset isimleri (Yüklediğiniz dosya isimlerine göre)
                const bodyImgSrc = `/assets/sprites/tank-${player.color || 'blue'}.png`;
                const turretImgSrc = `/assets/sprites/Gun_01_A.png`;
                
                let healthColor = '#2ecc71'; 
                if (player.health < 60) healthColor = '#f39c12'; 
                if (player.health < 30) healthColor = '#e74c3c'; 
                
                const kills = Math.floor(player.score / 10) || 0;

                panel.innerHTML = `
                    <div class="tank-avatar-container">
                        <img src="${bodyImgSrc}" class="tank-body-sprite" onerror="this.src='/assets/sprites/tank-blue.png'">
                        <img src="${turretImgSrc}" class="tank-turret-sprite">
                    </div>
                    
                    <div class="panel-info">
                        <div class="player-name" style="color: ${player.color}">${player.username}</div>
                        <div class="health-bar-container">
                            <div class="health-bar-fill" style="width: ${Math.max(0, player.health)}%; background-color: ${healthColor};"></div>
                        </div>
                        <div class="player-stats">
                            <span>💖 Can: ${Math.max(0, Math.floor(player.health))}</span>
                            <span>⚔️ Leş: ${kills}</span>
                        </div>
                    </div>
                `;
                
                hudElement.appendChild(panel);
            });
        }
    };
}