export class UI {
    constructor() {
        this.scoreElement = document.getElementById('score');
        this.healthElement = document.getElementById('health');
        this.ammoElement = document.getElementById('ammo');
        this.pauseMenu = document.getElementById('pause-menu');
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
}
