export function updatePosition(entity, velocity, deltaTime) {
    return {
        ...entity,
        x: entity.x + velocity.x * deltaTime,
        y: entity.y + velocity.y * deltaTime
    };
}
