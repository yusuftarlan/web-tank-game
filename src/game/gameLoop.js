import { GAME_TICK_RATE } from '../shared/gameConstants.js';
import { createPowerUpSystem, updatePowerUpSystem } from './systems/powerUpSystem.js';

export function createGameLoop() {
    return {
        tickRate: GAME_TICK_RATE,
        isRunning: false,
        lastTickTime: Date.now(),
        // Sunucu state'ine güç sistemini ekliyoruz
        powerUpSystem: createPowerUpSystem(), 
        players: new Map(), // Muhtemelen sende olan diğer veriler
        bullets: [],
        obstacles: [
            { x: 150, y: 150, width: 200, height: 40, color: '#555' },
            { x: 650, y: 150, width: 40, height: 200, color: '#555' },
            { x: 300, y: 400, width: 300, height: 40, color: '#555' }
        ]
    };
}

export function tick(state) {
    const now = Date.now();
    const deltaTime = now - state.lastTickTime;
    state.lastTickTime = now;

    updatePowerUpSystem(state.powerUpSystem, deltaTime);
}