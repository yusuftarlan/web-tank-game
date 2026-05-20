export function createTank({ id, playerName, x = 0, y = 0, angle = 0 }) {
    return {
        id,
        playerName,
        x,
        y,
        angle,
        v_base: 0.2,
        omega_base: 0.003,
        health: 100,
        score: 0,
        powerUps: {
            turboDriveUntil: 0 
        }
    };
}