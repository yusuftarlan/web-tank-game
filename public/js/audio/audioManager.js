const SOUND_PATHS = {
    damage: '/assets/audio/damage.mp3',
    explosion: '/assets/audio/explosion.mp3',
    shoot: '/assets/audio/shoot.mp3',
    criticalHealth: '/assets/audio/critical-health.mp3'
};

const SOUND_VOLUMES = {
    damage: 0.55,
    explosion: 0.75,
    shoot: 0.42,
    criticalHealth: 0.38
};

const SOUND_COOLDOWNS_MS = {
    damage: 60,
    explosion: 120,
    shoot: 90,
    criticalHealth: 900
};

let audioContext = null;
let masterGain = null;
let unlockListenersAttached = false;

function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioContext) {
        audioContext = new AudioContextClass();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.18;
        masterGain.connect(audioContext.destination);
    }

    return audioContext;
}

function safeResume() {
    const context = getAudioContext();
    if (context && context.state === 'suspended') {
        context.resume().catch(() => {});
    }
}

function playTone({ frequency, duration, type = 'sine', gain = 0.12, detuneEnd = 0 }) {
    const context = getAudioContext();
    if (!context || !masterGain || context.state !== 'running') return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.detune.setValueAtTime(0, now);
    oscillator.detune.linearRampToValueAtTime(detuneEnd, now + duration);

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(gain, now + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(envelope);
    envelope.connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
}

function playFallback(soundName, amount = 0) {
    if (soundName === 'damage') {
        const normalizedDamage = Math.max(0, Math.min(1, amount / 50));
        playTone({
            frequency: 120 - normalizedDamage * 35,
            duration: 0.11,
            type: 'sawtooth',
            gain: 0.08 + normalizedDamage * 0.04,
            detuneEnd: -500
        });
        return;
    }

    if (soundName === 'explosion') {
        playTone({
            frequency: 80,
            duration: 0.24,
            type: 'sawtooth',
            gain: 0.14,
            detuneEnd: -900
        });
        return;
    }

    if (soundName === 'shoot') {
        playTone({
            frequency: 260,
            duration: 0.055,
            type: 'square',
            gain: 0.055,
            detuneEnd: -350
        });
        return;
    }

    if (soundName === 'criticalHealth') {
        playTone({
            frequency: 220,
            duration: 0.09,
            type: 'triangle',
            gain: 0.055,
            detuneEnd: -80
        });
    }
}

async function loadAudioBuffer(soundName, path) {
    const context = getAudioContext();
    if (!context) return null;

    const response = await fetch(path, { cache: 'force-cache' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const audioData = await response.arrayBuffer();
    return context.decodeAudioData(audioData);
}

export function createAudioManager() {
    const buffers = new Map();
    const unavailableSounds = new Set();
    const warningShown = new Set();
    const lastPlayedAt = new Map();
    let preloadPromise = null;

    function markUnavailable(soundName) {
        unavailableSounds.add(soundName);

        if (!warningShown.has(soundName)) {
            warningShown.add(soundName);
            console.warn(`[AUDIO] Missing or blocked sound file: ${SOUND_PATHS[soundName]}`);
        }
    }

    function attachUnlockListeners() {
        if (unlockListenersAttached) return;
        unlockListenersAttached = true;

        const unlock = () => safeResume();
        window.addEventListener('pointerdown', unlock, { passive: true });
        window.addEventListener('keydown', unlock);
    }

    function canPlay(soundName) {
        const now = performance.now();
        const cooldown = SOUND_COOLDOWNS_MS[soundName] ?? 0;
        const previous = lastPlayedAt.get(soundName) ?? -Infinity;

        if (now - previous < cooldown) return false;

        lastPlayedAt.set(soundName, now);
        return true;
    }

    async function preloadSound(soundName, path) {
        if (buffers.has(soundName) || unavailableSounds.has(soundName)) return;

        try {
            const buffer = await loadAudioBuffer(soundName, path);
            if (!buffer) {
                markUnavailable(soundName);
                return;
            }

            buffers.set(soundName, buffer);
        } catch (error) {
            markUnavailable(soundName);
        }
    }

    function preload() {
        if (!preloadPromise) {
            preloadPromise = Promise.all(
                Object.entries(SOUND_PATHS).map(([soundName, path]) => preloadSound(soundName, path))
            ).then(() => undefined);
        }

        return preloadPromise;
    }

    function playSample(soundName, amount = 0) {
        safeResume();

        if (!canPlay(soundName)) return;

        const context = getAudioContext();
        const buffer = buffers.get(soundName);
        if (!context || !masterGain || !buffer || unavailableSounds.has(soundName)) {
            playFallback(soundName, amount);
            return;
        }

        const source = context.createBufferSource();
        const gain = context.createGain();

        source.buffer = buffer;
        gain.gain.value = SOUND_VOLUMES[soundName] ?? 0.5;
        source.connect(gain);
        gain.connect(masterGain);
        source.start(context.currentTime);
    }

    attachUnlockListeners();

    return {
        preload,

        playDamage(amount = 0) {
            playSample('damage', amount);
        },

        playExplosion() {
            playSample('explosion');
        },

        playShoot() {
            playSample('shoot');
        },

        playCriticalHealth() {
            playSample('criticalHealth');
        }
    };
}
