export class UI {
    constructor() {
        this.scoreElement = document.getElementById('score');
        this.healthBar = document.getElementById('health-bar');  // Update to use the health bar
        this.ammoElement = document.getElementById('ammo');
        this.damageElement = document.getElementById('damage'); // Create this element in your HTML
        this.pauseMenu = document.getElementById('pause-menu');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
    }
    
    updateScore(score) {
        this.scoreElement.textContent = `Score: ${score}`;
    }
    
    updateHealth(health) {
        // Ensure health is between 0 and 100
        health = Math.max(0, Math.min(health, 100));
        this.healthBar.style.width = `${health}%`;  // Adjust the width of the bar
    }
    
    updateAmmo(ammo) {
        this.ammoElement.textContent = `Ammo: ${ammo}`;
    }

    updateDamage(damage) {
        this.damageElement.textContent = `Damage: ${damage}`;
    }
    
    togglePauseMenu(show) {
        this.pauseMenu.style.display = show ? 'flex' : 'none';
    }
    
    isPauseMenuVisible() {
        return this.pauseMenu.style.display === 'flex';
    }
    
    showGameOver(score) {
        document.getElementById('ui-container').style.display = 'none';
        document.getElementById('crosshair').style.display = 'none';
        this.finalScoreElement.textContent = `Your Score: ${score}`;
        this.gameOverScreen.style.display = 'flex';
    }
}
