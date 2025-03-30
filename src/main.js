import * as THREE from 'three';
import { Game } from './core/game.js';

// Initialize menu controls
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('show-instructions').addEventListener('click', showInstructions);
document.getElementById('show-credits').addEventListener('click', showCredits);
document.getElementById('close-instructions').addEventListener('click', closeInstructions);
document.getElementById('close-credits').addEventListener('click', closeCredits);
document.getElementById('return-to-menu').addEventListener('click', returnToMenuFromGameOver);

// Game instance
let game = null;

// Home screen functions
function showInstructions() {
    document.getElementById('instructions').style.display = 'flex';
}

function closeInstructions() {
    document.getElementById('instructions').style.display = 'none';
}

function showCredits() {
    document.getElementById('credits').style.display = 'flex';
}

function closeCredits() {
    document.getElementById('credits').style.display = 'none';
}

function startGame() {
    // Show loading screen
    const homeScreen = document.getElementById('home-screen');
    const loadingScreen = document.getElementById('loading-screen');
    
    homeScreen.style.display = 'none';
    loadingScreen.style.display = 'flex';
    
    // Simulate loading progress (could be replaced with actual asset loading)
    let progress = 0;
    const progressBar = document.getElementById('loading-progress');
    
    const loadingInterval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                initializeGame();
            }, 500);
        }
    }, 10);
}

function initializeGame() {
    // Show game UI elements
    document.getElementById('ui-container').style.display = 'block';
    document.getElementById('crosshair').style.display = 'block';
    
    // Initialize and start the game with the Forest map (mapId = 1)
    game = new Game(1);
    game.init();
    game.start();
    
    // Add game end event handlers
    window.addEventListener('game-over', handleGameOver);
}

function handleGameOver(event) {
    // Get score from event or game
    const score = event.detail?.score || (game ? game.score : 0);
    
    // Don't immediately clean up the game - wait for user to click "Return to Menu"
}

function returnToMenuFromGameOver() {
    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';
    
    // Clean up existing game
    resetGame();
    
    // Show home screen
    document.getElementById('home-screen').style.display = 'flex';
}

function resetGame() {
    // Hide game UI
    document.getElementById('ui-container').style.display = 'none';
    document.getElementById('crosshair').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    
    // Clean up existing game
    if (game) {
        game.cleanup();
        game = null;
    }
}

// Expose functions to window for debugging
window.gameDebug = {
    startGame,
    handleGameOver
};

function loseHealth(amount) {
    if (game) {
        game.loseHealth(amount);
    }
}
