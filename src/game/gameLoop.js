import { GAME_TICK_RATE } from '../shared/gameConstants.js';
import { createPowerUpSystem, updatePowerUpSystem } from './systems/powerUpSystem.js';

export function createGameLoop() {
    return {
        tickRate: GAME_TICK_RATE,
        isRunning: false,
        lastTickTime: Date.now(),
        powerUpSystem: createPowerUpSystem()
    };
}

export function tick(state) {
    const now = Date.now();
    const deltaTime = now - state.lastTickTime;
    state.lastTickTime = now;

    updatePowerUpSystem(state.powerUpSystem, deltaTime);
}