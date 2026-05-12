export function createCanvasRenderer(canvas) {
    const context = canvas.getContext('2d');

    return {
        render(gameState) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#202020';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#f5f5f5';
            context.fillText(`Players: ${gameState.players.length}`, 16, 24);
        }
    };
}
