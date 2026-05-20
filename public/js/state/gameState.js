// public/js/state/gameState.js

export function createGameState() {
    const currentUsername = sessionStorage.getItem('username') || 'Misafir';

    return {
        players: [
            {
                id: 'local_player_1',
                username: currentUsername,
                x: 480,
                y: 270,
                rotation: 0,
                turretRotation: 0,
                health: 100,
                score: 0,
                color: 'blue'
            }
        ],
        
        bullets: [],

        obstacles: [
            { x: 150, y: 150, width: 200, height: 40, color: '#555' },
            { x: 650, y: 150, width: 40, height: 200, color: '#555' },
            { x: 300, y: 400, width: 300, height: 40, color: '#555' }
        ],

        world: {
            width: 960,
            height: 540
        }
    };
}