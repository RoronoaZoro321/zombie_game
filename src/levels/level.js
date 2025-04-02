import * as THREE from 'three';
import audioManager from '../audio/audioManager.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { loop } from 'three/tsl';

export class Level {
    constructor(scene) {
        this.scene = scene;
        this.mapSize = 100; // Size of the floor plane
        this.barrierHeight = 5; // Height of the barrier walls
    }
    
    create() {
        // Load the texture
        const textureLoader = new THREE.TextureLoader();
        const floorTexture = textureLoader.load('../../assets/grass.webp'); // Replace with your texture path

        // Set texture properties (optional)
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(10, 10); // Adjust the repeat value as needed

        // Create floor with texture
        const floorGeometry = new THREE.PlaneGeometry(this.mapSize, this.mapSize);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            map: floorTexture, // Use the loaded texture
            //make it darker
            color: 0x333333, // Darker color for forest
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Add barrier walls around the perimeter
        this.createBarriers();
        
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
        
        // Start playing forest environment sounds
        this.startEnvironmentSounds();
    }

    startEnvironmentSounds() {
        // Play environment sounds
        audioManager.play('environment', { volume: 0.4, loop: true });
    }

    cleanup() {   
        // Stop all environment sounds
        audioManager.stop('environment');
    }
    
