export function updateTankPosition(entity, inputs, deltaTime) {
    let newAngle = entity.angle;
    if (inputs.rotate !== 0) {
        newAngle = entity.angle + (entity.omega_base * inputs.rotate * deltaTime);
    }

    let newX = entity.x;
    let newY = entity.y;
    
    if (inputs.forward !== 0) {
        const currentSpeed = entity.v_base * inputs.forward; 
        newX = entity.x + (currentSpeed * Math.cos(newAngle) * deltaTime);
        newY = entity.y + (currentSpeed * Math.sin(newAngle) * deltaTime);
    }

    return {
        ...entity,
        x: newX,
        y: newY,
        angle: newAngle
    };
}