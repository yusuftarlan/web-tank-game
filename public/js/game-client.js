import { createGameState } from './state/gameState.js';
import { createCanvasRenderer } from './render/canvasRenderer.js';
import { createHudRenderer } from './render/hudRenderer.js';
import { loadGameAssets } from './assets/assetLoader.js';

const canvas = document.getElementById('game-canvas');
const hud = document.getElementById('game-hud');
const gameState = createGameState();
const canvasRenderer = createCanvasRenderer(canvas);
const hudRenderer = createHudRenderer(hud);

await loadGameAssets();
canvasRenderer.render(gameState);
hudRenderer.render(gameState);
