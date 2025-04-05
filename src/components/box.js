import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { UI } from '../ui/ui.js';

export class Box {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.model = null;
        this.ability = ['health', 'ammo', 'speed', 'bonus']; // Add more abilities as needed
        this.opened = false;
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
        if (!this.opened) { // Check if the box is already opened
            this.opened = true; // Set the flag to true
            this.scene.remove(this.model); // Remove the model from the scene
            this.spawnLoot(player); // Spawn loot after removing the box
            
            // Dispatch a custom event to notify that a box was opened
            const boxOpenedEvent = new CustomEvent('box-opened', {
                detail: { box: this }
            });
            window.dispatchEvent(boxOpenedEvent);
        }
    }

    spawnLoot(player) {
        const lootType = this.ability[Math.floor(Math.random() * this.ability.length)];
        let lootValue = 0;
        let announcementMessage = '';
    
        const ui = new UI();
        switch (lootType) {
            case 'health':
                lootValue = Math.floor(Math.random() * 50) + 50; // Random health between 50 and 100
                player.health = Math.min(player.health + lootValue, 100); // Ensure health does not exceed 100
                ui.updateHealth(player.health);
                announcementMessage = `You received ${lootValue} health!`;
                break;
            case 'ammo':
                lootValue = Math.floor(Math.random() * 6) + 5; // Random ammo between 5 and 10
                player.max_ammo += lootValue;
                ui.updateAmmo(player.ammo);
                announcementMessage = `You received ${lootValue} max ammo!`;
                break;
            case 'speed':
                lootValue = Math.random() * 0.2 + 0.1; // Random speed increase between 0.1 and 0.3
                player.moveSpeed += lootValue; // Assuming player has a moveSpeed property
                console.log(`Player received ${lootValue} speed increase. Current speed: ${player.moveSpeed}`);
                announcementMessage = `You received a speed boost of ${lootValue.toFixed(2)}!`;
                break;
            case 'bonus':
                if (player.hasBonusLoot) {
                // If player already has bonus loot, announce that they received it again
                announcementMessage = `You already have a score multiplier!`;
                }else{
                lootValue = 2;
                player.multiplier = lootValue;
                player.scoreDuration = 60;
                player.hasBonusLoot = true; 
                console.log(`Player received a bonus score multiplier of ${player.multiplier} for ${player.scoreDuration} seconds.`);
                announcementMessage = `You received a score multiplier of ${player.multiplier}!`;
                
                
                ui.updateDamage(player.scoreDuration);
                document.getElementById('bonus').style.display = 'block';
                
                let remainingTime = player.scoreDuration;
                const countdownInterval = setInterval(() => {
                    remainingTime--;
                    ui.updateDamage(remainingTime); // Update the displayed time
                    
                    if (remainingTime <= 0) {
                        clearInterval(countdownInterval); 
                        player.multiplier = 1; 
                        player.scoreDuration = 0; 
                        player.hasBonusLoot = false; 
                        document.getElementById('bonus').style.display = 'none';
                    }
                }, 1000); // Update every second
                break;
            }
        }
    
        this.announceBonus(announcementMessage);
    }
    
    announceBonus(message) {
        const announcementElement = document.getElementById('announcement');
        announcementElement.textContent = message;
        announcementElement.style.display = 'block';
    
        // Hide the announcement after a few seconds
        setTimeout(() => {
            announcementElement.style.display = 'none';
        }, 3000);
    }

    isOpen() {
        return this.opened;
    }
}
