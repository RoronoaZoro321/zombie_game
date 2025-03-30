import * as THREE from 'three';

export class Zombie {
    constructor(scene, position, mapId = 1) {
        this.scene = scene;
        this.position = position;
        this.model = null;
        this.mapId = mapId;
        
        // Adjust zombie properties based on map
        if (this.mapId === 1) {
            // Forest zombies - slower but tougher
            this.speed = 1.2 + Math.random() * 0.5;
            this.health = 3;
            this.attackRange = 2;
        } else {
            // Desert zombies - faster but weaker
            this.speed = 2 + Math.random() * 0.8;
            this.health = 2;
            this.attackRange = 3;
        }
        
        this.attackCooldown = 5;
        this.lastAttackTime = 0;
    }
    
    init() {
        // Create a zombie model based on map type
        if (this.mapId === 1) {
            this.createForestZombie();
        } else {
            this.createDesertZombie();
        }
    }
    
    createForestZombie() {
        // Create a simple zombie model
        const body = new THREE.Group();
        
        // Zombie body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2d572c });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.position.y = 0.9;
        body.add(bodyMesh);
        
        // Zombie head
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x2d572c });
        const headMesh = new THREE.Mesh(headGeometry, headMaterial);
        headMesh.position.y = 2;
        body.add(headMesh);
        
        // Zombie arms
        const armGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x2d572c });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 0.9, 0);
        body.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 0.9, 0);
        body.add(rightArm);
        
        // Zombie legs
        const legGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x2d572c });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.25, 0, 0);
        body.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.25, 0, 0);
        body.add(rightLeg);
        
        // Add zombie to scene
        body.position.copy(this.position);
        this.model = body;
        this.scene.add(this.model);
    }
    
    createDesertZombie() {
        // Create a desert zombie model - different color and slightly different proportions
        const body = new THREE.Group();
        
        // Zombie body - more withered
        const bodyGeometry = new THREE.BoxGeometry(0.7, 1.7, 0.35);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x9c6d51 }); // Desert mummified color
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.position.y = 0.85;
        body.add(bodyMesh);
        
        // Zombie head - slightly smaller
        const headGeometry = new THREE.BoxGeometry(0.55, 0.55, 0.55);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x9c6d51 });
        const headMesh = new THREE.Mesh(headGeometry, headMaterial);
        headMesh.position.y = 1.9;
        body.add(headMesh);
        
        // Zombie arms - thinner
        const armGeometry = new THREE.BoxGeometry(0.15, 0.9, 0.15);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x9c6d51 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.45, 0.85, 0);
        body.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.45, 0.85, 0);
        body.add(rightArm);
        
        // Zombie legs - thinner
        const legGeometry = new THREE.BoxGeometry(0.25, 0.85, 0.25);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x9c6d51 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.22, 0, 0);
        body.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.22, 0, 0);
        body.add(rightLeg);
        
        // Add some bandage/wrapping details for mummy appearance
        const addBandage = (x, y, z, width, height, depth, rotation = 0) => {
            const bandageGeometry = new THREE.BoxGeometry(width, height, depth);
            const bandageMaterial = new THREE.MeshLambertMaterial({ color: 0xe0cfb1 });
            const bandage = new THREE.Mesh(bandageGeometry, bandageMaterial);
            bandage.position.set(x, y, z);
            if (rotation) {
                bandage.rotation.y = rotation;
            }
            body.add(bandage);
        };
        
        // Add a few bandages
        addBandage(0, 1.2, 0.2, 0.7, 0.1, 0.4);
        addBandage(0, 0.5, 0.2, 0.7, 0.12, 0.4);
        addBandage(0, 1.8, 0.0, 0.55, 0.1, 0.55);
        
        // Add zombie to scene
        body.position.copy(this.position);
        this.model = body;
        this.scene.add(this.model);
    }
    
    update(delta, playerPosition) {
        if (this.health <= 0) return;
        
        // Direction to player
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.model.position)
            .normalize();
        
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
        
        // Animate zombie walking - different animation speeds based on map type
        const animSpeed = this.mapId === 1 ? 2 : 3; // Desert zombies have faster animation
        const time = Date.now() * 0.005;
        this.model.children[2].rotation.x = Math.sin(time * animSpeed) * 0.4; // Left arm
        this.model.children[3].rotation.x = Math.sin(time * animSpeed + Math.PI) * 0.4; // Right arm
        this.model.children[4].rotation.x = Math.sin(time * animSpeed) * 0.4; // Left leg
        this.model.children[5].rotation.x = Math.sin(time * animSpeed + Math.PI) * 0.4; // Right leg
    }
    
    takeDamage() {
        this.health--;
        
        // Make zombie flash red when hit
        const originalColors = [];
        this.model.children.forEach(part => {
            if (part.material) {
                originalColors.push(part.material.color.clone());
                part.material.color.set(0xff0000);
            }
        });
        
        setTimeout(() => {
            this.model.children.forEach((part, index) => {
                if (part.material && index < originalColors.length) {
                    part.material.color.copy(originalColors[index]);
                }
            });
        }, 100);
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    canAttack(playerPosition) {
        const currentTime = Date.now();
        const distanceToPlayer = this.model.position.distanceTo(playerPosition);
        
        console.log("Distance to player:", distanceToPlayer);
        console.log("Attack range:", this.attackRange);
        console.log("Current time:", currentTime);
        console.log("Last attack time:", this.lastAttackTime);
        console.log("Attack cooldown:", this.attackCooldown);

        if (distanceToPlayer <= this.attackRange) {
            console.log("Zombie is close enough to attack!");
            return true;
        }
    
        console.log(distanceToPlayer <= this.attackRange ? "1Zombie is close enough to attack!" : "1Zombie is too far to attack.");
        console.log(currentTime - this.lastAttackTime > this.attackCooldown * 1000 ? "2Zombie can attack!" : "2Zombie is on cooldown.");
        if (distanceToPlayer <= this.attackRange && currentTime - this.lastAttackTime > this.attackCooldown * 1000) {

            this.lastAttackTime = currentTime;
            console.log("Zombie attacks!");
            return true;
        }
        
        console.log("Zombie cannot attack yet.");
        return false;
    }
    
    getPosition() {
        return this.model.position;
    }
}