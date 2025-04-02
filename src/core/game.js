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
        this.level = null;
        this.ui = null;
        this.clock = new THREE.Clock();
        this.gameOver = false;
        this.score = 0;
        this.mapId = mapId;
        this.isPaused = false;
        this.boxSpawnInterval = null;
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
        this.startBoxSpawn();

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

    spawnZombies() {
        // Determine zombie count and spawn distance
        let zombieCount = 5;
        let spawnDistance = 80;

        for (let i = 0; i < zombieCount; i++) {
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * spawnDistance,
                0,
                (Math.random() - 0.5) * spawnDistance
            );
            // Make sure zombies don't spawn too close to the player
            if (position.distanceTo(this.player.getPosition()) < 10) {
                position.z += 15;
            }
            
            // Pass map type to zombie for visual differences
            const zombie = new Zombie(this.scene, position, this.mapId);
            zombie.init();
            this.zombies.push(zombie);
        }
    }

    startBoxSpawn() {
        this.boxSpawnInterval = setInterval(() => {
            console.log('Spawning box');
                this.spawnBox();
        }, this.getRandomSpawnTime());
    }

    spawnBox() {
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

    getRandomSpawnTime() {
        // Return a random time between 2 and 5 seconds
        return Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
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
                this.ui.updateScore(this.score);
                
                // Respawn zombie if there are less than the map's zombie count
                let maxZombies = 1;
                
                if (this.zombies.length < maxZombies) {
                    setTimeout(() => {
                        // Determine spawn distance based on map
                        const spawnDistance = (this.mapId === 3) ? 25 : 40;
                        
                        const position = new THREE.Vector3(
                            (Math.random() - 0.5) * spawnDistance,
                            0,
                            (Math.random() - 0.5) * spawnDistance
                        );
                        if (position.distanceTo(this.player.getPosition()) < 10) {
                            position.z += 15;
                        }
                        
                        const newZombie = new Zombie(this.scene, position, this.mapId);
                        newZombie.init();
                        this.zombies.push(newZombie);
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
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
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


