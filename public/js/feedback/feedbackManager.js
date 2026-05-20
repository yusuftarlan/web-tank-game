const MAX_TRAUMA = 1;
const SHAKE_DECAY_PER_SECOND = 1.8;
const MAX_SHAKE_PIXELS = 18;
const LOW_HEALTH_THRESHOLD = 40;
const CRITICAL_HEALTH_THRESHOLD = 25;
const CRITICAL_BEEP_INTERVAL_MS = 1800;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function createFeedbackManager({ overlayElement = null, audioManager = null } = {}) {
    let trauma = 0;
    let elapsedSeconds = 0;
    let lastCriticalBeepAt = 0;

    function updateOverlay(opacity, intensity) {
        if (!overlayElement) return;

        overlayElement.style.opacity = opacity.toFixed(3);
        overlayElement.style.setProperty('--damage-intensity', intensity.toFixed(3));
    }

    return {
        registerDamage(amount = 0) {
            const normalizedDamage = clamp(amount / 50, 0, 1);
            trauma = clamp(trauma + 0.18 + normalizedDamage * 0.55, 0, MAX_TRAUMA);

            if (audioManager) {
                audioManager.playDamage(amount);
            }
        },

        reset() {
            trauma = 0;
            elapsedSeconds = 0;
            lastCriticalBeepAt = 0;
            updateOverlay(0, 0);
        },

        update(localPlayer, deltaSeconds) {
            elapsedSeconds += deltaSeconds;
            trauma = clamp(trauma - SHAKE_DECAY_PER_SECOND * deltaSeconds, 0, MAX_TRAUMA);

            const shakePower = trauma * trauma;
            const shakeMagnitude = shakePower * MAX_SHAKE_PIXELS;
            const shakeX = (Math.random() * 2 - 1) * shakeMagnitude;
            const shakeY = (Math.random() * 2 - 1) * shakeMagnitude;

            let overlayOpacity = 0;
            let criticalHealthIntensity = 0;

            if (localPlayer) {
                const health = clamp(Number(localPlayer.health) || 0, 0, 100);

                if (health <= LOW_HEALTH_THRESHOLD) {
                    criticalHealthIntensity = clamp((LOW_HEALTH_THRESHOLD - health) / LOW_HEALTH_THRESHOLD, 0, 1);
                    overlayOpacity = 0.08 + criticalHealthIntensity * 0.28;
                }

                if (health <= CRITICAL_HEALTH_THRESHOLD) {
                    const pulse = (Math.sin(elapsedSeconds * 8) + 1) / 2;
                    overlayOpacity += pulse * 0.08;

                    const now = performance.now();
                    if (now - lastCriticalBeepAt > CRITICAL_BEEP_INTERVAL_MS) {
                        lastCriticalBeepAt = now;
                        if (audioManager) {
                            audioManager.playCriticalHealth();
                        }
                    }
                }
            }

            updateOverlay(clamp(overlayOpacity, 0, 0.48), criticalHealthIntensity);

            return {
                cameraShake: {
                    x: shakeX,
                    y: shakeY
                },
                criticalHealthIntensity
            };
        }
    };
}
