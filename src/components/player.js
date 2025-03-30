import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Bullet } from './bullet.js';

export class Player {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.controls = null;
        this.moveSpeed = 8;
        this.health = 100;
        this.ammo = 30;
        this.canShoot = true;
        this.reloadTime = 1.5;
        this.bullets = [];
        
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        // Gun model
        this.gun = null;
        
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
        
        // Create a simple gun model
        this.createGunModel();
        
        // Create flashlight if needed
        if (this.hasFlashlight) {
            this.createFlashlight();
        }
    }
    
    createGunModel() {
        const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
        const gunMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        this.gun = new THREE.Mesh(gunGeometry, gunMaterial);
        
        // Position the gun in front of the camera
        this.gun.position.set(0.3, -0.2, -0.5);
        this.camera.add(this.gun);
        this.scene.add(this.camera);
    }
    
    createFlashlight() {
        // Create spotlight for flashlight
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
        
        // Add visual cue for flashlight on gun
        const flashlightGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8);
        const flashlightMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
        const flashlightMesh = new THREE.Mesh(flashlightGeometry, flashlightMaterial);
        flashlightMesh.rotation.x = Math.PI / 2;
        flashlightMesh.position.set(0.3, -0.15, -0.3);
        this.camera.add(flashlightMesh);
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
        }
    }
    
    onMouseDown(event) {
        // Only shoot if the game is not paused and controls are locked
        if (event.button === 0 && this.controls.isLocked) { // Left mouse button
            this.shoot();
        }
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
            
            // Add gunshot sound
            // A sound could be added here
            
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
        }
    }
    
    reload() {
        if (this.ammo < 30 && this.controls.isLocked) {
            this.canShoot = false;
            
            // Simple reload animation
            const originalPos = this.gun.position.y;
            this.gun.position.y -= 0.1;
            
            setTimeout(() => {
                this.gun.position.y = originalPos;
                this.ammo = 30;
                this.canShoot = true;
                document.getElementById('ammo').textContent = `Ammo: ${this.ammo}`;
            }, this.reloadTime * 1000);
        }
    }
    
    muzzleFlash() {
        // Create a quick flash at the end of the gun
        const flash = new THREE.PointLight(0xffff00, 2, 3);
        flash.position.set(0.3, -0.2, -1);
        this.camera.add(flash);
        
        setTimeout(() => {
            this.camera.remove(flash);
        }, 50);
    }
    
    jump() {
        if (!this.isJumping && this.controls.isLocked) {
            this.isJumping = true;
            this.verticalVelocity = this.jumpHeight;
        }
    }
    
    update(delta) {
        // Check if game is paused by checking the pause menu
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu.style.display === 'flex') {
            return; // Skip updates when paused
        }
        
        if (this.controls.isLocked) {
            // Calculate movement
            this.velocity.x = 0;
            this.velocity.z = 0;
            
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();
            
            if (this.moveForward || this.moveBackward) {
                this.velocity.z = this.direction.z * this.moveSpeed * delta;
            }
            
            if (this.moveLeft || this.moveRight) {
                this.velocity.x = this.direction.x * this.moveSpeed * delta;
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
            
            this.controls.moveRight(this.velocity.x);
            this.controls.moveForward(this.velocity.z);
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
    
    getPosition() {
        return this.camera.position;
    }
}