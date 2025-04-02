export class AudioManager {
    constructor() {
        this.sounds = {};
        this.masterVolume = 0.5;
        this.initialized = false;
    }

    init() {
        // Load all game sounds
        this.loadSound('gunshot', '../assets/audio/gunshot.mp3');
        this.loadSound('reload', '../assets/audio/reload.mp3');
        this.loadSound('empty', '../assets/audio/empty.mp3');
        
        // Zombie sounds
        this.loadSound('zombieGrowl', '../assets/audio/zombie_growl.mp3');
        this.loadSound('zombieAttack', '../assets/audio/zombie_attack.mp3');
        this.loadSound('zombieDeath', '../assets/audio/zombie_death.mp3');
        this.loadSound('a', '../assets/audio/zombie_death.mp3');
        
        // Player movement sounds
        this.loadSound('footstep', '../assets/audio/footstep.mp3');
        this.loadSound('footstepRun', '../assets/audio/footstep_run.mp3');
        this.loadSound('jump', '../assets/audio/jump.mp3');
        this.loadSound('land', '../assets/audio/land.mp3');

        // Environment sounds
        this.loadSound('environment', '../assets/audio/environment.mp3');

        this.initialized = true;
    }

    loadSound(name, url) {
        const audio = new Audio();
        audio.src = url;
        audio.volume = this.masterVolume;
        this.sounds[name] = audio;
    }

    play(soundName, options = {}) {
        if (!this.initialized) {
            console.warn('AudioManager not initialized');
            return;
        }

        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound "${soundName}" not found`);
            return;
        }
        
        // Clone the audio element for overlapping sounds
        const soundInstance = sound.cloneNode();
        
        // Apply options
        if (options.volume !== undefined) {
            soundInstance.volume = options.volume * this.masterVolume;
        }
        if (options.loop !== undefined) {
            soundInstance.loop = options.loop;
        }
        
        soundInstance.play().catch(error => {
            console.warn(`Failed to play sound "${soundName}":`, error);
        });
        
        return soundInstance;
    }

    stop(soundInstance) {
        if (soundInstance) {
            soundInstance.pause();
            soundInstance.currentTime = 0;
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Update volume of all loaded sounds
        for (const sound of Object.values(this.sounds)) {
            sound.volume = this.masterVolume;
        }
    }
}

// Create a singleton instance
const audioManager = new AudioManager();
export default audioManager;
