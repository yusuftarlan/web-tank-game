// public/js/render/hudRenderer.js

export function createHudRenderer(hudElement) {
    return {
        render(gameState) {
            // Şimdilik ilk oyuncuyu (local_player_1) yerel oyuncumuz kabul ediyoruz
            const localPlayer = gameState.players[0];
            if (!localPlayer) return;

            // HUD elementinin içeriğini HTML olarak güncelle
            hudElement.innerHTML = `
                <div style="position: absolute; top: 10px; left: 10px; color: white; font-family: Arial; text-shadow: 1px 1px 2px black;">
                    <h2 style="margin: 0; font-size: 18px;">${localPlayer.username}</h2>
                    <p style="margin: 5px 0 0 0; font-size: 16px; color: #e74c3c;">Can: ${localPlayer.health}</p>
                    <p style="margin: 5px 0 0 0; font-size: 16px; color: #f1c40f;">Skor: ${localPlayer.score}</p>
                </div>
            `;
        }
    };
}