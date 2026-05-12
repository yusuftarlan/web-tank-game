export function createTank({ id, playerName, x = 0, y = 0, angle = 0 }) {
    return {
        id,
        playerName,
        x,
        y,
        angle,
        health: 100,
        score: 0
    };
}