    createBarriers() {
        const halfSize = this.mapSize / 2;
        const barrierMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4b3621, // Dark brown color for wooden barriers
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create invisible collision barriers
        const invisibleMaterial = new THREE.MeshBasicMaterial({ 
            transparent: true, 
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        // Create visible decorative barriers
        this.createVisibleBarrier(halfSize, 0, 0, this.mapSize, barrierMaterial, 'z'); // North
        this.createVisibleBarrier(-halfSize, 0, 0, this.mapSize, barrierMaterial, 'z'); // South
        this.createVisibleBarrier(0, 0, halfSize, this.mapSize, barrierMaterial, 'x'); // East
        this.createVisibleBarrier(0, 0, -halfSize, this.mapSize, barrierMaterial, 'x'); // West
        
        // Create invisible collision barriers (slightly larger than visible ones)
        const collisionSize = this.mapSize + 2;
        this.createCollisionBarrier(halfSize + 0.5, 0, 0, collisionSize, invisibleMaterial, 'z'); // North
        this.createCollisionBarrier(-halfSize - 0.5, 0, 0, collisionSize, invisibleMaterial, 'z'); // South
        this.createCollisionBarrier(0, 0, halfSize + 0.5, collisionSize, invisibleMaterial, 'x'); // East
        this.createCollisionBarrier(0, 0, -halfSize - 0.5, collisionSize, invisibleMaterial, 'x'); // West
    }
    
    createVisibleBarrier(x, y, z, length, material, axis) {
        // Create a row of fence posts with connecting elements
        const barrier = new THREE.Group();
        const postCount = Math.floor(length / 4); // Space posts every 4 units
        
        for (let i = 0; i < postCount; i++) {
            const offset = (i * 4) - (length / 2) + 2;
            const postPosition = axis === 'x' ? [offset, 0, 0] : [0, 0, offset];
            
            // Fence post
            const postGeometry = new THREE.BoxGeometry(0.4, this.barrierHeight, 0.4);
            const post = new THREE.Mesh(postGeometry, material);
            post.position.set(...postPosition);
            post.position.y = this.barrierHeight / 2;
            post.castShadow = true;
            post.receiveShadow = true;
            barrier.add(post);
            
            // Horizontal boards (two per section)
            if (i < postCount - 1) {
                for (let j = 0; j < 2; j++) {
                    const height = 1 + j * 2; // Heights at 1 and 3 units
                    const boardGeometry = new THREE.BoxGeometry(
                        axis === 'x' ? 4 : 0.2, 
                        0.4, 
                        axis === 'z' ? 4 : 0.2
                    );
                    const board = new THREE.Mesh(boardGeometry, material);
                    
                    if (axis === 'x') {
                        board.position.set(offset + 2, height, 0);
                    } else {
                        board.position.set(0, height, offset + 2);
                    }
                    
                    board.castShadow = true;
                    board.receiveShadow = true;
                    barrier.add(board);
                }
            }
        }
        
        barrier.position.set(x, y, z);
        this.scene.add(barrier);
        return barrier;
    }
    
    createCollisionBarrier(x, y, z, length, material, axis) {
        // Create invisible collision walls
        const wallGeometry = new THREE.BoxGeometry(
            axis === 'z' ? length : 1, 
            this.barrierHeight * 1.5, 
            axis === 'x' ? length : 1
        );
        const wall = new THREE.Mesh(wallGeometry, material);
        wall.position.set(x, y + (this.barrierHeight * 1.5) / 2, z);
        wall.userData.isBarrier = true; // Flag for collision detection
        this.scene.add(wall);
        return wall;
    }
    
    addForestObjects() {
        // Trees - keep them away from barriers
        this.placeRandomObjects(15, () => this.createTree(), 40, 10);
        
        // Rocks
        this.placeRandomObjects(15, () => this.createRock(), 40, 5);
        
        // Add some fog particles
        // this.addFogParticles();
    }
    
    createTree() {
        // Create a group to hold the loaded tree
        const treeGroup = new THREE.Group();
        const loader = new GLTFLoader();
        
        // Load the forest model
        loader.load('../../assets/tree.glb', (gltf) => {
            const tree = gltf.scene;
            
            // Apply random scale variation to make trees look different
            const scale = 0.8 + Math.random() * 0.4;
            tree.scale.set(scale, scale, scale);
            
            // Apply random rotation for variety
            tree.rotation.y = Math.random() * Math.PI * 2;
            
            // Set shadow properties for the entire tree model
            tree.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Add the loaded tree model to the group
            treeGroup.add(tree);
        }, undefined, (error) => {
            console.error('Error loading tree model:', error);
        });
        
        // Return the group immediately so it can be positioned
        return treeGroup;
    }
    
    createRock(color = 0x888888, size = 0.5) {
        const rockTexture = new THREE.TextureLoader().load('../../assets/rock.jpeg');
        rockTexture.wrapS = THREE.RepeatWrapping;
        rockTexture.wrapT = THREE.RepeatWrapping;
        rockTexture.repeat.set(10, 10); // Adjust the repeat value as needed

        const rockGeometry = new THREE.DodecahedronGeometry(
            size + Math.random() * 0.5,
            0
        );
        const rockMaterial = new THREE.MeshLambertMaterial({
            map: rockTexture,
            color: color,
            roughness: 0.9,
            metalness: 0.1
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
        const barrierBuffer = 6; // Distance to keep objects away from the barriers
        const halfSize = this.mapSize / 2 - barrierBuffer;
        
        for (let i = 0; i < count; i++) {
            const object = createFunc();
            
            // Generate position
            let x, z;
            let distFromCenter;
            do {
                x = (Math.random() - 0.5) * maxDistance * 2;
                z = (Math.random() - 0.5) * maxDistance * 2;
                distFromCenter = Math.sqrt(x * x + z * z);
                
                // Keep objects within map boundaries
                x = Math.max(-halfSize, Math.min(halfSize, x));
                z = Math.max(-halfSize, Math.min(halfSize, z));
            } while (distFromCenter < minDistanceFromCenter);
            
            object.position.set(x, 0, z);
            this.scene.add(object);
        }
    }
    
    // Helper method for collision detection with barriers
    isCollidingWithBarrier(position, radius = 1) {
        // Check if position is near map edges
        const buffer = radius + 1;
        const limit = this.mapSize / 2 - buffer;
        
        return (
            position.x > limit || 
            position.x < -limit || 
            position.z > limit || 
            position.z < -limit
        );
    }
}