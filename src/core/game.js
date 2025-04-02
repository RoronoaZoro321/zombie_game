import * as THREE from 'three';
import { Player } from '../components/player.js';
import { Zombie } from '../components/zombie.js';
import { Box } from '../components/box.js';
// import { LevelFactory } from '../levels/levelFactory.js';
import { Level } from '../levels/level.js';
import { UI } from '../ui/ui.js';
import audioManager from '../audio/audioManager.js';

export class Game {
    constructor(mapId = 1) {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.zombies = [];
        this.boxes = [];
        this.maxBoxes = 2; // Changed from 3 to 2 as per requirement
        this.openedBoxesCount = 0;
        this.level = null;
        this.ui = null;
        this.clock = new THREE.Clock();
        this.gameOver = false;
        this.score = 0;
        this.mapId = mapId;
        this.isPaused = false;
        this.boxSpawnInterval = null;
        
        // Difficulty progression properties
        this.maxZombies = 5;
        this.difficultyTimer = null;
        this.difficultyLevel = 1;
        this.zombieHealthMultiplier = 1;
        this.zombieSpeedMultiplier = 1;
    }

    init() {
        // Initialize audio manager
        audioManager.init();
        
        // Set up the scene
        this.scene = new THREE.Scene();
        
        // this.scene.background = new THREE.Color(0x07250c);
        // this.scene.fog = new THREE.Fog(0x07250c, 10, 50); // Denser fog for forest


        // Set up the camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Set up the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        
        document.body.appendChild(this.renderer.domElement);

        // Set up the level with the chosen map using factory
        this.level = new Level(this.scene);
        this.level.create();

        // Set up the player
        this.player = new Player(this.camera, this.scene);
    
        // give the flashlight to the player
        this.player.hasFlashlight = true;
        
        this.player.init();

        // Set up the UI
        this.ui = new UI();
        
        // Set up the zombies
        this.spawnZombies();
        
        // Start the difficulty progression
        this.startDifficultyProgression();
        
        // Initial box spawning - up to maxBoxes
        for (let i = 0; i < this.maxBoxes; i++) {
            this.spawnBox();
        }
        
        // Add event listener for box interactions
        window.addEventListener('box-opened', (event) => this.handleBoxOpened(event.detail.box));

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Add escape key listener for pause menu
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && !this.gameOver) {
                this.togglePause();
            }
        });
        
        // Add pause menu button listeners
        document.getElementById('resume-game').addEventListener('click', () => this.togglePause(false));
        document.getElementById('show-pause-instructions').addEventListener('click', () => this.showInstructions());
        document.getElementById('exit-to-menu').addEventListener('click', () => this.exitToMenu());
        
        // Add volume control to the pause menu
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            audioManager.setMasterVolume(e.target.value / 100);
        });
    }
    
    showInstructions() {
        // Hide pause menu and show instructions
        this.ui.togglePauseMenu(false);
        document.getElementById('instructions').style.display = 'flex';
        
        // Add a temporary event listener to return to pause menu when instructions are closed
        const closeInstructionsBtn = document.getElementById('close-instructions');
        const originalClickHandler = closeInstructionsBtn.onclick;
        
        closeInstructionsBtn.onclick = () => {
            document.getElementById('instructions').style.display = 'none';
            this.ui.togglePauseMenu(true);
            
            // Restore original handler
            closeInstructionsBtn.onclick = originalClickHandler;
        };
    }
    
    exitToMenu() {
        // Simply cleanup and return to menu without showing game over
        this.cleanup();
        
        // Hide game UI
        document.getElementById('ui-container').style.display = 'none';
        document.getElementById('crosshair').style.display = 'none';
        document.getElementById('pause-menu').style.display = 'none';
        
        // Show home screen
        document.getElementById('home-screen').style.display = 'flex';
    }

    togglePause(forcePause = null) {
        // If forcePause is provided, use that value, otherwise toggle current state
        if (forcePause !== null) {
            this.isPaused = forcePause;
        } else {
            this.isPaused = !this.isPaused;
        }
        
        // Show/hide pause menu
        this.ui.togglePauseMenu(this.isPaused);
        
        // Lock/unlock pointer
        if (this.isPaused) {
            this.player.controls.unlock();
        } else {
            this.player.controls.lock();
        }
    }

    startDifficultyProgression() {
        // Increase difficulty every 30 seconds
        this.difficultyTimer = setInterval(() => {
            if (!this.isPaused && !this.gameOver) {
                this.difficultyLevel++;
                
                // Increase max zombies (cap at 20)
                if (this.maxZombies < 20) {
                    this.maxZombies = Math.min(20, Math.floor(5 + this.difficultyLevel * 0.7));
                }
                
                // Increase zombie stats
                this.zombieHealthMultiplier = 1 + (this.difficultyLevel * 0.1);
                this.zombieSpeedMultiplier = 1 + (this.difficultyLevel * 0.1);
                
                console.log(`Difficulty increased to level ${this.difficultyLevel}`);
                console.log(`Max zombies: ${this.maxZombies}, Health: ${this.zombieHealthMultiplier}x, Speed: ${this.zombieSpeedMultiplier}x`);
                
                // Spawn additional zombies if below the new max
                this.spawnAdditionalZombies();
            }
        }, 10000); // Every 10 seconds
    }
    
    spawnAdditionalZombies() {
        const zombiesToSpawn = this.maxZombies - this.zombies.length;
        
        for (let i = 0; i < zombiesToSpawn; i++) {
            this.spawnZombie();
        }
    }
    
    spawnZombie() {
        // Determine spawn distance based on map
        const spawnDistance = (this.mapId === 3) ? 25 : 80;
        
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * spawnDistance,
            0,
            (Math.random() - 0.5) * spawnDistance
        );
        // Make sure zombies don't spawn too close to the player
        if (position.distanceTo(this.player.getPosition()) < 15) {
            position.z += 20;
        }
        
        const zombie = new Zombie(this.scene, position, this.mapId);
        
        // Apply difficulty multipliers
        zombie.health = Math.ceil(zombie.health * this.zombieHealthMultiplier);
        zombie.speed = zombie.speed * this.zombieSpeedMultiplier;
        
        zombie.init();
        this.zombies.push(zombie);
    }

    spawnZombies() {
        // Initial spawn of zombies up to maxZombies
        for (let i = 0; i < this.maxZombies; i++) {
            this.spawnZombie();
        }
    }

    spawnBox() {
        console.log('Spawning box');
        
        // Only spawn if below maximum
        if (this.boxes.length >= this.maxBoxes) {
            return;
        }
        
        const spawnDistance = 80;
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * spawnDistance,
            0,
            (Math.random() - 0.5) * spawnDistance
        );

        // Make sure boxes don't spawn too close to the player
        if (position.distanceTo(this.player.getPosition()) < 10) {
            position.z += 15;
        }

        const box = new Box(this.scene, position);
        box.init();
        this.boxes.push(box); // Store the box for interaction
        this.player.boxes.push(box); // Give the player access to the box
    }

    handleBoxOpened(box) {
        // Remove the opened box from the boxes array
        const index = this.boxes.indexOf(box);
        if (index !== -1) {
            this.boxes.splice(index, 1);
            
            // Remove from player's boxes array as well
            const playerBoxIndex = this.player.boxes.indexOf(box);
            if (playerBoxIndex !== -1) {
                this.player.boxes.splice(playerBoxIndex, 1);
            }
            
            // Spawn a new box since one was opened (maintaining max of 2)
            if (this.boxes.length < this.maxBoxes) {
                setTimeout(() => {
                    this.spawnBox();
                }, this.getRandomSpawnTime());
            }
        }
    }

    getRandomSpawnTime() {
        // Return a random time between 10 - 20 seconds
        const time = Math.floor(Math.random() * 10000) + 10000;
        console.log(`Generating box in ${time / 1000} seconds`);
        return time;
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        const delta = this.clock.getDelta();
        
        // Skip updates if paused
        if (this.isPaused) {
            return;
        }
        
        // Update player
        this.player.update(delta);
        
        // Update zombies
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            zombie.update(delta, this.player.getPosition());
            
            // Check if zombie is killed
            if (zombie.isDead()) {
                this.scene.remove(zombie.model);
                this.zombies.splice(i, 1);
                this.score += 10;
                this.ui.updateScore(this.score * this.player.multiplier);
                console.log(`Score: ${this.score}`);
                
                // Respawn zombie if there are less than the max zombie count
                if (this.zombies.length < this.maxZombies) {
                    setTimeout(() => {
                        // Spawn a new zombie with current difficulty
                        this.spawnZombie();
                    }, 3000);
                }
            }
            
            // Check if the zombie can attack the player
            if (zombie.canAttack(this.player.getPosition())) {
                const damageAmount = 10;
                this.player.takeDamage(damageAmount);
                this.ui.updateHealth(this.player.health);
                console.log(`Player health: ${this.player.health}`);
                
                // Check if the player is dead
                if (this.player.health <= 0 && !this.gameOver) {
                    this.gameOver = true;
                    
                    // Show game over screen
                    this.ui.showGameOver(this.score);
                    
                    // Unlock pointer controls
                    this.player.controls.unlock();
                    
                    // Fire game over event for any external listeners
                    const gameOverEvent = new CustomEvent('game-over', {
                        detail: { score: this.score }
                    });
                    window.dispatchEvent(gameOverEvent);
                }
            }
        }
        
        // Check player bullets against zombies
        this.player.bullets.forEach((bullet, bulletIndex) => {
            bullet.update(delta);
            
            // Remove bullets that have traveled too far
            if (bullet.hasExpired()) {
                this.scene.remove(bullet.mesh);
                this.player.bullets.splice(bulletIndex, 1);
                return;
            }
            
            // Check for zombie hits
            this.zombies.forEach(zombie => {
                // Use the zombie's own collision detection instead of a simple distance check
                if (zombie.checkCollision(bullet.mesh.position)) {
                    zombie.takeDamage();
                    this.scene.remove(bullet.mesh);
                    this.player.bullets.splice(bulletIndex, 1);
                }
            });
        });
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    gameLoop() {
        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
            this.update();
            this.render();
        }
    }

    start() {
        this.gameLoop();
    }
    
    cleanup() {
        // Stop game loop
        this.gameOver = true;
    
        // Stop difficulty progression timer
        if (this.difficultyTimer) {
            clearInterval(this.difficultyTimer);
        }
    
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('box-opened', this.handleBoxOpened);
    
        // Remove all zombies
        this.zombies.forEach(zombie => {
            if (zombie.model) {
                this.scene.remove(zombie.model);
            }
        });
    
        clearInterval(this.boxSpawnInterval);
    
        // Remove player bullets
        if (this.player) {
            this.player.bullets.forEach(bullet => {
                if (bullet.mesh) {
                    this.scene.remove(bullet.mesh);
                }
            });
        }
    
        // Remove boxes
        this.boxes.forEach(box => {
            if (box.model) {
                this.scene.remove(box.model);
                box.model.traverse((child) => {
                    if (child.isMesh) {
                        child.geometry.dispose();
                        child.material.dispose();
                    }
                });
            }
        });
        this.boxes = []; // Clear the boxes array
    
        // Remove player gun and camera
        if (this.player && this.player.controls) {
            this.player.controls.dispose();
        }
    
        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
            document.body.removeChild(this.renderer.domElement);
        }
    
        // Clear scene
        if (this.scene) {
            this.disposeScene(this.scene);
        }

        this.ui.updateHealth(100); // Reset health bar
        this.ui.updateScore(0); // Reset score
        this.ui.updateAmmo(30); // Reset ammo
    }
    
    disposeScene(scene) {
        scene.traverse(object => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}


