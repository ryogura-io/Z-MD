const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'storage', 'config.json');

// Default configuration
const defaultConfig = {
    prefix: '!',
    phoneNumber: '2348153827918', // Bot's phone number for pairing
    ownerNumber: '2348153827918@s.whatsapp.net', // Owner's WhatsApp number
    admins: ['2348153827918@s.whatsapp.net'], // Will be populated with phone numbers
    allowedGroups: [], // If empty, bot works in all groups
    mediaDownloadLimit: 10 * 1024 * 1024, // 10MB limit
    commandCooldown: 2000, // 2 seconds
    settings: {
        autoWelcome: false,
        autoFarewell: false,
        deleteCommands: false,
        restrictToAdmins: false,
        mode: 'public', // 'public' or 'private'
        antiDelete: false,
        antiLink: false
    },
    reactions: {
        commands: {
            help: '❓',
            ping: '🏓',
            tts: '🔊',
            joke: '😂',
            fact: '🧠',
            quote: '💭',
            weather: '🌤️',
            define: '📖',
            lyrics: '🎵',
            movie: '🎬',
            anime: '🎌',
            sticker: '🎯',
            play: '▶️',
            download: '⬇️'
        },
        phoneNumbers: {} // Map phone numbers to specific emojis
    }
};

class Config {
    constructor() {
        this.config = this.loadConfig();
        this.cooldowns = new Map();
    }

    loadConfig() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const data = fs.readFileSync(CONFIG_FILE, 'utf8');
                return { ...defaultConfig, ...JSON.parse(data) };
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
        return { ...defaultConfig };
    }

    saveConfig() {
        try {
            const dir = path.dirname(CONFIG_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            return false;
        }
    }

    get(key) {
        return key ? this.config[key] : this.config;
    }

    set(key, value) {
        this.config[key] = value;
        return this.saveConfig();
    }

    updateSettings(settings) {
        this.config.settings = { ...this.config.settings, ...settings };
        return this.saveConfig();
    }

    addAdmin(phoneNumber) {
        if (!this.config.admins.includes(phoneNumber)) {
            this.config.admins.push(phoneNumber);
            return this.saveConfig();
        }
        return false;
    }

    removeAdmin(phoneNumber) {
        const index = this.config.admins.indexOf(phoneNumber);
        if (index > -1) {
            this.config.admins.splice(index, 1);
            return this.saveConfig();
        }
        return false;
    }

    isAdmin(phoneNumber) {
        return this.config.admins.includes(phoneNumber);
    }

    checkCooldown(userId, commandName) {
        const key = `${userId}-${commandName}`;
        const now = Date.now();
        const lastUsed = this.cooldowns.get(key);
        
        if (lastUsed && (now - lastUsed) < this.config.commandCooldown) {
            return false;
        }
        
        this.cooldowns.set(key, now);
        return true;
    }
}

module.exports = new Config();
