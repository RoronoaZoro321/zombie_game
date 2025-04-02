import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import audioManager from '../audio/audioManager.js';

export class Zombie {
    constructor(scene, position, mapId = 1) {
        this.scene = scene;
        this.position = position;
        this.model = null;
        this.mapId = mapId;
        
        this.speed = 1.2 + Math.random() * 0.5;
        this.health = 3;
        this.attackRange = 2;
        
        this.attackCooldown = 5;
        this.lastAttackTime = 0;

        // Sound related properties
        this.lastGrowlTime = 0;
        this.growlInterval = 5000 + Math.random() * 8000; // Random interval between growls
        this.playedDeathSound = false;

        // Animation properties
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
        
        // Model loading properties
        this.isLoaded = false;
        this.loader = new GLTFLoader();

        // Adjust collision-related properties to be more precise
        this.boundingBox = null;
        this.collisionRadius = 0.8; // Reduced from 1.5 for more precise hit detection
        this.collisionHeight = 2.4; // Reduced from 3.0 to better match the zombie model height
    }
    
    init() {
        // Choose model based on mapId
        this.loadModel('../../assets/models/zombie/scene.gltf', 'forest');
    }
    
    loadModel(modelPath, type) {
        this.loader.load(modelPath, (gltf) => {
            this.model = gltf.scene;
            
            // Apply scale adjustments
            this.model.scale.set(1.5, 1.5, 1.5);
            
            // Set the position
            this.model.position.copy(this.position);
            
            // Setup animations if available
            if (gltf.animations && gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.model);
                
                gltf.animations.forEach((clip) => {
                    const name = clip.name.toLowerCase();
                    this.animations[name] = this.mixer.clipAction(clip);
                    
                    // Configure animation settings
                    if (name.includes('walk') || name.includes('run')) {
                        this.animations[name].setEffectiveTimeScale(1.0);
                        this.animations[name].setEffectiveWeight(1.0);
                    }
                    
                    if (name.includes('attack')) {
                        this.animations[name].setEffectiveTimeScale(1.5); // Faster attack
                        this.animations[name].setLoop(THREE.LoopOnce);
                        this.animations[name].clampWhenFinished = true;
                    }
                    
                    if (name.includes('dead') || name.includes('hurt')) {
                        this.animations[name].setLoop(THREE.LoopOnce);
                        this.animations[name].clampWhenFinished = true;
                    }
                });
                
                // Start with walk animation
                this.playAnimation('walk');
            }
            
            // Add zombie to scene
            this.scene.add(this.model);
            this.isLoaded = true;
            
            // Create bounding box helper for collision detection
            // Calculate model dimensions for accurate collision
            const bbox = new THREE.Box3().setFromObject(this.model);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            
            // Create invisible cylinder/box around zombie for collision detection
            // You can uncomment the following code for debugging:
            /*
            this.boundingBox = new THREE.Mesh(
                new THREE.CylinderGeometry(this.collisionRadius, this.collisionRadius, this.collisionHeight, 8),
                new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true, transparent: true, opacity: 0.5})
            );
            this.boundingBox.position.copy(this.model.position);
            this.boundingBox.position.y += this.collisionHeight / 2;
            this.scene.add(this.boundingBox);
            */
        }, 
        // Progress callback
        (xhr) => {
            // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // Error callback
        (error) => {
            console.error('Error loading zombie model:', error);
            // Fallback to primitive model if loading fails
        });
    }
    
    playAnimation(name) {
        if (!this.animations[name]) return;
        
        // Fade out current animation
        if (this.currentAnimation && this.animations[this.currentAnimation]) {
            this.animations[this.currentAnimation].fadeOut(0.3);
        }
        
        // Fade in new animation
        this.animations[name].reset();
        this.animations[name].fadeIn(0.3);
        this.animations[name].play();
        this.currentAnimation = name;
    }
    
    update(delta, playerPosition) {
        if (this.health <= 0) {
            if (!this.playedDeathSound) {
                audioManager.play('zombieDeath', { volume: 0.5 });
                this.playedDeathSound = true;
                
                // Play death animation
                const deathAnims = ['dead1', 'dead2', 'dead3'];
                const randomDeath = deathAnims[Math.floor(Math.random() * deathAnims.length)];
                if (this.animations[randomDeath]) {
                    this.playAnimation(randomDeath);
                }
            }
            
            // Continue updating mixer for death animation
            if (this.mixer) {
                this.mixer.update(delta);
            }
            return;
        }
        
        // If model isn't loaded yet, skip update
        if (!this.isLoaded || !this.model) return;
        
        // Update animation mixer if available
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        // Direction to player
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.model.position)
            .normalize();
        
        // Distance to player
        const distanceToPlayer = this.model.position.distanceTo(playerPosition);
        
