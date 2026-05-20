import { POWERUP_TYPES, ADVANCED_BULLET_TYPES, MAP_WIDTH, MAP_HEIGHT, ITEM_SPAWN_INTERVAL } from '../../shared/gameConstants.js';

export function createPowerUpSystem() {
    return {
        activeItems: new Map(),
        timeSinceLastSpawn: 0,
        itemCounter: 0
    };
}

export function updatePowerUpSystem(system, deltaTime) {
    system.timeSinceLastSpawn += deltaTime;

    if (system.timeSinceLastSpawn >= ITEM_SPAWN_INTERVAL) {
        spawnRandomItem(system);
        system.timeSinceLastSpawn = 0;
    }
}

function spawnRandomItem(system) {
    const powerUpArray = Object.values(POWERUP_TYPES);
    const bulletArray = Object.values(ADVANCED_BULLET_TYPES);
    const allSpawnables = [...powerUpArray, ...bulletArray];
    
    const type = allSpawnables[Math.floor(Math.random() * allSpawnables.length)];
    
    const x = Math.random() * MAP_WIDTH;
    const y = Math.random() * MAP_HEIGHT;
    const id = `item_${Date.now()}_${system.itemCounter++}`;

    system.activeItems.set(id, {
        id,
        type,
        x,
        y,
        radius: 15 
    });
}

export function collectItem(system, itemId) {
    const item = system.activeItems.get(itemId);
    if (item) {
        system.activeItems.delete(itemId);
        return item;
    }
    return null;
}