export function createHudRenderer(container) {
    return {
        render(gameState) {
            container.textContent = `Durum: ${gameState.status}`;
        }
    };
}