        // Play random growl sounds
        const currentTime = Date.now();
        if (currentTime - this.lastGrowlTime > this.growlInterval) {
            // Only play growl sounds if somewhat close to the player (optimization)
            if (distanceToPlayer < 20) {
                // Calculate volume based on distance
                const volume = Math.min(0.7, 1.0 - distanceToPlayer / 30);
                audioManager.play('zombieGrowl', { volume: volume * 0.6 });
            }
            this.lastGrowlTime = currentTime;
            // Set new random interval
            this.growlInterval = 5000 + Math.random() * 8000;
        }
        
        // Move zombie towards player
        this.model.position.x += direction.x * this.speed * delta;
        this.model.position.z += direction.z * this.speed * delta;
        
        // Keep y position at ground level
        this.model.position.y = 0;
        
        // Make zombie look at player (only rotate y)
        direction.y = 0;
        if (direction.length() > 0.001) {
            this.model.lookAt(
                this.model.position.x + direction.x,
                this.model.position.y,
                this.model.position.z + direction.z
            );
        }
        
        // Update animation based on movement speed
        if (this.speed > 2.0 && this.animations['run']) {
            if (this.currentAnimation !== 'run') {
                this.playAnimation('run');
            }
        } else if (this.currentAnimation !== 'walk' && this.currentAnimation !== 'walk2' && 
                  !this.currentAnimation?.includes('attack') && !this.currentAnimation?.includes('hurt')) {
            // Randomly choose between walk and walk2
            this.playAnimation(Math.random() > 0.5 ? 'walk' : 'walk2');
        }
        
        // Update bounding box position if it exists (for debugging)
        if (this.boundingBox) {
            this.boundingBox.position.x = this.model.position.x;
            this.boundingBox.position.z = this.model.position.z;
            this.boundingBox.position.y = this.model.position.y + this.collisionHeight / 2;
            this.boundingBox.rotation.y = this.model.rotation.y;
        }
    }
    
    takeDamage() {
        this.health--;
        
        // Play hurt animation if available
        if (this.animations['hurt']) {
            this.playAnimation('hurt');
            
            // Return to walking after hurt animation
            setTimeout(() => {
                if (!this.isDead() && (this.currentAnimation === 'hurt' || !this.currentAnimation)) {
                    this.playAnimation(Math.random() > 0.5 ? 'walk' : 'walk2');
                }
            }, 800); // Adjust timing based on animation length
        }
        
        // Make zombie flash red when hit
        if (this.model) {
            this.model.traverse((node) => {
                if (node.isMesh && node.material) {
                    // Store original color if not already stored
                    if (!node.userData.originalColor) {
                        node.userData.originalColor = node.material.color.clone();
                    }
                    node.material.color.set(0xff0000);
                }
            });
            
            setTimeout(() => {
                this.model.traverse((node) => {
                    if (node.isMesh && node.material && node.userData.originalColor) {
                        node.material.color.copy(node.userData.originalColor);
                    }
                });
            }, 100);
        }
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    canAttack(playerPosition) {
        // If model isn't loaded yet, can't attack
        if (!this.isLoaded || !this.model) return false;
        
        const currentTime = Date.now();
        const distanceToPlayer = this.model.position.distanceTo(playerPosition);
    
        // Check if the zombie is within attack range
        if (distanceToPlayer > this.attackRange) {
            return false;
        }
    
        // Check if the cooldown has passed
        if (currentTime - this.lastAttackTime <= this.attackCooldown * 200) {
            return false;
        }
    
        // Zombie can attack
        this.lastAttackTime = currentTime;
        
        // Play attack animation
        if (this.animations['attack2']) {
            this.playAnimation('attack2');
            
            // Return to walking after attack animation
            setTimeout(() => {
                if (!this.isDead() && (this.currentAnimation === 'attack2' || !this.currentAnimation)) {
                    this.playAnimation(Math.random() > 0.5 ? 'walk' : 'walk2');
                }
            }, 1000); // Adjust timing based on animation length
        }
        
        // Play attack sound
        audioManager.play('zombieAttack', { volume: 0.6 });
        
        return true;
    }
    
    getPosition() {
        // Return default position if model isn't loaded yet
        if (!this.model) return this.position;
        return this.model.position;
    }
    
    // Check if bullet hits the zombie with improved collision detection
    checkCollision(bulletPosition) {
        if (!this.model) return false;
        
        // Get zombie position
        const zombiePosition = this.model.position.clone();
        
        // Check horizontal distance (XZ plane)
        const horizontalDistance = new THREE.Vector2(
            bulletPosition.x - zombiePosition.x,
            bulletPosition.z - zombiePosition.z
        ).length();
        
        // Check if within horizontal radius
        if (horizontalDistance > this.collisionRadius) {
            return false;
        }
        
        // Check vertical position (Y axis) - bullet should be within the zombie's height
        // Raise the bottom of collision area slightly to match model better
        if (bulletPosition.y < zombiePosition.y + 0.3 || 
            bulletPosition.y > zombiePosition.y + this.collisionHeight) {
            return false;
        }
        
        return true;
    }
}