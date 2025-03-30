import * as THREE from 'three';

export class Bullet {
    constructor(position, direction) {
        this.position = position.clone();
        this.direction = direction.clone().normalize();
        this.speed = 30;
        this.mesh = null;
        this.maxLifetime = 2; // seconds
        this.lifetime = 0;
    }
    
    init(scene) {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position the bullet at the camera (player's position)
        this.mesh.position.copy(this.position);
        // Offset bullet to appear from gun, not from center of camera
        this.mesh.position.x += this.direction.x * 0.5;
        this.mesh.position.y += this.direction.y * 0.5;
        this.mesh.position.z += this.direction.z * 0.5;
        
        scene.add(this.mesh);
    }
    
    update(delta) {
        // Move the bullet
        this.mesh.position.x += this.direction.x * this.speed * delta;
        this.mesh.position.y += this.direction.y * this.speed * delta;
        this.mesh.position.z += this.direction.z * this.speed * delta;
        
        // Update lifetime
        this.lifetime += delta;
    }
    
    hasExpired() {
        return this.lifetime > this.maxLifetime;
    }
    
    checkCollision(position, radius) {
        const distance = this.mesh.position.distanceTo(position);
        return distance < radius;
    }
}