import { GAME_TICK_RATE } from '../shared/gameConstants.js';

// Future fixed-timestep game loop for authoritative server simulation.
export function createGameLoop() {
    return {
        tickRate: GAME_TICK_RATE,
        isRunning: false
    };
}
