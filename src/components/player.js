import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Bullet } from './bullet.js';
import { Box } from './box.js';
import audioManager from '../audio/audioManager.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.controls = null;
        this.moveSpeed = 4;
        this.runSpeedMultiplier = 1.7; // Multiplier for running speed
        this.health = 100;
        this.ammo = 30;
        this.max_ammo = 30;
        this.multiplier = 1;
        this.lootBonus = false
        this.scoreDuration = 0;
        this.canShoot = true;
        this.reloadTime = 1.5;
        this.bullets = [];
        this.boxes = [];
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isRunning = false; // Track if the player is running
        
        // Gun model and animation properties
        this.gun = null;
        this.gunModel = null;
        this.gunAnimations = {};
        this.animationMixer = null;
        this.currentAnimation = null;
        
        // Flashlight
        this.hasFlashlight = false;
        this.flashlight = null;
        this.flashlightOn = true;
        
        // Jumping properties
        this.isJumping = false;
        this.jumpHeight = 10;
        this.gravity = 30;
        this.verticalVelocity = 0;
        this.groundLevel = 1.7; // Default height of camera from ground

        // Aiming properties
        this.isAiming = false;
        this.aimTransitionSpeed = 8; // Speed of aim transition
        this.defaultGunPosition = new THREE.Vector3(0.3, -0.3, -0.5); // Centered gun position
        this.aimGunPosition = new THREE.Vector3(0, -0.2, -0.4); // Slightly raised when aiming
        this.defaultFOV = 75;
        this.aimFOV = 65; // Slightly zoomed in FOV when aiming

        // Camera shake properties
        this.bobbing = {
            time: 0,
            cycle: 0.5, // Time in seconds for a complete bob cycle
            intensity: 0.01, // Normal walking intensity
            runIntensity: 0.015, // Running intensity (stronger)
            gunIntensity: 0.001, // Gun bobbing intensity
            gunRunIntensity: 0.005, // Gun running intensity
            aimIntensity: 0.005 // Reduced intensity when aiming
        };

        // Sound related properties
        this.footstepTimer = 0;
        this.footstepInterval = 0.5; // Time between footsteps in seconds
        this.runFootstepInterval = 0.3; // Faster footsteps when running
        this.wasJumping = false; // To detect landing
        this.activeFootstepSound = null;
    }
    
    init() {
        // Set up camera position
        this.camera.position.set(0, this.groundLevel, 0);
        
        // Add pointer lock controls
        this.controls = new PointerLockControls(this.camera, document.body);
        
        // Handle click to lock pointer
        document.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            }
        });
        
        // Add key listeners
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Add mouse click for shooting
        document.addEventListener('mousedown', (event) => this.onMouseDown(event));
        
        // Add reload key
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyR') {
                this.reload();
            }
            
            // Toggle flashlight with F key
            if (event.code === 'KeyF' && this.hasFlashlight) {
                this.toggleFlashlight();
            }
        });
        
        // Add space bar for jumping
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                this.jump();
            }
        });

        // Add mouse right click for aiming
        document.addEventListener('mousedown', (event) => {
            if (event.button === 2 && this.controls.isLocked) { // Right mouse button
                this.startAiming();
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (event.button === 2 && this.controls.isLocked) { // Right mouse button
                this.stopAiming();
            }
        });
        
        // Prevent context menu from appearing on right-click
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        // Create a simple gun model
        this.createGunModel();
        
        // Create flashlight if needed
        if (this.hasFlashlight) {
            this.createFlashlight();
        }

        // start multiplier timer
        if (this.multiplier > 1) {
            this.startMultiplierTimer();
        }
    }

    startMultiplierTimer() {
        if (this.scoreDuration > 0) {
            setTimeout(() => {
                this.multiplier = 1;
                this.scoreDuration = 0;
                document.getElementById('multiplier').style.display = 'none'; // Hide multiplier UI
            }, this.scoreDuration * 1000);
        }
    }
    
    createGunModel() {
        // Create a variable to store the gun model
        this.gun = new THREE.Object3D();
        
        // Position the gun holder in front of the camera
        this.gun.position.copy(this.defaultGunPosition);
        this.camera.add(this.gun);
        this.scene.add(this.camera);
        
        // Load the gun model
        const loader = new GLTFLoader();
        loader.load(
            // The path to your gun model
            '../../assets/models/gun/scene.gltf', // Adjust the path to your model file
            (gltf) => {
                // Gun model loaded successfully
                this.gunModel = gltf.scene;
                
                // Apply appropriate scaling to the model
                this.gunModel.scale.set(0.1, 0.1, 0.1); // Adjust scale as needed

                // Apply rotation if needed to match proper orientation
                this.gunModel.rotation.y = Math.PI; // Rotate 180 degrees if needed
                
                // Log the model structure to help debug
                console.log('Model structure:', this.gunModel);
                
                // Add the loaded model to the gun object
                this.gun.add(this.gunModel);
                
                // Enable shadows and ensure visibility for all meshes including hands
                this.gunModel.traverse((node) => {
                    if (node.isMesh) {
                        console.log('Found mesh:', node.name);
                        node.castShadow = true;
                        node.receiveShadow = true;
                        node.visible = true; // Ensure all meshes are visible
                        
                        // Check if this is a hand material and ensure it's visible
                        if (node.name.toLowerCase().includes('Object') || 
                            (node.material && node.material.name && 
                             node.material.name.toLowerCase().includes('Object'))) {
                            console.log('Found hand mesh:', node.name);
                            // Make sure hand materials are visible
                            if (Array.isArray(node.material)) {
                                node.material.forEach(mat => {
                                    mat.transparent = false;
                                    mat.opacity = 1.0;
                                });
                            } else if (node.material) {
                                node.material.transparent = false;
                                node.material.opacity = 1.0;
                            }
                        }
                    }
                });
                
                // Set up animations if they exist
                if (gltf.animations && gltf.animations.length > 0) {
                    // Create animation mixer
                    this.animationMixer = new THREE.AnimationMixer(this.gunModel);
                    
                    // Store each animation with a name
                    gltf.animations.forEach((clip) => {
                        console.log('Animation clip:', clip.name);
                        // Create the animation action
                        const action = this.animationMixer.clipAction(clip);
                        
                        // Store the animation by name
                        this.gunAnimations[clip.name] = action;
                        
                        // Configure the shooting animation for non-looping
                        if (clip.name === 'Rig|MK_Shot' || clip.name === 'Hands|Shot') {
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                        }
                        
                        // Configure the reload animation
                        if (clip.name === 'Rig|MK_ReloadFull' || clip.name === 'Hands|Reloat_f') {
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                        }
                        
                        console.log(`Loaded animation: ${clip.name}`);
                    });
                }
            },
            // onProgress callback
            (xhr) => {
                console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
            },
            // onError callback
            (error) => {
                console.error('Error loading gun model:', error);
                
                // Fallback to a simple box if model fails to load
                const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
                const gunMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
                const gunMesh = new THREE.Mesh(gunGeometry, gunMaterial);
                this.gun.add(gunMesh);
            }
        );
    }
    
    createFlashlight() {
        // Create spotlight for flashlight
        // don't display the flashlight
        this.flashlight = new THREE.SpotLight(0xffffff, 1.5, 30, Math.PI / 6, 0.5, 1);
        this.flashlight.position.set(0, 0, 0);
        this.flashlight.target.position.set(0, 0, -1);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
        
        // Adjust spotlight position to be slightly offset from camera
        this.flashlight.position.set(0, -0.1, 0);
        this.flashlight.target.position.set(0, -0.1, -1);
        
        // Enable shadows
        this.flashlight.castShadow = true;
        this.flashlight.shadow.mapSize.width = 1024;
        this.flashlight.shadow.mapSize.height = 1024;
        this.flashlight.shadow.camera.near = 0.5;
        this.flashlight.shadow.camera.far = 30;
    }
    
    toggleFlashlight() {
        if (this.flashlight) {
            this.flashlightOn = !this.flashlightOn;
            this.flashlight.visible = this.flashlightOn;
        }
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.isRunning = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.isRunning = false;
                break;
        }
    }
    
    onMouseDown(event) {
        // Only shoot if the game is not paused and controls are locked
        if (event.button === 0 && this.controls.isLocked) { // Left mouse button
            this.shoot();
        }
    }
    
    startAiming() {
        this.isAiming = true;
        // Reduce movement speed when aiming
        this.moveSpeed = 2;
    }
    
    stopAiming() {
        this.isAiming = false;
        // Restore normal movement speed
        this.moveSpeed = 4;
    }
    
    shoot() {
        // Check if UI is in pause state by looking for the pause menu
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu.style.display === 'flex') {
            return; // Don't shoot when paused
        }
        
        if (this.canShoot && this.ammo > 0 && this.controls.isLocked) {
            // Create bullet
            const bullet = new Bullet(this.camera.position, this.camera.getWorldDirection(new THREE.Vector3()));
            bullet.init(this.scene);
            this.bullets.push(bullet);
            
            // Update ammo
            this.ammo--;
            document.getElementById('ammo').textContent = `Ammo: ${this.ammo}`;
            
            // Play gunshot sound
            audioManager.play('gunshot', { volume: 0.7 });
            
            // Play shooting animation if available
            this.playShootAnimation();
            
            // Add muzzle flash effect
            this.muzzleFlash();
            
            // Add cooldown
            this.canShoot = false;
            setTimeout(() => {
                this.canShoot = true;
            }, 100);
            
            // Auto reload when empty
            if (this.ammo === 0) {
                this.reload();
            }
        } else if (this.ammo === 0 && this.controls.isLocked) {
            // Play empty gun click sound
            audioManager.play('empty', { volume: 0.5 });
        }
    }
    
    playShootAnimation() {
        // Check if we have animations available
        if (!this.animationMixer || !this.gunAnimations) return;
        
        // Use the exact animation name for shooting
        let shootAnimation = this.gunAnimations['Rig|MK_Shot'];
        // If the shoot animation is not found, try the alternative name
        if (!shootAnimation) {
            shootAnimation = this.gunAnimations['Hands|Shot'];
        }
        
        // Play the animation if found
        if (shootAnimation) {
            // Reset and play the animation
            shootAnimation.reset();
            shootAnimation.play();
            
            // Store as current animation
            this.currentAnimation = shootAnimation;
        }
    }
    
    reload() {
        if (this.ammo < this.max_ammo && this.controls.isLocked) {
            this.canShoot = false;
            
            // Play reload sound
            audioManager.play('reload', { volume: 0.6 });
            
            // Play reload animation if available
            this.playReloadAnimation();
            
            setTimeout(() => {
                this.ammo = this.max_ammo; // Reload to max ammo
                this.canShoot = true;
                document.getElementById('ammo').textContent = `Ammo: ${this.ammo}`;
            }, this.reloadTime * 1000);
        }
    }
    
    playReloadAnimation() {
        // Check if we have animations available
        if (!this.animationMixer || !this.gunAnimations) return;
        
        // Use the exact animation name for reloading
        let reloadAnimation = this.gunAnimations['Rig|MK_ReloadFull'];
        // If the reload animation is not found, try the alternative name
        if (!reloadAnimation) {
            reloadAnimation = this.gunAnimations['Hands|Reloat_f'];
        }
        
        // Play the animation if found
        if (reloadAnimation) {
            // Reset and play the animation
            reloadAnimation.reset();
            reloadAnimation.setEffectiveTimeScale(0.7); // Ensure slow speed
            reloadAnimation.play();
            
            // Store as current animation
            this.currentAnimation = reloadAnimation;
        } else {
            // Fallback to simple reload animation if the model animation isn't available
            const originalPos = this.gun.position.y;
            this.gun.position.y -= 0.1;
            
            setTimeout(() => {
                this.gun.position.y = originalPos;
            }, this.reloadTime * 1000 * 0.8); // Move back up a bit before the reload completes
        }
    }
    
    muzzleFlash() {
        // Create a quick flash at the end of the gun
        const flash = new THREE.PointLight(0xffff00, 2, 3);
        flash.position.set(0, -0.3, -1); // Update flash position to match centered gun
        this.camera.add(flash);
        
        setTimeout(() => {
            this.camera.remove(flash);
        }, 50);
    }
    
    jump() {
        if (!this.isJumping && this.controls.isLocked) {
            this.isJumping = true;
            this.verticalVelocity = this.jumpHeight;
            
            // Play jump sound
            audioManager.play('jump', { volume: 0.4 });
        }
    }
    
    update(delta) {
        // Check if game is paused by checking the pause menu
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu.style.display === 'flex') {
            return; // Skip updates when paused
        }
        
        // Update animation mixer if it exists
        if (this.animationMixer) {
            this.animationMixer.update(delta);
        }
        
        if (this.controls.isLocked) {
            // Calculate movement
            this.velocity.x = 0;
            this.velocity.z = 0;
            
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();
            
            // Cannot run while aiming
            const isActuallyRunning = this.isRunning && !this.isAiming;
            
            // Apply running speed multiplier if shift is pressed and not aiming
            const currentSpeed = isActuallyRunning ? this.moveSpeed * this.runSpeedMultiplier : this.moveSpeed;
            
            if (this.moveForward || this.moveBackward) {
                this.velocity.z = this.direction.z * currentSpeed * delta;
            }
            
            if (this.moveLeft || this.moveRight) {
                this.velocity.x = this.direction.x * currentSpeed * delta;
            }
            
            // Apply vertical movement for jumping
            this.verticalVelocity -= this.gravity * delta;
            this.camera.position.y += this.verticalVelocity * delta;
            
            // Check if we've landed
            if (this.camera.position.y < this.groundLevel) {
                this.camera.position.y = this.groundLevel;
                this.verticalVelocity = 0;
                this.isJumping = false;
            }
            
            // Handle aiming state transitions
            this.updateAimingState(delta);
            
            // Apply camera bobbing effect when moving and not jumping
            if ((this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) && !this.isJumping) {
                this.applyBobbing(delta);
            } else {
                // Gradually reset bobbing when not moving
                this.resetBobbing(delta);
            }
            
            // Handle movement sounds
            this.updateMovementSounds(delta);
            
            // Check if we've landed
            if (this.wasJumping && !this.isJumping) {
                // Play landing sound
                audioManager.play('land', { volume: 0.5 });
            }
            this.wasJumping = this.isJumping;
            
            this.controls.moveRight(this.velocity.x);
            this.controls.moveForward(this.velocity.z);
        }

        // Check player is near a box
        this.boxes.forEach(box => {
            const distance = this.getPosition().distanceTo(box.position);
            if (distance < 4.5) // Adjust distance as needed
                document.addEventListener('keydown', (event) => {
                    if (event.key === 'e') {
                        box.interact(this); // Call the interact method on the box
                    }
                }, { once: true }); // Use { once: true } to ensure the listener is removed after execution
        });
    }
    
    updateAimingState(delta) {
        if (this.gun) {
            // Smoothly transition gun position and FOV when aiming
            if (this.isAiming) {
                // Interpolate to aim position
                this.gun.position.x += (this.aimGunPosition.x - this.gun.position.x) * this.aimTransitionSpeed * delta;
                this.gun.position.y += (this.aimGunPosition.y - this.gun.position.y) * this.aimTransitionSpeed * delta;
                this.gun.position.z += (this.aimGunPosition.z - this.gun.position.z) * this.aimTransitionSpeed * delta;
                
                // Transition FOV
                this.camera.fov += (this.aimFOV - this.camera.fov) * this.aimTransitionSpeed * delta;
            } else {
                // Interpolate back to default position
                this.gun.position.x += (this.defaultGunPosition.x - this.gun.position.x) * this.aimTransitionSpeed * delta;
                this.gun.position.y += (this.defaultGunPosition.y - this.gun.position.y) * this.aimTransitionSpeed * delta;
                this.gun.position.z += (this.defaultGunPosition.z - this.gun.position.z) * this.aimTransitionSpeed * delta;
                
                // Transition FOV back
                this.camera.fov += (this.defaultFOV - this.camera.fov) * this.aimTransitionSpeed * delta;
            }
            
            // Update projection matrix for FOV changes
            this.camera.updateProjectionMatrix();
        }
    }
    
    applyBobbing(delta) {
        // Update bobbing time based on movement speed
        const speedFactor = this.isRunning && !this.isAiming ? 2.0 : 1.0;
        this.bobbing.time += delta * speedFactor;
        
        // Calculate vertical bobbing (sin wave)
        const verticalBob = Math.sin(this.bobbing.time * Math.PI * 2 / this.bobbing.cycle);
        
        // Calculate horizontal bobbing (shifted sin wave)
        const horizontalBob = Math.sin(this.bobbing.time * Math.PI * 2 / this.bobbing.cycle + Math.PI / 2);
        
        // Determine bobbing intensity
        let bobIntensity, gunBobIntensity;
        
        if (this.isAiming) {
            // Reduced bobbing when aiming
            bobIntensity = this.bobbing.aimIntensity;
            gunBobIntensity = this.bobbing.aimIntensity;
        } else if (this.isRunning) {
            // Running intensities
            bobIntensity = this.bobbing.runIntensity;
            gunBobIntensity = this.bobbing.gunRunIntensity;
        } else {
            // Walking intensities
            bobIntensity = this.bobbing.intensity;
            gunBobIntensity = this.bobbing.gunIntensity;
        }
        
        // Apply vertical bobbing to camera
        this.camera.position.y += verticalBob * bobIntensity;
        
        // Apply gun bobbing (more dramatic than camera)
        if (this.gun) {
            // Apply less intense bobbing when aiming
            if (this.isAiming) {
                // Only apply minimal bobbing effect when aiming
                this.gun.position.y += verticalBob * gunBobIntensity;
                this.gun.position.x += horizontalBob * gunBobIntensity * 0.3;
            } else {
                // Normal bobbing when not aiming
                this.gun.position.y += verticalBob * gunBobIntensity * 2;
                this.gun.position.x += horizontalBob * gunBobIntensity;
                this.gun.rotation.z = horizontalBob * gunBobIntensity * 0.5;
            }
        }
    }
    
    resetBobbing(delta) {
        // Gradually reset bobbing time
        this.bobbing.time = 0;
        
        // Reset gun position smoothly if it exists
        if (this.gun) {
            // Interpolate back to default position (now centered)
            this.gun.position.y += (this.defaultGunPosition.y - this.gun.position.y) * delta * 5;
            this.gun.position.x += (this.defaultGunPosition.x - this.gun.position.x) * delta * 5;
            this.gun.rotation.z += (0 - this.gun.rotation.z) * delta * 5;
        }
    }
    
    updateMovementSounds(delta) {
        const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        
        // Don't play footsteps while jumping
        if (isMoving && !this.isJumping) {
            this.footstepTimer += delta;
            
            // Determine the correct interval based on whether running or walking
            const currentInterval = this.isRunning && !this.isAiming 
                ? this.runFootstepInterval 
                : this.footstepInterval;
            
            if (this.footstepTimer >= currentInterval) {
                this.footstepTimer = 0;
                
                // Play the appropriate footstep sound
                if (this.isRunning && !this.isAiming) {
                    audioManager.play('footstepRun', { volume: 0.4 });
                } else {
                    audioManager.play('footstep', { volume: 0.3 });
                }
            }
        } else {
            // Reset timer when not moving
            this.footstepTimer = 0;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
    
    getPosition() {
        return this.camera.position;
    }

    

    playerPosition() {
        return this.camera.position;
    }
}