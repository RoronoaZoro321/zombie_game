import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UI } from '../ui/ui.js';

export class Box {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.model = null;
        this.ability = ['health', 'ammo', 'damage', 'speed'];
        this.open = false;
    }

    init() {
        const loader = new GLTFLoader();
        loader.load('../../assets/wood_box.glb', (gltf) => {
            this.model = gltf.scene;
            this.model.position.copy(this.position);
            this.model.scale.set(1, 1, 1); // Adjust scale if necessary
            this.scene.add(this.model);
        }, undefined, (error) => {
            console.error('Error loading box model:', error);
        });
    }

    handleKeyPress(event) {
        if (event.key === 'e') {
            this.interact();
        }
    }

    interact(player) {
        if (!this.open) { // Check if the box is already opened
            this.open = true; // Set the flag to true
            this.scene.remove(this.model);
            this.spawnLoot(player);
        }
    }

    // In MultipleFiles/box.js
    spawnLoot(player) {
        const lootType = this.ability[Math.floor(Math.random() * this.ability.length)];
        let lootValue = 0;

        const ui = new UI();
        switch (lootType) {
            case 'health':
                lootValue = Math.floor(Math.random() * 50) + 50; // Random health between 50 and 100
                player.health = Math.min(player.health + lootValue, 100); // Ensure health does not exceed 100
                ui.updateHealth(player.health);
                break;
            case 'ammo':
                lootValue = Math.floor(Math.random() * 30) + 20; // Random ammo between 20 and 50
                player.ammo += lootValue;
                ui.updateAmmo(player.ammo);
                break;
            case 'damage':
                lootValue = Math.floor(Math.random() * 10) + 5; // Random damage between 5 and 15
                player.damage += lootValue; // Assuming player has a damage property
                ui.updateDamage(player.damage);
                break;
            case 'speed':
                lootValue = Math.random() * 0.2 + 0.1; // Random speed increase between 0.1 and 0.3
                player.moveSpeed += lootValue; // Assuming player has a moveSpeed property
                console.log(`Player received ${lootValue} speed increase. Current speed: ${player.moveSpeed}`);
                break;
        }
    }
}
