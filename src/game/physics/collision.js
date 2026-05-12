export function intersectsCircle(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const radiusSum = a.radius + b.radius;

    return dx * dx + dy * dy <= radiusSum * radiusSum;
}
