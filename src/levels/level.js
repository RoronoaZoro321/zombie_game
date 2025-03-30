import * as THREE from 'three';

export class Level {
    constructor(scene) {
        this.scene = scene;
    }
    
    create() {
        // Add floor
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x556b2f,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Add ambient light - darker for forest
        const ambientLight = new THREE.AmbientLight(0x333333, 0.8);
        this.scene.add(ambientLight);
        
        // Add directional light (moonlight)
        const directionalLight = new THREE.DirectionalLight(0xaaaaff, 0.6);
        directionalLight.position.set(1, 3, 2);
        directionalLight.castShadow = true;
        
        // Adjust shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        
        this.scene.add(directionalLight);
        
        // Add some trees, rocks, and fog for environment
        this.addForestObjects();
    }
    
    addForestObjects() {
        // Trees
        this.placeRandomObjects(50, () => this.createTree(), 40);
        
        // Rocks
        this.placeRandomObjects(15, () => this.createRock(), 40);
        
        // Add some fog particles
        this.addFogParticles();
    }
    
    createTree() {
        const tree = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.5, 3, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);
        
        // Tree leaves
        const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 4.5;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        tree.add(leaves);
        
        return tree;
    }
    
    createRock(color = 0x888888, size = 0.5) {
        const rockGeometry = new THREE.DodecahedronGeometry(
            size + Math.random() * 0.5,
            0
        );
        const rockMaterial = new THREE.MeshLambertMaterial({
            color: color,
            flatShading: true
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.y = size / 2;
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        return rock;
    }
    
    addFogParticles() {
        // Simple particle system for fog
        const particleCount = 200;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particlePositions[i3] = (Math.random() - 0.5) * 60;
            particlePositions[i3 + 1] = Math.random() * 2;
            particlePositions[i3 + 2] = (Math.random() - 0.5) * 60;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xcccccc,
            size: 0.5,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
    }
    
    placeRandomObjects(count, createFunc, maxDistance, minDistanceFromCenter = 0) {
        for (let i = 0; i < count; i++) {
            const object = createFunc();
            
            // Generate position
            let x, z;
            let distFromCenter;
            do {
                x = (Math.random() - 0.5) * maxDistance * 2;
                z = (Math.random() - 0.5) * maxDistance * 2;
                distFromCenter = Math.sqrt(x * x + z * z);
            } while (distFromCenter < minDistanceFromCenter);
            
            object.position.set(x, 0, z);
            this.scene.add(object);
        }
    }
}