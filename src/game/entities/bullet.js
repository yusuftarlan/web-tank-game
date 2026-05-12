export function createBullet({ id, ownerId, x = 0, y = 0, angle = 0 }) {
    return {
        id,
        ownerId,
        x,
        y,
        angle,
        active: true
    };
}
