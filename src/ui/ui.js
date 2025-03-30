export class UI {
    constructor() {
        this.scoreElement = document.getElementById('score');
        this.healthElement = document.getElementById('health');
        this.ammoElement = document.getElementById('ammo');
        this.pauseMenu = document.getElementById('pause-menu');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
    }
    
    updateScore(score) {
        this.scoreElement.textContent = `Score: ${score}`;
    }
    
    updateHealth(health) {
        this.healthElement.textContent = `Health: ${health}`;
    }
    
    updateAmmo(ammo) {
        this.ammoElement.textContent = `Ammo: ${ammo}`;
    }
    
    togglePauseMenu(show) {
        this.pauseMenu.style.display = show ? 'flex' : 'none';
    }
    
    isPauseMenuVisible() {
        return this.pauseMenu.style.display === 'flex';
    }
    
    showGameOver(score) {
        // Hide game UI elements
        document.getElementById('ui-container').style.display = 'none';
        document.getElementById('crosshair').style.display = 'none';
        
        // Set final score
        this.finalScoreElement.textContent = `Your Score: ${score}`;
        
        // Show game over screen
        this.gameOverScreen.style.display = 'flex';
    }
}
